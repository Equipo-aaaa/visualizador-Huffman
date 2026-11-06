// GET /api/libro?id=<n>  (DA-04)
// Descarga el .txt del libro directo de gutenberg.org y lo devuelve.
// Existe porque gutenberg.org no deja que otra página descargue sus archivos (CORS).
// No usa Gutendex: desde los servidores de Netlify responde 403.

const CABECERAS = {
  'User-Agent': 'VisualizadorHuffman/1.0 (proyecto escolar CUCEI; https://prismatic-travesseiro-4f9d7f.netlify.app)',
};

function responderError(codigo, mensaje) {
  return Response.json({ error: mensaje }, { status: codigo });
}

export default async (peticion) => {
  const id = Number(new URL(peticion.url).searchParams.get('id'));

  if (!Number.isInteger(id) || id < 1) {
    return responderError(400, 'El id del libro no es válido.');
  }

  // Es la dirección del formato 'text/plain; charset=utf-8' que da el catálogo.
  // gutenberg.org redirige a donde esté el archivo; fetch sigue la redirección solo.
  const url = `https://www.gutenberg.org/ebooks/${id}.txt.utf-8`;

  let respuesta;
  try {
    respuesta = await fetch(url, { headers: CABECERAS });
  } catch (error) {
    console.error('Error al descargar de Gutenberg:', error);
    return responderError(502, 'No se pudo descargar el libro de Gutenberg. Intenta de nuevo.');
  }

  if (respuesta.status === 404) {
    return responderError(404, 'Ese libro no existe o no tiene versión en texto plano (.txt).');
  }
  if (!respuesta.ok) {
    console.error(`Gutenberg respondió ${respuesta.status} para el libro ${id}`);
    return responderError(502, 'No se pudo descargar el libro de Gutenberg. Intenta de nuevo.');
  }

  // .text() decodifica los bytes como UTF-8, igual que bytes.decode('utf-8')
  const texto = await respuesta.text();

  return new Response(texto, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      // Un libro publicado no cambia: se guarda un día en caché
      'Cache-Control': 'public, max-age=86400',
    },
  });
};