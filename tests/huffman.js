import { codificar } from '../js/huffman/codificador.js';
import { generarCodigos, tablaCodigos } from '../js/huffman/codigos.js';
import { comprimir } from '../js/huffman/comprimirHuffman.js';
import { construirArbol } from '../js/huffman/arbol.js';
import { ColaPrioridad } from '../js/huffman/colaPrioridad.js';
import { contarFrecuencias } from '../js/huffman/frecuencias.js';

console.log("=== Prueba 1: Contrato 'abracadabra' ===");
const textoPrueba = "abracadabra";
const resultadoAbra = contarFrecuencias(textoPrueba);

console.table(resultadoAbra);

console.log("\n=== Prueba 2: Definition of Done (ñ y emoji) ===");
const textoEspecial = "año 🚀";
const resultadoEspecial = contarFrecuencias(textoEspecial);
console.table(resultadoEspecial);

console.log("\n=== Prueba 3: Cola de Prioridad Genérica y Desempate ===");

const compararHuffman = (a, b) => {

    if (a.frecuencia === b.frecuencia) {
        if (a.id < b.id) return -1;
        if (a.id > b.id) return 1;
        return 0;
    }
    return a.frecuencia - b.frecuencia;
};

const cola = new ColaPrioridad(compararHuffman);

cola.insertar({ id: 'z', frecuencia: 2 });
cola.insertar({ id: 'x', frecuencia: 5 });
cola.insertar({ id: 'a', frecuencia: 2 });
cola.insertar({ id: 'm', frecuencia: 1 });

console.log("Extrayendo en orden (esperado: m(1), a(2), z(2), x(5)):");
while (!cola.estaVacia()) {
    console.log(cola.extraer());
}

console.log("\n=== Prueba 4: construir Arbol con 'abracadabra' (DoD) ===");
const arbolAbra = construirArbol(resultadoAbra);
console.table(arbolAbra.pasos);

// Se compara contra el archivo real del contrato, no contra una copia a mano
const respuesta = await fetch('../ejemplos/abracadabra-pasos.json');
const pasosContrato = await respuesta.json();

console.log("¿Pasos idénticos al ejemplo del contrato? (esperado: true):",
    JSON.stringify(arbolAbra.pasos) === JSON.stringify(pasosContrato));
console.log("Raíz (esperado: id 8, frecuencia 11):",
    arbolAbra.raiz.id, arbolAbra.raiz.frecuencia);

console.log("\n=== Prueba 5: k hojas y k-1 fusiones ===");
const hojas = arbolAbra.pasos.filter(p => p.tipo === 'hoja').length;
const fusiones = arbolAbra.pasos.filter(p => p.tipo === 'fusion').length;
console.log("Hojas (esperado: 5):", hojas);
console.log("Fusiones (esperado: 4):", fusiones);

console.log("\n=== Prueba 6: la raíz suma todos los caracteres ===");
const textoLargo = "en un lugar de la mancha ñandú 🚀";
const arbolLargo = construirArbol(contarFrecuencias(textoLargo));
console.log("Frecuencia de la raíz:", arbolLargo.raiz.frecuencia);
console.log("Caracteres del texto (deben ser iguales):", [...textoLargo].length);

console.log("\n=== Prueba 7: casos borde ===");
const arbolVacio = construirArbol(contarFrecuencias(""));
console.log("Texto vacío (esperado: raiz null, pasos []):", arbolVacio.raiz, arbolVacio.pasos);

const arbolUno = construirArbol(contarFrecuencias("aaaa"));
console.log("Un solo carácter (esperado: 1 paso de tipo hoja, raíz 'a'):",
    arbolUno.pasos.length, arbolUno.pasos[0].tipo, arbolUno.raiz.simbolo);

console.log("\n=== Prueba 8: generar códigos con 'abracadabra' (DoD) ===");
const mapaAbra = generarCodigos(arbolAbra.raiz);
const tablaAbra = tablaCodigos(resultadoAbra, mapaAbra);
console.table(tablaAbra);

const respuestaCodigos = await fetch('../ejemplos/abracadabra-codigos.json');
const codigosContrato = await respuestaCodigos.json();
console.log("¿Códigos idénticos al ejemplo del contrato? (esperado: true):",
    JSON.stringify(tablaAbra) === JSON.stringify(codigosContrato));

