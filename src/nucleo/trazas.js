// ============================================================================
//  Sistema de trazas estructuradas
//  Almacena las últimas N trazas en un buffer circular, las imprime en consola
//  cada cierto tiempo y permite exportarlas como JSON. Es la base de la
//  monitorización agéntica: leer trazas → diagnosticar → ajustar.
// ============================================================================

import { TRAZAS } from "./constantes.js";
import { bus, EVENTOS } from "./busEventos.js";

export class SistemaTrazas {
  constructor({ capacidad = TRAZAS.CAPACIDAD_BUFFER, ahora = () => Date.now() } = {}) {
    this.capacidad = capacidad;
    this._buffer = [];
    this._indice = 0;
    this._ahora = ahora;
    this._ultimaImpresion = 0;
    this._timer = null;
  }

  /**
   * Registra una traza estructurada. Mantiene el buffer circular acotado.
   */
  registrar(traza) {
    const completa = {
      timestamp: new Date(this._ahora()).toISOString(),
      ...traza,
    };
    if (this._buffer.length < this.capacidad) {
      this._buffer.push(completa);
    } else {
      this._buffer[this._indice] = completa;
    }
    this._indice = (this._indice + 1) % this.capacidad;
    bus.emitir(EVENTOS.TRAZA_REGISTRADA, completa);
    return completa;
  }

  /** Devuelve las trazas en orden cronológico. */
  obtenerTodas() {
    if (this._buffer.length < this.capacidad) return [...this._buffer];
    return [...this._buffer.slice(this._indice), ...this._buffer.slice(0, this._indice)];
  }

  ultima() {
    const todas = this.obtenerTodas();
    return todas[todas.length - 1] ?? null;
  }

  /**
   * Imprime en consola un resumen legible de la última traza.
   */
  imprimirResumen(traza = this.ultima()) {
    if (!traza) return;
    const m = traza.metricas ?? {};
    const r = traza.rendimiento ?? {};
    const linea = [
      `[DRL ${traza.algoritmo}]`,
      `paso=${traza.paso}`,
      m.loss != null ? `loss=${num(m.loss)}` : null,
      m.rewardMedio100 != null ? `reward100=${num(m.rewardMedio100)}` : null,
      m.tasaExito100 != null ? `exito100=${pct(m.tasaExito100)}` : null,
      m.epsilon != null ? `ε=${num(m.epsilon)}` : null,
      m.entropia != null ? `H=${num(m.entropia)}` : null,
      m.temperatura != null ? `α=${num(m.temperatura)}` : null,
      m.errorModelo != null ? `errModelo=${num(m.errorModelo)}` : null,
      m.bufferSize != null ? `buf=${m.bufferSize}` : null,
      r.experienciasPorSegundo != null ? `exp/s=${Math.round(r.experienciasPorSegundo)}` : null,
      r.tensoresActivos != null ? `tensores=${r.tensoresActivos}` : null,
      r.backendGPU ? `backend=${r.backendGPU}` : null,
    ]
      .filter(Boolean)
      .join("  ");
    console.log(linea);
  }

  /**
   * Arranca la impresión periódica en consola (solo navegador). Devuelve un
   * cancelador. En Node se imprime manualmente por paso.
   */
  arrancarImpresionPeriodica(intervaloMs = TRAZAS.INTERVALO_CONSOLA_MS) {
    if (typeof setInterval !== "function") return () => {};
    this.detenerImpresionPeriodica();
    this._timer = setInterval(() => this.imprimirResumen(), intervaloMs);
    return () => this.detenerImpresionPeriodica();
  }

  detenerImpresionPeriodica() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  /** Exporta todas las trazas como cadena JSON descargable. */
  exportarJSON() {
    return JSON.stringify(this.obtenerTodas(), null, 2);
  }

  limpiar() {
    this._buffer = [];
    this._indice = 0;
  }
}

function num(v) {
  return typeof v === "number" ? v.toFixed(4) : v;
}
function pct(v) {
  return typeof v === "number" ? `${(v * 100).toFixed(1)}%` : v;
}

export const trazas = new SistemaTrazas();
