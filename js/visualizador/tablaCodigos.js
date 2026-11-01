// AN-01 · Tabla de frecuencias y códigos. Jose Andres Flores Parra
// Recibe `resultado.codigos`y lo dibuja dentro del contenedor.
// No importa nada de js/huffman/: solo trabaja con los datos que le pasan.

// Estos caracteres no se ven en pantalla, así que se muestran con un símbolo.
// Es como usar repr() en Python: repr(' ') muestra "' '" en vez de nada.
const SIMBOLOS_VISIBLES = {
  ' ': '␣',
  '\n': '↵',
  '\r': '⏎',
  '\t': '⇥',
};

// Devuelve el texto que se muestra para un carácter.
export function simboloVisible(simbolo) {
  if (simbolo in SIMBOLOS_VISIBLES) return SIMBOLOS_VISIBLES[simbolo];
  // Caracteres de control (código < 32) o el espacio duro: se muestran como U+XXXX.
  const codePoint = simbolo.codePointAt(0);
  if (codePoint < 32 || codePoint === 0x7f || codePoint === 0xa0) {
    return 'U+' + codePoint.toString(16).toUpperCase().padStart(4, '0');
  }
  return simbolo;
}

// Columnas de la tabla. 
const COLUMNAS = [
  { clave: 'simbolo', titulo: 'Carácter', valor: (f) => f.codePoint },
  { clave: 'frecuencia', titulo: 'Frecuencia', valor: (f) => f.frecuencia },
  { clave: 'codigo', titulo: 'Código', valor: (f) => f.codigo },
  { clave: 'longitud', titulo: 'Longitud', valor: (f) => f.codigo.length },
];

export function montarTablaCodigos(contenedor, codigos) {
  //vaciar el contenedor y dibujar solo dentro de él.
  contenedor.replaceChildren();

  if (!codigos || codigos.length === 0) {
    const vacio = document.createElement('p');
    vacio.className = 'tablaCodigos-vacio';
    vacio.textContent = 'No hay caracteres: el texto está vacío.';
    contenedor.append(vacio);
    return { destruir: () => contenedor.replaceChildren() };
  }

  const filas = [...codigos];
  let orden = { clave: 'simbolo', ascendente: true };

  const envoltura = document.createElement('div');
  envoltura.className = 'tablaCodigos-envoltura';
  const tabla = document.createElement('table');
  tabla.className = 'tablaCodigos-tabla';
  const encabezado = document.createElement('thead');
  const cuerpo = document.createElement('tbody');
  tabla.append(encabezado, cuerpo);
  envoltura.append(tabla);

  // Resumen debajo de la tabla: cuántos símbolos hay y el código más corto y largo.
  const pie = document.createElement('p');
  pie.className = 'tablaCodigos-pie';
  const longitudes = codigos.map((f) => f.codigo.length);
  pie.textContent =
    `${codigos.length} símbolos distintos · ` +
    `códigos de ${Math.min(...longitudes)} a ${Math.max(...longitudes)} bits`;

  function dibujarEncabezado() {
    const fila = document.createElement('tr');
    for (const columna of COLUMNAS) {
      const celda = document.createElement('th');
      celda.scope = 'col';
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'tablaCodigos-orden';
      const activa = orden.clave === columna.clave;
      boton.textContent = columna.titulo + (activa ? (orden.ascendente ? ' ▲' : ' ▼') : '');
      celda.setAttribute('aria-sort', activa ? (orden.ascendente ? 'ascending' : 'descending') : 'none');
      boton.addEventListener('click', () => {
        // Un segundo clic en la misma columna invierte el orden.
        orden = { clave: columna.clave, ascendente: activa ? !orden.ascendente : true };
        dibujar();
      });
      celda.append(boton);
      fila.append(celda);
    }
    encabezado.replaceChildren(fila);
  }

  function dibujarCuerpo() {
    const columna = COLUMNAS.find((c) => c.clave === orden.clave);
    const signo = orden.ascendente ? 1 : -1;
    filas.sort((a, b) => {
      const va = columna.valor(a);
      const vb = columna.valor(b);
      // Si hay empate se usa el codePoint, para que el orden sea siempre estable.
      const diferencia = va < vb ? -1 : va > vb ? 1 : a.codePoint - b.codePoint;
      return diferencia * signo;
    });

    const fragmento = document.createDocumentFragment();
    for (const f of filas) {
      const fila = document.createElement('tr');

      const celdaSimbolo = document.createElement('td');
      const simbolo = document.createElement('span');
      simbolo.className = 'tablaCodigos-simbolo';
      simbolo.textContent = simboloVisible(f.simbolo);
      celdaSimbolo.append(simbolo);

      const celdaFrecuencia = document.createElement('td');
      celdaFrecuencia.textContent = f.frecuencia.toLocaleString('es-MX');

      const celdaCodigo = document.createElement('td');
      const codigo = document.createElement('code');
      codigo.className = 'tablaCodigos-codigo';
      codigo.textContent = f.codigo;
      celdaCodigo.append(codigo);

      const celdaLongitud = document.createElement('td');
      celdaLongitud.textContent = f.codigo.length;

      fila.append(celdaSimbolo, celdaFrecuencia, celdaCodigo, celdaLongitud);
      fragmento.append(fila);
    }
    cuerpo.replaceChildren(fragmento);
  }

  function dibujar() {
    dibujarEncabezado();
    dibujarCuerpo();
  }

  dibujar();
  contenedor.append(envoltura, pie);

  return { destruir: () => contenedor.replaceChildren() };
}
