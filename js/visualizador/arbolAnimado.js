// AN-02 · Árbol de Huffman dibujado a partir de la lista de pasos.
// Solo lee los pasos (contrato-pasos-arbol.md); no importa nada de js/huffman/.
// Primera versión: dibuja el árbol terminado. La animación (AN-03) y el zoom (AN-04)
// se agregan después sobre esta misma estructura.

import { simboloVisible } from './tablaCodigos.js';

const SVG = 'http://www.w3.org/2000/svg';

// Medidas del dibujo, en unidades del SVG.
const SEPARACION_X = 56;   // ancho que ocupa cada hoja
const SEPARACION_Y = 78;   // distancia vertical entre niveles
const RADIO = 20;          // radio de cada nodo
const MARGEN = 36;

// Crea un elemento SVG con sus atributos (como un dict de Python, pero para el DOM).
function crear(nombre, atributos = {}, texto) {
  const elemento = document.createElementNS(SVG, nombre);
  for (const [clave, valor] of Object.entries(atributos)) elemento.setAttribute(clave, valor);
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

// Convierte la lista de pasos en un diccionario id -> nodo.
// `Map` es el equivalente de `dict` en Python.
function construirNodos(pasos) {
  const nodos = new Map();
  for (const paso of pasos) {
    if (paso.tipo === 'hoja') {
      nodos.set(paso.id, { ...paso, hijos: [] });
    } else {
      // El contrato garantiza que izquierdo y derecho ya aparecieron antes.
      nodos.set(paso.id, { ...paso, hijos: [nodos.get(paso.izquierdo), nodos.get(paso.derecho)] });
    }
  }
  // La última fusión (o la única hoja) es la raíz.
  return { nodos, raiz: nodos.get(pasos[pasos.length - 1].id) };
}

// Asigna posición a cada nodo:
//  - las hojas se reparten de izquierda a derecha (recorrido en orden);
//  - cada nodo interno queda centrado sobre sus dos hijos;
//  - la profundidad decide la altura.
// Devuelve el número de hojas y la profundidad máxima.
function acomodar(raiz) {
  let siguienteHoja = 0;
  let profundidadMaxima = 0;

  function visitar(nodo, profundidad) {
    nodo.y = MARGEN + profundidad * SEPARACION_Y;
    profundidadMaxima = Math.max(profundidadMaxima, profundidad);
    if (nodo.hijos.length === 0) {
      nodo.x = MARGEN + siguienteHoja * SEPARACION_X;
      siguienteHoja += 1;
    } else {
      const [izq, der] = nodo.hijos;
      visitar(izq, profundidad + 1);
      visitar(der, profundidad + 1);
      nodo.x = (izq.x + der.x) / 2;
    }
  }
  // Recursión: la profundidad de un árbol de Huffman es chica (pocas decenas
  // incluso con un libro), así que no hay riesgo de pasarse del límite de la pila.
  visitar(raiz, 0);
  return { hojas: siguienteHoja, profundidad: profundidadMaxima };
}

function dibujarArbol(contenedor, pasos) {
  contenedor.replaceChildren();
  const { nodos, raiz } = construirNodos(pasos);
  const { hojas, profundidad } = acomodar(raiz);

  const ancho = MARGEN * 2 + Math.max(hojas - 1, 0) * SEPARACION_X;
  const alto = MARGEN * 2 + profundidad * SEPARACION_Y + 18;

  const svg = crear('svg', {
    class: 'arbolAnimado-svg',
    viewBox: `0 0 ${ancho} ${alto}`,
    width: ancho,
    height: alto,
    role: 'img',
    'aria-label': 'Árbol de Huffman',
  });

  // Primero las ramas, para que los nodos queden encima.
  const ramas = crear('g', { class: 'arbolAnimado-ramas' });
  for (const nodo of nodos.values()) {
    nodo.hijos.forEach((hijo, indice) => {
      ramas.append(crear('line', { x1: nodo.x, y1: nodo.y, x2: hijo.x, y2: hijo.y, class: 'arbolAnimado-rama' }));
      // Etiqueta 0 / 1 a medio camino, corrida hacia el lado de su hijo.
      const lado = indice === 0 ? -1 : 1;
      ramas.append(
        crear('text', {
          x: (nodo.x + hijo.x) / 2 + lado * 9,
          y: (nodo.y + hijo.y) / 2 - 3,
          class: 'arbolAnimado-bit',
          'text-anchor': 'middle',
        }, String(indice)),
      );
    });
  }
  svg.append(ramas);

  const capaNodos = crear('g', { class: 'arbolAnimado-nodos' });
  for (const nodo of nodos.values()) {
    const esHoja = nodo.hijos.length === 0;
    const grupo = crear('g', {
      class: 'arbolAnimado-nodo ' + (esHoja ? 'arbolAnimado-hoja' : 'arbolAnimado-interno'),
      transform: `translate(${nodo.x} ${nodo.y})`,
    });
    grupo.append(crear('circle', { r: RADIO }));
    if (esHoja) {
      // Hoja: el carácter dentro y su frecuencia debajo.
      grupo.append(crear('text', { class: 'arbolAnimado-simbolo', 'text-anchor': 'middle', dy: '0.35em' }, simboloVisible(nodo.simbolo)));
      grupo.append(crear('text', { class: 'arbolAnimado-frecuencia', 'text-anchor': 'middle', y: RADIO + 15 }, nodo.frecuencia.toLocaleString('es-MX')));
    } else {
      // Nodo interno: solo su frecuencia (suma de los hijos).
      grupo.append(crear('text', { class: 'arbolAnimado-frecuencia', 'text-anchor': 'middle', dy: '0.35em' }, nodo.frecuencia.toLocaleString('es-MX')));
    }
    capaNodos.append(grupo);
  }
  svg.append(capaNodos);

  const marco = document.createElement('div');
  marco.className = 'arbolAnimado-marco';
  marco.append(svg);
  contenedor.append(marco);
}

export function montarArbol(contenedor, pasos, opciones = { msPorPaso: 400 }) {
  contenedor.replaceChildren();

  // Caso borde del contrato: texto vacío, sin pasos.
  if (!pasos || pasos.length === 0) {
    const vacio = document.createElement('p');
    vacio.className = 'arbolAnimado-vacio';
    vacio.textContent = 'Texto vacío: no hay árbol que dibujar.';
    contenedor.append(vacio);
    return { reproducir() {}, detener() {}, destruir: () => contenedor.replaceChildren() };
  }

  // `opciones` se usará en AN-03 (msPorPaso). Por ahora se dibuja el árbol final.
  dibujarArbol(contenedor, pasos);

  return {
    reproducir: () => dibujarArbol(contenedor, pasos),
    detener() {},
    destruir: () => contenedor.replaceChildren(),
  };
}
