import { compare, overwrite, done } from '../core/eventos.js';

function mergeSortRec(arr, ini, fin, eventos) {      // rango [ini, fin)
  if (fin - ini <= 1) return;
  const mid = ini + Math.floor((fin - ini) / 2);
  mergeSortRec(arr, ini, mid, eventos);
  mergeSortRec(arr, mid, fin, eventos);

  const izq = arr.slice(ini, mid);                   // = left_half
  const der = arr.slice(mid, fin);                   // = right_half
  let i = 0, j = 0, k = ini;

  while (i < izq.length && j < der.length) {
    if (eventos) eventos.push(compare(k, mid + j));
    const valor = izq[i] <= der[j] ? izq[i++] : der[j++];   // <= la hace estable
    arr[k] = valor;
    if (eventos) eventos.push(overwrite(k, valor));
    k++;
  }
  while (i < izq.length) { arr[k] = izq[i++]; if (eventos) eventos.push(overwrite(k, arr[k])); k++; }
  while (j < der.length) { arr[k] = der[j++]; if (eventos) eventos.push(overwrite(k, arr[k])); k++; }
}

export function mergeSort(lista, eventos = null) {
  const arr = [...lista];
  mergeSortRec(arr, 0, arr.length, eventos);
  if (eventos) for (let k = 0; k < arr.length; k++) eventos.push(done(k));
  return arr;
}