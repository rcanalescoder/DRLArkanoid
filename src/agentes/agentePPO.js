// ============================================================================
//  Agente PPO (Proximal Policy Optimization) — discreto, on-policy
//  Actor (logits) + crítica (valor). Recoge rollouts de N entornos, calcula
//  ventajas con GAE y optimiza el objetivo recortado (clipped surrogate) en
//  varias épocas con minibatches. Recorte de gradiente por norma global.
// ============================================================================

import * as tf from "@tensorflow/tfjs";
import { AgenteBase } from "./agenteBase.js";
import { crearMLP, crearRedConv, variablesEntrenables, logSoftmax } from "./redes/constructorRedes.js";
import { RolloutBuffer } from "../datos/rolloutBuffer.js";
import { pasoGradiente, normalizar, liberar } from "../nucleo/gestorTensores.js";
import { ALGORITMOS, SIMBOLOS_ACCION, DIM_CINEMATICA, FILAS_LADRILLOS, COLUMNAS_LADRILLOS } from "../nucleo/constantes.js";

export class AgentePPO extends AgenteBase {
  constructor(hp) {
    super(ALGORITMOS.PPO, hp);
    this._construir();
  }

  _construir() {
    const { capasOcultas, tasaAprendizaje, arquitectura } = this.hp;
    this._conv = arquitectura === "conv";
    const crear = (nombre, dimSalida) =>
      this._conv
        ? crearRedConv({ dimCinematica: DIM_CINEMATICA, filas: FILAS_LADRILLOS, columnas: COLUMNAS_LADRILLOS, capasOcultas, dimSalida, nombre })
        : crearMLP({ dimEntrada: this.dimEstado, capasOcultas, dimSalida, nombre });
    this.actor = crear("ppo_actor", this.numAcciones);
    this.critico = crear("ppo_critico", 1);
    this.optimizador = tf.train.adam(tasaAprendizaje);
    this._vars = [...variablesEntrenables(this.actor), ...variablesEntrenables(this.critico)];
    this.rollout = null;
    this._numEnvs = 0;
    this._metr = { entropia: 0, lossPolitica: 0, lossValor: 0, rolloutProgreso: 0 };
  }

  _asegurarRollout(n) {
    if (this.rollout && this._numEnvs === n) return;
    this.rollout = new RolloutBuffer({
      numEnvs: n,
      longitud: this.hp.longitudRollout,
      dim: this.dimEstado,
    });
    this._numEnvs = n;
  }

