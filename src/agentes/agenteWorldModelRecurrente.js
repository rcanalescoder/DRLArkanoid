// ============================================================================
//  Agente World Model RECURRENTE (Dyna-Q con dinámica LSTM)
//  Variante del World Model en la que el modelo de dinámica NO es un MLP de un
//  solo paso, sino un LSTM que predice la SECUENCIA del estado manteniendo un
//  estado oculto (memoria del pasado). Inspirado en el MDN-RNN de "World Models"
//  (Ha & Schmidhuber, 2018) — aquí en versión simplificada (predicción directa
//  de Δs, sin mezcla de gaussianas), igual que el ejemplo de referencia.
//
//  Por qué: el MLP de un paso, al imaginar varios pasos, encadena predicciones
//  independientes y ACUMULA error (model bias). El LSTM se entrena sobre
//  secuencias para minimizar el error a lo largo del tiempo y, al imaginar,
//  arrastra su estado oculto → rollouts más coherentes a más pasos.
// ============================================================================

import * as tf from "@tensorflow/tfjs";
import { AgenteBase } from "./agenteBase.js";
import { crearMLP, variablesEntrenables, copiarPesos } from "./redes/constructorRedes.js";
import { ReplayBuffer } from "../datos/replayBuffer.js";
import { BufferSecuencias } from "../datos/bufferSecuencias.js";
import { pasoGradiente, actualizacionSuave, liberar } from "../nucleo/gestorTensores.js";
import { ALGORITMOS, SIMBOLOS_ACCION } from "../nucleo/constantes.js";

export class AgenteWorldModelRecurrente extends AgenteBase {
  constructor(hp) {
    super(ALGORITMOS.WORLD_MODEL_RECURRENTE, hp);
    this._construir();
  }

  _construir() {
    const { capasOcultas, unidadesLSTM, tasaAprendizaje, tasaAprendizajeModelo, capacidadBuffer, capacidadSecuencias } = this.hp;

    // Q-net (igual que DQN): decide las acciones.
    this.redQ = crearMLP({ dimEntrada: this.dimEstado, capasOcultas, dimSalida: this.numAcciones, nombre: "wmr_q" });
    this.redQObjetivo = crearMLP({ dimEntrada: this.dimEstado, capasOcultas, dimSalida: this.numAcciones, entrenable: false, nombre: "wmr_q_obj" });
    copiarPesos(this.redQ, this.redQObjetivo);

    // Modelo de dinámica RECURRENTE: secuencia [s ⊕ one-hot(a)] → [Δs, r, doneLogit].
    // LSTM con returnSequences=true + Dense por paso temporal.
    this.modelo = tf.sequential({ name: "wmr_modelo" });
    this.modelo.add(tf.layers.lstm({
      units: unidadesLSTM,
      returnSequences: true,
      inputShape: [null, this.dimEstado + this.numAcciones],
      name: "wmr_lstm",
    }));
    this.modelo.add(tf.layers.dense({ units: this.dimEstado + 2, name: "wmr_salida" }));

    this.optQ = tf.train.adam(tasaAprendizaje);
    this.optModelo = tf.train.adam(tasaAprendizajeModelo);
    this.buffer = new ReplayBuffer(capacidadBuffer, this.dimEstado);
    this.bufferSec = new BufferSecuencias(capacidadSecuencias, this.dimEstado);
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
    const greedy = tf.tidy(() => this.redQ.predict(this._tensorEstados(estadosFlat, n)).argMax(1).dataSync());
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
    this.bufferSec.agregarLote(lote);
    this.pasosEntorno += lote.recompensas.length;
  }

