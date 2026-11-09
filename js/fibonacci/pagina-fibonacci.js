import { TIPOS } from '../core/eventos.js';
import { $ } from '../core/utilidades.js';
import { Reproductor } from '../visualizador/reproductor.js';
import { Celdas } from './celdas.js';
import { fibonacciDinamico } from './fibonacci.js';

/*
Página de Fibonacci. Igual que en el Visualizador, este archivo solo conecta
los controles con el Reproductor: el algoritmo genera los eventos y la clase
Celdas los dibuja.
*/

let eventosActuales = [];
let valoresActuales = [];
let nActual = 0;

function numero(n) {
  return n.toLocaleString('es-MX');
}

// Texto del paso actual. indice es cuántos eventos ya se aplicaron.
function describirPaso(indice) {
  if (indice === 0) return 'Presiona Iniciar para llenar la tabla.';

  const evento = eventosActuales[indice - 1];

  if (evento.type === TIPOS.COMPARE) {
    const i = evento.j + 1;
    return `F[${i}] = F[${evento.j}] + F[${evento.i}] = ${valoresActuales[evento.j]} + ${valoresActuales[evento.i]}`;
  }
  if (evento.type === TIPOS.OVERWRITE) {
    if (evento.i < 2) return `Caso base: F[${evento.i}] = ${evento.valor}`;
    return `F[${evento.i}] = F[${evento.i - 1}] + F[${evento.i - 2}] = ${evento.valor}`;
  }
  return `Resultado: F(${nActual}) = ${numero(valoresActuales[nActual])}`;
}

function actualizarMetricas(indice, total) {
  let sumas = 0;
  let celdasLlenas = 0;

  for (let k = 0; k < indice; k++) {
    const evento = eventosActuales[k];
    if (evento.type === TIPOS.OVERWRITE) {
      celdasLlenas++;
      if (evento.i >= 2) sumas++;
    }
  }

  $('mSumas').textContent = numero(sumas);
  $('mCeldas').textContent = `${celdasLlenas} / ${nActual + 1}`;
  $('mProgreso').textContent = `${indice} / ${total}`;
  $('formula').textContent = describirPaso(indice);

  // El resultado se muestra hasta que la tabla termina de llenarse
  const termino = total > 0 && indice === total;
  $('mResultado').textContent = termino ? numero(valoresActuales[nActual]) : '—';
}

const reproductor = new Reproductor(new Celdas($('tablaFib')), {
  velocidad: Number(document.querySelector('input[name="velocidad"]:checked').value),
  alAvanzar: actualizarMetricas,
  alTerminar: () => {
    ponerEstado('Tabla completa', 'text-bg-success');
    actualizarBotones();
  },
});

function ponerEstado(texto, claseBootstrap) {
  const badge = $('estado');
  badge.textContent = texto;
  badge.className = `badge rounded-pill ${claseBootstrap}`;
}

function actualizarBotones() {
  const corriendo = reproductor.enReproduccion;
  const empezado = reproductor.indice > 0;

  let texto = 'Iniciar';
  if (empezado) texto = 'Continuar';
  if (empezado && reproductor.terminado) texto = 'Repetir';
  $('btnPlayTxt').textContent = texto;

  $('btnPlay').disabled = corriendo;
  $('btnPausa').disabled = !corriendo;
  $('btnPaso').disabled = reproductor.terminado;
}

function prepararAnimacion() {
  nActual = Number($('valorN').value);
  $('valorNTxt').textContent = nActual;

  // Se calcula primero completo: describirPaso necesita los valores de cada celda
  eventosActuales = [];
  fibonacciDinamico(nActual, eventosActuales);
  valoresActuales = eventosActuales
    .filter((evento) => evento.type === TIPOS.OVERWRITE)
    .map((evento) => evento.valor);

  const textoSumas = nActual === 2 ? '1 suma' : `${nActual - 1} sumas`;
  $('subtitulo').textContent = `F(${nActual}) · ${nActual + 1} celdas · ${textoSumas}`;

  // Todas las celdas empiezan vacías; null se dibuja como "?"
  reproductor.cargar(new Array(nActual + 1).fill(null), eventosActuales);
  ponerEstado('Listo para ejecutar', 'text-bg-secondary');
  actualizarBotones();
}

function reproducir() {
  if (reproductor.terminado) reproductor.reiniciar();
  reproductor.reproducir();
  ponerEstado('Calculando…', 'text-bg-warning');
  actualizarBotones();
}

function pausar() {
  reproductor.pausar();
  ponerEstado('En pausa', 'text-bg-secondary');
  actualizarBotones();
}

function paso() {
  reproductor.pausar();
  reproductor.paso();
  if (!reproductor.terminado) ponerEstado('Paso a paso', 'text-bg-info');
  actualizarBotones();
}

function reiniciar() {
  reproductor.reiniciar();
  ponerEstado('Listo para ejecutar', 'text-bg-secondary');
  actualizarBotones();
}

$('valorN').addEventListener('input', prepararAnimacion);
$('btnPlay').addEventListener('click', reproducir);
$('btnPausa').addEventListener('click', pausar);
$('btnPaso').addEventListener('click', paso);
$('btnReiniciar').addEventListener('click', reiniciar);

for (const radio of document.querySelectorAll('input[name="velocidad"]')) {
  radio.addEventListener('change', (e) => reproductor.setVelocidad(Number(e.target.value)));
}

prepararAnimacion();
