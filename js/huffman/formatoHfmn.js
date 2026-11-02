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