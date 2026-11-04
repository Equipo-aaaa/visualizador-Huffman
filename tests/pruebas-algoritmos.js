import { ALGORITMOS } from '../js/algoritmos/catalogo.js';
import { TIPOS } from '../js/core/eventos.js';

/**
 * Revisa que TODOS los algoritmos del catálogo cumplan el estándar de eventos.
 * Funciona en el navegador (tests/prueba-eventos.html) y en Node:
 *   node tests/pruebas-algoritmos.js
 *
 * Devuelve [{ algoritmo, prueba, ok }, ...].
 */

/** Aplica los eventos sobre una copia, sin DOM (igual que el Reproductor). */
export function aplicarEventos(inicial, eventos) {
  const arr = [...inicial];
  for (const e of eventos) {
    if (e.type === TIPOS.SWAP) [arr[e.i], arr[e.j]] = [arr[e.j], arr[e.i]];
    if (e.type === TIPOS.OVERWRITE) arr[e.i] = e.valor;
  }
  return arr;
}

const iguales = (a, b) => a.length === b.length && a.every((v, k) => v === b[k]);
const aleatorio = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 100) + 1);
const tiposValidos = new Set(Object.values(TIPOS));

export function correrPruebas() {
  const resultados = [];

  for (const alg of ALGORITMOS) {
    if (!alg.fn) {
      resultados.push({ algoritmo: alg.nombre, prueba: 'Implementado', ok: false });
      continue;
    }

    // Casos borde + 100 aleatorios (Stooge con N chico para que no tarde)
    const casos = [[], [7], [1, 2, 3], [3, 2, 1], [4, 4, 4], [2, 1, 2, 1]];
    const nMax = Math.min(alg.maxN, 60);
    for (let k = 0; k < 100; k++) casos.push(aleatorio(Math.floor(Math.random() * nMax)));

    let ordena = true, replay = true, sinEventos = true, unDone = true, noModifica = true, tipos = true;

    for (const c of casos) {
      const copia = [...c];
      const esperado = [...c].sort((a, b) => a - b);
      const ev = [];
      const res = alg.fn(c, ev);

      if (!iguales(c, copia)) noModifica = false;
      if (!iguales(res, esperado)) ordena = false;
      if (!iguales(aplicarEventos(c, ev), res)) replay = false;
      if (!iguales(alg.fn(c), res)) sinEventos = false;
      if (!ev.every((e) => tiposValidos.has(e.type))) tipos = false;

      const marcados = ev.filter((e) => e.type === TIPOS.DONE).map((e) => e.i).sort((a, b) => a - b);
      if (!iguales(marcados, c.map((_, k) => k))) unDone = false;
    }

    const agregar = (prueba, ok) => resultados.push({ algoritmo: alg.nombre, prueba, ok });
    agregar('Ordena casos borde y 100 aleatorios', ordena);
    agregar('No modifica el arreglo original', noModifica);
    agregar('Reproducir los eventos da el mismo resultado', replay);
    agregar('Sin lista de eventos (benchmark) da el mismo resultado', sinEventos);
    agregar('Solo usa tipos del estándar', tipos);
    agregar('Exactamente un done por posición', unDone);
  }
  return resultados;
}

// Si se ejecuta con Node, imprime el reporte.
if (typeof window === 'undefined') {
  const res = correrPruebas();
  for (const r of res) console.log(`${r.ok ? '✔' : '✘'} ${r.algoritmo.padEnd(15)} ${r.prueba}`);
  const fallas = res.filter((r) => !r.ok).length;
  console.log(fallas ? `\n${fallas} prueba(s) fallaron` : `\nTodo bien: ${res.length} pruebas`);
  if (fallas) process.exitCode = 1;
}
