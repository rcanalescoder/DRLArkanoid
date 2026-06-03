// ============================================================================
//  InspectorBase — utilidades comunes a todos los inspectores de algoritmo
//  Cada inspector reconstruye su contenido a partir de obtenerDatosInspeccion().
// ============================================================================

export class InspectorBase {
  constructor(contenedor) {
    this.contenedor = contenedor;
  }

  render(_datos) {}

  /** Barras horizontales para Q-values o probabilidades (resalta la greedy). */
  _barras(valores, greedy, simbolos, esProb = false) {
    let min = Math.min(...valores);
    let max = Math.max(...valores);
    if (esProb) {
      min = 0;
      max = 1;
    }
    const rango = max - min || 1;
    return valores
      .map((v, i) => {
        const w = esProb ? v * 100 : ((v - min) / rango) * 100;
        const opt = i === greedy ? " optima" : "";
        return `<div class="barra-q${opt}">
          <span class="acc">${simbolos[i]}</span>
          <div class="pista"><div class="relleno" style="width:${Math.max(2, w).toFixed(0)}%"></div></div>
          <span class="num">${v.toFixed(esProb ? 3 : 3)}</span>
        </div>`;
      })
      .join("");
  }

  _fila(etiqueta, valor) {
    return `<div class="insp-fila"><span>${etiqueta}</span><b>${valor}</b></div>`;
  }

  _titulo(nombre, _ayuda) {
    return `<div class="titulo-insp">🔬 Inspector ${nombre}
      <span class="info" data-info="inspector">i</span></div>`;
  }
}
