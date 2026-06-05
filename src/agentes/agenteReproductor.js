// ============================================================================
//  AgenteReproductor — envoltorio minimalista para JUGAR con un modelo cargado
//  No entrena ni guarda experiencia: solo recibe una RED DE ACCIÓN ya entrenada
//  (un tf.LayersModel cargado del zoo o de IndexedDB) y elige la acción greedy
//  (argMax de su salida). Sirve igual para Q-values (DQN/WM) y logits (PPO/SAC):
//  el argMax de ambos da la acción greedy. Hereda _predRed/_tensorEstados de
//  AgenteBase, así que soporta arquitectura plana y conv de forma transparente.
// ============================================================================

import * as tf from "@tensorflow/tfjs";
import { AgenteBase } from "./agenteBase.js";
import { DIM_ESTADO } from "../nucleo/constantes.js";

export class AgenteReproductor extends AgenteBase {
  /**
   * @param {import("@tensorflow/tfjs").LayersModel} red  red de acción ya entrenada
   * @param {{dimEstado?:number, id?:string}} opciones
   */
  constructor(red, { dimEstado = DIM_ESTADO, id = "reproductor" } = {}) {
    super(id, { dimEstado });
    this.red = red;
    // conv = modelo funcional multi-entrada (cinemática + matriz de ladrillos).
    // Lo detectamos de la propia red cargada → no dependemos de un flag externo.
    this._conv = Array.isArray(red.inputs) && red.inputs.length > 1;
  }

  /** Siempre greedy (ε=0): es un modelo entrenado puesto a jugar. */
  seleccionarAcciones(estadosFlat, n) {
    const greedy = tf.tidy(() => {
      const sT = this._tensorEstados(estadosFlat, n);
      return this._predRed(this.red, sT).argMax(1).dataSync();
    });
    return Int32Array.from(greedy);
  }

  obtenerRedAccion() {
    return this.red;
  }

  destruir() {
    this.red?.dispose?.();
    this.red = null;
  }
}
