import { contarFrecuencias } from './frecuencias.js';
import { construirArbol } from './arbol.js';
import { generarCodigos, tablaCodigos } from './codigos.js';
import { codificar, decodificar } from './codificador.js';
import { escribirHfmn, leerHfmn } from './formatoHfmn.js';

function calcularTamanos(texto, datos, bytesHfmn) {
  const original = new TextEncoder().encode(texto).length;
  const hfmn = bytesHfmn.length;

  const razon = original === 0 ? 0 : hfmn / original;
  const ahorro = original === 0 ? 0 : 1 - razon;

  return {
    original,
    datos: datos.length,
    hfmn,
    razon: Math.round(razon * 10000) / 10000,
    ahorro: Math.round(ahorro * 10000) / 10000
  };
}

export function comprimir(texto, metadatos = {}) {
  const frecuencias = contarFrecuencias(texto);
  const { raiz, pasos } = construirArbol(frecuencias);
  const mapa = generarCodigos(raiz);
  const codigos = tablaCodigos(frecuencias, mapa);

  const { datos, totalBits, bitsRelleno } = codificar(texto, mapa);
  const totalCaracteres = [...texto].length;
  const bytesHfmn = escribirHfmn({ metadatos, frecuencias, totalCaracteres, datos, bitsRelleno });

  const { zonas } = leerHfmn(bytesHfmn);

  return {
    texto, metadatos, frecuencias, pasos, codigos,
    bytesHfmn, bitsRelleno, totalBits, zonas,
    tamanos: calcularTamanos(texto, datos, bytesHfmn)
  };
}

export function descomprimir(bytesHfmn) {
  const leido = leerHfmn(bytesHfmn); 

  const { raiz, pasos } = construirArbol(leido.frecuencias);
  const mapa = generarCodigos(raiz);
  const codigos = tablaCodigos(leido.frecuencias, mapa);
  const texto = decodificar(leido.datos, raiz, leido.totalCaracteres);

  return {
    texto,
    metadatos: leido.metadatos,
    frecuencias: leido.frecuencias,
    pasos, codigos,
    bytesHfmn,
    bitsRelleno: leido.bitsRelleno,
    totalBits: leido.datos.length * 8 - leido.bitsRelleno,
    zonas: leido.zonas,
    tamanos: calcularTamanos(texto, leido.datos, bytesHfmn)
  };
}