// ============================================================================
//  Agente World Model (Dyna-Q) — model-based
//  Aprende un modelo de dinámica (s,a) → (Δs, r, done) y lo usa para generar
//  experiencias IMAGINADAS con las que entrenar un Q-learner (Double DQN).
//  Combina actualizaciones con datos reales y datos imaginados (planning).
// ============================================================================

import * as tf from "@tensorflow/tfjs";
import { AgenteBase } from "./agenteBase.js";
import { crearMLP, crearRedConv, variablesEntrenables, copiarPesos } from "./redes/constructorRedes.js";
import { ReplayBuffer } from "../datos/replayBuffer.js";
import { pasoGradiente, actualizacionSuave, liberar } from "../nucleo/gestorTensores.js";
import { ALGORITMOS, SIMBOLOS_ACCION, DIM_CINEMATICA, FILAS_LADRILLOS, COLUMNAS_LADRILLOS } from "../nucleo/constantes.js";

export class AgenteWorldModel extends AgenteBase {
  constructor(hp) {
    super(ALGORITMOS.WORLD_MODEL, hp);
    this._construir();
  }

  _construir() {
    const { capasOcultas, capasModelo, tasaAprendizaje, tasaAprendizajeModelo, capacidadBuffer } = this.hp;
    this._conv = this.hp.arquitectura === "conv";
    const crearQ = (nombre, entrenable = true) =>
      this._conv
        ? crearRedConv({ dimCinematica: DIM_CINEMATICA, filas: FILAS_LADRILLOS, columnas: COLUMNAS_LADRILLOS, capasOcultas, dimSalida: this.numAcciones, entrenable, nombre })
        : crearMLP({ dimEntrada: this.dimEstado, capasOcultas, dimSalida: this.numAcciones, entrenable, nombre });
    this.redQ = crearQ("wm_q");
    this.redQObjetivo = crearQ("wm_q_obj", false);
    copiarPesos(this.redQ, this.redQObjetivo);

    // Modelo de dinámica: entrada (s ⊕ one-hot(a)); salida (Δs, r, doneLogit).
    this.modelo = crearMLP({
      dimEntrada: this.dimEstado + this.numAcciones,
      capasOcultas: capasModelo,
      dimSalida: this.dimEstado + 2,
      nombre: "wm_dinamica",
    });

    this.optQ = tf.train.adam(tasaAprendizaje);
    this.optModelo = tf.train.adam(tasaAprendizajeModelo);
    this.buffer = new ReplayBuffer(capacidadBuffer, this.dimEstado);
    this._varsQ = variablesEntrenables(this.redQ);
    this._varsModelo = variablesEntrenables(this.modelo);
    this._errorModelo = 1.0;
    this._lossModelo = 0;
  }

  get epsilon() {
    const { epsilonInicial, epsilonFinal, pasosDecaimientoEpsilon } = this.hp;
    const frac = Math.min(1, this.pasosEntorno / pasosDecaimientoEpsilon);
    return epsilonInicial + (epsilonFinal - epsilonInicial) * frac;
  }

  _accionesEpsilon(estadosFlat, n, eps) {
    const greedy = tf.tidy(() => this._predRed(this.redQ,this._tensorEstados(estadosFlat, n)).argMax(1).dataSync());
    const acciones = new Int32Array(n);
    for (let i = 0; i < n; i++)
      acciones[i] = Math.random() < eps ? (Math.random() * this.numAcciones) | 0 : greedy[i];
    return acciones;
  }

  seleccionarAcciones(estadosFlat, n, { entrenar = true } = {}) {
    return this._accionesEpsilon(estadosFlat, n, entrenar ? this.epsilon : 0);
  }

  almacenarExperiencia(lote) {
    this.buffer.agregarLote(lote);
    this.pasosEntorno += lote.recompensas.length;
  }

