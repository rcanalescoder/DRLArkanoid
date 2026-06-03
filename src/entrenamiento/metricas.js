// ============================================================================
//  Recolector de métricas reales
//  Ventana deslizante de las últimas 100 recompensas de episodio + tasa de
//  éxito + throughput. Mantiene un historial muestreado para las curvas.
// ============================================================================

const VENTANA = 100;
const MAX_HISTORIAL = 600;

export class RecolectorMetricas {
  constructor() {
    this.reiniciar();
  }

  reiniciar() {
    this._recompensas = []; // ventana deslizante
    this._exitos = [];
    this._ladrillos = [];
    this._noShaping = []; // recompensa de tarea (ladrillos + terminal), sin ayudas
    this._primerLadrillo = []; // paso del 1er ladrillo (time_to_first_brick)
    this._pasosVivo = []; // duración del episodio (steps_alive)
    this.episodiosTotales = 0;
    this.victoriasTotales = 0;
    this.historial = [];
    this._ventanaExpInicio = null;
    this._expDesdeMarca = 0;
    this.experienciasPorSegundo = 0;
    this.tiempoInferenciaMs = 0;
    this.tiempoEntrenamientoMs = 0;
  }

  /** Registra los episodios terminados en un lote. */
  registrarEpisodios(episodios) {
    for (const ep of episodios) {
      this._empujar(this._recompensas, ep.recompensa);
      this._empujar(this._exitos, ep.ganado ? 1 : 0);
      this._empujar(this._ladrillos, ep.ladrillosRotos);
      this._empujar(this._noShaping, (ep.rBricks || 0) + (ep.rTerminal || 0));
      if (ep.primerLadrilloPaso != null && ep.primerLadrilloPaso >= 0)
        this._empujar(this._primerLadrillo, ep.primerLadrilloPaso);
      if (ep.pasos != null) this._empujar(this._pasosVivo, ep.pasos);
      this.episodiosTotales++;
      if (ep.ganado) this.victoriasTotales++;
    }
  }

  _empujar(arr, v) {
    arr.push(v);
    if (arr.length > VENTANA) arr.shift();
  }

  /** Registra throughput a partir de experiencias acumuladas y tiempo. */
  registrarRendimiento(numExperiencias, ahoraMs, { inferenciaMs, entrenamientoMs } = {}) {
    if (this._ventanaExpInicio == null) {
      this._ventanaExpInicio = ahoraMs;
      this._expDesdeMarca = 0;
    }
    this._expDesdeMarca += numExperiencias;
    const dt = (ahoraMs - this._ventanaExpInicio) / 1000;
    if (dt >= 0.5) {
      this.experienciasPorSegundo = this._expDesdeMarca / dt;
      this._ventanaExpInicio = ahoraMs;
      this._expDesdeMarca = 0;
    }
    if (inferenciaMs != null) this.tiempoInferenciaMs = inferenciaMs;
    if (entrenamientoMs != null) this.tiempoEntrenamientoMs = entrenamientoMs;
  }

  _media(arr) {
    if (!arr.length) return 0;
    let s = 0;
    for (const v of arr) s += v;
    return s / arr.length;
  }

  /** Instantánea de métricas agregadas. */
  obtenerInstantanea() {
    return {
      // Métrica de CABECERA (plan §3): % de episodios que limpian el nivel.
      successRate: this._media(this._exitos),
      tasaExito100: this._media(this._exitos), // alias retrocompatible
      bricksCleared: this._media(this._ladrillos),
      // Diagnósticos (no son criterio de éxito):
      rewardMedio100: this._media(this._recompensas),
      rewardNoShaping: this._media(this._noShaping), // solo tarea (ladrillos + terminal)
      timeToFirstBrick: this._primerLadrillo.length ? this._media(this._primerLadrillo) : null,
      stepsAlive: this._media(this._pasosVivo),
      ladrillosRotosMedio: this._media(this._ladrillos), // alias retrocompatible
      episodiosTotales: this.episodiosTotales,
      victoriasTotales: this.victoriasTotales,
      experienciasPorSegundo: this.experienciasPorSegundo,
      tiempoInferenciaMs: this.tiempoInferenciaMs,
      tiempoEntrenamientoMs: this.tiempoEntrenamientoMs,
    };
  }

  /**
   * Añade un punto al historial para las curvas. `extra` mezcla métricas del
   * agente (loss, epsilon, entropia, temperatura, errorModelo...).
   */
  registrarPuntoHistorial(paso, extra = {}) {
    const punto = { paso, ...this.obtenerInstantanea(), ...extra };
    this.historial.push(punto);
    if (this.historial.length > MAX_HISTORIAL) {
      // Downsample: descartar uno de cada dos puntos viejos.
      this.historial = this.historial.filter((_, i) => i % 2 === 0 || i >= this.historial.length - 50);
    }
    return punto;
  }
}
