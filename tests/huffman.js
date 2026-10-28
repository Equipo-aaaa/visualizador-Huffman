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
