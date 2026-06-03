// ============================================================================
//  Grid search en vivo (pop-up)
//  Prueba varias combinaciones de hiperparámetros entrenando un agente AISLADO
//  por combinación (pool headless propio, orquestador en modo silencioso para
//  no tocar los paneles/curvas de la UI), muestra una tabla en vivo, va
//  resaltando la mejor combinación y permite aplicarla al agente principal.
//
//  El motor reutiliza exactamente la misma maquinaria que el entrenamiento real
//  (GestorEntornos + Orquestador + RecolectorMetricas), igual que el harness de
//  Node `scripts/entrenar.mjs`, así que lo que se mide aquí es entrenamiento de
//  verdad, no una simulación.
// ============================================================================

import { crearAgente, obtenerAlgoritmo } from "../nucleo/registroAlgoritmos.js";
import { GestorEntornos } from "../entorno/gestorEntornos.js";
import { RecolectorMetricas } from "../entrenamiento/metricas.js";
import { SistemaTrazas } from "../nucleo/trazas.js";
import { Orquestador } from "../entrenamiento/orquestador.js";

// Hiperparámetros barribles por algoritmo: los dos o tres más influyentes, con
// un trío de valores candidatos sensato (el de en medio suele ser el de defecto).
const SWEEP = {
  dqn: [
    { clave: "tasaAprendizaje", etiqueta: "Ritmo de aprendizaje", valores: [0.0003, 0.0008, 0.0015] },
    { clave: "gamma", etiqueta: "Descuento γ (cuánto pesa el futuro)", valores: [0.97, 0.99, 0.995] },
    { clave: "tau", etiqueta: "Soft update τ (red objetivo)", valores: [0.005, 0.01, 0.02] },
  ],
  ppo: [
    { clave: "tasaAprendizaje", etiqueta: "Ritmo de aprendizaje", valores: [0.0003, 0.0006, 0.0012] },
    { clave: "epsilonClip", etiqueta: "Recorte ε (el freno del clip)", valores: [0.1, 0.2, 0.3] },
    { clave: "coefEntropia", etiqueta: "Coef. de entropía (exploración)", valores: [0.005, 0.01, 0.02] },
  ],
  sac: [
    { clave: "tasaAprendizajeActor", etiqueta: "Ritmo del actor", valores: [0.0003, 0.0006, 0.0012] },
    { clave: "factorEntropiaObjetivo", etiqueta: "Entropía objetivo (variedad)", valores: [0.4, 0.55, 0.7] },
    { clave: "tau", etiqueta: "Soft update τ", valores: [0.005, 0.01, 0.02] },
  ],
  worldModel: [
    { clave: "tasaAprendizaje", etiqueta: "Ritmo de aprendizaje", valores: [0.0003, 0.0008, 0.0015] },
    { clave: "pasosPlanning", etiqueta: "Pasos de planning (imaginación)", valores: [3, 5, 8] },
    { clave: "gamma", etiqueta: "Descuento γ", valores: [0.97, 0.99, 0.995] },
  ],
};

const PASOS_DEFECTO = 8000;
const ENVS_DEFECTO = 64;

export class GridSearch {
  constructor({ obtenerAlgoritmo: getAlgo, pausar, reanudar, estaCorriendo, aplicar }) {
    this._getAlgo = getAlgo;
    this._pausar = pausar;
    this._reanudar = reanudar;
    this._estaCorriendo = estaCorriendo;
    this._aplicar = aplicar;

    this.corriendo = false;
    this._cancelar = false;
    this._wasRunning = false;
    this._resultados = [];
    this._mejor = null;

    this._construirDOM();
  }

  // --- Construcción del modal ------------------------------------------------

