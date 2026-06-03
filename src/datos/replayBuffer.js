// ============================================================================
//  Replay buffer uniforme (off-policy: DQN, SAC, World Model)
//  Almacenamiento plano en Float32Array para muestreo eficiente en batch.
//  Buffer circular: cuando se llena, sobreescribe las experiencias más viejas.
// ============================================================================

import { DIM_ESTADO } from "../nucleo/constantes.js";

const D = DIM_ESTADO;

export class ReplayBuffer {
  constructor(capacidad, dim = D) {
    this.capacidad = capacidad;
    this.dim = dim;
    this.s = new Float32Array(capacidad * dim);
    this.a = new Int32Array(capacidad);
    this.r = new Float32Array(capacidad);
    this.s2 = new Float32Array(capacidad * dim);
    this.done = new Uint8Array(capacidad);
    this.tam = 0;
    this.pos = 0;
  }

  get size() {
    return this.tam;
  }

  estaListo(minimo) {
    return this.tam >= minimo;
  }

  /** Inserta una única transición. */
  agregar(s, a, r, s2, done) {
    const base = this.pos * this.dim;
    for (let k = 0; k < this.dim; k++) {
      this.s[base + k] = s[k];
      this.s2[base + k] = s2[k];
    }
    this.a[this.pos] = a;
    this.r[this.pos] = r;
    this.done[this.pos] = done ? 1 : 0;
    this.pos = (this.pos + 1) % this.capacidad;
    if (this.tam < this.capacidad) this.tam++;
  }

  /**
   * Inserta un lote en formato plano (el que produce GestorEntornos).
   * @param {{estados:Float32Array,acciones:ArrayLike,recompensas:Float32Array,
   *          siguientes:Float32Array,terminados:Uint8Array}} lote
   */
  agregarLote(lote) {
    const n = lote.recompensas.length;
    for (let i = 0; i < n; i++) {
      const baseDst = this.pos * this.dim;
      const baseSrc = i * this.dim;
      for (let k = 0; k < this.dim; k++) {
        this.s[baseDst + k] = lote.estados[baseSrc + k];
        this.s2[baseDst + k] = lote.siguientes[baseSrc + k];
      }
      this.a[this.pos] = lote.acciones[i];
      this.r[this.pos] = lote.recompensas[i];
      this.done[this.pos] = lote.terminados[i];
      this.pos = (this.pos + 1) % this.capacidad;
      if (this.tam < this.capacidad) this.tam++;
    }
  }

  /**
   * Muestrea un batch uniforme. Devuelve arrays planos listos para tensores.
   * @returns {{s:Float32Array,a:Int32Array,r:Float32Array,s2:Float32Array,
   *            done:Float32Array,indices:Int32Array}}
   */
  muestrear(batchSize) {
    const s = new Float32Array(batchSize * this.dim);
    const s2 = new Float32Array(batchSize * this.dim);
    const a = new Int32Array(batchSize);
    const r = new Float32Array(batchSize);
    const done = new Float32Array(batchSize);
    const indices = new Int32Array(batchSize);

    for (let i = 0; i < batchSize; i++) {
      const idx = (Math.random() * this.tam) | 0;
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
    }
    return { s, a, r, s2, done, indices };
  }

  /** Muestrea solo estados (para el World Model: puntos de arranque imaginados). */
  muestrearEstados(batchSize) {
    const s = new Float32Array(batchSize * this.dim);
    for (let i = 0; i < batchSize; i++) {
      const idx = (Math.random() * this.tam) | 0;
      const baseSrc = idx * this.dim;
      const baseDst = i * this.dim;
      for (let k = 0; k < this.dim; k++) s[baseDst + k] = this.s[baseSrc + k];
    }
    return s;
  }

  limpiar() {
    this.tam = 0;
    this.pos = 0;
  }
}
