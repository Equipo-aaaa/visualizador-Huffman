// DI-05 · Resumen de la compresión y descarga del .hfmn.
// Diego Antonio Espinosa Salinas
// Solo muestra lo que ya viene en el resultado: comprimir() calcula los tamaños
// en resultado.tamanos y arma el archivo en resultado.bytesHfmn.
import {
  crear, formatearNumero, formatearBytes, formatearPorcentaje, describirAhorro, nombreHfmn,
} from './formatos.js';

// Una tarjeta con su nombre arriba y el valor grande abajo
function crearTarjeta(nombre, valor, detalle, claseExtra = '') {
  const tarjeta = crear('div', `resumen-tarjeta ${claseExtra}`.trim());
  tarjeta.append(
    crear('span', 'resumen-nombre', nombre),
    crear('span', 'resumen-valor', valor),
  );
  if (detalle) {
    tarjeta.append(crear('span', 'resumen-detalle', detalle));
  }
  return tarjeta;
}

// alInspeccionar es opcional: si se pasa, aparece el botón que lleva al inspector
export function montarResumen(contenedor, resultado, { alInspeccionar } = {}) {
  contenedor.replaceChildren();

  const { original, hfmn, razon } = resultado.tamanos;
  const nombreArchivo = nombreHfmn(resultado.metadatos);
  const ahorro = describirAhorro(resultado.tamanos);
  // Si el resultado no trae el total (como el JSON de ejemplo), sale de sumar las frecuencias
  const totalCaracteres = resultado.totalCaracteres
    ?? resultado.frecuencias.reduce((suma, f) => suma + f.frecuencia, 0);
  const claseAhorro = ahorro.tipo === 'ahorro' ? 'resumen-tarjeta--ahorro' : 'resumen-tarjeta--aviso';

  // ---- Tarjetas ----
  const tarjetas = crear('div', 'resumen-tarjetas');
  tarjetas.append(
    crearTarjeta('Original', formatearBytes(original),
      `${formatearNumero(original)} bytes en UTF-8`),
    crearTarjeta('Archivo .hfmn', formatearBytes(hfmn),
      `${formatearNumero(hfmn)} bytes`),
    crearTarjeta(ahorro.titulo, ahorro.valor, ahorro.detalle, claseAhorro),
    crearTarjeta('Símbolos distintos', formatearNumero(resultado.frecuencias.length),
      `en ${formatearNumero(totalCaracteres)} caracteres`),
  );

  // ---- Barra de proporción ----
  // El ancho de la barra es el tamaño del .hfmn comparado con el original
  // (máximo 100 %, por si el archivo salió más grande o el texto está vacío).
  const proporcion = original === 0 ? 1 : hfmn / original;
  const barra = crear('div', 'resumen-barra');
  const relleno = crear('div', 'resumen-barra-relleno');
  relleno.style.width = `${Math.min(proporcion, 1) * 100}%`;
  barra.append(relleno);
  barra.setAttribute('role', 'img');
  barra.setAttribute('aria-label', original === 0
    ? 'El texto original está vacío'
    : `El .hfmn ocupa ${formatearPorcentaje(proporcion)} del tamaño original`);

  // La razón es hfmn / original: menos de 1 significa que el archivo se redujo
  const textoRazon = original === 0
    ? 'Razón de compresión: no aplica con un texto vacío'
    : `Razón de compresión: ${razon.toLocaleString('es-MX', { minimumFractionDigits: 4 })} · el .hfmn ocupa ${formatearPorcentaje(proporcion)} del original`;
  const notas = crear('div', 'resumen-notas');
  notas.append(crear('p', 'resumen-nota', textoRazon));
  if (resultado.metadatos.sha256) {
    notas.append(crear('p', 'resumen-nota',
      'Se guardó la huella SHA-256 del texto en el archivo, para comprobar su integridad al descomprimirlo.'));
  }

  // ---- Descarga ----
  // Un Blob es un archivo que vive en la memoria del navegador, y createObjectURL
  // le da una dirección temporal. Con el atributo download, el enlace guarda el
  // archivo en lugar de abrirlo, parecido a open(nombre, 'wb').write(bytes).
  const blob = new Blob([resultado.bytesHfmn], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);

  const descarga = crear('div', 'resumen-descarga');
  const enlace = crear('a', 'btn btn-terciario resumen-boton');
  enlace.href = url;
  enlace.download = nombreArchivo;
  const icono = crear('i', 'bi bi-download me-2');
  icono.setAttribute('aria-hidden', 'true');
  enlace.append(icono, 'Descargar .hfmn');
  descarga.append(enlace);

  if (alInspeccionar) {
    const inspeccionar = crear('button', 'btn btn-outline-info resumen-boton');
    inspeccionar.type = 'button';
    const iconoLupa = crear('i', 'bi bi-search me-2');
    iconoLupa.setAttribute('aria-hidden', 'true');
    inspeccionar.append(iconoLupa, 'Inspeccionar el .hfmn');
    inspeccionar.addEventListener('click', alInspeccionar);
    descarga.append(inspeccionar);
  }
  descarga.append(crear('span', 'resumen-archivo mono', nombreArchivo));

  contenedor.append(tarjetas, barra, notas, descarga);

  return {
    destruir() {
      // La dirección del Blob ocupa memoria hasta que se libera. Sin esto, cada
      // libro comprimido dejaría su .hfmn guardado en el navegador.
      URL.revokeObjectURL(url);
      contenedor.replaceChildren();
    },
  };
}
