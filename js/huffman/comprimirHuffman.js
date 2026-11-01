import { contarFrecuencias } from './frecuencias.js';
import { construirArbol } from './arbol.js';
import { generarCodigos, tablaCodigos } from './codigos.js';

export function comprimir(texto, metadatos = {}) {
  const frecuencias = contarFrecuencias(texto);
  const { raiz, pasos } = construirArbol(frecuencias);
  const mapa = generarCodigos(raiz);
  const codigos = tablaCodigos(frecuencias, mapa);

  return { texto, metadatos, frecuencias, pasos, codigos };
}