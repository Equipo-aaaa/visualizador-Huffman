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