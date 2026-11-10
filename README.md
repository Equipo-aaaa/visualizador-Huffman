## Nombre del proyecto:
VisuAlgoritmos - Compresión de libros con Huffman y Fibonacci con programación dinámica

Sitio publicado: [[URL de Netlify](https://visualizador-huffman.netlify.app/huffman.html)]
Repositorio: [[URL del repositorio](https://github.com/Equipo-aaaa/visualizador-Huffman)]
GitHub Project: [[URL del GitHub Project](https://github.com/Equipo-aaaa/visualizador-Huffman/projects)]
Backlog: [[URL del GitHub Project](https://github.com/orgs/Equipo-aaaa/projects/3)]

El sitio también incluye el Visualizador y el Comparador de ordenamientos de la entrega anterior, documentados en el repositorio [VisualizadorOrdenamientos](https://github.com/Equipo-aaaa/VisualizadorOrdenamientos).


## Integrantes:
+ Brayan Jaziel Navarro Ayala
+ José Andrés Flores Parra
+ Diego Antonio Espinosa Salinas
+ Daniel Alejandro Rodríguez González

## Descripción:
Esta entrega agrega dos páginas a VisuAlgoritmos:

**Compresión con Huffman:** busca un libro en Project Gutenberg (o recibe un `.txt` propio), lo comprime con el algoritmo de Huffman y anima la construcción de su árbol. Muestra la tabla de frecuencias y códigos y cuánto se ahorró, y genera un archivo comprimido con formato propio (`.hfmn`). Un inspector permite examinar la estructura de cualquier `.hfmn` sin el texto original, descomprimirlo, comprobar que el texto recuperado sea idéntico al original y descargarlo como `.txt`.

**Fibonacci con programación dinámica:** anima paso a paso cómo se llena la tabla de Fibonacci, mostrando qué dos valores se suman en cada paso y dónde se guarda el resultado.

Los algoritmos corren en el navegador. El sitio está publicado en Netlify, que además tiene dos funciones pequeñas para buscar y descargar los libros de Gutenberg.

## Objetivo:
**Huffman:** aplicar la técnica voraz para calcular las frecuencias de los caracteres de un texto, construir el árbol de Huffman, generar los códigos, codificar y decodificar el texto, y comparar el tamaño original contra el comprimido con libros reales.

**Fibonacci:** mostrar la idea de la programación dinámica: cada valor se calcula una sola vez, se guarda en una tabla y se reutiliza para calcular los siguientes, en lugar de repetir los mismos cálculos como en la versión recursiva.

## Algoritmos implementados:

1. Huffman (técnica voraz)       O(n + k log k)
Con n caracteres en el texto y k caracteres distintos.
   - **Frecuencias:** recorre el texto y cuenta cuántas veces aparece cada carácter. O(n)
   - **Árbol:** cada carácter es una hoja con su frecuencia. Con una cola de prioridad toma siempre los dos nodos de menor frecuencia y los une en uno nuevo cuya frecuencia es la suma. Esa es la decisión voraz: en cada paso une lo menos frecuente, sin volver atrás. Repite hasta que queda un solo nodo, la raíz. O(k log k)
   - **Códigos:** recorre el árbol desde la raíz; ir a la izquierda agrega un `0` y a la derecha un `1`. Los caracteres frecuentes quedan cerca de la raíz y reciben códigos cortos.
   - **Codificar:** reemplaza cada carácter por su código y empaqueta los bits en bytes. O(n)
   - **Decodificar:** lee bit por bit desde la raíz, baja a la izquierda o a la derecha y, al llegar a una hoja, escribe su carácter y vuelve a la raíz. O(n)

Ejemplo con `abracadabra` (11 caracteres): `a` aparece 5 veces y recibe el código `0`; `b` y `r` aparecen 2 veces y reciben `110` y `111`; `c` y `d` aparecen una vez y reciben `100` y `101`. El texto ocupa 23 bits en lugar de 88.

Cuando dos nodos tienen la misma frecuencia, se desempata por el orden en que se crearon. Así el árbol siempre sale igual y la animación coincide con lo que calcula el algoritmo.

2. Fibonacci con programación dinámica       O(n)
Guarda los casos base F[0] = 0 y F[1] = 1 en un arreglo y calcula cada celda sumando las dos anteriores: F[i] = F[i-1] + F[i-2]. Cada valor se calcula una vez y se reutiliza, así que F(n) necesita n - 1 sumas y un arreglo de n + 1 celdas (espacio O(n)).
La versión recursiva vuelve a calcular los mismos valores muchas veces y crece de forma exponencial, O(2^n): para F(30) hace 2,692,537 llamadas, contra 29 sumas de la versión dinámica.

El valor de n está limitado de 2 a 30 para que todas las celdas quepan en pantalla.

## Tecnologías usadas:
HTML, CSS y JavaScript (módulos ES, sin frameworks).
Bootstrap 5 y Bootstrap Icons para la interfaz.
SVG para dibujar y animar el árbol de Huffman.
Web Workers para comprimir y descomprimir sin congelar la página.
Netlify Functions para buscar y descargar los libros de Project Gutenberg, que no permite descargarlos directamente desde otra página (CORS).
Git y GitHub para control de versiones, y GitHub Projects para organizar las tareas.
Netlify para publicar el sitio.

## Cómo ejecutar el proyecto:
- Localmente:
El proyecto usa módulos de JavaScript (`import` / `export`), así que **no funciona abriendo el HTML con doble clic** (`file://`). Además, la búsqueda de libros necesita las funciones de Netlify, así que se usa la Netlify CLI:
1. Instalar [Node.js](https://nodejs.org) (versión LTS).
2. Instalar la Netlify CLI una sola vez: `npm install -g netlify-cli`
3. Abrir la carpeta del proyecto en VS Code y, en la terminal, correr `netlify dev`.
4. Abrir `http://localhost:8888/huffman.html` o `http://localhost:8888/fibonacci.html`.

Fibonacci también funciona con **Live Server**. En Huffman, con Live Server solo funcionan la carga de un `.txt` propio y la descompresión, no la búsqueda en Gutenberg.

- Sitio publicado (Netlify):
1. Acceder al enlace: [https://visualizador-huffman.netlify.app/huffman.html]

## Uso de la aplicación:
### Compresión con Huffman (`huffman.html`)

La página tiene tres pestañas:

1. **Elegir texto:** escribe un título o autor (por ejemplo "quijote") y presiona Buscar. Recorre los resultados con Anterior y Siguiente y elige un libro para descargarlo y comprimirlo. También puedes subir un `.txt` propio con el botón o arrastrándolo. Algunos libros de Gutenberg no tienen versión en texto plano; en ese caso aparece un aviso y hay que elegir otro.
2. **Compresión:**
   - **Resumen:** tamaño original y del `.hfmn` (en bytes y KB/MB), bytes ahorrados, porcentaje de reducción, razón de compresión y número de símbolos distintos. Tiene los botones Descargar .hfmn e Inspeccionar el .hfmn. Con textos muy cortos el `.hfmn` sale más grande que el original, porque también guarda la tabla de frecuencias.
   - **Árbol de Huffman:** al abrir el desplegable se anima su construcción, una unión por paso. Tiene Pausar, Reiniciar e Ir al final, y zoom con la rueda del mouse o los botones ＋, － y Ajustar; se mueve arrastrando.
   - **Frecuencias y códigos:** cada carácter con su frecuencia y su código binario.
3. **Inspector y descompresión:**
   - **Cargar un archivo .hfmn:** con el botón o arrastrándolo. El archivo que se acaba de comprimir también llega aquí. Si no es un `.hfmn` válido, se muestra el motivo.
   - **Inspector:** muestra la estructura del archivo **sin descomprimirlo**: nombre y extensión, versión del formato, tamaño original, tamaño comprimido, bytes ahorrados, porcentaje, razón, símbolos distintos, bits codificados y de relleno, metadatos (título, autor, origen y huella SHA-256) y los primeros bytes de datos en binario y hexadecimal. El tamaño original se calcula con la tabla de frecuencias, sin tener el texto.
   - **Archivo .hfmn por zonas:** pestaña Hexadecimal, con cada zona del archivo (firma, versión, relleno, metadatos, tabla y datos) de un color, y pestaña Bits, con el código de cada carácter alineado debajo de él (después de descomprimir).
   - **Frecuencias y códigos guardados** y **Árbol reconstruido:** la tabla que trae el archivo y el árbol que se arma con ella.
   - **Descomprimir:** es un paso explícito. Recupera el texto, lo muestra por páginas, comprueba su integridad y habilita **Descargar .txt**.

El panel izquierdo muestra el título del texto actual. La compresión corre en un Web Worker, así que la página sigue respondiendo aunque el libro pese varios MB.

El flujo completo es: buscar libro o subir `.txt` → comprimir (frecuencias, árbol y códigos) → medir → inspeccionar → descomprimir → verificar → descargar.

### Fibonacci con programación dinámica (`fibonacci.html`)

1. Elige el valor de n con el control deslizante (2 a 30).
2. Usa Iniciar, Pausar, Paso a paso y Reiniciar, y elige la velocidad (1x, 2x, 5x o Máx).
3. Colores de las celdas: gris = sin calcular, azul = calculada, amarillo = se suma, rojo = se escribe, verde = respuesta.
4. Arriba de la tabla se lee la operación de cada paso, por ejemplo `F[7] = F[6] + F[5] = 13`.
5. Las métricas muestran las sumas realizadas, las celdas llenas, los pasos y el resultado al terminar.

## Formato del archivo `.hfmn`:
Extensión propia del proyecto. Todos los enteros van en little-endian. La documentación completa, con un ejemplo byte por byte, está en [`docs/formato-hfmn.md`](docs/formato-hfmn.md).

| Posición | Campo | Tamaño | Contenido |
| --- | --- | --- | --- |
| 0 | Firma | 4 bytes | `HFMN`, identifica el formato |
| 4 | Versión | 1 byte | `1` |
| 5 | Bits de relleno | 1 byte | 0 a 7: bits en cero que completan el último byte, para saber dónde terminan los datos |
| 6 | Longitud de metadatos (L) | 2 bytes | Bytes del campo siguiente |
| 8 | Metadatos | L bytes | JSON con título, autor, id de Gutenberg, origen, nombre del archivo y huella SHA-256 |
| 8 + L | Total de caracteres | 4 bytes | Tamaño del texto original, en caracteres |
| 12 + L | Símbolos distintos (k) | 4 bytes | Entradas de la tabla |
| 16 + L | Tabla de frecuencias | 8·k bytes | Por símbolo: código Unicode y frecuencia, en orden ascendente |
| 16 + L + 8k | Datos | el resto | Bits comprimidos, empaquetados del bit más significativo al menos significativo |

Guarda la tabla de frecuencias y no los códigos: al descomprimir, el árbol se reconstruye con la misma regla de desempate, así que salen exactamente los mismos códigos. Con eso el archivo se descomprime solo, sin el `.txt` original.

## Comprobación de integridad:
Al comprimir, se calcula la huella **SHA-256** del texto original en UTF-8 y se guarda en los metadatos del `.hfmn`. Al descomprimir, se calcula la huella del texto recuperado y se compara con la guardada. Si un solo byte cambia, la huella sale completamente distinta. Así se puede verificar cualquier `.hfmn` aunque ya no se tenga el `.txt`.

Si el archivo se acaba de comprimir en la página, además se compara el texto recuperado **byte por byte** con el original. El resultado aparece en el inspector: "Integridad verificada", "No coincide" o "No verificable" para archivos sin huella, como `ejemplos/abracadabra.hfmn`.

## Pruebas:
**Pruebas automáticas** (`tests/pruebas-huffman.js`): corren en Node (`node tests/pruebas-huffman.js`) y en el navegador (`tests/pruebaHuffman.html`), con 140 pruebas aprobadas y 0 fallidas. Cubren texto vacío, un solo símbolo, todos iguales, acentos, ñ, emoji, saltos de línea `\r\n`, archivos `.hfmn` alterados o incompletos, `abracadabra` comparado byte por byte con el ejemplo del contrato y un libro real (*Pride and Prejudice*).

**Pruebas mínimas de la actividad:**

| Prueba | Entrada | Resultado |
| --- | --- | --- |
| 1. Texto pequeño | `abracadabra` (11 caracteres) | Frecuencias a = 5, b = 2, r = 2, c = 1, d = 1. Códigos a = `0`, b = `110`, r = `111`, c = `100`, d = `101`, revisados a mano con el árbol: 23 bits de datos + 1 de relleno (`6E 8A DC`) |
| 2. Libro de Project Gutenberg | *Don Quijote* (id 2000), buscado en la página | 2,225,777 → 1,213,548 bytes (45.5 %), 111 símbolos. Comprobamos que el número de bits (9,700,323) es el mínimo posible para esas frecuencias |
| 3. Integridad | *Pride and Prejudice* | Comprimir → descargar el `.hfmn` → cargarlo → descomprimir: la huella SHA-256 coincide, el texto es idéntico byte por byte y el `.txt` descargado es igual al original. Al cambiar un byte de los datos del `.hfmn`, el inspector marca que no coincide |
| 4. Archivo no usado durante el desarrollo | `.txt` nuevo con ñ, acentos, `¿`, `¡`, emoji y `\r\n` | Se comprime, se inspecciona y se recupera con integridad verificada |

Cada módulo tiene su página de prueba en `demos/`.

## Limitaciones conocidas:
- La función de Netlify solo descarga libros de hasta 6 MB y espera a Gutenberg un máximo de 8 segundos (errores 413 y 502).
- La búsqueda de gutenberg.org no indica qué libros tienen versión en `.txt`. Si se elige uno que no la tiene, aparece un aviso y hay que elegir otro.
- La búsqueda no da el total de resultados ni las descargas de cada libro, así que los resultados se recorren con Anterior y Siguiente.
- Con textos muy cortos el `.hfmn` es más grande que el original, porque la cabecera y la tabla pesan más que lo que se ahorra.
- La compresión trabaja por carácter. No aprovecha palabras o sílabas que se repiten, por eso el ahorro con libros ronda el 43-46 %.
- El árbol de un libro tiene cientos de nodos y al ajustarse se ve pequeño: hay que usar el zoom para recorrerlo.
- La huella SHA-256 solo se calcula en sitios con https o en `localhost`, como el sitio publicado y `netlify dev`. Los `.hfmn` creados antes de agregarla se descomprimen, pero su integridad no se puede verificar.
- Todo el texto se carga en la memoria del navegador, así que libros muy grandes pueden tardar en celulares.

## Resultados de la compresión:
Comprimimos 5 libros de Project Gutenberg de distintos tamaños:

| Libro | Original (bytes) | .hfmn (bytes) | Razón | Ahorro |
| --- | ---: | ---: | ---: | ---: |
| *Alice's Adventures in Wonderland* (L. Carroll) | 174,311 | 99,333 | 0.5699 | 43.0 % |
| *Frankenstein; or, The Modern Prometheus* (M. Shelley) | 448,885 | 252,369 | 0.5622 | 43.8 % |
| *Pride and Prejudice* (J. Austen) | 772,386 | 437,230 | 0.5661 | 43.4 % |
| *Dracula* (B. Stoker) | 890,348 | 503,122 | 0.5651 | 43.5 % |
| *Moby Dick; Or, The Whale* (H. Melville) | 1,276,315 | 722,264 | 0.5659 | 43.4 % |

La razón es el tamaño del `.hfmn` entre el original, y el ahorro es 1 menos la razón. Estos tamaños se midieron con el script de BR-10, sin la huella SHA-256; los `.hfmn` que genera la página pesan 76 bytes más por guardarla.

Observaciones:
- En los cinco libros, todos en inglés, el ahorro quedó entre 43 % y 44 %, sin importar el tamaño. Lo que define el ahorro es qué tan desiguales son las frecuencias de los caracteres, y en textos del mismo idioma son muy parecidas.
- *Don Quijote* (en español) pasó de 2,225,777 a 1,213,548 bytes, un ahorro de 45.5 %. Comprimirlo tarda unos 2 segundos y la página no se congela gracias al Web Worker.
- En el Quijote el espacio aparece más de 350 mil veces y recibe un código de 3 bits, mientras que los caracteres que aparecen una sola vez llegan a 21 bits. En promedio usa 4.47 bits por carácter, contra 8 de un byte.
- Con textos muy cortos no conviene: `abracadabra` pasó de 11 a 134 bytes, porque la cabecera y la tabla de frecuencias pesan más que lo que se ahorra.
- Al descomprimir cada `.hfmn` se recupera el texto completo, sin perder ningún carácter.

## Deployment:
Sitio publicado: [[URL de Netlify](https://visualizador-huffman.netlify.app/huffman.html)]

Netlify está conectado al repositorio y publica solo cada vez que se hace merge a `main`. El archivo `netlify.toml` redirige las rutas `/api/buscar` y `/api/libro` a las funciones.

## Organización del equipo:
Responsabilidades por integrante:

Daniel Alejandro Rodríguez González -   Repositorio, tablero y Netlify. Funciones de Gutenberg, buscador y carga de `.txt`, revisión y aprobación de PR.
Brayan Jaziel Navarro Ayala         -   Algoritmo de Huffman, formato del archivo `.hfmn`, pruebas y medición de los 5 libros
José Andrés Flores Parra            -   Animación del árbol con zoom, tabla de códigos y lectores de texto y del `.hfmn`
Diego Antonio Espinosa Salinas      -   Contratos entre módulos, página de Huffman, flujo de la aplicación, Web Worker, resumen, descompresión, integración y página de Fibonacci, revisión y aprobación de PR.

Metodología de trabajo:
Contratos: antes de programar acordamos por escrito qué datos se pasan entre las partes (los pasos del árbol, el formato `.hfmn` y las funciones de cada módulo), en los documentos de la carpeta `docs/`. Con datos de ejemplo de `abracadabra`, cada quien trabajó su parte sin esperar a los demás, como con el estándar de eventos de la entrega anterior.

GitHub: el repositorio vive en una organización y `main` está protegida. Cada tarea se trabajó en su propia rama con el ID de la tarea (por ejemplo `BR-03-construir-arbol`) y se integró con un Pull Request revisado antes del merge: una tarea, una rama, un PR.

GitHub Projects: cada tarea del backlog es una issue en el tablero "Huffman", con responsable, fecha, dependencias y criterio de terminado. Las issues pasan por Por hacer, En progreso, En revisión y Terminado, y el PR las cierra al aprobarse.

Sprints: Sprint 1 (página publicada, búsqueda de libros y un libro mostrando su tabla y su árbol), Sprint 2 (flujo completo: buscar, comprimir, descargar, cargar y descomprimir) y Cierre (limpieza, README y deploy final).

## Uso de IA:
Usamos Claude (Anthropic).

Cómo validamos lo que generó la IA: cada integrante revisó y probó su parte antes de abrir su PR (con su página de `demos/` o con `netlify dev`) y otro integrante la revisó antes del merge. El algoritmo se validó con las 140 pruebas automáticas, comparando contra los ejemplos del contrato byte por byte. Los resultados con libros reales se comprobaron con los números: que los códigos fueran óptimos, que el `.hfmn` descargado pesara lo que marca el resumen y que el texto recuperado tuviera la misma huella SHA-256 que el original.

### José Andrés Flores Parra

Lo que generó la IA:
Los módulos de mi capa: la tabla de códigos (tablaCodigos.js), el árbol animado con zoom y arrastre (arbolAnimado.js), el lector paginado del texto (lectorTexto.js), el lector del .hfmn con sus pestañas hexadecimal y de bits (lectorHfmn.js) y el paginador compartido (paginador.js), con sus estilos y páginas de demo. — Claude
La lógica del zoom, el desplazamiento y el ajuste del árbol, modificando el atributo viewBox del SVG. — Claude
La explicación del código paso a paso, comparándolo con Python. — Claude
Sugerencias de mejora durante mis pruebas, como ordenar la tabla por columnas, evitar que un emoji se parta entre dos páginas del lector y detener el temporizador de la animación al destruir el árbol. — Claude

Lo que hice yo:
Investigué cómo funcionaban las tecnologías de mi capa y con eso guié a la IA para adaptar el código a lo que necesitaba el proyecto.
Hice cambios directos al código propuesto para ajustarlo a la arquitectura y a los contratos del equipo, y decidí qué cambios aplicar.
Probé cada módulo con textos de más de 3 MB y árboles de más de 100 símbolos, y usé los resultados para mejorar el rendimiento.
Trabajé cada tarea en su propia rama (AN-01 a AN-07), ordené mis commits y di seguimiento a la revisión de mis Pull Requests.
Estudié a fondo la matemática del SVG y la lectura en hexadecimal para depurar e integrar las vistas, y comprobé que los colores coincidieran con las zonas del archivo .hfmn.

### Daniel Alejandro Rodríguez González

Lo que generó la IA:
Las dos Netlify Functions: buscar.mjs, que busca libros en el catálogo de gutenberg.org y lee su XML, y libro.mjs, que descarga el .txt con un límite de 6 MB (error 413) y un tiempo máximo de 8 segundos. — Claude
El cliente y el buscador (js/gutenberg/cliente.js y buscador.js), con resultados, paginación y carga de un .txt propio con botón o arrastrando, su CSS y su página de prueba. — Claude
El netlify.toml con la redirección de /api/*. — Claude
La explicación paso a paso de cada archivo, comparando con Python. — Claude

Lo que hice yo:
Creé el repositorio en la organización, protegí main y armé el tablero con las tareas del backlog.
Conecté el repositorio a Netlify, preparé mi entorno local (Netlify CLI y netlify dev) y vinculé el proyecto.
Seguí el flujo de una rama y un PR por tarea (DA-02 a DA-07) y revisé y aprobé los PR del equipo.
Probé cada función y el buscador en local y en las vistas previas de Netlify: errores 400, 404, 413 y 502, paginación y archivos que no son .txt.
Detecté con los logs de Netlify que Gutendex respondía 403 desde los servidores de Netlify y que a ratos estaba caído (503). Con eso decidimos cambiar a gutenberg.org; probé el cambio y avisé al equipo del cambio de contrato.
Hice público el sitio en Netlify y le cambié el nombre a visualizador-huffman.
Hice la prueba final del flujo completo en computadora, en incógnito y en celular.

### Brayan Jaziel Navarro Ayala

Lo que generó la IA:
Revisó y perfeccionó el código de mis módulos de BR-01 a BR-08 (frecuencias, cola de prioridad, árbol, códigos, codificador y formato .hfmn) y sus pruebas, ajustándolos al contrato del equipo: firmas de las funciones, formato del .hfmn y regla de desempate por id. — Claude
El archivo de pruebas automáticas (BR-09) y el script de medición de los cinco libros (BR-10). — Claude
La explicación de cada módulo paso a paso, comparándolo con Python: Map con dict, la cola de prioridad con heapq, DataView con struct y los operadores de bits. — Claude
La lógica de los puntos delicados: ordenar los códigos Unicode como números y no como texto, recorrer con for...of para que un emoji cuente como un solo carácter, escribir los bits directamente en los bytes, medir los metadatos en bytes y escribir los números en little-endian. — Claude
Mejoras como validar los códigos de carácter al leer un .hfmn alterado, lanzar un error en español cuando los datos están truncados, comparar contra los archivos de ejemplos/ byte a byte y comprobar que cada libro de BR-10 se recupere idéntico antes de reportar su resultado. — Claude

Lo que hice yo:
Armé la base del código de los módulos de BR-01 a BR-08, investigando en qué consistía cada tarea y haciendo una versión preliminar antes de verificarla.
Adapté el código a mi forma de trabajar: pedí que las pruebas usaran console.log y console.table, que la programación fuera sencilla y elegí los nombres de archivos como comprimirHuffman.js y medirLibros.js.
Ejecuté y verifiqué las pruebas de cada tarea en el navegador con Live Server y las de BR-09 también en Node, que instalé para eso. Revisé las consolas y compartí capturas para corregir lo que no coincidía.
Comprobé que las pruebas automáticas dan 140 aprobadas y 0 fallidas en Node y en el navegador. Cubren texto vacío, un símbolo, todos iguales, acentos, ñ, emoji, \r\n, abracadabra y un libro real (Pride and Prejudice).
Descargué de Project Gutenberg cinco libros de tamaños distintos para BR-10 y obtuve la tabla de resultados.
Trabajé cada tarea en su propia rama (BR-01 a BR-10), con su issue y su PR, guardé respaldos por tarea para seguir avanzando mientras se aprobaban los PR y atendí la revisión del equipo.

### Diego Antonio Espinosa Salinas

Lo que generó la IA:
Contratos y guía del equipo (docs/): la redacción de los tres contratos (pasos del árbol, formato .hfmn y módulos) a partir de las decisiones del equipo, y la guía que los explica en palabras simples. — Claude
Datos de ejemplo (ejemplos/abracadabra*): el texto, los pasos, los códigos, el resultado y el .hfmn de ejemplo, para que cada quien probara su parte sin esperar a los demás. — Claude
Contexto para la IA (CLAUDE.md): el archivo con las reglas del proyecto, para que el Claude de cada integrante trabajara con el mismo contexto. — Claude
Página de Huffman (huffman.html): la estructura con las tres pestañas y los contenedores de cada módulo, con el diseño de VisuAlgoritmos. — Claude
Flujo de la aplicación y Web Worker (js/pagina-principal.js y js/trabajador.js). — Claude
Resumen y descarga del .hfmn (js/interfaz/resumen.js) y carga del .hfmn para descomprimir (js/interfaz/descompresion.js), con sus demos. — Claude
Inspector y comprobación de integridad (js/interfaz/inspector.js, js/trabajador.js y la función inspeccionar): la vista de la estructura del .hfmn antes de descomprimirlo y la huella SHA-256 para verificar el texto recuperado. — Claude
Página de Fibonacci (fibonacci.html y js/fibonacci/): el algoritmo dinámico emitiendo eventos, el dibujo de las celdas y la conexión de los controles. — Claude
La explicación del código paso a paso, comparándolo con Python. — Claude

Realizado con IA solo como apoyo:
Investigación antes de dividir el trabajo: cómo obtener los libros de Gutenberg desde una página web, por qué el navegador no puede descargarlos directamente (CORS) y qué opciones había (Gutendex y funciones en un servidor). — Claude
Backlog: redacción de las tareas, sus dependencias y su criterio de terminado, y la reprogramación cuando cambió la fecha de entrega. — Claude
Verificación de resultados: comprobar que las tablas de códigos de Alicia y el Quijote fueran óptimas y que el .hfmn descargado coincidiera con el resumen. — Claude
Corrección de errores al integrar: una llave de más en la tabla de códigos, el botón "Ir al final" del árbol y el resumen con un texto vacío. — Claude
Fibonacci: propuestas de cómo mostrarlo en el sitio; elegí dejar solo la animación de la tabla. — Claude

Lo que hice yo:
Investigué cómo conectar Project Gutenberg con el sitio antes de decidir cómo dividir el trabajo, y con eso separé el proyecto en capas independientes: algoritmo, Gutenberg, visualización e interfaz.
Hice la distribución de tareas entre los cuatro integrantes, con sus fechas y dependencias, y definí qué datos de ejemplo necesitaba cada quien para empezar sin esperar a los demás.
Tomé las decisiones de diseño: integrar Huffman como tercera página del mismo sitio con el diseño de VisuAlgoritmos, organizarla en tres pestañas, poner el árbol en un desplegable, usar una extensión propia para el archivo comprimido, y en Fibonacci mostrar solo la animación de la tabla, sin gráfica.
Guié a la IA con las decisiones del equipo e hice cambios directos sobre el código propuesto para ajustarlo a la estructura del proyecto, por ejemplo dejar los estilos de la página en css/estilos.css junto con los de las otras páginas.
Preparé mi entorno para probar como en el sitio publicado: instalé Node.js y la Netlify CLI y probé con netlify dev las funciones de Gutenberg junto con mi página.
Revisé el documento de requisitos de la actividad contra lo que ya funcionaba, detecté que faltaban el inspector en dos pasos y la comprobación de integridad, y decidí cómo agregarlos sin cambiar la estructura del formato.
Revisé qué funcionaba y qué no al integrar cada parte, probando con libros reales (Alicia y Don Quijote), un .txt vacío, un id que no existe y archivos que no son .hfmn. Revisé la consola del navegador, ubiqué en qué archivo y botón estaba cada error y lo reporté a su responsable con los pasos para reproducirlo.
Comprobé los resultados con los datos: que el .hfmn descargado del Quijote pesara exactamente lo que marcaba el resumen (1,213,548 bytes), que sus primeros bytes fueran la firma HFMN y que al descomprimirlo se recuperara el texto.
Mantuve actualizada la documentación: actualicé CLAUDE.md y los contratos cuando cambió la estructura del sitio y cuando la búsqueda pasó de Gutendex a gutenberg.org.
Seguí el flujo de una rama y un PR por tarea (DI-01 a DI-08). Cuando una tarea dependía de algo que aún no estaba en main, avancé con los datos de ejemplo y dejé la issue abierta hasta poder probarla completa.
Programé Fibonacci en Python (dinámico y recursivo) como base y decidí cómo animarlo reutilizando el reproductor y el estándar de eventos de la entrega anterior.
Integré el trabajo de los cuatro integrantes en una sola página y revisé y entendí todo lo que generó la IA antes de subirlo.


## Aprendizajes y conclusiones (individuales)
**José Andrés Flores Parra:**
En lo personal, comprendí cómo funciona el algoritmo de Huffman, por qué es considerado una técnica voraz y en qué situaciones podemos encontrarlo. También entendí cómo permite optimizar el espacio de almacenamiento mediante la asignación de códigos de menor longitud a los símbolos más frecuentes. Al observar la animación del árbol, pude comprender de manera más visual cómo se construye, cómo los símbolos más frecuentes terminan con códigos más cortos y los menos comunes con códigos más largos.

Desde mi parte del proyecto, enfocada principalmente en el frontend, uno de mis aprendizajes más valiosos fue comprender la importancia de optimizar el rendimiento en el navegador. Descubrí que cargar un libro demasiado grande en el DOM o intentar renderizar un árbol con demasiados nodos puede provocar que la página se vuelva lenta o incluso deje de responder. Aprendí a identificar y resolver estos problemas mediante técnicas como la iteración y la manipulación del viewBox en gráficos SVG.

Por último, considero que también fue importante reforzar mis conocimientos de GitHub y acostumbrarme a trabajar en un proyecto que involucra un backend, así como utilizar tickets para organizar las tareas y dar seguimiento al desarrollo. Esto me permitió acercarme un poco más a una dinámica de trabajo en equipo similar a la que se utiliza en la industria del software y seguir desarrollando habilidades importantes para mi formación como ingeniero.

**Brayan Jaziel Navarro Ayala:**
Comprendí cómo funciona el algoritmo de Huffman y por qué es una técnica voraz: en cada paso se fusionan los dos nodos de menor frecuencia sin reconsiderar decisiones anteriores, y la cola de prioridad hace eficiente esa elección. Entendí que la regla de desempate (primero la frecuencia y luego el id) no es un detalle: comprimir y descomprimir deben construir exactamente el mismo árbol, o el archivo no se puede recuperar. También vi por qué ningún código es prefijo de otro: todos los símbolos son hojas del árbol, y eso permite decodificar bit por bit sin ambigüedad.

Aprendí a trabajar a nivel de bytes: empaquetar bits con desplazamientos, calcular los bits de relleno, escribir números en little-endian y validar un archivo antes de leerlo para que uno alterado falle con un error claro. Los resultados mostraron algo que no esperaba: con un texto muy corto el archivo crece (abracadabra pasa de 11 a 134 bytes por la cabecera y la tabla de frecuencias), pero en libros reales el ahorro ronda el 43 % sin importar el tamaño, porque depende de la distribución de los caracteres y no de la cantidad de texto.

Por último, aprendí el valor de probar bien. Comparar contra los ejemplos reales del contrato, cubrir casos borde y correr las pruebas en dos entornos (Node y navegador) detectó errores que a simple vista no se veían. En GitHub reforcé el trabajo con una rama y un ticket por tarea, y aprendí a manejar las dependencias entre tareas cuando una depende de otra que todavía no se aprueba. Esto me acercó a una dinámica de equipo parecida a la de la industria del software.

**Diego Antonio Espinosa Salinas:**
Aprendizajes: Con Huffman entendí qué significa que un algoritmo sea voraz: en cada paso une los dos nodos menos frecuentes sin volver atrás, y aun así el resultado es el mejor posible. Lo comprobé con las tablas de Alicia y el Quijote, donde el número de bits fue justo el mínimo para esas frecuencias. También vi que comprimir no siempre conviene: con un texto corto el archivo crece, porque la tabla pesa más que lo que se ahorra. Con Fibonacci, al animar la tabla, se nota la diferencia de la programación dinámica: cada valor se calcula una vez y se reutiliza, mientras que la versión recursiva repite millones de cálculos. En lo técnico aprendí a usar un Web Worker para que un libro de 2 MB no congelara la página y a trabajar con bytes y archivos en el navegador, y pude reutilizar el reproductor y el estándar de eventos de la entrega anterior para Fibonacci sin cambiarlos.

Conclusión: Mi parte en esta entrega fue sobre todo de organización e integración. Investigar primero cómo obtener los libros de Gutenberg me ayudó a dividir el proyecto en partes que no dependieran unas de otras, y escribir los contratos antes de programar hizo que cada quien avanzara por su cuenta con los datos de ejemplo. Aun así, las pruebas con libros reales encontraron cosas que los ejemplos no mostraban, como el botón "Ir al final" del árbol o el resumen con un texto vacío, y el cambio de Gutendex a gutenberg.org solo tocó una parte del contrato sin romper el resto. Me quedo con que probar el flujo completo, y no solo cada pieza, es lo que realmente dice si el proyecto funciona.

**Daniel Alejandro Rodríguez González:**
Con este proyecto entendí que Huffman es una técnica voraz que funciona porque en un texto real los caracteres no aparecen igual: el espacio salió más de 350 mil veces en el Quijote y quedó con un código de solo 3 bits, mientras que las letras raras llegaron a 12 o 13 bits. Uniendo siempre los dos nodos de menor frecuencia, el árbol acomoda solo esas diferencias y el Quijote pasó de 2.12 MB a 1.16 MB, un ahorro de 45.5 %, sin perder un solo carácter al descomprimir. También vi que comprimir no siempre conviene: "abracadabra" pasó de 11 bytes a 134, porque la cabecera y la tabla de frecuencias pesan más que el texto, así que Huffman sirve de verdad con textos grandes. De mi parte del proyecto aprendí que un algoritmo correcto no basta si no le llegan los datos: el navegador no puede descargar de Gutenberg por CORS, tuvimos que usar funciones en un servidor, y descubrí que un servicio externo como Gutendex puede bloquearte o caerse, por lo que hay que revisar los logs, probar en el entorno real y no solo en la compu, y tener los contratos claros para poder cambiar la fuente de datos sin romper nada al resto del equipo.

---
