// ============================================================================
//  Aplicación — controlador de la UI
//  Crea el gestor de entornos, el agente y el orquestador; conecta los paneles
//  con el bus de eventos; gestiona los controles y el bucle de animación (rAF).
// ============================================================================

import { bus, EVENTOS } from "../nucleo/busEventos.js";
import { ALGORITMOS, POOL } from "../nucleo/constantes.js";
import { listarAlgoritmos, obtenerAlgoritmo, crearAgente } from "../nucleo/registroAlgoritmos.js";
import { fijarLineaBase, estadoMemoria } from "../nucleo/gestorTensores.js";
import { GestorEntornos } from "../entorno/gestorEntornos.js";
import { RecolectorMetricas } from "../entrenamiento/metricas.js";
import { trazas } from "../nucleo/trazas.js";
import { Orquestador } from "../entrenamiento/orquestador.js";

import { dibujarEntorno } from "./renderizador.js";
import { RejillaEntornos } from "./rejillaEntornos.js";
import { PanelMetricas } from "./panelMetricas.js";
import { CurvasEntrenamiento } from "./curvasEntrenamiento.js";
import { PanelTransicion } from "./panelTransicion.js";
import { ResumenConceptual } from "./resumenConceptual.js";
import { GridSearch } from "./gridSearch.js";
import { Comparativa } from "./comparativa.js";
import { Arena } from "./arena.js";

export class Aplicacion {
  constructor() {
    this.idAlgoritmo = ALGORITMOS.DQN;
    this.velocidad = 4;
    this.corriendo = false;
    this.envSeleccionado = 0;
    this.shaping = false; // Φ OFF por defecto (saboteaba el objetivo; ver plan §2)
    this._ultInspeccion = 0;
    this.PRESUPUESTO_MS = 12;   // tope para APILAR lotes ligeros (DQN/PPO/SAC) por frame
    this.OBJETIVO_FRAME_MS = 33; // ~30 fps objetivo: si un lote lo excede, se saltan frames de entrenamiento (solo animación) para que la pantalla siga fluida
    this._deudaFrames = 0;      // nº de frames de "respiro" pendientes (solo animar, sin entrenar) tras un lote pesado (WM/RNN)
    this._loteEnCurso = null;   // promesa del lote en vuelo: se espera antes de destruir el agente (evita carrera al cambiar de modelo)
    this._reconstruyendo = false;
    // Hiperparámetros sobreescritos sobre los de por defecto (los aplica el grid
    // search al "usar la mejor combinación"). Se reinician al cambiar de algoritmo.
    this.hpOverride = {};
    this._q();
  }

  _q() {
    const $ = (id) => document.getElementById(id);
    this.dom = {
      btnEntrenar: $("btnEntrenar"),
      btnPaso: $("btnPaso"),
      btnReiniciar: $("btnReiniciar"),
      badgeBackend: $("badgeBackend"),
      badgeEstado: $("badgeEstado"),
      badgeJugando: $("badgeJugando"),
      canvas: $("canvasJuego"),
      envSeleccionado: $("envSeleccionado"),
      statReward: $("statReward"),
      statLadrillos: $("statLadrillos"),
      statLadrillosTotal: $("statLadrillosTotal"),
      statPasos: $("statPasos"),
      metricasGrid: $("metricasGrid"),
      inspector: $("inspector"),
      chips: $("chipsAlgoritmos"),
      descAlgoritmo: $("descAlgoritmo"),
      rejilla: $("rejillaEntornos"),
      transicion: $("transicion"),
      sliderVelocidad: $("sliderVelocidad"),
      valVelocidad: $("valVelocidad"),
      sliderHeadless: $("sliderHeadless"),
      valHeadless: $("valHeadless"),
      sliderVisuales: $("sliderVisuales"),
      valVisuales: $("valVisuales"),
      toggleShaping: $("toggleShaping"),
      btnGridSearch: $("btnGridSearch"),
      tabs: $("tabsVista"),
      vistaLaboratorio: $("vistaLaboratorio"),
      vistaComparativa: $("vistaComparativa"),
      vistaJugar: $("vistaJugar"),
    };
    this.ctx = this.dom.canvas.getContext("2d");
  }

