import { InspectorBase } from "./baseInspector.js";

export class InspectorDQN extends InspectorBase {
  render(d) {
    if (!d) return;
    this.contenedor.innerHTML =
      this._titulo(
        "DQN",
        "<b>Q-values.</b> La red estima Q(s,a) = recompensa futura esperada al tomar cada acción desde este estado y seguir actuando bien. La acción greedy (verde) es el máximo. ε-greedy a veces elige otra para explorar."
      ) +
      `<div class="subtitulo">Q(s,a) — valor esperado de cada acción</div>` +
      this._barras(d.qValores, d.accionGreedy, d.simbolos, false) +
      this._fila("ε exploración", d.epsilon.toFixed(3)) +
      this._fila("TD-error medio", d.tdError.toFixed(4)) +
      this._fila("Buffer", `${Math.round(d.bufferSize).toLocaleString("es")} (${(d.bufferFill * 100).toFixed(0)}%)`);
  }
}
