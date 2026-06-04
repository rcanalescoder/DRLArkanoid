// ============================================================================
//  InspectorBase — utilidades comunes a todos los inspectores de algoritmo.
//  Cada campo puede llevar su propio icono de info (ℹ) que abre la ficha rica.
// ============================================================================

export class InspectorBase {
  constructor(contenedor) {
    this.contenedor = contenedor;
  }

  render(_datos) {}

  /** Icono de info que abre la ficha pedagógica del id dado (vacío si no hay id). */
  _info(id) {
    return id ? ` <span class="info" data-info="${id}">i</span>` : "";
  }

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
          <span class="num">${v.toFixed(3)}</span>
        </div>`;
      })
      .join("");
  }

  /** Subtítulo de una sección del inspector, con icono de info opcional. */
  _subtitulo(texto, infoId) {
    return `<div class="subtitulo">${texto}${this._info(infoId)}</div>`;
  }

  /** Fila etiqueta→valor, con icono de info opcional junto a la etiqueta. */
  _fila(etiqueta, valor, infoId) {
    return `<div class="insp-fila"><span>${etiqueta}${this._info(infoId)}</span><b>${valor}</b></div>`;
  }

  /** Título del inspector; su info enlaza, por defecto, a la ficha del algoritmo. */
  _titulo(nombre, infoId = "inspector") {
    return `<div class="titulo-insp">🔬 Inspector ${nombre}${this._info(infoId)}</div>`;
  }
}