  iniciar(backend) {
    this.dom.badgeBackend.innerHTML = `<span class="punto"></span>backend: ${backend}`;
    this.dom.badgeBackend.classList.add("ok");

    // Gestor de entornos (pools headless + visual).
    this.gestor = new GestorEntornos({
      numHeadless: POOL.HEADLESS_DEFECTO,
      numVisuales: POOL.VISUALES_DEFECTO,
      shaping: this.shaping,
    });
    this.metricas = new RecolectorMetricas();
    this.trazas = trazas;

    // Paneles.
    this.panelMetricas = new PanelMetricas(this.dom.metricasGrid);
    this.panelTransicion = new PanelTransicion(this.dom.transicion);
    this.curvas = new CurvasEntrenamiento({
      reward: document.getElementById("curvaReward"),
      loss: document.getElementById("curvaLoss"),
      buffer: document.getElementById("curvaBuffer"),
      explora: document.getElementById("curvaExplora"),
      tituloLoss: document.getElementById("tituloCurvaLoss"),
      legLoss: document.getElementById("legLoss"),
      tituloBuffer: document.getElementById("tituloCurvaBuffer"),
      legBuffer: document.getElementById("legBuffer"),
      tituloExplora: document.getElementById("tituloCurvaExplora"),
      legExplora: document.getElementById("legExplora"),
    });
    this.resumen = new ResumenConceptual({
      tablaConceptos: document.getElementById("tablaConceptos"),
      conceptoAlgo: document.getElementById("conceptoAlgo"),
      flujoDatos: document.getElementById("flujoDatos"),
      flujoDescripcion: document.getElementById("flujoDescripcion"),
      variantes: document.getElementById("variantes"),
    });
    this.rejilla = new RejillaEntornos(this.dom.rejilla, (i) => {
      this.envSeleccionado = i;
      this.dom.envSeleccionado.textContent = `env ${i}`;
    });

    this._construirChips();
    this._conectarControles();
    this._suscribirBus();

    this._construirAgente();
    this.rejilla.sincronizar(this.gestor.visuales);
    this.trazas.arrancarImpresionPeriodica();

    // Pop-up de búsqueda de hiperparámetros (grid search en vivo).
    this.gridSearch = new GridSearch({
      obtenerAlgoritmo: () => this.idAlgoritmo,
      pausar: () => this._pausar(),
      reanudar: () => this._reanudar(),
      estaCorriendo: () => this.corriendo,
      aplicar: (override, reanudar) => this.aplicarHiperparametros(override, reanudar),
    });

    // Pestaña de comparativa de modelos (benchmark).
    this.comparativa = new Comparativa({
      contenedor: this.dom.vistaComparativa,
      pausar: () => this._pausar(),
      reanudar: () => this._reanudar(),
      estaCorriendo: () => this.corriendo,
    });

    // Pestaña "Jugar": arena donde los modelos entrenados del zoo juegan en greedy.
    this.arena = new Arena({ contenedor: this.dom.vistaJugar });
    this._conectarPestanas();

    fijarLineaBase();
    this._arrancarBucle();
  }

  // --- Construcción / cambio de algoritmo ------------------------------------

  _construirAgente() {
    const def = obtenerAlgoritmo(this.idAlgoritmo);
    this._deudaFrames = 0; // el coste por lote cambia con el modelo; empezar sin deuda arrastrada
    this.agente = crearAgente(this.idAlgoritmo, this.hpOverride);
    this.orquestador = new Orquestador({
      gestor: this.gestor,
      agente: this.agente,
      metricas: this.metricas,
      trazas: this.trazas,
      idAlgoritmo: this.idAlgoritmo,
    });

    // Inspector específico.
    this.inspector = def.crearInspector ? def.crearInspector(this.dom.inspector) : null;

    // Reconfigurar paneles para el algoritmo.
    this.panelMetricas.configurar(def);
    this.curvas.configurar(this.idAlgoritmo);
    this.resumen.configurar(def);
  }

