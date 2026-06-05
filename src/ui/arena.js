// ============================================================================
//  Arena (pestaña "🎮 Jugar")
//  Pone a los modelos ENTRENADOS del zoo a jugar en modo greedy sobre niveles
//  NO VISTOS (split test del mismo pool del manifiesto), a una velocidad que el
//  usuario controla (cámara lenta ↔ rápida, sin tocar la física) y con un
//  marcador que cuenta los niveles superados. Dos modos: un modelo grande, o los
//  cinco en paralelo. Cada modelo se carga una vez (IndexedDB → asset) y se puede
//  REGENERAR in-app (entrena en el navegador y guarda en IndexedDB).
// ============================================================================

import { dibujarEntorno } from "./renderizador.js";
import { EntornoArkanoid } from "../entorno/entornoArkanoid.js";
import { generarPool, dividirSplits } from "../entorno/generadorNiveles.js";
import { cargarManifiesto, overridesGuardados, cargarModelo, regenerarModelo, borrarOverride } from "./cargadorZoo.js";

const VELOCIDADES = [0.25, 0.5, 1, 2, 4, 8];
const HOLD_MS = 650; // pausa al terminar una partida (deja ver el motivo)

// Manifiesto de respaldo si el zoo no se ha generado: permite usar la pestaña
// (regenerando in-app) aunque no existan los assets todavía.
const MODELOS_DEFECTO = [
  { id: "dqn", nombre: "DQN", color: "#2563eb", familia: "model-free · valor" },
  { id: "ppo", nombre: "PPO", color: "#7c3aed", familia: "model-free · actor-crítico" },
  { id: "sac", nombre: "SAC", color: "#db2777", familia: "model-free · actor-crítico" },
  { id: "worldModel", nombre: "World Model", color: "#0891b2", familia: "model-based · Dyna-Q" },
  { id: "worldModelRecurrente", nombre: "World Model RNN", color: "#0c9f6e", familia: "model-based · LSTM" },
];

export class Arena {
  constructor({ contenedor }) {
    this.cont = contenedor;
    this.manifiesto = null;
    this.modelos = [];
    this.overrides = new Set();
    this.reproductores = new Map(); // id → { reproductor, fuente }
    this.pistas = [];               // pistas activas (una por canvas en juego)
    this.modo = "uno";              // "uno" | "todos"
    this.idSeleccionado = null;
    this.velocidad = 1;
    this.corriendo = true;
    this._activa = false;           // pestaña visible
    this._iniciada = false;
    this._acum = 0;
    this._raf = 0;
    this._ultMarcador = 0;
    this._provTest = null;
    this._regenerando = false;
  }

  // --- Ciclo de vida (lo llama la app al entrar/salir de la pestaña) ----------

  async activar() {
    this._activa = true;
    if (!this._iniciada) {
      this._iniciada = true;
      await this._inicializar();
    }
    this._arrancarBucle();
  }

  desactivar() {
    this._activa = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
  }

  // --- Inicialización ---------------------------------------------------------

  async _inicializar() {
    this.cont.innerHTML = `<section class="panel"><div class="arena-cargando">Cargando modelos…</div></section>`;
    this.manifiesto = await cargarManifiesto();
    this.overrides = await overridesGuardados();
    this.modelos = this.manifiesto?.modelos?.length ? this.manifiesto.modelos : MODELOS_DEFECTO;
    this.idSeleccionado = this.modelos[0]?.id ?? null;
    this._provTest = this._construirProveedorTest();
    this._construirUI();
    await this._montarZona();
  }

  /** Proveedor de niveles de TEST (no vistos) reproducible desde el manifiesto. */
  _construirProveedorTest() {
    const nv = this.manifiesto?.niveles;
    if (!nv) return null; // sin manifiesto → rejilla llena
    const pool = generarPool({ semilla: nv.semillaPool ?? 12345, n: nv.n ?? 400 });
    const { test } = dividirSplits(pool, nv.split ?? { train: 0.7, val: 0.15 }, nv.semillaSplit ?? 999);
    const masks = test.map((x) => x.mask);
    return () => masks[(Math.random() * masks.length) | 0];
  }

  // --- UI ---------------------------------------------------------------------

