# Contrato 3 — Módulos, funciones y API

Este documento fija **qué exporta cada módulo y qué recibe**. Mientras cada quien respete estas firmas, puede programar su parte sin esperar a los demás, y la integración se reduce a hacer `import` y llamar la función.

Regla general: **no se cambia una firma sin avisar al equipo.** Si hace falta, se propone en un PR que modifique este documento primero.

## Mapa de dependencias

```
pagina-principal.js (Diego) ── usa ──► gutenberg/buscador.js (Daniel)
        │                                   └─► gutenberg/cliente.js ──► /api/buscar, /api/libro (Daniel)
        ├── usa ──► trabajador.js (Diego) ──► huffman/huffman.js (Brayan)
        ├── usa ──► visualizador/*.js (Andrés)   ← solo reciben datos, no importan huffman
        └── usa ──► interfaz/*.js (Diego)
```

El visualizador **no importa** nada de `huffman/`. Recibe el objeto `ResultadoHuffman` ya calculado. Así Andrés trabaja con `ejemplos/abracadabra-resultado.json` desde el primer día.

## El objeto central: `ResultadoHuffman`

`comprimir` y `descomprimir` devuelven **la misma forma**. Así la página trata igual un libro recién comprimido y un `.hfmn` cargado desde archivo.

```js
{
  texto,          // string: el texto original (o el recuperado)
  metadatos,      // { titulo?, autor?, idGutenberg?, origen?, nombreArchivo? }
  frecuencias,    // [{ codePoint, simbolo, frecuencia }] ordenado por codePoint
  pasos,          // ver contrato-pasos-arbol.md
  codigos,        // [{ simbolo, codePoint, frecuencia, codigo: '0101' }] ordenado por codePoint
  bytesHfmn,      // Uint8Array: el archivo .hfmn completo
  bitsRelleno,    // 0 a 7
  totalBits,      // bits útiles de la zona de datos (sin relleno)
  zonas,          // [{ nombre, inicio, fin }] ver formato-hfmn.md
  tamanos: { original, datos, hfmn, razon, ahorro }   // en bytes; razon y ahorro como fracción
}
```

Ejemplo real con todo menos `bytesHfmn`: `ejemplos/abracadabra-resultado.json`. Los bytes están en `ejemplos/abracadabra.hfmn`.

## Algoritmo — Brayan (`js/huffman/`)

JavaScript puro: **sin DOM** (`document`, `window`), para que corra en el Web Worker y en Node con las pruebas.

| Archivo | Exporta | Recibe | Devuelve |
| --- | --- | --- | --- |
| `frecuencias.js` | `contarFrecuencias(texto)` | string | `[{ codePoint, simbolo, frecuencia }]` por codePoint ascendente |
| `colaPrioridad.js` | `class ColaPrioridad` | `new ColaPrioridad(comparar)` | `insertar(x)`, `extraer()`, `tamano` (getter), `estaVacia()` |
| `arbol.js` | `construirArbol(frecuencias)` | salida de `contarFrecuencias` | `{ raiz, pasos }` |
| `codigos.js` | `generarCodigos(raiz)` | nodo raíz | `Map<codePoint, string>` |
| `codigos.js` | `tablaCodigos(frecuencias, mapa)` | frecuencias + mapa | `[{ simbolo, codePoint, frecuencia, codigo }]` |
| `codificador.js` | `codificar(texto, mapa)` | string + `Map` | `{ datos: Uint8Array, totalBits, bitsRelleno }` |
| `codificador.js` | `decodificar(datos, raiz, totalCaracteres)` | bytes + raíz + total | string |
| `formatoHfmn.js` | `escribirHfmn({ metadatos, frecuencias, totalCaracteres, datos, bitsRelleno })` | objeto | `Uint8Array` |
| `formatoHfmn.js` | `leerHfmn(bytes)` | `Uint8Array` | `{ version, metadatos, frecuencias, totalCaracteres, bitsRelleno, datos, zonas }` |
| `huffman.js` | `comprimir(texto, metadatos = {})` | string + objeto | `ResultadoHuffman` |
| `huffman.js` | `descomprimir(bytesHfmn)` | `Uint8Array` | `ResultadoHuffman` |

Detalles:

- **Nodo del árbol:** `{ id, frecuencia, simbolo, codePoint }` en hojas y `{ id, frecuencia, izquierdo, derecho }` en nodos internos, donde `izquierdo` y `derecho` son objetos nodo. `raiz` es `null` si el texto está vacío.
- **Comparador de la cola:** `(a, b) => a.frecuencia - b.frecuencia || a.id - b.id` (regla de desempate).
- **Caracteres:** se recorre con `for (const c of texto)`, no con `texto[i]`, para que un emoji cuente como un carácter. No se normalizan saltos de línea: `\r\n` son dos caracteres.
- **Errores:** `leerHfmn` y `descomprimir` lanzan `Error` con mensaje en español (ver validaciones en `formato-hfmn.md`).
- Solo `huffman.js` se usa fuera de esta carpeta. Los demás archivos son internos.

## Gutenberg — Daniel

### API HTTP (`netlify/functions/`)

`netlify.toml` redirige `/api/*` a las funciones.

**`GET /api/buscar?q=<texto>&pagina=<n>`** (`buscar.mjs`) → `200`, JSON:

```js
{
  total: 128,
  pagina: 1,
  haySiguiente: true,
  libros: [{ id: 2000, titulo: 'Don Quijote', autores: ['Cervantes Saavedra, Miguel de'],
             idiomas: ['es'], descargas: 12345, tieneTexto: true }]
}
```

