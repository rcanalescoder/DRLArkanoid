// ============================================================================
//  Agente DQN (Deep Q-Network) — Double DQN + soft target update
//  Off-policy, model-free. Aprende Q(s,a) y actúa ε-greedy.
//  Mejoras incluidas: Double DQN (reduce sobreestimación), pérdida Huber,
//  actualización suave (Polyak) de la red objetivo, replay opcionalmente
//  prioritario.
// ============================================================================

import * as tf from "@tensorflow/tfjs";
import { AgenteBase } from "./agenteBase.js";
import { crearMLP, crearRedConv, variablesEntrenables, copiarPesos } from "./redes/constructorRedes.js";
import { ReplayBuffer } from "../datos/replayBuffer.js";
import { ReplayPrioritario } from "../datos/replayPrioritario.js";
import { actualizacionSuave, liberar } from "../nucleo/gestorTensores.js";
import {
  ALGORITMOS,
  SIMBOLOS_ACCION,
  DIM_CINEMATICA,
  FILAS_LADRILLOS,
  COLUMNAS_LADRILLOS,
  NUM_LADRILLOS,
} from "../nucleo/constantes.js";

export class AgenteDQN extends AgenteBase {
  constructor(hp) {
    super(ALGORITMOS.DQN, hp);
    this._construir();
  }

  _construir() {
    const { capasOcultas, tasaAprendizaje, capacidadBuffer, prioritario, arquitectura } = this.hp;
    // Fase 2b: arquitectura="conv" → encoder convolucional sobre la matriz de ladrillos
    // + rama cinemática (modelo funcional multi-entrada). Si no, MLP plano (Fase 1/2a).
    this._conv = arquitectura === "conv";
    const crear = (nombre, entrenable = true) =>
      this._conv
        ? crearRedConv({ dimCinematica: DIM_CINEMATICA, filas: FILAS_LADRILLOS, columnas: COLUMNAS_LADRILLOS, capasOcultas, dimSalida: this.numAcciones, entrenable, nombre })
        : crearMLP({ dimEntrada: this.dimEstado, capasOcultas, dimSalida: this.numAcciones, entrenable, nombre });
    this.redPolitica = crear("dqn_politica");
    this.redObjetivo = crear("dqn_objetivo", false);
    copiarPesos(this.redPolitica, this.redObjetivo);
    this.optimizador = tf.train.adam(tasaAprendizaje);
    this.buffer = prioritario
      ? new ReplayPrioritario(capacidadBuffer, { dim: this.dimEstado })
      : new ReplayBuffer(capacidadBuffer, this.dimEstado);
    this._varsPolitica = variablesEntrenables(this.redPolitica);
    this._tdErrorMedio = 0;
    this._lossMedia = 0;
  }

  get epsilon() {
    const { epsilonInicial, epsilonFinal, pasosDecaimientoEpsilon } = this.hp;
    const frac = Math.min(1, this.pasosEntorno / pasosDecaimientoEpsilon);
    return epsilonInicial + (epsilonFinal - epsilonInicial) * frac;
  }

  get beta() {
    // Anneal de β (importance sampling) de 0.4 → 1.0 para PER.
    const frac = Math.min(1, this.pasosEntorno / (this.hp.pasosDecaimientoEpsilon * 2));
    return 0.4 + 0.6 * frac;
  }

  // Predice Q soportando ambas arquitecturas. En conv parte el estado plano
  // [n, 6+NUM_LADRILLOS] en cinemática [n,6] y matriz de ladrillos [n,F,C,1] (orden
  // fila-mayor) y alimenta las dos entradas del modelo funcional; en flat predice
  // directo. Siempre se llama dentro de tf.tidy o del closure de minimize, que
  // gestionan los tensores intermedios (slice/reshape).
  _predecir(red, sT) {
    if (!this._conv) return red.predict(sT);
    const n = sT.shape[0];
    const sCin = sT.slice([0, 0], [n, DIM_CINEMATICA]);
    const sMatFlat = sT.slice([0, DIM_CINEMATICA], [n, NUM_LADRILLOS]);
    const sMat = sMatFlat.reshape([n, FILAS_LADRILLOS, COLUMNAS_LADRILLOS, 1]);
    return red.predict([sCin, sMat]);
  }

  seleccionarAcciones(estadosFlat, n, { entrenar = true } = {}) {
    const eps = entrenar ? this.epsilon : 0;
    const greedy = tf.tidy(() => {
      const sT = this._tensorEstados(estadosFlat, n);
      return this._predecir(this.redPolitica, sT).argMax(1).dataSync();
    });
    const acciones = new Int32Array(n);
    for (let i = 0; i < n; i++) {
      acciones[i] =
        Math.random() < eps ? (Math.random() * this.numAcciones) | 0 : greedy[i];
    }
    return acciones;
  }

