import { compare, swap, done } from '../core/eventos.js';

export function gnomeSort(lista, eventos = null) {
    const arr = [...lista];
    let i = 0;
    const n = arr.length;

    while (i < n) {
        if (i === 0) {
            i += 1;
        } else {
            if (eventos) eventos.push(compare(i - 1, i));

            if (arr[i] >= arr[i - 1]) {
                i += 1;
            } else {
                if (eventos) eventos.push(swap(i - 1, i));

                [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]];
                i -= 1;
            }
        }
    }


    for (let k = 0; k < n; k++) {
        if (eventos) eventos.push(done(k));
    }

    return arr;
}
