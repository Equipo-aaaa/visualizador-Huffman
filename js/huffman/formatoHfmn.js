export function escribirHfmn({ metadatos = {}, frecuencias, totalCaracteres, datos, bitsRelleno }) {
  const bytesMetadatos = new TextEncoder().encode(JSON.stringify(metadatos));
  const longitudMetadatos = bytesMetadatos.length;

  if (longitudMetadatos > 65535) {
    throw new Error('Los metadatos son demasiado largos (máximo 65535 bytes)');
  }

  const k = frecuencias.length; 

  const bytes = new Uint8Array(16 + longitudMetadatos + 8 * k + datos.length);

  const vista = new DataView(bytes.buffer);

  bytes.set([0x48, 0x46, 0x4D, 0x4E], 0);      
  vista.setUint8(4, 1);                         
  vista.setUint8(5, bitsRelleno);              
  vista.setUint16(6, longitudMetadatos, true);  
  bytes.set(bytesMetadatos, 8);                  

  let pos = 8 + longitudMetadatos;

  vista.setUint32(pos, totalCaracteres, true);
  pos += 4;
  vista.setUint32(pos, k, true); 
  pos += 4;

  for (const f of frecuencias) {
    vista.setUint32(pos, f.codePoint, true);
    vista.setUint32(pos + 4, f.frecuencia, true);
    pos += 8;
  }

  bytes.set(datos, pos);
  return bytes;
}

export function leerHfmn(bytes) {
  if (bytes.length < 16) {
    throw new Error('El archivo es demasiado corto para ser un .hfmn');
  }

  const vista = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const firma = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (firma !== 'HFMN') {
    throw new Error('El archivo no es un .hfmn');
  }

  const version = vista.getUint8(4);
  if (version !== 1) {
    throw new Error('Versión de .hfmn no soportada');
  }

  const bitsRelleno = vista.getUint8(5);
  if (bitsRelleno > 7) {
    throw new Error('Los bits de relleno deben estar entre 0 y 7');
  }

  const longitudMetadatos = vista.getUint16(6, true);
  const inicioTotal = 8 + longitudMetadatos;
  if (inicioTotal + 8 > bytes.length) {
    throw new Error('El archivo está incompleto: los metadatos no caben');
  }

  let metadatos;
  try {
    const texto = new TextDecoder('utf-8', { fatal: true }).decode(bytes.slice(8, inicioTotal));
    metadatos = JSON.parse(texto);
  } catch {
    throw new Error('Los metadatos del archivo no son un JSON válido');
  }

  const totalCaracteres = vista.getUint32(inicioTotal, true);
  const k = vista.getUint32(inicioTotal + 4, true);

  const inicioTabla = inicioTotal + 8;
  const inicioDatos = inicioTabla + 8 * k;
  if (inicioDatos > bytes.length) {
    throw new Error('El archivo está incompleto: la tabla de frecuencias no cabe');
  }

  const frecuencias = [];
  let sumaFrecuencias = 0;
  for (let i = 0; i < k; i++) {
    const codePoint = vista.getUint32(inicioTabla + 8 * i, true);
    const frecuencia = vista.getUint32(inicioTabla + 8 * i + 4, true);

    if (codePoint > 0x10FFFF) {
      throw new Error('La tabla de frecuencias tiene un carácter inválido');
    }

    frecuencias.push({ codePoint, simbolo: String.fromCodePoint(codePoint), frecuencia });
    sumaFrecuencias += frecuencia;
  }

  if (sumaFrecuencias !== totalCaracteres) {
    throw new Error('La suma de las frecuencias no coincide con el total de caracteres');
  }

  const datos = bytes.slice(inicioDatos);

  const zonas = [
    { nombre: 'firma', inicio: 0, fin: 4 },
    { nombre: 'version', inicio: 4, fin: 5 },
    { nombre: 'relleno', inicio: 5, fin: 6 },
    { nombre: 'longitudMetadatos', inicio: 6, fin: 8 },
    { nombre: 'metadatos', inicio: 8, fin: inicioTotal },
    { nombre: 'totalCaracteres', inicio: inicioTotal, fin: inicioTotal + 4 },
    { nombre: 'simbolosDistintos', inicio: inicioTotal + 4, fin: inicioTabla },
    { nombre: 'tabla', inicio: inicioTabla, fin: inicioDatos },
    { nombre: 'datos', inicio: inicioDatos, fin: bytes.length }
  ];

  return { version, metadatos, frecuencias, totalCaracteres, bitsRelleno, datos, zonas };
}