  almacenarExperiencia(lote) {
    this.buffer.agregarLote(lote);
    this.pasosEntorno += lote.recompensas.length;
  }

  async entrenar() {
    const { arranqueAprendizaje, tamBatch, gamma, tau, dobleDQN, prioritario } = this.hp;
    if (this.pasosEntorno < arranqueAprendizaje || !this.buffer.estaListo(tamBatch)) {
      return null;
    }

    const muestra = prioritario
      ? this.buffer.muestrear(tamBatch, this.beta)
      : this.buffer.muestrear(tamBatch);

    const sT = tf.tensor2d(muestra.s, [tamBatch, this.dimEstado]);
    const s2T = tf.tensor2d(muestra.s2, [tamBatch, this.dimEstado]);
    const aT = tf.tensor1d(muestra.a, "int32");
    const rT = tf.tensor1d(muestra.r);
    const doneT = tf.tensor1d(muestra.done);
    const pesosT = prioritario ? tf.tensor1d(muestra.pesos) : null;
    const aOneHot = tf.oneHot(aT, this.numAcciones);

    // --- Objetivo TD (sin gradiente): r + γ·(1-done)·Q'(s') ---
    const objetivo = tf.tidy(() => {
      const qObj = this._predecir(this.redObjetivo, s2T); // [B,A]
      let qSiguiente;
      if (dobleDQN) {
        const aStar = this._predecir(this.redPolitica, s2T).argMax(1); // selección online
        qSiguiente = qObj.mul(tf.oneHot(aStar, this.numAcciones)).sum(1);
      } else {
        qSiguiente = qObj.max(1);
      }
      const noTerm = tf.scalar(1).sub(doneT);
      return rT.add(qSiguiente.mul(gamma).mul(noTerm));
    });

    // --- TD-error por muestra (para PER y métricas) ---
    const tdErrT = tf.tidy(() =>
      this._predecir(this.redPolitica, sT).mul(aOneHot).sum(1).sub(objetivo)
    );
    const tdErrArr = tdErrT.dataSync();
    tdErrT.dispose();

    // --- Paso de gradiente (pérdida Huber, con pesos IS si PER). El closure de
    //     minimize NO se envuelve en tidy: variableGrads gestiona la cinta y
    //     libera los intermedios del forward por sí mismo. ---
    const lossT = this.optimizador.minimize(
      () => {
        const qa = this._predecir(this.redPolitica, sT).mul(aOneHot).sum(1);
        return tf.losses.huberLoss(objetivo, qa, pesosT ?? undefined);
      },
      true,
      this._varsPolitica
    );
    const loss = lossT.dataSync()[0];

    // --- Actualizaciones posteriores ---
    if (prioritario) this.buffer.actualizarPrioridades(muestra.indices, tdErrArr);
    actualizacionSuave(this.redPolitica, this.redObjetivo, tau);

    liberar(sT, s2T, aT, rT, doneT, aOneHot, objetivo, lossT, pesosT);

    this.pasosEntrenamiento++;
    let tdAbs = 0;
    for (let i = 0; i < tdErrArr.length; i++) tdAbs += Math.abs(tdErrArr[i]);
    this._tdErrorMedio = tdAbs / tdErrArr.length;
    this._lossMedia = this._lossMedia * 0.95 + loss * 0.05;

    this.ultimasMetricas = {
      loss,
      tdError: this._tdErrorMedio,
      epsilon: this.epsilon,
      bufferSize: this.buffer.size,
      batchesEntrenados: this.pasosEntrenamiento,
    };
    return this.ultimasMetricas;
  }

  obtenerDatosInspeccion(estadoFlat) {
    const qValores = tf.tidy(() =>
      Array.from(this._predecir(this.redPolitica, this._tensorEstados(estadoFlat, 1)).dataSync())
    );
    let accionGreedy = 0;
    for (let i = 1; i < qValores.length; i++) if (qValores[i] > qValores[accionGreedy]) accionGreedy = i;
    return {
      tipo: ALGORITMOS.DQN,
      qValores,
      accionGreedy,
      simbolos: SIMBOLOS_ACCION,
      tdError: this._tdErrorMedio,
      epsilon: this.epsilon,
      bufferFill: this.buffer.size / this.hp.capacidadBuffer,
      bufferSize: this.buffer.size,
    };
  }

  reiniciar() {
    this.destruir();
    this.pasosEntorno = 0;
    this.pasosEntrenamiento = 0;
    this.ultimasMetricas = {};
    this._construir();
  }

  destruir() {
    // model.dispose() ya libera las variables de pesos; no hay que liberarlas
    // manualmente antes (provocaría un doble dispose).
    this.redPolitica?.dispose?.();
    this.redObjetivo?.dispose?.();
    this.optimizador?.dispose?.();
    this.redPolitica = null;
    this.redObjetivo = null;
  }
}