  _construirDOM() {
    const overlay = document.createElement("div");
    overlay.className = "gs-overlay";
    overlay.innerHTML = `
      <div class="gs-modal" role="dialog" aria-modal="true">
        <button class="gs-cerrar" aria-label="Cerrar">✕</button>
        <div class="gs-cab">
          <span class="gs-emoji">🔬</span>
          <div>
            <span class="gs-chip">Búsqueda de hiperparámetros</span>
            <h2 class="gs-titulo">Grid search en vivo</h2>
          </div>
        </div>

        <div class="gs-config">
          <div class="gs-algo">Algoritmo: <b class="gs-algo-nombre">—</b>
            <span class="gs-nota">(el seleccionado en el laboratorio)</span></div>

          <div class="gs-ejes">
            <div class="gs-eje">
              <label class="gs-eje-tit">Parámetro A</label>
              <select class="gs-selA"></select>
              <div class="gs-vals gs-valsA"></div>
            </div>
            <div class="gs-eje">
              <label class="gs-eje-tit">Parámetro B</label>
              <select class="gs-selB"></select>
              <div class="gs-vals gs-valsB"></div>
            </div>
          </div>

          <div class="gs-run-opts">
            <label>Pasos por combinación
              <input type="number" class="gs-pasos" min="1000" max="60000" step="1000" value="${PASOS_DEFECTO}" />
            </label>
            <label>Entornos por combinación
              <input type="number" class="gs-envs" min="16" max="256" step="16" value="${ENVS_DEFECTO}" />
            </label>
          </div>

          <div class="gs-acciones">
            <button class="gs-correr btn primario">▶ Buscar la mejor</button>
            <button class="gs-cancelar btn fantasma" hidden>■ Cancelar</button>
            <span class="gs-estado"></span>
          </div>
        </div>

        <div class="gs-progreso" hidden>
          <div class="gs-barra-global"><div class="gs-barra-rel"></div></div>
          <div class="gs-progreso-txt"></div>
        </div>

        <div class="gs-resultados" hidden>
          <table class="gs-tabla">
            <thead><tr class="gs-cabecera"></tr></thead>
            <tbody class="gs-cuerpo"></tbody>
          </table>
        </div>

        <div class="gs-mejor" hidden></div>

        <div class="gs-explica">
          <h3>¿Qué es esto y por qué?</h3>
          <p>Casi todo en aprendizaje por refuerzo depende de unos pocos <b>ajustes</b> (hiperparámetros): el ritmo
            de aprendizaje, cuánto pesa el futuro… Elegirlos a ojo es arriesgado. La <b>búsqueda en rejilla</b>
            (<i>grid search</i>) prueba <b>todas las combinaciones</b> de unos valores candidatos, entrena un agente
            con cada una y se queda con la que mejor recompensa logra.</p>
          <p>Cada combinación entrena de verdad, en su propio juego, sin tocar tu entrenamiento principal. La tabla se
            ordena sola: arriba, la mejor de momento. Al terminar puedes <b>aplicar la ganadora</b> al laboratorio.</p>
          <p class="gs-aviso">⚠ Ojo: cada celda es <b>una sola corrida corta</b>, y el RL es ruidoso. Léelo como una
            <b>tendencia</b>, no como una verdad exacta: con más pasos, más fiable (y más lento).</p>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    this.overlay = overlay;
    const $ = (s) => overlay.querySelector(s);
    this.el = {
      modal: $(".gs-modal"),
      algoNombre: $(".gs-algo-nombre"),
      selA: $(".gs-selA"),
      selB: $(".gs-selB"),
      valsA: $(".gs-valsA"),
      valsB: $(".gs-valsB"),
      pasos: $(".gs-pasos"),
      envs: $(".gs-envs"),
      correr: $(".gs-correr"),
      cancelar: $(".gs-cancelar"),
      estado: $(".gs-estado"),
      progreso: $(".gs-progreso"),
      barraRel: $(".gs-barra-rel"),
      progresoTxt: $(".gs-progreso-txt"),
      resultados: $(".gs-resultados"),
      cabecera: $(".gs-cabecera"),
      cuerpo: $(".gs-cuerpo"),
      mejor: $(".gs-mejor"),
    };

    // Eventos.
    $(".gs-cerrar").addEventListener("click", () => this.cerrar());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) this.cerrar(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.overlay.classList.contains("abierto")) this.cerrar();
    });
    this.el.selA.addEventListener("change", () => this._sincronizarEjes("A"));
    this.el.selB.addEventListener("change", () => this._sincronizarEjes("B"));
    this.el.correr.addEventListener("click", () => this._ejecutar());
    this.el.cancelar.addEventListener("click", () => { this._cancelar = true; });
    // Refrescar la estimación al tocar pasos, entornos o los valores candidatos.
    this.el.pasos.addEventListener("input", () => this._actualizarEstimacion());
    this.el.envs.addEventListener("input", () => this._actualizarEstimacion());
    this.overlay.addEventListener("input", (e) => {
      if (e.target.classList.contains("gs-val")) this._actualizarEstimacion();
    });
  }

  // --- Apertura / cierre ------------------------------------------------------

  abrir() {
    if (this.corriendo) { this.overlay.classList.add("abierto"); return; }
    const algo = this._getAlgo();
    this._algoActual = algo;
    this.el.algoNombre.textContent = obtenerAlgoritmo(algo).nombre;
    this._poblarSelectores(algo);
    this._resetVista();
    this.overlay.classList.add("abierto");
    this.el.modal.scrollTop = 0;
  }

  cerrar() {
    if (this.corriendo) { this._cancelar = true; } // pide parar; el bucle cerrará al ceder
    this.overlay.classList.remove("abierto");
    // Si pausamos el entrenamiento principal para buscar y no se aplicó nada,
    // restauramos el estado en que estaba.
    if (this._pausadoPorNosotros && this._wasRunning) this._reanudar();
    this._pausadoPorNosotros = false;
  }

  _resetVista() {
    this._resultados = [];
    this._mejor = null;
    this.el.resultados.hidden = true;
    this.el.progreso.hidden = true;
    this.el.mejor.hidden = true;
    this.el.estado.textContent = "";
    this.el.cuerpo.innerHTML = "";
    this._actualizarEstimacion();
  }

  // --- Selectores de ejes -----------------------------------------------------

  _poblarSelectores(algo) {
    const params = SWEEP[algo] || [];
    const opciones = (sel, incluyeNinguno, seleccion) => {
      sel.innerHTML = "";
      if (incluyeNinguno) sel.appendChild(new Option("(ninguno — barrido 1D)", "__none__"));
      for (const p of params) sel.appendChild(new Option(p.etiqueta, p.clave));
      sel.value = seleccion;
    };
    opciones(this.el.selA, false, params[0]?.clave);
    opciones(this.el.selB, true, params[1]?.clave ?? "__none__");
    this._renderValores("A");
    this._renderValores("B");
  }

  _paramDe(algo, clave) {
    return (SWEEP[algo] || []).find((p) => p.clave === clave);
  }

  _renderValores(eje) {
    const sel = eje === "A" ? this.el.selA : this.el.selB;
    const cont = eje === "A" ? this.el.valsA : this.el.valsB;
    cont.innerHTML = "";
    if (sel.value === "__none__") { cont.innerHTML = `<span class="gs-vacio">sin segundo eje</span>`; return; }
    const p = this._paramDe(this._algoActual, sel.value);
    if (!p) return;
    for (const v of p.valores) {
      const inp = document.createElement("input");
      inp.type = "number";
      inp.className = "gs-val";
      inp.step = v < 1 ? "0.0001" : "1";
      inp.value = v;
      cont.appendChild(inp);
    }
  }

  // Evita repetir el mismo parámetro en ambos ejes y refresca los valores.
  _sincronizarEjes(cambiado) {
    if (cambiado === "A" && this.el.selB.value === this.el.selA.value) {
      const otro = (SWEEP[this._algoActual] || []).find((p) => p.clave !== this.el.selA.value);
      this.el.selB.value = otro ? otro.clave : "__none__";
      this._renderValores("B");
    }
    if (cambiado === "B" && this.el.selB.value === this.el.selA.value && this.el.selB.value !== "__none__") {
      const otro = (SWEEP[this._algoActual] || []).find((p) => p.clave !== this.el.selB.value);
      this.el.selA.value = otro ? otro.clave : this.el.selA.value;
      this._renderValores("A");
    }
    this._renderValores(cambiado);
    this._actualizarEstimacion();
  }

  _leerValores(cont) {
    return [...cont.querySelectorAll(".gs-val")]
      .map((i) => parseFloat(i.value))
      .filter((v) => !Number.isNaN(v));
  }

  _combinaciones() {
    const claveA = this.el.selA.value;
    const valsA = this._leerValores(this.el.valsA);
    const usaB = this.el.selB.value !== "__none__";
    const claveB = this.el.selB.value;
    const valsB = usaB ? this._leerValores(this.el.valsB) : [null];
    const combos = [];
    for (const a of valsA) {
      for (const b of valsB) {
        const override = { [claveA]: a };
        if (usaB) override[claveB] = b;
        combos.push({ override, a, b, claveA, claveB, usaB });
      }
    }
    return { combos, claveA, claveB, usaB };
  }

  _actualizarEstimacion() {
    const { combos } = this._combinaciones();
    const pasos = +this.el.pasos.value || PASOS_DEFECTO;
    this.el.estado.textContent = `${combos.length} combinaciones × ${pasos.toLocaleString("es")} pasos`;
  }

  // --- Ejecución --------------------------------------------------------------

  async _ejecutar() {
    if (this.corriendo) return;
    const { combos, claveA, claveB, usaB } = this._combinaciones();
    if (!combos.length) { this.el.estado.textContent = "Pon al menos un valor en el parámetro A."; return; }

    const algo = this._algoActual;
    const pasos = Math.max(1000, +this.el.pasos.value || PASOS_DEFECTO);
    const envs = Math.max(16, Math.min(256, +this.el.envs.value || ENVS_DEFECTO));

    // Pausar el entrenamiento principal mientras buscamos (compartimos GPU).
    this._wasRunning = this._estaCorriendo();
    this._pausar();
    this._pausadoPorNosotros = true;

    this.corriendo = true;
    this._cancelar = false;
    this._resultados = [];
    this._mejor = null;
    this.el.correr.disabled = true;
    this.el.cancelar.hidden = false;
    this.el.mejor.hidden = true;
    this._bloquearConfig(true);

    // Cabecera + filas de la tabla.
    const labA = this._paramDe(algo, claveA)?.etiqueta || claveA;
    const labB = usaB ? this._paramDe(algo, claveB)?.etiqueta || claveB : null;
    this.el.cabecera.innerHTML =
      `<th>#</th><th>${labA}</th>${usaB ? `<th>${labB}</th>` : ""}<th>Progreso</th><th>Recompensa final</th>`;
    this.el.cuerpo.innerHTML = "";
    combos.forEach((c, i) => {
      const tr = document.createElement("tr");
      tr.className = "gs-fila";
      tr.innerHTML =
        `<td>${i + 1}</td><td>${fmt(c.a)}</td>${usaB ? `<td>${fmt(c.b)}</td>` : ""}` +
        `<td class="gs-fila-prog"><div class="gs-mini"><div class="gs-mini-rel"></div></div></td>` +
        `<td class="gs-fila-rew">en cola</td>`;
      c._tr = tr;
      this.el.cuerpo.appendChild(tr);
    });
    this.el.resultados.hidden = false;
    this.el.progreso.hidden = false;

    // Recorrer las combinaciones, una a una.
    for (let i = 0; i < combos.length; i++) {
      if (this._cancelar) break;
      const c = combos[i];
      c._tr.classList.add("activa");
      c._tr.querySelector(".gs-fila-rew").textContent = "entrenando…";

      const res = await this._correrCombo(algo, c.override, pasos, envs, (frac, rew) => {
        c._tr.querySelector(".gs-mini-rel").style.width = `${(frac * 100).toFixed(0)}%`;
        if (rew != null) c._tr.querySelector(".gs-fila-rew").textContent = rew.toFixed(3);
      });

      c._tr.classList.remove("activa");
      c.rFinal = res.rFinal;
      c.rInicial = res.rInicial;
      c.exito = res.exito;
      this._resultados.push(c);
      c._tr.querySelector(".gs-mini-rel").style.width = "100%";
      c._tr.querySelector(".gs-fila-rew").innerHTML =
        res.rFinal == null ? "—" : `<b>${res.rFinal.toFixed(3)}</b>`;

      this._reordenarYResaltar();
      const hechas = i + 1;
      this.el.barraRel.style.width = `${((hechas / combos.length) * 100).toFixed(0)}%`;
      this.el.progresoTxt.textContent =
        `${hechas}/${combos.length} combinaciones` + (this._cancelar ? " (cancelando…)" : "");
      await pausaUI();
    }

    this.corriendo = false;
    this.el.cancelar.hidden = true;
    this.el.correr.disabled = false;
    this._bloquearConfig(false);

    if (this._cancelar) {
      this.el.progresoTxt.textContent += " — cancelado";
    }
    this._mostrarMejor(usaB, claveA, claveB, algo);
  }

