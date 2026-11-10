// Inspector del archivo .hfmn.
// Diego Antonio Espinosa Salinas
// Muestra la estructura de un .hfmn (lo que guarda su cabecera y su tabla) sin
// descomprimirlo. Descomprimir es un paso aparte: el botón llama
// alDescomprimir() y la página avisa el resultado con mostrarDescompresion().
import {
  crear, formatearNumero, formatearBytes, formatearPorcentaje, describirAhorro, nombreTxt,
} from './formatos.js';

const BYTES_DE_MUESTRA = 8;   // primeros bytes de datos que se muestran en binario

function crearDato(nombre, valor, detalle, claseExtra = '') {
  const dato = crear('div', `inspector-dato ${claseExtra}`.trim());
  dato.append(crear('span', 'inspector-nombre', nombre), crear('span', 'inspector-valor', valor));
  if (detalle) dato.append(crear('span', 'inspector-detalle', detalle));
  return dato;
}

// Primeros bytes de la zona de datos, en binario y hexadecimal. Es la parte
// "legible" de los bits comprimidos: los primeros códigos del texto, seguidos.
function muestraBinaria(inspeccion) {
  const zonaDatos = inspeccion.zonas.find((z) => z.nombre === 'datos');
  const datos = inspeccion.bytesHfmn.slice(zonaDatos.inicio, Math.min(zonaDatos.fin, zonaDatos.inicio + BYTES_DE_MUESTRA));
  const bloque = crear('div', 'inspector-muestra');
  bloque.append(crear('span', 'inspector-nombre', `Datos comprimidos: primeros ${datos.length} de ${formatearNumero(zonaDatos.fin - zonaDatos.inicio)} bytes`));

  if (datos.length === 0) {
    bloque.append(crear('code', 'inspector-bits', 'Sin datos: el texto está vacío'));
    return bloque;
  }
  bloque.append(
    crear('code', 'inspector-bits', Array.from(datos, (b) => b.toString(2).padStart(8, '0')).join(' ')),
    // Cada hexadecimal se rellena a 8 espacios para quedar debajo de su byte en binario
    crear('code', 'inspector-hex', Array.from(datos, (b) => b.toString(16).toUpperCase().padStart(2, '0').padEnd(8)).join(' ')),
  );
  return bloque;
}

