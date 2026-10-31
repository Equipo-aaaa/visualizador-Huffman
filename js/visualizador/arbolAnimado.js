// Árbol de Huffman a partir de la lista de pasos (contrato-pasos-arbol.md).
//  - Dibujo del árbol final en SVG (tarea "Dibujar el árbol final").
//  - Animación de la construcción (tarea "Animación de la construcción del árbol").
// Solo lee los pasos; no importa nada de js/huffman/.

import { simboloVisible } from './tablaCodigos.js';

const SVG = 'http://www.w3.org/2000/svg';

// Medidas del dibujo, en unidades del SVG.
const SEPARACION_X = 56;  
const SEPARACION_Y = 78;   
const RADIO = 20;          
const MARGEN = 36;
const FACTOR_ZOOM = 1.25;   // cuánto acerca o aleja cada clic o vuelta de la rueda
const ZOOM_MAXIMO = 8;      // veces que se puede acercar respecto a 1 píxel por unidad

// Crea un elemento SVG con sus atributos 
function crear(nombre, atributos = {}, texto) {
  const elemento = document.createElementNS(SVG, nombre);
  for (const [clave, valor] of Object.entries(atributos)) elemento.setAttribute(clave, valor);
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

// Convierte la lista de pasos en nodos enlazados.
function construirNodos(pasos) {
  const nodos = new Map();
  for (const paso of pasos) {
    if (paso.tipo === 'hoja') {
      nodos.set(paso.id, { ...paso, hijos: [] });
    } else {
      nodos.set(paso.id, { ...paso, hijos: [nodos.get(paso.izquierdo), nodos.get(paso.derecho)] });
    }
  }
  return {
    nodos,
    hojas: pasos.filter((p) => p.tipo === 'hoja').map((p) => nodos.get(p.id)),
    fusiones: pasos.filter((p) => p.tipo === 'fusion'),
    // La última fusión es la raíz.
    raizFinal: nodos.get(pasos[pasos.length - 1].id),
  };
}

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
  // Recursión
  for (const raiz of raices) visitar(raiz, 0);
  return profundidadMaxima;
}

// Recorre y devuelve todos los nodos que hay que dibujar.
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

function textoVista(v) {
  return `${v.x} ${v.y} ${v.w} ${v.h}`;
}


