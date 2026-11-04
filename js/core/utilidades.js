/*
 Funciones pequeñas que usan las dos páginas
*/

/* Arreglo de 'n' enteros aleatorios entre 1 y 'máximo'*/
export function arregloAleatorio(n, maximo = 100) {
  const arr = [];
  for (let k = 0; k < n; k++) {
    arr.push(Math.floor(Math.random() * maximo) + 1);
  }
  return arr;
}

/* Atajo para document.getElementById. */
export function $(id) {
  return document.getElementById(id);
}

/* Tiempo en milisegundos con 4 decimales. null -> "-" (no se midió) */
export function formatoMs(ms) {
  if (ms === null || ms === undefined) return '-';
  return `${ms.toFixed(4)} ms`;
}