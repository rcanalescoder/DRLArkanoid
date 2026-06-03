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
