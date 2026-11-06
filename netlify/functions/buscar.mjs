// GET /api/buscar?q=<texto>&pagina=<n>  (DA-03)
// Busca en el catálogo de gutenberg.org y devuelve solo los campos que usa el buscador.
// Existe porque el navegador no puede pedirle esto directo a Gutenberg (CORS).
// No usa Gutendex: desde los servidores de Netlify responde 403.

const CABECERAS = {
  'User-Agent': 'VisualizadorHuffman/1.0 (proyecto escolar CUCEI; https://prismatic-travesseiro-4f9d7f.netlify.app)',
};

// gutenberg.org devuelve 25 libros por página en su búsqueda OPDS
const LIBROS_POR_PAGINA = 25;

function responderError(codigo, mensaje) {
  return Response.json({ error: mensaje }, { status: codigo });
}

// El XML escapa caracteres especiales (&amp; = &, &#233; = é); aquí se regresan a texto normal
function desescaparXml(texto) {
  return texto
    .replace(/&#(\d+);/g, (_, numero) => String.fromCodePoint(Number(numero)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hexa) => String.fromCodePoint(parseInt(hexa, 16)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

// Saca el texto de una etiqueta dentro de un bloque: <title>Don Quijote</title> → 'Don Quijote'
function leerEtiqueta(bloque, etiqueta) {
  const coincidencia = bloque.match(new RegExp(`<${etiqueta}[^>]*>([\\s\\S]*?)</${etiqueta}>`));
  return coincidencia ? desescaparXml(coincidencia[1].trim()) : null;
}

// Convierte cada <entry> del XML en un libro con la forma del contrato
function leerLibros(xml) {
  const entradas = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  const libros = [];

  for (const entrada of entradas) {
    // <id>https://www.gutenberg.org/ebooks/2000.opds</id> → 2000.
    // Las entradas que no son libros (navegación) no tienen ese formato y se saltan.
    const id = (leerEtiqueta(entrada, 'id') ?? '').match(/\/ebooks\/(\d+)\.opds$/);
    if (!id) continue;

    // El título trae el idioma al final: 'Don Quijote (Spanish)'
    const tituloCompleto = leerEtiqueta(entrada, 'title') ?? '';
    const conIdioma = tituloCompleto.match(/^(.*) \(([^()]+)\)$/);
    const autor = leerEtiqueta(entrada, 'content');

    libros.push({
      id: Number(id[1]),
      titulo: conIdioma ? conIdioma[1] : tituloCompleto,
      autores: autor ? [autor] : [],
      idiomas: conIdioma ? [conIdioma[2]] : [],
      descargas: null,    // la búsqueda de gutenberg.org no la da
      tieneTexto: true,   // tampoco lo da; si no hay .txt, /api/libro responde 404
    });
  }

  return libros;
}

export default async (peticion) => {
  // searchParams funciona como request.args de Flask
  const parametros = new URL(peticion.url).searchParams;
  const consulta = (parametros.get('q') ?? '').trim();
  const pagina = Number(parametros.get('pagina') ?? 1);

  if (consulta === '') {
    return responderError(400, 'Escribe algo para buscar.');
  }
  if (!Number.isInteger(pagina) || pagina < 1) {
    return responderError(400, 'El número de página no es válido.');
  }

  // start_index cuenta desde 1: la página 2 empieza en el libro 26
  const inicio = (pagina - 1) * LIBROS_POR_PAGINA + 1;
  const url = `https://www.gutenberg.org/ebooks/search.opds/?query=${encodeURIComponent(consulta)}&start_index=${inicio}`;

  let xml;
  try {
    // fetch + await es como requests.get dentro de asyncio
    const respuesta = await fetch(url, { headers: CABECERAS });
    if (!respuesta.ok) {
      throw new Error(`Gutenberg respondió ${respuesta.status}`);
    }
    xml = await respuesta.text();
  } catch (error) {
    // Se registra en los logs de Netlify para saber la causa real
    console.error('Error al buscar en Gutenberg:', error);
    return responderError(502, 'No se pudo consultar el catálogo de Gutenberg. Intenta de nuevo.');
  }

  const libros = leerLibros(xml);

  return Response.json(
    {
      total: null,   // gutenberg.org no dice cuántos resultados hay en total
      pagina,
      // Si la página vino llena, puede haber más
      haySiguiente: libros.length === LIBROS_POR_PAGINA,
      libros,
    },
    // El catálogo cambia poco: se guarda una hora en caché
    { headers: { 'Cache-Control': 'public, max-age=3600' } },
  );
};