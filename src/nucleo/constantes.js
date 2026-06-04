// ============================================================================
//  Constantes globales del laboratorio DRL
//  Toda la configuración del entorno, las acciones y los hiperparámetros por
//  defecto de cada algoritmo viven aquí para tenerlas centralizadas.
// ============================================================================

// --- Acciones discretas ---------------------------------------------------
export const ACCIONES = Object.freeze({
  IZQUIERDA: 0,
  MANTENER: 1,
  DERECHA: 2,
});

export const NUM_ACCIONES = 3;
export const SIMBOLOS_ACCION = ["←", "·", "→"];
export const NOMBRES_ACCION = ["Izquierda", "Mantener", "Derecha"];

// --- Geometría de los ladrillos -------------------------------------------
// Fase 2b: rejilla 8×10 (80 celdas). El 4×7 fue la validación intermedia (Fase 1/2a).
// Si cambias esto, NUM_LADRILLOS, la dimensión del estado y el timeout se recalculan solos.
export const FILAS_LADRILLOS = 8;
export const COLUMNAS_LADRILLOS = 10;
export const NUM_LADRILLOS = FILAS_LADRILLOS * COLUMNAS_LADRILLOS; // 8×10 = 80

// --- Dimensión del estado --------------------------------------------------
// Parte CINEMÁTICA (siempre presente, 6 valores normalizados ~[-1,1]):
//   [ pelota.x, pelota.y, pelota.vx, pelota.vy, pala.x, (pelota.x - pala.x) ]
export const DIM_CINEMATICA = 6;
export const NOMBRES_ESTADO = [
  "pelota.x",
  "pelota.y",
  "pelota.vx",
  "pelota.vy",
  "pala.x",
  "Δ(pelota-pala)",
];

// Parte VISTA (Fase 1+): ocupación de los ladrillos como vector plano de
// NUM_LADRILLOS valores {0,1} (1 = vivo, 0 = roto), en orden fila-mayor. Es lo que
// le faltaba al agente para APUNTAR (antes era ciego al campo y solo podía
// sobrevivir). La baseline CIEGA (solo cinemática, 6) se conserva como contraste
// pedagógico y se activa con incluirLadrillos=false.
export const INCLUIR_LADRILLOS_DEFECTO = true;

// Escala del bloque de ocupación de ladrillos en el estado (vivo→escala, roto→0). MEDIDO
// (Fase 1): con ocupación pura {0,1} (escala 1.0) las 28 entradas AHOGAN a las 6 cinemáticas
// en la 1ª capa y la vista NO aprende a sobrevivir (atascada ~128 pasos a 600k). Atenuando a
// 0.25 (≈ iguala la varianza de ambos bloques) la vista DESPEGA: 2209 pasos · 27/28 ladrillos ·
// 51% a 600k. Es la pieza que hace funcionar la vista. Tunable (grid de la métrica real).
export const ESCALA_LADRILLOS_DEFECTO = 0.25;

/** Dimensión del vector de estado según el modo de observación. */
export function dimensionEstado(incluirLadrillos = INCLUIR_LADRILLOS_DEFECTO) {
  return incluirLadrillos ? DIM_CINEMATICA + NUM_LADRILLOS : DIM_CINEMATICA;
}

// Dimensión del modo POR DEFECTO del proyecto (Fase 1+: VISTA → 6+28 = 34). La usan
// los consumidores que no thread-ean el modo (replay buffers por defecto, agentes sin
// override). El env/gestor/agente que sí lo thread-ean usan la dimensión runtime, de
// modo que la baseline ciega (6) puede coexistir sin tocar este default.
export const DIM_ESTADO = dimensionEstado();

// Pasos por episodio POR LADRILLO. REGLA (no negociable): el límite de pasos DEBE
// escalar con el tamaño de la rejilla. Medido: un viaje pala→ladrillo→pala ≈ 63 pasos
// y se rompe ~1 ladrillo/viaje, así que limpiar N ladrillos necesita ~63·N pasos; con
// margen para sobrevivir y apuntar usamos ~90/ladrillo. Si cambias FILAS/COLUMNAS, el
// timeout se recalcula solo (NO dejarlo fijo: 600 hacía el nivel físicamente inganable).
export const PASOS_POR_LADRILLO = 90;

