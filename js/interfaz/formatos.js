// Funciones compartidas por resumen.js e inspector.js para escribir tamaños y
// nombres de archivo de la misma forma en las dos vistas.
// Diego Antonio Espinosa Salinas

// Crea un elemento con su clase y su texto. textContent y no innerHTML, para
// que un título con "<" o ">" se muestre como texto y no como HTML.
export function crear(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

export function formatearNumero(numero) {
  return numero.toLocaleString('es-MX');
}

// 2,225,777 bytes se lee mejor como "2.12 MB". Se usa 1024 porque así lo
// cuentan Windows y el explorador de archivos.
export function formatearBytes(bytes) {
  if (bytes < 1024) {
    return `${formatearNumero(bytes)} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toLocaleString('es-MX', { maximumFractionDigits: 1 })} KB`;
  }
  return `${(bytes / (1024 * 1024)).toLocaleString('es-MX', { maximumFractionDigits: 2 })} MB`;
}

// 0.4552 → "45.5 %"
export function formatearPorcentaje(fraccion) {
  return `${(fraccion * 100).toLocaleString('es-MX', { maximumFractionDigits: 1 })} %`;
}

// Describe el ahorro a partir de los tamaños. En un texto muy corto el .hfmn
// sale más grande que el original, porque además de los datos guarda la
// cabecera y la tabla de frecuencias. Se compara hfmn con original y no el
// signo de ahorro, porque con un texto vacío no se puede dividir entre 0.
export function describirAhorro({ original, hfmn, ahorro }) {
  if (original === 0) {
    return { tipo: 'vacio', titulo: 'Texto vacío', valor: '—', detalle: 'El .hfmn solo guarda la cabecera' };
  }
  if (hfmn > original) {
    const diferencia = hfmn - original;
    return {
      tipo: 'crecio',
      titulo: 'Crecimiento',
      valor: formatearPorcentaje(hfmn / original - 1),
      detalle: `${formatearNumero(diferencia)} bytes más: el texto es muy corto para comprimirlo`,
    };
  }
  const ahorrados = original - hfmn;
  return {
    tipo: 'ahorro',
    titulo: 'Reducción',
    valor: formatearPorcentaje(ahorro),
    detalle: `${formatearNumero(ahorrados)} bytes ahorrados (${formatearBytes(ahorrados)})`,
  };
}

// Quita los caracteres que Windows no acepta en un nombre de archivo
// (\ / : * ? " < > | y los de control) y lo recorta para que no quede enorme.
function limpiarNombre(base, respaldo) {
  const limpio = base.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '').trim().slice(0, 80);
  return limpio || respaldo;
}

// Nombre del .hfmn que se descarga, a partir del título del libro
export function nombreHfmn(metadatos) {
  const base = metadatos.titulo || metadatos.nombreArchivo?.replace(/\.txt$/i, '') || 'texto';
  return `${limpiarNombre(base, 'texto')}.hfmn`;
}

// Nombre del .txt recuperado al descomprimir
export function nombreTxt(base) {
  return `${limpiarNombre(base.replace(/\.(txt|hfmn)$/i, ''), 'texto-descomprimido')}.txt`;
}
