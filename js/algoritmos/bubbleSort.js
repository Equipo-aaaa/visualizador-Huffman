import { compare, swap, done } from '../core/eventos.js';

export function bubbleSort(lista, eventos = null) {
    const arr = [...lista];
    const n = arr.length;

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - 1; j++) {
            if (eventos) eventos.push(compare(j, j + 1));
            if (arr[j] > arr[j + 1]) {
                if (eventos) eventos.push(swap(j, j + 1));
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
    }

    for (let k = 0; k < n; k++) {
        if (eventos) eventos.push(done(k));
    }

    return arr;
}