  _construirUI() {
    const sinZoo = !this.manifiesto;
    const pasos = this.manifiesto?.pasos;
    this.cont.innerHTML = `
      <section class="panel arena-cab">
        <div class="seccion-titulo">🎮 Jugar — ver a los modelos entrenados pasar niveles
          <span class="info" data-info="arenaJugar">i</span></div>
        <p class="arena-intro">Los modelos del zoo (entrenados a fondo <b>offline</b>, conv) juegan en modo
          <b>greedy</b> sobre <b>niveles que no vieron</b> en entrenamiento. Ajusta la velocidad para verlo a
          cámara lenta o rápida (no cambia la física, solo cuántos pasos por segundo). El marcador cuenta los
          niveles superados.</p>
        ${sinZoo ? `<div class="arena-aviso">⚠️ No hay modelos generados todavía. Ejecuta <code>npm run zoo</code>
          en la terminal para entrenarlos y persistirlos, o pulsa <b>Regenerar</b> en un modelo para entrenarlo
          aquí mismo (se guarda en tu navegador).</div>` : `<div class="arena-meta">Zoo: ${this.modelos.length}
          modelos · ${pasos?.toLocaleString("es")} pasos · conv 8×10 · eval en test no visto</div>`}

        <div class="arena-controles">
          <div class="arena-modo">
            <button class="btn fantasma am-modo ${this.modo === "uno" ? "activo" : ""}" data-modo="uno">▢ Un modelo</button>
            <button class="btn fantasma am-modo ${this.modo === "todos" ? "activo" : ""}" data-modo="todos">▦ Los ${this.modelos.length} en paralelo</button>
          </div>
          <div class="arena-velocidad">
            <span class="av-et">Velocidad <span class="info" data-info="arenaVelocidad">i</span></span>
            <div class="av-botones">
              ${VELOCIDADES.map((v) => `<button class="btn-vel ${v === this.velocidad ? "activo" : ""}" data-vel="${v}">${v}×</button>`).join("")}
            </div>
          </div>
          <div class="arena-acciones">
            <button class="btn fantasma" id="arenaPausa">${this.corriendo ? "⏸ Pausar" : "▶ Reanudar"}</button>
            <button class="btn fantasma" id="arenaReiniciar">↻ Reiniciar marcador</button>
          </div>
        </div>
      </section>

      <div class="arena-zona" id="arenaZona"></div>`;

    this.zona = this.cont.querySelector("#arenaZona");

    this.cont.querySelectorAll(".am-modo").forEach((b) =>
      b.addEventListener("click", () => this._cambiarModo(b.dataset.modo)));
    this.cont.querySelectorAll(".btn-vel").forEach((b) =>
      b.addEventListener("click", () => this._setVelocidad(+b.dataset.vel)));
    this.cont.querySelector("#arenaPausa").addEventListener("click", () => this._alternarPausa());
    this.cont.querySelector("#arenaReiniciar").addEventListener("click", () => this._reiniciarMarcadores());
  }

  _setVelocidad(v) {
    this.velocidad = v;
    this.cont.querySelectorAll(".btn-vel").forEach((b) =>
      b.classList.toggle("activo", +b.dataset.vel === v));
  }

  _alternarPausa() {
    this.corriendo = !this.corriendo;
    const btn = this.cont.querySelector("#arenaPausa");
    if (btn) btn.textContent = this.corriendo ? "⏸ Pausar" : "▶ Reanudar";
  }

  async _cambiarModo(modo) {
    if (modo === this.modo || this._regenerando) return;
    this.modo = modo;
    this.cont.querySelectorAll(".am-modo").forEach((b) =>
      b.classList.toggle("activo", b.dataset.modo === modo));
    await this._montarZona();
  }

  async _seleccionar(id) {
    if (id === this.idSeleccionado || this._regenerando) return;
    this.idSeleccionado = id;
    await this._montarZona();
  }

  // --- Montaje de la zona de juego según el modo ------------------------------

