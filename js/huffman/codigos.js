export function generarCodigos(raiz) {
  const mapa = new Map();

  if (raiz === null) return mapa;

  if (raiz.izquierdo === undefined) {
    mapa.set(raiz.codePoint, '0');
    return mapa;
  }

  recorrer(raiz, '', mapa);
  return mapa;
}

function recorrer(nodo, camino, mapa) {
  if (nodo.izquierdo === undefined) {
    mapa.set(nodo.codePoint, camino);
    return;
  }

  recorrer(nodo.izquierdo, camino + '0', mapa); 
  recorrer(nodo.derecho, camino + '1', mapa);
}

export function tablaCodigos(frecuencias, mapa) {
  return frecuencias.map(f => ({
    simbolo: f.simbolo,
    codePoint: f.codePoint,
    frecuencia: f.frecuencia,
    codigo: mapa.get(f.codePoint)
  }));
}