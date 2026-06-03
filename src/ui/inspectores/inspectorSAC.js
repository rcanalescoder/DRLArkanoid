import { InspectorBase } from "./baseInspector.js";

export class InspectorSAC extends InspectorBase {
  render(d) {
    if (!d) return;
    const qLinea = d.q1Valores
      .map((q1, i) => `${d.simbolos[i]} ${Math.min(q1, d.q2Valores[i]).toFixed(2)}`)
      .join("   ");
    this.contenedor.innerHTML =
      this._titulo(
        "SAC",
        "<b>Máxima entropía.</b> El actor maximiza recompensa + α·entropía, manteniendo la exploración. Dos críticos Q (se usa el menor) evitan la sobreestimación. La temperatura α se ajusta sola hacia una entropía objetivo."
      ) +
      `<div class="subtitulo">π(a|s) — política estocástica</div>` +
      this._barras(d.probabilidades, d.accionGreedy, d.simbolos, true) +
      this._fila("Temperatura α", d.temperatura.toFixed(4)) +
      this._fila("Entropía H(π)", d.entropia.toFixed(3)) +
      this._fila("min(Q1,Q2)", `<span class="mono" style="font-size:11px">${qLinea}</span>`);
  }
}
