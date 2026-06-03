// ============================================================================
//  Tabla pedagógica de conceptos de DRL
//  Cada concepto tiene una explicación extensa en castellano (qué es, por qué
//  importa, ejemplo) y se marca qué algoritmos lo usan. La UI lo muestra en la
//  zona inferior (referencia) con tooltips completos.
// ============================================================================

import { ALGORITMOS } from "../nucleo/constantes.js";

export const CONCEPTOS = [
  {
    id: "modelFree",
    nombre: "Model-free",
    resumen: "Aprende sin modelar el entorno",
    descripcion:
      "Un método model-free aprende directamente qué hacer (política) o cuánto vale cada situación (valor) a partir de la experiencia, SIN construir un modelo de cómo funciona el entorno. No intenta predecir el siguiente estado; solo asocia situaciones con buenas acciones. Ejemplo: DQN aprende Q(s,a) probando acciones y observando recompensas, sin saber jamás la 'física' de la pelota.",
    usadoPor: [ALGORITMOS.DQN, ALGORITMOS.PPO, ALGORITMOS.SAC],
  },
  {
    id: "modelBased",
    nombre: "Model-based",
    resumen: "Aprende un modelo del entorno y planifica",
    descripcion:
      "Un método model-based aprende un modelo de la dinámica del entorno (dado (s,a), ¿cuál es s' y r?) y lo usa para planificar o para generar experiencia 'imaginada' sin gastar pasos reales. Es más eficiente en datos pero sufre si el modelo se equivoca (model bias). Ejemplo: el World Model predice dónde estará la pelota tras una acción y entrena al agente con esas predicciones.",
    usadoPor: [ALGORITMOS.WORLD_MODEL, ALGORITMOS.WORLD_MODEL_RECURRENTE],
  },
  {
    id: "replay",
    nombre: "Replay buffer",
    resumen: "Memoria de experiencias pasadas",
    descripcion:
      "Almacena transiciones (s,a,r,s',done) en una memoria grande y muestrea lotes aleatorios para entrenar. Rompe la correlación temporal entre muestras consecutivas (que desestabiliza el aprendizaje) y reutiliza cada experiencia muchas veces (eficiencia). Es propio de métodos off-policy. Ejemplo: DQN guarda 100.000 transiciones y entrena con minibatches aleatorios de 128.",
    usadoPor: [ALGORITMOS.DQN, ALGORITMOS.SAC, ALGORITMOS.WORLD_MODEL, ALGORITMOS.WORLD_MODEL_RECURRENTE],
  },
  {
    id: "targetNet",
    nombre: "Red objetivo",
    resumen: "Copia estable para calcular objetivos",
    descripcion:
      "Una copia de la red que se actualiza lentamente (copia dura periódica o interpolación suave de Polyak) y sirve para calcular los objetivos TD. Si usáramos la misma red que entrenamos para fijar su propio objetivo, este se movería a cada paso y el aprendizaje divergiría ('perseguir tu propia cola'). Ejemplo: aquí usamos soft update θ⁻ ← τθ + (1-τ)θ⁻ con τ=0.01.",
    usadoPor: [ALGORITMOS.DQN, ALGORITMOS.SAC, ALGORITMOS.WORLD_MODEL, ALGORITMOS.WORLD_MODEL_RECURRENTE],
  },
  {
    id: "epsilon",
    nombre: "Exploración ε-greedy",
    resumen: "Acción aleatoria con probabilidad ε",
    descripcion:
      "Estrategia de exploración: con probabilidad ε se toma una acción aleatoria y con probabilidad 1-ε la mejor según la red. ε empieza alto (explorar) y decae (explotar lo aprendido). Sin exploración el agente nunca descubriría acciones mejores que las que ya conoce. Ejemplo: ε pasa de 1.0 a 0.05 a lo largo de 25.000 pasos.",
    usadoPor: [ALGORITMOS.DQN, ALGORITMOS.WORLD_MODEL, ALGORITMOS.WORLD_MODEL_RECURRENTE],
  },
  {
    id: "politicaEstocastica",
    nombre: "Política estocástica",
    resumen: "Distribución de probabilidad sobre acciones",
    descripcion:
      "En vez de elegir siempre la mejor acción, la política devuelve una distribución π(a|s) y se muestrea de ella. Esto aporta exploración natural y permite optimizar la política directamente con gradientes. Ejemplo: PPO y SAC dan probabilidades [0.2, 0.5, 0.3] para [izquierda, mantener, derecha] y muestrean.",
    usadoPor: [ALGORITMOS.PPO, ALGORITMOS.SAC],
  },
  {
    id: "ventajaGae",
    nombre: "Ventaja (GAE)",
    resumen: "¿Cuánto mejor fue una acción que la media?",
    descripcion:
      "La ventaja A(s,a) = Q(s,a) - V(s) mide cuánto mejor es una acción respecto al valor medio del estado. GAE (Generalized Advantage Estimation) la estima combinando errores TD de varios pasos con un factor λ que equilibra sesgo y varianza. Reduce muchísimo la varianza del gradiente de política. Ejemplo: PPO usa GAE con λ=0.95.",
    usadoPor: [ALGORITMOS.PPO],
  },
  {
    id: "clipSurrogate",
    nombre: "Objetivo recortado",
    resumen: "Limita el cambio de política por paso",
    descripcion:
      "PPO maximiza una función objetivo donde el ratio entre la política nueva y la vieja se recorta a [1-ε, 1+ε]. Esto evita actualizaciones demasiado grandes que destrozarían la política, dando estabilidad sin necesidad de restricciones complejas (como en TRPO). Ejemplo: con ε=0.2, el ratio se limita a [0.8, 1.2].",
    usadoPor: [ALGORITMOS.PPO],
  },
  {
    id: "onPolicy",
    nombre: "On-policy / rollouts",
    resumen: "Entrena solo con datos de la política actual",
    descripcion:
      "Un método on-policy solo puede aprender de experiencias generadas por su política actual; tras actualizar, los datos viejos ya no sirven. Recoge 'rollouts' (tramos de varios pasos), los procesa unas pocas épocas y los descarta. Es más estable pero menos eficiente en datos que off-policy. Ejemplo: PPO recoge 256 pasos por entorno antes de cada actualización.",
    usadoPor: [ALGORITMOS.PPO],
  },
  {
    id: "dobleCritico",
    nombre: "Doble crítico (clipped double-Q)",
    resumen: "Dos redes Q, se usa la menor",
    descripcion:
      "Mantener dos críticos Q y usar el mínimo de ambos al calcular el objetivo reduce la sobreestimación sistemática de los valores Q (un problema clásico que lleva a políticas malas). Lo usan SAC y TD3. Ejemplo: target = r + γ·min(Q1', Q2').",
    usadoPor: [ALGORITMOS.SAC],
  },
  {
    id: "maxEntropia",
    nombre: "Máxima entropía",
    resumen: "Recompensa también ser impredecible",
    descripcion:
      "SAC no solo maximiza la recompensa, sino también la entropía de la política (cuán aleatoria es). Esto mantiene la exploración, evita colapsar prematuramente en una acción y mejora la robustez. El objetivo es maximizar E[r + α·H(π)]. Ejemplo: aunque catch sea buena, el agente sigue probando otras acciones mientras α sea alto.",
    usadoPor: [ALGORITMOS.SAC],
  },
  {
    id: "temperaturaAuto",
    nombre: "Temperatura α automática",
    resumen: "Ajusta el peso de la entropía solo",
    descripcion:
      "El coeficiente α que pondera la entropía se ajusta automáticamente por gradiente para alcanzar una entropía objetivo. Así no hay que afinarlo a mano para cada tarea: si la política explora demasiado, α baja; si explora poco, α sube. Ejemplo: aquí la entropía objetivo es 0.55·log(3).",
    usadoPor: [ALGORITMOS.SAC],
  },
  {
    id: "modeloDinamica",
    nombre: "Modelo de dinámica",
    resumen: "Red que predice (s,a) → (s', r, done)",
    descripcion:
      "Una red entrenada de forma supervisada para predecir el siguiente estado, la recompensa y si el episodio termina, a partir del estado y la acción actuales. Es el corazón de los métodos model-based. Aquí predecimos el incremento Δs (más estable que predecir s' directo). Ejemplo: error RMSE del modelo ~0.1 sobre estados normalizados.",
    usadoPor: [ALGORITMOS.WORLD_MODEL, ALGORITMOS.WORLD_MODEL_RECURRENTE],
  },
  {
    id: "planning",
    nombre: "Planning / imaginación",
    resumen: "Entrena con experiencia simulada por el modelo",
    descripcion:
      "Una vez se tiene un modelo de dinámica, se generan transiciones 'imaginadas' (rollouts simulados) sin tocar el entorno real, y se entrena la política/valor también con ellas (Dyna-Q). Multiplica los datos de entrenamiento por cada paso real. Ejemplo: por cada paso real hacemos 5 actualizaciones Q con datos imaginados.",
    usadoPor: [ALGORITMOS.WORLD_MODEL, ALGORITMOS.WORLD_MODEL_RECURRENTE],
  },
  {
    id: "memoriaRecurrente",
    nombre: "Memoria recurrente (LSTM)",
    resumen: "Una red que recuerda la secuencia pasada",
    descripcion:
      "Una red recurrente (LSTM) procesa los pasos en orden y mantiene un estado oculto que resume todo lo visto hasta ahora: una 'memoria'. A diferencia de un modelo de un solo paso, aprende de SECUENCIAS y captura cómo evoluciona el sistema en el tiempo. En el World Model recurrente, el modelo de dinámica es un LSTM: al imaginar varios pasos arrastra su memoria, así sus predicciones encadenadas se desvían menos. Inspirado en el MDN-RNN de World Models (Ha & Schmidhuber, 2018).",
    usadoPor: [ALGORITMOS.WORLD_MODEL_RECURRENTE],
  },
];

/** Devuelve los conceptos marcando si los usa el algoritmo dado. */
export function conceptosParaAlgoritmo(idAlgoritmo) {
  return CONCEPTOS.map((c) => ({ ...c, usado: c.usadoPor.includes(idAlgoritmo) }));
}
