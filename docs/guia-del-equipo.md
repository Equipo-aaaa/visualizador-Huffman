# Guía del equipo — VisualizadorHuffman

Esta guía explica, en palabras simples, qué vamos a construir, cómo funciona Huffman y qué dice cada contrato. Léela antes de abrir los contratos: ellos tienen el detalle, aquí está la idea.

## 1. Qué vamos a construir

Una página web que comprime libros de Project Gutenberg con el algoritmo de Huffman y muestra cómo lo hace. Tiene tres secciones:

1. **Elegir texto.** Buscar un libro en Gutenberg o subir un `.txt` propio.
2. **Compresión.** Se comprime el texto y se muestra:
   - cuánto pesaba y cuánto pesa comprimido, con un botón para descargar el archivo comprimido;
   - el árbol de Huffman, que se construye animado al abrir un desplegable;
   - la tabla con el código binario de cada carácter.
3. **Lector y descompresión.** Se puede leer el texto original, ver el archivo comprimido byte por byte y cargar cualquier archivo comprimido para recuperar su texto.

El archivo comprimido tiene una extensión propia, `.hfmn`. Lleva dentro todo lo necesario para descomprimirse, así que se puede descargar hoy y abrir otro día.

Todo corre en el navegador, con HTML, CSS y JavaScript sin frameworks, igual que VisuAlgoritmos y con el mismo diseño. Lo único que corre en un servidor son dos funciones pequeñas en Netlify para buscar y descargar libros, porque Gutenberg no deja que otra página descargue sus archivos directamente.

## 2. Cómo funciona Huffman, con "abracadabra"

Huffman le da códigos cortos a los caracteres que más se repiten y códigos largos a los que casi no aparecen. Es un algoritmo voraz: en cada paso toma la mejor opción inmediata.

**Paso 1. Contar.** En "abracadabra" hay a = 5, b = 2, r = 2, c = 1 y d = 1.

**Paso 2. Fusionar.** Cada carácter empieza como un nodo suelto. Se toman los dos con menor frecuencia y se unen en un nodo nuevo cuya frecuencia es la suma. Se repite hasta que solo queda uno, la raíz:

| Paso | Se unen | Nuevo nodo |
| --- | --- | --- |
| 1 | c (1) y d (1) | 2 |
| 2 | b (2) y r (2) | 4 |
| 3 | el de 2 y el de 4 | 6 |
| 4 | a (5) y el de 6 | 11, la raíz |

Para sacar siempre los dos menores se usa una **cola de prioridad**, lo mismo que `heapq` en Python.

**Paso 3. Leer los códigos.** Desde la raíz, ir a la izquierda es un 0 y a la derecha un 1. El camino hasta cada carácter es su código: a = `0`, c = `100`, d = `101`, b = `110`, r = `111`. La "a", que es la más frecuente, quedó con un solo bit.

**Paso 4. Codificar.** Se reemplaza cada carácter por su código y los bits se juntan en bytes. "abracadabra" pasa de 11 caracteres a 23 bits, es decir, 3 bytes.

**Paso 5. Decodificar.** Con el mismo árbol, se leen los bits uno por uno bajando desde la raíz; al llegar a una hoja se escribe ese carácter y se vuelve a empezar desde la raíz.

## 3. Qué es un contrato y por qué los usamos

En VisuAlgoritmos, el estándar de eventos permitió que los algoritmos y la animación se programaran por separado y encajaran a la primera. Los contratos son lo mismo para este proyecto: acuerdos escritos sobre **qué datos se pasa cada parte** y **con qué forma**.

Si Brayan entrega los datos exactamente como dice el contrato y Andrés los lee exactamente como dice el contrato, ninguno necesita ver el código del otro. Por eso:

- Cada quien puede empezar hoy, sin esperar a los demás.
- Integrar es casi solo conectar piezas.
- **Un contrato no se cambia sin avisar.** Si algo no te cuadra, coméntalo en el grupo o en un PR que modifique primero el documento.

## 4. Los tres contratos, en pocas palabras

### `contrato-pasos-arbol.md` — cómo se describe la construcción del árbol

El algoritmo no le pasa el árbol a la animación: le pasa una **lista de pasos**, como la tabla de la sección 2. Hay dos tipos de paso:

- **hoja:** un carácter con su frecuencia. Van primero todas, ordenadas por su número Unicode.
- **fusión:** qué dos nodos se unieron y la frecuencia del nuevo.

La animación solo recorre la lista: dibuja las hojas y luego aplica cada fusión. Es la misma idea que los eventos `compare` y `swap` de VisuAlgoritmos.

La parte más importante es la **regla de desempate**. Cuando dos nodos tienen la misma frecuencia (como b y r, ambos con 2), siempre sale primero el que tiene el número de nodo menor. Esto no es un detalle: si comprimir y descomprimir desempatan distinto, arman árboles distintos y el archivo no se puede abrir.

Lo producen: Brayan. Lo usan: Andrés (animación) y el propio Brayan (al descomprimir).

### `formato-hfmn.md` — qué hay dentro del archivo comprimido

Describe byte por byte el archivo `.hfmn`. En orden lleva:

1. Una firma (`HFMN`) para reconocer que es nuestro archivo.
2. La versión y cuántos bits de relleno tiene el último byte.
3. Datos del libro (título, autor), en JSON.
4. La tabla de frecuencias, para reconstruir el árbol al descomprimir.
5. Los bits comprimidos.

También dice qué revisar al abrir un archivo (por ejemplo, que la firma sea correcta) y cómo medir los tamaños que se muestran en pantalla. Incluye "abracadabra" desglosado byte por byte.

