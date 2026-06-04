// ============================================================================
//  FASE 2b — 8×10 + encoder CONV + rama cinemática + currículum (generalización)
//  Escala el sistema a la rejilla grande (80 celdas) con la arquitectura que el
//  plan pide: matriz de ocupación 2D → Conv2D(16)→Conv2D(32)→flatten, en paralelo
//  con una rama densa para la cinemática, concatenadas → 128→128→3. La rama conv
//  separa estructuralmente los ladrillos de la cinemática (por eso escala=1.0,
//  ocupación pura: ya no hace falta atenuar). Currículum fácil→difícil sobre el
//  generador/splits. Mide generalización success_rate train vs TEST en 8×10.
//    Uso: node scripts/fase2b.mjs [pasos=1500000] [envs=128] [nPool=400] [escala=1.0]
// ============================================================================
import * as tf from "@tensorflow/tfjs";
import { GestorEntornos } from "../src/entorno/gestorEntornos.js";
import { RecolectorMetricas } from "../src/entrenamiento/metricas.js";
import { SistemaTrazas } from "../src/nucleo/trazas.js";
import { Orquestador } from "../src/entrenamiento/orquestador.js";
import { registrarAgentes } from "../src/agentes/catalogoAgentes.js";
import { crearAgente } from "../src/nucleo/registroAlgoritmos.js";
import { generarPool, dividirSplits, FAMILIAS } from "../src/entorno/generadorNiveles.js";
import { CONFIGURACION_ENTORNO, dimensionEstado, NUM_LADRILLOS } from "../src/nucleo/constantes.js";
import { backendRapido } from "./backend.mjs";

const PASOS = +(process.argv[2] || 1500000);
const ENVS = +(process.argv[3] || 128);
const NPOOL = +(process.argv[4] || 400);
const ESCALA = process.argv[5] != null ? +process.argv[5] : 1.0; // conv: ocupación pura
const MAXP = CONFIGURACION_ENTORNO.MAX_PASOS_EPISODIO;
const DIM = dimensionEstado(true);

// Tiers de dificultad (nº de ladrillos) escalados a NUM_LADRILLOS.
const TIERS = [Math.round(NUM_LADRILLOS * 0.2), Math.round(NUM_LADRILLOS * 0.45), Math.round(NUM_LADRILLOS * 0.75), NUM_LADRILLOS];
const UMBRAL_AVANCE = 0.7;
const CHUNK = 50000;
const TOPE_POR_TIER = 500000;

async function evalSplit(agente, split, kEps = 300) {
  const masks = split.map((n) => n.mask);
  const g = new GestorEntornos({ numHeadless: 48, numVisuales: 0, shaping: false, incluirLadrillos: true, escalaLadrillos: ESCALA, proveedorNivel: () => masks[(Math.random() * masks.length) | 0] });
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
  const be = await backendRapido();
  registrarAgentes();
  console.log(`backend = ${be}`);

  const pool = generarPool({ semilla: 12345, n: NPOOL });
  const { train, test } = dividirSplits(pool, { train: 0.7, val: 0.15 }, 999);
  console.log(`\n══════ FASE 2b · 8×10 + CONV + currículum · ${PASOS} pasos · envs=${ENVS} · escala=${ESCALA} ══════`);
  console.log(`Estado dim=${DIM} (6 cin + ${NUM_LADRILLOS} matriz) · timeout=${MAXP} · pool ${pool.length} · train ${train.length}/test ${test.length}`);
  console.log(`Tiers (nº ladrillos): ${TIERS.join(" → ")} · niveles vivos medios train=${(train.reduce((s, n) => s + n.vivos, 0) / train.length).toFixed(1)}/${NUM_LADRILLOS}`);

  const capRef = { v: TIERS[0] };
  const masksTrain = train.map((n) => ({ mask: n.mask, vivos: n.vivos }));
  const proveedor = () => {
    const sub = masksTrain.filter((n) => n.vivos <= capRef.v);
    return sub[(Math.random() * sub.length) | 0].mask;
  };

  const met = new RecolectorMetricas();
  const gestor = new GestorEntornos({ numHeadless: ENVS, numVisuales: 0, shaping: false, incluirLadrillos: true, escalaLadrillos: ESCALA, proveedorNivel: proveedor });
  const agente = crearAgente("dqn", { dimEstado: DIM, arquitectura: "conv" });
  console.log(`Red: ${agente._conv ? "CONV (multi-entrada)" : "FLAT"} · params=${agente.redPolitica.countParams()}`);
  const orq = new Orquestador({ gestor, agente, metricas: met, trazas: new SistemaTrazas(), idAlgoritmo: "dqn", silencioso: true });

  const t0 = Date.now();
  let etapa = 0, pasosEnTier = 0, objetivo = 0, ultimoLog = 0;
  while (objetivo < PASOS) {
    objetivo = Math.min(PASOS, objetivo + CHUNK);
    await orq.correr(objetivo, () => {});
    pasosEnTier += CHUNK;
    const s = met.obtenerInstantanea().successRate;
    if (etapa < TIERS.length - 1 && (s >= UMBRAL_AVANCE || pasosEnTier >= TOPE_POR_TIER)) {
      etapa++; capRef.v = TIERS[etapa]; pasosEnTier = 0;
      console.log(`  [${(objetivo / 1000) | 0}k] train-éxito ${(s * 100).toFixed(0)}% → desbloquea ≤${capRef.v} ladrillos (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    } else if (objetivo - ultimoLog >= 200000) {
      ultimoLog = objetivo;
      console.log(`  [${(objetivo / 1000) | 0}k] tier ≤${capRef.v} · train-éxito ${(s * 100).toFixed(0)}% · ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
  }
  console.log(`\nEntrenada (8×10, conv) en ${((Date.now() - t0) / 1000).toFixed(0)}s (cap final ≤${capRef.v}).\n`);

  const tr = await evalSplit(agente, train);
  const te = await evalSplit(agente, test);
  const fmt = (r) => `éxito ${(r.success * 100).toFixed(0).padStart(3)}% · %ladrillos ${(r.pct * 100).toFixed(0).padStart(3)}% · vive ${String(Math.round(r.steps)).padStart(4)}`;
  console.log(`TRAIN (${tr.eps}) │ ${fmt(tr)}`);
  console.log(`TEST  (${te.eps}) │ ${fmt(te)}   ← niveles NO vistos`);
  console.log(`GAP (train−test éxito) = ${((tr.success - te.success) * 100).toFixed(1)} pts`);
  console.log(`\nTEST por familia:`);
  for (const f of Object.keys(FAMILIAS)) {
    const sub = test.filter((n) => n.familia === f);
    if (sub.length < 3) { console.log(`  ${f.padEnd(11)}│ (${sub.length} niveles, omitido)`); continue; }
    const r = await evalSplit(agente, sub, 150);
    console.log(`  ${f.padEnd(11)}│ ${fmt(r)} · ${sub.length} niveles`);
  }
  console.log("─".repeat(60));
  console.log(te.success > 0.6 ? `✅ GENERALIZA en 8×10 (conv): limpia niveles no vistos de forma fiable.`
    : te.success > 0.35 ? `🟡 Generaliza parcialmente en 8×10 → más pasos / tiers / ajustes.`
      : `🔴 Aún no generaliza en 8×10 → revisar (pasos, arquitectura conv, currículum).`);

  agente.destruir();
})().catch((e) => { console.error(e); process.exit(1); });
