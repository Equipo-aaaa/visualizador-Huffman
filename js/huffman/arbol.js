import { ColaPrioridad } from './colaPrioridad.js';

export function construirArbol(frecuencias) {
  const pasos = [];

  const cola = new ColaPrioridad((a, b) => a.frecuencia - b.frecuencia || a.id - b.id);

  for (let i = 0; i < frecuencias.length; i++) {
    const { simbolo, codePoint, frecuencia } = frecuencias[i];

    cola.insertar({ id: i, frecuencia, simbolo, codePoint });
    pasos.push({ tipo: 'hoja', id: i, simbolo, codePoint, frecuencia });
  }

  let siguienteId = frecuencias.length;

  while (cola.tamano > 1) {
    const izquierdo = cola.extraer(); 
    const derecho = cola.extraer();   
    const frecuencia = izquierdo.frecuencia + derecho.frecuencia;


    cola.insertar({ id: siguienteId, frecuencia, izquierdo, derecho });

    pasos.push({
      tipo: 'fusion',
      id: siguienteId,
      izquierdo: izquierdo.id,
      derecho: derecho.id,
      frecuencia
    });

    siguienteId++;
  }

  const raiz = cola.extraer() || null;

  return { raiz, pasos };
}