  async cambiarAlgoritmo(id) {
    if (id === this.idAlgoritmo) return;
    this._pausar();
    this._reconstruyendo = true;
    // Esperar el lote en vuelo: NO destruir el agente a media ejecución (evita ops sobre
    // tensores ya liberados, errores y fugas de tensores por cambio de modelo).
    if (this._loteEnCurso) { try { await this._loteEnCurso; } catch (e) {} }
    const antes = estadoMemoria();
    this.agente?.destruir();
    this.metricas.reiniciar();
    this.panelMetricas.reiniciar();
    this.trazas.limpiar();
    this.gestor.reiniciarTodos();
    this.idAlgoritmo = id;
    this.hpOverride = {}; // los overrides son específicos del algoritmo
    this._construirAgente();
    this._marcarChipActivo();
    fijarLineaBase();
    this._reconstruyendo = false;
    const d = estadoMemoria();
    // Traza de control de fugas: tras un cambio limpio, el nº de tensores debe quedar
    // estable entre cambios (no crecer). Si crece a cada cambio, hay basura sin liberar.
    console.log(`[cambio→${id}] tensores ${antes.numTensores} → ${d.numTensores} · ${d.megabytes} MB`);
  }

  /**
   * Aplica hiperparámetros sobreescritos (los del grid search ganador) al agente
   * principal: los mezcla con los actuales y recrea el agente desde cero,
   * conservando el estado de ejecución (si entrenaba, sigue entrenando).
   */
  async aplicarHiperparametros(override = {}, reanudar = this.corriendo) {
    this.hpOverride = { ...this.hpOverride, ...override };
    this._pausar();
    this._reconstruyendo = true;
    if (this._loteEnCurso) { try { await this._loteEnCurso; } catch (e) {} }
    this.agente?.destruir();
    this.metricas.reiniciar();
    this.panelMetricas.reiniciar();
    this.trazas.limpiar();
    this.gestor.reiniciarTodos();
    this._construirAgente();
    fijarLineaBase();
    this._reconstruyendo = false;
    if (reanudar) this._reanudar();
  }

  async reiniciar() {
    const estabaCorriendo = this.corriendo;
    this.corriendo = false; // detener el bucle un instante mientras reconstruimos
    this._reconstruyendo = true;
    if (this._loteEnCurso) { try { await this._loteEnCurso; } catch (e) {} }
    this.agente.reiniciar();
    this.metricas.reiniciar();
    this.panelMetricas.reiniciar();
    this.trazas.limpiar();
    this.gestor.reiniciarTodos();
    this.orquestador.pasoGlobal = 0;
    this.orquestador._ultimoRegistro = 0;
    fijarLineaBase();
    this._reconstruyendo = false;
    // Conservar el estado: si estaba entrenando, sigue entrenando (no se congela).
    if (estabaCorriendo) this._reanudar();
    else this._pausar();
  }

  // --- Controles -------------------------------------------------------------

  _construirChips() {
    this.dom.chips.innerHTML = "";
    for (const def of listarAlgoritmos()) {
      const card = document.createElement("div");
      card.className = "algo-card" + (def.id === this.idAlgoritmo ? " activo" : "");
      card.dataset.id = def.id;
      const ins = def.insignia
        ? `<span class="badge ${def.insignia.clase}">${def.insignia.texto}</span>`
        : "";
      card.innerHTML = `
        <div class="cab">
          <div class="nom">${def.nombre}
            <span class="info" data-info="${def.id}">i</span>
          </div>
          ${ins}
        </div>
        <div class="desc">${def.familia} · ${def.politica}</div>`;
      card.addEventListener("click", () => this.cambiarAlgoritmo(def.id));
      this.dom.chips.appendChild(card);
    }
  }

