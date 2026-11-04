import { compare, swap, done } from '../core/eventos.js';

function stoogeSortRec(arr, l, h, eventos) {
    if (l >= h) {
        return;
    }

    if (eventos) eventos.push(compare(l, h));

    if (arr[l] > arr[h]) {
        if (eventos) eventos.push(swap(l, h));
        [arr[l], arr[h]] = [arr[h], arr[l]];
    }

    if (h - l + 1 > 2) {
        const t = Math.floor((h - l + 1) / 3);
        stoogeSortRec(arr, l, h - t, eventos);
        stoogeSortRec(arr, l + t, h, eventos);
        stoogeSortRec(arr, l, h - t, eventos);
    }
}

export function stoogeSort(lista, eventos = null) {
    const arr = [...lista];
    const n = arr.length;

    if (n > 0) {
        stoogeSortRec(arr, 0, n - 1, eventos);
    }

    for (let k = 0; k < n; k++) {
        if (eventos) eventos.push(done(k));
    }

    return arr;
}
