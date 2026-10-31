// Árbol de Huffman a partir de la lista de pasos (contrato-pasos-arbol.md).
//  - Dibujo del árbol final en SVG (tarea "Dibujar el árbol final").
//  - Animación de la construcción (tarea "Animación de la construcción del árbol").
// Solo lee los pasos; no importa nada de js/huffman/.

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

// Convierte la lista de pasos en nodos enlazados.
// `Map` es el equivalente de `dict` en Python: id -> nodo.
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
  return {
    nodos,
    hojas: pasos.filter((p) => p.tipo === 'hoja').map((p) => nodos.get(p.id)),
    fusiones: pasos.filter((p) => p.tipo === 'fusion'),
    // La última fusión (o la única hoja) es la raíz.
    raizFinal: nodos.get(pasos[pasos.length - 1].id),
  };
}

// Asigna posición a cada nodo de un "bosque" (lista de raíces):
//  - las hojas se reparten de izquierda a derecha, pasando de un árbol al siguiente;
//  - cada nodo interno queda centrado sobre sus dos hijos;
//  - la profundidad (contada desde la raíz de su propio árbol) decide la altura.
// Con una sola raíz esto es exactamente el árbol final. Devuelve la profundidad máxima.
function acomodar(raices) {
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
  for (const raiz of raices) visitar(raiz, 0);
  return profundidadMaxima;
}

// Recorre el bosque y devuelve todos los nodos que hay que dibujar.
function nodosVisibles(raices) {
  const visibles = [];
  const pila = [...raices];
  while (pila.length > 0) {
    const nodo = pila.pop();
    visibles.push(nodo);
    pila.push(...nodo.hijos);
  }
  return visibles;
}

