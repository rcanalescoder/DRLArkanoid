import { InspectorBase } from "./baseInspector.js";

export class InspectorPPO extends InspectorBase {
  render(d) {
    if (!d) return;
    this.contenedor.innerHTML =
      this._titulo(
        "PPO",
        "<b>Política estocástica.</b> El actor da una probabilidad para cada acción; se muestrea de esa distribución (exploración natural). La crítica estima V(s), el valor del estado, usado para calcular las ventajas (GAE)."
      ) +
      `<div class="subtitulo">π(a|s) — probabilidad de cada acción</div>` +
      this._barras(d.probabilidades, d.accionGreedy, d.simbolos, true) +
      this._fila("Valor V(s)", d.valorEstimado.toFixed(3)) +
      this._fila("Entropía H(π)", d.entropia.toFixed(3)) +
      this._fila("Rollout", `${(d.rolloutProgreso * 100).toFixed(0)}%`);
  }
}
