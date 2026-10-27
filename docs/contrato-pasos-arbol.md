# Contrato 1 — Pasos de construcción del árbol

Este contrato es el equivalente al estándar de eventos de VisuAlgoritmos. El algoritmo (Brayan) **produce** una lista de pasos y la animación (Andrés) **solo la lee**. Ninguno necesita conocer el código del otro.

## Forma de la lista

`construirArbol(frecuencias)` devuelve, además de la raíz, un arreglo `pasos` con dos tipos de objeto:

| Tipo | Objeto | Significado |
| --- | --- | --- |
| `hoja` | `{ tipo: 'hoja', id, simbolo, codePoint, frecuencia }` | Un carácter del texto, antes de cualquier fusión |
| `fusion` | `{ tipo: 'fusion', id, izquierdo, derecho, frecuencia }` | Se sacaron los dos nodos de menor frecuencia y se unieron en uno nuevo |

- `id`: entero que identifica al nodo. `izquierdo` y `derecho` son `id` de nodos que ya aparecieron antes en la lista.
- `simbolo`: el carácter como texto (`'a'`, `' '`, `'\n'`, `'ñ'`). `codePoint` es su número Unicode (`'a'` = 97).
- `frecuencia` de una fusión = frecuencia del izquierdo + frecuencia del derecho.

## Orden de la lista

1. Primero van **todas las hojas**, ordenadas por `codePoint` ascendente. Sus `id` son `0, 1, 2, … k−1`.
2. Después van las **fusiones**, en el orden exacto en que el algoritmo voraz las hizo. Sus `id` continúan: `k, k+1, …`.
3. La **última fusión es la raíz**. Con `k` símbolos distintos hay exactamente `k − 1` fusiones.

## Regla de desempate (obligatoria)

La misma regla la usan comprimir y descomprimir. Si cambia, los archivos `.hfmn` dejan de abrirse.

1. Se extraen siempre los dos nodos de **menor frecuencia** de la cola de prioridad.
2. Si dos nodos tienen la misma frecuencia, sale primero el de **menor `id`**. Es decir, la cola ordena por la pareja `(frecuencia, id)`.
3. El **primero** que sale es el `izquierdo` (bit `0`) y el **segundo** es el `derecho` (bit `1`).

En Python sería `heapq` con tuplas `(frecuencia, id)`: el `id` rompe los empates igual que el segundo elemento de la tupla.

## Casos borde

| Texto | Pasos | Comentario |
| --- | --- | --- |
| Vacío (`''`) | `[]` | No hay árbol; la animación muestra "texto vacío" |
| Un solo carácter distinto (`'aaaa'`) | Una hoja, cero fusiones | La raíz es la hoja; su código es `'0'` |

## Ejemplo completo: `abracadabra`

Frecuencias: a = 5, b = 2, c = 1, d = 1, r = 2. Archivo: `ejemplos/abracadabra-pasos.json`.

```json
[
  { "tipo": "hoja",   "id": 0, "simbolo": "a", "codePoint": 97,  "frecuencia": 5 },
  { "tipo": "hoja",   "id": 1, "simbolo": "b", "codePoint": 98,  "frecuencia": 2 },
  { "tipo": "hoja",   "id": 2, "simbolo": "c", "codePoint": 99,  "frecuencia": 1 },
  { "tipo": "hoja",   "id": 3, "simbolo": "d", "codePoint": 100, "frecuencia": 1 },
  { "tipo": "hoja",   "id": 4, "simbolo": "r", "codePoint": 114, "frecuencia": 2 },
  { "tipo": "fusion", "id": 5, "izquierdo": 2, "derecho": 3, "frecuencia": 2 },
  { "tipo": "fusion", "id": 6, "izquierdo": 1, "derecho": 4, "frecuencia": 4 },
  { "tipo": "fusion", "id": 7, "izquierdo": 5, "derecho": 6, "frecuencia": 6 },
  { "tipo": "fusion", "id": 8, "izquierdo": 0, "derecho": 7, "frecuencia": 11 }
]
```

Cómo se llegó a cada fusión, para revisar la regla de desempate:

| Paso | Cola antes `(frecuencia, id)` | Salen | Nuevo nodo |
| --- | --- | --- | --- |
| 5 | (1,2) (1,3) (2,1) (2,4) (5,0) | c(1,2) y d(1,3) | (2,5) |
| 6 | (2,1) (2,4) (2,5) (5,0) | b(2,1) y r(2,4); el 5 espera porque su id es mayor | (4,6) |
| 7 | (2,5) (4,6) (5,0) | (2,5) y (4,6) | (6,7) |
| 8 | (5,0) (6,7) | a(5,0) y (6,7) | (11,8) = raíz |

Códigos resultantes (`ejemplos/abracadabra-codigos.json`): a = `0`, c = `100`, d = `101`, b = `110`, r = `111`.

## Cómo la usa la animación

La animación no necesita el árbol, solo los pasos:

1. Dibuja un "bosque" con todas las hojas.
2. Por cada `fusion`, toma los nodos `izquierdo` y `derecho`, los quita del bosque y los pone como hijos de un nodo nuevo con la `frecuencia` indicada.
3. Al terminar queda un solo árbol: la raíz.

## Pruebas que debe pasar quien produzca los pasos

1. Hay `k` hojas y `k − 1` fusiones (o cero de todo si el texto está vacío).
2. Cada `izquierdo`/`derecho` existe antes en la lista y se usa una sola vez.
3. La frecuencia de la raíz es igual al número total de caracteres.
4. Para `abracadabra` el resultado es idéntico a `ejemplos/abracadabra-pasos.json`.
