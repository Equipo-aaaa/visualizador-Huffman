// Orquesta huffman.html: consigue el texto, lo manda al worker y monta cada
// vista con el resultado. Los módulos no se conocen entre sí; aquí se conectan.
import { montarBuscador } from './gutenberg/buscador.js';
import { montarArbol } from './visualizador/arbolAnimado.js';
import { montarTablaCodigos } from './visualizador/tablaCodigos.js';
import { montarResumen } from './interfaz/resumen.js';

const textoActual = document.getElementById('textoActual');
const contenedorBuscador = document.getElementById('buscador');
const desplegableArbol = document.getElementById('desplegable-arbol');
const contenedorArbol = document.getElementById('arbol');
const contenedorTabla = document.getElementById('tabla-codigos');
const contenedorResumen = document.getElementById('resumen');

// new URL(...) calcula la ruta desde este archivo, no desde la página, para
// que funcione igual en Live Server y en Netlify.
const trabajador = new Worker(new URL('./trabajador.js', import.meta.url), { type: 'module' });

let resultadoActual = null;
let vistaArbol = null;
let vistaTabla = null;
let vistaResumen = null;

function mostrarError(mensaje) {
  textoActual.textContent = mensaje;
  textoActual.classList.replace('text-secondary', 'text-danger');
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

function mostrarResultado(resultado) {
  resultadoActual = resultado;

  if (vistaTabla) {
    vistaTabla.destruir();
  }
  vistaTabla = montarTablaCodigos(contenedorTabla, resultado.codigos);

  // destruir() libera el .hfmn anterior antes de montar el del nuevo libro
  if (vistaResumen) {
    vistaResumen.destruir();
  }
  vistaResumen = montarResumen(contenedorResumen, resultado);

  actualizarArbol();

  const { titulo, nombreArchivo } = resultado.metadatos;
  textoActual.textContent = titulo ?? nombreArchivo ?? 'Texto sin título';

  // El resultado está en la segunda pestaña: se abre para que se vea sin
  // buscarlo. bootstrap es global porque su script carga antes que este módulo.
  const pestana = document.getElementById('tab-compresion');
  bootstrap.Tab.getOrCreateInstance(pestana).show();
}

// Punto de entrada común: el buscador la llama tanto al elegir un libro de
// Gutenberg como al subir un .txt, así que aquí no importa de dónde vino.
function comprimirTexto(texto, metadatos) {
  textoActual.textContent = 'Comprimiendo...';
  textoActual.classList.replace('text-danger', 'text-secondary');
  trabajador.postMessage({ tipo: 'comprimir', texto, metadatos });
}

trabajador.onmessage = (evento) => {
  const mensaje = evento.data;

  if (mensaje.tipo === 'resultado') {
    mostrarResultado(mensaje.resultado);
  } else if (mensaje.tipo === 'error') {
    mostrarError(mensaje.mensaje);
  }
};

// onerror cubre lo que no pasa por el try del worker, como un import fallido
trabajador.onerror = () => mostrarError('No se pudo iniciar la compresión.');

desplegableArbol.addEventListener('toggle', actualizarArbol);

montarBuscador(contenedorBuscador, { alElegirTexto: comprimirTexto });
