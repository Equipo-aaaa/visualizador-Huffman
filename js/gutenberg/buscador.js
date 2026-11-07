// DA-05 · Buscador de libros de Gutenberg. Daniel Alejandro Rodríguez González
// Dibuja el buscador dentro del contenedor. Al elegir un libro lo descarga y
// llama alElegirTexto(texto, metadatos); a la página no le importa de dónde vino.
import { buscarLibros, descargarLibro } from './cliente.js';

// Crea un elemento con su clase y su texto. Se usa textContent y no innerHTML
// para que un título con "<" o ">" se muestre como texto y no como HTML.
function crear(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

export function montarBuscador(contenedor, { alElegirTexto }) {
  contenedor.replaceChildren();

  // ---- Estructura ----
  const formulario = crear('form', 'buscador-formulario');
  const campo = crear('input', 'form-control buscador-campo');
  campo.type = 'search';
  campo.placeholder = 'Título o autor, por ejemplo "quijote" o "shakespeare"';
  campo.setAttribute('aria-label', 'Buscar libro en Project Gutenberg');
  const botonBuscar = crear('button', 'btn btn-info buscador-boton', 'Buscar');
  botonBuscar.type = 'submit';
  formulario.append(campo, botonBuscar);

  // aria-live hace que un lector de pantalla anuncie los cambios de estado
  const estado = crear('p', 'buscador-estado');
  estado.setAttribute('aria-live', 'polite');

  const lista = crear('ul', 'buscador-resultados');

  const paginacion = crear('nav', 'buscador-paginacion');
  paginacion.setAttribute('aria-label', 'Páginas de resultados');
  const botonAnterior = crear('button', 'btn btn-outline-info btn-sm', '← Anterior');
  const textoPagina = crear('span', 'buscador-pagina');
  const botonSiguiente = crear('button', 'btn btn-outline-info btn-sm', 'Siguiente →');
  botonAnterior.type = 'button';
  botonSiguiente.type = 'button';
  paginacion.append(botonAnterior, textoPagina, botonSiguiente);
  paginacion.hidden = true;

  contenedor.append(formulario, estado, lista, paginacion);

  // ---- Estado ----
  let consultaActual = '';
  let paginaActual = 1;
  // Cada búsqueda o descarga recibe un número. Si llega la respuesta de una
  // petición vieja (el usuario ya buscó otra cosa), se ignora.
  let peticionActual = 0;

  function mostrarEstado(mensaje, esError = false) {
    estado.textContent = mensaje;
    estado.classList.toggle('buscador-estado--error', esError);
  }

  // Mientras se descarga un libro no se puede elegir otro ni cambiar de página
  function bloquear(bloqueado) {
    for (const boton of contenedor.querySelectorAll('button')) {
      if (bloqueado) {
        boton.dataset.estabaActivo = String(!boton.disabled);
        boton.disabled = true;
      } else if (boton.dataset.estabaActivo !== undefined) {
        boton.disabled = boton.dataset.estabaActivo === 'false';
        delete boton.dataset.estabaActivo;
      }
    }
  }

  function dibujarLibro(libro) {
    const elemento = crear('li');
    const boton = crear('button', 'buscador-libro');
    boton.type = 'button';

    const titulo = crear('span', 'buscador-titulo', libro.titulo);
    const autores = crear('span', 'buscador-autores',
      libro.autores.length > 0 ? libro.autores.join(', ') : 'Autor desconocido');
    boton.append(titulo, autores);

    // Gutenberg solo da el idioma cuando no es inglés
    for (const idioma of libro.idiomas) {
      boton.append(crear('span', 'buscador-etiqueta', idioma));
    }
    if (libro.descargas !== null && libro.descargas !== undefined) {
      boton.append(crear('span', 'buscador-etiqueta', `${libro.descargas.toLocaleString('es-MX')} descargas`));
    }

    if (libro.tieneTexto) {
      boton.addEventListener('click', () => elegir(libro));
    } else {
      // Sin .txt no hay nada que comprimir: se muestra pero no se puede elegir
      boton.disabled = true;
      boton.append(crear('span', 'buscador-etiqueta buscador-etiqueta--aviso', 'Sin .txt'));
    }

    elemento.append(boton);
    return elemento;
  }

  function dibujarResultados(datos) {
    lista.replaceChildren(...datos.libros.map(dibujarLibro));

    if (datos.libros.length === 0) {
      mostrarEstado(paginaActual === 1
        ? `No se encontraron libros para "${consultaActual}".`
        : 'No hay más resultados.');
    } else {
      mostrarEstado(`Resultados para "${consultaActual}". Elige un libro para comprimirlo.`);
    }

    paginacion.hidden = paginaActual === 1 && !datos.haySiguiente;
    textoPagina.textContent = `Página ${paginaActual}`;
    botonAnterior.disabled = paginaActual === 1;
    botonSiguiente.disabled = !datos.haySiguiente;
  }

  async function buscar(consulta, pagina) {
    const numero = ++peticionActual;
    consultaActual = consulta;
    paginaActual = pagina;
    mostrarEstado('Buscando…');
    botonBuscar.disabled = true;

    try {
      const datos = await buscarLibros(consulta, pagina);
      if (numero !== peticionActual) return;
      dibujarResultados(datos);
    } catch (error) {
      if (numero !== peticionActual) return;
      lista.replaceChildren();
      paginacion.hidden = true;
      mostrarEstado(error.message, true);
    } finally {
      if (numero === peticionActual) botonBuscar.disabled = false;
    }
  }

  async function elegir(libro) {
    const numero = ++peticionActual;
    mostrarEstado(`Descargando "${libro.titulo}"…`);
    bloquear(true);

    try {
      const texto = await descargarLibro(libro.id);
      if (numero !== peticionActual) return;

      mostrarEstado(`Listo: "${libro.titulo}".`);
      alElegirTexto(texto, {
        titulo: libro.titulo,
        autor: libro.autores.join('; ') || undefined,
        idGutenberg: libro.id,
        origen: 'gutenberg',
      });
    } catch (error) {
      if (numero !== peticionActual) return;
      mostrarEstado(error.message, true);
    } finally {
      if (numero === peticionActual) bloquear(false);
    }
  }

  // ---- Eventos ----
  formulario.addEventListener('submit', (evento) => {
    // Sin esto el formulario recargaría la página
    evento.preventDefault();
    const consulta = campo.value.trim();
    if (consulta === '') {
      mostrarEstado('Escribe un título o un autor para buscar.', true);
      return;
    }
    buscar(consulta, 1);
  });
  botonAnterior.addEventListener('click', () => buscar(consultaActual, paginaActual - 1));
  botonSiguiente.addEventListener('click', () => buscar(consultaActual, paginaActual + 1));

  return {
    destruir() {
      // Subir el número hace que se ignore cualquier respuesta que siga en camino
      peticionActual++;
      contenedor.replaceChildren();
    },
  };
}