function dibujarBosque(raices, vista, resaltados = [], nuevo = null) {
  acomodar(raices);
  const visibles = nodosVisibles(raices);

  const svg = crear('svg', {
    class: 'arbolAnimado-svg',
    viewBox: textoVista(vista),
    role: 'img',
    'aria-label': 'Árbol de Huffman',
  });


  const ramas = crear('g', { class: 'arbolAnimado-ramas' });
  for (const nodo of visibles) {
    nodo.hijos.forEach((hijo, indice) => {
      ramas.append(crear('line', { x1: nodo.x, y1: nodo.y, x2: hijo.x, y2: hijo.y, class: 'arbolAnimado-rama' }));
    
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

  // El tamaño del árbol final se calcula una vez; sirve para "ajustar" la vista y
  // no cambia durante la animación, así el dibujo no salta de tamaño en cada paso.
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
  const botonMas = crearBoton('＋');
  const botonMenos = crearBoton('－');
  const botonAjustar = crearBoton('Ajustar');
  botonMas.setAttribute('aria-label', 'Acercar');
  botonMenos.setAttribute('aria-label', 'Alejar');
  const estado = document.createElement('span');
  estado.className = 'arbolAnimado-estado';
  barra.append(botonPausa, botonReiniciar, botonFinal, botonMas, botonMenos, botonAjustar, estado);

  const marco = document.createElement('div');
  marco.className = 'arbolAnimado-marco';
  marco.tabIndex = 0;   // para poder usar el teclado: + - 0 y flechas
  marco.setAttribute('aria-label', 'Árbol de Huffman. Rueda para acercar, arrastrar para mover.');
  contenedor.append(barra, marco);

  //  Estado de la animación 
  let raices = [];           
  let paso = 0;               // cuántas fusiones llevamos
  let temporizador = null;
  let ultimaFusion = null;    // { izq, der, nuevo } del paso recién aplicado

  function reiniciarBosque() {
    raices = [...hojas];      
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

  // --- Zoom y desplazamiento ---
  let vista = null;       // se calcula la primera vez que se dibuja
  let anchoAjustado = 0;  // ancho de la ventana cuando todo el árbol cabe
  let svgActual = null;

  const tamanoMarco = () => ({ cw: marco.clientWidth || 800, ch: marco.clientHeight || 448 });

  function aplicarVista() {
    svgActual?.setAttribute('viewBox', textoVista(vista));
  }

  // Muestra el árbol completo, centrado. Con un libro quedará muy chico: se acerca con zoom.
  function ajustar() {
    const { cw, ch } = tamanoMarco();
    const escala = Math.max(medidas.ancho / cw, medidas.alto / ch, 0.6);   // 0.6 evita ampliar de más árboles diminutos
    const w = cw * escala;
    const h = ch * escala;
    anchoAjustado = w;
    vista = { x: (medidas.ancho - w) / 2, y: (medidas.alto - h) / 2, w, h };
    aplicarVista();
  }

  // factor < 1 acerca y > 1 aleja. 
  function zoom(factor, px = 0.5, py = 0.5) {
    const { cw } = tamanoMarco();
    const minimo = Math.min(cw / ZOOM_MAXIMO, anchoAjustado);
    const nuevoAncho = Math.min(Math.max(vista.w * factor, minimo), anchoAjustado * 1.5);
    const razon = nuevoAncho / vista.w;
    const nuevoAlto = vista.h * razon;
    vista.x += (vista.w - nuevoAncho) * px;
    vista.y += (vista.h - nuevoAlto) * py;
    vista.w = nuevoAncho;
    vista.h = nuevoAlto;
    aplicarVista();
  }

  marco.addEventListener('wheel', (evento) => {
    evento.preventDefault();   
    const caja = marco.getBoundingClientRect();
    zoom(evento.deltaY < 0 ? 1 / FACTOR_ZOOM : FACTOR_ZOOM,
      (evento.clientX - caja.left) / caja.width, (evento.clientY - caja.top) / caja.height);
  }, { passive: false });

  let arrastre = null;
  marco.addEventListener('pointerdown', (evento) => {
    if (evento.button !== 0) return;
    arrastre = { x: evento.clientX, y: evento.clientY };
    marco.setPointerCapture(evento.pointerId);   
    marco.classList.add('arbolAnimado-arrastrando');
  });
  marco.addEventListener('pointermove', (evento) => {
    if (!arrastre) return;
    const unidadesPorPixel = vista.w / tamanoMarco().cw;
    vista.x -= (evento.clientX - arrastre.x) * unidadesPorPixel;
    vista.y -= (evento.clientY - arrastre.y) * unidadesPorPixel;
    arrastre = { x: evento.clientX, y: evento.clientY };
    aplicarVista();
  });
  const soltar = () => { arrastre = null; marco.classList.remove('arbolAnimado-arrastrando'); };
  marco.addEventListener('pointerup', soltar);
  marco.addEventListener('pointercancel', soltar);

  marco.addEventListener('keydown', (evento) => {
    const paso10 = vista.w * 0.1;
    if (evento.key === '+' || evento.key === '=') zoom(1 / FACTOR_ZOOM);
    else if (evento.key === '-') zoom(FACTOR_ZOOM);
    else if (evento.key === '0') ajustar();
    else if (evento.key === 'ArrowLeft') { vista.x -= paso10; aplicarVista(); }
    else if (evento.key === 'ArrowRight') { vista.x += paso10; aplicarVista(); }
    else if (evento.key === 'ArrowUp') { vista.y -= paso10; aplicarVista(); }
    else if (evento.key === 'ArrowDown') { vista.y += paso10; aplicarVista(); }
    else return;
    evento.preventDefault();
  });
  botonMas.addEventListener('click', () => zoom(1 / FACTOR_ZOOM));
  botonMenos.addEventListener('click', () => zoom(FACTOR_ZOOM));
  botonAjustar.addEventListener('click', ajustar);

  function dibujar() {
    const resaltados = ultimaFusion ? [ultimaFusion.izq, ultimaFusion.der, ultimaFusion.nuevo] : [];
    if (!vista) ajustar();   // primera vez: ya hay tamaño de marco porque está en el DOM
    // El SVG se vuelve a crear en cada paso, pero `vista` se conserva: el zoom no se pierde al animar.
    svgActual = dibujarBosque(raices, vista, resaltados, ultimaFusion?.nuevo ?? null);
    marco.replaceChildren(svgActual);

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
