// Orquesta huffman.html: consigue el texto, lo manda al worker y monta cada
// vista con el resultado. Los módulos no se conocen entre sí; aquí se conectan.
import { montarBuscador } from './gutenberg/buscador.js';
import { montarArbol } from './visualizador/arbolAnimado.js';
import { montarTablaCodigos } from './visualizador/tablaCodigos.js';
import { montarLectorTexto } from './visualizador/lectorTexto.js';
import { montarLectorHfmn } from './visualizador/lectorHfmn.js';
import { montarResumen } from './interfaz/resumen.js';
import { montarDescompresion } from './interfaz/descompresion.js';
import { montarInspector } from './interfaz/inspector.js';
import { nombreHfmn } from './interfaz/formatos.js';

const $ = (id) => document.getElementById(id);

const textoActual = $('textoActual');
const pestanaCompresion = $('tab-compresion');
const pestanaInspector = $('tab-lector');

// Sección 2: Compresión
const desplegableArbol = $('desplegable-arbol');
const contenedorArbol = $('arbol');
const contenedorTabla = $('tabla-codigos');
const contenedorResumen = $('resumen');

// Sección 3: Inspector y descompresión
const contenedorInspector = $('inspector');
const contenedorInspectorTabla = $('inspector-tabla');
const desplegableInspectorArbol = $('desplegable-inspector-arbol');
const contenedorInspectorArbol = $('inspector-arbol');
const contenedorLectorTexto = $('lector-texto');
const contenedorLectorHfmn = $('lector-hfmn');

// new URL(...) calcula la ruta desde este archivo, no desde la página, para
// que funcione igual en Live Server y en Netlify.
const trabajador = new Worker(new URL('./trabajador.js', import.meta.url), { type: 'module' });

// Operaciones enviadas al worker que todavía no responden. El worker atiende
// los mensajes en orden, así que la respuesta que llega siempre es de la
// primera de la lista. Funciona como una cola (collections.deque en Python).
const pendientes = [];

// Sección 2: el último texto comprimido
let resultadoActual = null;
let vistaArbol = null;
let vistaTabla = null;
let vistaResumen = null;

// Sección 3: el .hfmn que está en el inspector. Puede venir de comprimir o de
// cargar un archivo: { nombre, datos, original }, donde datos es la inspección
// (sin texto) y original es el texto que se comprimió, si se tiene.
let archivoActual = null;
let archivoEnVistas = null;
let archivoEnArbol = null;
let vistaInspector = null;
let vistaInspectorTabla = null;
let vistaInspectorArbol = null;
let vistaLectorTexto = null;
let vistaLectorHfmn = null;

// ---------------------------------------------------------------- Panel lateral

function mostrarError(mensaje) {
  textoActual.textContent = mensaje;
  textoActual.classList.replace('text-secondary', 'text-danger');
}

function mostrarCargando(mensaje) {
  textoActual.textContent = mensaje;
  textoActual.classList.replace('text-danger', 'text-secondary');
}

// Escribe en "Texto actual" el título de lo último que se abrió
let tituloActual = null;
function mostrarTitulo(metadatos, respaldo) {
  if (metadatos) tituloActual = metadatos.titulo ?? metadatos.nombreArchivo ?? respaldo ?? 'Texto sin título';
  textoActual.classList.replace('text-danger', 'text-secondary');
  textoActual.textContent = tituloActual ?? 'Todavía no eliges un texto.';
}

// ---------------------------------------------------------------- Sección 2

// El árbol solo se monta con el desplegable abierto: montarArbol inicia la
// animación al llamarse, y oculto no se vería ni podría medir su tamaño.
function actualizarArbol() {
  vistaArbol?.destruir();
  vistaArbol = null;

  if (desplegableArbol.open && resultadoActual) {
    vistaArbol = montarArbol(contenedorArbol, resultadoActual.pasos);
  }
}

function mostrarCompresion(resultado) {
  resultadoActual = resultado;

  vistaTabla?.destruir();
  vistaTabla = montarTablaCodigos(contenedorTabla, resultado.codigos);

  // destruir() libera el .hfmn anterior antes de montar el del nuevo resultado
  vistaResumen?.destruir();
  vistaResumen = montarResumen(contenedorResumen, resultado, {
    alInspeccionar: () => bootstrap.Tab.getOrCreateInstance(pestanaInspector).show(),
  });

  actualizarArbol();
  mostrarTitulo(resultado.metadatos);

  // El archivo recién creado pasa al inspector sin su texto, igual que si se
  // cargara desde la computadora: así el flujo es comprimir → inspeccionar →
  // descomprimir → verificar. Se conserva el original para compararlo.
  abrirEnInspector({
    nombre: nombreHfmn(resultado.metadatos),
    datos: { ...resultado, texto: null },
    original: resultado.texto,
  });

  // El resultado está en la segunda pestaña: se abre para que se vea sin
  // buscarlo. bootstrap es global porque su script carga antes que este módulo.
  bootstrap.Tab.getOrCreateInstance(pestanaCompresion).show();
}

// ---------------------------------------------------------------- Sección 3

function abrirEnInspector(archivo) {
  archivoActual = archivo;
  actualizarInspector();
}

const inspectorVisible = () => pestanaInspector.classList.contains('active');

