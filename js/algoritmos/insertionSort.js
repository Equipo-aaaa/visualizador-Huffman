import { compare, overwrite, done } from '../core/eventos.js';

export function insertionSort(lista, eventos = null) {
  const arr = [...lista];
  for (let i = 1; i < arr.length; i++) {
    const clave = arr[i];
    let j = i - 1;

    while (j >= 0) {
      if (eventos) eventos.push(compare(j, j + 1));
      if (!(arr[j] > clave)) break;

      arr[j + 1] = arr[j];
      if (eventos) eventos.push(overwrite(j + 1, arr[j]));
      j--;
    }

    arr[j + 1] = clave;
    if (eventos) eventos.push(overwrite(j + 1, clave));
  }

  if (eventos) {
    for (let k = 0; k < arr.length; k++) eventos.push(done(k));
  }

  return arr;
}
