export class ColaPrioridad {
  constructor(comparar) {
    this.comparar = comparar; 
    this.elementos = [];     
  }

  get tamano() {
    return this.elementos.length;
  }

  estaVacia() {
    return this.elementos.length === 0;
  }

  insertar(elemento) {
    this.elementos.push(elemento);
    let pos = this.elementos.length - 1;

    while (pos > 0) {
      const padre = Math.floor((pos - 1) / 2);
      if (this.comparar(this.elementos[pos], this.elementos[padre]) >= 0) {
        break;
      }
      this._intercambiar(pos, padre);
      pos = padre;
    }
  }

  extraer() {
    if (this.estaVacia()) return undefined;

    const menor = this.elementos[0];
    const ultimo = this.elementos.pop(); 

    if (this.elementos.length > 0) {
      this.elementos[0] = ultimo;
      let pos = 0;

      while (true) {
        const izquierdo = 2 * pos + 1;
        const derecho = 2 * pos + 2;
        let menorPos = pos;

        if (izquierdo < this.elementos.length &&
            this.comparar(this.elementos[izquierdo], this.elementos[menorPos]) < 0) {
          menorPos = izquierdo;
        }
        if (derecho < this.elementos.length &&
            this.comparar(this.elementos[derecho], this.elementos[menorPos]) < 0) {
          menorPos = derecho;
        }

        if (menorPos === pos) break;
        this._intercambiar(pos, menorPos);
        pos = menorPos;
      }
    }

    return menor;
  }

  _intercambiar(i, j) {
    [this.elementos[i], this.elementos[j]] = [this.elementos[j], this.elementos[i]];
  }
}