**`GET /api/libro?id=<n>`** (`libro.mjs`) → `200`, `text/plain; charset=utf-8` con el libro completo.

Errores de ambas: JSON `{ error: 'mensaje en español' }` con código:

| Código | Cuándo |
| --- | --- |
| 400 | Falta `q` o `id`, o no es válido |
| 404 | El libro no existe o no tiene versión `.txt` |
| 413 | El libro supera el tamaño que puede devolver la función |
| 502 | Gutendex o Gutenberg no respondieron |

### Frontend (`js/gutenberg/`)

| Archivo | Exporta | Devuelve |
| --- | --- | --- |
| `cliente.js` | `buscarLibros(consulta, pagina = 1)` | `Promise` con el JSON de `/api/buscar`; lanza `Error(mensaje)` si falla |
| `cliente.js` | `descargarLibro(id)` | `Promise<string>` con el texto; lanza `Error(mensaje)` si falla |
| `buscador.js` | `montarBuscador(contenedor, { alElegirTexto })` | `{ destruir() }` |

`montarBuscador` incluye **la búsqueda en Gutenberg y la carga de un `.txt` propio**. En ambos casos termina llamando `alElegirTexto(texto, metadatos)`, con `metadatos.origen` igual a `'gutenberg'` o `'local'`. A la página no le importa de dónde vino el texto.

## Visualización — Andrés (`js/visualizador/`)

| Archivo | Exporta | Recibe |
| --- | --- | --- |
| `arbolAnimado.js` | `montarArbol(contenedor, pasos, opciones = { msPorPaso: 400 })` | lista de pasos |
| `tablaCodigos.js` | `montarTablaCodigos(contenedor, codigos)` | `resultado.codigos` |
| `lectorTexto.js` | `montarLectorTexto(contenedor, texto)` | string |
| `lectorHfmn.js` | `montarLectorHfmn(contenedor, resultado)` | `ResultadoHuffman` completo |

- `montarArbol` **arranca la animación sola** al montarse y devuelve `{ reproducir(), detener(), destruir() }`. Debe aguantar más de 100 hojas (zoom y desplazamiento).
- `montarLectorHfmn` tiene dos pestañas:
  - **Hexadecimal:** usa `resultado.bytesHfmn` y `resultado.zonas` para colorear cada zona.
  - **Bits:** usa `resultado.texto` y `resultado.codigos` para alinear cada código con su carácter.
- Los lectores muestran el contenido por páginas, porque un libro puede tener millones de caracteres.
- Los demás devuelven `{ destruir() }`.

## Interfaz y flujo — Diego

| Archivo | Exporta / hace |
| --- | --- |
| `index.html` | Esqueleto con el diseño de VisuAlgoritmos y un contenedor por sección (tabla abajo) |
| `js/pagina-principal.js` | Orquesta todo: recibe el texto del buscador, comprime en el worker y monta cada vista |
| `js/trabajador.js` | Web Worker que llama `comprimir` / `descomprimir` (mensajes abajo) |
| `js/interfaz/resumen.js` | `montarResumen(contenedor, resultado)`: tamaños y botón de descarga del `.hfmn` |
| `js/interfaz/descompresion.js` | `montarDescompresion(contenedor, { alCargarHfmn })`: botón para cargar un `.hfmn` |

### Contenedores de `index.html`

| Sección | Contenedor | Lo llena |
| --- | --- | --- |
| 1. Elegir texto | `#buscador` | `montarBuscador` |
| 2. Compresión | `#resumen` | `montarResumen` |
| 2. Compresión | `#arbol`, dentro de `<details id="desplegable-arbol">` | `montarArbol`, al abrir el desplegable |
| 2. Compresión | `#tabla-codigos` | `montarTablaCodigos` |
| 3. Lector y descompresión | `#cargar-hfmn` | `montarDescompresion` |
| 3. Lector y descompresión | `#lector-texto` | `montarLectorTexto` |
| 3. Lector y descompresión | `#lector-hfmn` | `montarLectorHfmn` |

Al cargar un `.hfmn` en la sección 3, el resultado de `descomprimir` reemplaza lo que muestran los lectores, y el texto recuperado aparece en `#lector-texto`.

### Mensajes del Web Worker

```js
// página → worker
{ tipo: 'comprimir', texto, metadatos }
{ tipo: 'descomprimir', bytesHfmn }      // Uint8Array, se transfiere

// worker → página
{ tipo: 'resultado', resultado }         // ResultadoHuffman
{ tipo: 'error', mensaje }
```

El worker se crea con `new Worker(new URL('./trabajador.js', import.meta.url), { type: 'module' })`, para que la ruta funcione igual en local y en Netlify.

## Reglas para todos los `montar…`

1. Al empezar, **vacían su contenedor** y dibujan solo dentro de él. No buscan otros elementos con `document.querySelector` fuera del contenedor.
2. No usan variables globales ni guardan estado fuera de lo que devuelven.
3. `destruir()` deja el contenedor vacío y detiene temporizadores.
4. Los estilos propios van en `css/modulos/<archivo>.css` (por ejemplo `css/modulos/arbolAnimado.css`), con clases que empiezan con el nombre del módulo. Así nadie edita el mismo CSS a la vez. Los colores salen de las variables de `css/estilos.css`.
5. Cada módulo tiene su página de prueba en `demos/demo-<archivo>.html`, que lo monta con los datos de `ejemplos/`. Es lo que se abre para revisar el PR.