  async _montarZona() {
    // Soltar entornos de las pistas anteriores (los reproductores quedan en caché).
    this.pistas = [];
    const ids = this.modo === "uno" ? [this.idSeleccionado] : this.modelos.map((m) => m.id);

    if (this.modo === "uno") {
      this.zona.innerHTML = `
        <div class="arena-uno">
          <div class="arena-selector" id="arenaSelector"></div>
          <div class="arena-juego-grande">
            <div class="arena-canvas-cont"><canvas id="arenaCanvasGrande" width="360" height="500"></canvas></div>
            <div class="arena-lateral" id="arenaLateral"></div>
          </div>
        </div>`;
      this._construirSelector();
    } else {
      this.zona.innerHTML = `<div class="arena-rejilla" id="arenaRejilla"></div>`;
      const rej = this.zona.querySelector("#arenaRejilla");
      rej.innerHTML = this.modelos.map((m) => `
        <div class="arena-tarjeta" data-id="${m.id}">
          <div class="at-cab"><span class="at-pt" style="background:${m.color}"></span>${m.nombre}
            <span class="at-fuente" data-fuente="${m.id}"></span></div>
          <div class="arena-canvas-cont mini"><canvas data-canvas="${m.id}" width="200" height="280"></canvas></div>
          <div class="at-stats" data-stats="${m.id}">cargando…</div>
        </div>`).join("");
    }

    // Crear las pistas (cargar reproductores en paralelo).
    await Promise.all(ids.filter(Boolean).map((id) => this._crearPista(id)));
    this._render();
    this._refrescarMarcadores(true);
  }

  _construirSelector() {
    const sel = this.cont.querySelector("#arenaSelector");
    if (!sel) return;
    sel.innerHTML = this.modelos.map((m) => {
      const exito = m.evalExito != null ? ` · éxito ${(m.evalExito * 100).toFixed(0)}%` : "";
      const ov = this.overrides.has(m.id) ? `<span class="chip-ov">local</span>` : "";
      return `<button class="arena-chip ${m.id === this.idSeleccionado ? "activo" : ""}" data-id="${m.id}">
        <span class="ac-pt" style="background:${m.color}"></span>${m.nombre}${ov}
        <span class="ac-met">${m.familia || ""}${exito}</span></button>`;
    }).join("");
    sel.querySelectorAll(".arena-chip").forEach((b) =>
      b.addEventListener("click", () => this._seleccionar(b.dataset.id)));
  }

  async _crearPista(id) {
    const meta = this.modelos.find((m) => m.id === id) || { id };
    let cargado = this.reproductores.get(id);
    if (!cargado) {
      try {
        cargado = await cargarModelo(id, this.manifiesto || {});
        this.reproductores.set(id, cargado);
      } catch (e) {
        console.error(`[arena] no se pudo cargar ${id}:`, e?.message ?? e);
        this._marcarError(id);
        return;
      }
    }
    const canvas = this.modo === "uno"
      ? this.cont.querySelector("#arenaCanvasGrande")
      : this.zona.querySelector(`canvas[data-canvas="${id}"]`);
    if (!canvas) return;

    const env = new EntornoArkanoid(70000 + this.pistas.length, {
      incluirLadrillos: this.manifiesto?.incluirLadrillos ?? true,
      escalaLadrillos: this.manifiesto?.escalaLadrillos ?? 1.0,
      proveedorNivel: this._provTest,
      shaping: false,
    });
    const pista = {
      id, meta, color: meta.color, nombre: meta.nombre || id,
      reproductor: cargado.reproductor, fuente: cargado.fuente,
      env, canvas, ctx: canvas.getContext("2d"),
      _contado: false, _holdHasta: 0,
      marcador: this._marcadorVacio(),
    };
    this.pistas.push(pista);

    if (this.modo === "uno") this._construirLateral(pista);
    else {
      const f = this.zona.querySelector(`[data-fuente="${id}"]`);
      if (f) f.textContent = cargado.fuente === "regenerado" ? "local" : "";
    }
  }

  _marcadorVacio() {
    return { partidas: 0, ganadas: 0, perdidas: 0, timeouts: 0, racha: 0, mejorRacha: 0, mejorLadrillos: 0 };
  }

  _marcarError(id) {
    const stats = this.zona.querySelector(`[data-stats="${id}"]`);
    if (stats) stats.textContent = "⚠️ no disponible (genera el zoo)";
    const lat = this.cont.querySelector("#arenaLateral");
    if (lat && this.modo === "uno") lat.innerHTML = `<div class="arena-aviso">⚠️ Modelo no disponible.
      Ejecuta <code>npm run zoo</code> o pulsa Regenerar.</div>${this._botonRegenerarHTML(id)}`;
    this._enlazarRegenerar(id);
  }

