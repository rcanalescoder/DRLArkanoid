// ============================================================================
//  Comparativa de modelos (pestaña de benchmark)
//  Entrena cada algoritmo registrado con el MISMO presupuesto y en condiciones
//  idénticas (aislado, orquestador silencioso → no toca el laboratorio), y al
//  terminar evalúa su política en modo GREEDY (sin exploración) sobre episodios
//  nuevos. Luego pinta un dashboard: curvas de aprendizaje superpuestas, tabla
//  de métricas finales (resaltando la mejor por columna) y un veredicto.
//
//  Por qué greedy: la recompensa DURANTE el entrenamiento mezcla la exploración
//  (DQN explora con ε, SAC con entropía, PPO es estocástico). Para comparar de
//  forma justa hay que medir la política sin ese ruido, sobre partidas nuevas.
// ============================================================================

import { listarAlgoritmos, crearAgente } from "../nucleo/registroAlgoritmos.js";
import { GestorEntornos } from "../entorno/gestorEntornos.js";
import { RecolectorMetricas } from "../entrenamiento/metricas.js";
import { SistemaTrazas } from "../nucleo/trazas.js";
import { Orquestador } from "../entrenamiento/orquestador.js";

const COLORES = {
  dqn: "#2563eb",
  ppo: "#7c3aed",
  sac: "#db2777",
  worldModel: "#0891b2",
  worldModelRecurrente: "#0c9f6e",
};
const UMBRAL_REWARD = 0.5; // para "eficiencia de muestra" (pasos hasta este reward)

export class Comparativa {
  constructor({ contenedor, pausar, reanudar, estaCorriendo }) {
    this.cont = contenedor;
    this._pausar = pausar;
    this._reanudar = reanudar;
    this._estaCorriendo = estaCorriendo;
    this.corriendo = false;
    this._cancelar = false;
    this._resultados = [];
    this._construirUI();
  }

  _construirUI() {
    this.cont.innerHTML = `
      <section class="panel">
        <div class="seccion-titulo">🏁 Comparativa de modelos</div>
        <p class="cmp-intro">Entrena los algoritmos con el <b>mismo presupuesto</b> y en condiciones idénticas, y mide
          su política en modo <b>greedy</b> (sin exploración) sobre partidas nuevas. Así la comparación es justa: la
          recompensa de entrenamiento mezcla la exploración de cada uno y no sirve para enfrentarlos.</p>
        <div class="cmp-config">
          <label>Pasos por modelo<input type="number" id="cmpPasos" min="2000" max="60000" step="1000" value="10000" /></label>
          <label>Entornos<input type="number" id="cmpEnvs" min="16" max="256" step="16" value="64" /></label>
          <label>Episodios de evaluación<input type="number" id="cmpEval" min="10" max="100" step="10" value="30" /></label>
          <button class="btn primario" id="btnCmpLanzar">▶ Lanzar los modelos</button>
          <button class="btn fantasma" id="btnCmpCancelar" hidden>■ Cancelar</button>
        </div>
        <div class="cmp-progreso" id="cmpProgreso" hidden>
          <div class="cmp-barra"><div class="cmp-barra-rel" id="cmpBarraRel"></div></div>
          <div class="cmp-progreso-txt" id="cmpProgresoTxt"></div>
        </div>
      </section>

      <section class="panel" id="cmpDashboard" hidden>
        <div class="seccion-titulo">📊 Resultados</div>
        <div class="cmp-veredicto" id="cmpVeredicto"></div>
        <div class="cmp-grid">
          <div class="cmp-curvas-cont">
            <div class="cmp-sub">Curvas de aprendizaje (recompensa de entrenamiento vs pasos)</div>
            <canvas id="cmpCanvas" width="560" height="280"></canvas>
            <div class="cmp-leyenda" id="cmpLeyenda"></div>
          </div>
          <div class="cmp-tabla-cont">
            <div class="cmp-sub">Evaluación greedy (política final, sin exploración)</div>
            <table class="cmp-tabla" id="cmpTabla"></table>
            <p class="cmp-nota">Cada modelo se entrena una vez (corrida corta y ruidosa): léelo como una
              <b>tendencia</b>. ✓ = mejor de su columna.</p>
          </div>
        </div>
      </section>`;

    const $ = (id) => this.cont.querySelector("#" + id);
    this.el = {
      pasos: $("cmpPasos"), envs: $("cmpEnvs"), eval: $("cmpEval"),
      lanzar: $("btnCmpLanzar"), cancelar: $("btnCmpCancelar"),
      progreso: $("cmpProgreso"), barraRel: $("cmpBarraRel"), progresoTxt: $("cmpProgresoTxt"),
      dashboard: $("cmpDashboard"), veredicto: $("cmpVeredicto"),
      canvas: $("cmpCanvas"), leyenda: $("cmpLeyenda"), tabla: $("cmpTabla"),
    };
    this.el.lanzar.addEventListener("click", () => this._lanzar());
    this.el.cancelar.addEventListener("click", () => { this._cancelar = true; });
  }

