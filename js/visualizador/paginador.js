// Barra de paginación compartida por lectorTexto.js y lectorHfmn.js.
// Solo maneja el número de página; cada lector decide qué dibuja en cada una.
// Estilos: css/modulos/paginador.css (clases "paginador-").

//se llama cada vez que se llama a ir(n) o el usuario cambia de página.
export function crearPaginador(totalPaginas, alCambiar) {
  const total = Math.max(1, totalPaginas);
  let actual = 1;

  const elemento = document.createElement('nav');
  elemento.className = 'paginador-barra';
  elemento.setAttribute('aria-label', 'Paginación');

  function boton(texto, etiqueta, accion) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'paginador-boton';
    b.textContent = texto;
    b.setAttribute('aria-label', etiqueta);
    b.addEventListener('click', accion);
    return b;
  }

  const primera = boton('«', 'Primera página', () => ir(1));
  const anterior = boton('‹', 'Página anterior', () => ir(actual - 1));
  const siguiente = boton('›', 'Página siguiente', () => ir(actual + 1));
  const ultima = boton('»', 'Última página', () => ir(total));

  const entrada = document.createElement('input');
  entrada.type = 'number';
  entrada.min = 1;
  entrada.max = total;
  entrada.className = 'paginador-entrada';
  entrada.setAttribute('aria-label', 'Número de página');

  const etiquetaTotal = document.createElement('span');
  etiquetaTotal.className = 'paginador-total';
  etiquetaTotal.textContent = `de ${total.toLocaleString('es-MX')}`;

  elemento.append(primera, anterior, 'Página ', entrada, etiquetaTotal, siguiente, ultima);

  function ir(numero) {
    // Number(...) || 1 evita NaN si alguien borra el campo.
    actual = Math.min(Math.max(Math.round(Number(numero)) || 1, 1), total);
    entrada.value = actual;
    primera.disabled = anterior.disabled = actual === 1;
    siguiente.disabled = ultima.disabled = actual === total;
    alCambiar(actual);
  }

  // "change" se dispara al presionar Enter o salir del campo.
  entrada.addEventListener('change', () => ir(entrada.value));

  return { elemento, ir, get pagina() { return actual; }, total };
}