  async entrenar() {
    const { arranqueModelo, arranqueAprendizaje, tamBatch } = this.hp;
    if (this.pasosEntorno < arranqueModelo || !this.buffer.estaListo(tamBatch)) return null;

    // 1) Entrenar el modelo de dinámica con datos reales.
    this._entrenarModelo(tamBatch);

    if (this.pasosEntorno < arranqueAprendizaje) {
      this.ultimasMetricas = { errorModelo: this._errorModelo, lossModelo: this._lossModelo, epsilon: this.epsilon, bufferSize: this.buffer.size, pasosPlanning: 0 };
      return this.ultimasMetricas;
    }

    // 2) Actualización Q con datos REALES.
    const muestra = this.buffer.muestrear(tamBatch);
    const lossReal = this._actualizarQ(muestra.s, muestra.a, muestra.r, muestra.s2, muestra.done, tamBatch);

    // 3) Planning: actualizaciones Q con datos IMAGINADOS por el modelo.
    const lossImaginado = this._planificar(tamBatch);

    this.pasosEntrenamiento++;
    this.ultimasMetricas = {
      loss: lossReal,
      lossImaginado,
      errorModelo: this._errorModelo,
      lossModelo: this._lossModelo,
      epsilon: this.epsilon,
      bufferSize: this.buffer.size,
      pasosPlanning: this.hp.pasosPlanning,
      batchesEntrenados: this.pasosEntrenamiento,
    };
    return this.ultimasMetricas;
  }

  // --- Modelo de dinámica -----------------------------------------------------

  _entrenarModelo(B) {
    const m = this.buffer.muestrear(B);
    const sT = tf.tensor2d(m.s, [B, this.dimEstado]);
    const s2T = tf.tensor2d(m.s2, [B, this.dimEstado]);
    const aT = tf.tensor1d(m.a, "int32");
    const aOneHot = tf.oneHot(aT, this.numAcciones, 1, 0, "float32");
    const rT = tf.tensor2d(m.r, [B, 1]);
    const doneT = tf.tensor2d(m.done, [B, 1]);
    const entrada = tf.concat([sT, aOneHot], 1);
    const dsObjetivo = s2T.sub(sT);

    const lossT = pasoGradiente(
      this.optModelo,
      () => {
        const out = this.modelo.predict(entrada);
        const dsPred = out.slice([0, 0], [B, this.dimEstado]);
        const rPred = out.slice([0, this.dimEstado], [B, 1]);
        const doneLogit = out.slice([0, this.dimEstado + 1], [B, 1]);
        const lDs = tf.losses.meanSquaredError(dsObjetivo, dsPred);
        const lR = tf.losses.meanSquaredError(rT, rPred);
        const lDone = tf.losses.sigmoidCrossEntropy(doneT, doneLogit);
        return lDs.add(lR).add(lDone.mul(0.5));
      },
      this._varsModelo
    );

    const err = tf.tidy(() => {
      const out = this.modelo.predict(entrada);
      const dsPred = out.slice([0, 0], [B, this.dimEstado]);
      return sT.add(dsPred).sub(s2T).square().mean().sqrt().dataSync()[0];
    });

    this._lossModelo = lossT.dataSync()[0];
    this._errorModelo = err;
    liberar(sT, s2T, aT, aOneHot, rT, doneT, entrada, dsObjetivo, lossT);
  }

  /** Predice (s', r, doneProb) para un batch (sin gradiente). */
  _modeloPredecir(estadosFlat, acciones, B) {
    return tf.tidy(() => {
      const sT = tf.tensor2d(estadosFlat, [B, this.dimEstado]);
      const aOneHot = tf.oneHot(tf.tensor1d(acciones, "int32"), this.numAcciones, 1, 0, "float32");
      const out = this.modelo.predict(tf.concat([sT, aOneHot], 1));
      const dsPred = out.slice([0, 0], [B, this.dimEstado]);
      const rPred = out.slice([0, this.dimEstado], [B, 1]);
      const doneLogit = out.slice([0, this.dimEstado + 1], [B, 1]);
      return {
        siguientes: sT.add(dsPred).dataSync().slice(),
        recompensas: rPred.dataSync().slice(),
        doneProbs: tf.sigmoid(doneLogit).dataSync().slice(),
      };
    });
  }