  _marcarChipActivo() {
    this.dom.chips.querySelectorAll(".algo-card").forEach((c) =>
      c.classList.toggle("activo", c.dataset.id === this.idAlgoritmo)
    );
  }

  _conectarControles() {
    this.dom.btnEntrenar.addEventListener("click", () => this._alternar());
    this.dom.btnPaso.addEventListener("click", () => this._pasoUnico());
    this.dom.btnReiniciar.addEventListener("click", () => this.reiniciar());
    this.dom.btnGridSearch?.addEventListener("click", () => this.gridSearch?.abrir());

    this.dom.sliderVelocidad.addEventListener("input", (e) => {
      this.velocidad = +e.target.value;
      this.dom.valVelocidad.textContent = `${this.velocidad}×`;
    });
    this.dom.sliderHeadless.addEventListener("change", (e) => {
      const n = +e.target.value;
      this.dom.valHeadless.textContent = n;
      this.gestor.redimensionarHeadless(n);
    });
    this.dom.sliderHeadless.addEventListener("input", (e) => {
      this.dom.valHeadless.textContent = e.target.value;
    });
    this.dom.sliderVisuales.addEventListener("input", (e) => {
      const n = +e.target.value;
      this.dom.valVisuales.textContent = n;
      this.gestor.redimensionarVisuales(n);
      this.rejilla.sincronizar(this.gestor.visuales);
      if (this.envSeleccionado >= n) this.envSeleccionado = 0;
    });
    this.dom.toggleShaping.addEventListener("change", (e) => {
      this.shaping = e.target.checked;
      this.gestor = new GestorEntornos({
        numHeadless: this.gestor.numHeadless,
        numVisuales: this.gestor.numVisuales,
        shaping: this.shaping,
      });
      this.orquestador.gestor = this.gestor;
      this.rejilla.sincronizar(this.gestor.visuales);
      this.reiniciar();
    });
  }

  _conectarPestanas() {
    if (!this.dom.tabs) return;
    const vistas = {
      laboratorio: this.dom.vistaLaboratorio,
      comparativa: this.dom.vistaComparativa,
      jugar: this.dom.vistaJugar,
    };
    this.dom.tabs.addEventListener("click", (e) => {
      const tab = e.target.closest(".tab");
      if (!tab) return;
      const vista = tab.dataset.vista;
      this.dom.tabs.querySelectorAll(".tab").forEach((t) =>
        t.classList.toggle("activo", t === tab));
      for (const [nombre, el] of Object.entries(vistas))
        if (el) el.classList.toggle("oculta", nombre !== vista);
      // La Arena tiene su propio bucle de animación: arrancarlo solo cuando es visible.
      if (vista === "jugar") this.arena?.activar();
      else this.arena?.desactivar();
    });
  }

  _suscribirBus() {
    bus.suscribir(EVENTOS.METRICAS_ACTUALIZADAS, ({ traza, historial }) => {
      this.panelMetricas.actualizar(traza.metricas);
      this.curvas.actualizar(historial);
    });
  }

  _alternar() {
    this.corriendo ? this._pausar() : this._reanudar();
  }
  _reanudar() {
    this.corriendo = true;
    this.orquestador.arrancar();
    this.dom.btnEntrenar.innerHTML = "⏸ Pausar";
    this.dom.btnEntrenar.classList.add("entrenando");
    this.dom.badgeEstado.innerHTML = `<span class="punto"></span>entrenando`;
    this.dom.badgeEstado.classList.add("activo");
  }
  _pausar() {
    this.corriendo = false;
    this.orquestador?.pausar();
    this.dom.btnEntrenar.innerHTML = "▶ Entrenar";
    this.dom.btnEntrenar.classList.remove("entrenando");
    this.dom.badgeEstado.innerHTML = `<span class="punto"></span>en pausa`;
    this.dom.badgeEstado.classList.remove("activo");
  }
  async _pasoUnico() {
    await this.orquestador.ejecutarLote();
    this.orquestador.pasoVisual();
    this._render();
  }

