import { TIPOS } from '../core/eventos.js';

/*
Reproductor de eventos: toma el arreglo ORIGINAL y la lista de eventos que
generó cualquier algoritmo, y los aplica uno por uno para la animación
*/
export class Reproductor {
  /**
   * @param {Barras} barras   Instancia que dibuja.
   * @param {object} opciones { velocidad: ms entre eventos, alTerminar, alAvanzar }
   */

  constructor(barras, opciones = {}) {
    this.barras = barras;
    this.velocidad = opciones.velocidad ?? 50;
    this.alAvanzar = opciones.alAvanzar ?? (() => {});
    this.alTerminar = opciones.alTerminar ?? (() => {});
    this.temporizador = null;
    this.cargar([], []);
  }

  /** Prepara una nueva animación sin iniciarla. */
  cargar(arregloInicial, eventos) {
    this.pausar();
    this.inicial = [...arregloInicial];
    this.eventos = eventos;
    this.reiniciar();
  }

  /** Vuelve al arreglo original y al evento 0. */
  reiniciar() {
    this.pausar();
    this.arr = [...this.inicial];
    this.indice = 0;
    this.barras.crear(this.arr);
    this.alAvanzar(this.indice, this.eventos.length);
  }

  get enReproduccion() {
    return this.temporizador !== null;
  }

  get terminado() {
    return this.indice >= this.eventos.length;
  }

  reproducir() {
    if (this.enReproduccion || this.terminado) return;
    const tick = () => {
      this.paso();
      if (!this.terminado) this.temporizador = setTimeout(tick, this.velocidad);
    };
    this.temporizador = setTimeout(tick, 0);
  }

  pausar() {
    clearTimeout(this.temporizador);
    this.temporizador = null;
  }

  /** Aplica exactamente UN evento. Sirve para "Paso a paso". */
  paso() {
    if (this.terminado) return;
    const e = this.eventos[this.indice++];
    this.barras.limpiar();

    switch (e.type) {
      case TIPOS.COMPARE:
        this.barras.marcar(e.i, 'comparando');
        this.barras.marcar(e.j, 'comparando');
        break;

      case TIPOS.SWAP:
        [this.arr[e.i], this.arr[e.j]] = [this.arr[e.j], this.arr[e.i]];
        this.barras.altura(e.i, this.arr[e.i]);
        this.barras.altura(e.j, this.arr[e.j]);
        this.barras.marcar(e.i, 'escribiendo');
        this.barras.marcar(e.j, 'escribiendo');
        break;

      case TIPOS.OVERWRITE:
        this.arr[e.i] = e.valor;
        this.barras.altura(e.i, e.valor);
        this.barras.marcar(e.i, 'escribiendo');
        break;

      case TIPOS.DONE:
        this.barras.marcar(e.i, 'ordenado');
        break;

      default:
        console.warn('Evento desconocido:', e);
    }

    this.alAvanzar(this.indice, this.eventos.length);
    if (this.terminado) {
      this.barras.limpiar();
      this.pausar();
      this.alTerminar(this.arr);
    }
  }

  /** Cambia la velocidad incluso a mitad de la animación. */
  setVelocidad(ms) {
    this.velocidad = ms;
  }
}