// --- Configuración física del entorno --------------------------------------
// El entorno usa coordenadas normalizadas: x ∈ [0,1], y ∈ [0,1] (0 = arriba).
// La física es de paso fijo (dt implícito = 1 paso). La "velocidad" de la UI
// solo controla cuántos pasos de simulación ocurren por frame, NUNCA escala
// la física (eso cambiaría la dinámica y rompería el aprendizaje).
export const CONFIGURACION_ENTORNO = Object.freeze({
  VELOCIDAD_PELOTA: 0.022, // magnitud constante del vector velocidad por paso
  RADIO_PELOTA: 0.018,
  ANCHO_PALA: 0.22,
  ALTO_PALA: 0.025,
  VELOCIDAD_PALA: 0.040, // desplazamiento de la pala por paso
  POSICION_PALA_Y: 0.92, // borde superior de la pala
  FACTOR_REBOTE: 0.9, // cuánto influye el punto de impacto en el ángulo de salida
  // Disposición de ladrillos
  MARGEN_LADRILLOS_X: 0.06,
  TOPE_LADRILLOS: 0.09,
  ALTO_LADRILLO: 0.045,
  ESPACIO_LADRILLOS: 0.012,
  // Límite de pasos por episodio = PASOS_POR_LADRILLO · nº de ladrillos.
  // 4×7 (28) → ~2520 (≈2500, resolución óptima); escala solo con la rejilla.
  MAX_PASOS_EPISODIO: PASOS_POR_LADRILLO * FILAS_LADRILLOS * COLUMNAS_LADRILLOS,
});

// --- Recompensas (tunables) -------------------------------------------------
export const RECOMPENSAS = Object.freeze({
  PASO: 0.0, // coste por paso (0 = no penalizar la supervivencia)
  GOLPEAR_PALA: 0.2, // premio por devolver la pelota con la pala (rebote correcto)
  ROMPER_LADRILLO: 1.0, // premio base por destruir un ladrillo
  // Bonus de combo: cada ladrillo roto SIN que la bola vuelva a la pala vale más.
  // Ladrillo n de una misma subida → +ROMPER + COMBO_BONUS·(n-1). Premia colar la
  // bola arriba y reventar muchos de golpe (la jugada óptima del Breakout).
  COMBO_BONUS: 0.5,
  PERDER_PELOTA: -1.0, // penalización terminal al perder la pelota
  COMPLETAR_NIVEL: 5.0, // premio terminal al limpiar todos los ladrillos
  // Reward shaping basado en potencial: Φ(s) = -|pelota.x - pala.x|.
  // Recompensa de modelado = γ·Φ(s') - Φ(s). Acelera el aprendizaje a seguir
  // la pelota sin alterar la política óptima (Ng et al. 1999).
  COEF_SHAPING: 0.30,
});

// --- Tamaño de los pools de entornos ---------------------------------------
export const POOL = Object.freeze({
  HEADLESS_MIN: 50,
  HEADLESS_MAX: 2000,
  HEADLESS_DEFECTO: 256,
  VISUALES_DEFECTO: 8,
  VISUALES_MAX: 15,
});

// --- Preferencia de backend de TF.js ---------------------------------------
export const BACKENDS_PREFERIDOS = ["webgpu", "webgl", "cpu"];

// --- Sistema de trazas ------------------------------------------------------
export const TRAZAS = Object.freeze({
  CAPACIDAD_BUFFER: 1000, // últimas N trazas en memoria
  INTERVALO_CONSOLA_MS: 30000, // imprimir resumen cada 30 s
  INTERVALO_REGISTRO_PASOS: 250, // registrar una traza cada N pasos de entrenamiento
});

// --- Identificadores de algoritmos -----------------------------------------
export const ALGORITMOS = Object.freeze({
  DQN: "dqn",
  PPO: "ppo",
  SAC: "sac",
  WORLD_MODEL: "worldModel",
  WORLD_MODEL_RECURRENTE: "worldModelRecurrente",
});

// ============================================================================
//  Hiperparámetros por defecto de cada algoritmo
//  (Ajustados durante el ciclo agéntico Build→Train→Analyze→Tune.)
// ============================================================================

