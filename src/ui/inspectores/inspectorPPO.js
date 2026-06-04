import { InspectorBase } from "./baseInspector.js";

export class InspectorPPO extends InspectorBase {
  render(d) {
    if (!d) return;
    this.contenedor.innerHTML =
      this._titulo("PPO", "ppo") +
      this._subtitulo("π(a|s) — probabilidad de cada acción", "politicaEstocastica") +
      this._barras(d.probabilidades, d.accionGreedy, d.simbolos, true) +
      this._fila("Valor V(s)", d.valorEstimado.toFixed(3), "valorEstado") +
      this._fila("Entropía H(π)", d.entropia.toFixed(3), "entropia") +
      this._fila("Rollout", `${(d.rolloutProgreso * 100).toFixed(0)}%`, "rolloutProgreso");
  }
}
