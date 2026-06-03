// ============================================================================
//  Panel de transición — muestra [s] → [a] → [r] → [s'] → [done] en vivo
// ============================================================================

export class PanelTransicion {
  constructor(contenedor) {
    this.contenedor = contenedor;
    this._construir();
  }

  _construir() {
    this.contenedor.innerHTML = `
      <span class="seccion-titulo" style="margin:0 8px 0 0">Transición actual
        <span class="info">i<span class="tip"><b>La unidad de aprendizaje.</b> Cada paso del entorno produce una tupla
          <b>(s, a, r, s', done)</b>: el estado en que estaba, la acción que tomó, la recompensa que ganó, el estado al que
          fue y si el episodio terminó. Estas tuplas son los "datos" con los que entrena la red.</span></span></span>
      <div class="paso-t"><span class="k">s
        <span class="info">i<span class="tip"><b>Estado.</b> Lo que el agente observa (aquí, la posición x de la pelota como muestra del vector de 6 números).</span></span></span><span class="v" id="t-s">—</span></div>
      <span class="flecha">→</span>
      <div class="paso-t accion"><span class="k">a
        <span class="info">i<span class="tip"><b>Acción.</b> La que eligió la política: ← izquierda, · mantener, → derecha.</span></span></span><span class="v" id="t-a">·</span></div>
      <span class="flecha">→</span>
      <div class="paso-t reward"><span class="k">r
        <span class="info">i<span class="tip"><b>Recompensa.</b> El premio/castigo de ese paso: +1 ladrillo, +0,2 rebote, −5 perder, +5 nivel, más el shaping.</span></span></span><span class="v" id="t-r">0</span></div>
      <span class="flecha">→</span>
      <div class="paso-t"><span class="k">s'
        <span class="info">i<span class="tip"><b>Estado siguiente.</b> A dónde llevó la acción. La red usa s' para estimar el valor del futuro (Bellman).</span></span></span><span class="v" id="t-s2">—</span></div>
      <span class="flecha">→</span>
      <div class="paso-t"><span class="k">done
        <span class="info">i<span class="tip"><b>¿Terminó?</b> true si se perdió la bola o se limpió el nivel. Si es true, no se mira el futuro al calcular el objetivo.</span></span></span><span class="v" id="t-done">false</span></div>
    `;
    this.s = this.contenedor.querySelector("#t-s");
    this.a = this.contenedor.querySelector("#t-a");
    this.r = this.contenedor.querySelector("#t-r");
    this.s2 = this.contenedor.querySelector("#t-s2");
    this.done = this.contenedor.querySelector("#t-done");
  }

  actualizar(t) {
    if (!t) return;
    this.s.textContent = t.estado;
    this.a.textContent = t.accion;
    this.r.textContent = t.recompensa;
    this.s2.textContent = t.siguiente;
    this.done.textContent = t.done ? "true" : "false";
    this.done.style.color = t.done ? "var(--error)" : "var(--texto)";
  }
}
