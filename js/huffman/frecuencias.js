export function contarFrecuencias(texto) {
  const conteo = new Map();

  for (const caracter of texto) {
    const veces = conteo.get(caracter) || 0; 
    conteo.set(caracter, veces + 1);
  }

  const frecuencias = [];
  for (const [simbolo, frecuencia] of conteo) {
    frecuencias.push({
      codePoint: simbolo.codePointAt(0), 
      simbolo,
      frecuencia
    });
  }
  frecuencias.sort((a, b) => a.codePoint - b.codePoint);

  return frecuencias;
}