  async entrenar() {
    const { arranqueModelo, arranqueAprendizaje, tamBatch, tamBatchSec, longitudSecuencia } = this.hp;
    if (this.pasosEntorno < arranqueModelo || !this.buffer.estaListo(tamBatch)) return null;

    // 1) Entrenar el LSTM de dinámica con secuencias reales.
    const modeloListo = this.bufferSec.estaListo(longitudSecuencia);
    if (modeloListo) this._entrenarModeloSec(tamBatchSec, longitudSecuencia);

    if (this.pasosEntorno < arranqueAprendizaje) {
      this.ultimasMetricas = { errorModelo: this._errorModelo, lossModelo: this._lossModelo, epsilon: this.epsilon, bufferSize: this.buffer.size, pasosPlanning: 0 };
      return this.ultimasMetricas;
    }

    // 2) Q con datos REALES.
    const m = this.buffer.muestrear(tamBatch);
    const lossReal = this._actualizarQ(m.s, m.a, m.r, m.s2, m.done, tamBatch);

    // 3) Imaginación RECURRENTE (planning con el LSTM).
    const lossImaginado = modeloListo ? this._planificar(tamBatch) : 0;

    this.pasosEntrenamiento++;
    this.ultimasMetricas = {
      loss: lossReal,
      lossImaginado,
      errorModelo: this._errorModelo,
      lossModelo: this._lossModelo,
      epsilon: this.epsilon,
      bufferSize: this.buffer.size,
      pasosPlanning: this.hp.pasosPlanning,
      unidadesLSTM: this.hp.unidadesLSTM,
      episodiosSecuencia: this.bufferSec.numEpisodios,
      batchesEntrenados: this.pasosEntrenamiento,
    };
    return this.ultimasMetricas;
  }

  // --- Modelo de dinámica LSTM (entrenamiento por secuencias) -----------------

  _entrenarModeloSec(B, L) {
    const m = this.bufferSec.muestrear(B, L);
    if (!m) return;
    const sT = tf.tensor3d(m.s, [B, L, this.dimEstado]);
    const aT = tf.tensor2d(m.a, [B, L], "int32");
    const aOH = tf.oneHot(aT, this.numAcciones); // [B,L,A]
    const x = tf.concat([sT, aOH], 2); // [B,L,D+A]
    const dsT = tf.tensor3d(m.ds, [B, L, this.dimEstado]);
    const rT = tf.tensor3d(m.r, [B, L, 1]);
    const doneT = tf.tensor3d(m.done, [B, L, 1]);

    const lossT = pasoGradiente(
      this.optModelo,
      () => {
        const out = this.modelo.apply(x); // [B,L,D+2]
        const dsPred = out.slice([0, 0, 0], [B, L, this.dimEstado]);
        const rPred = out.slice([0, 0, this.dimEstado], [B, L, 1]);
        const doneLogit = out.slice([0, 0, this.dimEstado + 1], [B, L, 1]);
        const lDs = tf.losses.meanSquaredError(dsT, dsPred);
        const lR = tf.losses.meanSquaredError(rT, rPred);
        const lDone = tf.losses.sigmoidCrossEntropy(doneT, doneLogit);
        return lDs.add(lR).add(lDone.mul(0.5));
      },
      this._varsModelo
    );

    const err = tf.tidy(() => {
      const out = this.modelo.predict(x);
      const dsPred = out.slice([0, 0, 0], [B, L, this.dimEstado]);
      return dsPred.sub(dsT).square().mean().sqrt().dataSync()[0];
    });

    this._lossModelo = lossT.dataSync()[0];
    this._errorModelo = err;
    liberar(sT, aT, aOH, x, dsT, rT, doneT, lossT);
  }

