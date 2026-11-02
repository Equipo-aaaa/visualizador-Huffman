import { contarFrecuencias } from '../js/huffman/frecuencias.js';
import { ColaPrioridad } from '../js/huffman/colaPrioridad.js';
import { construirArbol } from '../js/huffman/arbol.js';
import { escribirHfmn, leerHfmn } from '../js/huffman/formatoHfmn.js';
import { comprimir, descomprimir } from '../js/huffman/comprimirHuffman.js';

let aprobadas = 0;
let fallidas = 0;

function escribir(linea) {
  console.log(linea);
  if (typeof document !== 'undefined') {
    const salida = document.getElementById('resultado');
    if (salida) salida.textContent += linea + '\n';
  }
}

function probar(nombre, condicion) {
  if (condicion) {
    aprobadas++;
    escribir(`  ✔ ${nombre}`);
  } else {
    fallidas++;
    escribir(`  ✘ FALLÓ: ${nombre}`);
  }
}

const iguales = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const aHex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

async function leerBytes(ruta) {
  const url = new URL('../' + ruta, import.meta.url);
  if (typeof window === 'undefined') {
    const { readFile } = await import('node:fs/promises');
    return new Uint8Array(await readFile(url));
  }
  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error(`No se pudo cargar ${ruta} (${respuesta.status})`);
  return new Uint8Array(await respuesta.arrayBuffer());
}

async function leerTexto(ruta) {
  return new TextDecoder('utf-8', { ignoreBOM: true }).decode(await leerBytes(ruta));
}

function verificarTexto(nombre, texto) {
  escribir(`\n[${nombre}]`);
  const caracteres = [...texto].length;
  const resultado = comprimir(texto);

  let recuperado = null;
  try {
    recuperado = descomprimir(resultado.bytesHfmn);
  } catch (error) {
    escribir(`  (descomprimir lanzó: ${error.message})`);
  }
  probar('descomprimir(comprimir(t)) devuelve el mismo texto', recuperado !== null && recuperado.texto === texto);

  const k = resultado.frecuencias.length;
  const hojas = resultado.pasos.filter(p => p.tipo === 'hoja').length;
  const fusiones = resultado.pasos.filter(p => p.tipo === 'fusion').length;
  probar('k hojas y k-1 fusiones', hojas === k && fusiones === Math.max(k - 1, 0));

  const suma = resultado.frecuencias.reduce((total, f) => total + f.frecuencia, 0);
  probar('las frecuencias suman el total de caracteres', suma === caracteres);

  let hayPrefijo = false;
  for (const x of resultado.codigos) {
    for (const y of resultado.codigos) {
      if (x !== y && y.codigo.startsWith(x.codigo)) hayPrefijo = true;
    }
  }
  probar('ningún código es prefijo de otro', !hayPrefijo);

  const bitsEsperados = resultado.codigos.reduce((total, c) => total + c.frecuencia * c.codigo.length, 0);
  const datosBytes = resultado.tamanos.datos;
  probar('totalBits coincide con frecuencia × largo del código', resultado.totalBits === bitsEsperados);
  probar('bytes de datos y relleno cuadran con los bits',
    datosBytes === Math.ceil(bitsEsperados / 8) && datosBytes * 8 - bitsEsperados === resultado.bitsRelleno);

  const zonas = resultado.zonas;
  let sinHuecos = zonas[0].inicio === 0 && zonas[zonas.length - 1].fin === resultado.bytesHfmn.length;
  for (let i = 1; i < zonas.length; i++) {
    if (zonas[i].inicio !== zonas[i - 1].fin) sinHuecos = false;
  }
  probar('las zonas cubren el .hfmn sin huecos', sinHuecos);
  probar('tamanos.hfmn es el largo real del archivo', resultado.tamanos.hfmn === resultado.bytesHfmn.length);

  probar('descomprimir reconstruye los mismos pasos, códigos y frecuencias',
    recuperado !== null &&
    iguales(recuperado.pasos, resultado.pasos) &&
    iguales(recuperado.codigos, resultado.codigos) &&
    iguales(recuperado.frecuencias, resultado.frecuencias));

  probar('comprimir es determinista (mismos bytes)', aHex(comprimir(texto).bytesHfmn) === aHex(resultado.bytesHfmn));

  return resultado;
}

escribir('=== Piezas sueltas ===');

