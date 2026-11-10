# VisualizadorHuffman — contexto para Claude

Este archivo describe el proyecto para que el Claude de cada integrante trabaje con el mismo contexto. Si lo usas en claude.ai, pégalo en las instrucciones de tu proyecto y sube también los archivos de `docs/`. Claude Code lo lee solo.

## Qué es

Sitio web con **tres páginas**: Visualizador y Comparador de ordenamientos, que vienen de VisuAlgoritmos, y **Huffman**, que visualiza ese algoritmo (técnica voraz) comprimiendo libros de Project Gutenberg. Es una actividad de Análisis de Algoritmos (CUCEI, UdeG, 2026B) hecha por un equipo de 4.

Objetivo de la actividad de Huffman: calcular frecuencias de caracteres, construir el árbol de Huffman con la técnica voraz, generar los códigos, codificar y decodificar, y comparar el tamaño original contra el comprimido.

## Repositorio y calendario

- Repositorio: `Equipo-aaaa/VisualizadorHuffman`. Contiene todo el sitio, incluidas las páginas y el código de VisuAlgoritmos.
- `VisualizadorOrdenamientos` queda como el repositorio de la entrega anterior: no se sigue trabajando ahí.
- Tablero: "Huffman" en GitHub Projects, con una issue por tarea del backlog.

La entrega es el **lunes 2 de noviembre de 2026**; el trabajo termina el domingo 1.

| Etapa | Fechas | Al cerrar |
| --- | --- | --- |
| Sprint 1 | mar 27 al jue 29 oct | Página publicada con el diseño; búsqueda y descarga de libros funcionando; un libro real muestra su tabla de códigos y su árbol |
| Sprint 2 | vie 30 al sáb 31 oct | Flujo completo en la URL pública: buscar, comprimir, descargar, cargar y descomprimir |
| Cierre | dom 1 nov | Limpieza, README con resultados y deploy final |

Las tareas se identifican con las iniciales del responsable y un número: `DI` Diego, `DA` Daniel, `BR` Brayan, `AN` Andrés y `TO` todos (por ejemplo, `BR-03`). El número sigue el orden de trabajo de cada integrante, pero lo que manda es la fecha de cada issue y su "Depende de": una tarea no se empieza hasta que las que necesita estén en `main`.

## Qué hace el sitio

Las tres páginas comparten encabezado, diseño y un menú con tres botones: Visualizador (`index.html`), Comparador (`comparador.html`) y Huffman (`huffman.html`).

`huffman.html` organiza su contenido en tres pestañas:

1. **Elegir texto:** buscar un libro en Gutenberg o subir un `.txt` propio.
2. **Compresión:**
   - Se comprime en un Web Worker.
   - Se muestra el resumen de tamaños (original y `.hfmn`) junto al botón para descargar el `.hfmn`.
   - El árbol va en un desplegable: al abrirlo, su construcción se anima sola.
   - La tabla de frecuencias y códigos.
3. **Inspector y descompresión:**
   - Botón para cargar cualquier `.hfmn`. El que se acaba de comprimir también llega aquí.
   - Inspector: muestra la estructura del archivo sin descomprimirlo (nombre, versión, tamaños, ahorro, razón, símbolos, bits, metadatos y los primeros bytes en binario), la tabla guardada y el árbol reconstruido.
   - Lector del `.hfmn` con dos pestañas: hexadecimal por zonas y bits alineados con su carácter.
   - Botón **Descomprimir**: recupera el texto, lo muestra en el lector paginado, comprueba la integridad con la huella SHA-256 guardada en los metadatos y permite descargarlo como `.txt`.

## Decisiones tomadas (no cambiar sin acuerdo del equipo)

- **Stack:** HTML, CSS y JavaScript con módulos ES (`import`/`export`), **sin frameworks**. Bootstrap 5.3.3 y Bootstrap Icons por CDN. Para el árbol se recomienda D3 v7 por CDN o SVG a mano.
- **Diseño:** el mismo de VisuAlgoritmos, compartido en `css/estilos.css`.
  - Modo oscuro fijo con `data-bs-theme="dark"`.
  - Paleta en variables CSS: `--primario` #06B6D4, `--secundario` #6366F1, `--terciario` #10B981, `--fondo` #111114, `--superficie` #1A1A1F, más ámbar #F59E0B y rosa #F43F5E para resaltar.
  - Tipografías Inter y JetBrains Mono.
  - Tarjeta central `.marco` y logo del CUCEI.
  - Los estilos de la página `huffman.html` van en la sección "Página 3: Huffman" de `css/estilos.css`; los de cada módulo, en `css/modulos/`.
