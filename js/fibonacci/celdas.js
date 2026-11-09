/*
Dibuja el arreglo F como una fila de celdas. Tiene los mismos métodos que la
clase Barras (crear, limpiar, marcar y altura), así el Reproductor de los
ordenamientos la puede usar sin ningún cambio.
*/
export class Celdas {
  constructor(contenedor) {
    this.contenedor = contenedor;
    this.celdas = [];
  }

  crear(arreglo) {
    this.contenedor.replaceChildren();
    this.celdas = arreglo.map((valor, i) => {
      const celda = document.createElement('div');
      celda.className = 'celda-fib';

      const indice = document.createElement('span');
      indice.className = 'celda-fib-indice';
      indice.textContent = i;

      const caja = document.createElement('span');
      caja.className = 'celda-fib-valor';

      celda.append(indice, caja);
      this.contenedor.append(celda);

      const elemento = { celda, caja };
      this.pintarValor(elemento, valor);
      return elemento;
    });
  }

  pintarValor({ celda, caja }, valor) {
    const vacia = valor === null;
    caja.textContent = vacia ? '?' : valor;
    celda.classList.toggle('calculada', !vacia);
  }

  // Quita los resaltados del paso anterior. "ordenado" se queda, porque marca
  // la respuesta final cuando la animación ya terminó.
  limpiar() {
    for (const { celda } of this.celdas) {
      celda.classList.remove('comparando', 'escribiendo');
    }
  }

  marcar(i, clase) {
    this.celdas[i].celda.classList.add(clase);
  }

  // Se llama altura para coincidir con Barras; aquí escribe el número en la celda
  altura(i, valor) {
    this.pintarValor(this.celdas[i], valor);
  }
}
