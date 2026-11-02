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

export function decodificar(datos, raiz, totalCaracteres) {
  if (raiz === null || totalCaracteres === 0) return '';

  if (raiz.izquierdo === undefined) return raiz.simbolo.repeat(totalCaracteres);

  const caracteres = [];
  let nodo = raiz;
  const totalBits = datos.length * 8;

  for (let pos = 0; pos < totalBits && caracteres.length < totalCaracteres; pos++) {
    const bit = (datos[pos >> 3] >> (7 - (pos & 7))) & 1;

    nodo = bit === 0 ? nodo.izquierdo : nodo.derecho;

    if (nodo.izquierdo === undefined) {
      caracteres.push(nodo.simbolo);
      nodo = raiz;
    }
  }

  if (caracteres.length < totalCaracteres) {
    throw new Error('Los datos del archivo están incompletos o dañados');
  }

  return caracteres.join('');
}
