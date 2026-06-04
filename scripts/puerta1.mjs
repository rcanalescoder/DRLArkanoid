// ============================================================================
//  PUERTA 1 (Fase 1, vista-only) — ¿la VISTA apunta?
//  El ciego queda ABANDONADO (ver PIVOTE del plan). Aquí entrenamos UN agente
//  CON VISTA (34, escala de ladrillos por defecto) sobre la rejilla LLENA 4×7 y
//  lo evaluamos en GREEDY (ε=0) sobre el LLENO y varios niveles DISPERSOS fijos.
//  Clave: en el lleno se gana SOBREVIVIENDO; en los dispersos, con pocos
//  ladrillos, sobrevivir ≠ ganar → limpiarlos SOLO es posible APUNTANDO. El éxito
//  de la vista en los dispersos es, por sí solo, la prueba de que apunta (no se
//  compara con nada).
//    Uso: node scripts/puerta1.mjs [pasos=800000] [envs=128] [escala]
// ============================================================================
import * as tf from "@tensorflow/tfjs";
import { GestorEntornos } from "../src/entorno/gestorEntornos.js";
import { RecolectorMetricas } from "../src/entrenamiento/metricas.js";
import { SistemaTrazas } from "../src/nucleo/trazas.js";
import { Orquestador } from "../src/entrenamiento/orquestador.js";
import { registrarAgentes } from "../src/agentes/catalogoAgentes.js";
import { crearAgente } from "../src/nucleo/registroAlgoritmos.js";
import {
  CONFIGURACION_ENTORNO,
  FILAS_LADRILLOS,
  COLUMNAS_LADRILLOS,
  ESCALA_LADRILLOS_DEFECTO,
  dimensionEstado,
} from "../src/nucleo/constantes.js";

const PASOS = +(process.argv[2] || 800000);
const ENVS = +(process.argv[3] || 128);
const ESCALA = process.argv[4] != null ? +process.argv[4] : ESCALA_LADRILLOS_DEFECTO;
const MAXP = CONFIGURACION_ENTORNO.MAX_PASOS_EPISODIO;
const DIM = dimensionEstado(true);

function contar(pred) {
  let n = 0;
  for (let f = 0; f < FILAS_LADRILLOS; f++)
    for (let c = 0; c < COLUMNAS_LADRILLOS; c++) if (pred(f, c)) n++;
  return n;
}
const NIVELES = [
  { nombre: "lleno 4×7", pred: null }, // gana sobreviviendo (no discrimina apuntar)
  { nombre: "columna izq", pred: (f, c) => c === 0 },
  { nombre: "columna der", pred: (f, c) => c === COLUMNAS_LADRILLOS - 1 },
  { nombre: "fila superior", pred: (f, c) => f === 0 },
  { nombre: "dispersos", pred: (f, c) => (f * COLUMNAS_LADRILLOS + c) % 5 === 0 },
].map((n) => ({ ...n, total: n.pred ? contar(n.pred) : FILAS_LADRILLOS * COLUMNAS_LADRILLOS }));

async function evalGreedy(agente, pred, kEps = 200) {
  const g = new GestorEntornos({ numHeadless: 48, numVisuales: 0, shaping: false, incluirLadrillos: true, escalaLadrillos: ESCALA, patronLadrillos: pred });
  const m = new RecolectorMetricas();
  let eps = 0, maxB = 0;
  const tope = (MAXP + 5) * Math.ceil(kEps / 48) + 400;
  for (let p = 0; p < tope && eps < kEps; p++) {
    const acc = agente.seleccionarAcciones(g.obtenerEstadosEntrenamiento(), 48, { entrenar: false });
    const res = g.aplicarAcciones(acc);
    if (res.episodios.length) {
      m.registrarEpisodios(res.episodios);
      eps += res.episodios.length;
      for (const e of res.episodios) maxB = Math.max(maxB, e.ladrillosRotos);
    }
  }
  const i = m.obtenerInstantanea();
  return { success: i.successRate, bricks: i.bricksCleared, steps: i.stepsAlive, maxB };
}

(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
  registrarAgentes();
  console.log(`\n══════ PUERTA 1 (vista-only) · ${PASOS} pasos · envs=${ENVS} · escalaLadrillos=${ESCALA} · timeout=${MAXP} ══════`);
  console.log(`Entrenamiento en rejilla LLENA 4×7. Evaluación GREEDY (ε=0) en LLENO + DISPERSOS (prueba de APUNTAR).`);

  const gestor = new GestorEntornos({ numHeadless: ENVS, numVisuales: 0, shaping: false, incluirLadrillos: true, escalaLadrillos: ESCALA });
  const agente = crearAgente("dqn", { dimEstado: DIM });
  const orq = new Orquestador({ gestor, agente, metricas: new RecolectorMetricas(), trazas: new SistemaTrazas(), idAlgoritmo: "dqn", silencioso: true });
  const t0 = Date.now();
  await orq.correr(PASOS, () => {});
  console.log(`Entrenada la VISTA en ${((Date.now() - t0) / 1000).toFixed(0)}s.\n`);

  console.log(`${"nivel".padEnd(15)}│ ladr │ éxito · ladrillos · vive`);
  console.log("─".repeat(54));
  const filas = [];
  for (const n of NIVELES) {
    const r = await evalGreedy(agente, n.pred);
    filas.push({ n, r });
    console.log(`${n.nombre.padEnd(15)}│ ${String(n.total).padStart(4)} │ ${(r.success * 100).toFixed(0).padStart(3)}% · ${r.bricks.toFixed(1).padStart(4)}/${n.total} · ${String(Math.round(r.steps)).padStart(4)} (máx ${r.maxB})`);
  }
  console.log("─".repeat(54));
  const disp = filas.filter((f) => f.n.pred);
  const mExito = disp.reduce((s, f) => s + f.r.success, 0) / disp.length;
  const mLadr = disp.reduce((s, f) => s + f.r.bricks / f.n.total, 0) / disp.length;
  console.log(`DISPERSOS (apuntar) · éxito medio ${(mExito * 100).toFixed(0)}% · %ladrillos medio ${(mLadr * 100).toFixed(0)}%`);
  console.log(mExito > 0.5
    ? `✅ PUERTA 1: la vista LIMPIA niveles dispersos de forma fiable → apunta. (success ≠ supervivencia aquí.)`
    : mExito > 0.15 || mLadr > 0.6
      ? `🟡 PARCIAL: la vista apunta algo en dispersos pero no limpia fiable → más pasos / entrenar en niveles variados (Fase 2).`
      : `🔴 La vista no limpia dispersos → revisar (¿usa la ocupación?, escala, más pasos, entrenar variado).`);

  agente.destruir();
})().catch((e) => { console.error(e); process.exit(1); });
