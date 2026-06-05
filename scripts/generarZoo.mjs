// ============================================================================
//  Generador del ZOO de modelos jugables (offline, Node) — pestaña "Jugar"
//  Entrena cada algoritmo con el MISMO protocolo canónico que la comparativa de
//  la Fase 3 (8×10 + conv + niveles variados + currículo por tiers + escala 1.0)
//  y PERSISTE solo la RED DE ACCIÓN (la que decide la jugada) como assets
//  versionados en public/modelos/<id>/, junto a un manifiesto con sus métricas
//  de evaluación greedy en TEST (niveles no vistos). La app los carga al instante
//  y los pone a jugar. Así los modelos jugables son COHERENTES con las gráficas.
//
//  No re-corre ni re-congela nada de la Fase C: son artefactos NUEVOS de demo.
//
//    Uso:  node scripts/generarZoo.mjs [--pasos N] [--algos dqn,ppo,...] [--envs N]
//          npm run zoo -- --pasos 600000
//          npm run zoo -- --pasos 4000        (humo: valida el pipeline, NO la calidad)
// ============================================================================
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { GestorEntornos } from "../src/entorno/gestorEntornos.js";
import { RecolectorMetricas } from "../src/entrenamiento/metricas.js";
import { SistemaTrazas } from "../src/nucleo/trazas.js";
import { Orquestador } from "../src/entrenamiento/orquestador.js";
import { registrarAgentes } from "../src/agentes/catalogoAgentes.js";
import { crearAgente } from "../src/nucleo/registroAlgoritmos.js";
import { generarPool, dividirSplits } from "../src/entorno/generadorNiveles.js";
import { CONFIGURACION_ENTORNO, dimensionEstado, NUM_LADRILLOS } from "../src/nucleo/constantes.js";
import { backendRapido } from "./backend.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIR_MODELOS = resolve(RAIZ, "public", "modelos");

// Protocolo canónico (idéntico a scripts/comparativa.mjs → coherente con las gráficas).
const DIM = dimensionEstado(true);                 // 86 (VISTA 8×10: 6 cinemática + 80 ladrillos)
const MAXP = CONFIGURACION_ENTORNO.MAX_PASOS_EPISODIO;
const ESCALA = 1.0;                                // ocupación pura (la comparativa usa 1.0, no 0.25)
const SEMILLA_POOL = 12345, SEMILLA_SPLIT = 999, SPLIT = { train: 0.7, val: 0.15 }, N_POOL = 400;
const TIERS = [16, 36, 60, NUM_LADRILLOS];         // currículo: ladrillos vivos máx por etapa

const DEF_ALGOS = [
  { id: "dqn", envs: 128, nombre: "DQN", color: "#2563eb", familia: "model-free · valor" },
  { id: "ppo", envs: 64, nombre: "PPO", color: "#7c3aed", familia: "model-free · actor-crítico" },
  { id: "sac", envs: 128, nombre: "SAC", color: "#db2777", familia: "model-free · actor-crítico" },
  { id: "worldModel", envs: 128, nombre: "World Model", color: "#0891b2", familia: "model-based · Dyna-Q" },
  { id: "worldModelRecurrente", envs: 128, nombre: "World Model RNN", color: "#0c9f6e", familia: "model-based · LSTM" },
];

function parseArgs(argv) {
  const o = { pasos: 600000, envs: null, algos: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--pasos") o.pasos = +argv[++i];
    else if (a === "--envs") o.envs = +argv[++i];
    else if (a === "--algos") o.algos = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
  }
  return o;
}

/** Evaluación greedy (ε=0) sobre un split de niveles no vistos. */
async function evalSplit(agente, split, kEps = 200) {
  const masks = split.map((n) => n.mask);
  const g = new GestorEntornos({
    numHeadless: 48, numVisuales: 0, shaping: false, incluirLadrillos: true,
    escalaLadrillos: ESCALA, proveedorNivel: () => masks[(Math.random() * masks.length) | 0],
  });
  let eps = 0, won = 0, pct = 0, reward = 0;
  const tope = (MAXP + 5) * Math.ceil(kEps / 48) + 400;
  for (let p = 0; p < tope && eps < kEps; p++) {
    const acc = agente.seleccionarAcciones(g.obtenerEstadosEntrenamiento(), 48, { entrenar: false });
    const res = g.aplicarAcciones(acc);
    for (const e of res.episodios) {
      eps++;
      if (e.ganado) won++;
      pct += e.ladrillosIniciales ? e.ladrillosRotos / e.ladrillosIniciales : 0;
      reward += e.recompensa;
    }
  }
  return {
    evalExito: won / Math.max(1, eps),
    evalLadrillos: pct / Math.max(1, eps),
    evalReward: reward / Math.max(1, eps),
    evalEpisodios: eps,
  };
}