// Dibuja un bosque en un SVG nuevo y lo devuelve.
// `resaltados`: nodos que se acaban de fusionar; `nuevo`: el nodo que resultó.
function dibujarBosque(raices, { ancho, alto }, resaltados = [], nuevo = null) {
  acomodar(raices);
  const visibles = nodosVisibles(raices);

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
  for (const nodo of visibles) {
    nodo.hijos.forEach((hijo, indice) => {
      ramas.append(crear('line', { x1: nodo.x, y1: nodo.y, x2: hijo.x, y2: hijo.y, class: 'arbolAnimado-rama' }));
      // Etiqueta 0 / 1 a medio camino, corrida hacia el lado de su hijo.
      const lado = indice === 0 ? -1 : 1;
      ramas.append(crear('text', {
        x: (nodo.x + hijo.x) / 2 + lado * 9,
        y: (nodo.y + hijo.y) / 2 - 3,
        class: 'arbolAnimado-bit',
        'text-anchor': 'middle',
      }, String(indice)));
    });
  }
  svg.append(ramas);

  const capaNodos = crear('g', { class: 'arbolAnimado-nodos' });
  for (const nodo of visibles) {
    const esHoja = nodo.hijos.length === 0;
    let clases = 'arbolAnimado-nodo ' + (esHoja ? 'arbolAnimado-hoja' : 'arbolAnimado-interno');
    if (resaltados.includes(nodo)) clases += ' arbolAnimado-resaltado';
    if (nodo === nuevo) clases += ' arbolAnimado-nuevo';

    const grupo = crear('g', { class: clases, transform: `translate(${nodo.x} ${nodo.y})` });
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
  return svg;
}

// Texto corto para describir un nodo en el mensaje de cada paso.
function describir(nodo) {
  const frecuencia = nodo.frecuencia.toLocaleString('es-MX');
  return nodo.hijos.length === 0 ? `«${simboloVisible(nodo.simbolo)}» (${frecuencia})` : `nodo (${frecuencia})`;
}

function crearBoton(texto) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'btn btn-sm btn-outline-info';
  boton.textContent = texto;
  return boton;
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

  const msPorPaso = opciones?.msPorPaso ?? 400;
  const { nodos, hojas, fusiones, raizFinal } = construirNodos(pasos);

  // El tamaño del SVG se calcula con el árbol final y no cambia durante la animación,
  // para que el dibujo no "salte" de tamaño en cada paso.
  const profundidadFinal = acomodar([raizFinal]);
  const medidas = {
    ancho: MARGEN * 2 + Math.max(hojas.length - 1, 0) * SEPARACION_X,
    alto: MARGEN * 2 + profundidadFinal * SEPARACION_Y + 18,
  };

  // --- Estructura de la vista ---
  const barra = document.createElement('div');
  barra.className = 'arbolAnimado-barra';
  const botonPausa = crearBoton('Pausar');
  const botonReiniciar = crearBoton('Reiniciar');
  const botonFinal = crearBoton('Ir al final');
  const estado = document.createElement('span');
  estado.className = 'arbolAnimado-estado';
  barra.append(botonPausa, botonReiniciar, botonFinal, estado);

  const marco = document.createElement('div');
  marco.className = 'arbolAnimado-marco';
  contenedor.append(barra, marco);

  // --- Estado de la animación ---
  let raices = [];            // el "bosque": árboles que todavía no se han unido
  let paso = 0;               // cuántas fusiones llevamos
  let temporizador = null;
  let ultimaFusion = null;    // { izq, der, nuevo } del paso recién aplicado

  function reiniciarBosque() {
    raices = [...hojas];      // [...lista] es como lista.copy() en Python
    paso = 0;
    ultimaFusion = null;
  }

  // Quita los dos nodos fusionados del bosque y pone el nuevo donde estaba el primero.
  function aplicarFusion() {
    const fusion = fusiones[paso];
    const izq = nodos.get(fusion.izquierdo);
    const der = nodos.get(fusion.derecho);
    const nuevo = nodos.get(fusion.id);
    const posicion = Math.min(raices.indexOf(izq), raices.indexOf(der));
    raices = raices.filter((r) => r !== izq && r !== der);
    raices.splice(posicion, 0, nuevo);   // splice(pos, 0, x) inserta, como lista.insert(pos, x)
    ultimaFusion = { izq, der, nuevo };
    paso += 1;
  }

  const terminado = () => paso >= fusiones.length;

  function dibujar() {
    const resaltados = ultimaFusion ? [ultimaFusion.izq, ultimaFusion.der, ultimaFusion.nuevo] : [];
    marco.replaceChildren(dibujarBosque(raices, medidas, resaltados, ultimaFusion?.nuevo ?? null));

    if (paso === 0) {
      estado.textContent = `${hojas.length} símbolos, cada uno con su frecuencia`;
    } else {
      const { izq, der, nuevo } = ultimaFusion;
      estado.textContent = `Paso ${paso} de ${fusiones.length}: ${describir(izq)} y ${describir(der)} forman un nodo de ${nuevo.frecuencia.toLocaleString('es-MX')}`;
    }
    if (terminado()) estado.textContent += fusiones.length > 0 ? ' · árbol terminado' : '';

    botonPausa.textContent = temporizador !== null ? 'Pausar' : terminado() ? 'Repetir' : 'Continuar';
  }

  function programar() {
    temporizador = setTimeout(avanzar, msPorPaso);
  }

  function avanzar() {
    temporizador = null;
    aplicarFusion();
    if (!terminado()) programar();
    dibujar();
  }

  function detener() {
    clearTimeout(temporizador);
    temporizador = null;
    dibujar();
  }

  function reproducir() {
    clearTimeout(temporizador);
    reiniciarBosque();
    if (!terminado()) programar();
    dibujar();
  }

  botonPausa.addEventListener('click', () => {
    if (temporizador !== null) detener();
    else if (terminado()) reproducir();
    else { programar(); dibujar(); }
  });
  botonReiniciar.addEventListener('click', reproducir);
  botonFinal.addEventListener('click', () => {
    clearTimeout(temporizador);
    temporizador = null;
    while (!terminado()) aplicarFusion();
    ultimaFusion = null;      // el último cuadro es el árbol limpio, sin resaltados
    dibujar();
  });

  // El contrato pide que arranque sola al montarse.
  reproducir();

  return {
    reproducir,
    detener,
    destruir() {
      clearTimeout(temporizador);   // si no se limpia, el temporizador seguiría dibujando en un contenedor ajeno
      temporizador = null;
      contenedor.replaceChildren();
    },
  };
}
