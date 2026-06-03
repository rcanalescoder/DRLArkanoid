// ============================================================================
//  Harness de entrenamiento en Node (verificación agéntica rápida)
//  Entrena un algoritmo con el backend CPU de TF.js e imprime trazas para
//  diagnosticar convergencia sin depender del navegador.
//
//  Uso:  node scripts/entrenar.mjs <algo> [--pasos N] [--envs N] [--hp k=v ...]
//        node scripts/entrenar.mjs dqn --pasos 200000 --envs 256
// ============================================================================

import * as tf from "@tensorflow/tfjs";
import { GestorEntornos } from "../src/entorno/gestorEntornos.js";
import { RecolectorMetricas } from "../src/entrenamiento/metricas.js";
import { SistemaTrazas } from "../src/nucleo/trazas.js";
import { Orquestador } from "../src/entrenamiento/orquestador.js";
import { HIPERPARAMETROS, ALGORITMOS } from "../src/nucleo/constantes.js";

const IMPORTADORES = {
  dqn: () => import("../src/agentes/agenteDQN.js").then((m) => m.AgenteDQN),
  ppo: () => import("../src/agentes/agentePPO.js").then((m) => m.AgentePPO),
  sac: () => import("../src/agentes/agenteSAC.js").then((m) => m.AgenteSAC),
  worldModel: () => import("../src/agentes/agenteWorldModel.js").then((m) => m.AgenteWorldModel),
  worldModelRecurrente: () => import("../src/agentes/agenteWorldModelRecurrente.js").then((m) => m.AgenteWorldModelRecurrente),
};

function parseArgs(argv) {
  const algo = argv[2] || "dqn";
  const opts = { pasos: 200000, envs: null, hp: {} };
  for (let i = 3; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--pasos") opts.pasos = +argv[++i];
    else if (a === "--envs") opts.envs = +argv[++i];
    else if (a === "--hp") {
      const [k, v] = argv[++i].split("=");
      opts.hp[k] = isNaN(+v) ? v === "true" ? true : v === "false" ? false : v : +v;
    }
  }
  return { algo, opts };
}

async function main() {
  const { algo, opts } = parseArgs(process.argv);
  const importar = IMPORTADORES[algo];
  if (!importar) {
    console.error(`Algoritmo desconocido: ${algo}. Opciones: ${Object.keys(IMPORTADORES).join(", ")}`);
    process.exit(1);
  }

  await tf.setBackend("cpu");
  await tf.ready();

  const idAlgoritmo = ALGORITMOS[algo.toUpperCase()] ?? algo;
  const hpBase = HIPERPARAMETROS[idAlgoritmo] ?? {};
  const hp = { ...hpBase, ...opts.hp };
  const numHeadless = opts.envs ?? (algo === "ppo" ? 32 : 256);

  console.log("════════════════════════════════════════════════════════════");
  console.log(`  Entrenando ${algo.toUpperCase()}  ·  backend=${tf.getBackend()}`);
  console.log(`  envs=${numHeadless}  pasos=${opts.pasos}`);
  console.log(`  hp=${JSON.stringify(hp)}`);
  console.log("════════════════════════════════════════════════════════════");

  const Clase = await importar();
  const gestor = new GestorEntornos({ numHeadless, numVisuales: 0, shaping: true });
  const agente = new Clase(hp);
  const metricas = new RecolectorMetricas();
  const trazas = new SistemaTrazas();
  const orq = new Orquestador({ gestor, agente, metricas, trazas, idAlgoritmo });

  const t0 = Date.now();
  const rewards = [];
  await orq.correr(opts.pasos, (t) => {
    trazas.imprimirResumen(t);
    if (t.metricas.rewardMedio100 != null) rewards.push(t.metricas.rewardMedio100);
  });
  const dt = (Date.now() - t0) / 1000;

  // --- Resumen de convergencia ---
  const inst = metricas.obtenerInstantanea();
  // Descartar los ceros iniciales (antes de que termine el primer episodio).
  const primerNoCero = rewards.findIndex((v) => v !== 0);
  const r = primerNoCero > 0 ? rewards.slice(primerNoCero) : rewards;
  const primeros = r.slice(0, Math.max(1, Math.floor(r.length * 0.15)));
  const ultimos = r.slice(-Math.max(1, Math.floor(r.length * 0.15)));
  const media = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const rInicial = media(primeros);
  const rFinal = media(ultimos);

  console.log("────────────────────────────────────────────────────────────");
  console.log(`  RESUMEN ${algo.toUpperCase()} (${dt.toFixed(1)}s, ${(opts.pasos / dt).toFixed(0)} exp/s)`);
  console.log(`  reward inicial≈${rInicial.toFixed(3)}  →  final≈${rFinal.toFixed(3)}  (Δ=${(rFinal - rInicial).toFixed(3)})`);
  console.log(`  éxito100=${(inst.tasaExito100 * 100).toFixed(1)}%  ladrillosMedio=${inst.ladrillosRotosMedio.toFixed(2)}  episodios=${inst.episodiosTotales}`);
  console.log(`  tensores finales=${tf.memory().numTensors}  memoria=${(tf.memory().numBytes / 1048576).toFixed(1)}MB`);
  const veredicto = rFinal > rInicial + 0.2 ? "✅ APRENDE" : rFinal > rInicial ? "🟡 mejora leve" : "❌ no mejora";
  console.log(`  Veredicto: ${veredicto}`);
  console.log("────────────────────────────────────────────────────────────");

  agente.destruir();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