escribir('\n[contarFrecuencias]');
const frecEmoji = contarFrecuencias('🚀🚀a');
probar('un emoji cuenta como un carácter', frecEmoji.length === 2 && frecEmoji.find(f => f.simbolo === '🚀').frecuencia === 2);
const frecEnie = contarFrecuencias('ñañ');
probar('la ñ cuenta como un carácter', frecEnie.find(f => f.simbolo === 'ñ').frecuencia === 2);
const ordenado = contarFrecuencias('zña🚀a').map(f => f.codePoint);
probar('salen ordenadas por codePoint', iguales(ordenado, [...ordenado].sort((a, b) => a - b)));

escribir('\n[ColaPrioridad]');
const cola = new ColaPrioridad((a, b) => a.frecuencia - b.frecuencia || a.id - b.id);
[[4, 2], [0, 5], [3, 1], [1, 2], [2, 1]].forEach(([id, frecuencia]) => cola.insertar({ id, frecuencia }));
const salida = [];
while (!cola.estaVacia()) { const n = cola.extraer(); salida.push(`${n.frecuencia},${n.id}`); }
probar('con frecuencias iguales sale primero el menor id', salida.join(' ') === '1,2 1,3 2,1 2,4 5,0');
probar('extraer en una cola vacía devuelve undefined', cola.extraer() === undefined);


escribir('\n=== abracadabra contra el contrato ===');

const ejemploPasos = JSON.parse(await leerTexto('ejemplos/abracadabra-pasos.json'));
const ejemploCodigos = JSON.parse(await leerTexto('ejemplos/abracadabra-codigos.json'));
const ejemploResultado = JSON.parse(await leerTexto('ejemplos/abracadabra-resultado.json'));
const ejemploHfmn = await leerBytes('ejemplos/abracadabra.hfmn');

const abra = verificarTexto('abracadabra', 'abracadabra');
const abraConMeta = comprimir('abracadabra', ejemploResultado.metadatos);

probar('los pasos son idénticos al ejemplo', iguales(abra.pasos, ejemploPasos));
probar('los códigos son idénticos al ejemplo', iguales(abra.codigos, ejemploCodigos));
probar('los datos son 6E 8A DC, con 23 bits útiles y 1 de relleno',
  aHex(ejemploHfmn.slice(131)) === '6E 8A DC' && abra.totalBits === 23 && abra.bitsRelleno === 1);
probar('el .hfmn generado es idéntico byte a byte al del ejemplo', aHex(abraConMeta.bytesHfmn) === aHex(ejemploHfmn));
for (const campo of ['texto', 'metadatos', 'frecuencias', 'pasos', 'codigos', 'bitsRelleno', 'totalBits', 'zonas', 'tamanos']) {
  probar(`comprimir.${campo} igual al ejemplo`, iguales(abraConMeta[campo], ejemploResultado[campo]));
}
const abraLeido = descomprimir(ejemploHfmn);
probar('descomprimir(.hfmn del ejemplo) recupera abracadabra', abraLeido.texto === 'abracadabra');
probar('las zonas leídas son las del ejemplo', iguales(abraLeido.zonas, ejemploResultado.zonas));


escribir('\n=== Casos borde ===');

const vacio = verificarTexto('texto vacío', '');
probar('no hay pasos ni códigos', vacio.pasos.length === 0 && vacio.codigos.length === 0);
probar('no hay bits ni bytes de datos', vacio.totalBits === 0 && vacio.tamanos.datos === 0 && vacio.bitsRelleno === 0);
probar('el .hfmn mide 18 bytes (solo cabecera)', vacio.bytesHfmn.length === 18);

const uno = verificarTexto('un solo símbolo', 'a');
probar('una hoja, cero fusiones y código "0"', uno.pasos.length === 1 && uno.codigos[0].codigo === '0');

const iguales10 = verificarTexto('todos los caracteres iguales', 'aaaa');
probar('código "0", datos 00 y 4 bits de relleno',
  iguales10.codigos[0].codigo === '0' && aHex(leerHfmn(iguales10.bytesHfmn).datos) === '00' &&
  iguales10.totalBits === 4 && iguales10.bitsRelleno === 4 && iguales10.tamanos.datos === 1);
probar('el .hfmn mide 27 bytes', iguales10.bytesHfmn.length === 27);

