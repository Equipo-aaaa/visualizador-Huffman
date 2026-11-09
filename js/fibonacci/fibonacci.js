import { compare, overwrite, done } from '../core/eventos.js';

/*
Fibonacci con programación dinámica. Es el mismo algoritmo de Python, pero en
lugar de solo calcular, va anotando en `eventos` lo que hace para animarlo:

  compare(a, b)        lee las dos celdas que se van a sumar
  overwrite(i, valor)  guarda el resultado en F[i]
  done(i)              marca la respuesta final
*/
export function fibonacciDinamico(n, eventos = []) {
  const F = new Array(n + 1).fill(null);

  // Casos base: los únicos valores que no salen de una suma
  F[0] = 0;
  eventos.push(overwrite(0, 0));
  F[1] = 1;
  eventos.push(overwrite(1, 1));

  // Cada celda se calcula una sola vez, reutilizando las dos anteriores
  for (let i = 2; i <= n; i++) {
    eventos.push(compare(i - 2, i - 1));
    F[i] = F[i - 1] + F[i - 2];
    eventos.push(overwrite(i, F[i]));
  }

  eventos.push(done(n));
  return F[n];
}
