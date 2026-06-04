import { InspectorBase } from "./baseInspector.js";
import { NOMBRES_ESTADO } from "../../nucleo/constantes.js";

export class InspectorWorldModel extends InspectorBase {
  render(d) {
    if (!d) return;
    const filasEstado = NOMBRES_ESTADO.map(
      (nombre, i) => `
        <span class="cab">${nombre}</span>
        <span class="real">${(d.estadoReal[i] ?? 0).toFixed(3)}</span>
        <span class="pred">${(d.estadoPredicho[i] ?? 0).toFixed(3)}</span>`
    ).join("");

    this.contenedor.innerHTML =
      this._titulo("World Model", "worldModel") +
      this._subtitulo("Q(s,a) del agente Dyna-Q", "qValores") +
      this._barras(d.qValores, d.accionGreedy, d.simbolos, false) +
      this._subtitulo("Estado real → predicho (acción greedy)", "modeloDinamica") +
      `<div class="estado-pred">
         <span class="cab">componente</span><span class="cab" style="text-align:right">real</span><span class="cab" style="text-align:right">pred</span>
         ${filasEstado}
       </div>` +
      this._fila("Error modelo (RMSE)", d.errorModelo.toFixed(4), "errorModelo") +
      this._fila("Recompensa predicha", d.recompensaPredicha.toFixed(3), "modeloDinamica") +
      this._fila("Pasos de planning", d.pasosPlanning, "pasosPlanning");
  }
}