  // --- Panel lateral (modo uno): marcador + regenerar -------------------------

  _construirLateral(pista) {
    const lat = this.cont.querySelector("#arenaLateral");
    if (!lat) return;
    const m = pista.meta;
    const fuente = pista.fuente === "regenerado"
      ? `local (regenerado)` : `oficial${m.pasos ? ` · ${m.pasos.toLocaleString("es")} pasos` : ""}`;
    const evalTxt = m.evalExito != null
      ? `<div class="al-eval">En test: éxito <b>${(m.evalExito * 100).toFixed(0)}%</b> · ladrillos <b>${(m.evalLadrillos * 100).toFixed(0)}%</b></div>` : "";
    lat.innerHTML = `
      <div class="al-cab"><span class="al-pt" style="background:${pista.color}"></span><b>${pista.nombre}</b>
        <span class="al-fuente">${fuente}</span></div>
      ${evalTxt}
      <div class="arena-marcador" id="arenaMarcador"></div>
      ${this._botonRegenerarHTML(pista.id)}`;
    this._enlazarRegenerar(pista.id);
  }

  _botonRegenerarHTML(id) {
    return `<div class="arena-regen" id="arenaRegen">
      <button class="btn fantasma" id="btnRegen" data-id="${id}">♻ Regenerar (entrena en el navegador)</button>
      <div class="regen-prog" id="regenProg" hidden>
        <div class="regen-barra"><div class="regen-rel" id="regenRel"></div></div>
        <div class="regen-txt" id="regenTxt"></div>
        <button class="btn fantasma" id="btnRegenCancelar">■ Cancelar</button>
      </div>
      ${this.overrides.has(id) ? `<button class="btn-link" id="btnRegenBorrar" data-id="${id}">usar el oficial</button>` : ""}
    </div>`;
  }

  _enlazarRegenerar(id) {
    const btn = this.cont.querySelector("#btnRegen");
    if (btn) btn.addEventListener("click", () => this._regenerar(id));
    const borrar = this.cont.querySelector("#btnRegenBorrar");
    if (borrar) borrar.addEventListener("click", () => this._borrarOverride(id));
  }

  async _regenerar(id) {
    if (this._regenerando) return;
    this._regenerando = true;
    let cancelar = false;
    const prog = this.cont.querySelector("#regenProg");
    const rel = this.cont.querySelector("#regenRel");
    const txt = this.cont.querySelector("#regenTxt");
    const btn = this.cont.querySelector("#btnRegen");
    const cancelBtn = this.cont.querySelector("#btnRegenCancelar");
    if (btn) btn.disabled = true;
    if (prog) prog.hidden = false;
    if (cancelBtn) cancelBtn.onclick = () => { cancelar = true; };

    try {
      const nuevo = await regenerarModelo(
        id, this.manifiesto || {}, { pasos: 40000, envs: 64, señalCancelar: () => cancelar },
        (frac, t) => {
          if (rel) rel.style.width = `${Math.min(100, frac * 100).toFixed(0)}%`;
          if (txt) txt.textContent = t;
        }
      );
      // Reemplazar el reproductor en caché y recrear la(s) pista(s).
      const viejo = this.reproductores.get(id);
      if (viejo && viejo.reproductor !== nuevo.reproductor) viejo.reproductor.destruir();
      this.reproductores.set(id, nuevo);
      this.overrides.add(id);
    } catch (e) {
      console.error("[arena] regenerar falló:", e?.message ?? e);
      if (txt) txt.textContent = "error: " + (e?.message ?? e);
    } finally {
      this._regenerando = false;
      if (btn) btn.disabled = false;
      if (prog) prog.hidden = true;
      await this._montarZona(); // refresca pistas y badges con el nuevo modelo
    }
  }

  async _borrarOverride(id) {
    await borrarOverride(id);
    this.overrides.delete(id);
    const viejo = this.reproductores.get(id);
    if (viejo) { viejo.reproductor.destruir(); this.reproductores.delete(id); }
    await this._montarZona();
  }

  // --- Bucle de animación -----------------------------------------------------

