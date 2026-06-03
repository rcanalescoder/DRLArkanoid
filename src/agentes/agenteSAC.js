// ============================================================================
//  Agente SAC discreto (Soft Actor-Critic) — off-policy, máxima entropía
//  Actor estocástico + dos críticos Q(s,·) (reduce sobreestimación) + dos redes
//  objetivo + temperatura α ajustada automáticamente hacia una entropía objetivo.
//  Versión discreta de Christodoulou (2019).
// ============================================================================

import * as tf from "@tensorflow/tfjs";
import { AgenteBase } from "./agenteBase.js";
import { crearMLP, variablesEntrenables, copiarPesos, logSoftmax } from "./redes/constructorRedes.js";
import { ReplayBuffer } from "../datos/replayBuffer.js";
import { pasoGradiente, actualizacionSuave, liberar } from "../nucleo/gestorTensores.js";
import { ALGORITMOS, SIMBOLOS_ACCION } from "../nucleo/constantes.js";

export class AgenteSAC extends AgenteBase {
  constructor(hp) {
    super(ALGORITMOS.SAC, hp);
    this._construir();
  }

  _construir() {
    const { capasOcultas, tasaAprendizajeActor, tasaAprendizajeCritico, tasaAprendizajeAlpha, capacidadBuffer, factorEntropiaObjetivo } = this.hp;
    const mk = (nombre, dimSalida, entrenable = true) =>
      crearMLP({ dimEntrada: this.dimEstado, capasOcultas, dimSalida, entrenable, nombre });

    this.actor = mk("sac_actor", this.numAcciones);
    this.critico1 = mk("sac_q1", this.numAcciones);
    this.critico2 = mk("sac_q2", this.numAcciones);
    this.objetivo1 = mk("sac_q1_obj", this.numAcciones, false);
    this.objetivo2 = mk("sac_q2_obj", this.numAcciones, false);
    copiarPesos(this.critico1, this.objetivo1);
    copiarPesos(this.critico2, this.objetivo2);

    // Temperatura aprendible: optimizamos log α para mantener α > 0.
    this.logAlpha = tf.variable(tf.scalar(Math.log(0.2)), true, "log_alpha");
    this.targetEntropy = factorEntropiaObjetivo * Math.log(this.numAcciones);

    this.optActor = tf.train.adam(tasaAprendizajeActor);
    this.optCritico = tf.train.adam(tasaAprendizajeCritico);
    this.optAlpha = tf.train.adam(tasaAprendizajeAlpha);

    this.buffer = new ReplayBuffer(capacidadBuffer);
    this._varsActor = variablesEntrenables(this.actor);
    this._varsCritico = [...variablesEntrenables(this.critico1), ...variablesEntrenables(this.critico2)];
    this._metr = { temperatura: 0.2, entropia: 0, lossCritico: 0, lossActor: 0 };
  }

  get alpha() {
    return Math.exp(this.logAlpha.dataSync()[0]);
  }

  seleccionarAcciones(estadosFlat, n, { entrenar = true } = {}) {
    const probs = tf.tidy(() => tf.softmax(this.actor.predict(this._tensorEstados(estadosFlat, n))).dataSync());
    const acciones = new Int32Array(n);
    const A = this.numAcciones;
    for (let i = 0; i < n; i++) {
      if (entrenar) {
        const u = Math.random();
        let acum = 0, a = A - 1;
        for (let k = 0; k < A; k++) {
          acum += probs[i * A + k];
          if (u <= acum) { a = k; break; }
        }
        acciones[i] = a;
      } else {
        let a = 0;
        for (let k = 1; k < A; k++) if (probs[i * A + k] > probs[i * A + a]) a = k;
        acciones[i] = a;
      }
    }
    return acciones;
  }

  almacenarExperiencia(lote) {
    this.buffer.agregarLote(lote);
    this.pasosEntorno += lote.recompensas.length;
  }