Un dato para la presentación: con un texto tan corto el archivo comprimido pesa más que el original (134 bytes contra 11), porque la cabecera y la tabla ocupan espacio. Con un libro completo esa parte es mínima y sí se nota la compresión.

Lo escribe y lee: Brayan. Lo muestra: Andrés (lector hexadecimal). Lo descarga y carga: Diego.

### `contrato-modulos.md` — qué función hace cada quien

Es la lista de funciones que exporta cada integrante: su nombre, qué recibe y qué devuelve. Con esto, quien usa una función sabe exactamente cómo llamarla aunque todavía no exista.

Puntos clave:

- **`ResultadoHuffman`** es el objeto central. Es lo que devuelven tanto comprimir como descomprimir, y lo que reciben las vistas de Andrés. Lleva el texto, las frecuencias, los pasos, los códigos, el archivo y los tamaños.
- **Las vistas se "montan" en un contenedor.** Cada módulo visual tiene una función `montar…` que recibe un `<div>` de la página y dibuja solo dentro de él. Así nadie toca el HTML de otro.
- **Las funciones de Gutenberg** (`/api/buscar` y `/api/libro`) tienen definido qué responden, incluidos los errores.
- **El Web Worker** comprime en segundo plano para que la página no se congele con un libro grande. El contrato fija qué mensajes se manda con la página.

## 5. Qué leer según tu parte

| Integrante | Lee con calma | Basta con hojear | Primera tarea |
| --- | --- | --- | --- |
| Brayan | Pasos del árbol y formato `.hfmn` completos; sección "Algoritmo" de módulos | El resto de módulos | BR-01, contar frecuencias |
| Andrés | Pasos del árbol; sección "Visualización" de módulos; "Zonas" del formato | El resto del formato | AN-01, lector de texto |
| Daniel | Sección "Gutenberg" de módulos | Pasos del árbol y formato | DA-01 y DA-02, repo y Netlify |
| Diego | Los tres completos, porque integra todo | — | DI-01 y DI-02, subir contratos y contexto |

## 6. Los datos de ejemplo

La carpeta `ejemplos/` tiene "abracadabra" resuelto de principio a fin. Sirve para dos cosas: comprobar que tu parte da el resultado correcto y trabajar sin esperar a otros.

| Archivo | Qué es | Quién lo usa |
| --- | --- | --- |
| `abracadabra.txt` | El texto original | Pruebas de todos |
| `abracadabra-pasos.json` | La lista de pasos | Andrés para animar; Brayan para comprobar su árbol |
| `abracadabra-codigos.json` | La tabla de códigos | Andrés para la tabla; Brayan para comprobar sus códigos |
| `abracadabra-resultado.json` | El `ResultadoHuffman` completo, salvo el archivo | Andrés y Diego para montar sus vistas |
| `abracadabra.hfmn` | El archivo comprimido real | Brayan para comprobar que escribe igual; Andrés para el lector hexadecimal |

Por ejemplo, Andrés puede dibujar el árbol hoy mismo con `abracadabra-pasos.json`, aunque Brayan todavía no programe nada. Cuando el algoritmo esté listo, el resultado tiene que ser idéntico al ejemplo.

## 7. Cómo trabajamos

- **Una tarea, una rama, un PR.** La rama lleva el ID de la tarea, por ejemplo `BR-01-frecuencias`. Así cada PR es pequeño y fácil de revisar.
- **En GitHub Desktop:**
  1. Ponte en `main` y presiona *Fetch origin* y luego *Pull origin*.
  2. *Current branch → New branch*, con el ID de tu tarea.
  3. Programa y prueba.
  4. Escribe el resumen, presiona *Commit*, luego *Publish branch* y *Create Pull Request*.
  5. En el PR escribe `Closes #n` con el número de tu issue, para que se cierre sola al integrarse.
- **En el tablero,** mueve tu issue a *En progreso* al empezar y a *En revisión* al abrir el PR. El orden de tus tareas lo da la fecha de cada una y su "Depende de".
- **Cada módulo visual tiene su demo** en `demos/`: una página que lo muestra con los datos de ejemplo. Es lo que Daniel abre para revisar tu PR.
- **Para probar en tu computadora** usa Live Server de VS Code; con doble clic en el HTML los módulos de JavaScript no funcionan.
- **Trabaja solo en tus carpetas.** Si necesitas algo de otra parte, usa el contrato o los ejemplos.
- **Si usas Claude,** carga el `CLAUDE.md` del repo y los tres contratos en tu proyecto. Así te sugiere lo mismo que a los demás.

## 8. Términos que vas a ver

| Término | Qué significa |
| --- | --- |
| Cola de prioridad | Estructura que siempre te da el elemento menor; en Python, `heapq` |
| Nodo hoja | Nodo del árbol que es un carácter; no tiene hijos |
| Code point | El número Unicode de un carácter; en Python, `ord('a')` da 97 |
| Bits de relleno | Ceros que se agregan al final para completar el último byte |
| Little-endian | Forma de guardar números de varios bytes: el byte menos significativo va primero |
| Web Worker | Código de JavaScript que corre en segundo plano sin congelar la página |
| Netlify Function | Función pequeña que corre en el servidor de Netlify cuando la página la llama |
| CORS | Regla del navegador que impide que una página descargue archivos de otro sitio sin permiso |

Si algo de los contratos no queda claro, pregúntale a Diego antes de programar: es más fácil aclararlo ahora que corregirlo en la integración.
