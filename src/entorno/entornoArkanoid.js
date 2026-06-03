// ============================================================================
//  Entorno Arkanoid (simulación pura, sin DOM ni canvas)
//  Física de paso fijo: step(accion) avanza exactamente un timestep. La
//  "velocidad" de la UI controla cuántos pasos ocurren por frame, nunca la
//  física, para que la dinámica que aprende el agente sea siempre la misma.
// ============================================================================

import {
  FILAS_LADRILLOS,
  COLUMNAS_LADRILLOS,
  ACCIONES,
  SIMBOLOS_ACCION,
  RECOMPENSAS,
  DIM_ESTADO,
  CONFIGURACION_ENTORNO as CFG,
} from "../nucleo/constantes.js";

function limitar(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// Generador congruente lineal para reproducibilidad opcional por entorno.
function crearRng(semilla) {
  let s = (semilla >>> 0) || 1;
  return () => {
    // xorshift32
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

export class EntornoArkanoid {
  /**
   * @param {number} id           identificador del entorno
   * @param {object} [opciones]
   * @param {boolean} [opciones.shaping=true]  activar reward shaping potencial
   * @param {number}  [opciones.semilla]       semilla del RNG (opcional)
   */
  constructor(id, opciones = {}) {
    this.id = id;
    this.shaping = opciones.shaping !== false;
    this._rng = opciones.semilla != null ? crearRng(opciones.semilla + id * 7919) : Math.random;
    this.anchoLadrillo =
      (1 - CFG.MARGEN_LADRILLOS_X * 2 - CFG.ESPACIO_LADRILLOS * (COLUMNAS_LADRILLOS - 1)) /
      COLUMNAS_LADRILLOS;
    this.reiniciar();
  }

  _aleatorio(min, max) {
    return this._rng() * (max - min) + min;
  }

  reiniciar() {
    this.ladrillos = [];
    for (let fila = 0; fila < FILAS_LADRILLOS; fila++) {
      for (let col = 0; col < COLUMNAS_LADRILLOS; col++) {
        this.ladrillos.push({ fila, col, vivo: true });
      }
    }
    this.ladrillosVivos = this.ladrillos.length;

    // Pelota: arranca en la mitad inferior moviéndose hacia arriba (a por los
    // ladrillos), con dirección horizontal aleatoria. Magnitud constante.
    const angulo = this._aleatorio(-0.9, 0.9); // radianes respecto a la vertical
    this.pelota = {
      x: this._aleatorio(0.3, 0.7),
      y: this._aleatorio(0.55, 0.68),
      vx: Math.sin(angulo) * CFG.VELOCIDAD_PELOTA,
      vy: -Math.cos(angulo) * CFG.VELOCIDAD_PELOTA,
      r: CFG.RADIO_PELOTA,
    };
    this.pala = {
      x: this._aleatorio(0.35, 0.65),
      ancho: CFG.ANCHO_PALA,
      alto: CFG.ALTO_PALA,
    };

    this.recompensaEpisodio = 0;
    this.pasos = 0;
    this.estado = "jugando"; // "jugando" | "perdido" | "ganado"
    this.accionActual = ACCIONES.MANTENER;
    this.recompensaPaso = 0;
    this.ladrillosRotosEpisodio = 0;
    this.combo = 0; // ladrillos rotos seguidos sin tocar la pala
    this.comboMax = 0;
    this._distAnterior = Math.abs(this.pelota.x - this.pala.x);

    return this.obtenerVectorEstado();
  }

  /** Estado normalizado (~[-1,1]) que recibe la red neuronal. */
  obtenerVectorEstado() {
    const p = this.pelota;
    return [
      p.x * 2 - 1,
      p.y * 2 - 1,
      p.vx / CFG.VELOCIDAD_PELOTA,
      p.vy / CFG.VELOCIDAD_PELOTA,
      this.pala.x * 2 - 1,
      limitar((p.x - this.pala.x) * 2, -1, 1),
    ];
  }

  estaTerminado() {
    return this.estado !== "jugando";
  }

  /**
   * Avanza un paso de simulación aplicando la acción dada.
   * @returns {{recompensa:number, done:boolean}}
   */
  paso(accion) {
    if (this.estaTerminado()) {
      return { recompensa: 0, done: true };
    }

    this.pasos++;
    this.accionActual = accion;
    this.recompensaPaso = RECOMPENSAS.PASO;

    this._aplicarAccion(accion);
    this._moverPelota();
    this._colisionParedes();
    this._colisionPala();
    this._colisionLadrillos();
    this._verificarFin();
    this._aplicarShaping();

    this.recompensaEpisodio += this.recompensaPaso;
    return { recompensa: this.recompensaPaso, done: this.estaTerminado() };
  }

  _aplicarAccion(accion) {
    if (accion === ACCIONES.IZQUIERDA) this.pala.x -= CFG.VELOCIDAD_PALA;
    else if (accion === ACCIONES.DERECHA) this.pala.x += CFG.VELOCIDAD_PALA;
    this.pala.x = limitar(this.pala.x, this.pala.ancho / 2, 1 - this.pala.ancho / 2);
  }

  _moverPelota() {
    this.pelota.x += this.pelota.vx;
    this.pelota.y += this.pelota.vy;
  }

  _colisionParedes() {
    const p = this.pelota;
    if (p.x < p.r) {
      p.x = p.r;
      p.vx = Math.abs(p.vx);
    } else if (p.x > 1 - p.r) {
      p.x = 1 - p.r;
      p.vx = -Math.abs(p.vx);
    }
    if (p.y < p.r) {
      p.y = p.r;
      p.vy = Math.abs(p.vy);
    }
  }

  _colisionPala() {
    const p = this.pelota;
    const yPala = CFG.POSICION_PALA_Y;
    if (
      p.vy > 0 &&
      p.y + p.r >= yPala &&
      p.y - p.r <= yPala + this.pala.alto &&
      p.x >= this.pala.x - this.pala.ancho / 2 &&
      p.x <= this.pala.x + this.pala.ancho / 2
    ) {
      // Ángulo de salida según el punto de impacto (-1 borde izq, +1 borde der).
      const relativo = limitar((p.x - this.pala.x) / (this.pala.ancho / 2), -1, 1);
      p.vx = relativo * CFG.FACTOR_REBOTE * CFG.VELOCIDAD_PELOTA;
      p.vy = -Math.abs(p.vy);
      p.y = yPala - p.r - 1e-4;
      this._renormalizarVelocidad();
      this.recompensaPaso += RECOMPENSAS.GOLPEAR_PALA;
      this.combo = 0; // la bola vuelve a la pala: se corta el combo
    }
  }

  // Mantiene la magnitud de la velocidad constante y evita trayectorias casi
  // horizontales (que harían el juego imposible).
  _renormalizarVelocidad() {
    const p = this.pelota;
    let mag = Math.hypot(p.vx, p.vy) || CFG.VELOCIDAD_PELOTA;
    p.vx = (p.vx / mag) * CFG.VELOCIDAD_PELOTA;
    p.vy = (p.vy / mag) * CFG.VELOCIDAD_PELOTA;
    const vyMin = 0.35 * CFG.VELOCIDAD_PELOTA;
    if (Math.abs(p.vy) < vyMin) {
      p.vy = -Math.sign(p.vy || -1) * vyMin;
      const vxMax = Math.sqrt(Math.max(0, CFG.VELOCIDAD_PELOTA ** 2 - p.vy ** 2));
      p.vx = Math.sign(p.vx || 1) * vxMax;
    }
  }

  _colisionLadrillos() {
    const p = this.pelota;
    for (const l of this.ladrillos) {
      if (!l.vivo) continue;
      const lx = CFG.MARGEN_LADRILLOS_X + l.col * (this.anchoLadrillo + CFG.ESPACIO_LADRILLOS);
      const ly = CFG.TOPE_LADRILLOS + l.fila * (CFG.ALTO_LADRILLO + CFG.ESPACIO_LADRILLOS);
      if (
        p.x + p.r >= lx &&
        p.x - p.r <= lx + this.anchoLadrillo &&
        p.y + p.r >= ly &&
        p.y - p.r <= ly + CFG.ALTO_LADRILLO
      ) {
        l.vivo = false;
        this.ladrillosVivos--;
        this.ladrillosRotosEpisodio++;
        // Rebote según por dónde entra (vertical vs lateral).
        const centroX = lx + this.anchoLadrillo / 2;
        const centroY = ly + CFG.ALTO_LADRILLO / 2;
        const dx = (p.x - centroX) / this.anchoLadrillo;
        const dy = (p.y - centroY) / CFG.ALTO_LADRILLO;
        if (Math.abs(dx) > Math.abs(dy)) p.vx *= -1;
        else p.vy *= -1;
        // Premio base + bonus de combo: cada ladrillo extra de esta misma subida
        // (sin tocar la pala) vale más → incentiva colar la bola y reventar varios.
        this.combo++;
        if (this.combo > this.comboMax) this.comboMax = this.combo;
        this.recompensaPaso += RECOMPENSAS.ROMPER_LADRILLO + RECOMPENSAS.COMBO_BONUS * (this.combo - 1);
        break; // un ladrillo por paso
      }
    }
  }

  _verificarFin() {
    if (this.pelota.y - this.pelota.r > 1) {
      this.estado = "perdido";
      this.recompensaPaso += RECOMPENSAS.PERDER_PELOTA;
    } else if (this.ladrillosVivos === 0) {
      this.estado = "ganado";
      this.recompensaPaso += RECOMPENSAS.COMPLETAR_NIVEL;
    } else if (this.pasos >= CFG.MAX_PASOS_EPISODIO) {
      this.estado = "timeout"; // se agotó el tiempo: fin del episodio SIN penalización
    }
  }

  // Reward shaping basado en potencial Φ(s) = -|pelota.x - pala.x|.
  // shaping = Φ(s') - Φ(s) = distAnterior - distActual. Telescópico: no altera
  // la política óptima, solo da señal densa para aprender a seguir la pelota.
  _aplicarShaping() {
    const distActual = Math.abs(this.pelota.x - this.pala.x);
    if (this.shaping && !this.estaTerminado()) {
      this.recompensaPaso += RECOMPENSAS.COEF_SHAPING * (this._distAnterior - distActual);
    }
    this._distAnterior = distActual;
  }

  // --- Utilidades de apoyo ---------------------------------------------------

  /** Política heurística (seguir la pelota). Para baselines y demostración. */
  accionHeuristica() {
    const objetivo = this.pelota.x + this.pelota.vx * 6;
    const dif = objetivo - this.pala.x;
    if (Math.abs(dif) < CFG.VELOCIDAD_PALA) return ACCIONES.MANTENER;
    return dif < 0 ? ACCIONES.IZQUIERDA : ACCIONES.DERECHA;
  }

  /** Transición legible para el panel pedagógico [s]→[a]→[r]→[s']→[done]. */
  obtenerTransicionLegible() {
    return {
      estado: `(${this.pelota.x.toFixed(2)}, ${this.pelota.y.toFixed(2)})`,
      accion: SIMBOLOS_ACCION[this.accionActual],
      recompensa: this.recompensaPaso.toFixed(3),
      siguiente: `(${(this.pelota.x + this.pelota.vx).toFixed(2)}, ${(
        this.pelota.y + this.pelota.vy
      ).toFixed(2)})`,
      done: this.estaTerminado(),
    };
  }
}

export { DIM_ESTADO };