// Las vistas del inspector se montan con su pestaña visible, para que puedan
// medir su ancho. Si ya muestran el archivo actual no se vuelven a montar, así
// no se pierde la página en la que iba el usuario.
function actualizarInspector() {
  if (!inspectorVisible() || !archivoActual) return;

  if (archivoEnVistas !== archivoActual) {
    vistaInspector?.destruir();
    vistaInspectorTabla?.destruir();
    vistaLectorHfmn?.destruir();
    vistaLectorTexto?.destruir();
    vistaLectorTexto = null;

    vistaInspector = montarInspector(contenedorInspector, archivoActual, { alDescomprimir: descomprimirActual });
    vistaInspectorTabla = montarTablaCodigos(contenedorInspectorTabla, archivoActual.datos.codigos);
    vistaLectorHfmn = montarLectorHfmn(contenedorLectorHfmn, archivoActual.datos);
    archivoEnVistas = archivoActual;
  }

  actualizarArbolInspector();
}

function actualizarArbolInspector() {
  if (!desplegableInspectorArbol.open || !archivoActual) {
    vistaInspectorArbol?.destruir();
    vistaInspectorArbol = null;
    archivoEnArbol = null;
    return;
  }
  // Ya muestra este archivo: no se reinicia la animación al volver a la pestaña
  if (archivoEnArbol === archivoActual) return;

  vistaInspectorArbol?.destruir();
  vistaInspectorArbol = montarArbol(contenedorInspectorArbol, archivoActual.datos.pasos);
  archivoEnArbol = archivoActual;
}

// La descompresión es un paso explícito: la pide el botón del inspector
function descomprimirActual() {
  const archivo = archivoActual;
  // Se manda una copia: los bytes originales siguen en uso en el lector
  // hexadecimal. El segundo argumento transfiere la copia en lugar de copiarla otra vez.
  const bytesHfmn = archivo.datos.bytesHfmn.slice();
  pendientes.push({ tipo: 'descomprimir', archivo });
  trabajador.postMessage(
    { tipo: 'descomprimir', bytesHfmn, textoOriginal: archivo.original ?? undefined },
    [bytesHfmn.buffer],
  );
}

function mostrarDescompresion(resultado, archivo) {
  // Si mientras tanto se abrió otro archivo, este resultado ya no se muestra
  if (archivo !== archivoActual || archivoEnVistas !== archivo) return;

  vistaInspector.mostrarDescompresion(resultado);

  vistaLectorTexto?.destruir();
  vistaLectorTexto = montarLectorTexto(contenedorLectorTexto, resultado.texto);

  // Ya con el texto, la pestaña Bits puede alinear cada código con su carácter
  vistaLectorHfmn?.destruir();
  vistaLectorHfmn = montarLectorHfmn(contenedorLectorHfmn, resultado);
}

// ---------------------------------------------------------------- Worker

// Punto de entrada común: el buscador la llama al elegir un libro o subir un .txt
function comprimirTexto(texto, metadatos) {
  mostrarCargando('Comprimiendo...');
  pendientes.push({ tipo: 'comprimir' });
  trabajador.postMessage({ tipo: 'comprimir', texto, metadatos });
}

function inspeccionarArchivo(bytesHfmn, nombre) {
  pendientes.push({ tipo: 'inspeccionar', nombre });
  // Se transfiere: la inspección devuelve los mismos bytes
  trabajador.postMessage({ tipo: 'inspeccionar', bytesHfmn }, [bytesHfmn.buffer]);
}

trabajador.onmessage = (evento) => {
  const mensaje = evento.data;
  const pendiente = pendientes.shift();

  if (mensaje.tipo === 'error') {
    if (pendiente.tipo === 'inspeccionar') {
      // Un .hfmn inválido se avisa junto al botón, que es donde se está mirando
      vistaDescompresion.mostrarEstado(`"${pendiente.nombre}" no se puede abrir: ${mensaje.mensaje}`, true);
    } else if (pendiente.tipo === 'descomprimir') {
      if (pendiente.archivo === archivoActual) vistaInspector?.mostrarError(mensaje.mensaje);
    } else {
      mostrarError(mensaje.mensaje);
    }
    return;
  }

  const resultado = mensaje.resultado;

  if (pendiente.tipo === 'comprimir') {
    mostrarCompresion(resultado);
  } else if (pendiente.tipo === 'inspeccionar') {
    vistaDescompresion.mostrarEstado(`Listo: "${pendiente.nombre}" está en el inspector. Revisa su estructura y presiona Descomprimir.`);
    mostrarTitulo(resultado.metadatos, pendiente.nombre);
    abrirEnInspector({ nombre: pendiente.nombre, datos: resultado, original: null });
  } else if (pendiente.tipo === 'descomprimir') {
    mostrarDescompresion(resultado, pendiente.archivo);
  }
};

// onerror cubre lo que no pasa por el try del worker, como un import fallido
trabajador.onerror = () => mostrarError('No se pudo iniciar la compresión.');

// ---------------------------------------------------------------- Eventos

desplegableArbol.addEventListener('toggle', actualizarArbol);
desplegableInspectorArbol.addEventListener('toggle', actualizarArbolInspector);

// Bootstrap lanza 'shown.bs.tab' cuando la pestaña ya terminó de mostrarse
pestanaInspector.addEventListener('shown.bs.tab', actualizarInspector);

montarBuscador($('buscador'), { alElegirTexto: comprimirTexto });

const vistaDescompresion = montarDescompresion($('cargar-hfmn'), {
  alCargarHfmn: inspeccionarArchivo,
});
