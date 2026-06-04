// ============================================================================
//  FASE 2a — Generalización en 4×7 (vista-only, MLP + escala que YA funciona)
//  Entrena la vista sobre niveles VARIADOS del split TRAIN (un nivel aleatorio
//  por episodio) y mide success_rate en GREEDY sobre train vs TEST (niveles no
//  vistos). Gap pequeño + test alto = GENERALIZA (el objetivo). Validamos esto
//  con la arquitectura conocida (flat MLP + escala 0.25) ANTES de escalar a
//  8×10 + conv (un cambio duro a la vez).
//    Uso: node scripts/fase2a.mjs [pasos=800000] [envs=128] [nPool=400]
// ============================================================================
import * as tf from "@tensorflow/tfjs";
import { GestorEntornos } from "../src/entorno/gestorEntornos.js";
import { RecolectorMetricas } from "../src/entrenamiento/metricas.js";
import { SistemaTrazas } from "../src/nucleo/trazas.js";
import { Orquestador } from "../src/entrenamiento/orquestador.js";
import { registrarAgentes } from "../src/agentes/catalogoAgentes.js";
import { crearAgente } from "../src/nucleo/registroAlgoritmos.js";
import { generarPool, dividirSplits, proveedorDe, FAMILIAS } from "../src/entorno/generadorNiveles.js";
import { CONFIGURACION_ENTORNO, dimensionEstado } from "../src/nucleo/constantes.js";

const PASOS = +(process.argv[2] || 800000);
const ENVS = +(process.argv[3] || 128);
const NPOOL = +(process.argv[4] || 400);
const MAXP = CONFIGURACION_ENTORNO.MAX_PASOS_EPISODIO;
const DIM = dimensionEstado(true);

async function evalSplit(agente, split, kEps = 360) {
  const g = new GestorEntornos({ numHeadless: 48, numVisuales: 0, shaping: false, incluirLadrillos: true, proveedorNivel: proveedorDe(split) });
  let eps = 0, ganados = 0, sumPct = 0, sumSteps = 0;
  const tope = (MAXP + 5) * Math.ceil(kEps / 48) + 400;
  for (let p = 0; p < tope && eps < kEps; p++) {
    const acc = agente.seleccionarAcciones(g.obtenerEstadosEntrenamiento(), 48, { entrenar: false });
    const res = g.aplicarAcciones(acc);
    for (const e of res.episodios) {
      eps++;
      if (e.ganado) ganados++;
      sumPct += e.ladrillosIniciales ? e.ladrillosRotos / e.ladrillosIniciales : 0;
      sumSteps += e.pasos;
    }
  }
  return { success: ganados / Math.max(1, eps), pct: sumPct / Math.max(1, eps), steps: sumSteps / Math.max(1, eps), eps };
}

(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
  registrarAgentes();

  const pool = generarPool({ semilla: 12345, n: NPOOL });
  const { train, val, test } = dividirSplits(pool, { train: 0.7, val: 0.15 }, 999);
  const distrib = (split) => Object.keys(FAMILIAS).map((f) => `${f}:${split.filter((n) => n.familia === f).length}`).join(" ");
  const vivosMedios = (split) => (split.reduce((s, n) => s + n.vivos, 0) / split.length).toFixed(1);

  console.log(`\n══════ FASE 2a · generalización 4×7 · ${PASOS} pasos · envs=${ENVS} · escala=${0.25} ══════`);
  console.log(`Pool: ${pool.length} niveles DISTINTOS · splits DISJUNTOS train ${train.length} / val ${val.length} / test ${test.length}`);
  console.log(`Familias train: ${distrib(train)}`);
  console.log(`Ladrillos vivos medios · train ${vivosMedios(train)} · test ${vivosMedios(test)} (de ${28})`);

  const gestor = new GestorEntornos({ numHeadless: ENVS, numVisuales: 0, shaping: false, incluirLadrillos: true, proveedorNivel: proveedorDe(train) });
  const agente = crearAgente("dqn", { dimEstado: DIM });
  const orq = new Orquestador({ gestor, agente, metricas: new RecolectorMetricas(), trazas: new SistemaTrazas(), idAlgoritmo: "dqn", silencioso: true });
  const t0 = Date.now();
  await orq.correr(PASOS, () => {});
  console.log(`\nEntrenada sobre el split TRAIN en ${((Date.now() - t0) / 1000).toFixed(0)}s.\n`);

  const tr = await evalSplit(agente, train);
  const te = await evalSplit(agente, test);
  const fmt = (r) => `éxito ${(r.success * 100).toFixed(0).padStart(3)}% · %ladrillos ${(r.pct * 100).toFixed(0).padStart(3)}% · vive ${String(Math.round(r.steps)).padStart(4)}`;
  console.log(`TRAIN (${tr.eps} eps) │ ${fmt(tr)}`);
  console.log(`TEST  (${te.eps} eps) │ ${fmt(te)}   ← niveles NO vistos`);
  const gap = tr.success - te.success;
  console.log(`GAP de generalización (train−test éxito) = ${(gap * 100).toFixed(1)} puntos`);

  // Desglose por familia en TEST (¿generaliza en todas las clases de patrón?).
  console.log(`\nTEST por familia:`);
  for (const f of Object.keys(FAMILIAS)) {
    const sub = test.filter((n) => n.familia === f);
    if (sub.length < 3) { console.log(`  ${f.padEnd(11)}│ (solo ${sub.length} niveles, omitido)`); continue; }
    const r = await evalSplit(agente, sub, 180);
    console.log(`  ${f.padEnd(11)}│ ${fmt(r)} · ${sub.length} niveles`);
  }

  console.log("─".repeat(60));
  console.log(te.success > 0.6 && gap < 0.15
    ? `✅ GENERALIZA: limpia niveles NO vistos de forma fiable con gap pequeño.`
    : te.success > 0.4
      ? `🟡 Generaliza parcialmente → más pasos / currículum / ajustar generador.`
      : `🔴 No generaliza aún → revisar (más pasos, dificultad del pool, arquitectura).`);

  agente.destruir();
})().catch((e) => { console.error(e); process.exit(1); });