  // --- Ejecución --------------------------------------------------------------

  async _lanzar() {
    if (this.corriendo) return;
    const algos = listarAlgoritmos();
    const pasos = Math.max(2000, +this.el.pasos.value || 10000);
    const envs = Math.max(16, Math.min(256, +this.el.envs.value || 64));
    const kEval = Math.max(10, +this.el.eval.value || 30);

    this._wasRunning = this._estaCorriendo();
    this._pausar();

    this.corriendo = true;
    this._cancelar = false;
    this._resultados = [];
    this.el.lanzar.disabled = true;
    this.el.cancelar.hidden = false;
    this.el.dashboard.hidden = true;
    this.el.progreso.hidden = false;
    this._bloquear(true);

    for (let i = 0; i < algos.length; i++) {
      if (this._cancelar) break;
      const def = algos[i];
      this._progreso(i, algos.length, `Entrenando ${def.nombre}…`);
      const res = await this._entrenarYEvaluar(def, pasos, envs, kEval, (frac, fase) => {
        this._progreso(i + frac, algos.length, `${def.nombre}: ${fase}`);
      });
      if (res) this._resultados.push(res);
      this._render(); // dashboard parcial, se va completando
    }

    this.corriendo = false;
    this.el.cancelar.hidden = true;
    this.el.lanzar.disabled = false;
    this._bloquear(false);
    this._progreso(algos.length, algos.length, this._cancelar ? "Cancelado" : "Completado");
    this._render();
    if (this._wasRunning) this._reanudar();
  }

  /** Entrena un algoritmo aislado y devuelve sus métricas + curva + eval greedy. */
  async _entrenarYEvaluar(def, pasos, envs, kEval, onProgreso) {
    const algo = def.id;
    const gestor = new GestorEntornos({ numHeadless: envs, numVisuales: 0, shaping: true });
    const agente = crearAgente(algo);
    const metricas = new RecolectorMetricas();
    const trazas = new SistemaTrazas();
    const orq = new Orquestador({ gestor, agente, metricas, trazas, idAlgoritmo: algo, silencioso: true });

    const curva = [];
    let muestra = 0;
    const t0 = performance.now();
    orq.arrancar();
    try {
      while (orq.pasoGlobal < pasos && !this._cancelar) {
        await orq.ejecutarLote();
        if (orq.pasoGlobal - muestra >= 500) {
          muestra = orq.pasoGlobal;
          const r = metricas.obtenerInstantanea().rewardMedio100;
          curva.push({ paso: orq.pasoGlobal, reward: r });
          onProgreso(orq.pasoGlobal / pasos * 0.9, "entrenando");
          await pausaUI();
        }
      }
    } finally {
      orq.pausar();
    }
    const dt = (performance.now() - t0) / 1000;
    const expS = dt > 0 ? orq.pasoGlobal / dt : 0;

    // Evaluación greedy sobre partidas nuevas.
    onProgreso(0.92, "evaluando (greedy)");
    const evalRes = await this._evaluarGreedy(agente, algo, kEval);

    // Métricas derivadas de la curva.
    const rewards = curva.map((p) => p.reward).filter((v) => v != null);
    const ultimo = rewards.slice(-Math.max(1, Math.floor(rewards.length * 0.25)));
    const estabilidad = desviacion(ultimo);
    const umbral = curva.find((p) => p.reward != null && p.reward >= UMBRAL_REWARD);
    const pasosUmbral = umbral ? umbral.paso : null;

    agente.destruir();
    return {
      id: algo, nombre: def.nombre, color: COLORES[algo] || "#64748b",
      curva, expS, estabilidad, pasosUmbral,
      evalReward: evalRes.reward, evalExito: evalRes.exito, evalLadrillos: evalRes.ladrillos,
    };
  }

