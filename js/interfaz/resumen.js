// DI-05 · Resumen de la compresión y descarga del .hfmn.
// Diego Antonio Espinosa Salinas
// Solo muestra lo que ya viene en el resultado: comprimir() calcula los tamaños
// en resultado.tamanos y arma el archivo en resultado.bytesHfmn.

// Crea un elemento con su clase y su texto. textContent y no innerHTML, para
// que un título con "<" o ">" se muestre como texto y no como HTML.
function crear(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

// 2,225,777 bytes se lee mejor como "2.12 MB". Se usa 1024 porque así lo
// cuentan Windows y el explorador de archivos.
function formatearBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes.toLocaleString('es-MX')} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toLocaleString('es-MX', { maximumFractionDigits: 1 })} KB`;
  }
  return `${(bytes / (1024 * 1024)).toLocaleString('es-MX', { maximumFractionDigits: 2 })} MB`;
}

// 0.4552 → "45.5 %"
function formatearPorcentaje(fraccion) {
  return `${(fraccion * 100).toLocaleString('es-MX', { maximumFractionDigits: 1 })} %`;
}

// Quita del título los caracteres que Windows no acepta en un nombre de
// archivo (\ / : * ? " < > |) y lo recorta para que no quede enorme.
function nombreDescarga(metadatos) {
  const base = metadatos.titulo || metadatos.nombreArchivo?.replace(/\.txt$/i, '') || 'texto';
  const limpio = base.replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 80);
  return `${limpio || 'texto'}.hfmn`;
}

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

export function montarResumen(contenedor, resultado) {
  contenedor.replaceChildren();

  const { original, hfmn, ahorro } = resultado.tamanos;
  const nombreArchivo = nombreDescarga(resultado.metadatos);

  // ---- Tarjetas de tamaños ----
  const tarjetas = crear('div', 'resumen-tarjetas');

  // En un texto muy corto el .hfmn sale más grande que el original, porque
  // además de los datos guarda la cabecera y la tabla de frecuencias. No es un
  // error: se muestra para explicar que Huffman conviene con textos largos.
  const crecio = ahorro < 0;

  tarjetas.append(
    crearTarjeta('Original', formatearBytes(original),
      `${original.toLocaleString('es-MX')} bytes en UTF-8`),
    crearTarjeta('Archivo .hfmn', formatearBytes(hfmn),
      `${hfmn.toLocaleString('es-MX')} bytes`),
    crecio
      ? crearTarjeta('Crecimiento', formatearPorcentaje(-ahorro),
        'El texto es muy corto para comprimirlo', 'resumen-tarjeta--aviso')
      : crearTarjeta('Ahorro', formatearPorcentaje(ahorro),
        `${formatearBytes(original - hfmn)} menos`, 'resumen-tarjeta--ahorro'),
  );

  // ---- Barra de proporción ----
  // El ancho de la barra es el tamaño del .hfmn comparado con el original
  // (máximo 100 %, por si el archivo salió más grande).
  const barra = crear('div', 'resumen-barra');
  const relleno = crear('div', 'resumen-barra-relleno');
  relleno.style.width = `${Math.min(hfmn / original, 1) * 100}%`;
  barra.append(relleno);
  barra.setAttribute('role', 'img');
  barra.setAttribute('aria-label',
    `El .hfmn ocupa ${formatearPorcentaje(hfmn / original)} del tamaño original`);

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
  descarga.append(enlace, crear('span', 'resumen-archivo mono', nombreArchivo));

  contenedor.append(tarjetas, barra, descarga);

  return {
    destruir() {
      // La dirección del Blob ocupa memoria hasta que se libera. Sin esto, cada
      // libro comprimido dejaría su .hfmn guardado en el navegador.
      URL.revokeObjectURL(url);
      contenedor.replaceChildren();
    },
  };
}
