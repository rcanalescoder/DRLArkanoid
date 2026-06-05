// ============================================================================
//  Cargador del ZOO de modelos (navegador)
//  Lee el manifiesto de public/modelos/, carga cada red de acción y la envuelve
//  en un AgenteReproductor listo para jugar. Prioridad de carga:
//    1) IndexedDB  (override local del usuario, generado por "Regenerar")
//    2) Asset oficial del repo (public/modelos/<id>/model.json)
//  La regeneración entrena conv in-app con el MISMO protocolo que el zoo (niveles
//  variados + currículo + escala del manifiesto) y guarda en IndexedDB, sin tocar
//  los assets versionados ni necesitar backend.
// ============================================================================

import * as tf from "@tensorflow/tfjs";
import { AgenteReproductor } from "../agentes/agenteReproductor.js";
import { GestorEntornos } from "../entorno/gestorEntornos.js";
import { RecolectorMetricas } from "../entrenamiento/metricas.js";
import { SistemaTrazas } from "../nucleo/trazas.js";
import { Orquestador } from "../entrenamiento/orquestador.js";
import { crearAgente } from "../nucleo/registroAlgoritmos.js";
import { generarPool, dividirSplits } from "../entorno/generadorNiveles.js";
import { NUM_LADRILLOS } from "../nucleo/constantes.js";

const BASE = import.meta.env.BASE_URL || "/";
const PREFIJO_IDB = "drl-zoo-";
const TIERS = [16, 36, 60, NUM_LADRILLOS];

/** Lee public/modelos/manifiesto.json. Devuelve null si el zoo no se ha generado. */
export async function cargarManifiesto() {
  try {
    const resp = await fetch(`${BASE}modelos/manifiesto.json`, { cache: "no-cache" });
    if (!resp.ok) return null;
    return await resp.json();
  } catch (_) {
    return null;
  }
}

/** Set de ids de modelos con override local (regenerado) en IndexedDB. */
export async function overridesGuardados() {
  try {
    const modelos = await tf.io.listModels();
    const ids = new Set();
    for (const clave of Object.keys(modelos)) {
      const m = clave.match(/^indexeddb:\/\/drl-zoo-(.+)$/);
      if (m) ids.add(m[1]);
    }
    return ids;
  } catch (_) {
    return new Set();
  }
}

/**
 * Carga un modelo como AgenteReproductor. Intenta el override de IndexedDB y, si
 * no existe, el asset oficial. Devuelve { reproductor, fuente: 'regenerado'|'oficial' }.
 */
export async function cargarModelo(id, meta = {}) {
  const dimEstado = meta.dimEstado;
  try {
    const red = await tf.loadLayersModel(`indexeddb://${PREFIJO_IDB}${id}`);
    return { reproductor: new AgenteReproductor(red, { dimEstado, id }), fuente: "regenerado" };
  } catch (_) {
    /* sin override → asset oficial */
  }
  const red = await tf.loadLayersModel(`${BASE}modelos/${id}/model.json`);
  return { reproductor: new AgenteReproductor(red, { dimEstado, id }), fuente: "oficial" };
}

/** Borra el override local de un modelo (vuelve al asset oficial). */
export async function borrarOverride(id) {
  try {
    await tf.io.removeModel(`indexeddb://${PREFIJO_IDB}${id}`);
  } catch (_) {
    /* no había override */
  }
}

/**
 * Re-entrena un modelo conv in-app (mismo protocolo que el zoo: niveles variados
 * del pool del manifiesto + currículo por tiers + escala del manifiesto) y lo
 * guarda en IndexedDB. Devuelve un reproductor con la red recién entrenada.
 *
 * @param {string} id            algoritmo
 * @param {object} meta          manifiesto (dimEstado, escalaLadrillos, niveles)
 * @param {object} opciones      { pasos, envs, señalCancelar }
 * @param {Function} onProgreso  (frac:0..1, texto) => void
 */
export async function regenerarModelo(id, meta = {}, opciones = {}, onProgreso = () => {}) {
  const { pasos = 40000, envs = 64, señalCancelar = () => false } = opciones;
  const DIM = meta.dimEstado ?? 86;
  const ESCALA = meta.escalaLadrillos ?? 1.0;
  const nv = meta.niveles ?? {};
  const pool = generarPool({ semilla: nv.semillaPool ?? 12345, n: nv.n ?? 400 });
  const { train } = dividirSplits(pool, nv.split ?? { train: 0.7, val: 0.15 }, nv.semillaSplit ?? 999);
  const masksTrain = train.map((x) => ({ mask: x.mask, vivos: x.vivos }));

  const capRef = { v: TIERS[0] };
  const proveedor = () => {
    const sub = masksTrain.filter((x) => x.vivos <= capRef.v);
    return sub[(Math.random() * sub.length) | 0].mask;
  };

  const gestor = new GestorEntornos({
    numHeadless: envs, numVisuales: 0, shaping: false, incluirLadrillos: true,
    escalaLadrillos: ESCALA, proveedorNivel: proveedor,
  });
  const agente = crearAgente(id, { dimEstado: DIM, arquitectura: "conv" });
  const metricas = new RecolectorMetricas();
  const orq = new Orquestador({ gestor, agente, metricas, trazas: new SistemaTrazas(), idAlgoritmo: id, silencioso: true });

  let etapa = 0, hito = 0;
  orq.arrancar();
  try {
    while (orq.pasoGlobal < pasos && !señalCancelar()) {
      await orq.ejecutarLote();
      if (orq.pasoGlobal - hito >= 1000) {
        hito = orq.pasoGlobal;
        const sr = metricas.obtenerInstantanea().successRate;
        if (etapa < TIERS.length - 1 && sr >= 0.7) { etapa++; capRef.v = TIERS[etapa]; }
        onProgreso(orq.pasoGlobal / pasos, `entrenando · éxito ${(sr * 100).toFixed(0)}% · tier≤${capRef.v}`);
        await new Promise((r) => setTimeout(r, 0)); // ceder al hilo de UI
      }
    }
  } finally {
    orq.pausar();
  }

  // Persistir SOLO la red de acción en IndexedDB y soltar el agente entrenador
  // (con su optimizador y buffer); luego recargar como reproductor independiente.
  await agente.obtenerRedAccion().save(`indexeddb://${PREFIJO_IDB}${id}`);
  agente.destruir();
  onProgreso(1, "guardado");
  return cargarModelo(id, meta);
}
