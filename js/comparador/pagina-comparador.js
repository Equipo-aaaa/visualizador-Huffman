import { ALGORITMOS } from '../algoritmos/catalogo.js';
import { arregloAleatorio, $, formatoMs } from '../core/utilidades.js';
import { tamanosDeMuestra, validarRango, ejecutarBenchmark } from './benchmark.js';

/**
 * PÁGINA 2 — Comparador de Algoritmos
 *
 * Flujo:
 *   1. Leer inicio / paso / fin y calcular los tamaños (20, 40, 60, 80, 100).
 *   2. Generar UN arreglo aleatorio por tamaño.
 *   3. Medir cada algoritmo con esos mismos arreglos: tiempo,
 *      comparaciones, intercambios y escrituras.
 *   4. Dibujar una línea por algoritmo con Chart.js (variable global `Chart`)
 *      para la métrica elegida en los botones de arriba.
 *   5. Las casillas ocultan/muestran líneas; Chart.js reescala el eje Y solo.
 */


// ids de las líneas que el usuario quiere ver. Se recuerda aunque se vuelva
// a ejecutar la medición.
const visibles = new Set(ALGORITMOS.filter((a) => !a.ocultoPorDefecto).map((a) => a.id));

let grafica = null;     // instancia de Chart (se crea con el primer resultado)

// Último resultado medido. Al cambiar de métrica NO se vuelve a medir:
// solo se redibuja con otra parte de estos datos.
let ultimosTamanos = null;
let ultimosResultados = null;

// ---------------------------------------------------------------- Métricas

/**
 * Cómo se muestra cada métrica. Las claves coinciden con las de
 * ejecutarBenchmark (benchmark.js).
 */
const INFO_METRICAS = {
  tiempo: {
    titulo: 'Tiempo de ejecución vs. tamaño (N)',
    subtitulo: 'Cada punto es el tiempo promedio de varias ejecuciones sobre el mismo arreglo.',
    eje: 'Tiempo (ms)',
    tabla: 'Resultados (tiempo)',
    formato: formatoMs,
  },
  comparaciones: {
    titulo: 'Comparaciones vs. tamaño (N)',
    subtitulo: 'Conteo exacto: no depende de la computadora y se puede comparar con el análisis teórico.',
    eje: 'Comparaciones',
    tabla: 'Resultados (comparaciones)',
    formato: formatoConteo,
  },
  intercambios: {
    titulo: 'Intercambios vs. tamaño (N)',
    subtitulo: 'Número de swaps.',
    eje: 'Intercambios',
    tabla: 'Resultados (intercambios)',
    formato: formatoConteo,
  },
  escrituras: {
    titulo: 'Escrituras vs. tamaño (N)',
    subtitulo: 'Valores escritos sin intercambiar.',
    eje: 'Escrituras',
    tabla: 'Resultados (escrituras)',
    formato: formatoConteo,
  },
};

function metricaActual() {
  return document.querySelector('input[name="metrica"]:checked').value;
}

/** Cambia títulos de la página según la métrica elegida. */
function ponerTextosMetrica() {
  const info = INFO_METRICAS[metricaActual()];
  $('tituloMetrica').textContent = info.titulo;
  $('subtituloMetrica').textContent = info.subtitulo;
  $('tituloTabla').textContent = info.tabla;
}

// ---------------------------------------------------------------- Generador

function leerRango() {
  return {
    inicio: Number($('inicio').value),
    paso: Number($('paso').value),
    fin: Number($('fin').value),
  };
}

/** Muestra los chips "N = 20", "N = 40"... o el error, mientras se escribe. */
function vistaPrevia() {
  const { inicio, paso, fin } = leerRango();
  const error = validarRango(inicio, paso, fin);

  $('error').textContent = error ?? '';
  $('btnEjecutar').disabled = error !== null;

  const tamanos = error ? [] : tamanosDeMuestra(inicio, paso, fin);
  $('numPuntos').textContent = tamanos.length;
  $('chips').innerHTML = tamanos.map((n) => `<span class="chip-n">N = ${n}</span>`).join('');
  return error ? null : tamanos;
}

// ---------------------------------------------------------------- Casillas de líneas

function dibujarListaLineas() {
  const lista = $('listaLineas');
  lista.innerHTML = '';

  for (const alg of ALGORITMOS) {
    const fila = document.createElement('label');
    fila.className = 'linea-algoritmo';
    fila.innerHTML = `
      <input class="form-check-input" type="checkbox" ${visibles.has(alg.id) ? 'checked' : ''}>
      <span class="muestra-color" style="background:${alg.color}"></span>
      <span class="flex-grow-1">${alg.nombre}</span>
      <span class="etiqueta-complejidad">${alg.tiempo}</span>`;
    fila.querySelector('input').addEventListener('change', (e) => {
      if (e.target.checked) visibles.add(alg.id);
      else visibles.delete(alg.id);
      aplicarVisibilidad();
    });
    lista.appendChild(fila);
  }
  $('numActivos').textContent = `${visibles.size} activos`;
}

/** Oculta/muestra las líneas según `visibles` y redibuja. */
function aplicarVisibilidad() {
  $('numActivos').textContent = `${visibles.size} activos`;
  if (!grafica) return;
  for (const dataset of grafica.data.datasets) {
    dataset.hidden = !visibles.has(dataset.idAlgoritmo);
  }
  grafica.update();   // Chart.js recalcula el máximo del eje Y con lo visible
}

