// ============================================================================
//  main.js — arranque de la aplicación
//  1) Detecta el mejor backend de TF.js (WebGPU → WebGL → CPU) para el M4 Max
//  2) Registra agentes e inspectores
//  3) Crea la aplicación y arranca
// ============================================================================

import "./css/base.css";
import "./css/layout.css";
import "./css/componentes.css";
import "./css/juego.css";
import "./css/metricas.css";
import "./css/inspectores.css";

import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgpu"; // registra el backend WebGPU (Metal/MPS)

import { BACKENDS_PREFERIDOS } from "./nucleo/constantes.js";
import { registrarAgentes } from "./agentes/catalogoAgentes.js";
import { registrarInspectores } from "./ui/inspectores/gestorInspectores.js";
import { Aplicacion } from "./ui/aplicacion.js";
import { bus, EVENTOS } from "./nucleo/busEventos.js";

async function inicializarBackend() {
  for (const b of BACKENDS_PREFERIDOS) {
    try {
      if (b === "webgpu" && !navigator.gpu) continue;
      await tf.setBackend(b);
      await tf.ready();
      if (tf.getBackend() === b) {
        console.log(`[DRL] Backend activo: ${b}`);
        return b;
      }
    } catch (e) {
      console.warn(`[DRL] Backend ${b} no disponible:`, e?.message ?? e);
    }
  }
  await tf.setBackend("cpu");
  await tf.ready();
  return tf.getBackend();
}

async function main() {
  registrarAgentes();
  registrarInspectores();

  const backend = await inicializarBackend();
  bus.emitir(EVENTOS.BACKEND_LISTO, { backend });

  const app = new Aplicacion();
  app.iniciar(backend);

  // Exponer para depuración desde la consola.
  window.__drl = { app, tf };
  console.log(
    "%c🧠 Arkanoid DRL Learning Lab listo",
    "color:#4ea3ff;font-weight:bold",
    `· backend=${backend} · usa window.__drl para depurar`
  );
}

main().catch((e) => {
  console.error("[DRL] Error fatal en el arranque:", e);
  document.body.innerHTML = `<pre style="color:#ff6b81;padding:24px;font-family:monospace">Error al arrancar:\n${e?.stack ?? e}</pre>`;
});
