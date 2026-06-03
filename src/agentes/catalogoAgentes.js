// ============================================================================
//  Catálogo de agentes (registro Node-safe, sin DOM)
//  Registra cada algoritmo con su factoría de agente y metadatos pedagógicos.
//  Los inspectores (que tocan el DOM) se asocian aparte en el navegador.
// ============================================================================

import { registrarAlgoritmo } from "../nucleo/registroAlgoritmos.js";
import { ALGORITMOS, HIPERPARAMETROS } from "../nucleo/constantes.js";
import { AgenteDQN } from "./agenteDQN.js";
import { AgentePPO } from "./agentePPO.js";
import { AgenteSAC } from "./agenteSAC.js";
import { AgenteWorldModel } from "./agenteWorldModel.js";

let _registrado = false;

export function registrarAgentes() {
  if (_registrado) return;
  _registrado = true;

  registrarAlgoritmo({
    id: ALGORITMOS.DQN,
    nombre: "DQN",
    nombreLargo: "Deep Q-Network",
    insignia: { texto: "recomendado", clase: "verde" },
    descripcion:
      "Aprende la función de valor-acción Q(s,a) y actúa de forma ε-greedy. Usa replay buffer y red objetivo. Aquí: Double DQN + pérdida Huber + soft update.",
    familia: "Model-free · basado en valor",
    politica: "off-policy",
    hiperparametros: HIPERPARAMETROS[ALGORITMOS.DQN],
    crearAgente: (hp) => new AgenteDQN(hp),
    etiquetasMetricas: {
      metrica3: { etiqueta: "ε exploración", clave: "epsilon", formato: "num" },
      metrica4: { etiqueta: "TD-error", clave: "tdError", formato: "num" },
      metrica5: { etiqueta: "Buffer", clave: "bufferSize", formato: "entero" },
    },
  });

  registrarAlgoritmo({
    id: ALGORITMOS.PPO,
    nombre: "PPO",
    nombreLargo: "Proximal Policy Optimization",
    insignia: { texto: "política", clase: "violeta" },
    descripcion:
      "Optimiza directamente la política con un objetivo recortado (clipped surrogate) y una crítica de valor. On-policy: recoge rollouts y los procesa en varias épocas. Usa GAE para estimar ventajas.",
    familia: "Model-free · actor-crítico",
    politica: "on-policy",
    hiperparametros: HIPERPARAMETROS[ALGORITMOS.PPO],
    crearAgente: (hp) => new AgentePPO(hp),
    etiquetasMetricas: {
      metrica3: { etiqueta: "Entropía", clave: "entropia", formato: "num" },
      metrica4: { etiqueta: "Pérdida V", clave: "lossValor", formato: "num" },
      metrica5: { etiqueta: "Rollout", clave: "rolloutProgreso", formato: "pct" },
    },
  });

  registrarAlgoritmo({
    id: ALGORITMOS.SAC,
    nombre: "SAC",
    nombreLargo: "Soft Actor-Critic (discreto)",
    insignia: { texto: "avanzado", clase: "ambar" },
    descripcion:
      "Actor-crítico de máxima entropía. Dos críticos Q (reduce sobreestimación), política estocástica y temperatura α ajustada automáticamente para mantener la exploración. Versión discreta (Christodoulou 2019).",
    familia: "Model-free · actor-crítico",
    politica: "off-policy",
    hiperparametros: HIPERPARAMETROS[ALGORITMOS.SAC],
    crearAgente: (hp) => new AgenteSAC(hp),
    etiquetasMetricas: {
      metrica3: { etiqueta: "Temperatura α", clave: "temperatura", formato: "num" },
      metrica4: { etiqueta: "Entropía", clave: "entropia", formato: "num" },
      metrica5: { etiqueta: "Buffer", clave: "bufferSize", formato: "entero" },
    },
  });

  registrarAlgoritmo({
    id: ALGORITMOS.WORLD_MODEL,
    nombre: "World Model",
    nombreLargo: "World Model · Dyna-Q",
    insignia: { texto: "model-based", clase: "cyan" },
    descripcion:
      "Aprende un modelo de la dinámica del entorno (s,a)→(s',r) y lo usa para generar experiencias imaginadas con las que entrenar la política (Dyna-Q). Combina datos reales e imaginados.",
    familia: "Model-based",
    politica: "off-policy",
    hiperparametros: HIPERPARAMETROS[ALGORITMOS.WORLD_MODEL],
    crearAgente: (hp) => new AgenteWorldModel(hp),
    etiquetasMetricas: {
      metrica3: { etiqueta: "ε exploración", clave: "epsilon", formato: "num" },
      metrica4: { etiqueta: "Error modelo", clave: "errorModelo", formato: "num" },
      metrica5: { etiqueta: "Planning", clave: "pasosPlanning", formato: "entero" },
    },
  });
}
