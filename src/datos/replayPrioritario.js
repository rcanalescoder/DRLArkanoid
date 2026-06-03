// ============================================================================
//  Replay buffer con prioridad (Prioritized Experience Replay, Schaul 2016)
//  Muestrea transiciones proporcionalmente a |TD-error|^α mediante un sum-tree
//  y corrige el sesgo con pesos de importancia (importance sampling).
//  Opcional para DQN (HIPERPARAMETROS.dqn.prioritario).
// ============================================================================

import { DIM_ESTADO } from "../nucleo/constantes.js";

const D = DIM_ESTADO;

export class ReplayPrioritario {
  constructor(capacidad, { alpha = 0.6, epsilon = 1e-4, dim = D } = {}) {
    this.capacidad = capacidad;
    this.dim = dim;
    this.alpha = alpha;
    this.epsilon = epsilon;
    this.s = new Float32Array(capacidad * dim);
    this.a = new Int32Array(capacidad);
    this.r = new Float32Array(capacidad);
    this.s2 = new Float32Array(capacidad * dim);
    this.done = new Uint8Array(capacidad);
    this.tam = 0;
    this.pos = 0;
    // Sum-tree: nodos internos en [1, capacidad), hojas en [capacidad, 2·capacidad).
    this.arbol = new Float64Array(2 * capacidad);
    this.maxPrioridad = 1.0;
  }

  get size() {
    return this.tam;
  }
  estaListo(minimo) {
    return this.tam >= minimo;
  }

  _actualizarHoja(idx, prioridad) {
    let nodo = idx + this.capacidad;
    this.arbol[nodo] = prioridad;
    nodo >>= 1;
    while (nodo >= 1) {
      this.arbol[nodo] = this.arbol[2 * nodo] + this.arbol[2 * nodo + 1];
      nodo >>= 1;
    }
  }

  agregar(s, a, r, s2, done) {
    const base = this.pos * this.dim;
    for (let k = 0; k < this.dim; k++) {
      this.s[base + k] = s[k];
      this.s2[base + k] = s2[k];
    }
    this.a[this.pos] = a;
    this.r[this.pos] = r;
    this.done[this.pos] = done ? 1 : 0;
    // Las transiciones nuevas entran con la prioridad máxima (se garantizan
    // al menos un muestreo para estimar su TD-error real).
    this._actualizarHoja(this.pos, Math.pow(this.maxPrioridad, this.alpha));
    this.pos = (this.pos + 1) % this.capacidad;
    if (this.tam < this.capacidad) this.tam++;
  }

  agregarLote(lote) {
    const n = lote.recompensas.length;
    for (let i = 0; i < n; i++) {
      const sSlice = lote.estados.subarray(i * this.dim, (i + 1) * this.dim);
      const s2Slice = lote.siguientes.subarray(i * this.dim, (i + 1) * this.dim);
      this.agregar(sSlice, lote.acciones[i], lote.recompensas[i], s2Slice, lote.terminados[i]);
    }
  }

  _total() {
    return this.arbol[1];
  }

  _buscar(prefijo) {
    let nodo = 1;
    while (nodo < this.capacidad) {
      const izq = 2 * nodo;
      if (prefijo <= this.arbol[izq]) {
        nodo = izq;
      } else {
        prefijo -= this.arbol[izq];
        nodo = izq + 1;
      }
    }
    return nodo - this.capacidad;
  }

  /**
   * Muestreo proporcional con pesos de importancia.
   * @returns {{s,a,r,s2,done,indices, pesos:Float32Array}}
   */
  muestrear(batchSize, beta = 0.4) {
    const s = new Float32Array(batchSize * this.dim);
    const s2 = new Float32Array(batchSize * this.dim);
    const a = new Int32Array(batchSize);
    const r = new Float32Array(batchSize);
    const done = new Float32Array(batchSize);
    const indices = new Int32Array(batchSize);
    const pesos = new Float32Array(batchSize);

    const total = this._total();
    const segmento = total / batchSize;
    let maxPeso = 0;

    for (let i = 0; i < batchSize; i++) {
      const prefijo = segmento * (i + Math.random());
      const idx = this._buscar(prefijo);
      indices[i] = idx;
      const baseSrc = idx * this.dim;
      const baseDst = i * this.dim;
      for (let k = 0; k < this.dim; k++) {
        s[baseDst + k] = this.s[baseSrc + k];
        s2[baseDst + k] = this.s2[baseSrc + k];
      }
      a[i] = this.a[idx];
      r[i] = this.r[idx];
      done[i] = this.done[idx];

      const prob = this.arbol[idx + this.capacidad] / total;
      const peso = Math.pow(this.tam * Math.max(prob, 1e-12), -beta);
      pesos[i] = peso;
      if (peso > maxPeso) maxPeso = peso;
    }
    // Normalizar pesos a [0,1] para estabilidad.
    if (maxPeso > 0) for (let i = 0; i < batchSize; i++) pesos[i] /= maxPeso;
    return { s, a, r, s2, done, indices, pesos };
  }

  actualizarPrioridades(indices, tdErrors) {
    for (let i = 0; i < indices.length; i++) {
      const p = Math.abs(tdErrors[i]) + this.epsilon;
      if (p > this.maxPrioridad) this.maxPrioridad = p;
      this._actualizarHoja(indices[i], Math.pow(p, this.alpha));
    }
  }

  limpiar() {
    this.tam = 0;
    this.pos = 0;
    this.arbol.fill(0);
    this.maxPrioridad = 1.0;
  }
}