  /** Genera transiciones imaginadas (rollout encadenado) y entrena Q con ellas. */
  _planificar(B) {
    let estados = this.buffer.muestrearEstados(B);
    let lossSum = 0;
    const eps = Math.max(this.epsilon, 0.1);
    for (let p = 0; p < this.hp.pasosPlanning; p++) {
      const acciones = this._accionesEpsilon(estados, B, eps);
      const pred = this._modeloPredecir(estados, acciones, B);
      const done = new Uint8Array(B);
      for (let i = 0; i < B; i++) done[i] = pred.doneProbs[i] > 0.5 ? 1 : 0;
      lossSum += this._actualizarQ(estados, acciones, pred.recompensas, pred.siguientes, done, B);
      // Encadenar imaginación: avanzar a s', reiniciando los slots terminados.
      const siguiente = pred.siguientes;
      for (let i = 0; i < B; i++) {
        if (done[i]) {
          const fresco = this.buffer.muestrearEstados(1);
          for (let k = 0; k < this.dimEstado; k++) siguiente[i * this.dimEstado + k] = fresco[k];
        }
      }
      estados = siguiente;
    }
    return lossSum / Math.max(1, this.hp.pasosPlanning);
  }

  // --- Actualización Q (Double DQN, compartida real/imaginado) ---------------

  _actualizarQ(sFlat, acciones, recompensas, s2Flat, doneArr, B) {
    const { gamma, tau, dobleDQN } = this.hp;
    const sT = tf.tensor2d(sFlat, [B, this.dimEstado]);
    const s2T = tf.tensor2d(s2Flat, [B, this.dimEstado]);
    const aT = tf.tensor1d(acciones, "int32");
    const aOneHot = tf.oneHot(aT, this.numAcciones, 1, 0, "float32");
    const rT = tf.tensor1d(recompensas);
    const doneT = tf.tensor1d(Float32Array.from(doneArr));

    const objetivo = tf.tidy(() => {
      const qObj = this._predRed(this.redQObjetivo,s2T);
      let qSig;
      if (dobleDQN) {
        const aStar = this._predRed(this.redQ,s2T).argMax(1);
        qSig = qObj.mul(tf.oneHot(aStar, this.numAcciones)).sum(1);
      } else {
        qSig = qObj.max(1);
      }
      return rT.add(qSig.mul(gamma).mul(tf.scalar(1).sub(doneT)));
    });

    const lossT = pasoGradiente(
      this.optQ,
      () => {
        const qa = this._predRed(this.redQ,sT).mul(aOneHot).sum(1);
        return tf.losses.huberLoss(objetivo, qa);
      },
      this._varsQ
    );

    actualizacionSuave(this.redQ, this.redQObjetivo, tau);
    const loss = lossT.dataSync()[0];
    liberar(sT, s2T, aT, aOneHot, rT, doneT, objetivo, lossT);
    return loss;
  }

  obtenerDatosInspeccion(estadoFlat) {
    const datos = tf.tidy(() => {
      const sT = this._tensorEstados(estadoFlat, 1);
      const qValores = Array.from(this._predRed(this.redQ,sT).dataSync());
      let aGreedy = 0;
      for (let i = 1; i < qValores.length; i++) if (qValores[i] > qValores[aGreedy]) aGreedy = i;
      const aOneHot = tf.oneHot(tf.tensor1d([aGreedy], "int32"), this.numAcciones, 1, 0, "float32");
      const out = this.modelo.predict(tf.concat([sT, aOneHot], 1));
      const dsPred = out.slice([0, 0], [1, this.dimEstado]);
      const estadoPredicho = Array.from(sT.add(dsPred).dataSync());
      const rPred = out.slice([0, this.dimEstado], [1, 1]).dataSync()[0];
      return { qValores, aGreedy, estadoReal: Array.from(estadoFlat), estadoPredicho, rPred };
    });
    return {
      tipo: ALGORITMOS.WORLD_MODEL,
      qValores: datos.qValores,
      accionGreedy: datos.aGreedy,
      simbolos: SIMBOLOS_ACCION,
      estadoReal: datos.estadoReal,
      estadoPredicho: datos.estadoPredicho,
      recompensaPredicha: datos.rPred,
      errorModelo: this._errorModelo,
      pasosPlanning: this.hp.pasosPlanning,
      epsilon: this.epsilon,
    };
  }

  obtenerRedAccion() {
    return this.redQ;
  }

  reiniciar() {
    this.destruir();
    this.pasosEntorno = 0;
    this.pasosEntrenamiento = 0;
    this.ultimasMetricas = {};
    this._construir();
  }

  destruir() {
    this.redQ?.dispose?.();
    this.redQObjetivo?.dispose?.();
    this.modelo?.dispose?.();
    this.optQ?.dispose?.();
    this.optModelo?.dispose?.();
    this.redQ = null;
  }
}
