import { compare, swap, done } from '../core/eventos.js';

export function selectionSort(lista, eventos = null) {
    const arr = [...lista];
    const n = arr.length;

    for (let i = 0; i < n - 1; i++) {
        let min_idx = i;
        for (let j = i + 1; j < n; j++) {
            if (eventos) eventos.push(compare(j, min_idx));
            if (arr[j] < arr[min_idx]) {
                min_idx = j;
            }
        }
        if (min_idx !== i) {
            if (eventos) eventos.push(swap(i, min_idx));
            [arr[i], arr[min_idx]] = [arr[min_idx], arr[i]];
        }
    }
    for (let k = 0; k < n; k++) {
        if (eventos) eventos.push(done(k));
    }

    return arr;
}