  // --- Bucle de animación ----------------------------------------------------

  _arrancarBucle() {
    const paso = async () => {
      try {
        await this._tick();
      } catch (err) {
        console.error("[bucle]", err);
      }
      requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }

  async _tick() {
    if (this.corriendo && this.orquestador && !this._reconstruyendo) {
      // PANTALLA SIEMPRE FLUIDA. La animación (pasoVisual + render, ~12 ms) corre en
      // CADA frame; el entrenamiento se reparte por tiempo. Un solo lote de World Model
      // o RNN (planning + LSTM, con stalls de dataSync en WebGPU) tarda ~100 ms y es
      // síncrono: entrenarlo en cada frame congelaría la pantalla (lo que el usuario veía
      // como "va lentísimo"). Por eso, tras un bloque de entrenamiento que excede el
      // objetivo de frame, nos saltamos unos frames (solo animación) y la pantalla se
      // mantiene a ~30 fps. DQN/PPO/SAC (lotes ligeros) siguen entrenando en cada frame.
      // Guardamos el lote en vuelo para esperarlo antes de destruir el agente al cambiar
      // de modelo (evita ops sobre tensores ya liberados → errores y fugas).
      if (this._deudaFrames > 0) {
        this._deudaFrames--; // frame de respiro: solo animar, no entrenar
      } else {
        const t0 = performance.now();
        this._loteEnCurso = (async () => {
          let k = 0;
          do { await this.orquestador.ejecutarLote(); k++; }
          while (k < this.velocidad && performance.now() - t0 < this.PRESUPUESTO_MS);
        })();
        try { await this._loteEnCurso; } finally { this._loteEnCurso = null; }
        // Si el entrenamiento excedió el objetivo de frame, repartir el coste saltando
        // los próximos frames (auto-ajuste: DQN→0, WM/RNN→3-4 frames de respiro).
        const dt = performance.now() - t0;
        this._deudaFrames = Math.min(8, Math.max(0, Math.round(dt / this.OBJETIVO_FRAME_MS) - 1));
      }
      // La animación avanza `velocidad` pasos por frame → fast-forward visual sin tocar
      // la física ni el modelo (solo se ven más pasos por segundo).
      this.orquestador.pasoVisual(this.velocidad);
    }
    this._render();
    const ahora = performance.now();
    if (ahora - this._ultInspeccion > 110) {
      this._ultInspeccion = ahora;
      this._actualizarInspeccion();
    }
  }

  _render() {
    const sel = Math.min(this.envSeleccionado, this.gestor.numVisuales - 1);
    const env = this.gestor.visuales[sel];
    if (!env) return;
    dibujarEntorno(this.ctx, env);
    this.dom.statReward.textContent = env.recompensaEpisodio.toFixed(2);
    this.dom.statLadrillos.textContent = env.ladrillosRotosEpisodio;
    if (this.dom.statLadrillosTotal) this.dom.statLadrillosTotal.textContent = env.ladrillosIniciales;
    this.dom.statPasos.textContent = env.pasos;
    const etiquetaEstado =
      { jugando: "jugando", ganado: "ganado", timeout: "tiempo agotado", perdido: "perdido" }[
        env.estado
      ] || env.estado;
    this.dom.badgeJugando.innerHTML = `<span class="punto"></span>${etiquetaEstado}`;
    this.rejilla.render(this.gestor.visuales);
    this.panelTransicion.actualizar(env.obtenerTransicionLegible());
  }

  _actualizarInspeccion() {
    if (!this.inspector) return;
    const sel = Math.min(this.envSeleccionado, this.gestor.numVisuales - 1);
    const env = this.gestor.visuales[sel];
    if (!env) return;
    try {
      this.inspector.render(this.agente.obtenerDatosInspeccion(env.obtenerVectorEstado()));
    } catch (e) {
      /* inspección no crítica */
    }
  }
}
