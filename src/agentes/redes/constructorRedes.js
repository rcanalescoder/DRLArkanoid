// ============================================================================
//  Factoría de redes neuronales (MLPs)
//  Construye perceptrones multicapa reutilizables para todos los algoritmos.
//  Salida lineal por defecto: para políticas softmax preferimos trabajar con
//  logits y aplicar log-softmax manualmente (más estable numéricamente).
// ============================================================================

import * as tf from "@tensorflow/tfjs";

/**
 * Crea un MLP secuencial.
 * @param {object} cfg
 * @param {number} cfg.dimEntrada
 * @param {number[]} cfg.capasOcultas   p.ej. [128,128]
 * @param {number} cfg.dimSalida
 * @param {string} [cfg.activacionSalida="linear"]
 * @param {string} [cfg.activacionOculta="relu"]
 * @param {string} [cfg.nombre]
 * @returns {tf.LayersModel}
 */
export function crearMLP({
  dimEntrada,
  capasOcultas,
  dimSalida,
  activacionSalida = "linear",
  activacionOculta = "relu",
  entrenable = true,
  nombre = "mlp",
}) {
  const modelo = tf.sequential({ name: nombre });
  capasOcultas.forEach((unidades, i) => {
    modelo.add(
      tf.layers.dense({
        units: unidades,
        activation: activacionOculta,
        inputShape: i === 0 ? [dimEntrada] : undefined,
        kernelInitializer: "heNormal",
        trainable: entrenable,
        name: `${nombre}_oculta${i}`,
      })
    );
  });
  modelo.add(
    tf.layers.dense({
      units: dimSalida,
      activation: activacionSalida,
      kernelInitializer: "glorotUniform",
      trainable: entrenable,
      name: `${nombre}_salida`,
    })
  );
  return modelo;
}

/**
 * Red multi-entrada con encoder CONVOLUCIONAL para la matriz de ladrillos +
 * rama cinemática (Fase 2b, rejilla 8×10). Entradas (API funcional):
 *   [ cinemática (dimCinematica) , matriz de ladrillos (filas × columnas × 1) ].
 * La rama conv extrae estructura espacial 2D (qué zonas tienen ladrillos vivos);
 * la cinemática va por su propia rama, así no se ahoga (es el arreglo estructural
 * de lo que en el flat MLP resolvíamos con escala). Salida lineal [dimSalida].
 * Es un tf.LayersModel normal: copiarPesos / soft update / variablesEntrenables valen.
 */
export function crearRedConv({
  dimCinematica,
  filas,
  columnas,
  capasOcultas,
  dimSalida,
  filtrosConv = [16, 32],
  unidadesCinematica = 16,
  activacionSalida = "linear",
  entrenable = true,
  nombre = "conv",
}) {
  const inCin = tf.input({ shape: [dimCinematica], name: `${nombre}_in_cin` });
  const inMat = tf.input({ shape: [filas, columnas, 1], name: `${nombre}_in_mat` });
  let x = inMat;
  filtrosConv.forEach((f, i) => {
    x = tf.layers
      .conv2d({
        filters: f,
        kernelSize: 3,
        padding: "same",
        activation: "relu",
        kernelInitializer: "heNormal",
        trainable: entrenable,
        name: `${nombre}_conv${i}`,
      })
      .apply(x);
  });
  x = tf.layers.flatten({ name: `${nombre}_flat` }).apply(x);
  const k = tf.layers
    .dense({
      units: unidadesCinematica,
      activation: "relu",
      kernelInitializer: "heNormal",
      trainable: entrenable,
      name: `${nombre}_cin`,
    })
    .apply(inCin);
  let h = tf.layers.concatenate({ name: `${nombre}_concat` }).apply([k, x]);
  capasOcultas.forEach((u, i) => {
    h = tf.layers
      .dense({
        units: u,
        activation: "relu",
        kernelInitializer: "heNormal",
        trainable: entrenable,
        name: `${nombre}_h${i}`,
      })
      .apply(h);
  });
  const salida = tf.layers
    .dense({
      units: dimSalida,
      activation: activacionSalida,
      kernelInitializer: "glorotUniform",
      trainable: entrenable,
      name: `${nombre}_salida`,
    })
    .apply(h);
  return tf.model({ inputs: [inCin, inMat], outputs: salida, name: nombre });
}

/**
 * Devuelve las variables entrenables de un modelo como tf.Variable[], para
 * pasarlas como varList explícito a optimizador.minimize y evitar que los
 * gradientes contaminen otros modelos (clave en SAC con varias redes).
 */
export function variablesEntrenables(modelo) {
  return modelo.trainableWeights.map((w) => w.val);
}

/** Copia dura de pesos origen → destino (sincronización de red objetivo). */
export function copiarPesos(origen, destino) {
  const pesos = origen.getWeights().map((w) => w.clone());
  destino.setWeights(pesos);
  pesos.forEach((p) => p.dispose());
}

/** log-softmax estable: logits - logsumexp(logits). */
export function logSoftmax(logits) {
  return tf.tidy(() => {
    const max = logits.max(-1, true);
    const estable = logits.sub(max);
    const logSum = estable.exp().sum(-1, true).log();
    return estable.sub(logSum);
  });
}
