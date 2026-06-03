// ============================================================================
//  Orquestador del entrenamiento (sin DOM)
//  Conduce el bucle Build→Train desacoplado de la UI: la interfaz (rAF) o el
//  harness de Node (while) llaman a `ejecutarLote()` repetidamente. Emite
//  métricas y trazas por el bus de eventos.
// ============================================================================

import { bus, EVENTOS } from "../nucleo/busEventos.js";
import { TRAZAS } from "../nucleo/constantes.js";
import { estadoMemoria } from "../nucleo/gestorTensores.js";

const ahoraPorDefecto =
  typeof performance !== "undefined" && performance.now
    ? () => performance.now()
    : () => Date.now();

export class Orquestador {
  constructor({ gestor, agente, metricas, trazas, idAlgoritmo, ahora = ahoraPorDefecto, silencioso = false }) {
    this.gestor = gestor;
    this.agente = agente;
    this.metricas = metricas;
    this.trazas = trazas;
    this.idAlgoritmo = idAlgoritmo;
    this.ahora = ahora;
    // Modo silencioso: no emite al bus global. Lo usa el grid search para
    // entrenar agentes aislados sin secuestrar los paneles/curvas de la UI.
    this.silencioso = silencioso;
    this.corriendo = false;
    this.pasoGlobal = 0; // experiencias acumuladas
    this._ultimoRegistro = 0;
    this._infTiempo = 0;
    this._entTiempo = 0;
  }

  arrancar() {
    this.corriendo = true;
    if (!this.silencioso) bus.emitir(EVENTOS.ENTRENAMIENTO_INICIADO, { algoritmo: this.idAlgoritmo });
  }

  pausar() {
    this.corriendo = false;
    if (!this.silencioso) bus.emitir(EVENTOS.ENTRENAMIENTO_PAUSADO, { algoritmo: this.idAlgoritmo });
  }

  /**
   * Ejecuta una iteración de entrenamiento: inferencia en batch sobre el pool
   * headless → paso de simulación → almacenar → entrenar.
   * @returns {Promise<object|null>} métricas del paso de entrenamiento (o null)
   */
  async ejecutarLote() {
    const gestor = this.gestor;
    const n = gestor.numHeadless;

    const t0 = this.ahora();
    const estados = gestor.obtenerEstadosEntrenamiento();
    const acciones = this.agente.seleccionarAcciones(estados, n, { entrenar: true });
    const t1 = this.ahora();

    const resultado = gestor.aplicarAcciones(acciones);
    this.agente.almacenarExperiencia(resultado);
    this.metricas.registrarEpisodios(resultado.episodios);

    const t2 = this.ahora();
    const metrica = await this.agente.entrenar();
    const t3 = this.ahora();

    this.pasoGlobal += n;
    this._infTiempo = this._infTiempo * 0.9 + (t1 - t0) * 0.1;
    this._entTiempo = this._entTiempo * 0.9 + (t3 - t2) * 0.1;
    this.metricas.registrarRendimiento(n, t3, {
      inferenciaMs: this._infTiempo,
      entrenamientoMs: this._entTiempo,
    });

    if (this.pasoGlobal - this._ultimoRegistro >= TRAZAS.INTERVALO_REGISTRO_PASOS) {
      this._ultimoRegistro = this.pasoGlobal;
      this._registrarTraza(metrica);
    }

    if (!this.silencioso) bus.emitir(EVENTOS.LOTE_COMPLETADO, { paso: this.pasoGlobal, metrica });
    return metrica;
  }

  /**
   * Avanza el pool visual con la política greedy actual (solo observación).
   * `pasos` = cuántos pasos de simulación avanzar este frame (fast-forward de la
   * animación). NO cambia la física ni el modelo: solo muestra más pasos por
   * segundo. El "hold" de fin de partida se gestiona una vez por frame.
   */
  pasoVisual(pasos = 1) {
    const nv = this.gestor.numVisuales;
    if (nv === 0) return;
    const n = Math.min(Math.max(1, Math.floor(pasos)), 12);
    for (let s = 0; s < n; s++) {
      const estadosV = this.gestor.obtenerEstadosVisuales();
      const accionesV = this.agente.seleccionarAcciones(estadosV, nv, { entrenar: false });
      this.gestor.pasoVisualSimple(accionesV);
    }
    this.gestor.tickHoldVisual();
  }

  _registrarTraza(metrica) {
    const inst = this.metricas.obtenerInstantanea();
    const mem = estadoMemoria();
    const metricasAgente = this.agente.obtenerMetricas();
    const punto = this.metricas.registrarPuntoHistorial(this.pasoGlobal, {
      loss: metricasAgente.loss ?? null,
      epsilon: metricasAgente.epsilon ?? null,
      entropia: metricasAgente.entropia ?? null,
      temperatura: metricasAgente.temperatura ?? null,
      errorModelo: metricasAgente.errorModelo ?? null,
      bufferSize: metricasAgente.bufferSize ?? null,
    });

    const traza = this.trazas.registrar({
      algoritmo: this.idAlgoritmo,
      paso: this.pasoGlobal,
      metricas: {
        ...metricasAgente,
        rewardMedio100: inst.rewardMedio100,
        tasaExito100: inst.tasaExito100,
        ladrillosRotosMedio: inst.ladrillosRotosMedio,
        episodiosTotales: inst.episodiosTotales,
      },
      rendimiento: {
        experienciasPorSegundo: inst.experienciasPorSegundo,
        entornosActivos: this.gestor.numHeadless,
        tiempoInferenciaMs: inst.tiempoInferenciaMs,
        tiempoEntrenamientoMs: inst.tiempoEntrenamientoMs,
        tensoresActivos: mem.numTensores,
        memoriaMB: mem.megabytes,
        backendGPU: mem.backend,
      },
    });

    if (!this.silencioso) bus.emitir(EVENTOS.METRICAS_ACTUALIZADAS, { traza, punto, historial: this.metricas.historial });
    return traza;
  }

  /**
   * Bucle de conveniencia para Node: ejecuta lotes hasta alcanzar `maxPasos`
   * experiencias, invocando `onTraza` cuando se registra una traza.
   */
  async correr(maxPasos, onTraza) {
    this.arrancar();
    let ultimaTraza = this._ultimoRegistro;
    while (this.pasoGlobal < maxPasos && this.corriendo) {
      await this.ejecutarLote();
      if (onTraza && this._ultimoRegistro !== ultimaTraza) {
        ultimaTraza = this._ultimoRegistro;
        onTraza(this.trazas.ultima());
      }
    }
    this.pausar();
    return this.trazas.ultima();
  }
}