/** Entrena un algoritmo con currículo por tiers (igual que la comparativa canónica). */
async function entrenarAlgo(id, envs, pasos, train) {
  const capRef = { v: TIERS[0] };
  const masksTrain = train.map((n) => ({ mask: n.mask, vivos: n.vivos }));
  const proveedor = () => {
    const sub = masksTrain.filter((n) => n.vivos <= capRef.v);
    return sub[(Math.random() * sub.length) | 0].mask;
  };
  const met = new RecolectorMetricas();
  const gestor = new GestorEntornos({
    numHeadless: envs, numVisuales: 0, shaping: false, incluirLadrillos: true,
    escalaLadrillos: ESCALA, proveedorNivel: proveedor,
  });
  const agente = crearAgente(id, { dimEstado: DIM, arquitectura: "conv" });
  const orq = new Orquestador({ gestor, agente, metricas: met, trazas: new SistemaTrazas(), idAlgoritmo: id, silencioso: true });

  const t0 = Date.now();
  let etapa = 0, tierSteps = 0, objetivo = 0;
  while (objetivo < pasos) {
    objetivo = Math.min(pasos, objetivo + 50000);
    await orq.correr(objetivo, () => {});
    tierSteps += 50000;
    const sr = met.obtenerInstantanea().successRate;
    // Subir de tier al dominar el actual (éxito ≥ 70% con muestra suficiente) o por tope.
    if (etapa < TIERS.length - 1 && ((sr >= 0.7 && met._exitos.length >= 100) || tierSteps >= 500000)) {
      etapa++; capRef.v = TIERS[etapa]; tierSteps = 0;
    }
    process.stderr.write(`  ${id}: ${objetivo}/${pasos} · tier≤${capRef.v} · éxito ${(sr * 100).toFixed(0)}%   \r`);
  }
  process.stderr.write("\n");
  return { agente, dt: (Date.now() - t0) / 1000 };
}

async function main() {
  const opts = parseArgs(process.argv);
  const be = await backendRapido();
  registrarAgentes();
  const seleccion = opts.algos ? DEF_ALGOS.filter((a) => opts.algos.includes(a.id)) : DEF_ALGOS;
  if (!seleccion.length) { console.error(`Sin algoritmos válidos. Opciones: ${DEF_ALGOS.map((a) => a.id).join(", ")}`); process.exit(1); }

  const pool = generarPool({ semilla: SEMILLA_POOL, n: N_POOL });
  const { train, test } = dividirSplits(pool, SPLIT, SEMILLA_SPLIT);

  mkdirSync(DIR_MODELOS, { recursive: true });
  console.log(`\n══════ GENERAR ZOO · ${opts.pasos} pasos/algo · conv 8×10 (dim ${DIM}) · backend=${be} ══════`);
  console.log(`Niveles: pool ${pool.length} (semilla ${SEMILLA_POOL}) · train ${train.length}/test ${test.length} · eval greedy en TEST.\n`);
  if (opts.pasos < 50000) console.log("⚠️  pasos bajos: corrida de HUMO (valida el pipeline, NO la calidad de juego).\n");

  const modelos = [];
  // Manifiesto INCREMENTAL: se reescribe tras cada modelo terminado. Si una corrida
  // larga (nocturna) se interrumpe, el manifiesto ya refleja los modelos guardados.
  const escribirManifiesto = () => writeFileSync(
    resolve(DIR_MODELOS, "manifiesto.json"),
    JSON.stringify({
      generadoEn: new Date().toISOString(),
      pasos: opts.pasos,
      dimEstado: DIM,
      arquitectura: "conv",
      escalaLadrillos: ESCALA,
      incluirLadrillos: true,
      niveles: { semillaPool: SEMILLA_POOL, semillaSplit: SEMILLA_SPLIT, split: SPLIT, n: N_POOL },
      modelos,
    }, null, 2)
  );

  for (const a of seleccion) {
    const envs = opts.envs ?? a.envs;
    try {
      const { agente, dt } = await entrenarAlgo(a.id, envs, opts.pasos, train);
      const ev = await evalSplit(agente, test);
      const red = agente.obtenerRedAccion();
      if (!red) throw new Error("obtenerRedAccion() devolvió null");
      const dir = resolve(DIR_MODELOS, a.id);
      mkdirSync(dir, { recursive: true });
      await red.save("file://" + dir);                 // → dir/model.json + dir/weights.bin
      const params = red.countParams?.() ?? 0;
      modelos.push({ id: a.id, nombre: a.nombre, color: a.color, familia: a.familia, params, pasos: opts.pasos, ...ev });
      escribirManifiesto();                            // persistir progreso tras cada modelo
      console.log(`✓ ${a.nombre.padEnd(16)} éxito ${(ev.evalExito * 100).toFixed(0).padStart(3)}% · ladr ${(ev.evalLadrillos * 100).toFixed(0).padStart(3)}% · ${String(params).padStart(6)} params · ${dt.toFixed(0)}s → public/modelos/${a.id}/`);
      agente.destruir();
    } catch (e) {
      console.error(`✗ ${a.nombre}: ${(e.message || "").split("\n")[0]}`);
    }
  }

  escribirManifiesto();
  console.log(`\nManifiesto → public/modelos/manifiesto.json (${modelos.length} modelos)\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
