// GET /api/libro?id=<n>  (DA-04, DA-07)
// Descarga el .txt del libro directo de gutenberg.org y lo devuelve.
// Existe porque gutenberg.org no deja que otra página descargue sus archivos (CORS).
// No usa Gutendex: desde los servidores de Netlify responde 403.

const CABECERAS = {
  'User-Agent': 'VisualizadorHuffman/1.0 (proyecto escolar CUCEI; https://prismatic-travesseiro-4f9d7f.netlify.app)',
};

// Netlify no deja que una función responda más de 6 MB (contando cabeceras).
// Se deja un margen para no pasarse.
const LIMITE_BYTES = 6_000_000;

// Netlify corta la función a los 10 segundos; se aborta antes para poder
// responder un error claro en vez de que la función muera sin mensaje.
const TIEMPO_MAXIMO_MS = 8000;

function responderError(codigo, mensaje) {
  return Response.json({ error: mensaje }, { status: codigo });
}

function errorDeDescarga(error) {
  console.error('Error al descargar de Gutenberg:', error);
  // AbortSignal.timeout lanza un error llamado 'TimeoutError' al cumplirse el tiempo
  if (error.name === 'TimeoutError') {
    return responderError(502, 'Gutenberg tardó demasiado en responder. Intenta de nuevo.');
  }
  return responderError(502, 'No se pudo descargar el libro de Gutenberg. Intenta de nuevo.');
}

function libroDemasiadoGrande(bytes) {
  const megas = (bytes / 1_000_000).toFixed(1);
  return responderError(413,
    `El libro pesa ${megas} MB y el máximo es 6 MB. Elige otro, o descárgalo de gutenberg.org y súbelo como .txt.`);
}

export default async (peticion) => {
  const id = Number(new URL(peticion.url).searchParams.get('id'));

  if (!Number.isInteger(id) || id < 1) {
    return responderError(400, 'El id del libro no es válido.');
  }

  // Es la dirección del formato 'text/plain; charset=utf-8' que da el catálogo.
  // gutenberg.org redirige a donde esté el archivo; fetch sigue la redirección solo.
  const url = `https://www.gutenberg.org/ebooks/${id}.txt.utf-8`;
  const senal = AbortSignal.timeout(TIEMPO_MAXIMO_MS);

  let respuesta;
  try {
    respuesta = await fetch(url, { headers: CABECERAS, signal: senal });
  } catch (error) {
    return errorDeDescarga(error);
  }

  if (respuesta.status === 404) {
    return responderError(404, 'Ese libro no existe o no tiene versión en texto plano (.txt).');
  }
  if (!respuesta.ok) {
    console.error(`Gutenberg respondió ${respuesta.status} para el libro ${id}`);
    return responderError(502, 'No se pudo descargar el libro de Gutenberg. Intenta de nuevo.');
  }

  // Si Gutenberg dice el tamaño de antemano, se revisa antes de descargar nada
  const tamanoAnunciado = Number(respuesta.headers.get('content-length'));
  if (tamanoAnunciado > LIMITE_BYTES) {
    await respuesta.body?.cancel();
    return libroDemasiadoGrande(tamanoAnunciado);
  }

  // Se lee como bytes y no con .text(): así se mide el tamaño real y se
  // reenvía tal cual, sin decodificar y volver a codificar el UTF-8
  let bytes;
  try {
    bytes = new Uint8Array(await respuesta.arrayBuffer());
  } catch (error) {
    return errorDeDescarga(error);
  }

  if (bytes.length > LIMITE_BYTES) {
    return libroDemasiadoGrande(bytes.length);
  }

  return new Response(bytes, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      // Un libro publicado no cambia: se guarda un día en caché
      'Cache-Control': 'public, max-age=86400',
    },
  });
};