  /** Corre la política greedy (sin exploración) hasta juntar K episodios. */
  async _evaluarGreedy(agente, algo, kEpisodios) {
    const n = 16;
    const gestor = new GestorEntornos({ numHeadless: n, numVisuales: 0, shaping: true });
    const recompensas = [], exitos = [], ladrillos = [];
    let pasos = 0;
    const maxPasos = 600 * 8; // tope de seguridad
    while (recompensas.length < kEpisodios && pasos < maxPasos && !this._cancelar) {
      const estados = gestor.obtenerEstadosEntrenamiento();
      const acciones = agente.seleccionarAcciones(estados, n, { entrenar: false }); // greedy
      const resultado = gestor.aplicarAcciones(acciones);
      for (const ep of resultado.episodios) {
        recompensas.push(ep.recompensa);
        exitos.push(ep.ganado ? 1 : 0);
        ladrillos.push(ep.ladrillosRotos);
      }
      pasos++;
      if (pasos % 60 === 0) await pausaUI();
    }
    return {
      reward: media(recompensas),
      exito: media(exitos),
      ladrillos: media(ladrillos),
    };
  }

  // --- Dashboard --------------------------------------------------------------

  _render() {
    if (!this._resultados.length) return;
    this.el.dashboard.hidden = false;
    this._dibujarCurvas();
    this._dibujarLeyenda();
    this._dibujarTabla();
    this._dibujarVeredicto();
  }

