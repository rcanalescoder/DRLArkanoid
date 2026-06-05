// ============================================================================
//  Gestor de entornos: pool headless (entrenamiento) + pool visual (observación)
//  - Pool headless: N entornos sin render que generan las experiencias.
//  - Pool visual: pocos entornos que se dibujan; ejecutan la misma política.
//  Trabaja con arrays planos (Float32Array) para alimentar tensores en batch.
// ============================================================================

import { EntornoArkanoid } from "./entornoArkanoid.js";
import { POOL, INCLUIR_LADRILLOS_DEFECTO, ESCALA_LADRILLOS_DEFECTO, dimensionEstado } from "../nucleo/constantes.js";

export class GestorEntornos {
  constructor({
    numHeadless = POOL.HEADLESS_DEFECTO,
    numVisuales = POOL.VISUALES_DEFECTO,
    shaping = false, // Φ desactivado por defecto (ver plan §2/§5.1: saboteaba el objetivo)
    incluirLadrillos = INCLUIR_LADRILLOS_DEFECTO, // VISTA por defecto (Fase 1+); false = baseline ciega
    patronLadrillos = null, // predicado (fila,col)→bool del patrón inicial; null = rejilla llena
    escalaLadrillos = ESCALA_LADRILLOS_DEFECTO, // escala de ocupación (<1 evita que ahogue la cinemática; 0.25 hace despegar la vista)
    proveedorNivel = null, // () → máscara por episodio (Fase 2: entrenar/evaluar en niveles variados)
    semilla = null,
  } = {}) {
    this.shaping = shaping;
    this.incluirLadrillos = incluirLadrillos;
    this.patronLadrillos = patronLadrillos;
    this.escalaLadrillos = escalaLadrillos;
    this.proveedorNivel = proveedorNivel;
    // Dimensión del estado según el modo (VISTA 34 / CIEGO 6). Todos los buffers planos
    // se dimensionan con this.D para que coincidan con lo que produce cada entorno y con
    // la red del agente emparejado (que recibe la misma dimEstado).
    this.D = dimensionEstado(incluirLadrillos);
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
        new EntornoArkanoid(this._siguienteId++, {
          shaping: this.shaping,
          incluirLadrillos: this.incluirLadrillos,
          patronLadrillos: this.patronLadrillos,
          escalaLadrillos: this.escalaLadrillos,
          proveedorNivel: this.proveedorNivel,
          semilla: this.semilla,
        })
      );
    }
    if (this.headless.length > n) this.headless.length = n;
    // (Re)construir caché de estados actuales.
    this._estadosActuales = new Float32Array(n * this.D);
    for (let i = 0; i < n; i++) this._escribirEstado(this.headless[i], this._estadosActuales, i);
  }

  redimensionarVisuales(n) {
    n = Math.max(0, Math.min(Math.floor(n), POOL.VISUALES_MAX));
    while (this.visuales.length < n) {
      this.visuales.push(
        new EntornoArkanoid(10000 + this.visuales.length, {
          shaping: this.shaping,
          incluirLadrillos: this.incluirLadrillos,
          patronLadrillos: this.patronLadrillos,
          escalaLadrillos: this.escalaLadrillos,
          proveedorNivel: this.proveedorNivel,
        })
      );
    }
    if (this.visuales.length > n) this.visuales.length = n;
    this._estadosVisuales = new Float32Array(n * this.D);
    for (let i = 0; i < n; i++) this._escribirEstado(this.visuales[i], this._estadosVisuales, i);
  }

  _escribirEstado(env, buffer, i) {
    const v = env.obtenerVectorEstado();
    const D = this.D;
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
    const s2 = new Float32Array(n * this.D);
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
          ladrillosIniciales: env.ladrillosIniciales,
          ganado: env.estado === "ganado",
          pasos: env.pasos,
          // Componentes de recompensa + diagnósticos (plan §5.1/§5.7).
          rBricks: env.rBricks,
          rSurvival: env.rSurvival,
          rTerminal: env.rTerminal,
          rShaping: env.rShaping,
          primerLadrilloPaso: env.primerLadrilloPaso,
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
    // Hold por TIEMPO (~0.5s), no por frames: así la pausa al perder/ganar es la misma
    // para todos los modelos y velocidades, aunque el frame rate baje (p.ej. WM/RNN).
    const ahora = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    const HOLD_MS = 500;
    const n = this.numVisuales;
    for (let i = 0; i < n; i++) {
      const env = this.visuales[i];
      if (env.estaTerminado()) {
        if (!env._holdHasta) env._holdHasta = ahora + HOLD_MS;
        if (ahora >= env._holdHasta) {
          env.reiniciar();
          env._holdHasta = 0;
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

export { DIM_ESTADO } from "../nucleo/constantes.js";
