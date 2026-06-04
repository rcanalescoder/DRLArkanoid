// ============================================================================
//  DIAG (vista-only) — curva de SUPERVIVENCIA/limpieza de la VISTA, comparando
//  codificaciones del bloque de ladrillos. El ciego queda abandonado (PIVOTE).
//  Problema medido (300k): la vista sobrevive muy despacio porque las 28
//  ocupaciones (≈1.0) ahogan las 6 cinemáticas (∈[-1,1]) en la 1ª capa. Aquí
//  trazo steps_alive / ladrillos en GREEDY a lo largo del entrenamiento para
//  varias ESCALAS del bloque de ladrillos:
//    · escala 1.0 = ocupación pura {0,1} (¿despega solo con más pasos?)
//    · escala <1  = bloque atenuado para no ahogar la cinemática (¿acelera?)
//    Uso: node scripts/diag_vista.mjs [tope=600000] [envs=128] [escalas=1.0,0.25]
// ============================================================================
import * as tf from "@tensorflow/tfjs";
import { GestorEntornos } from "../src/entorno/gestorEntornos.js";
import { RecolectorMetricas } from "../src/entrenamiento/metricas.js";
import { SistemaTrazas } from "../src/nucleo/trazas.js";
import { Orquestador } from "../src/entrenamiento/orquestador.js";
import { registrarAgentes } from "../src/agentes/catalogoAgentes.js";
import { crearAgente } from "../src/nucleo/registroAlgoritmos.js";
import { CONFIGURACION_ENTORNO, dimensionEstado } from "../src/nucleo/constantes.js";

const TOPE = +(process.argv[2] || 600000);
const ENVS = +(process.argv[3] || 128);
const ESCALAS = (process.argv[4] || "1.0,0.25").split(",").map(Number);
const MAXP = CONFIGURACION_ENTORNO.MAX_PASOS_EPISODIO;
const CHECKPOINTS = [100000, 250000, 400000, 600000, 800000].filter((c) => c <= TOPE);
const DIM = dimensionEstado(true); // siempre VISTA (34)

async function evalLleno(agente, escala, kEps = 80) {
  const g = new GestorEntornos({ numHeadless: 48, numVisuales: 0, shaping: false, incluirLadrillos: true, escalaLadrillos: escala });
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

async function trayectoria(escala) {
  const gestor = new GestorEntornos({ numHeadless: ENVS, numVisuales: 0, shaping: false, incluirLadrillos: true, escalaLadrillos: escala });
  const agente = crearAgente("dqn", { dimEstado: DIM });
  const orq = new Orquestador({ gestor, agente, metricas: new RecolectorMetricas(), trazas: new SistemaTrazas(), idAlgoritmo: "dqn", silencioso: true });
  console.log(`\n── VISTA escala=${escala} (dim ${DIM}) ──`);
  for (const cp of CHECKPOINTS) {
    const t = Date.now();
    await orq.correr(cp, () => {});
    const e = await evalLleno(agente, escala);
    console.log(`  ${String(cp / 1000).padStart(4)}k │ vive ${String(Math.round(e.steps)).padStart(4)} │ ladrillos ${e.bricks.toFixed(1).padStart(4)}/28 (máx ${String(e.maxB).padStart(2)}) │ éxito ${(e.success * 100).toFixed(0).padStart(3)}% │ ${((Date.now() - t) / 1000).toFixed(0)}s`);
  }
  agente.destruir();
}

(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
  registrarAgentes();
  console.log(`\n══════ DIAG vista-only · escalas=[${ESCALAS.join(", ")}] · tope=${TOPE} · envs=${ENVS} ══════`);
  console.log(`Pregunta: ¿la VISTA despega en supervivencia/limpieza? ¿atenuar el bloque de ladrillos la acelera?`);
  for (const esc of ESCALAS) await trayectoria(esc);
  console.log(`\nLectura: la escala con steps_alive subiendo antes hacia ~el timeout y ladrillos→28 es la mejor`);
  console.log(`codificación. Si ninguna despega → rama cinemática separada / más presupuesto.`);
})().catch((e) => { console.error(e); process.exit(1); });