console.log("\n=== Prueba 9: bits totales ===");
let bitsTotales = 0;
for (const fila of tablaAbra) bitsTotales += fila.frecuencia * fila.codigo.length;
console.log("Bits totales (esperado: 23):", bitsTotales);

console.log("\n=== Prueba 10: ningún código es prefijo de otro (DoD) ===");
let hayPrefijo = false;
for (const x of tablaAbra) {
    for (const y of tablaAbra) {
        if (x !== y && y.codigo.startsWith(x.codigo)) hayPrefijo = true;
    }
}
console.log("¿Hay algún código prefijo de otro? (esperado: false):", hayPrefijo);

console.log("\n=== Prueba 11: casos borde de códigos ===");
console.log("Texto vacío (esperado: 0):", generarCodigos(arbolVacio.raiz).size);
console.log("Un solo carácter 'aaaa' (esperado: '0'):", generarCodigos(arbolUno.raiz).get(97));

console.log("\n=== Prueba 12: comprimir (primera versión) ===");
const respuestaResumen = await fetch('../ejemplos/abracadabra-resultado.json');
const resumenEjemplo = await respuestaResumen.json();
const resultadoComprimir = comprimir("abracadabra", resumenEjemplo.metadatos);

console.log("¿frecuencias iguales al ejemplo? (esperado: true):",
    JSON.stringify(resultadoComprimir.frecuencias) === JSON.stringify(resumenEjemplo.frecuencias));
console.log("¿pasos iguales al ejemplo? (esperado: true):",
    JSON.stringify(resultadoComprimir.pasos) === JSON.stringify(resumenEjemplo.pasos));
console.log("¿códigos iguales al ejemplo? (esperado: true):",
    JSON.stringify(resultadoComprimir.codigos) === JSON.stringify(resumenEjemplo.codigos));
console.log("¿texto y metadatos iguales? (esperado: true):",
    resultadoComprimir.texto === resumenEjemplo.texto &&
    JSON.stringify(resultadoComprimir.metadatos) === JSON.stringify(resumenEjemplo.metadatos));

console.log("\n=== Prueba 13: codificar 'abracadabra' (DoD) ===");
const codificado = codificar("abracadabra", mapaAbra);

const aHex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

console.log("Datos (esperado: 6E 8A DC):", aHex(codificado.datos));
console.log("Bits útiles (esperado: 23):", codificado.totalBits);
console.log("Bits de relleno (esperado: 1):", codificado.bitsRelleno);

console.log("\n=== Prueba 14: comparar con el .hfmn real del contrato ===");
const respuestaHfmn = await fetch('../ejemplos/abracadabra.hfmn');
const bytesHfmn = new Uint8Array(await respuestaHfmn.arrayBuffer());

console.log("Datos del .hfmn real (esperado: 6E 8A DC):", aHex(bytesHfmn.slice(131)));
console.log("¿Mis datos son idénticos a los del archivo? (esperado: true):",
    aHex(codificado.datos) === aHex(bytesHfmn.slice(131)));

console.log("\n=== Prueba 15: casos borde ===");
const vacioCodificado = codificar("", generarCodigos(arbolVacio.raiz));
console.log("Texto vacío (esperado: 0 bytes, 0 bits, relleno 0):",
    vacioCodificado.datos.length, vacioCodificado.totalBits, vacioCodificado.bitsRelleno);

const unoCodificado = codificar("aaaa", generarCodigos(arbolUno.raiz));
console.log("'aaaa' (esperado: 00, 4 bits, relleno 4):",
    aHex(unoCodificado.datos), unoCodificado.totalBits, unoCodificado.bitsRelleno);

console.log("\n=== Prueba 16: texto con ñ y emoji ===");
const arbolEspecial = construirArbol(resultadoEspecial);
const codificadoEspecial = codificar(textoEspecial, generarCodigos(arbolEspecial.raiz));
console.log("¿Bytes y relleno cuadran con los bits? (esperado: true):",
    codificadoEspecial.datos.length * 8 ===
    codificadoEspecial.totalBits + codificadoEspecial.bitsRelleno);