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
        <span class="info" data-info="transicion">i</span></span>
      <div class="paso-t"><span class="k">s <span class="info" data-info="estado">i</span></span><span class="v" id="t-s">—</span></div>
      <span class="flecha">→</span>
      <div class="paso-t accion"><span class="k">a <span class="info" data-info="accion">i</span></span><span class="v" id="t-a">·</span></div>
      <span class="flecha">→</span>
      <div class="paso-t reward"><span class="k">r <span class="info" data-info="recompensa">i</span></span><span class="v" id="t-r">0</span></div>
      <span class="flecha">→</span>
      <div class="paso-t"><span class="k">s' <span class="info" data-info="estadoSiguiente">i</span></span><span class="v" id="t-s2">—</span></div>
      <span class="flecha">→</span>
      <div class="paso-t"><span class="k">done <span class="info" data-info="done">i</span></span><span class="v" id="t-done">false</span></div>
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
