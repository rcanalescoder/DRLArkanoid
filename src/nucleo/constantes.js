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

// --- Dimensión del estado --------------------------------------------------
// [ pelota.x, pelota.y, pelota.vx, pelota.vy, pala.x, (pelota.x - pala.x) ]
// Todas las componentes están normalizadas aproximadamente a [-1, 1].
export const DIM_ESTADO = 6;
export const NOMBRES_ESTADO = [
  "pelota.x",
  "pelota.y",
  "pelota.vx",
  "pelota.vy",
  "pala.x",
  "Δ(pelota-pala)",
];

// --- Geometría de los ladrillos -------------------------------------------
export const FILAS_LADRILLOS = 4;
export const COLUMNAS_LADRILLOS = 7;

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
  // Límite de pasos por episodio (evita episodios infinitos)
  MAX_PASOS_EPISODIO: 600,
});

// --- Recompensas (tunables) -------------------------------------------------
export const RECOMPENSAS = Object.freeze({
  PASO: 0.0, // coste por paso (0 = no penalizar la supervivencia)
  GOLPEAR_PALA: 0.2, // premio por devolver la pelota con la pala (rebote correcto)
  ROMPER_LADRILLO: 1.0, // premio por destruir un ladrillo
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
    pasosDecaimientoEpsilon: 25000,
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
    coefEntropia: 0.01,
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
    pasosDecaimientoEpsilon: 20000,
    dobleDQN: true,
  },
});