  async entrenar() {
    const { arranqueAprendizaje, tamBatch, gamma, tau } = this.hp;
    if (this.pasosEntorno < arranqueAprendizaje || !this.buffer.estaListo(tamBatch)) return null;

    const m = this.buffer.muestrear(tamBatch);
    const sT = tf.tensor2d(m.s, [tamBatch, this.dimEstado]);
    const s2T = tf.tensor2d(m.s2, [tamBatch, this.dimEstado]);
    const aT = tf.tensor1d(m.a, "int32");
    const aOneHot = tf.oneHot(aT, this.numAcciones);
    const rT = tf.tensor1d(m.r);
    const doneT = tf.tensor1d(m.done);

    // --- Objetivo de los críticos (sin gradiente) ---
    const objetivo = tf.tidy(() => {
      const logitsN = this.actor.predict(s2T);
      const probsN = tf.softmax(logitsN);
      const logpN = logSoftmax(logitsN);
      const minQN = tf.minimum(this.objetivo1.predict(s2T), this.objetivo2.predict(s2T));
      const alpha = this.logAlpha.exp();
      const vN = probsN.mul(minQN.sub(alpha.mul(logpN))).sum(1); // [B]
      return rT.add(vN.mul(gamma).mul(tf.scalar(1).sub(doneT)));
    });

    // --- Paso críticos ---
    const lossCriticoT = pasoGradiente(
      this.optCritico,
      () => {
        const q1 = this.critico1.predict(sT).mul(aOneHot).sum(1);
        const q2 = this.critico2.predict(sT).mul(aOneHot).sum(1);
        return tf.losses.meanSquaredError(objetivo, q1).add(tf.losses.meanSquaredError(objetivo, q2));
      },
      this._varsCritico
    );

    // --- Paso actor (Q mínimo detached) ---
    const minQ = tf.tidy(() => tf.minimum(this.critico1.predict(sT), this.critico2.predict(sT)));
    const alphaConst = tf.tidy(() => this.logAlpha.exp());
    const lossActorT = pasoGradiente(
      this.optActor,
      () => {
        const logits = this.actor.predict(sT);
        const probs = tf.softmax(logits);
        const logp = logSoftmax(logits);
        return probs.mul(alphaConst.mul(logp).sub(minQ)).sum(1).mean();
      },
      this._varsActor
    );

    // --- Paso temperatura α (probs/logp detached) ---
    const { probsC, logpC, entropia } = tf.tidy(() => {
      const logits = this.actor.predict(sT);
      const probs = tf.softmax(logits);
      const logp = logSoftmax(logits);
      const H = probs.mul(logp).sum(1).mean().mul(-1).dataSync()[0];
      return { probsC: tf.keep(probs), logpC: tf.keep(logp), entropia: H };
    });
    const lossAlphaT = pasoGradiente(
      this.optAlpha,
      () => {
        const term = this.logAlpha.mul(-1).mul(logpC.add(this.targetEntropy));
        return probsC.mul(term).sum(1).mean();
      },
      [this.logAlpha]
    );

    // --- Soft update de las redes objetivo ---
    actualizacionSuave(this.critico1, this.objetivo1, tau);
    actualizacionSuave(this.critico2, this.objetivo2, tau);

    const lossCritico = lossCriticoT.dataSync()[0];
    const lossActor = lossActorT.dataSync()[0];
    liberar(sT, s2T, aT, aOneHot, rT, doneT, objetivo, minQ, alphaConst, probsC, logpC, lossCriticoT, lossActorT, lossAlphaT);

    this.pasosEntrenamiento++;
    this._metr = { temperatura: this.alpha, entropia, lossCritico, lossActor };
    this.ultimasMetricas = {
      loss: lossCritico,
      lossActor,
      temperatura: this.alpha,
      entropia,
      bufferSize: this.buffer.size,
      batchesEntrenados: this.pasosEntrenamiento,
    };
    return this.ultimasMetricas;
  }

  obtenerDatosInspeccion(estadoFlat) {
    const { probabilidades, q1, q2 } = tf.tidy(() => {
      const sT = this._tensorEstados(estadoFlat, 1);
      return {
        probabilidades: Array.from(tf.softmax(this.actor.predict(sT)).dataSync()),
        q1: Array.from(this.critico1.predict(sT).dataSync()),
        q2: Array.from(this.critico2.predict(sT).dataSync()),
      };
    });
    let accionGreedy = 0;
    for (let i = 1; i < probabilidades.length; i++)
      if (probabilidades[i] > probabilidades[accionGreedy]) accionGreedy = i;
    return {
      tipo: ALGORITMOS.SAC,
      probabilidades,
      q1Valores: q1,
      q2Valores: q2,
      accionGreedy,
      simbolos: SIMBOLOS_ACCION,
      temperatura: this._metr.temperatura,
      entropia: this._metr.entropia,
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
    this.actor?.dispose?.();
    this.critico1?.dispose?.();
    this.critico2?.dispose?.();
    this.objetivo1?.dispose?.();
    this.objetivo2?.dispose?.();
    this.logAlpha?.dispose?.();
    this.optActor?.dispose?.();
    this.optCritico?.dispose?.();
    this.optAlpha?.dispose?.();
    this.actor = null;
  }
}