verificarTexto('acentos', 'áéíóú ÁÉÍÓÚ àèìòù üç');

const enie = verificarTexto('ñ', 'El niño comió piña en España, ñandú');
probar('la ñ tiene su propio código', enie.codigos.some(c => c.simbolo === 'ñ'));

const emoji = verificarTexto('emoji', 'hola 🚀😀🚀 mundo 🌎');
probar('cada emoji es un solo símbolo', emoji.frecuencias.find(f => f.simbolo === '🚀').frecuencia === 2);

const saltos = verificarTexto('saltos de línea \\r\\n', 'a\r\nb');
probar('\\r y \\n son dos caracteres distintos (no se normalizan)',
  saltos.frecuencias.find(f => f.simbolo === '\r').frecuencia === 1 &&
  saltos.frecuencias.find(f => f.simbolo === '\n').frecuencia === 1 &&
  saltos.totalBits > 0 && saltos.frecuencias.reduce((t, f) => t + f.frecuencia, 0) === 4);
verificarTexto('mezcla de saltos', 'línea 1\r\nlínea 2\r\n\r\nlínea 4\n');


escribir('\n=== Archivos alterados lanzan Error en español ===');

function probarAlterado(descripcion, alterar, mensajeEsperado) {
  const copia = ejemploHfmn.slice();
  alterar(copia);
  try {
    leerHfmn(copia);
    probar(`${descripcion}`, false);
  } catch (error) {
    probar(`${descripcion} → "${error.message}"`, error instanceof Error && error.message === mensajeEsperado);
  }
}

probarAlterado('firma cambiada', b => { b[0] = 0x58; }, 'El archivo no es un .hfmn');
probarAlterado('versión 2', b => { b[4] = 2; }, 'Versión de .hfmn no soportada');
probarAlterado('relleno 9', b => { b[5] = 9; }, 'Los bits de relleno deben estar entre 0 y 7');
probarAlterado('metadatos gigantes', b => { b[6] = 0xFF; b[7] = 0xFF; }, 'El archivo está incompleto: los metadatos no caben');
probarAlterado('JSON roto', b => { b[8] = 0x7E; }, 'Los metadatos del archivo no son un JSON válido');
probarAlterado('frecuencia alterada', b => { b[95] = 9; }, 'La suma de las frecuencias no coincide con el total de caracteres');

try { leerHfmn(ejemploHfmn.slice(0, 10)); probar('archivo corto', false); }
catch (e) { probar(`archivo corto → "${e.message}"`, e.message === 'El archivo es demasiado corto para ser un .hfmn'); }

try { leerHfmn(ejemploHfmn.slice(0, 100)); probar('archivo truncado', false); }
catch (e) { probar(`archivo truncado → "${e.message}"`, e.message === 'El archivo está incompleto: la tabla de frecuencias no cabe'); }

const conDatosCortos = comprimir('en un lugar de la mancha de cuyo nombre no quiero acordarme').bytesHfmn;
try { descomprimir(conDatosCortos.slice(0, conDatosCortos.length - 3)); probar('datos incompletos', false); }
catch (e) { probar(`datos incompletos → "${e.message}"`, e.message === 'Los datos del archivo están incompletos o dañados'); }


escribir('\n=== Libro real (tests/datos/libro.txt) ===');

let libro = null;
try {
  libro = await leerTexto('tests/datos/libro.txt');
} catch (error) {
  probar(`se pudo leer tests/datos/libro.txt (${error.message})`, false);
}

if (libro !== null) {
  escribir(`  (${[...libro].length} caracteres, ${new TextEncoder().encode(libro).length} bytes)`);
  const resultadoLibro = verificarTexto('libro real', libro);
  probar('el .hfmn pesa menos que el original (aquí sí se comprime)', resultadoLibro.tamanos.hfmn < resultadoLibro.tamanos.original);
  probar('el ahorro es positivo', resultadoLibro.tamanos.ahorro > 0);
  escribir(`  Original: ${resultadoLibro.tamanos.original} bytes · .hfmn: ${resultadoLibro.tamanos.hfmn} bytes · ahorro: ${(resultadoLibro.tamanos.ahorro * 100).toFixed(1)} %`);
}


escribir(`\n=== ${aprobadas} pruebas aprobadas, ${fallidas} fallidas ===`);
if (typeof process !== 'undefined') process.exitCode = fallidas > 0 ? 1 : 0;