  /**
   * Imaginación recurrente: parte de estados reales y rueda el LSTM hacia
   * delante alimentándole sus PROPIAS predicciones, manteniendo la secuencia
   * (su estado oculto resume el pasado imaginado). Entrena el Q-net con cada
   * transición imaginada.
   */
  _planificar(B) {
    let s = this.buffer.muestrearEstados(B);
    const eps = Math.max(this.epsilon, 0.1);
    let seqT = null; // secuencia imaginada [B, p, D+A]
    let lossSum = 0;

    for (let p = 0; p < this.hp.pasosPlanning; p++) {
      const acciones = this._accionesEpsilon(s, B, eps);
      const stepX = tf.tidy(() => {
        const sT = tf.tensor2d(s, [B, this.dimEstado]);
        const aOH = tf.oneHot(tf.tensor1d(acciones, "int32"), this.numAcciones);
        return tf.concat([sT, aOH], 1).reshape([B, 1, this.dimEstado + this.numAcciones]);
      });
      if (seqT == null) {
        seqT = stepX;
      } else {
        const nuevo = tf.concat([seqT, stepX], 1);
        seqT.dispose();
        stepX.dispose();
        seqT = nuevo;
      }

      const pred = tf.tidy(() => {
        const out = this.modelo.predict(seqT); // [B, p+1, D+2]
        const Lp = out.shape[1];
        const last = out.slice([0, Lp - 1, 0], [B, 1, this.dimEstado + 2]).reshape([B, this.dimEstado + 2]);
        const dsPred = last.slice([0, 0], [B, this.dimEstado]);
        const rPred = last.slice([0, this.dimEstado], [B, 1]);
        const doneLogit = last.slice([0, this.dimEstado + 1], [B, 1]);
        const sT = tf.tensor2d(s, [B, this.dimEstado]);
        return {
          s2: sT.add(dsPred).dataSync().slice(),
          r: rPred.reshape([B]).dataSync().slice(),
          doneProb: tf.sigmoid(doneLogit).reshape([B]).dataSync().slice(),
        };
      });

      const done = new Uint8Array(B);
      for (let i = 0; i < B; i++) done[i] = pred.doneProb[i] > 0.5 ? 1 : 0;
      lossSum += this._actualizarQ(s, acciones, pred.r, pred.s2, done, B);
      s = pred.s2;
    }

    liberar(seqT);
    return lossSum / Math.max(1, this.hp.pasosPlanning);
  }

  // --- Actualización Q (Double DQN + Huber + soft update) --------------------

  _actualizarQ(sFlat, acciones, recompensas, s2Flat, doneArr, B) {
    const { gamma, tau, dobleDQN } = this.hp;
    const sT = tf.tensor2d(sFlat, [B, this.dimEstado]);
    const s2T = tf.tensor2d(s2Flat, [B, this.dimEstado]);
    const aT = tf.tensor1d(acciones, "int32");
    const aOneHot = tf.oneHot(aT, this.numAcciones);
    const rT = tf.tensor1d(recompensas);
    const doneT = tf.tensor1d(Float32Array.from(doneArr));

    const objetivo = tf.tidy(() => {
      const qObj = this.redQObjetivo.predict(s2T);
      let qSig;
      if (dobleDQN) {
        const aStar = this.redQ.predict(s2T).argMax(1);
        qSig = qObj.mul(tf.oneHot(aStar, this.numAcciones)).sum(1);
      } else {
        qSig = qObj.max(1);
      }
      return rT.add(qSig.mul(gamma).mul(tf.scalar(1).sub(doneT)));
    });

    const lossT = pasoGradiente(
      this.optQ,
      () => {
        const qa = this.redQ.predict(sT).mul(aOneHot).sum(1);
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
      const qValores = Array.from(this.redQ.predict(sT).dataSync());
      let aGreedy = 0;
      for (let i = 1; i < qValores.length; i++) if (qValores[i] > qValores[aGreedy]) aGreedy = i;
      const aOH = tf.oneHot(tf.tensor1d([aGreedy], "int32"), this.numAcciones);
      const x = tf.concat([sT, aOH], 1).reshape([1, 1, this.dimEstado + this.numAcciones]);
      const out = this.modelo.predict(x).reshape([this.dimEstado + 2]); // [D+2]
      const dsPred = out.slice([0], [this.dimEstado]);
      const estadoPredicho = Array.from(sT.reshape([this.dimEstado]).add(dsPred).dataSync());
      const rPred = out.slice([this.dimEstado], [1]).dataSync()[0];
      return { qValores, aGreedy, estadoReal: Array.from(estadoFlat), estadoPredicho, rPred };
    });
    return {
      tipo: ALGORITMOS.WORLD_MODEL, // reutiliza el inspector del World Model
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
    this.bufferSec?.limpiar?.();
    this.redQ = null;
  }
}
