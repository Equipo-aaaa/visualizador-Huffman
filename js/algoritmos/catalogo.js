import { bubbleSort } from './bubbleSort.js';
import { selectionSort } from './selectionSort.js';
import { insertionSort } from './insertionSort.js';
import { mergeSort } from './mergeSort.js';
import { quickSort } from './quickSort.js';
import { gnomeSort } from './gnomeSort.js';
import { exchangeSort } from './exchangeSort.js';
import { stoogeSort } from './stoogeSort.js';

/* CATÁLOGO DE ALGORITMOS
  Campos:
    id          Identificador corto (se usa en el HTML)
    nombre      Texto visible
    descripcion Descripción corta bajo el nombre
    tiempo      Complejidad temporal promedio de ESTA implementación (texto).
    color       Color de su línea en la gráfica del comparador.
    maxN        Tamaño máximo permitido en el visualizador (Stooge genera
                cientos de miles de eventos con N grande).
    maxNComparador (opcional) Tamaño máximo que se mide en el comparador;
                arriba de eso su línea se corta. Sin él, no hay límite.
    ocultoPorDefecto (opcional) Si es true, su línea empieza desactivada
                en la gráfica (Stooge aplasta la escala de los demás).
    fn          La función (lista, eventos = null) => arreglo ordenado.
 
  Nota sobre Merge Sort: la versión del equipo mezcla "in situ" (recorre
  los elementos con swaps en lugar de usar un arreglo auxiliar). Eso ahorra
  memoria pero cada mezcla puede costar O(n²) desplazamientos, por eso su
  línea en el comparador no se ve como O(n log n).
 */
export const ALGORITMOS = [
  { id: 'bubble',    nombre: 'Bubble Sort',    descripcion: 'Intercambio adyacente',    tiempo: 'O(n²)',      color: '#60A5FA', maxN: 100, fn: bubbleSort },
  { id: 'selection', nombre: 'Selection Sort', descripcion: 'Mínimos sucesivos',        tiempo: 'O(n²)',      color: '#F97316', maxN: 100, fn: selectionSort },
  { id: 'insertion', nombre: 'Insertion Sort', descripcion: 'Inserción ordenada',       tiempo: 'O(n²)',      color: '#10B981', maxN: 100, fn: insertionSort },
  { id: 'exchange',  nombre: 'Exchange Sort',  descripcion: 'Compara con cada sucesor', tiempo: 'O(n²)',      color: '#EAB308', maxN: 100, fn: exchangeSort },
  { id: 'gnome',     nombre: 'Gnome Sort',     descripcion: 'Avanza y retrocede',       tiempo: 'O(n²)',      color: '#EC4899', maxN: 100, fn: gnomeSort },
  { id: 'merge',     nombre: 'Merge Sort',     descripcion: 'Divide y vencerás',        tiempo: 'O(n log n)', color: '#06B6D4', maxN: 100, fn: mergeSort },
  { id: 'quick',     nombre: 'Quick Sort',     descripcion: 'Partición con pivote',     tiempo: 'O(n log n)', color: '#6366F1', maxN: 100, fn: quickSort },
  { id: 'stooge',    nombre: 'Stooge Sort',    descripcion: 'Recursivo 2/3 traslape',   tiempo: 'O(n^2.71)',  color: '#F43F5E', maxN: 30, maxNComparador: 500, ocultoPorDefecto: true, fn: stoogeSort },
];

/* Devuelve el algoritmo con ese id (o undefined). */
export function buscarAlgoritmo(id) {
  return ALGORITMOS.find((a) => a.id === id);
}
