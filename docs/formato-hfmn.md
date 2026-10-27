# Contrato 2 — Formato de archivo `.hfmn` (versión 1)

El `.hfmn` es el archivo comprimido de este proyecto. Guarda **la tabla de frecuencias y los bits comprimidos**, así que se puede descomprimir por sí solo, en cualquier momento, sin el texto original.

Lo escribe y lo lee Brayan (`js/huffman/formatoHfmn.js`). Andrés lo muestra en el lector hexadecimal. Diego lo descarga y lo carga en la sección de descompresión.

## Reglas generales

- Todos los enteros van en **little-endian**: el byte menos significativo primero. Es lo que hace `DataView` con `true` como último argumento: `vista.setUint32(posicion, valor, true)`.
- Dentro de cada byte de datos, los bits van del **más significativo al menos significativo**. El primer bit del texto comprimido es el bit 7 del primer byte de datos.
- Los textos (metadatos) van en UTF-8.

## Estructura

`L` = longitud de los metadatos en bytes. `k` = número de símbolos distintos.

| Posición (byte) | Campo | Tamaño | Tipo | Contenido |
| --- | --- | --- | --- | --- |
| 0 | Firma | 4 | ASCII | `HFMN` → `48 46 4D 4E` |
| 4 | Versión | 1 | uint8 | `1` |
| 5 | Bits de relleno | 1 | uint8 | 0 a 7: bits en cero agregados al final del último byte |
| 6 | Longitud de metadatos (`L`) | 2 | uint16 | Bytes del campo siguiente |
| 8 | Metadatos | `L` | JSON UTF-8 | Objeto JSON; mínimo `{}` |
| 8 + L | Total de caracteres | 4 | uint32 | Caracteres del texto original |
| 12 + L | Símbolos distintos (`k`) | 4 | uint32 | Entradas de la tabla |
| 16 + L | Tabla | 8·k | k × (uint32, uint32) | Por símbolo: `codePoint` y `frecuencia`, en orden ascendente de `codePoint` |
| 16 + L + 8k | Datos | resto | bytes | Bits comprimidos, empaquetados |

Al descomprimir, el árbol se reconstruye con la tabla siguiendo la **misma regla de desempate** de `contrato-pasos-arbol.md`. Por eso la tabla va en orden de `codePoint`: así las hojas reciben los mismos `id` al comprimir y al descomprimir.

## Metadatos

Objeto JSON compacto (`JSON.stringify(objeto)`, sin espacios). Todos los campos son opcionales:

| Campo | Ejemplo | Para qué |
| --- | --- | --- |
| `titulo` | `"Don Quijote"` | Mostrarlo al cargar el archivo |
| `autor` | `"Cervantes Saavedra, Miguel de"` | Mostrarlo al cargar el archivo |
| `idGutenberg` | `2000` | Saber de qué libro vino |
| `origen` | `"gutenberg"` o `"local"` | Si se eligió en el buscador o se subió un `.txt` |
| `nombreArchivo` | `"abracadabra.txt"` | Nombre original del `.txt` subido |

## Zonas (para el lector hexadecimal)

`leerHfmn` devuelve las zonas del archivo para colorearlas. Cada zona es `{ nombre, inicio, fin }` con `fin` exclusivo (como `slice`):

`firma`, `version`, `relleno`, `longitudMetadatos`, `metadatos`, `totalCaracteres`, `simbolosDistintos`, `tabla`, `datos`.

## Validaciones al leer

Si alguna falla, `leerHfmn` lanza un `Error` con un mensaje en español y no devuelve nada a medias.

1. El archivo mide al menos 16 bytes.
2. La firma es `HFMN` ("El archivo no es un .hfmn").
3. La versión es `1` ("Versión de .hfmn no soportada").
4. Los bits de relleno están entre 0 y 7.
5. `L`, la tabla y los datos caben dentro del archivo.
6. Los metadatos son JSON válido.
7. La suma de las frecuencias de la tabla es igual al total de caracteres.

## Cómo se mide el tamaño (para el resumen)

| Medida | Cálculo |
| --- | --- |
| Original | Bytes del texto en UTF-8: `new TextEncoder().encode(texto).length` |
| Datos | Solo los bytes de la zona `datos` |
| Archivo `.hfmn` | Longitud total del archivo, con cabecera y tabla |
| Razón | `hfmn / original` |
| Ahorro | `1 − razon`, en porcentaje |

El resumen muestra **Original** y **Archivo `.hfmn`**. Es la comparación honesta, porque la tabla también ocupa espacio.

## Ejemplo completo: `abracadabra`

Archivo: `ejemplos/abracadabra.hfmn` (134 bytes). Metadatos: `{"titulo":"abracadabra","origen":"local","nombreArchivo":"abracadabra.txt"}` (L = 75 bytes).

| Posición | Bytes | Campo | Valor |
| --- | --- | --- | --- |
| 0 | `48 46 4D 4E` | Firma | `HFMN` |
| 4 | `01` | Versión | 1 |
| 5 | `01` | Bits de relleno | 1 |
| 6 | `4B 00` | Longitud de metadatos | 75 |
| 8 | `7B 22 … 7D` | Metadatos | el JSON de arriba |
| 83 | `0B 00 00 00` | Total de caracteres | 11 |
| 87 | `05 00 00 00` | Símbolos distintos | 5 |
| 91 | `61 00 00 00 05 00 00 00` | Tabla | a (97) × 5 |
| 99 | `62 00 00 00 02 00 00 00` | Tabla | b (98) × 2 |
| 107 | `63 00 00 00 01 00 00 00` | Tabla | c (99) × 1 |
| 115 | `64 00 00 00 01 00 00 00` | Tabla | d (100) × 1 |
| 123 | `72 00 00 00 02 00 00 00` | Tabla | r (114) × 2 |
| 131 | `6E 8A DC` | Datos | 23 bits + 1 de relleno |

Los datos, carácter por carácter, con los códigos a = `0`, b = `110`, c = `100`, d = `101`, r = `111`:

```
a  b   r   a  c   a  d   a  b   r   a  (relleno)
0  110 111 0  100 0  101 0  110 111 0  0
→ 01101110 10001010 11011100
→   6E       8A       DC
```

Con un texto tan corto el `.hfmn` (134 bytes) pesa más que el original (11 bytes), porque la cabecera y la tabla dominan. Con un libro completo la tabla es despreciable y se comprime de verdad. Vale la pena mencionarlo en la presentación.

## Casos borde

| Texto | Archivo |
| --- | --- |
| Vacío | Cabecera con `k = 0`, total 0, relleno 0 y sin datos |
| `aaaa` | Tabla con una entrada (a × 4); datos `00` (cuatro bits `0` + 4 de relleno) |
