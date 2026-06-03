// ============================================================================
//  Buffer de secuencias (para entrenar el modelo de dinámica RECURRENTE / LSTM)
//  A diferencia del replay buffer uniforme (que baraja transiciones sueltas),
//  un LSTM necesita SECUENCIAS temporales ordenadas de un mismo entorno. Aquí
//  acumulamos el episodio en curso de cada entorno y, al terminar, lo guardamos
//  completo; luego muestreamos ventanas contiguas de longitud L.
//
//  Cada paso del entorno i produce (s, a, r, s2, done). El objetivo del modelo
//  para ese paso es predecir Δs = s2 − s (más estable que s' absoluto), r y done.
// ============================================================================

import { DIM_ESTADO } from "../nucleo/constantes.js";

const D = DIM_ESTADO;

export class BufferSecuencias {
  constructor(capacidadEpisodios = 256, dim = D) {
    this.cap = capacidadEpisodios;
    this.dim = dim;
    this.episodios = []; // [{ s:Float32Array[len*D], a:Int32Array[len], ds, r, done, len }]
    this._acc = null; // acumuladores por entorno (uno por slot)
    this._n = 0;
  }

  _reset(n) {
    this._n = n;
    this._acc = [];
    for (let i = 0; i < n; i++) this._acc.push(this._nuevoAcc());
  }

  _nuevoAcc() {
    return { s: [], a: [], ds: [], r: [], done: [] };
  }

  /** Inserta un lote (formato GestorEntornos), acumulando por entorno. */
  agregarLote(lote) {
    const n = lote.recompensas.length;
    if (this._acc == null || this._n !== n) this._reset(n);

    for (let i = 0; i < n; i++) {
      const acc = this._acc[i];
      const base = i * this.dim;
      for (let k = 0; k < this.dim; k++) {
        const s = lote.estados[base + k];
        acc.s.push(s);
        acc.ds.push(lote.siguientes[base + k] - s); // Δs = s' − s
      }
      acc.a.push(lote.acciones[i]);
      acc.r.push(lote.recompensas[i]);
      acc.done.push(lote.terminados[i]);

      if (lote.terminados[i]) {
        this._guardarEpisodio(acc);
        this._acc[i] = this._nuevoAcc();
      }
    }
  }

  _guardarEpisodio(acc) {
    const len = acc.r.length;
    if (len < 2) return; // demasiado corto para una secuencia útil
    this.episodios.push({
      s: Float32Array.from(acc.s),
      ds: Float32Array.from(acc.ds),
      a: Int32Array.from(acc.a),
      r: Float32Array.from(acc.r),
      done: Float32Array.from(acc.done),
      len,
    });
    if (this.episodios.length > this.cap) this.episodios.shift();
  }

  /** ¿Hay al menos un episodio lo bastante largo para una ventana de L? */
  estaListo(L, minEpisodios = 8) {
    let aptos = 0;
    for (const e of this.episodios) if (e.len >= L) aptos++;
    return aptos >= minEpisodios;
  }

  /**
   * Muestrea B secuencias de longitud L. Devuelve arrays planos en orden
   * [b][l] (b externo, l interno), listos para tensores [B, L, ...].
   * @returns {{s,ds,a,r,done}|null}
   */
  muestrear(B, L) {
    const aptos = this.episodios.filter((e) => e.len >= L);
    if (!aptos.length) return null;

    const s = new Float32Array(B * L * this.dim);
    const ds = new Float32Array(B * L * this.dim);
    const a = new Int32Array(B * L);
    const r = new Float32Array(B * L);
    const done = new Float32Array(B * L);

    for (let b = 0; b < B; b++) {
      const ep = aptos[(Math.random() * aptos.length) | 0];
      const inicio = (Math.random() * (ep.len - L + 1)) | 0;
      for (let l = 0; l < L; l++) {
        const t = inicio + l; // paso dentro del episodio
        const dstVec = (b * L + l) * this.dim;
        const srcVec = t * this.dim;
        for (let k = 0; k < this.dim; k++) {
          s[dstVec + k] = ep.s[srcVec + k];
          ds[dstVec + k] = ep.ds[srcVec + k];
        }
        const dstSca = b * L + l;
        a[dstSca] = ep.a[t];
        r[dstSca] = ep.r[t];
        done[dstSca] = ep.done[t];
      }
    }
    return { s, ds, a, r, done };
  }

  get numEpisodios() {
    return this.episodios.length;
  }

  limpiar() {
    this.episodios = [];
    this._acc = null;
    this._n = 0;
  }
}
