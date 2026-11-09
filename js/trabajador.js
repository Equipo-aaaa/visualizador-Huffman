// Web Worker: corre en un hilo aparte para que comprimir un libro grande no
// congele la página. Es parecido a usar multiprocessing en Python: la página y
// el worker no comparten variables, solo se mandan mensajes.
import { comprimir, descomprimir } from './huffman/comprimirHuffman.js';

self.onmessage = (evento) => {
  const mensaje = evento.data;

  try {
    let resultado;

    if (mensaje.tipo === 'comprimir') {
      resultado = comprimir(mensaje.texto, mensaje.metadatos);
    } else if (mensaje.tipo === 'descomprimir') {
      // Si el archivo no es un .hfmn válido, descomprimir lanza un Error con
      // el motivo en español, y el catch de abajo se lo manda a la página
      resultado = descomprimir(mensaje.bytesHfmn);
    } else {
      throw new Error(`Mensaje no reconocido: ${mensaje.tipo}`);
    }

    self.postMessage({ tipo: 'resultado', resultado });
  } catch (error) {
    // Un error dentro del worker no llega solo a la página: hay que enviarlo
    self.postMessage({ tipo: 'error', mensaje: error.message });
  }
};
