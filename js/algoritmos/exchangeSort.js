import { compare, swap, done } from '../core/eventos.js';

export function exchangeSort(lista, eventos = null) {
    const arr = [...lista];
    const n = arr.length;

    for (let i = 0; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
            if (eventos) eventos.push(compare(i, j));

            if (arr[j] < arr[i]) {
                if (eventos) eventos.push(swap(i, j));

                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        }
    }

    for (let k = 0; k < n; k++) {
        if (eventos) eventos.push(done(k));
    }

    return arr;
}