  seleccionarAcciones(estadosFlat, n, { entrenar = true } = {}) {
    const A = this.numAcciones;
    const probs = tf.tidy(() =>
      tf.softmax(this._predRed(this.actor,this._tensorEstados(estadosFlat, n))).dataSync()
    );
    const acciones = new Int32Array(n);

    // IMPORTANTE: el pool visual (entrenar:false) NO debe tocar el rollout ni el
    // stash; si lo hiciera, reasignaría/vaciaría el rollout de entrenamiento cada
    // frame y PPO no entrenaría nunca. Aquí solo calcula la acción greedy.
    if (!entrenar) {
      for (let i = 0; i < n; i++) {
        let a = 0;
        for (let k = 1; k < A; k++) if (probs[i * A + k] > probs[i * A + a]) a = k;
        acciones[i] = a;
      }
      return acciones;
    }

    // Entrenamiento on-policy: muestrear de la política y guardar logp y valor.
    this._asegurarRollout(n);
    const valores = tf.tidy(() =>
      this._predRed(this.critico,this._tensorEstados(estadosFlat, n)).dataSync()
    );
    const logps = new Float32Array(n);
    const valoresArr = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const u = Math.random();
      let acum = 0, a = A - 1;
      for (let k = 0; k < A; k++) {
        acum += probs[i * A + k];
        if (u <= acum) { a = k; break; }
      }
      acciones[i] = a;
      logps[i] = Math.log(Math.max(probs[i * A + a], 1e-8));
      valoresArr[i] = valores[i];
    }
    this._ultEstados = estadosFlat.slice();
    this._ultAcciones = acciones;
    this._ultLogps = logps;
    this._ultValores = valoresArr;
    return acciones;
  }

  almacenarExperiencia(lote) {
    this.rollout.agregarFila(
      this._ultEstados,
      this._ultAcciones,
      this._ultLogps,
      lote.recompensas,
      lote.terminados,
      this._ultValores
    );
    this._ultSiguientes = lote.siguientes;
    this.pasosEntorno += lote.recompensas.length;
    this._metr.rolloutProgreso = this.rollout.fila / this.hp.longitudRollout;
  }

  async entrenar() {
    if (!this.rollout || !this.rollout.lleno) return null;
    const { gamma, lambdaGae, epocas, tamMinibatch, epsilonClip, coefValor, coefEntropia, maxNormaGradiente } = this.hp;

    // Bootstrap V(s_T) del estado actual tras el último paso.
    const ultimosValores = tf.tidy(() =>
      this._predRed(this.critico,this._tensorEstados(this._ultSiguientes, this._numEnvs)).reshape([this._numEnvs]).dataSync()
    );
    this.rollout.calcularVentajas(ultimosValores, gamma, lambdaGae);
    const datos = this.rollout.obtenerAplanado();
    const m = datos.m;

    const sAll = tf.tensor2d(datos.s, [m, this.dimEstado]);
    const aAll = tf.tensor1d(datos.a, "int32");
    const logpViejoAll = tf.tensor1d(datos.logp);
    const retAll = tf.tensor1d(datos.ret);
    const advAll = normalizar(tf.tensor1d(datos.adv));

    const A = this.numAcciones;
    let lossPolAcum = 0, lossValAcum = 0, pasos = 0;

    for (let epoca = 0; epoca < epocas; epoca++) {
      const orden = barajar(m);
      for (let inicio = 0; inicio < m; inicio += tamMinibatch) {
        const fin = Math.min(inicio + tamMinibatch, m);
        const idx = tf.tensor1d(orden.slice(inicio, fin), "int32");
        const sMb = sAll.gather(idx);
        const aMb = aAll.gather(idx);
        const logpViejoMb = logpViejoAll.gather(idx);
        const advMb = advAll.gather(idx);
        const retMb = retAll.gather(idx);
        const aOneHot = tf.oneHot(aMb, A);

        const lossT = pasoGradiente(
          this.optimizador,
          () => {
            const logits = this._predRed(this.actor,sMb);
            const logp = logSoftmax(logits); // [B,A]
            const logpA = logp.mul(aOneHot).sum(1); // [B]
            const ratio = logpA.sub(logpViejoMb).exp();
            const surr1 = ratio.mul(advMb);
            const surr2 = ratio.clipByValue(1 - epsilonClip, 1 + epsilonClip).mul(advMb);
            const lossPol = surr1.minimum(surr2).mean().mul(-1);
            const probs = tf.softmax(logits);
            const entropia = probs.mul(logp).sum(1).mean().mul(-1);
            const valor = this._predRed(this.critico,sMb).reshape([fin - inicio]);
            const lossVal = valor.sub(retMb).square().mean();
            return lossPol.add(lossVal.mul(coefValor)).sub(entropia.mul(coefEntropia));
          },
          this._vars,
          maxNormaGradiente
        );

        lossPolAcum += lossT.dataSync()[0];
        pasos++;
        liberar(idx, sMb, aMb, logpViejoMb, advMb, retMb, aOneHot, lossT);
      }
    }

    // --- Métricas finales (sin gradiente) sobre todo el rollout ---
    const { entropia, lossValor } = tf.tidy(() => {
      const logits = this._predRed(this.actor,sAll);
      const logp = logSoftmax(logits);
      const probs = tf.softmax(logits);
      const H = probs.mul(logp).sum(1).mean().mul(-1).dataSync()[0];
      const v = this._predRed(this.critico,sAll).reshape([m]);
      const lv = v.sub(retAll).square().mean().dataSync()[0];
      return { entropia: H, lossValor: lv };
    });

    liberar(sAll, aAll, logpViejoAll, retAll, advAll);
    this.rollout.limpiar();
    this.pasosEntrenamiento += pasos;

    this._metr = {
      entropia,
      lossPolitica: lossPolAcum / Math.max(1, pasos),
      lossValor,
      rolloutProgreso: 0,
    };
    this.ultimasMetricas = {
      loss: lossValor + Math.abs(this._metr.lossPolitica),
      lossValor,
      lossPolitica: this._metr.lossPolitica,
      entropia,
      rolloutProgreso: 1,
      batchesEntrenados: this.pasosEntrenamiento,
    };
    return this.ultimasMetricas;
  }

  obtenerDatosInspeccion(estadoFlat) {
    const { probabilidades, valor, entropia } = tf.tidy(() => {
      const sT = this._tensorEstados(estadoFlat, 1);
      const logits = this._predRed(this.actor,sT);
      const probs = tf.softmax(logits);
      const logp = logSoftmax(logits);
      return {
        probabilidades: Array.from(probs.dataSync()),
        valor: this._predRed(this.critico,sT).dataSync()[0],
        entropia: probs.mul(logp).sum(1).mul(-1).dataSync()[0],
      };
    });
    let accionGreedy = 0;
    for (let i = 1; i < probabilidades.length; i++)
      if (probabilidades[i] > probabilidades[accionGreedy]) accionGreedy = i;
    return {
      tipo: ALGORITMOS.PPO,
      probabilidades,
      accionGreedy,
      simbolos: SIMBOLOS_ACCION,
      valorEstimado: valor,
      entropia,
      rolloutProgreso: this._metr.rolloutProgreso,
    };
  }

  obtenerMetricas() {
    return { ...this.ultimasMetricas, rolloutProgreso: this._metr.rolloutProgreso };
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
    this.critico?.dispose?.();
    this.optimizador?.dispose?.();
    this.actor = null;
    this.critico = null;
  }
}

function barajar(n) {
  const arr = new Int32Array(n);
  for (let i = 0; i < n; i++) arr[i] = i;
  for (let i = n - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}