- **Hosting:** un sitio en Netlify, conectado a este repositorio para que publique solo con cada merge a `main`. El sitio es estático más **dos Netlify Functions** (`/api/buscar`, `/api/libro`), que existen porque gutenberg.org no deja descargar sus `.txt` desde otra página (CORS). Todo el algoritmo corre en el navegador.
- **Archivo comprimido:** extensión propia `.hfmn`. Lleva la tabla de frecuencias dentro, así que se descomprime solo. Formato en `docs/formato-hfmn.md`.
- **Unidad:** carácter Unicode (`for…of`). El tamaño original se mide en bytes UTF-8.

## Contratos (leer antes de programar)

Los contratos son acuerdos sobre qué datos se pasan entre partes. Son como el estándar de eventos de VisuAlgoritmos: si se respetan, cada quien trabaja por separado y todo encaja.

`docs/guia-del-equipo.md` explica el proyecto, Huffman con "abracadabra" y cada contrato en palabras simples. Es la puerta de entrada para las personas; los contratos tienen el detalle. Si alguien no entiende un contrato, explícaselo partiendo de la guía.

| Documento | Qué fija |
| --- | --- |
| `docs/guia-del-equipo.md` | Resumen para personas: qué se construye, cómo funciona Huffman, qué dice cada contrato y qué leer según tu parte |
| `docs/contrato-pasos-arbol.md` | Lista de pasos (`hoja` / `fusion`) que produce el algoritmo y consume la animación; **regla de desempate** |
| `docs/formato-hfmn.md` | Orden de bytes del `.hfmn`, validaciones, zonas y cómo medir tamaños |
| `docs/contrato-modulos.md` | Firma de cada función exportada, objeto `ResultadoHuffman`, API HTTP, mensajes del worker y contenedores de `huffman.html` |

Datos de ejemplo hechos con la regla de desempate (para probar sin depender de otros): `ejemplos/abracadabra.txt`, `abracadabra-pasos.json`, `abracadabra-codigos.json`, `abracadabra-resultado.json` y `abracadabra.hfmn`.

## Estructura de carpetas

```
VisualizadorHuffman/
├── index.html                    Visualizador de ordenamientos
├── comparador.html               Comparador de ordenamientos
├── huffman.html                  Página de Huffman (Diego)
├── netlify.toml                  Publica la raíz y redirige /api/* (Daniel)
├── CLAUDE.md · README.md
├── css/estilos.css               Paleta y estilos compartidos por las tres páginas
├── css/modulos/                  Un CSS por módulo, para no editar el mismo archivo
├── img/escudo-cucei.webp
├── docs/                         Contratos y guía del equipo
├── ejemplos/                     Datos de ejemplo
├── netlify/functions/            buscar.mjs, libro.mjs (Daniel)
├── js/
│   ├── pagina-principal.js       Orquesta el flujo de huffman.html (Diego)
│   ├── trabajador.js             Web Worker (Diego)
│   ├── algoritmos/               Ordenamientos y catalogo.js (VisuAlgoritmos)
│   ├── comparador/               benchmark.js, pagina-comparador.js (VisuAlgoritmos)
│   ├── core/                     eventos.js, utilidades.js (compartidos)
│   ├── huffman/                  Algoritmo puro, sin DOM (Brayan)
│   ├── gutenberg/                cliente.js, buscador.js (Daniel)
│   ├── visualizador/             Huffman: arbolAnimado, tablaCodigos, lectorTexto, lectorHfmn, paginador (Andrés)
│   │                             VisuAlgoritmos: barras, reproductor, pagina-visualizador
│   └── interfaz/                 resumen.js, descompresion.js, inspector.js, formatos.js (Diego)
├── demos/                        Una página de prueba por módulo
└── tests/                        Pruebas de Huffman y de VisuAlgoritmos
```