  _arrancarBucle() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._acum = 0;
    this._tick();
  }

  _tick = () => {
    if (!this._activa) return;
    const ahora = performance.now();
    if (this.corriendo && !this._regenerando && this.pistas.length) {
      // Acumulador fraccional: v≥1 → v pasos por frame (rápido); v<1 → 1 paso
      // cada 1/v frames (cámara lenta). Nunca cambia la física, solo el ritmo.
      this._acum += this.velocidad;
      let pasos = Math.floor(this._acum);
      this._acum -= pasos;
      pasos = Math.min(pasos, 12);
      if (pasos > 0) this._avanzar(pasos);
      this._gestionarHold(ahora);
    }
    this._render();
    if (ahora - this._ultMarcador > 120) {
      this._ultMarcador = ahora;
      this._refrescarMarcadores();
    }
    this._raf = requestAnimationFrame(this._tick);
  };

  _avanzar(pasos) {
    for (const p of this.pistas) {
      for (let s = 0; s < pasos; s++) {
        if (p.env.estaTerminado()) break;
        const acc = p.reproductor.seleccionarAcciones(p.env.obtenerVectorEstado(), 1);
        p.env.paso(acc[0]);
      }
    }
  }

  _gestionarHold(ahora) {
    for (const p of this.pistas) {
      if (!p.env.estaTerminado()) continue;
      if (!p._contado) {
        this._registrarFin(p);
        p._contado = true;
        p._holdHasta = ahora + HOLD_MS;
      } else if (ahora >= p._holdHasta) {
        p.env.reiniciar();
        p._contado = false;
      }
    }
  }

  _registrarFin(p) {
    const m = p.marcador;
    m.partidas++;
    if (p.env.estado === "ganado") { m.ganadas++; m.racha++; m.mejorRacha = Math.max(m.mejorRacha, m.racha); }
    else if (p.env.estado === "timeout") { m.timeouts++; m.racha = 0; }
    else { m.perdidas++; m.racha = 0; }
    m.mejorLadrillos = Math.max(m.mejorLadrillos, p.env.ladrillosRotosEpisodio);
  }

  _render() {
    const mini = this.modo === "todos";
    for (const p of this.pistas) dibujarEntorno(p.ctx, p.env, { mini });
  }

  _refrescarMarcadores(forzar = false) {
    for (const p of this.pistas) {
      const m = p.marcador;
      const pct = p.env.ladrillosIniciales ? (p.env.ladrillosRotosEpisodio / p.env.ladrillosIniciales) * 100 : 0;
      const exito = m.partidas ? (m.ganadas / m.partidas) * 100 : 0;
      if (this.modo === "todos") {
        const stats = this.zona.querySelector(`[data-stats="${p.id}"]`);
        // Tasa de éxito de la sesión (ganadas/partidas): JUSTA entre modelos cuyas
        // partidas duran muy distinto (los que pierden rápido juegan muchas más, así
        // que su conteo absoluto de ✓ engaña). Más el % de ladrillos de la actual.
        if (stats) stats.innerHTML = `<span class="ok">✓ ${m.ganadas}/${m.partidas || 0}</span>
          <span class="suave">(${exito.toFixed(0)}%)</span> · ${pct.toFixed(0)}% ladrillos · racha ${m.racha}`;
      } else {
        const cont = this.cont.querySelector("#arenaMarcador");
        if (!cont) continue;
        cont.innerHTML = `
          ${this._fila("Niveles superados", `<b class="grande">${m.ganadas}</b>`)}
          ${this._fila("Partidas jugadas", m.partidas)}
          ${this._fila("Éxito en la sesión", `${exito.toFixed(0)}%`)}
          ${this._fila("Perdidas / timeout", `${m.perdidas} / ${m.timeouts}`)}
          ${this._fila("Racha actual", m.racha)}
          ${this._fila("Mejor racha", m.mejorRacha)}
          ${this._fila("Ladrillos (partida actual)", `${pct.toFixed(0)}%`)}
          ${this._fila("Mejor limpieza", `${m.mejorLadrillos} ladrillos`)}`;
      }
    }
  }

  _fila(et, val) {
    return `<div class="am-fila"><span>${et}</span><span class="am-val">${val}</span></div>`;
  }
}
