import { InspectorBase } from "./baseInspector.js";

export class InspectorDQN extends InspectorBase {
  render(d) {
    if (!d) return;
    this.contenedor.innerHTML =
      this._titulo("DQN", "dqn") +
      this._subtitulo("Q(s,a) — valor esperado de cada acción", "qValores") +
      this._barras(d.qValores, d.accionGreedy, d.simbolos, false) +
      this._fila("ε exploración", d.epsilon.toFixed(3), "epsilon") +
      this._fila("TD-error medio", d.tdError.toFixed(4), "tdError") +
      this._fila(
        "Buffer",
        `${Math.round(d.bufferSize).toLocaleString("es")} (${(d.bufferFill * 100).toFixed(0)}%)`,
        "bufferSize"
      );
  }
}