  /** Entrena un agente aislado con un override y devuelve sus métricas. */
  async _correrCombo(algo, override, pasos, envs, onProgreso) {
    const gestor = new GestorEntornos({ numHeadless: envs, numVisuales: 0, shaping: true });
    const agente = crearAgente(algo, override);
    const metricas = new RecolectorMetricas();
    const trazas = new SistemaTrazas();
    const orq = new Orquestador({ gestor, agente, metricas, trazas, idAlgoritmo: algo, silencioso: true });

    const rewards = [];
    let ultimaMuestra = 0;
    orq.arrancar();
    try {
      while (orq.pasoGlobal < pasos && !this._cancelar) {
        await orq.ejecutarLote();
        if (orq.pasoGlobal - ultimaMuestra >= 512) {
          ultimaMuestra = orq.pasoGlobal;
          const inst = metricas.obtenerInstantanea();
          if (inst.rewardMedio100 != null) rewards.push(inst.rewardMedio100);
          onProgreso(orq.pasoGlobal / pasos, inst.rewardMedio100);
          await pausaUI(); // ceder el hilo: la UI respira y pinta el progreso
        }
      }
    } finally {
      orq.pausar();
    }

    const inst = metricas.obtenerInstantanea();
    if (inst.rewardMedio100 != null) rewards.push(inst.rewardMedio100);

    // Resumen tipo entrenar.mjs: media del primer 15% vs el último 15%.
    const primerNoCero = rewards.findIndex((v) => v !== 0);
    const r = primerNoCero > 0 ? rewards.slice(primerNoCero) : rewards;
    const corte = Math.max(1, Math.floor(r.length * 0.15));
    const media = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
    const rFinal = media(r.slice(-corte));
    const rInicial = media(r.slice(0, corte));

    agente.destruir();
    return { rFinal, rInicial, exito: inst.tasaExito100 ?? 0 };
  }

