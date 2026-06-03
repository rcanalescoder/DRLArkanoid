// ============================================================================
//  Panel "Replay buffer (conceptual)"
//  Muestra las experiencias arquetípicas del juego con su recompensa REAL
//  (tomada de las constantes) y un TD-error ilustrativo. Pedagógico: explica
//  por qué unas experiencias son más valiosas que otras para entrenar.
// ============================================================================

import { RECOMPENSAS } from "../nucleo/constantes.js";

export class ReplayConceptual {
  constructor(contenedor) {
    this.contenedor = contenedor;
  }

  configurar(def) {
    const R = RECOMPENSAS;
    // TD-error ilustrativo: las experiencias terminales/raras "sorprenden" más.
    const exps = [
      { emoji: "🧱", etq: "Ladrillo roto", r: R.ROMPER_LADRILLO, done: false, td: 0.82 },
      { emoji: "🎾", etq: "Rebote correcto", r: R.GOLPEAR_PALA, done: false, td: 0.34 },
      { emoji: "⚠️", etq: "Bola perdida", r: R.PERDER_PELOTA, done: true, td: 0.93 },
      { emoji: "🏁", etq: "Nivel completado", r: R.COMPLETAR_NIVEL, done: true, td: 0.76 },
    ];

    const offPolicy = def.politica === "off-policy";
    const badge = offPolicy
      ? `<span class="badge ambar">replay prioritario disponible</span>`
      : `<span class="badge gris">no aplica · ${def.nombre} es on-policy (usa rollouts, no replay)</span>`;

    const filas = exps
      .map((e) => {
        const signo = e.r >= 0 ? "+" : "";
        const tupla = e.done
          ? `(s, a, ${signo}${e.r}, done)`
          : `(s, a, ${signo}${e.r}, s')`;
        const colorR = e.r >= 0 ? "var(--exito)" : "var(--error)";
        return `<div class="exp">
          <div class="exp-emoji">${e.emoji}</div>
          <div class="exp-cuerpo">
            <div class="exp-tupla mono">(s, a, <span style="color:${colorR}">${signo}${e.r}</span>, ${e.done ? "done" : "s')"}</div>
            <div class="exp-sub">${e.etq} · TD-error ${e.td.toFixed(2)}</div>
          </div>
          <div class="exp-barra" title="TD-error ${e.td.toFixed(2)}"><div class="exp-rell" style="width:${(e.td * 100).toFixed(0)}%"></div></div>
        </div>`;
      })
      .join("");

    this.contenedor.innerHTML = `
      <p class="exp-intro suave">Cada experiencia es una transición <span class="mono">(estado, acción, recompensa, siguiente)</span>.
        Las más informativas —una bola perdida o un ladrillo roto— tienen mayor <b>TD-error</b> (más "sorpresa" para la red)
        y, con replay prioritario, se muestrean con más frecuencia. ${badge}</p>
      <div class="exp-lista">${filas}</div>`;
  }
}
