// Grid search que optimiza la MÉTRICA REAL (ladrillos limpiados en greedy), no la
// recompensa. Barre los 2 parámetros más ligados a SOBREVIVIR en DQN: ritmo de
// aprendizaje × decaimiento de ε. Cada combo: entrena, luego evalúa GREEDY (ε=0) y
// se queda con la que más ladrillos rompe. Objetivo: igualar al rastreador (~26/38%).
//   Uso: node scripts/grid_supervivencia.mjs [pasos]   (default 150000)
import * as tf from "@tensorflow/tfjs";
import { GestorEntornos } from "../src/entorno/gestorEntornos.js";
import { RecolectorMetricas } from "../src/entrenamiento/metricas.js";
import { SistemaTrazas } from "../src/nucleo/trazas.js";
import { Orquestador } from "../src/entrenamiento/orquestador.js";
import { registrarAgentes } from "../src/agentes/catalogoAgentes.js";
import { crearAgente } from "../src/nucleo/registroAlgoritmos.js";
import { CONFIGURACION_ENTORNO } from "../src/nucleo/constantes.js";

const PASOS = +(process.argv[2] || 150000);
const ENVS = 128;
const LR = [0.0005, 0.0008, 0.0015];
const EPS_DECAY = [8000, 12000, 20000];

async function evalGreedy(agente, kEps = 200) {
  const g = new GestorEntornos({ numHeadless: 48, numVisuales: 0, shaping: false });
  const m = new RecolectorMetricas();
  let eps = 0, maxB = 0;
  const tope = (CONFIGURACION_ENTORNO.MAX_PASOS_EPISODIO + 5) * Math.ceil(kEps / 48) + 200;
  for (let p = 0; p < tope && eps < kEps; p++) {
    const est = g.obtenerEstadosEntrenamiento();
    const acc = agente.seleccionarAcciones(est, 48, { entrenar: false });
    const res = g.aplicarAcciones(acc);
    if (res.episodios.length) {
      m.registrarEpisodios(res.episodios);
      eps += res.episodios.length;
      for (const e of res.episodios) maxB = Math.max(maxB, e.ladrillosRotos);
    }
  }
  const i = m.obtenerInstantanea();
  return { success: i.successRate, bricks: i.bricksCleared, steps: i.stepsAlive, maxB, eps };
}

async function combo(lr, epsDecay) {
  const gestor = new GestorEntornos({ numHeadless: ENVS, numVisuales: 0, shaping: false });
  const agente = crearAgente("dqn", { tasaAprendizaje: lr, pasosDecaimientoEpsilon: epsDecay });
  const met = new RecolectorMetricas();
  const orq = new Orquestador({ gestor, agente, metricas: met, trazas: new SistemaTrazas(), idAlgoritmo: "dqn" });
  await orq.correr(PASOS, () => {});
  const r = await evalGreedy(agente);
  agente.destruir();
  return r;
}

(async () => {
  await tf.setBackend("cpu"); await tf.ready();
  registrarAgentes();
  console.log(`Grid supervivencia DQN · ${PASOS} pasos/combo · backend=${tf.getBackend()} · objetivo=igualar rastreador (~26/28, 37.6%)`);
  const filas = [];
  for (const lr of LR) {
    for (const ed of EPS_DECAY) {
      const r = await combo(lr, ed);
      filas.push({ lr, ed, ...r });
      process.stderr.write(`lr=${lr} εdecay=${ed} → greedy: ladrillos=${r.bricks.toFixed(2)} éxito=${(r.success * 100).toFixed(1)}% steps=${r.steps.toFixed(0)} (máx ${r.maxB})\n`);
    }
  }
  filas.sort((a, b) => b.bricks - a.bricks);
  console.log("\n=== RANKING por ladrillos (greedy) ===");
  for (const f of filas) console.log(`  lr=${f.lr}  εdecay=${f.ed}  →  ladrillos=${f.bricks.toFixed(2)}  éxito=${(f.success * 100).toFixed(1)}%  steps_alive=${f.steps.toFixed(0)}  (máx ${f.maxB})`);
  const g = filas[0];
  console.log(`\nGANADORA: lr=${g.lr} · εdecay=${g.ed} → ${g.bricks.toFixed(2)} ladrillos / ${(g.success * 100).toFixed(1)}% éxito`);
})().catch((e) => { console.error(e); process.exit(1); });
