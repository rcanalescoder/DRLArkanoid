// ============================================================================
//  Rollout buffer (on-policy: PPO)
//  Acumula `longitud` pasos de los N entornos en paralelo y calcula ventajas
//  con GAE (Generalized Advantage Estimation, Schulman 2016) y retornos.
//  Índice plano: fila t, entorno i  →  t·N + i.
// ============================================================================

export class RolloutBuffer {
  constructor({ numEnvs, longitud, dim }) {
    this.numEnvs = numEnvs;
    this.longitud = longitud;
    this.dim = dim;
    const cap = longitud * numEnvs;
    this.cap = cap;
    this.s = new Float32Array(cap * dim);
    this.a = new Int32Array(cap);
    this.logp = new Float32Array(cap);
    this.r = new Float32Array(cap);
    this.done = new Float32Array(cap);
    this.val = new Float32Array(cap);
    this.adv = new Float32Array(cap);
    this.ret = new Float32Array(cap);
    this.fila = 0; // pasos almacenados
  }

  get lleno() {
    return this.fila >= this.longitud;
  }
  get numMuestras() {
    return this.fila * this.numEnvs;
  }

  /**
   * Almacena una fila (un paso de los N entornos).
   * Todos los argumentos son arrays/typed-arrays de longitud N (o N·dim para s).
   */
  agregarFila(estados, acciones, logprobs, recompensas, terminados, valores) {
    const t = this.fila;
    const N = this.numEnvs;
    for (let i = 0; i < N; i++) {
      const idx = t * N + i;
      const baseDst = idx * this.dim;
      const baseSrc = i * this.dim;
      for (let k = 0; k < this.dim; k++) this.s[baseDst + k] = estados[baseSrc + k];
      this.a[idx] = acciones[i];
      this.logp[idx] = logprobs[i];
      this.r[idx] = recompensas[i];
      this.done[idx] = terminados[i];
      this.val[idx] = valores[i];
    }
    this.fila++;
  }

  /**
   * Calcula ventajas (GAE) y retornos. `ultimosValores` es V(s_T) de cada
   * entorno (bootstrap del estado actual tras el último paso almacenado).
   */
  calcularVentajas(ultimosValores, gamma, lambda) {
    const N = this.numEnvs;
    const T = this.fila;
    for (let i = 0; i < N; i++) {
      let lastGae = 0;
      for (let t = T - 1; t >= 0; t--) {
        const idx = t * N + i;
        const noTerminal = 1 - this.done[idx];
        const vSiguiente = t === T - 1 ? ultimosValores[i] : this.val[(t + 1) * N + i];
        const delta = this.r[idx] + gamma * vSiguiente * noTerminal - this.val[idx];
        lastGae = delta + gamma * lambda * noTerminal * lastGae;
        this.adv[idx] = lastGae;
        this.ret[idx] = lastGae + this.val[idx];
      }
    }
  }

  /** Devuelve vistas planas de todas las muestras válidas (T·N). */
  obtenerAplanado() {
    const m = this.numMuestras;
    return {
      m,
      s: this.s.subarray(0, m * this.dim),
      a: this.a.subarray(0, m),
      logp: this.logp.subarray(0, m),
      adv: this.adv.subarray(0, m),
      ret: this.ret.subarray(0, m),
      val: this.val.subarray(0, m),
    };
  }

  limpiar() {
    this.fila = 0;
  }
}
