// DA-05 · Cliente de las funciones de Gutenberg. Daniel Alejandro Rodríguez González
// Envuelve las llamadas a /api/buscar y /api/libro para que el buscador
// solo reciba datos o un Error con un mensaje en español.

// Hace la petición y, si falla, lanza un Error con el mensaje que mandó la función
async function pedir(url) {
  let respuesta;
  try {
    respuesta = await fetch(url);
  } catch {
    // fetch solo truena aquí si no hubo respuesta: sin internet o servidor apagado
    throw new Error('No hay conexión con el servidor. Revisa tu internet.');
  }

  if (!respuesta.ok) {
    // Las funciones responden { error: 'mensaje' }; si no viene, se usa el código
    let mensaje = `Error ${respuesta.status} del servidor.`;
    try {
      mensaje = (await respuesta.json()).error ?? mensaje;
    } catch {
      // La respuesta no era JSON: se queda el mensaje genérico
    }
    throw new Error(mensaje);
  }

  return respuesta;
}

// Devuelve { total, pagina, haySiguiente, libros } (ver contrato-modulos.md)
export async function buscarLibros(consulta, pagina = 1) {
  // URLSearchParams arma "q=don%20quijote&pagina=1", como urlencode() en Python
  const parametros = new URLSearchParams({ q: consulta, pagina });
  const respuesta = await pedir(`/api/buscar?${parametros}`);
  return respuesta.json();
}

// Devuelve el texto completo del libro
export async function descargarLibro(id) {
  const respuesta = await pedir(`/api/libro?id=${encodeURIComponent(id)}`);
  return respuesta.text();
}