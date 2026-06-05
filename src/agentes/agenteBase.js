// ============================================================================
//  AgenteBase — interfaz abstracta común a todos los algoritmos DRL
//  Define el contrato que usan el orquestador y los inspectores. Las subclases
//  implementan la lógica concreta (DQN, PPO, SAC, World Model).
// ============================================================================

import * as tf from "@tensorflow/tfjs";
import {
  DIM_ESTADO,
  NUM_ACCIONES,
  DIM_CINEMATICA,
  FILAS_LADRILLOS,
  COLUMNAS_LADRILLOS,
  NUM_LADRILLOS,
} from "../nucleo/constantes.js";

export class AgenteBase {
  constructor(id, hp) {
    this.id = id;
    this.hp = hp;
    // Dimensión de entrada de la red. Por defecto la del modo del proyecto (VISTA → 34).
    // hp.dimEstado permite emparejar al agente con un gestor en otro modo (p. ej. la
    // baseline CIEGA → 6) sin tocar el default global. DEBE coincidir con la dim del
    // gestor y con la de su replay buffer (los agentes la propagan a su buffer).
    this.dimEstado = hp?.dimEstado ?? DIM_ESTADO;
    this.numAcciones = NUM_ACCIONES;
    // Arquitectura "conv" (Fase 2b/3): las subclases que la soporten ponen this._conv=true
    // en _construir y usan this._predRed para alimentar el modelo multi-entrada.
    this._conv = false;
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

  /**
   * Red feedforward que produce la acción (greedy = argMax de su salida). Es lo
   * ÚNICO que hace falta para JUGAR: la guarda el zoo (offline) y la carga el
   * reproductor (navegador). Las subclases la sobreescriben devolviendo su red
   * de política / Q. No incluye optimizador, buffer ni redes objetivo.
   * @returns {import("@tensorflow/tfjs").LayersModel|null}
   */
  obtenerRedAccion() {
    return null;
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

  /**
   * Predicción que soporta arquitectura plana y conv. En conv parte el estado plano
   * [n, 6+NUM_LADRILLOS] en cinemática [n,6] y matriz de ladrillos [n,F,C,1] (orden
   * fila-mayor) y alimenta las dos entradas del modelo funcional; en plano predice
   * directo. Llamar siempre dentro de tf.tidy o del closure de gradiente (gestionan
   * los tensores intermedios del slice/reshape).
   */
  _predRed(red, sT) {
    if (!this._conv) return red.predict(sT);
    const n = sT.shape[0];
    const cin = sT.slice([0, 0], [n, DIM_CINEMATICA]);
    const matFlat = sT.slice([0, DIM_CINEMATICA], [n, NUM_LADRILLOS]);
    const mat = matFlat.reshape([n, FILAS_LADRILLOS, COLUMNAS_LADRILLOS, 1]);
    return red.predict([cin, mat]);
  }
}
