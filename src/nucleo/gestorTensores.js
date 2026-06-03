// ============================================================================
//  Gestor de tensores
//  Envoltorios sobre tf.tidy / tf.keep y utilidades para detectar fugas de
//  tensores. En DRL es muy fácil filtrar tensores (predicciones en bucle), así
//  que centralizamos la disciplina de memoria aquí.
// ============================================================================

import * as tf from "@tensorflow/tfjs";

let _lineaBaseTensores = 0;

/**
 * Fija la línea base de tensores "esperados" (pesos de modelos, buffers, etc.).
 * Tras inicializar agentes, se llama para que la detección de fugas mida el
 * crecimiento por encima de este punto.
 */
export function fijarLineaBase() {
  _lineaBaseTensores = tf.memory().numTensors;
  return _lineaBaseTensores;
}

export function lineaBase() {
  return _lineaBaseTensores;
}

/**
 * Ejecuta fn dentro de tf.tidy, liberando todos los tensores intermedios.
 * Idéntico a tf.tidy pero con nombre en español para legibilidad del código.
 */
export function conLimpieza(fn) {
  return tf.tidy(fn);
}

/**
 * Estado de memoria actual, con el delta respecto a la línea base.
 */
export function estadoMemoria() {
  const m = tf.memory();
  return {
    numTensores: m.numTensors,
    numBuffers: m.numDataBuffers ?? 0,
    bytes: m.numBytes,
    megabytes: +(m.numBytes / (1024 * 1024)).toFixed(2),
    deltaLineaBase: m.numTensors - _lineaBaseTensores,
    backend: tf.getBackend(),
  };
}

/**
 * Comprueba si hay una posible fuga (crecimiento sostenido de tensores).
 * Devuelve true si el delta supera el umbral.
 */
export function hayFuga(umbral = 200) {
  return tf.memory().numTensors - _lineaBaseTensores > umbral;
}

/**
 * Libera de forma segura una lista de tensores/variables, ignorando nulos.
 */
export function liberar(...tensores) {
  for (const t of tensores) {
    if (t && typeof t.dispose === "function" && !t.isDisposed) {
      t.dispose();
    }
  }
}

/**
 * Copia los pesos de origen a destino mediante interpolación suave (Polyak):
 *   destino ← τ·origen + (1-τ)·destino
 * Con τ = 1 equivale a una copia dura. Se usa para las redes objetivo.
 */
export function actualizacionSuave(modeloOrigen, modeloDestino, tau) {
  const pesosOrigen = modeloOrigen.getWeights();
  const pesosDestino = modeloDestino.getWeights();
  const nuevos = tf.tidy(() =>
    pesosDestino.map((wd, i) =>
      tau === 1
        ? pesosOrigen[i].clone()
        : wd.mul(1 - tau).add(pesosOrigen[i].mul(tau))
    )
  );
  modeloDestino.setWeights(nuevos);
  liberar(...nuevos);
}

/**
 * Paso de gradiente con recorte por norma global (gradient clipping), usado por
 * PPO y SAC. Calcula gradientes de `fnPerdida` respecto a `variables`, los
 * recorta a `maxNorma` (si > 0) y los aplica con el optimizador.
 * @returns {tf.Scalar} el valor de la pérdida (el llamador debe liberarlo).
 */
export function pasoGradiente(optimizador, fnPerdida, variables, maxNorma = 0) {
  const { value, grads } = tf.variableGrads(fnPerdida, variables);
  let aAplicar = grads;
  let escalados = null;

  if (maxNorma > 0) {
    const factor = tf.tidy(() => {
      let suma = tf.scalar(0);
      for (const k in grads) suma = suma.add(grads[k].square().sum());
      const norma = suma.sqrt();
      return tf.minimum(tf.scalar(1), tf.scalar(maxNorma).div(norma.add(1e-8)));
    });
    const f = factor.dataSync()[0];
    factor.dispose();
    escalados = {};
    for (const k in grads) escalados[k] = grads[k].mul(f);
    aAplicar = escalados;
  }

  optimizador.applyGradients(aAplicar);
  for (const k in grads) grads[k].dispose();
  if (escalados) for (const k in escalados) escalados[k].dispose();
  return value;
}

/** Normaliza un tensor 1D a media 0 y desviación 1 (para ventajas de PPO). */
export function normalizar(tensor) {
  return tf.tidy(() => {
    const media = tensor.mean();
    const desv = tensor.sub(media).square().mean().sqrt();
    return tensor.sub(media).div(desv.add(1e-8));
  });
}

export { tf };
