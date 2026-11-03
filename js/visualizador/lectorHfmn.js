// Lector del archivo .hfmn con dos pestañas:
//  - Hexadecimal: los bytes del archivo, con cada zona de un color (usa bytesHfmn y zonas).
//  - Bits: cada carácter del texto con su código de Huffman debajo (usa texto y codigos).
// Recibe el ResultadoHuffman ya calculado

import { crearPaginador } from './paginador.js';
import { simboloVisible } from './tablaCodigos.js';

const BYTES_POR_FILA = 16;
const FILAS_POR_PAGINA = 24;
const BYTES_POR_PAGINA = BYTES_POR_FILA * FILAS_POR_PAGINA;
const CARACTERES_POR_PAGINA_BITS = 80;

// Nombre legible de cada zona (los nombres internos vienen de docs/formato-hfmn.md).
const NOMBRES_ZONA = {
  firma: 'Firma',
  version: 'Versión',
  relleno: 'Bits de relleno',
  longitudMetadatos: 'Longitud de metadatos',
  metadatos: 'Metadatos',
  totalCaracteres: 'Total de caracteres',
  simbolosDistintos: 'Símbolos distintos',
  tabla: 'Tabla de frecuencias',
  datos: 'Datos comprimidos',
};

function elemento(etiqueta, clase, texto) {
  const e = document.createElement(etiqueta);
  if (clase) e.className = clase;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

// Pestaña hexadecimal 
function crearPanelHex(resultado) {
  const bytes = resultado.bytesHfmn;
  const zonas = resultado.zonas;
  const panel = elemento('div', 'lectorHfmn-panel');

  // Si dos zonas no tienen bytes (p. ej. datos de un texto vacío) simplemente no aparecen en el visor.
  const zonaDe = (i) => zonas.find((z) => i >= z.inicio && i < z.fin);   
  const visor = elemento('div', 'lectorHfmn-visor');

  const paginador = crearPaginador(Math.ceil(bytes.length / BYTES_POR_PAGINA), (numero) => {
    const base = (numero - 1) * BYTES_POR_PAGINA;
    const fragmento = document.createDocumentFragment();

    for (let fila = 0; fila < FILAS_POR_PAGINA; fila++) {
      const inicio = base + fila * BYTES_POR_FILA;
      if (inicio >= bytes.length) break;

      const linea = elemento('div', 'lectorHfmn-fila');
      linea.append(elemento('span', 'lectorHfmn-posicion', inicio.toString(16).toUpperCase().padStart(8, '0')));
      const hex = elemento('span', 'lectorHfmn-hex');
      const ascii = elemento('span', 'lectorHfmn-ascii');

      for (let j = 0; j < BYTES_POR_FILA; j++) {
        const i = inicio + j;
        if (i >= bytes.length) {   // última fila incompleta: se rellena con huecos para alinear
          hex.append(elemento('span', 'lectorHfmn-byte lectorHfmn-hueco', '  '));
          continue;
        }
        const zona = zonaDe(i);
        const clase = 'lectorHfmn-zona-' + zona.nombre;
        const titulo = `${NOMBRES_ZONA[zona.nombre]} · byte ${i}`;
        const celdaHex = elemento('span', `lectorHfmn-byte ${clase}`, bytes[i].toString(16).toUpperCase().padStart(2, '0'));
        celdaHex.title = titulo;
        hex.append(celdaHex);
        // Solo se muestran los caracteres imprimibles de ASCII; el resto es un punto.
        const imprimible = bytes[i] >= 32 && bytes[i] <= 126;
        const celdaAscii = elemento('span', clase, imprimible ? String.fromCharCode(bytes[i]) : '·');
        celdaAscii.title = titulo;
        ascii.append(celdaAscii);
      }
      linea.append(hex, ascii);
      fragmento.append(linea);
    }
    visor.replaceChildren(fragmento);
  });

  // Leyenda: un botón por zona. Al hacer clic salta a la página donde empieza.
  const leyenda = elemento('div', 'lectorHfmn-leyenda');
  for (const zona of zonas) {
    const longitud = zona.fin - zona.inicio;
    const rango = longitud === 0 ? 'sin bytes' : longitud === 1 ? `byte ${zona.inicio}` : `bytes ${zona.inicio}–${zona.fin - 1}`;
    const boton = elemento('button', `lectorHfmn-chip lectorHfmn-zona-${zona.nombre}`);
    boton.type = 'button';
    boton.append(elemento('span', 'lectorHfmn-chip-nombre', NOMBRES_ZONA[zona.nombre]), elemento('span', 'lectorHfmn-chip-rango', rango));
    boton.addEventListener('click', () => paginador.ir(Math.floor(zona.inicio / BYTES_POR_PAGINA) + 1));
    leyenda.append(boton);
  }

  panel.append(leyenda, paginador.elemento, visor);
  paginador.ir(1);
  return panel;
}

// Pestaña de bits 
function crearPanelBits(resultado) {
  const panel = elemento('div', 'lectorHfmn-panel');
  const { texto, codigos, totalBits, bitsRelleno } = resultado;

  const totalCaracteres = codigos.reduce((suma, c) => suma + c.frecuencia, 0);
  if (totalCaracteres === 0) {
    panel.append(elemento('p', 'lectorHfmn-vacio', 'El texto está vacío: no hay bits que mostrar.'));
    return panel;
  }

  // Map codePoint -> código , para buscar el código de cada carácter.
  const codigoDe = new Map(codigos.map((c) => [c.codePoint, c.codigo]));

  const bitsDatos = totalBits + bitsRelleno;
  panel.append(elemento('p', 'lectorHfmn-resumen',
    `${totalBits.toLocaleString('es-MX')} bits útiles + ${bitsRelleno} de relleno = ${(bitsDatos / 8).toLocaleString('es-MX')} bytes de datos`));

  const visor = elemento('div', 'lectorHfmn-bits');
  const totalPaginas = Math.ceil(totalCaracteres / CARACTERES_POR_PAGINA_BITS);

  const paginador = crearPaginador(totalPaginas, (numero) => {
    const desde = (numero - 1) * CARACTERES_POR_PAGINA_BITS;
    const hasta = Math.min(desde + CARACTERES_POR_PAGINA_BITS, totalCaracteres);
    const fragmento = document.createDocumentFragment();

   
    // No se convierte el texto en lista porque un libro de 3 MB gastaría mucha memoria.
    let indice = 0;
    for (const caracter of texto) {
      if (indice >= hasta) break;
      if (indice >= desde) {
        const celda = elemento('div', 'lectorHfmn-celda ' + (indice % 2 === 0 ? 'lectorHfmn-par' : 'lectorHfmn-impar'));
        celda.append(
          elemento('span', 'lectorHfmn-caracter', simboloVisible(caracter)),
          elemento('code', 'lectorHfmn-codigo', codigoDe.get(caracter.codePointAt(0))),
        );
        fragmento.append(celda);
      }
      indice += 1;
    }

    // En la última página se agregan los bits de relleno que completan el último byte.
    if (numero === totalPaginas && bitsRelleno > 0) {
      const celda = elemento('div', 'lectorHfmn-celda lectorHfmn-relleno');
      celda.title = 'Bits en cero que completan el último byte';
      celda.append(elemento('span', 'lectorHfmn-caracter', 'relleno'), elemento('code', 'lectorHfmn-codigo', '0'.repeat(bitsRelleno)));
      fragmento.append(celda);
    }
    visor.replaceChildren(fragmento);
  });

  panel.append(paginador.elemento, visor);
  paginador.ir(1);
  return panel;
}

// Contenedor con pestañas 
const PESTANAS = [
  { id: 'hex', titulo: 'Hexadecimal', crear: crearPanelHex },
  { id: 'bits', titulo: 'Bits', crear: crearPanelBits },
];

export function montarLectorHfmn(contenedor, resultado) {
  contenedor.replaceChildren();

  if (!resultado?.bytesHfmn || resultado.bytesHfmn.length === 0) {
    contenedor.append(elemento('p', 'lectorHfmn-vacio', 'Todavía no hay un archivo .hfmn que mostrar.'));
    return { destruir: () => contenedor.replaceChildren() };
  }

  const barra = elemento('div', 'lectorHfmn-pestanas');
  barra.setAttribute('role', 'tablist');
  const cuerpo = elemento('div', 'lectorHfmn-cuerpo');
  contenedor.append(barra, cuerpo);

  const botones = new Map();
  const paneles = new Map();   

  function activar(id) {
    for (const [otro, boton] of botones) {
      boton.setAttribute('aria-selected', String(otro === id));
      boton.classList.toggle('lectorHfmn-pestana-activa', otro === id);
    }
    if (!paneles.has(id)) paneles.set(id, PESTANAS.find((p) => p.id === id).crear(resultado));
    cuerpo.replaceChildren(paneles.get(id));
  }

  for (const pestana of PESTANAS) {
    const boton = elemento('button', 'lectorHfmn-pestana', pestana.titulo);
    boton.type = 'button';
    boton.setAttribute('role', 'tab');
    boton.addEventListener('click', () => activar(pestana.id));
    botones.set(pestana.id, boton);
    barra.append(boton);
  }

  activar('hex');
  return { destruir: () => contenedor.replaceChildren() };
}
