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
      this._titulo(
        "World Model",
        "<b>Modelo de dinámica.</b> Una red predice el siguiente estado s' (y r, done) dado (s,a). Con esas predicciones se generan transiciones imaginadas para entrenar el Q-net (Dyna-Q). Un error bajo del modelo indica predicciones fiables."
      ) +
      `<div class="subtitulo">Q(s,a) del agente Dyna-Q</div>` +
      this._barras(d.qValores, d.accionGreedy, d.simbolos, false) +
      `<div class="subtitulo" style="margin-top:6px">Estado real → predicho (acción greedy)</div>
       <div class="estado-pred">
         <span class="cab">componente</span><span class="cab" style="text-align:right">real</span><span class="cab" style="text-align:right">pred</span>
         ${filasEstado}
       </div>` +
      this._fila("Error modelo (RMSE)", d.errorModelo.toFixed(4)) +
      this._fila("Recompensa predicha", d.recompensaPredicha.toFixed(3)) +
      this._fila("Pasos de planning", d.pasosPlanning);
  }
}