## Reparto

| Integrante | Capa | Carpetas |
| --- | --- | --- |
| Diego Antonio Espinosa Salinas | Contratos, página, flujo de la app, resumen, descompresión e integración continua | `huffman.html`, `js/pagina-principal.js`, `js/trabajador.js`, `js/interfaz/`, `docs/` |
| Daniel Alejandro Rodríguez González | Repositorio, tablero, Netlify, funciones de Gutenberg, buscador y carga de `.txt`; revisa y aprueba PRs | `netlify/`, `netlify.toml`, `js/gutenberg/` |
| Brayan Jaziel Navarro Ayala | Algoritmo de Huffman, formato `.hfmn` y pruebas | `js/huffman/`, `tests/` |
| José Andrés Flores Parra | Animación del árbol, tabla de códigos y lectores | Archivos de Huffman en `js/visualizador/` |

Cada quien trabaja **solo en sus carpetas**. Si necesitas algo de otra capa, usa lo que fija el contrato o los datos de `ejemplos/`. No modifiques el código de otro. El código de VisuAlgoritmos ya está entregado: solo se cambia si hace falta para integrar el sitio y avisando al equipo.

## Cómo trabajar (reglas del equipo)

- **Una issue, una rama, un PR.** La rama lleva el ID de la tarea (`BR-03-construir-arbol`) y el PR dice `Closes #n`, para que la issue pase sola a Terminado al aprobarse. No se reutiliza una rama para varias tareas: cada tarea nueva sale de `main` actualizado.
- `main` está protegida. Daniel prueba cada PR localmente antes de aprobarlo. Las ramas se borran solas al hacer merge.
- **El equipo usa GitHub Desktop.** Al explicar pasos de Git, dalos con sus botones, no con comandos:
  1. En `main`: *Fetch origin* y *Pull origin*.
  2. *Current branch → New branch* con el ID de la tarea, basada en `main`.
  3. Al terminar: *Commit*, *Publish branch* (o *Push origin*) y *Create Pull Request*.
  4. Para traer cambios de `main` a una rama abierta: *Branch → Update from main*.
- **En el tablero,** la issue pasa a *En progreso* al empezar y a *En revisión* al abrir el PR.
- **Trabajar en varias computadoras:** antes de cambiar de equipo se hace *Commit* y *Push origin*; al llegar, *Fetch origin* y *Pull origin*. Se puede subir trabajo sin terminar a la rama propia mientras no se haga merge.
- Cada módulo visual se prueba con su página `demos/demo-<archivo>.html` antes del PR.
- **Correr localmente:** con Live Server de VS Code (los módulos ES no funcionan con doble clic, `file://`). Para probar `/api/*` se usa `netlify dev` (Netlify CLI), que sirve la página y las funciones en `localhost:8888`.
- **Código en español:** variables, funciones, comentarios y documentación. Comentarios que expliquen el *por qué*.
- **Cambiar un contrato** requiere avisar al equipo y actualizar primero el documento en `docs/`.
- Antes de entregar se borra el código muerto y los prototipos duplicados.
- El README declara qué se hizo con IA y qué hizo el equipo, como en VisuAlgoritmos.

## Cómo debe ayudar Claude

- **Explicar paso a paso** el código que propone antes de integrarlo. La regla del equipo es entender todo lo que se sube: en la revisión le pueden preguntar a cualquiera cómo funciona su parte.
- El equipo viene de Python y conoce poco JavaScript, Node y APIs. **Comparar con Python cuando ayude**: `[...lista]` como `lista.copy()`, `Map` como `dict`, `ColaPrioridad` como `heapq`, `async/await` como `asyncio`.
- **Respetar los contratos y lo que ya funciona.** No reescribir módulos ajenos, no cambiar firmas ni el formato `.hfmn` por iniciativa propia; si algo del contrato parece mal, señalarlo y proponer el cambio.
- Mantener las tareas pequeñas y dentro de las carpetas del integrante.
- No agregar frameworks, librerías de build ni dependencias de npm en el frontend sin acuerdo del equipo.
- Preguntar antes de suponer cuando una decisión no esté en este archivo o en `docs/`.