// archivo = { nombre, datos } donde datos es el resultado de inspeccionar()
export function montarInspector(contenedor, archivo, { alDescomprimir }) {
  contenedor.replaceChildren();

  const info = archivo.datos;
  const { original, hfmn, razon } = info.tamanos;
  const ahorro = describirAhorro(info.tamanos);
  const extension = archivo.nombre.includes('.') ? archivo.nombre.slice(archivo.nombre.lastIndexOf('.')) : '(sin extensión)';
  const { titulo, autor, origen, idGutenberg, sha256 } = info.metadatos;

  // ---- Encabezado: qué archivo es ----
  const encabezado = crear('div', 'inspector-encabezado');
  encabezado.append(
    crear('span', 'inspector-archivo mono', archivo.nombre),
    crear('span', 'inspector-etiqueta', `Extensión ${extension}`),
    crear('span', 'inspector-etiqueta', `Formato HFMN versión ${info.version}`),
  );

  // ---- Datos de la cabecera y la tabla ----
  const datos = crear('div', 'inspector-datos');
  datos.append(
    crearDato('Tamaño original', formatearBytes(original), `${formatearNumero(original)} bytes en UTF-8, calculado con la tabla`),
    crearDato('Tamaño comprimido', formatearBytes(hfmn), `${formatearNumero(hfmn)} bytes del .hfmn`),
    crearDato(ahorro.titulo, ahorro.valor, ahorro.detalle,
      ahorro.tipo === 'ahorro' ? 'inspector-dato--ahorro' : 'inspector-dato--aviso'),
    crearDato('Razón', original === 0 ? '—' : razon.toLocaleString('es-MX', { minimumFractionDigits: 4 }),
      original === 0 ? 'No aplica con un texto vacío' : `El .hfmn ocupa ${formatearPorcentaje(hfmn / original)} del original`),
    crearDato('Símbolos distintos', formatearNumero(info.frecuencias.length), `${formatearNumero(info.totalCaracteres)} caracteres en total`),
    crearDato('Bits codificados', formatearNumero(info.totalBits), `+ ${info.bitsRelleno} bits de relleno en el último byte`),
  );

  // ---- Metadatos guardados en el JSON ----
  const metadatos = crear('dl', 'inspector-metadatos');
  const agregarMetadato = (nombre, valor) => {
    if (valor === undefined || valor === null || valor === '') return;
    metadatos.append(crear('dt', '', nombre), crear('dd', '', String(valor)));
  };
  agregarMetadato('Título', titulo);
  agregarMetadato('Autor', autor);
  agregarMetadato('Origen', origen === 'gutenberg' ? `Project Gutenberg${idGutenberg ? ` (id ${idGutenberg})` : ''}` : origen === 'local' ? 'Archivo .txt subido' : origen);
  agregarMetadato('Huella SHA-256', sha256 ?? 'No incluida: este archivo no se puede verificar');

  // ---- Descompresión ----
  const acciones = crear('div', 'inspector-acciones');
  const botonDescomprimir = crear('button', 'btn btn-terciario inspector-boton');
  botonDescomprimir.type = 'button';
  const icono = crear('i', 'bi bi-box-arrow-up me-2');
  icono.setAttribute('aria-hidden', 'true');
  botonDescomprimir.append(icono, 'Descomprimir');

  const botonTxt = crear('button', 'btn btn-outline-info inspector-boton');
  botonTxt.type = 'button';
  const iconoTxt = crear('i', 'bi bi-download me-2');
  iconoTxt.setAttribute('aria-hidden', 'true');
  botonTxt.append(iconoTxt, 'Descargar .txt');
  botonTxt.hidden = true;
  acciones.append(botonDescomprimir, botonTxt);

  // aria-live hace que un lector de pantalla anuncie el resultado
  const estado = crear('div', 'inspector-estado',
    'Revisa la estructura del archivo y presiona Descomprimir para recuperar el texto.');
  estado.setAttribute('aria-live', 'polite');

  // Los metadatos y la muestra binaria van en un desplegable cerrado, para que
  // a la vista queden los números principales y el botón Descomprimir
  const detalles = crear('details', 'inspector-detalles');
  detalles.append(crear('summary', 'inspector-resumen-detalles', 'Detalles del archivo: metadatos y primeros bytes'), metadatos, muestraBinaria(info));

  contenedor.append(encabezado, datos, detalles, acciones, estado);

  // ---- Estado ----
  let textoRecuperado = null;

  function ponerEstado(clase, ...lineas) {
    estado.className = `inspector-estado ${clase}`.trim();
    estado.replaceChildren(...lineas.map((linea) => crear('p', '', linea)));
  }

  botonDescomprimir.addEventListener('click', () => {
    botonDescomprimir.disabled = true;
    ponerEstado('', 'Descomprimiendo…');
    alDescomprimir();
  });

  // Guarda el texto como archivo. El Blob se escribe en UTF-8, así que los
  // acentos y la ñ se conservan.
  botonTxt.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([textoRecuperado], { type: 'text/plain;charset=utf-8' }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreTxt(titulo || archivo.nombre);
    enlace.click();
    // Se libera después, para no cancelar la descarga que acaba de empezar
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  return {
    mostrarDescompresion(resultado) {
      textoRecuperado = resultado.texto;
      botonTxt.hidden = false;
      botonDescomprimir.disabled = false;

      const recuperados = `Se recuperaron ${formatearNumero(resultado.totalCaracteres)} caracteres (${formatearBytes(resultado.tamanos.original)}).`;
      const { coincideHash, identicoAlOriginal, obtenido } = resultado.integridad ?? {};

      if (coincideHash === false || identicoAlOriginal === false) {
        ponerEstado('inspector-estado--error', recuperados,
          '✗ Integridad: el texto recuperado NO coincide con el original.');
        return;
      }
      if (coincideHash === null && identicoAlOriginal === null) {
        ponerEstado('inspector-estado--aviso', recuperados,
          'Integridad no verificable: este archivo no guarda la huella SHA-256 del texto original.');
        return;
      }

      const comprobaciones = [];
      if (coincideHash) comprobaciones.push('la huella SHA-256 del texto recuperado es igual a la guardada en el archivo');
      if (identicoAlOriginal) comprobaciones.push('es idéntico byte por byte al texto que se comprimió');
      ponerEstado('inspector-estado--ok', recuperados,
        `✓ Integridad verificada: ${comprobaciones.join(', y ')}.`,
        ...(obtenido ? [`SHA-256: ${obtenido}`] : []));
    },

    mostrarError(mensaje) {
      botonDescomprimir.disabled = false;
      ponerEstado('inspector-estado--error', `No se pudo descomprimir: ${mensaje}`);
    },

    destruir() {
      contenedor.replaceChildren();
    },
  };
}
