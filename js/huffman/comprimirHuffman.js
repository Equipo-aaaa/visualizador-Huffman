import { contarFrecuencias } from './frecuencias.js';
import { construirArbol } from './arbol.js';
import { generarCodigos, tablaCodigos } from './codigos.js';
import { codificar, decodificar } from './codificador.js';
import { escribirHfmn, leerHfmn } from './formatoHfmn.js';

function calcularTamanos(texto, datos, bytesHfmn) {
  return tamanosDesdeBytes(new TextEncoder().encode(texto).length, datos.length, bytesHfmn.length);
}

// Recibe el tamaño original ya medido. El inspector lo usa porque calcula el
// original desde la tabla de frecuencias, sin tener el texto.
function tamanosDesdeBytes(original, bytesDatos, hfmn) {

  const razon = original === 0 ? 0 : hfmn / original;
  const ahorro = original === 0 ? 0 : 1 - razon;

  return {
    original,
    datos: bytesDatos,
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

  const { zonas, version } = leerHfmn(bytesHfmn);

  return {
    texto, metadatos, frecuencias, pasos, codigos,
    bytesHfmn, bitsRelleno, totalBits, zonas,
    version, totalCaracteres,
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
    version: leido.version,
    totalCaracteres: leido.totalCaracteres,
    tamanos: calcularTamanos(texto, leido.datos, bytesHfmn)
  };
}

// Bytes que ocupa un carácter en UTF-8 según su código Unicode
function bytesUtf8(codePoint) {
  if (codePoint < 0x80) return 1;
  if (codePoint < 0x800) return 2;
  if (codePoint < 0x10000) return 3;
  return 4;
}

// Lee la estructura de un .hfmn y reconstruye el árbol y los códigos con su
// tabla, pero NO decodifica el texto: es lo que muestra el inspector antes de
// que el usuario presione Descomprimir. Devuelve la misma forma que
// descomprimir, con texto en null.
export function inspeccionar(bytesHfmn) {
  const leido = leerHfmn(bytesHfmn);

  const { raiz, pasos } = construirArbol(leido.frecuencias);
  const mapa = generarCodigos(raiz);
  const codigos = tablaCodigos(leido.frecuencias, mapa);

  // El archivo guarda cuántas veces aparece cada carácter, y cada carácter
  // ocupa una cantidad fija de bytes en UTF-8: con eso sale el tamaño original
  // exacto sin descomprimir.
  let original = 0;
  for (const { codePoint, frecuencia } of leido.frecuencias) {
    original += bytesUtf8(codePoint) * frecuencia;
  }

  return {
    texto: null,
    metadatos: leido.metadatos,
    frecuencias: leido.frecuencias,
    pasos, codigos,
    bytesHfmn,
    bitsRelleno: leido.bitsRelleno,
    totalBits: leido.datos.length * 8 - leido.bitsRelleno,
    zonas: leido.zonas,
    version: leido.version,
    totalCaracteres: leido.totalCaracteres,
    tamanos: tamanosDesdeBytes(original, leido.datos.length, bytesHfmn.length)
  };
}