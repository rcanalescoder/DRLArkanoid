// ============================================================================
//  FASE 3 — Comparativa de los 5 algoritmos CON VISIÓN (8×10 + conv)
//  Entrena cada algoritmo con encoder conv sobre la MISMA tarea (8×10, niveles
//  variados + currículo) y mide success_rate en TEST (niveles no vistos). Los
//  model-free (DQN/PPO/SAC) usan conv directo; los model-based (World Models)
//  usan Q-net conv + dinámica que predice Δ≈0 en ladrillos (fijos en imaginación,
//  el compromiso del plan). Emite el resultado de cada algo SEGÚN termina
//  (model-free salen pronto; los World Models tardan por la imaginación).
//    Uso: node scripts/comparativa.mjs [pasos=1000000]
// ============================================================================
import { GestorEntornos } from "../src/entorno/gestorEntornos.js";
import { RecolectorMetricas } from "../src/entrenamiento/metricas.js";
import { SistemaTrazas } from "../src/nucleo/trazas.js";
import { Orquestador } from "../src/entrenamiento/orquestador.js";
import { registrarAgentes } from "../src/agentes/catalogoAgentes.js";
import { crearAgente } from "../src/nucleo/registroAlgoritmos.js";
import { generarPool, dividirSplits, FAMILIAS } from "../src/entorno/generadorNiveles.js";
import { CONFIGURACION_ENTORNO, dimensionEstado, NUM_LADRILLOS } from "../src/nucleo/constantes.js";
import { backendRapido } from "./backend.mjs";

const PASOS = +(process.argv[2] || 1000000);
const MAXP = CONFIGURACION_ENTORNO.MAX_PASOS_EPISODIO;
const DIM = dimensionEstado(true);
const TIERS = [16, 36, 60, NUM_LADRILLOS];
const ALGOS = [
  { id: "dqn", envs: 128, fam: "model-free · valor" },
  { id: "ppo", envs: 64, fam: "model-free · actor-crítico" },
  { id: "sac", envs: 128, fam: "model-free · actor-crítico" },
  { id: "worldModel", envs: 128, fam: "model-based · Dyna-Q" },
  { id: "worldModelRecurrente", envs: 128, fam: "model-based · LSTM" },
];

async function evalSplit(agente, split, kEps = 240) {
  const masks = split.map((n) => n.mask);
  const g = new GestorEntornos({ numHeadless: 48, numVisuales: 0, shaping: false, incluirLadrillos: true, escalaLadrillos: 1.0, proveedorNivel: () => masks[(Math.random() * masks.length) | 0] });
  let eps = 0, won = 0, pct = 0;
  const tope = (MAXP + 5) * Math.ceil(kEps / 48) + 400;
  for (let p = 0; p < tope && eps < kEps; p++) {
    const acc = agente.seleccionarAcciones(g.obtenerEstadosEntrenamiento(), 48, { entrenar: false });
    const res = g.aplicarAcciones(acc);
    for (const e of res.episodios) { eps++; if (e.ganado) won++; pct += e.ladrillosIniciales ? e.ladrillosRotos / e.ladrillosIniciales : 0; }
  }
  return { success: won / Math.max(1, eps), pct: pct / Math.max(1, eps), eps };
}

async function entrenarAlgo(id, envs, train) {
  const capRef = { v: TIERS[0] };
  const masksTrain = train.map((n) => ({ mask: n.mask, vivos: n.vivos }));
  const proveedor = () => { const sub = masksTrain.filter((n) => n.vivos <= capRef.v); return sub[(Math.random() * sub.length) | 0].mask; };
  const met = new RecolectorMetricas();
  const gestor = new GestorEntornos({ numHeadless: envs, numVisuales: 0, shaping: false, incluirLadrillos: true, escalaLadrillos: 1.0, proveedorNivel: proveedor });
  const agente = crearAgente(id, { dimEstado: DIM, arquitectura: "conv" });
  const orq = new Orquestador({ gestor, agente, metricas: met, trazas: new SistemaTrazas(), idAlgoritmo: id, silencioso: true });
  const t0 = Date.now();
  let etapa = 0, tierSteps = 0, objetivo = 0;
  while (objetivo < PASOS) {
    objetivo = Math.min(PASOS, objetivo + 50000);
    await orq.correr(objetivo, () => {});
    tierSteps += 50000;
    const sr = met.obtenerInstantanea().successRate;
    if (etapa < TIERS.length - 1 && ((sr >= 0.7 && met._exitos.length >= 100) || tierSteps >= 500000)) {
      etapa++; capRef.v = TIERS[etapa]; tierSteps = 0;
    }
  }
  const dt = (Date.now() - t0) / 1000;
  const params = agente.redPolitica?.countParams?.() ?? agente.redQ?.countParams?.() ?? agente.actor?.countParams?.() ?? 0;
  return { agente, dt, params };
}

(async () => {
  const be = await backendRapido();
  registrarAgentes();
  const pool = generarPool({ semilla: 12345, n: 400 });
  const { train, test } = dividirSplits(pool, { train: 0.7, val: 0.15 }, 999);
  console.log(`\n══════ FASE 3 · COMPARATIVA con VISIÓN (8×10 + conv) · ${PASOS} pasos/algo · backend=${be} ══════`);
  console.log(`Tarea: niveles variados (pool ${pool.length}, train ${train.length}/test ${test.length}), currículo, eval greedy en TEST.`);
  console.log(`${"algoritmo".padEnd(22)}│ ${"familia".padEnd(26)}│ TEST éxito · %ladr · params · tiempo`);
  console.log("─".repeat(96));

  const filas = [];
  for (const a of ALGOS) {
    try {
      const { agente, dt, params } = await entrenarAlgo(a.id, a.envs, train);
      const te = await evalSplit(agente, test);
      filas.push({ id: a.id, fam: a.fam, ...te, params, dt });
      console.log(`${a.id.padEnd(22)}│ ${a.fam.padEnd(26)}│ ${(te.success * 100).toFixed(0).padStart(3)}% · ${(te.pct * 100).toFixed(0).padStart(3)}% · ${String(params).padStart(6)} · ${dt.toFixed(0)}s`);
      agente.destruir();
    } catch (e) {
      console.log(`${a.id.padEnd(22)}│ ${a.fam.padEnd(26)}│ ERROR: ${(e.message || "").split("\n")[0].slice(0, 40)}`);
    }
  }

  console.log("─".repeat(96));
  filas.sort((x, y) => y.success - x.success);
  console.log("RANKING (success_rate en test, niveles no vistos):");
  filas.forEach((f, i) => console.log(`  ${i + 1}. ${f.id.padEnd(22)} ${(f.success * 100).toFixed(0)}% · ${f.fam}`));
})().catch((e) => { console.error(e); process.exit(1); });
