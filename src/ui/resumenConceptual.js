// ============================================================================
//  Resumen conceptual — tabla de conceptos, flujo de datos y familias
//  Zona pedagógica (inferior). Se adapta al algoritmo seleccionado.
// ============================================================================

import { conceptosParaAlgoritmo } from "../datos/conceptos.js";
import { listarAlgoritmos } from "../nucleo/registroAlgoritmos.js";
import { ALGORITMOS } from "../nucleo/constantes.js";

export class ResumenConceptual {
  constructor({ tablaConceptos, conceptoAlgo, flujoDatos, flujoDescripcion, variantes }) {
    this.el = { tablaConceptos, conceptoAlgo, flujoDatos, flujoDescripcion, variantes };
    this._renderVariantes();
  }

  configurar(def) {
    this.el.conceptoAlgo.textContent = def.nombre;
    this._renderConceptos(def.id);
    this._renderFlujo(def);
    // Resaltar la familia activa.
    this.el.variantes.querySelectorAll(".variante").forEach((v) => {
      v.classList.toggle("activo-var", v.dataset.id === def.id);
      v.style.borderColor = v.dataset.id === def.id ? "var(--acento)" : "";
    });
  }

  _renderConceptos(id) {
    const conceptos = conceptosParaAlgoritmo(id);
    this.el.tablaConceptos.innerHTML = "";
    for (const c of conceptos) {
      const fila = document.createElement("div");
      fila.className = "concepto " + (c.usado ? "usado" : "no-usado");
      fila.innerHTML = `
        <div class="nombre">${c.nombre}
          <span class="info" data-info="${c.id}">i</span>
          <span class="resumen">— ${c.resumen}</span>
        </div>
        <span></span>
        <span class="marca">${c.usado ? "✓ Usado" : "no usa"}</span>`;
      this.el.tablaConceptos.appendChild(fila);
    }
  }

  _renderFlujo(def) {
    let pasos;
    if (def.id === ALGORITMOS.WORLD_MODEL) {
      pasos = [
        { i: "🎮", n: "Entornos" },
        { i: "⚡", n: "Experiencias" },
        { i: "🗃️", n: "Replay buffer" },
        { i: "🔮", n: "Modelo (s,a)→s'" },
        { i: "💭", n: "Imaginación" },
        { i: "🧠", n: "Q-net" },
        { i: "🎯", n: "Política" },
      ];
      this.el.flujoDescripcion.textContent =
        "Model-based (Dyna-Q): además de aprender de datos reales, el modelo de dinámica genera experiencias imaginadas con las que se entrena el Q-net, multiplicando los datos por cada paso real.";
    } else if (def.politica === "on-policy") {
      pasos = [
        { i: "🎮", n: "Entornos" },
        { i: "⚡", n: "Rollout (T pasos)" },
        { i: "📐", n: "Ventajas (GAE)" },
        { i: "🧠", n: "Actor + Crítico" },
        { i: "🎯", n: "Política" },
      ];
      this.el.flujoDescripcion.textContent =
        "On-policy: se recogen rollouts con la política actual, se calculan las ventajas con GAE, se optimiza unas épocas con el objetivo recortado y se descartan los datos.";
    } else {
      pasos = [
        { i: "🎮", n: "Entornos" },
        { i: "⚡", n: "Experiencias" },
        { i: "🗃️", n: "Replay buffer" },
        { i: "🧠", n: def.id === ALGORITMOS.SAC ? "Actor + 2 Críticos" : "Q-net + objetivo" },
        { i: "🎯", n: "Política" },
      ];
      this.el.flujoDescripcion.textContent =
        "Off-policy: las experiencias se guardan en un replay buffer y se reutilizan en minibatches aleatorios, rompiendo la correlación temporal y mejorando la eficiencia de datos.";
    }

    this.el.flujoDatos.innerHTML = "";
    pasos.forEach((p, idx) => {
      const nodo = document.createElement("div");
      nodo.className = "flujo-nodo";
      nodo.innerHTML = `<span class="icono">${p.i}</span><span class="n">${p.n}</span>`;
      this.el.flujoDatos.appendChild(nodo);
      if (idx < pasos.length - 1) {
        const fl = document.createElement("span");
        fl.className = "flujo-flecha";
        fl.textContent = "→";
        this.el.flujoDatos.appendChild(fl);
      }
    });
    // Flecha de realimentación al final.
    const ciclo = document.createElement("span");
    ciclo.className = "flujo-flecha";
    ciclo.textContent = "↺";
    ciclo.title = "La política mejorada vuelve a actuar en los entornos";
    this.el.flujoDatos.appendChild(ciclo);
  }

  _renderVariantes() {
    this.el.variantes.innerHTML = "";
    for (const def of listarAlgoritmos()) {
      const v = document.createElement("div");
      v.className = "variante";
      v.dataset.id = def.id;
      v.innerHTML = `
        <div class="etiqueta-familia">${def.familia} · ${def.politica}</div>
        <h4>${def.nombre} <span class="suave" style="font-weight:400">— ${def.nombreLargo}</span></h4>
        <p>${def.descripcion}</p>`;
      this.el.variantes.appendChild(v);
    }
  }
}
