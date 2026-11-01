export function codificar(texto, mapa) {
  let totalBits = 0;
  for (const caracter of texto) {
    totalBits += mapa.get(caracter.codePointAt(0)).length;
  }

  const totalBytes = Math.ceil(totalBits / 8);
  const bitsRelleno = totalBytes * 8 - totalBits;

  const datos = new Uint8Array(totalBytes);

  let posicionBit = 0;
  for (const caracter of texto) {
    const codigo = mapa.get(caracter.codePointAt(0));

    for (const bit of codigo) {
      if (bit === '1') {
        const byte = Math.floor(posicionBit / 8);    
        const desplazamiento = 7 - (posicionBit % 8);   
        datos[byte] |= 1 << desplazamiento;             
      }
      posicionBit++;
    }
  }

  return { datos, totalBits, bitsRelleno };
}