// Corre la rejilla 3×3 (los 2 ejes principales) de CADA algoritmo en Node y
// vuelca el JSON con la recompensa final por combinación. Rápido: una sola
// inicialización de TF y backend CPU (en Node, SAC va a ~2000 exp/s, no a ~9
// como en el navegador sin GPU). Uso: node scripts/grid_all.mjs > grids.json
import * as tf from "@tensorflow/tfjs";
import { GestorEntornos } from "../src/entorno/gestorEntornos.js";
import { RecolectorMetricas } from "../src/entrenamiento/metricas.js";
import { SistemaTrazas } from "../src/nucleo/trazas.js";
import { Orquestador } from "../src/entrenamiento/orquestador.js";
import { registrarAgentes } from "../src/agentes/catalogoAgentes.js";
import { crearAgente } from "../src/nucleo/registroAlgoritmos.js";

const PASOS = 5000, ENVS = 64;
const SWEEP = {
  dqn: { A: { clave: "tasaAprendizaje", et: "ritmo", vals: [0.0003, 0.0008, 0.0015] }, B: { clave: "gamma", et: "γ", vals: [0.97, 0.99, 0.995] } },
  ppo: { A: { clave: "tasaAprendizaje", et: "ritmo", vals: [0.0003, 0.0006, 0.0012] }, B: { clave: "epsilonClip", et: "recorte ε", vals: [0.1, 0.2, 0.3] } },
  sac: { A: { clave: "tasaAprendizajeActor", et: "ritmo actor", vals: [0.0003, 0.0006, 0.0012] }, B: { clave: "factorEntropiaObjetivo", et: "entropía obj.", vals: [0.4, 0.55, 0.7] } },
  worldModel: { A: { clave: "tasaAprendizaje", et: "ritmo", vals: [0.0003, 0.0008, 0.0015] }, B: { clave: "pasosPlanning", et: "planning", vals: [3, 5, 8] } },
  worldModelRecurrente: { A: { clave: "tasaAprendizaje", et: "ritmo", vals: [0.0003, 0.0008, 0.0015] }, B: { clave: "longitudSecuencia", et: "long. secuencia", vals: [8, 16, 32] } },
};

async function combo(algo, override) {
  const gestor = new GestorEntornos({ numHeadless: ENVS, numVisuales: 0, shaping: true });
  const agente = crearAgente(algo, override);
  const metricas = new RecolectorMetricas();
  const trazas = new SistemaTrazas();
  const orq = new Orquestador({ gestor, agente, metricas, trazas, idAlgoritmo: algo });
  const rewards = [];
  await orq.correr(PASOS, (t) => { if (t.metricas?.rewardMedio100 != null) rewards.push(t.metricas.rewardMedio100); });
  agente.destruir();
  const nz = rewards.filter((v) => v !== 0);
  const tail = nz.slice(-Math.max(1, Math.floor(nz.length * 0.25)));
  return tail.length ? tail.reduce((a, b) => a + b, 0) / tail.length : 0;
}

(async () => {
  await tf.setBackend("cpu"); await tf.ready();
  registrarAgentes();
  const out = {};
  for (const [algo, ax] of Object.entries(SWEEP)) {
    const grid = [];
    for (const av of ax.A.vals) {
      const row = [];
      for (const bv of ax.B.vals) {
        const r = await combo(algo, { [ax.A.clave]: av, [ax.B.clave]: bv });
        row.push(+r.toFixed(3));
        process.stderr.write(`${algo}  ${ax.A.clave}=${av}  ${ax.B.clave}=${bv}  ->  ${r.toFixed(3)}\n`);
      }
      grid.push(row);
    }
    out[algo] = { A: ax.A, B: ax.B, grid };
  }
  console.log(JSON.stringify(out, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
