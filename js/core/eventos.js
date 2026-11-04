/*
  ESTÁNDAR DE EVENTOS
  Cada algoritmo, mientras ordena, registra una lista de eventos que
  describe todo lo que le pasa al arreglo. El reproductor no conoce los
  algoritmos: solo lee esta lista y la aplica sobre una copia del arreglo
  original para animar las barras.
 
    compare(i, j)        Se comparan las posiciones i y j. No modifica el arreglo.
    swap(i, j)           Se intercambian los valores de las posiciones i y j.
    overwrite(i, valor)  Se escribe 'valor' en la posición i (Insertion, Merge).
    done(i)              La posición i ya está en su lugar final.
 
  Ver docs/estandar-eventos.md para la explicación completa.
 */

// Usar estas constantes en lugar de escribir el texto a mano evita errores
// de dedo (el panel de métricas filtra por type)

export const TIPOS = Object.freeze({
  COMPARE: 'compare',
  SWAP: 'swap',
  OVERWRITE: 'overwrite',
  DONE: 'done',
});

export function compare(i, j) {
  return { type: TIPOS.COMPARE, i, j };
}

export function swap(i, j) {
  return { type: TIPOS.SWAP, i, j };
}

export function overwrite(i, valor) {
  return { type: TIPOS.OVERWRITE, i, valor };
}

export function done(i) {
  return { type: TIPOS.DONE, i };
}