// ---------------------------------------------------------------- Gráfica

/**
 * @param {number[]} tamanos
 * @param {object} datos  { idAlgoritmo: [valor por tamaño] } de UNA métrica
 * @param {string} metrica  clave de INFO_METRICAS
 */
function dibujarGrafica(tamanos, datos, metrica) {
  const info = INFO_METRICAS[metrica];

  const datasets = ALGORITMOS.map((alg) => ({
    idAlgoritmo: alg.id,                 // campo propio, para encontrarlo después
    label: alg.nombre,
    data: datos[alg.id],
    borderColor: alg.color,
    backgroundColor: alg.color,
    hidden: !visibles.has(alg.id),
    tension: 0.15,                       // curva ligera; más alto exagera los datos
    pointRadius: 4,
    spanGaps: false,                     // si hay null (Stooge con N grande), la línea se corta
  }));

  if (grafica) grafica.destroy();

  grafica = new Chart($('grafica'), {
    type: 'line',
    data: { labels: tamanos, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },   // tooltip con todos los algoritmos de ese N
      plugins: {
        legend: { display: false },                         // ya están las casillas a la izquierda
        tooltip: {
          callbacks: {
            title: (items) => `N = ${items[0].label}`,
            label: (item) => ` ${item.dataset.label}: ${info.formato(item.parsed.y)}`,

          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: 'Tamaño del arreglo (N)' },
        },
        y: {
          type: $('escalaLog').checked ? 'logarithmic' : 'linear',
          title: { display: true, text: info.eje },
          beginAtZero: true,
        },
      },
    },
  });
  aplicarColoresGrafica();
}

/**
 * Chart.js dibuja en un <canvas>, que no entiende variables CSS. Por eso se
 * leen los colores del tema actual (--texto-suave y --borde de estilos.css)
 * y se le pasan a mano. Se llama al crear la gráfica y al cambiar de tema.
 */
function aplicarColoresGrafica() {
  if (!grafica) return;
  const css = getComputedStyle(document.documentElement);
  const texto = css.getPropertyValue('--texto-suave').trim();
  const guia = css.getPropertyValue('--borde').trim();

  for (const eje of Object.values(grafica.options.scales)) {
    eje.title.color = texto;
    eje.ticks.color = texto;
    eje.grid.color = guia;
  }
  grafica.update('none');   // 'none' = sin animación, solo repintar
}

// js/core/tema.js lanza este evento cada vez que se presiona ☀/☾
document.addEventListener('cambio-tema', aplicarColoresGrafica);

function formatoConteo(n) {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('es-MX');       // 12345 → "12,345"
}

// ---------------------------------------------------------------- Tabla

function dibujarTabla(tamanos, datos, metrica) {
  const formato = INFO_METRICAS[metrica].formato;

  $('tablaCabecera').innerHTML =
    `<tr><th>Algoritmo</th><th>Complejidad</th>${tamanos.map((n) => `<th class="text-end">N=${n}</th>`).join('')}</tr>`;

  $('tablaCuerpo').innerHTML = ALGORITMOS.map((alg) => `
    <tr>
      <td><span class="muestra-color d-inline-block me-2" style="background:${alg.color};width:10px;height:10px;border-radius:2px"></span>${alg.nombre}</td>
      <td class="text-secondary">${alg.tiempo}</td>
      ${datos[alg.id].map((v) => `<td class="text-end">${formato(v)}</td>`).join('')}
    </tr>`).join('');
}

/** Redibuja gráfica y tabla con la métrica elegida (sin volver a medir). */
function mostrarMetrica() {
  ponerTextosMetrica();
  if (!ultimosResultados) return;
  const metrica = metricaActual();
  dibujarGrafica(ultimosTamanos, ultimosResultados[metrica], metrica);
  dibujarTabla(ultimosTamanos, ultimosResultados[metrica], metrica);
}

// ---------------------------------------------------------------- Ejecutar

async function ejecutar() {
  const tamanos = vistaPrevia();
  if (!tamanos) return;

  // Bloquear el botón mientras se mide
  $('btnEjecutar').disabled = true;
  $('contenedorProgreso').classList.remove('d-none');

  const arreglos = tamanos.map((n) => arregloAleatorio(n, 1000));

  ultimosResultados = await ejecutarBenchmark(ALGORITMOS, arreglos, (hechos, total) => {
    $('barraProgreso').style.width = `${(hechos / total) * 100}%`;
  });
  ultimosTamanos = tamanos;

  $('sinDatos').classList.add('d-none');
  mostrarMetrica();

  $('btnEjecutar').disabled = false;
  $('contenedorProgreso').classList.add('d-none');
  $('barraProgreso').style.width = '0%';
}

// ---------------------------------------------------------------- Eventos del HTML

for (const id of ['inicio', 'paso', 'fin']) $(id).addEventListener('input', vistaPrevia);
$('btnEjecutar').addEventListener('click', ejecutar);

for (const radio of document.querySelectorAll('input[name="metrica"]')) {
  radio.addEventListener('change', mostrarMetrica);
}

$('escalaLog').addEventListener('change', (e) => {
  if (!grafica) return;
  grafica.options.scales.y.type = e.target.checked ? 'logarithmic' : 'linear';
  grafica.update();
});

// ---------------------------------------------------------------- Inicio

dibujarListaLineas();
ponerTextosMetrica();
vistaPrevia();