export const HIPERPARAMETROS = Object.freeze({
  [ALGORITMOS.DQN]: {
    capasOcultas: [128, 128],
    tasaAprendizaje: 0.0008,
    gamma: 0.99,
    tamBatch: 128,
    capacidadBuffer: 100000,
    arranqueAprendizaje: 1500, // pasos antes de empezar a entrenar
    frecuenciaEntrenamiento: 1, // entrenar cada N lotes de experiencia
    epsilonInicial: 1.0,
    epsilonFinal: 0.05,
    // Grid de supervivencia (Fase 0.5): decaer ε antes (8000, no 12000) hace que el
    // agente deje de explorar pronto y practique su política real → sobrevive mucho
    // mejor (1.7→9.9 ladrillos en ciego). Se mantiene con la vista (re-validar).
    pasosDecaimientoEpsilon: 8000,
    tau: 0.01, // soft update de la red objetivo
    dobleDQN: true,
    prioritario: false,
  },
  [ALGORITMOS.PPO]: {
    capasOcultas: [128, 128],
    tasaAprendizaje: 0.0006,
    gamma: 0.99,
    lambdaGae: 0.95,
    longitudRollout: 256, // pasos por entorno antes de actualizar
    epocas: 4,
    tamMinibatch: 1024,
    epsilonClip: 0.2,
    coefValor: 0.5,
    coefEntropia: 0.003,
    maxNormaGradiente: 0.5,
  },
  [ALGORITMOS.SAC]: {
    capasOcultas: [128, 128],
    tasaAprendizajeActor: 0.0006,
    tasaAprendizajeCritico: 0.0008,
    tasaAprendizajeAlpha: 0.0006,
    gamma: 0.99,
    tamBatch: 128,
    capacidadBuffer: 100000,
    arranqueAprendizaje: 2000,
    tau: 0.01,
    factorEntropiaObjetivo: 0.55, // target_entropy = factor · log(num_acciones)
    frecuenciaEntrenamiento: 1,
  },
  [ALGORITMOS.WORLD_MODEL]: {
    capasOcultas: [128, 128],
    capasModelo: [200, 200], // red de dinámica
    tasaAprendizaje: 0.0008,
    tasaAprendizajeModelo: 0.0010,
    gamma: 0.99,
    tamBatch: 128,
    capacidadBuffer: 100000,
    arranqueAprendizaje: 2000,
    arranqueModelo: 1000,
    pasosPlanning: 5, // transiciones imaginadas por paso real
    horizonteImaginacion: 3, // profundidad de los rollouts imaginados
    tau: 0.01,
    epsilonInicial: 1.0,
    epsilonFinal: 0.05,
    pasosDecaimientoEpsilon: 12000,
    dobleDQN: true,
  },
  // Variante recurrente: el modelo de dinámica es un LSTM que predice la
  // SECUENCIA del estado (mantiene un estado oculto), en vez de un MLP de un
  // solo paso. Inspirado en el MDN-RNN de World Models (Ha & Schmidhuber).
  [ALGORITMOS.WORLD_MODEL_RECURRENTE]: {
    capasOcultas: [128, 128], // Q-net (igual que DQN)
    unidadesLSTM: 128, // tamaño del estado oculto del LSTM (la "memoria")
    tasaAprendizaje: 0.0008, // Q-net
    tasaAprendizajeModelo: 0.0010, // LSTM de dinámica
    gamma: 0.99,
    tamBatch: 128, // batch del Q-net
    tamBatchSec: 32, // nº de secuencias por actualización del LSTM
    longitudSecuencia: 16, // L: pasos por secuencia de entrenamiento del LSTM
    capacidadBuffer: 100000,
    capacidadSecuencias: 256, // nº de episodios guardados para entrenar el LSTM
    arranqueAprendizaje: 2000,
    arranqueModelo: 1000,
    pasosPlanning: 5, // pasos de imaginación recurrente por actualización
    tau: 0.01,
    epsilonInicial: 1.0,
    epsilonFinal: 0.05,
    // OJO: a diferencia de DQN/WM, decaer ε más rápido EMPEORA esta variante
    // (1.33→1.05 en pruebas): el LSTM necesita secuencias variadas, así que
    // le conviene explorar más tiempo. Se mantiene en 20000 a propósito.
    pasosDecaimientoEpsilon: 20000,
    dobleDQN: true,
  },
});
