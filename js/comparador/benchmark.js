import { TIPOS } from '../core/eventos.js';

/*
  BENCHMARK - mide cada algoritmo con arreglos de distinto tamaño.

  Mide dos tipos de cosas:
    - Tiempo (ms): depende de la computadora y del navegador.
    - Conteos (comparaciones, intercambios, escrituras): exactos, siempre
      dan lo mismo para el mismo arreglo y coinciden con el análisis teórico.
*/

/*
 Lista de tamaños
 tamanosDeMuestra(20, 20, 100) → [20, 40, 60, 80, 100]
*/
export function tamanosDeMuestra(inicio, paso, fin) {
  const tamanos = [];
  for (let n = inicio; n <= fin; n += paso) tamanos.push(n);
  return tamanos;
}


const MAX_N = 10000;
const MAX_PUNTOS = 50;
/*
 Revisa los tres campos del generador. Devuelve un texto con el error, o null si todo está bien
*/
export function validarRango(inicio, paso, fin) {
  if (!Number.isInteger(inicio) || !Number.isInteger(paso) || !Number.isInteger(fin)) {
    return 'Los tres campos deben ser números enteros.';
  }
  if (inicio < 1 || paso < 1) return 'Inicio y paso deben ser mayores o iguales a 1.';
  if (fin < inicio) return 'El fin debe ser mayor o igual al inicio.';
  if (fin > MAX_N) return `El fin no puede pasar de ${MAX_N} elementos.`;
  const puntos = Math.floor((fin - inicio) / paso) + 1;
  if (puntos > MAX_PUNTOS) return `Se generarían ${puntos} arreglos; el máximo es ${MAX_PUNTOS}. Aumenta el paso.`;
  return null;
}

/*
  Tiempo promedio (ms) de UNA ejecución de 'fn' sobre 'arreglo'
 
  El reloj del navegador (performance.now) solo mide de 0.1 ms en 0.1 ms, y
  ordenar 20 elementos tarda mucho menos. Por eso se repite el ordenamiento
  hasta juntar al menos 'tiempoMinimo' ms y se divide entre las repeticiones.
  Se llama SIN lista de eventos (fn(arreglo)) para medir solo el algoritmo.
*/
export function medir(fn, arreglo, tiempoMinimo = 5) {
  let repeticiones = 0;
  const inicio = performance.now();
  let transcurrido = 0;

  do {
    fn(arreglo);  // el algoritmo trabaja sobre una copia: 'arreglo' no cambia        
    repeticiones++;
    transcurrido = performance.now() - inicio;
  } while (transcurrido < tiempoMinimo);

  return transcurrido / repeticiones;
}

/*
  Cuenta las operaciones que hace 'fn' al ordenar 'arreglo'
  Los algoritmos llaman a 'eventos.push(...)', que en lugar de crear un arreglo
  real de eventos, solo incrementa los valores de los contadores para no llenar
  la memoria
*/

export function contar(fn, arreglo) {
  const conteo = { comparaciones: 0, intercambios: 0, escrituras: 0 };
  const contador = {
    push(evento) {
      if (evento.type === TIPOS.COMPARE) conteo.comparaciones++;
      else if (evento.type === TIPOS.SWAP) conteo.intercambios++;
      else if (evento.type === TIPOS.OVERWRITE) conteo.escrituras++;
    },
  };
  fn(arreglo, contador);
  return conteo;
}

/* Cede el control al navegador un instante para que redibuje la página. */
const respirar = () => new Promise((resolver) => setTimeout(resolver, 0));

/* Nombres de las métricas que devuelve ejecutarBenchmark. */
export const METRICAS = ['tiempo', 'comparaciones', 'intercambios', 'escrituras'];

/*
 * Ejecuta la comparación completa.
 *
 * @param {object[]} algoritmos  Elementos del catálogo
 * @param {number[][]} arreglos  Un arreglo aleatorio por tamaño. TODOS los
 *                               algoritmos ordenan los mismos arreglos
 * @param {function} alProgreso  (hechos, total) para actualizar la barra
 * @returns {Promise<object>}    Un objeto por métrica:
 *   {
 *     tiempo:        { idAlgoritmo: [ms por tamaño, ...] },
 *     comparaciones: { idAlgoritmo: [conteo por tamaño, ...] },
 *     intercambios:  { ... },
 *     escrituras:    { ... },
 *   }
 *   Un null significa "no se midió" (N demasiado grande para ese algoritmo,
 *   p. ej. Stooge)
*/
export async function ejecutarBenchmark(algoritmos, arreglos, alProgreso = () => {}) {
  const resultados = Object.fromEntries(METRICAS.map((m) => [m, {}]));
  const total = algoritmos.length * arreglos.length;
  let hechos = 0;

  for (const alg of algoritmos) {
    for (const m of METRICAS) resultados[m][alg.id] = [];
    const limite = alg.maxNComparador ?? Infinity;

    // Calentamiento: el navegador optimiza la función después de usarla
    // varias veces. Sin esto, el primer punto (N más chico) salía MÁS alto
    // que el segundo. Se descarta. (Si el arreglo más chico ya rebasa el
    // límite del algoritmo, p. ej. Stooge con N > 500, no se calienta.)
    if (arreglos[0].length <= limite) medir(alg.fn, arreglos[0], 2);

    for (const arreglo of arreglos) {
      if (arreglo.length <= limite) {
        const conteo = contar(alg.fn, arreglo);
        resultados.tiempo[alg.id].push(medir(alg.fn, arreglo));
        resultados.comparaciones[alg.id].push(conteo.comparaciones);
        resultados.intercambios[alg.id].push(conteo.intercambios);
        resultados.escrituras[alg.id].push(conteo.escrituras);
      } else {
        for (const m of METRICAS) resultados[m][alg.id].push(null);
      }
      alProgreso(++hechos, total);
      await respirar();     // sin esto la página se congela hasta terminar
    }
  }
  return resultados;
}