  // --- Resultados -------------------------------------------------------------

  _reordenarYResaltar() {
    const filas = [...this.el.cuerpo.querySelectorAll(".gs-fila")];
    const conRes = this._resultados.slice().sort((x, y) => (y.rFinal ?? -1e9) - (x.rFinal ?? -1e9));
    // Reordenar el DOM: primero las ya resueltas (mejor arriba), luego el resto en orden.
    const resueltas = new Set(conRes.map((c) => c._tr));
    for (const c of conRes) this.el.cuerpo.appendChild(c._tr);
    for (const tr of filas) if (!resueltas.has(tr)) this.el.cuerpo.appendChild(tr);
    // Resaltar la mejor.
    filas.forEach((tr) => tr.classList.remove("mejor-fila"));
    if (conRes[0] && conRes[0].rFinal != null) conRes[0]._tr.classList.add("mejor-fila");
    this._mejor = conRes[0] && conRes[0].rFinal != null ? conRes[0] : null;
  }

  _mostrarMejor(usaB, claveA, claveB, algo) {
    if (!this._mejor) { this.el.mejor.hidden = true; return; }
    const m = this._mejor;
    const labA = this._paramDe(algo, claveA)?.etiqueta || claveA;
    const labB = usaB ? this._paramDe(algo, claveB)?.etiqueta || claveB : null;
    const detalle = `${labA} = <b>${fmt(m.a)}</b>` + (usaB ? ` · ${labB} = <b>${fmt(m.b)}</b>` : "");
    this.el.mejor.hidden = false;
    this.el.mejor.innerHTML = `
      <div class="gs-mejor-cab">🏆 Mejor combinación</div>
      <div class="gs-mejor-det">${detalle} → recompensa final <b>${m.rFinal.toFixed(3)}</b></div>
      <button class="gs-aplicar btn primario">✓ Aplicar al laboratorio</button>
      <div class="gs-aplicar-nota">Recreará el agente con estos valores y, si estabas entrenando, seguirá.</div>`;
    this.el.mejor.querySelector(".gs-aplicar").addEventListener("click", () => this._aplicarMejor());
  }

  _aplicarMejor() {
    if (!this._mejor) return;
    this._pausadoPorNosotros = false; // aplicar gestiona la reanudación
    this._aplicar(this._mejor.override, this._wasRunning);
    this.overlay.classList.remove("abierto");
  }

  _bloquearConfig(bloq) {
    [this.el.selA, this.el.selB, this.el.pasos, this.el.envs,
     ...this.overlay.querySelectorAll(".gs-val")].forEach((e) => (e.disabled = bloq));
  }
}

function fmt(v) {
  return v == null ? "—" : String(v);
}

// Cede el hilo al navegador para que pinte (un macrotask, no solo microtask).
function pausaUI() {
  return new Promise((r) => setTimeout(r, 0));
}
