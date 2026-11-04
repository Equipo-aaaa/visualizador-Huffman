import { compare, swap, done } from '../core/eventos.js';

function partition(arr, low, high, eventos) {
    let pivot = arr[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
        if (eventos) eventos.push(compare(j, high));

        if (arr[j] < pivot) {
            i++;
            if (i !== j) {
                if (eventos) eventos.push(swap(i, j));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        }
    }

    if (i + 1 !== high) {
        if (eventos) eventos.push(swap(i + 1, high));
        [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    }

    return i + 1;
}

function quickSortRec(arr, low, high, eventos) {
    if (low < high) {
        let pi = partition(arr, low, high, eventos);
        quickSortRec(arr, low, pi - 1, eventos);
        quickSortRec(arr, pi + 1, high, eventos);
    }
}

export function quickSort(lista, eventos = null) {
    const arr = [...lista];
    const n = arr.length;

    if (n > 0) {
        quickSortRec(arr, 0, n - 1, eventos);
    }

    for (let k = 0; k < n; k++) {
        if (eventos) eventos.push(done(k));
    }

    return arr;
}
