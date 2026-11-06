// GET /api/buscar?q=<texto>&pagina=<n>  (DA-03)
// Consulta Gutendex y devuelve solo los campos que usa el buscador.
// Existe porque el navegador no puede pedirle esto directo a Gutenberg (CORS).
import { URL_GUTENDEX, CABECERAS, responderError, urlTexto } from '../gutendex.mjs';

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

  const url = `${URL_GUTENDEX}?search=${encodeURIComponent(consulta)}&page=${pagina}`;

  let datos;
  try {
    // fetch + await es como requests.get dentro de asyncio
    const respuesta = await fetch(url);

    // Gutendex responde 404 cuando se pide una página que ya no existe
    if (respuesta.status === 404) {
      return Response.json({ total: 0, pagina, haySiguiente: false, libros: [] });
    }
    if (!respuesta.ok) {
      throw new Error(`Gutendex respondió ${respuesta.status}`);
    }
    datos = await respuesta.json();

    } catch (error) {
    // Se registra en la terminal (y en los logs de Netlify) para saber la causa real
    console.error('Error al consultar Gutendex:', error);
    return responderError(502, 'No se pudo consultar el catálogo de Gutenberg. Intenta de nuevo.');
  }

  // .map es como una comprensión de listas: [f(x) for x in lista]
  const libros = datos.results.map((libro) => ({
    id: libro.id,
    titulo: libro.title,
    autores: libro.authors.map((autor) => autor.name),
    idiomas: libro.languages,
    descargas: libro.download_count,
    tieneTexto: urlTexto(libro.formats) !== null,
  }));

  return Response.json(
    {
      total: datos.count,
      pagina,
      haySiguiente: datos.next !== null,
      libros,
    },
    // El catálogo cambia poco: se guarda una hora en caché para no saturar Gutendex
    { headers: { 'Cache-Control': 'public, max-age=3600' } },
  );
};