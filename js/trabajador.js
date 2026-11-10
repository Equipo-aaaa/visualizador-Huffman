// Web Worker: corre en un hilo aparte para que comprimir un libro grande no
// congele la página. Es parecido a usar multiprocessing en Python: la página y
// el worker no comparten variables, solo se mandan mensajes.
import { comprimir, descomprimir, inspeccionar } from './huffman/comprimirHuffman.js';

// Huella SHA-256 del texto en UTF-8, como texto hexadecimal de 64 caracteres.
// Es como hashlib.sha256(texto.encode()).hexdigest() en Python. Si un solo byte
// del texto cambia, la huella sale completamente distinta.
// crypto.subtle solo existe en https o localhost; fuera de ahí se omite.
async function calcularSha256(texto) {
  if (!self.crypto?.subtle) return null;
  const bytes = new TextEncoder().encode(texto);
  const huella = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(huella), (b) => b.toString(16).padStart(2, '0')).join('');
}

// Compara dos textos byte por byte en UTF-8
function mismosBytes(textoA, textoB) {
  const a = new TextEncoder().encode(textoA);
  const b = new TextEncoder().encode(textoB);
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

async function atender(mensaje) {
  if (mensaje.tipo === 'comprimir') {
    // La huella del texto original se guarda en los metadatos del .hfmn, para
    // poder comprobar la integridad al descomprimir aunque ya no se tenga el .txt
    const sha256 = await calcularSha256(mensaje.texto);
    const metadatos = sha256 ? { ...mensaje.metadatos, sha256 } : mensaje.metadatos;
    return comprimir(mensaje.texto, metadatos);
  }

  if (mensaje.tipo === 'inspeccionar') {
    // Lee la estructura del archivo sin decodificar el texto
    return inspeccionar(mensaje.bytesHfmn);
  }

  if (mensaje.tipo === 'descomprimir') {
    // Si el archivo no es un .hfmn válido, descomprimir lanza un Error con
    // el motivo en español, y el catch de abajo se lo manda a la página
    const resultado = descomprimir(mensaje.bytesHfmn);

    // Comprobación de integridad: la huella del texto recuperado debe ser igual
    // a la que se guardó al comprimir. Si además la página tiene el texto
    // original (porque se acaba de comprimir), se compara byte por byte.
    const esperado = resultado.metadatos.sha256 ?? null;
    const obtenido = await calcularSha256(resultado.texto);
    resultado.integridad = {
      esperado,
      obtenido,
      coincideHash: esperado && obtenido ? esperado === obtenido : null,
      identicoAlOriginal: typeof mensaje.textoOriginal === 'string'
        ? mismosBytes(mensaje.textoOriginal, resultado.texto)
        : null,
    };
    return resultado;
  }

  throw new Error(`Mensaje no reconocido: ${mensaje.tipo}`);
}

// Los mensajes se atienden uno a la vez y en orden. Como atender es async, sin
// esta cadena un mensaje nuevo podría empezar mientras otro espera su huella,
// y las respuestas llegarían en desorden a la página.
let cola = Promise.resolve();

self.onmessage = (evento) => {
  cola = cola.then(async () => {
    try {
      const resultado = await atender(evento.data);
      self.postMessage({ tipo: 'resultado', resultado });
    } catch (error) {
      // Un error dentro del worker no llega solo a la página: hay que enviarlo
      self.postMessage({ tipo: 'error', mensaje: error.message });
    }
  });
};
