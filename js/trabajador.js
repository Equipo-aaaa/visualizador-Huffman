// Web Worker: corre en un hilo aparte para que comprimir un libro grande no
// congele la página. Es parecido a usar multiprocessing en Python: la página y
// el worker no comparten variables, solo se mandan mensajes.
import { comprimir } from './huffman/comprimirHuffman.js';

self.onmessage = (evento) => {
  const mensaje = evento.data;

  try {
    if (mensaje.tipo === 'comprimir') {
      const resultado = comprimir(mensaje.texto, mensaje.metadatos);
      self.postMessage({ tipo: 'resultado', resultado });
    } else {
      // 'descomprimir' se agrega en DI-06
      throw new Error(`Mensaje no reconocido: ${mensaje.tipo}`);
    }
  } catch (error) {
    // Un error dentro del worker no llega solo a la página: hay que enviarlo
    self.postMessage({ tipo: 'error', mensaje: error.message });
  }
};
