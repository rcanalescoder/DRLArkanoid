// ============================================================================
//  AgenteBase — interfaz abstracta común a todos los algoritmos DRL
//  Define el contrato que usan el orquestador y los inspectores. Las subclases
//  implementan la lógica concreta (DQN, PPO, SAC, World Model).
// ============================================================================

import * as tf from "@tensorflow/tfjs";
import { DIM_ESTADO, NUM_ACCIONES } from "../nucleo/constantes.js";

export class AgenteBase {
  constructor(id, hp) {
    this.id = id;
    this.hp = hp;
    this.dimEstado = DIM_ESTADO;
    this.numAcciones = NUM_ACCIONES;
    this.pasosEntorno = 0; // experiencias recogidas
    this.pasosEntrenamiento = 0; // actualizaciones de gradiente realizadas
    this.ultimasMetricas = {};
  }

  /**
   * Selecciona una acción por entorno a partir de los estados planos [n·D].
   * @param {Float32Array} estadosFlat
   * @param {number} n
   * @param {{entrenar?:boolean}} opciones
   * @returns {Int32Array} acciones [n]
   */
  seleccionarAcciones(_estadosFlat, _n, _opciones) {
    throw new Error("seleccionarAcciones no implementado");
  }

  /** Almacena un lote de transiciones (formato de GestorEntornos). */
  almacenarExperiencia(_lote) {
    throw new Error("almacenarExperiencia no implementado");
  }

  /** Ejecuta una actualización. Devuelve métricas o null si no toca entrenar. */
  async entrenar() {
    throw new Error("entrenar no implementado");
  }

  /**
   * Datos de inspección para un único estado [D]. Distinto por algoritmo.
   * Devuelve un objeto serializable que el inspector renderiza.
   */
  obtenerDatosInspeccion(_estadoFlat) {
    return {};
  }

  /** Métricas agregadas actuales del agente. */
  obtenerMetricas() {
    return { ...this.ultimasMetricas };
  }

  /** Notifica el fin de un episodio en un entorno (opcional). */
  finEpisodio(_idEntorno) {}

  /** Libera todos los tensores/modelos. */
  destruir() {}

  /** Reinicia el agente a su estado inicial (re-crea redes). */
  reiniciar() {}

  // --- Utilidades comunes ----------------------------------------------------

  /** Crea un tensor2d [n, D] a partir de un array plano (no lo libera). */
  _tensorEstados(estadosFlat, n) {
    return tf.tensor2d(estadosFlat, [n, this.dimEstado]);
  }
}
