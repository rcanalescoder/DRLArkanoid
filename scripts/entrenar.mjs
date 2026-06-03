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
import { HIPERPARAMETROS, ALGORITMOS, CONFIGURACION_ENTORNO } from "../src/nucleo/constantes.js";

const IMPORTADORES = {
  dqn: () => import("../src/agentes/agenteDQN.js").then((m) => m.AgenteDQN),
  ppo: () => import("../src/agentes/agentePPO.js").then((m) => m.AgentePPO),
  sac: () => import("../src/agentes/agenteSAC.js").then((m) => m.AgenteSAC),
  worldModel: () => import("../src/agentes/agenteWorldModel.js").then((m) => m.AgenteWorldModel),
  worldModelRecurrente: () => import("../src/agentes/agenteWorldModelRecurrente.js").then((m) => m.AgenteWorldModelRecurrente),
};

function parseArgs(argv) {
  const algo = argv[2] || "dqn";
  const opts = { pasos: 200000, envs: null, hp: {}, shaping: false };
  for (let i = 3; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--pasos") opts.pasos = +argv[++i];
    else if (a === "--envs") opts.envs = +argv[++i];
    else if (a === "--shaping") opts.shaping = true; // activar Φ (demo del saboteador)
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
  console.log(`  envs=${numHeadless}  pasos=${opts.pasos}  shaping(Φ)=${opts.shaping ? "ON" : "OFF"}`);
  console.log(`  hp=${JSON.stringify(hp)}`);
  console.log("════════════════════════════════════════════════════════════");

  const Clase = await importar();
  const gestor = new GestorEntornos({ numHeadless, numVisuales: 0, shaping: opts.shaping });
  const agente = new Clase(hp);
  const metricas = new RecolectorMetricas();
  const trazas = new SistemaTrazas();
  const orq = new Orquestador({ gestor, agente, metricas, trazas, idAlgoritmo });

  const t0 = Date.now();
  const rewards = [];
  const bricks = [];
  await orq.correr(opts.pasos, (t) => {
    trazas.imprimirResumen(t);
    if (t.metricas.rewardMedio100 != null) rewards.push(t.metricas.rewardMedio100);
    if (t.metricas.ladrillosRotosMedio != null) bricks.push(t.metricas.ladrillosRotosMedio);
  });
  const dt = (Date.now() - t0) / 1000;

  // --- Resumen ---
  const inst = metricas.obtenerInstantanea();
  const media = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const cola = (a) => media(a.slice(-Math.max(1, Math.floor(a.length * 0.15))));
  const cabeza = (a) => media(a.slice(0, Math.max(1, Math.floor(a.length * 0.15))));
  const rNoCero = rewards.slice(Math.max(0, rewards.findIndex((v) => v !== 0)));
  const rInicial = cabeza(rNoCero), rFinal = cola(rNoCero);
  const bInicial = cabeza(bricks), bFinal = cola(bricks);

  console.log("────────────────────────────────────────────────────────────");
  console.log(`  RESUMEN ${algo.toUpperCase()} (${dt.toFixed(1)}s, ${(opts.pasos / dt).toFixed(0)} exp/s · Φ=${opts.shaping ? "ON" : "OFF"})`);
  console.log(`  ▶ CABECERA · success_rate=${(inst.successRate * 100).toFixed(1)}%  ·  ladrillos rotos: ${bInicial.toFixed(2)} → ${bFinal.toFixed(2)} / 28  (mediana actual ${inst.bricksCleared.toFixed(2)})`);
  console.log(`    [diag] reward ${rInicial.toFixed(2)}→${rFinal.toFixed(2)} · reward_no_shaping=${inst.rewardNoShaping.toFixed(2)} · 1er ladrillo≈${inst.timeToFirstBrick != null ? inst.timeToFirstBrick.toFixed(0) : "—"} pasos · steps_alive≈${inst.stepsAlive.toFixed(0)} · episodios=${inst.episodiosTotales}`);
  console.log(`    tensores=${tf.memory().numTensors}  memoria=${(tf.memory().numBytes / 1048576).toFixed(1)}MB`);
  const dB = bFinal - bInicial;
  const veredicto = dB > 0.5 ? "✅ rompe MÁS ladrillos" : dB > 0.05 ? "🟡 sube algo" : dB < -0.3 ? "❌ rompe MENOS" : "➖ sin cambio claro";
  console.log(`  Veredicto (ladrillos): ${veredicto}  (Δ=${dB.toFixed(2)})`);

  // --- Evaluación GREEDY (lo que de verdad ha aprendido la política, ε=0) ---
  // Es la métrica honesta y comparable con el rastreador perfecto (~26 ladr / 38 %).
  const gEval = new GestorEntornos({ numHeadless: 48, numVisuales: 0, shaping: opts.shaping });
  const mEval = new RecolectorMetricas();
  let episodiosEval = 0, maxBricks = 0;
  const KEVAL = 200, nE = 48, topePasos = (CONFIGURACION_ENTORNO.MAX_PASOS_EPISODIO + 5) * Math.ceil(KEVAL / nE) + 200;
  for (let p = 0; p < topePasos && episodiosEval < KEVAL; p++) {
    const estados = gEval.obtenerEstadosEntrenamiento();
    const acc = agente.seleccionarAcciones(estados, nE, { entrenar: false });
    const res = gEval.aplicarAcciones(acc);
    if (res.episodios.length) {
      mEval.registrarEpisodios(res.episodios);
      episodiosEval += res.episodios.length;
      for (const e of res.episodios) maxBricks = Math.max(maxBricks, e.ladrillosRotos);
    }
  }
  const ge = mEval.obtenerInstantanea();
  console.log(`  ▶▶ GREEDY (${episodiosEval} eps, ε=0) · success_rate=${(ge.successRate * 100).toFixed(1)}%  ·  ladrillos=${ge.bricksCleared.toFixed(2)}/28 (máx ${maxBricks})  ·  steps_alive≈${ge.stepsAlive.toFixed(0)}`);
  console.log(`     referencia rastreador perfecto: ~26/28 · 37.6%`);
  console.log("────────────────────────────────────────────────────────────");

  agente.destruir();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