  _dibujarCurvas() {
    const cv = this.el.canvas;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth || 560, H = 280;
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const pad = { l: 44, r: 12, t: 12, b: 26 };
    const series = this._resultados.filter((r) => r.curva.some((p) => p.reward != null));
    let maxPaso = 1, minR = Infinity, maxR = -Infinity;
    for (const s of series) for (const p of s.curva) {
      if (p.reward == null) continue;
      maxPaso = Math.max(maxPaso, p.paso);
      minR = Math.min(minR, p.reward); maxR = Math.max(maxR, p.reward);
    }
    if (!isFinite(minR)) { minR = 0; maxR = 1; }
    if (maxR - minR < 0.1) maxR = minR + 0.1;
    const x = (p) => pad.l + (p / maxPaso) * (W - pad.l - pad.r);
    const y = (r) => H - pad.b - ((r - minR) / (maxR - minR)) * (H - pad.t - pad.b);

    // Ejes y rejilla.
    ctx.strokeStyle = "#e2e6ee"; ctx.fillStyle = "#8a909b"; ctx.lineWidth = 1;
    ctx.font = "10px Inter, sans-serif";
    for (let g = 0; g <= 4; g++) {
      const ry = minR + (g / 4) * (maxR - minR);
      const py = y(ry);
      ctx.beginPath(); ctx.moveTo(pad.l, py); ctx.lineTo(W - pad.r, py); ctx.stroke();
      ctx.fillText(ry.toFixed(2), 6, py + 3);
    }
    ctx.fillText("0", pad.l, H - 8);
    ctx.fillText(maxPaso.toLocaleString("es") + " pasos", W - pad.r - 70, H - 8);

    // Series.
    ctx.lineWidth = 2;
    for (const s of series) {
      ctx.strokeStyle = s.color; ctx.beginPath();
      let primero = true;
      for (const p of s.curva) {
        if (p.reward == null) continue;
        const px = x(p.paso), py = y(p.reward);
        if (primero) { ctx.moveTo(px, py); primero = false; } else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }

  _dibujarLeyenda() {
    this.el.leyenda.innerHTML = this._resultados
      .map((r) => `<span class="cmp-leg"><i style="background:${r.color}"></i>${r.nombre}</span>`)
      .join("");
  }

  _dibujarTabla() {
    const cols = [
      { k: "evalReward", t: "Recompensa greedy", fmt: (v) => v.toFixed(3), mayor: true },
      { k: "evalExito", t: "Tasa de éxito", fmt: (v) => (v * 100).toFixed(1) + "%", mayor: true },
      { k: "evalLadrillos", t: "Ladrillos", fmt: (v) => v.toFixed(1), mayor: true },
      { k: "estabilidad", t: "Estabilidad (σ)", fmt: (v) => v.toFixed(3), mayor: false },
      { k: "expS", t: "Exp/s", fmt: (v) => Math.round(v).toLocaleString("es"), mayor: true },
    ];
    // Mejor por columna.
    const mejores = {};
    for (const c of cols) {
      let mejor = null;
      for (const r of this._resultados) {
        const v = r[c.k];
        if (v == null || Number.isNaN(v)) continue;
        if (mejor == null || (c.mayor ? v > mejor : v < mejor)) mejor = v;
      }
      mejores[c.k] = mejor;
    }
    const cab = `<tr><th>Modelo</th>${cols.map((c) => `<th>${c.t}</th>`).join("")}</tr>`;
    const filas = this._resultados.map((r) => {
      const celdas = cols.map((c) => {
        const v = r[c.k];
        const esMejor = v != null && v === mejores[c.k];
        return `<td class="${esMejor ? "cmp-mejor" : ""}">${v == null || Number.isNaN(v) ? "—" : c.fmt(v)}${esMejor ? " ✓" : ""}</td>`;
      }).join("");
      return `<tr><td><span class="cmp-pt" style="background:${r.color}"></span>${r.nombre}</td>${celdas}</tr>`;
    }).join("");
    this.el.tabla.innerHTML = cab + filas;
  }

  _dibujarVeredicto() {
    if (this._resultados.length < 2 && this.corriendo) { this.el.veredicto.innerHTML = ""; return; }
    // Ganador: mayor tasa de éxito; desempate por recompensa greedy.
    const orden = [...this._resultados].sort((a, b) =>
      (b.evalExito - a.evalExito) || (b.evalReward - a.evalReward));
    const g = orden[0];
    if (!g) return;
    const eficiente = [...this._resultados].filter((r) => r.pasosUmbral != null)
      .sort((a, b) => a.pasosUmbral - b.pasosUmbral)[0];
    const estable = [...this._resultados].sort((a, b) => a.estabilidad - b.estabilidad)[0];
    let txt = `🏆 <b>${g.nombre}</b> es el mejor en esta corrida (éxito ${(g.evalExito * 100).toFixed(1)}%, recompensa greedy ${g.evalReward.toFixed(3)}).`;
    if (eficiente) txt += ` El que <b>antes</b> superó ${UMBRAL_REWARD} de recompensa fue <b>${eficiente.nombre}</b> (${eficiente.pasosUmbral.toLocaleString("es")} pasos).`;
    if (estable) txt += ` El más <b>estable</b>: <b>${estable.nombre}</b>.`;
    this.el.veredicto.innerHTML = txt;
  }

  _progreso(hechos, total, txt) {
    this.el.barraRel.style.width = `${Math.min(100, (hechos / total) * 100).toFixed(0)}%`;
    this.el.progresoTxt.textContent = `${txt}  ·  ${Math.min(total, Math.floor(hechos))}/${total} modelos`;
  }

  _bloquear(b) {
    [this.el.pasos, this.el.envs, this.el.eval].forEach((e) => (e.disabled = b));
  }
}

function media(a) {
  if (!a.length) return 0;
  return a.reduce((x, y) => x + y, 0) / a.length;
}
function desviacion(a) {
  if (a.length < 2) return 0;
  const m = media(a);
  return Math.sqrt(media(a.map((v) => (v - m) ** 2)));
}
function pausaUI() {
  return new Promise((r) => setTimeout(r, 0));
}
