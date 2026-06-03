// ============================================================================
//  Gestor de entornos: pool headless (entrenamiento) + pool visual (observación)
//  - Pool headless: N entornos sin render que generan las experiencias.
//  - Pool visual: pocos entornos que se dibujan; ejecutan la misma política.
//  Trabaja con arrays planos (Float32Array) para alimentar tensores en batch.
// ============================================================================

import { EntornoArkanoid } from "./entornoArkanoid.js";
import { DIM_ESTADO, POOL } from "../nucleo/constantes.js";

const D = DIM_ESTADO;

export class GestorEntornos {
  constructor({
    numHeadless = POOL.HEADLESS_DEFECTO,
    numVisuales = POOL.VISUALES_DEFECTO,
    shaping = true,
    semilla = null,
  } = {}) {
    this.shaping = shaping;
    this.semilla = semilla;
    this.headless = [];
    this.visuales = [];
    this._siguienteId = 0;

    this.redimensionarHeadless(numHeadless);
    this.redimensionarVisuales(numVisuales);
  }

  get numHeadless() {
    return this.headless.length;
  }
  get numVisuales() {
    return this.visuales.length;
  }

  redimensionarHeadless(n) {
    n = Math.max(1, Math.floor(n));
    while (this.headless.length < n) {
      this.headless.push(
        new EntornoArkanoid(this._siguienteId++, { shaping: this.shaping, semilla: this.semilla })
      );
    }
    if (this.headless.length > n) this.headless.length = n;
    // (Re)construir caché de estados actuales.
    this._estadosActuales = new Float32Array(n * D);
    for (let i = 0; i < n; i++) this._escribirEstado(this.headless[i], this._estadosActuales, i);
  }

  redimensionarVisuales(n) {
    n = Math.max(0, Math.min(Math.floor(n), POOL.VISUALES_MAX));
    while (this.visuales.length < n) {
      this.visuales.push(
        new EntornoArkanoid(10000 + this.visuales.length, { shaping: this.shaping })
      );
    }
    if (this.visuales.length > n) this.visuales.length = n;
    this._estadosVisuales = new Float32Array(n * D);
    for (let i = 0; i < n; i++) this._escribirEstado(this.visuales[i], this._estadosVisuales, i);
  }

  _escribirEstado(env, buffer, i) {
    const v = env.obtenerVectorEstado();
    for (let k = 0; k < D; k++) buffer[i * D + k] = v[k];
  }

  /** Estados actuales (s) del pool headless como array plano [N·D]. */
  obtenerEstadosEntrenamiento() {
    return this._estadosActuales;
  }

  /**
   * Aplica un vector de acciones (una por entorno headless), avanza la
   * simulación y devuelve el lote de transiciones en formato plano.
   * Reinicia automáticamente los entornos que terminan.
   */
  aplicarAcciones(acciones) {
    const n = this.numHeadless;
    const sActual = this._estadosActuales;
    const s = sActual.slice(); // snapshot de s antes de avanzar
    const s2 = new Float32Array(n * D);
    const recompensas = new Float32Array(n);
    const terminados = new Uint8Array(n);
    const episodios = [];

    for (let i = 0; i < n; i++) {
      const env = this.headless[i];
      const { recompensa, done } = env.paso(acciones[i]);
      recompensas[i] = recompensa;
      terminados[i] = done ? 1 : 0;

      // s' = estado tras el paso (estado terminal capturado antes de reiniciar).
      this._escribirEstado(env, s2, i);

      if (done) {
        episodios.push({
          idEntorno: env.id,
          recompensa: env.recompensaEpisodio,
          ladrillosRotos: env.ladrillosRotosEpisodio,
          ganado: env.estado === "ganado",
          pasos: env.pasos,
        });
        env.reiniciar();
      }
      // Actualizar caché al nuevo estado actual (post-paso o post-reinicio).
      this._escribirEstado(env, sActual, i);
    }

    return { estados: s, acciones, recompensas, siguientes: s2, terminados, episodios };
  }

  // --- Pool visual -----------------------------------------------------------

  obtenerEstadosVisuales() {
    return this._estadosVisuales;
  }

  /** Avanza los entornos visuales con las acciones dadas (sin almacenar). */
  /** Avanza UN paso a los entornos visuales no terminales (sin gestionar el hold). */
  pasoVisualSimple(acciones) {
    const n = this.numVisuales;
    for (let i = 0; i < n; i++) {
      const env = this.visuales[i];
      if (!env.estaTerminado()) {
        env.paso(acciones[i]);
        this._escribirEstado(env, this._estadosVisuales, i);
      }
    }
  }

  /**
   * Gestiona el "hold" de fin de partida UNA vez por frame (independiente de
   * cuántos pasos de animación se den): mantiene el estado terminal visible
   * ~45 frames mostrando el motivo y luego reinicia.
   */
  tickHoldVisual() {
    const n = this.numVisuales;
    for (let i = 0; i < n; i++) {
      const env = this.visuales[i];
      if (env.estaTerminado()) {
        env._holdVisual = (env._holdVisual || 0) + 1;
        if (env._holdVisual >= 45) {
          env.reiniciar();
          env._holdVisual = 0;
        }
        this._escribirEstado(env, this._estadosVisuales, i);
      }
    }
  }

  reiniciarTodos() {
    for (const e of this.headless) e.reiniciar();
    for (const e of this.visuales) e.reiniciar();
    this.redimensionarHeadless(this.headless.length);
    this.redimensionarVisuales(this.visuales.length);
  }
}

export { D as DIM_ESTADO };
