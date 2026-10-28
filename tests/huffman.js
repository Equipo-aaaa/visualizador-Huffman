import { contarFrecuencias } from '../js/huffman/frecuencias.js';

console.log("=== Prueba 1: Contrato 'abracadabra' ===");
const textoPrueba = "abracadabra";
const resultadoAbra = contarFrecuencias(textoPrueba);

console.table(resultadoAbra);

console.log("\n=== Prueba 2: Definition of Done (ñ y emoji) ===");
const textoEspecial = "año 🚀";
const resultadoEspecial = contarFrecuencias(textoEspecial);
console.table(resultadoEspecial);