// ============================================================================
//  Renderizador del juego — dibuja un EntornoArkanoid en un canvas 2D
//  Usa coordenadas normalizadas [0,1] escaladas al tamaño del canvas.
// ============================================================================

import {
  CONFIGURACION_ENTORNO as CFG,
  COLUMNAS_LADRILLOS,
} from "../nucleo/constantes.js";

const COLORES_FILA = ["#ff6b81", "#ffb454", "#3ddc97", "#4ea3ff", "#8b6dff", "#ff8fc7"];

export function dibujarEntorno(ctx, env, opciones = {}) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const mini = opciones.mini === true;

  // Fondo
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#060912";
  ctx.fillRect(0, 0, W, H);

  // Línea de la pala (zona de peligro)
  ctx.strokeStyle = "rgba(255,107,129,0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(W, H);
  ctx.stroke();

  // Ladrillos
  const anchoL = env.anchoLadrillo;
  for (const l of env.ladrillos) {
    if (!l.vivo) continue;
    const lx = CFG.MARGEN_LADRILLOS_X + l.col * (anchoL + CFG.ESPACIO_LADRILLOS);
    const ly = CFG.TOPE_LADRILLOS + l.fila * (CFG.ALTO_LADRILLO + CFG.ESPACIO_LADRILLOS);
    const color = COLORES_FILA[l.fila % COLORES_FILA.length];
    ctx.fillStyle = color;
    redondeado(ctx, lx * W, ly * H, anchoL * W, CFG.ALTO_LADRILLO * H, mini ? 1 : 3);
    ctx.fill();
    if (!mini) {
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(lx * W, ly * H, anchoL * W, 2);
    }
  }

  // Pala
  const palaW = env.pala.ancho * W;
  const palaH = CFG.ALTO_PALA * H;
  const palaX = env.pala.x * W - palaW / 2;
  const palaY = CFG.POSICION_PALA_Y * H;
  const gradPala = ctx.createLinearGradient(palaX, 0, palaX + palaW, 0);
  gradPala.addColorStop(0, "#4ea3ff");
  gradPala.addColorStop(1, "#8b6dff");
  ctx.fillStyle = gradPala;
  redondeado(ctx, palaX, palaY, palaW, palaH, mini ? 2 : 5);
  ctx.fill();

  // Pelota
  const bx = env.pelota.x * W;
  const by = env.pelota.y * H;
  const br = env.pelota.r * Math.min(W, H) * (mini ? 1.4 : 1.1);
  if (!mini) {
    ctx.shadowColor = "#e6ecf5";
    ctx.shadowBlur = 10;
  }
  ctx.fillStyle = "#e6ecf5";
  ctx.beginPath();
  ctx.arc(bx, by, br, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Estado terminal: tinte por motivo (ganó / tiempo agotado / perdió)
  if (env.estado !== "jugando") {
    const cfg =
      env.estado === "ganado"
        ? { tint: "rgba(61,220,151,0.18)", fg: "#3ddc97", msg: "¡NIVEL COMPLETADO!" }
        : env.estado === "timeout"
        ? { tint: "rgba(255,180,84,0.16)", fg: "#ffb454", msg: "TIEMPO AGOTADO" }
        : { tint: "rgba(255,107,129,0.16)", fg: "#ff6b81", msg: "PELOTA PERDIDA" };
    ctx.fillStyle = cfg.tint;
    ctx.fillRect(0, 0, W, H);
    if (!mini) {
      ctx.textAlign = "center";
      ctx.fillStyle = cfg.fg;
      ctx.font = "600 22px system-ui";
      ctx.fillText(cfg.msg, W / 2, H / 2 - 6);
      ctx.fillStyle = "rgba(230,236,245,0.65)";
      ctx.font = "400 13px system-ui";
      ctx.fillText("nueva partida…", W / 2, H / 2 + 20);
      ctx.textAlign = "left";
    }
  }
}

function redondeado(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
