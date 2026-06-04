// ============================================================================
//  FASE 2a (pulido) — CURRÍCULUM fácil→difícil para subir el test >78%
//  Mismo generador/splits que fase2a.mjs, pero el entrenamiento avanza por
//  ETAPAS de dificultad (nº de ladrillos): empieza con niveles fáciles (pocos
//  ladrillos) y desbloquea los más densos cuando el success_rate de
//  entrenamiento supera un umbral (o tras un tope de pasos por etapa). Así el
//  agente consolida supervivencia+apuntado antes de los niveles que antes
//  capaban el 78%. Evalúa en TEST (todos los niveles) al final.
//    Uso: node scripts/fase2a_curriculum.mjs [pasos=1500000] [envs=128] [nPool=400]
// ============================================================================
import * as tf from "@tensorflow/tfjs";
import { GestorEntornos } from "../src/entorno/gestorEntornos.js";
import { RecolectorMetricas } from "../src/entrenamiento/metricas.js";
import { SistemaTrazas } from "../src/nucleo/trazas.js";
import { Orquestador } from "../src/entrenamiento/orquestador.js";
import { registrarAgentes } from "../src/agentes/catalogoAgentes.js";
import { crearAgente } from "../src/nucleo/registroAlgoritmos.js";
import { generarPool, dividirSplits, FAMILIAS } from "../src/entorno/generadorNiveles.js";
import { CONFIGURACION_ENTORNO, dimensionEstado } from "../src/nucleo/constantes.js";

const PASOS = +(process.argv[2] || 1500000);
const ENVS = +(process.argv[3] || 128);
const NPOOL = +(process.argv[4] || 400);
const MAXP = CONFIGURACION_ENTORNO.MAX_PASOS_EPISODIO;
const DIM = dimensionEstado(true);

const TIERS = [7, 13, 20, 28]; // caps de nº de ladrillos (dificultad creciente)
const UMBRAL_AVANCE = 0.72; // success_rate (entrenamiento) para desbloquear el siguiente tier
const CHUNK = 50000; // pasos por bloque de control del currículum
const TOPE_POR_TIER = 450000; // fallback: avanzar aunque no se alcance el umbral

async function evalSplit(agente, split, kEps = 360) {
  const masks = split.map((n) => n.mask);
  const g = new GestorEntornos({ numHeadless: 48, numVisuales: 0, shaping: false, incluirLadrillos: true, proveedorNivel: () => masks[(Math.random() * masks.length) | 0] });
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
  const { train, test } = dividirSplits(pool, { train: 0.7, val: 0.15 }, 999);
  console.log(`\n══════ FASE 2a CURRÍCULUM · ${PASOS} pasos · envs=${ENVS} · tiers=${TIERS.join("/")} ══════`);
  console.log(`Pool ${pool.length} · train ${train.length} / test ${test.length} (disjuntos) · niveles por tier (train):`);
  for (const c of TIERS) console.log(`   ≤${c} ladrillos: ${train.filter((n) => n.vivos <= c).length}`);

  // Proveedor que respeta el cap de dificultad actual (mutable).
  const capRef = { v: TIERS[0] };
  const masksTrain = train.map((n) => ({ mask: n.mask, vivos: n.vivos }));
  const proveedorCurriculum = () => {
    const sub = masksTrain.filter((n) => n.vivos <= capRef.v);
    return sub[(Math.random() * sub.length) | 0].mask;
  };

  const met = new RecolectorMetricas();
  const gestor = new GestorEntornos({ numHeadless: ENVS, numVisuales: 0, shaping: false, incluirLadrillos: true, proveedorNivel: proveedorCurriculum });
  const agente = crearAgente("dqn", { dimEstado: DIM });
  const orq = new Orquestador({ gestor, agente, metricas: met, trazas: new SistemaTrazas(), idAlgoritmo: "dqn", silencioso: true });

  const t0 = Date.now();
  let etapa = 0, pasosEnTier = 0, objetivo = 0;
  while (objetivo < PASOS) {
    objetivo = Math.min(PASOS, objetivo + CHUNK);
    await orq.correr(objetivo, () => {});
    pasosEnTier += CHUNK;
    const s = met.obtenerInstantanea().successRate;
    const avanzar = etapa < TIERS.length - 1 && (s >= UMBRAL_AVANCE || pasosEnTier >= TOPE_POR_TIER);
    if (avanzar) {
      etapa++;
      capRef.v = TIERS[etapa];
      console.log(`  [${(objetivo / 1000) | 0}k] train-éxito ${(s * 100).toFixed(0)}% → desbloquea ≤${capRef.v} ladrillos`);
      pasosEnTier = 0;
    } else if ((objetivo / CHUNK) % 6 === 0) {
      console.log(`  [${(objetivo / 1000) | 0}k] tier ≤${capRef.v} · train-éxito ${(s * 100).toFixed(0)}%`);
    }
  }
  console.log(`\nEntrenada con currículum en ${((Date.now() - t0) / 1000).toFixed(0)}s (cap final ≤${capRef.v}).\n`);

  const tr = await evalSplit(agente, train);
  const te = await evalSplit(agente, test);
  const fmt = (r) => `éxito ${(r.success * 100).toFixed(0).padStart(3)}% · %ladrillos ${(r.pct * 100).toFixed(0).padStart(3)}% · vive ${String(Math.round(r.steps)).padStart(4)}`;
  console.log(`TRAIN (${tr.eps}) │ ${fmt(tr)}`);
  console.log(`TEST  (${te.eps}) │ ${fmt(te)}   ← no vistos`);
  console.log(`GAP (train−test éxito) = ${((tr.success - te.success) * 100).toFixed(1)} pts`);
  console.log(`\nTEST por familia:`);
  for (const f of Object.keys(FAMILIAS)) {
    const sub = test.filter((n) => n.familia === f);
    if (sub.length < 3) { console.log(`  ${f.padEnd(11)}│ (${sub.length} niveles, omitido)`); continue; }
    const r = await evalSplit(agente, sub, 180);
    console.log(`  ${f.padEnd(11)}│ ${fmt(r)} · ${sub.length} niveles`);
  }
  console.log("─".repeat(60));
  console.log(`Baseline sin currículum (fase2a, 1M): TEST éxito 78% · gap 6.4. ¿Sube el test?`);

  agente.destruir();
})().catch((e) => { console.error(e); process.exit(1); });
