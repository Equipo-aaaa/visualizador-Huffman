// Funciones compartidas por buscar.mjs y libro.mjs.
// Va fuera de netlify/functions/ porque Netlify convierte en función pública
// cada archivo de esa carpeta, y esto no debe ser un endpoint.

export const URL_GUTENDEX = 'https://gutendex.com/books/';

// Gutendex rechaza (403) peticiones anónimas desde servidores de la nube.
// Con un User-Agent propio la petición se identifica como de este proyecto.
export const CABECERAS = {
  'User-Agent': 'VisualizadorHuffman/1.0 (proyecto escolar CUCEI; https://prismatic-travesseiro-4f9d7f.netlify.app)',
};

// Respuesta de error con la forma del contrato: { error: 'mensaje' }
export function responderError(codigo, mensaje) {
  return Response.json({ error: mensaje }, { status: codigo });
}

// Busca en el mapa formats de Gutendex la URL del .txt.
// Las llaves son tipos MIME como 'text/plain; charset=utf-8'. Se prefiere
// UTF-8 y se descartan los .zip, que el navegador no podría leer como texto.
export function urlTexto(formatos) {
  const candidatos = Object.entries(formatos ?? {})
    .filter(([tipo, url]) => tipo.startsWith('text/plain') && !url.endsWith('.zip'));

  const utf8 = candidatos.find(([tipo]) => tipo.includes('utf-8'));
  return (utf8 ?? candidatos[0])?.[1] ?? null;
}