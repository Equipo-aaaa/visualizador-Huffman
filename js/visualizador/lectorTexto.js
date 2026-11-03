// Lector paginado del texto. Un libro puede tener millones de caracteres, así que
// nunca se pone todo en el DOM: cada página corta un pedazo con slice y solo ese se dibuja.

import { crearPaginador } from './paginador.js';

const CARACTERES_POR_PAGINA = 3000;

// Posición de corte entre página y página. JavaScript guarda los emojis 

function corte(texto, numeroDeCorte) {
  const posicion = Math.min(numeroDeCorte * CARACTERES_POR_PAGINA, texto.length);
  if (posicion > 0 && posicion < texto.length) {
    const anterior = texto.charCodeAt(posicion - 1);
    if (anterior >= 0xd800 && anterior <= 0xdbff) return posicion + 1;
  }
  return posicion;
}

export function montarLectorTexto(contenedor, texto) {
  contenedor.replaceChildren();

  if (!texto) {
    const vacio = document.createElement('p');
    vacio.className = 'lectorTexto-vacio';
    vacio.textContent = 'El texto está vacío.';
    contenedor.append(vacio);
    return { destruir: () => contenedor.replaceChildren() };
  }

  const totalPaginas = Math.ceil(texto.length / CARACTERES_POR_PAGINA);

  const pagina = document.createElement('pre');
  pagina.className = 'lectorTexto-pagina';
  pagina.tabIndex = 0;   

  const paginador = crearPaginador(totalPaginas, (numero) => {
    // La página n va del corte n-1 al corte n.
    pagina.textContent = texto.slice(corte(texto, numero - 1), corte(texto, numero));
    pagina.scrollTop = 0;
  });

  pagina.addEventListener('keydown', (evento) => {
    if (evento.key === 'ArrowRight' || evento.key === 'PageDown') paginador.ir(paginador.pagina + 1);
    else if (evento.key === 'ArrowLeft' || evento.key === 'PageUp') paginador.ir(paginador.pagina - 1);
    else return;
    evento.preventDefault();
  });

  contenedor.append(paginador.elemento, pagina);
  paginador.ir(1);

  return { destruir: () => contenedor.replaceChildren() };
}
