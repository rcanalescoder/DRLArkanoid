// ============================================================================
//  Panel de métricas clave — tarjetas que adaptan sus etiquetas al algoritmo
//  Slots fijos: Recompensa y Pérdida. Slots 3-5: específicos del algoritmo
//  (definidos en etiquetasMetricas del registro). Slot 6: Tasa de éxito.
// ============================================================================

export class PanelMetricas {
  constructor(contenedor) {
    this.contenedor = contenedor;
    this.campos = [];
    this._rewardPrevio = null;
  }

  configurar(def) {
    this.contenedor.innerHTML = "";
    this.campos = [];
    const em = def.etiquetasMetricas || {};

    const especificas = [em.metrica3, em.metrica4, em.metrica5].filter(Boolean);
    const definicion = [
      { clave: "rewardMedio100", etiqueta: "Recompensa·100", formato: "num", cls: "reward", ayuda: "Recompensa media de los últimos 100 episodios. Es la métrica principal: si sube, el agente aprende." },
      { clave: "loss", etiqueta: "Pérdida", formato: "num", cls: "loss", ayuda: "Error de la red en cada actualización. No tiene que bajar siempre (en RL el objetivo se mueve), pero no debería diverger." },
      ...especificas.map((e) => ({ ...e, ayuda: e.ayuda })),
      { clave: "tasaExito100", etiqueta: "Tasa de éxito", formato: "pct", ayuda: "Porcentaje de los últimos 100 episodios en que el agente limpió todos los ladrillos." },
    ];

    for (const d of definicion) {
      const card = document.createElement("div");
      card.className = "metrica" + (d.cls ? " " + d.cls : "");
      const etq = document.createElement("div");
      etq.className = "etiqueta";
      etq.textContent = d.etiqueta;
      if (d.ayuda) {
        const a = document.createElement("span");
        a.className = "ayuda";
        a.innerHTML = `?<span class="tip">${d.ayuda}</span>`;
        etq.appendChild(a);
      }
      const val = document.createElement("div");
      val.className = "valor";
      val.textContent = "—";
      card.append(etq, val);
      if (d.clave === "rewardMedio100") {
        const delta = document.createElement("div");
        delta.className = "delta";
        card.appendChild(delta);
        d._delta = delta;
      }
      this.contenedor.appendChild(card);
      this.campos.push({ ...d, _val: val });
    }
  }

  actualizar(datos) {
    for (const c of this.campos) {
      const v = datos[c.clave];
      c._val.textContent = formatear(v, c.formato);
      if (c.clave === "rewardMedio100" && c._delta) {
        if (this._rewardPrevio != null && v != null) {
          const d = v - this._rewardPrevio;
          c._delta.textContent = (d >= 0 ? "▲ " : "▼ ") + d.toFixed(3);
          c._delta.className = "delta " + (d >= 0 ? "sube" : "baja");
        }
        if (v != null) this._rewardPrevio = v;
      }
    }
  }

  reiniciar() {
    this._rewardPrevio = null;
  }
}

function formatear(v, formato) {
  if (v == null || Number.isNaN(v)) return "—";
  if (formato === "pct") return (v * 100).toFixed(1) + "%";
  if (formato === "entero") return Math.round(v).toLocaleString("es");
  // num
  if (Math.abs(v) >= 1000) return Math.round(v).toLocaleString("es");
  if (Math.abs(v) >= 100) return v.toFixed(1);
  return v.toFixed(3);
}
