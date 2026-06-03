// ============================================================================
//  Curvas de entrenamiento — 4 mini-gráficas de líneas (canvas 2D)
//  Las series de las gráficas Pérdida/Datos/Exploración se adaptan al algoritmo.
// ============================================================================

import { ALGORITMOS } from "../nucleo/constantes.js";

const C = {
  reward: "#3ddc97",
  exito: "#8b6dff",
  loss: "#ff6b81",
  buffer: "#4ea3ff",
  explora: "#ffb454",
};

// Configuración de las 3 gráficas adaptables por algoritmo.
const CONFIG = {
  [ALGORITMOS.DQN]: {
    loss: { clave: "loss", titulo: "Pérdida (Huber)", leyenda: "loss" },
    buffer: { clave: "bufferSize", titulo: "Tamaño del replay buffer", leyenda: "buffer" },
    explora: { clave: "epsilon", titulo: "Exploración (ε)", leyenda: "ε" },
  },
  [ALGORITMOS.PPO]: {
    loss: { clave: "loss", titulo: "Pérdida total", leyenda: "loss" },
    buffer: { clave: "ladrillosRotosMedio", titulo: "Ladrillos rotos (media)", leyenda: "ladrillos" },
    explora: { clave: "entropia", titulo: "Entropía de la política", leyenda: "H" },
  },
  [ALGORITMOS.SAC]: {
    loss: { clave: "loss", titulo: "Pérdida del crítico", leyenda: "loss" },
    buffer: { clave: "bufferSize", titulo: "Tamaño del replay buffer", leyenda: "buffer" },
    explora: { clave: "temperatura", titulo: "Temperatura α", leyenda: "α" },
  },
  [ALGORITMOS.WORLD_MODEL]: {
    loss: { clave: "loss", titulo: "Pérdida Q", leyenda: "loss" },
    buffer: { clave: "errorModelo", titulo: "Error del modelo (RMSE)", leyenda: "error" },
    explora: { clave: "epsilon", titulo: "Exploración (ε)", leyenda: "ε" },
  },
  [ALGORITMOS.WORLD_MODEL_RECURRENTE]: {
    loss: { clave: "loss", titulo: "Pérdida Q", leyenda: "loss" },
    buffer: { clave: "errorModelo", titulo: "Error del modelo LSTM (RMSE)", leyenda: "error" },
    explora: { clave: "epsilon", titulo: "Exploración (ε)", leyenda: "ε" },
  },
};

export class CurvasEntrenamiento {
  constructor(elementos) {
    // elementos: { reward, loss, buffer, explora } (canvas) + spans de título/leyenda
    this.el = elementos;
    this.cfg = CONFIG[ALGORITMOS.DQN];
  }

  configurar(idAlgoritmo) {
    this.cfg = CONFIG[idAlgoritmo] || CONFIG[ALGORITMOS.DQN];
    this.el.tituloLoss.textContent = this.cfg.loss.titulo;
    this.el.legLoss.textContent = this.cfg.loss.leyenda;
    this.el.tituloBuffer.textContent = this.cfg.buffer.titulo;
    this.el.legBuffer.textContent = this.cfg.buffer.leyenda;
    this.el.tituloExplora.textContent = this.cfg.explora.titulo;
    this.el.legExplora.textContent = this.cfg.explora.leyenda;
  }

  actualizar(historial) {
    if (!historial || !historial.length) return;
    const x = historial.map((p) => p.paso);
    serie(this.el.reward, x, [
      { y: historial.map((p) => p.rewardMedio100), color: C.reward },
      { y: historial.map((p) => p.tasaExito100), color: C.exito },
    ]);
    serie(this.el.loss, x, [{ y: historial.map((p) => p[this.cfg.loss.clave]), color: C.loss }]);
    serie(this.el.buffer, x, [{ y: historial.map((p) => p[this.cfg.buffer.clave]), color: C.buffer }]);
    serie(this.el.explora, x, [{ y: historial.map((p) => p[this.cfg.explora.clave]), color: C.explora }]);
  }
}

function serie(canvas, x, series) {
  const ctx = prepararCanvas(canvas);
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  ctx.clearRect(0, 0, W, H);

  // Rango Y combinado (ignorando null/NaN).
  let min = Infinity, max = -Infinity;
  for (const s of series)
    for (const v of s.y)
      if (v != null && !Number.isNaN(v)) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
  if (!isFinite(min)) {
    return;
  }
  if (min === max) {
    max += 1;
    min -= 1;
  }
  const pad = (max - min) * 0.08;
  min -= pad;
  max += pad;

  // Rejilla (tenue, sobre fondo claro)
  ctx.strokeStyle = "rgba(17,24,39,0.07)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const yy = (H - 8) * (i / 3) + 4;
    ctx.beginPath();
    ctx.moveTo(0, yy);
    ctx.lineTo(W, yy);
    ctx.stroke();
  }

  const n = x.length;
  const px = (i) => (n <= 1 ? 0 : (i / (n - 1)) * (W - 4) + 2);
  const py = (v) => H - 4 - ((v - min) / (max - min)) * (H - 8);

  for (const s of series) {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    let primera = true;
    for (let i = 0; i < n; i++) {
      const v = s.y[i];
      if (v == null || Number.isNaN(v)) continue;
      const X = px(i), Y = py(v);
      if (primera) {
        ctx.moveTo(X, Y);
        primera = false;
      } else ctx.lineTo(X, Y);
    }
    ctx.stroke();
    // Punto final
    for (let i = n - 1; i >= 0; i--) {
      const v = s.y[i];
      if (v != null && !Number.isNaN(v)) {
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(px(i), py(v), 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }
  }
}

function prepararCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 200;
  const h = canvas.clientHeight || 120;
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}
