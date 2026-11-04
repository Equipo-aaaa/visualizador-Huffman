/*
 * Dibuja el arreglo como barras verticales dentro de un contenedor.
 * Solo se encarga de dibujar las barras, no trata directamente con los ordenamientos ni eventos
 */
export class Barras {
  constructor(contenedor) {
    this.contenedor = contenedor;
    this.elementos = [];
    this.maximo = 1;
  }

  /* Crea una barra por cada valor. Se llama al iniciar o reiniciar. */
  crear(arr) {
    this.contenedor.innerHTML = '';
    this.maximo = Math.max(...arr, 1);
    this.elementos = [];

    for (let i = 0; i < arr.length; i++) {
      const barra = document.createElement('div');
      barra.className = 'barra';
      this.contenedor.appendChild(barra);
      this.elementos.push(barra);
      this.altura(i, arr[i]);
    }
  }

  altura(i, valor) {
    this.elementos[i].style.height = `${(valor / this.maximo) * 100}%`;
    this.elementos[i].title = valor;
  }

  /* Quita los resaltados temporales (comparación / escritura). */
  limpiar() {
    for (const barra of this.elementos) {
      barra.classList.remove('comparando', 'escribiendo');
    }
  }

  marcar(i, clase) {
    this.elementos[i]?.classList.add(clase);
  }
}
