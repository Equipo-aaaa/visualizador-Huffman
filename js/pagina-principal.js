// Orquesta huffman.html: consigue el texto, lo manda al worker y monta cada
// vista con el resultado. Los módulos no se conocen entre sí; aquí se conectan.
import { montarBuscador } from './gutenberg/buscador.js';
import { montarArbol } from './visualizador/arbolAnimado.js';
import { montarTablaCodigos } from './visualizador/tablaCodigos.js';
import { montarLectorTexto } from './visualizador/lectorTexto.js';
import { montarLectorHfmn } from './visualizador/lectorHfmn.js';
import { montarResumen } from './interfaz/resumen.js';
import { montarDescompresion } from './interfaz/descompresion.js';

const textoActual = document.getElementById('textoActual');
const contenedorBuscador = document.getElementById('buscador');
const desplegableArbol = document.getElementById('desplegable-arbol');
const contenedorArbol = document.getElementById('arbol');
const contenedorTabla = document.getElementById('tabla-codigos');
const contenedorResumen = document.getElementById('resumen');
const contenedorCargarHfmn = document.getElementById('cargar-hfmn');
const contenedorLectorTexto = document.getElementById('lector-texto');
const contenedorLectorHfmn = document.getElementById('lector-hfmn');
const pestanaCompresion = document.getElementById('tab-compresion');
const pestanaLector = document.getElementById('tab-lector');

// new URL(...) calcula la ruta desde este archivo, no desde la página, para
// que funcione igual en Live Server y en Netlify.
const trabajador = new Worker(new URL('./trabajador.js', import.meta.url), { type: 'module' });

// Operaciones enviadas al worker que todavía no responden. El worker atiende
// los mensajes en orden, así que la respuesta que llega siempre es de la
// primera de la lista. Funciona como una cola (collections.deque en Python).
const pendientes = [];

let resultadoActual = null;
let resultadoEnLectores = null;
let vistaArbol = null;
let vistaTabla = null;
let vistaResumen = null;
let vistaLectorTexto = null;
let vistaLectorHfmn = null;

function mostrarError(mensaje) {
  textoActual.textContent = mensaje;
  textoActual.classList.replace('text-secondary', 'text-danger');
}

function mostrarCargando(mensaje) {
  textoActual.textContent = mensaje;
  textoActual.classList.replace('text-danger', 'text-secondary');
}

// Muestra el título del resultado que está en pantalla, o el texto inicial si
// todavía no hay ninguno. Devuelve el nombre para reutilizarlo en mensajes.
function mostrarTitulo() {
  textoActual.classList.replace('text-danger', 'text-secondary');

  if (!resultadoActual) {
    textoActual.textContent = 'Todavía no eliges un texto.';
    return null;
  }

  const { titulo, nombreArchivo } = resultadoActual.metadatos;
  const nombre = titulo ?? nombreArchivo ?? 'Texto sin título';
  textoActual.textContent = nombre;
  return nombre;
}

function quitarArbol() {
  if (vistaArbol) {
    vistaArbol.destruir();
    vistaArbol = null;
  }
}

// El árbol solo se monta con el desplegable abierto: montarArbol inicia la
// animación al llamarse, y oculto no se vería ni podría medir su tamaño.
function actualizarArbol() {
  quitarArbol();

  if (desplegableArbol.open && resultadoActual) {
    vistaArbol = montarArbol(contenedorArbol, resultadoActual.pasos);
  }
}

// Igual que el árbol, los lectores se montan con su pestaña visible, para que
// puedan medir su ancho al paginar. Si ya muestran el resultado actual no se
// vuelven a montar, así no se pierde la página en la que iba el usuario.
function actualizarLectores() {
  const pestanaVisible = pestanaLector.classList.contains('active');

  if (!pestanaVisible || !resultadoActual || resultadoEnLectores === resultadoActual) {
    return;
  }

  vistaLectorTexto?.destruir();
  vistaLectorHfmn?.destruir();
  vistaLectorTexto = montarLectorTexto(contenedorLectorTexto, resultadoActual.texto);
  vistaLectorHfmn = montarLectorHfmn(contenedorLectorHfmn, resultadoActual);
  resultadoEnLectores = resultadoActual;
}

// comprimir y descomprimir devuelven la misma forma (ResultadoHuffman), así
// que las dos operaciones actualizan las mismas vistas.
function mostrarResultado(resultado, operacion) {
  resultadoActual = resultado;

  vistaTabla?.destruir();
  vistaTabla = montarTablaCodigos(contenedorTabla, resultado.codigos);

  // destruir() libera el .hfmn anterior antes de montar el del nuevo resultado
  vistaResumen?.destruir();
  vistaResumen = montarResumen(contenedorResumen, resultado);

  actualizarArbol();
  actualizarLectores();

  const nombre = mostrarTitulo();

  if (operacion === 'descomprimir') {
    // El usuario sigue en la sección 3, donde los lectores ya se actualizaron
    vistaDescompresion.mostrarEstado(`Listo: se recuperó "${nombre}".`);
    vistaDescompresion.mostrarDescarga(resultado.texto, nombre);
  } else {
    // El resultado está en la segunda pestaña: se abre para que se vea sin
    // buscarlo. bootstrap es global porque su script carga antes que este módulo.
    bootstrap.Tab.getOrCreateInstance(pestanaCompresion).show();
  }
}

// Punto de entrada común: el buscador la llama al elegir un libro o subir un .txt
function comprimirTexto(texto, metadatos) {
  mostrarCargando('Comprimiendo...');
  pendientes.push('comprimir');
  trabajador.postMessage({ tipo: 'comprimir', texto, metadatos });
}

function descomprimirArchivo(bytesHfmn) {
  mostrarCargando('Descomprimiendo...');
  pendientes.push('descomprimir');
  // El segundo argumento transfiere los bytes al worker en lugar de copiarlos:
  // es más rápido con un libro de 1 MB. La página ya no los usa después.
  trabajador.postMessage({ tipo: 'descomprimir', bytesHfmn }, [bytesHfmn.buffer]);
}

trabajador.onmessage = (evento) => {
  const mensaje = evento.data;
  const operacion = pendientes.shift();

  if (mensaje.tipo === 'resultado') {
    mostrarResultado(mensaje.resultado, operacion);
  } else if (mensaje.tipo === 'error') {
    if (operacion === 'descomprimir') {
      // Un .hfmn inválido se avisa junto al botón, que es donde se está mirando.
      // Las vistas siguen mostrando el resultado anterior, así que se regresa su título.
      vistaDescompresion.mostrarEstado(`No se pudo descomprimir: ${mensaje.mensaje}`, true);
      mostrarTitulo();
    } else {
      mostrarError(mensaje.mensaje);
    }
  }
};

// onerror cubre lo que no pasa por el try del worker, como un import fallido
trabajador.onerror = () => mostrarError('No se pudo iniciar la compresión.');

desplegableArbol.addEventListener('toggle', actualizarArbol);

// Bootstrap lanza 'shown.bs.tab' cuando la pestaña ya terminó de mostrarse
pestanaLector.addEventListener('shown.bs.tab', actualizarLectores);

montarBuscador(contenedorBuscador, { alElegirTexto: comprimirTexto });

const vistaDescompresion = montarDescompresion(contenedorCargarHfmn, {
  alCargarHfmn: descomprimirArchivo,
});
