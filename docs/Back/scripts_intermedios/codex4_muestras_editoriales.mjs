import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'docs', 'assets');
const qaDir = path.join(root, 'docs', 'qa_visual_codex', 'refuerzo_codex4', 'muestras');
const qaFullDir = path.join(root, 'docs', 'qa_visual_codex', 'refuerzo_codex4', 'png');
const reportPath = path.join(root, 'docs', 'report_v3_version_codex.html');

const W = 1700;
const H = 1200;

const C = {
  ink: '#071225',
  blue: '#073f9e',
  blue2: '#0b63ce',
  line: '#9db9ed',
  pale: '#fbfdff',
  grid: '#d8e5fb',
  text: '#172033',
  muted: '#4b5563',
  cyan: '#0089bd',
  teal: '#078572',
  green: '#238344',
  violet: '#6f45c6',
  purple: '#7a3fd0',
  pink: '#d82f83',
  orange: '#e56716',
  amber: '#c78305',
  red: '#d92d2d',
};

function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrap(text, max) {
  const words = String(text).trim().split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= max || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function t(x, y, text, opts = {}) {
  const size = opts.size ?? 26;
  const weight = opts.weight ?? 500;
  const fill = opts.fill ?? C.text;
  const anchor = opts.anchor ?? 'start';
  const family = opts.family ?? 'Arial, Helvetica, sans-serif';
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${fill}">${esc(text)}</text>`;
}

function lines(x, y, text, opts = {}) {
  const size = opts.size ?? 25;
  const gap = opts.gap ?? Math.round(size * 1.25);
  const max = opts.max ?? 42;
  const maxLines = opts.maxLines ?? 6;
  return wrap(text, max).slice(0, maxLines).map((line, i) => t(x, y + i * gap, line, opts)).join('\n');
}

function panel(x, y, w, h, opts = {}) {
  const stroke = opts.stroke ?? C.line;
  const fill = opts.fill ?? '#fff';
  const rx = opts.rx ?? 20;
  const sw = opts.sw ?? 2.2;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}

function badge(n, x, y, color = C.blue) {
  return `
    <circle cx="${x}" cy="${y}" r="38" fill="${color}" stroke="#001f70" stroke-width="4"/>
    ${t(x, y + 13, n, { size: 50, weight: 900, fill: '#fff', anchor: 'middle' })}
  `;
}

function sectionTitle(n, title, x, y, color = C.blue) {
  return `${badge(n, x, y - 16, color)}${t(x + 62, y, title, { size: 40, weight: 900, fill: color })}`;
}

function arrow(x1, y1, x2, y2, color = C.blue, w = 5, dashed = false) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const hx = x2 - 16 * Math.cos(a);
  const hy = y2 - 16 * Math.sin(a);
  const p1 = `${hx - 10 * Math.sin(a)},${hy + 10 * Math.cos(a)}`;
  const p2 = `${hx + 10 * Math.sin(a)},${hy - 10 * Math.cos(a)}`;
  return `<line x1="${x1}" y1="${y1}" x2="${hx}" y2="${hy}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" ${dashed ? 'stroke-dasharray="10 10"' : ''}/><polygon points="${x2},${y2} ${p1} ${p2}" fill="${color}"/>`;
}

function miniNetwork(x, y, layers, color = C.blue, scale = 1) {
  let out = '';
  const gapX = 88 * scale;
  const gapY = 42 * scale;
  const coords = [];
  layers.forEach((count, li) => {
    const cx = x + li * gapX;
    const top = y - ((count - 1) * gapY) / 2;
    const pts = [];
    for (let i = 0; i < count; i++) pts.push([cx, top + i * gapY]);
    coords.push(pts);
  });
  for (let li = 0; li < coords.length - 1; li++) {
    for (const a of coords[li]) for (const b of coords[li + 1]) {
      out += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#b9c7dd" stroke-width="${1.5 * scale}"/>`;
    }
  }
  for (const layer of coords) for (const [cx, cy] of layer) {
    out += `<circle cx="${cx}" cy="${cy}" r="${12 * scale}" fill="#fff" stroke="${color}" stroke-width="${3 * scale}"/>`;
  }
  return out;
}

function block3d(x, y, w, h, color) {
  const dx = 20;
  const dy = -16;
  return `
    <polygon points="${x},${y} ${x + dx},${y + dy} ${x + w + dx},${y + dy} ${x + w},${y}" fill="#eef4ff" stroke="${color}" stroke-width="2"/>
    <polygon points="${x + w},${y} ${x + w + dx},${y + dy} ${x + w + dx},${y + h + dy} ${x + w},${y + h}" fill="#c8dafb" stroke="${color}" stroke-width="2"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#dce8ff" stroke="${color}" stroke-width="2"/>
  `;
}

function gauge(x, y, color = C.cyan) {
  return `
    <path d="M${x - 58} ${y + 38} A70 70 0 0 1 ${x + 58} ${y + 38}" fill="none" stroke="#e8eef7" stroke-width="18" stroke-linecap="round"/>
    <path d="M${x - 58} ${y + 38} A70 70 0 0 1 ${x + 40} ${y - 30}" fill="none" stroke="${color}" stroke-width="18" stroke-linecap="round"/>
    <line x1="${x}" y1="${y + 38}" x2="${x + 48}" y2="${y - 24}" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="${x}" cy="${y + 38}" r="11" fill="${C.ink}"/>
  `;
}

function scaleIcon(x, y, color = C.green) {
  return `
    <line x1="${x}" y1="${y - 62}" x2="${x}" y2="${y + 55}" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
    <line x1="${x - 64}" y1="${y - 20}" x2="${x + 64}" y2="${y - 20}" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
    <path d="M${x - 45} ${y - 20} L${x - 72} ${y + 45} L${x - 18} ${y + 45} Z" fill="#fff" stroke="${color}" stroke-width="5"/>
    <path d="M${x + 45} ${y - 20} L${x + 18} ${y + 45} L${x + 72} ${y + 45} Z" fill="#fff" stroke="${color}" stroke-width="5"/>
    <line x1="${x - 40}" y1="${y + 65}" x2="${x + 40}" y2="${y + 65}" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>
  `;
}

function thermometer(x, y, color = C.orange) {
  return `
    <rect x="${x - 15}" y="${y - 75}" width="30" height="120" rx="15" fill="#fff" stroke="${color}" stroke-width="4"/>
    <rect x="${x - 8}" y="${y - 16}" width="16" height="62" rx="8" fill="${color}"/>
    <circle cx="${x}" cy="${y + 57}" r="31" fill="#fff" stroke="${color}" stroke-width="4"/>
    <circle cx="${x}" cy="${y + 57}" r="20" fill="${color}"/>
  `;
}

function bars(x, y, color = C.blue) {
  const vals = [170, 132, 92, 45];
  return vals.map((v, i) => `
    <rect x="${x}" y="${y + i * 36}" width="190" height="24" rx="9" fill="#e8eef7"/>
    <rect x="${x}" y="${y + i * 36}" width="${v}" height="24" rx="9" fill="${color}"/>
  `).join('');
}

function miniBars(x, y, color = C.blue) {
  const vals = [82, 62, 40];
  return vals.map((v, i) => `
    <rect x="${x}" y="${y + i * 22}" width="92" height="14" rx="6" fill="#e8eef7"/>
    <rect x="${x}" y="${y + i * 22}" width="${v}" height="14" rx="6" fill="${color}"/>
  `).join('');
}

function policyBars(x, y, color = C.pink) {
  const vals = [172, 128, 84];
  return vals.map((v, i) => `
    <rect x="${x}" y="${y + i * 34}" width="190" height="24" rx="9" fill="#e8eef7"/>
    <rect x="${x}" y="${y + i * 34}" width="${v}" height="24" rx="9" fill="${color}"/>
  `).join('');
}

function board(x, y, s = 18) {
  let out = `<rect x="${x - 10}" y="${y - 10}" width="${8 * (s + 4) + 16}" height="${5 * (s + 4) + 16}" rx="12" fill="#fff" stroke="${C.blue}" stroke-width="3"/>`;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) {
    const colors = ['#2f80ed', '#7f56d9', '#00a3a3', '#f97316'];
    const active = (r + c * 2) % 5 !== 0;
    out += `<rect x="${x + c * (s + 4)}" y="${y + r * (s + 4)}" width="${s}" height="${s}" rx="4" fill="${active ? colors[(r + c) % colors.length] : '#e5eaf3'}"/>`;
  }
  return out;
}

function principle(x, y, title, body, color, visual) {
  return `
    <line x1="${x - 18}" y1="${y - 20}" x2="${x - 18}" y2="${y + 185}" stroke="${C.grid}" stroke-width="2" stroke-dasharray="5 8"/>
    ${visual}
    ${t(x + 95, y + 26, title, { size: 26, weight: 900, fill: color })}
    ${lines(x + 95, y + 62, body, { size: 20, max: 27, maxLines: 4, fill: C.text })}
  `;
}

function smallVisual(kind, cx, cy, color) {
  if (kind === 'badge1') return badge('1', cx, cy, color);
  if (kind === 'badge86') return badge('86', cx, cy, color);
  if (kind === 'scale') return `
    <line x1="${cx}" y1="${cy - 42}" x2="${cx}" y2="${cy + 36}" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
    <line x1="${cx - 52}" y1="${cy - 16}" x2="${cx + 52}" y2="${cy - 16}" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
    <path d="M${cx - 36} ${cy - 16} L${cx - 58} ${cy + 34} L${cx - 14} ${cy + 34} Z" fill="#fff" stroke="${color}" stroke-width="4"/>
    <path d="M${cx + 36} ${cy - 16} L${cx + 14} ${cy + 34} L${cx + 58} ${cy + 34} Z" fill="#fff" stroke="${color}" stroke-width="4"/>
    <line x1="${cx - 32}" y1="${cy + 46}" x2="${cx + 32}" y2="${cy + 46}" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
  `;
  if (kind === 'thermo') return `
    <rect x="${cx - 11}" y="${cy - 56}" width="22" height="84" rx="11" fill="#fff" stroke="${color}" stroke-width="4"/>
    <rect x="${cx - 6}" y="${cy - 10}" width="12" height="42" rx="6" fill="${color}"/>
    <circle cx="${cx}" cy="${cy + 38}" r="24" fill="#fff" stroke="${color}" stroke-width="4"/>
    <circle cx="${cx}" cy="${cy + 38}" r="15" fill="${color}"/>
  `;
  if (kind === 'network') return miniNetwork(cx - 55, cy + 3, [2, 3, 2], color, .55);
  if (kind === 'board') return board(cx - 65, cy - 42, 12);
  if (kind === 'blocks') return `${block3d(cx - 56, cy - 35, 34, 52, color)}${block3d(cx - 7, cy - 45, 42, 68, color)}`;
  if (kind === 'bars') return miniBars(cx - 46, cy - 32, color);
  if (kind === 'formula') return `${t(cx - 18, cy + 10, 'y', { size: 52, weight: 900, fill: color, anchor: 'middle' })}${arrow(cx + 18, cy, cx + 74, cy, color, 4)}`;
  if (kind === 'gradient') return `${block3d(cx - 35, cy - 42, 42, 70, color)}${arrow(cx + 35, cy - 5, cx + 95, cy - 5, color, 4)}`;
  return `
    <path d="M${cx - 48} ${cy + 25} A58 58 0 0 1 ${cx + 48} ${cy + 25}" fill="none" stroke="#e8eef7" stroke-width="14" stroke-linecap="round"/>
    <path d="M${cx - 48} ${cy + 25} A58 58 0 0 1 ${cx + 34} ${cy - 26}" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round"/>
    <line x1="${cx}" y1="${cy + 25}" x2="${cx + 39}" y2="${cy - 20}" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy + 25}" r="9" fill="${C.ink}"/>
  `;
}

function principleV(x, y, w, title, body, color, kind) {
  return `
    <line x1="${x - 16}" y1="${y - 4}" x2="${x - 16}" y2="${y + 166}" stroke="${C.grid}" stroke-width="2" stroke-dasharray="5 8"/>
    ${smallVisual(kind, x + w / 2, y + 28, color)}
    ${t(x + w / 2, y + 120, title, { size: 25, weight: 900, anchor: 'middle', fill: color })}
    ${wrap(body, 25).slice(0, 3).map((line, i) => t(x + w / 2, y + 148 + i * 22, line, { size: 19, anchor: 'middle', fill: C.text })).join('')}
  `;
}

function frame(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#fff"/>
  ${body}
</svg>`;
}

function sac() {
  return frame(`
    ${panel(18, 22, 1664, 1156, { stroke: '#b7cdf6', rx: 24 })}
    ${sectionTitle('1', '¿Qué está equilibrando SAC?', 68, 92)}
    ${panel(48, 132, 1540, 190, { stroke: '#b7cdf6', rx: 18 })}
    ${gauge(172, 211, C.cyan)}
    ${lines(310, 178, 'SAC no se limita a probar acciones al azar. Aprende una política que busca retorno, pero mantiene diversidad útil para no cerrarse demasiado pronto.', { size: 28, max: 82, maxLines: 3, fill: C.text })}
    ${t(310, 292, 'Idea clave: retorno alto + entropía suficiente + críticos prudentes.', { size: 28, weight: 900, fill: C.blue })}

    ${sectionTitle('2', 'Arquitectura', 68, 395)}
    ${panel(48, 432, 1540, 405, { stroke: '#b7cdf6', rx: 18 })}
    ${panel(82, 500, 180, 235, { stroke: '#8badc6', rx: 16 })}
    ${t(172, 535, 'Estado', { size: 27, weight: 900, anchor: 'middle', fill: C.blue })}
    ${board(112, 570, 16)}
    ${t(172, 725, 'tensor 86', { size: 22, weight: 700, anchor: 'middle', fill: C.text })}
    ${arrow(270, 616, 337, 616, C.blue)}

    ${panel(350, 470, 355, 310, { stroke: C.pink, rx: 16 })}
    ${t(528, 512, 'Actor π(a|s)', { size: 30, weight: 900, anchor: 'middle', fill: C.pink })}
    ${miniNetwork(410, 620, [4, 5, 4], C.pink, 1)}
    ${t(602, 660, 'distribución', { size: 21, weight: 800, anchor: 'middle', fill: C.text })}
    ${policyBars(507, 680, C.pink)}

    ${arrow(710, 602, 772, 550, C.blue)}
    ${arrow(710, 648, 772, 704, C.blue)}
    ${panel(790, 478, 255, 140, { stroke: C.blue, rx: 16 })}
    ${t(918, 520, 'Crítico Q1', { size: 27, weight: 900, anchor: 'middle', fill: C.blue })}
    ${miniNetwork(842, 574, [3, 4, 2], C.blue, .72)}
    ${panel(790, 640, 255, 140, { stroke: C.violet, rx: 16 })}
    ${t(918, 682, 'Crítico Q2', { size: 27, weight: 900, anchor: 'middle', fill: C.violet })}
    ${miniNetwork(842, 736, [3, 4, 2], C.violet, .72)}

    ${arrow(1055, 555, 1123, 555, C.green)}
    ${arrow(1055, 715, 1123, 715, C.green)}
    ${panel(1140, 478, 220, 302, { stroke: C.green, rx: 16 })}
    ${t(1250, 520, 'Targets', { size: 28, weight: 900, anchor: 'middle', fill: C.green })}
    ${miniNetwork(1195, 620, [3, 3, 2], C.green, .78)}
    ${t(1250, 752, 'dianas lentas', { size: 21, weight: 700, anchor: 'middle', fill: C.text })}

    ${panel(1390, 478, 160, 302, { stroke: C.orange, rx: 16 })}
    ${t(1470, 520, 'α', { size: 38, weight: 900, anchor: 'middle', fill: C.orange })}
    ${thermometer(1470, 635, C.orange)}
    ${t(1470, 752, 'termostato', { size: 21, weight: 700, anchor: 'middle', fill: C.text })}
    ${arrow(1390, 635, 1362, 635, C.orange)}

    ${sectionTitle('3', 'Cómo funciona en 4 pasos', 68, 905)}
    ${panel(48, 942, 1540, 220, { stroke: '#b7cdf6', rx: 18 })}
    ${principleV(86, 960, 335, 'Actor propone', 'acciones con probabilidad, no máximo fijo.', C.pink, 'badge1')}
    ${principleV(465, 960, 335, 'Críticos frenan', 'doble estimación contra optimismo.', C.blue, 'scale')}
    ${principleV(850, 960, 335, 'Alpha regula', 'peso de la entropía objetivo.', C.orange, 'thermo')}
    ${principleV(1230, 960, 335, 'Targets suavizan', 'dianas lentas para Bellman.', C.green, 'network')}
  `);
}

function tensor86() {
  return frame(`
    ${panel(18, 22, 1664, 1156, { stroke: '#b7cdf6', rx: 24 })}
    ${sectionTitle('1', '¿Qué entra en la red?', 68, 92)}
    ${panel(48, 132, 650, 250, { stroke: '#b7cdf6', rx: 18 })}
    ${t(110, 184, '6 variables cinemáticas', { size: 31, weight: 900, fill: C.blue })}
    ${['bola x,y', 'velocidad x,y', 'pala x', 'tiempo'].map((s, i) => `${panel(112 + i * 135, 220, 112, 82, { stroke: [C.blue, C.cyan, C.violet, C.orange][i], rx: 14 })}${t(168 + i * 135, 270, s, { size: 20, weight: 800, anchor: 'middle', fill: [C.blue, C.cyan, C.violet, C.orange][i] })}`).join('')}
    ${panel(748, 132, 840, 250, { stroke: '#b7cdf6', rx: 18 })}
    ${t(820, 184, '80 ladrillos visibles', { size: 31, weight: 900, fill: C.blue })}
    ${board(860, 220, 18)}
    ${lines(1120, 222, 'El mapa 8×10 añade el objetivo espacial que el agente ciego no tenía. Ya no solo intercepta: puede apuntar.', { size: 26, max: 42, maxLines: 4 })}

    ${sectionTitle('2', 'Arquitectura de dos ramas', 68, 455)}
    ${panel(48, 492, 1540, 350, { stroke: '#b7cdf6', rx: 18 })}
    ${panel(90, 570, 250, 170, { stroke: C.blue, rx: 16 })}
    ${t(215, 615, 'rama densa', { size: 28, weight: 900, anchor: 'middle', fill: C.blue })}
    ${block3d(135, 650, 38, 58, C.blue)}${block3d(202, 635, 48, 74, C.blue)}${block3d(278, 620, 58, 90, C.blue)}
    ${panel(90, 750, 250, 54, { stroke: C.blue, rx: 0 })}
    ${t(215, 785, 'cinemática', { size: 20, weight: 800, anchor: 'middle', fill: C.text })}
    ${arrow(350, 662, 460, 662, C.blue)}

    ${panel(470, 530, 350, 250, { stroke: C.violet, rx: 16 })}
    ${t(645, 575, 'rama convolucional', { size: 28, weight: 900, anchor: 'middle', fill: C.violet })}
    ${board(520, 615, 13)}
    ${block3d(682, 623, 42, 78, C.violet)}${block3d(744, 604, 52, 100, C.violet)}
    ${panel(470, 786, 350, 54, { stroke: C.violet, rx: 0 })}
    ${t(645, 821, 'mapa 8×10', { size: 20, weight: 800, anchor: 'middle', fill: C.text })}
    ${arrow(830, 662, 940, 662, C.violet)}

    ${panel(958, 570, 245, 170, { stroke: C.orange, rx: 16 })}
    ${t(1080, 625, 'fusión', { size: 31, weight: 900, anchor: 'middle', fill: C.orange })}
    ${miniNetwork(1012, 690, [3, 5, 3], C.orange, .65)}
    ${arrow(1212, 662, 1325, 662, C.orange)}

    ${panel(1345, 520, 195, 280, { stroke: C.green, rx: 16 })}
    ${t(1442, 565, 'cabezas', { size: 29, weight: 900, anchor: 'middle', fill: C.green })}
    ${['Q', 'π', 'V'].map((s, i) => `${circleHead(1442, 620 + i * 55, s, [C.blue, C.pink, C.green][i])}`).join('')}

    ${sectionTitle('3', 'Principios de diseño', 68, 910)}
    ${panel(48, 946, 1540, 220, { stroke: '#b7cdf6', rx: 18 })}
    ${principleV(85, 964, 335, 'No aplanar', 'el mapa tiene geometría útil.', C.violet, 'board')}
    ${principleV(470, 964, 335, 'Fusionar tarde', 'primero patrones, luego mezcla.', C.orange, 'blocks')}
    ${principleV(855, 964, 335, 'Salida alineada', 'tres acciones, tres salidas.', C.green, 'bars')}
    ${principleV(1240, 964, 335, 'Ver objetivo', 'el muro debe entrar al estado.', C.blue, 'badge86')}
  `);
}

function circleHead(x, y, label, color) {
  return `<circle cx="${x}" cy="${y}" r="28" fill="#fff" stroke="${color}" stroke-width="4"/>${t(x, y + 10, label, { size: 27, weight: 900, anchor: 'middle', fill: color })}`;
}

function bellman() {
  return frame(`
    ${panel(18, 22, 1664, 1156, { stroke: '#b7cdf6', rx: 24 })}
    ${sectionTitle('1', '¿Qué calcula Bellman?', 68, 92)}
    ${panel(48, 132, 1540, 205, { stroke: '#b7cdf6', rx: 18 })}
    ${panel(100, 180, 620, 105, { stroke: C.violet, rx: 16 })}
    ${t(410, 247, 'target = r + γ · max Q(s′, a′)', { size: 31, weight: 900, anchor: 'middle', fill: C.violet, family: 'Menlo, Consolas, monospace' })}
    ${lines(790, 188, 'Bellman fabrica una diana temporal: combina recompensa observada y valor futuro estimado. La red corrige su Q actual hacia esa diana.', { size: 29, max: 54, maxLines: 4 })}

    ${sectionTitle('2', 'Microscopio de una transición', 68, 420)}
    ${panel(48, 457, 1540, 360, { stroke: '#b7cdf6', rx: 18 })}
    ${['s', 'a', 'r', 's′'].map((label, i) => {
      const x = 100 + i * 190;
      const color = [C.blue, C.cyan, C.orange, C.violet][i];
      return `${panel(x, 548, 120, 120, { stroke: color, rx: 18 })}${t(x + 60, 622, label, { size: 48, weight: 900, anchor: 'middle', fill: color })}${i < 3 ? arrow(x + 130, 608, x + 180, 608, C.blue) : ''}`;
    }).join('')}
    ${arrow(820, 608, 925, 608, C.violet)}
    ${panel(950, 520, 260, 175, { stroke: C.violet, rx: 16 })}
    ${t(1080, 565, 'Target', { size: 34, weight: 900, anchor: 'middle', fill: C.violet })}
    ${t(1080, 622, 'r + γ max Q', { size: 29, weight: 900, anchor: 'middle', fill: C.text, family: 'Menlo, Consolas, monospace' })}
    ${arrow(1220, 608, 1315, 608, C.red)}
    ${panel(1340, 520, 190, 175, { stroke: C.red, rx: 16 })}
    ${t(1435, 565, 'TD-error', { size: 30, weight: 900, anchor: 'middle', fill: C.red })}
    ${gauge(1435, 615, C.red)}
    ${t(415, 745, 'La transición no trae la respuesta verdadera: trae una pista para construirla.', { size: 29, weight: 900, fill: C.blue })}

    ${sectionTitle('3', 'Cómo se actualiza', 68, 890)}
    ${panel(48, 927, 1540, 220, { stroke: '#b7cdf6', rx: 18 })}
    ${principleV(90, 952, 335, 'Predicción', 'Q actual sale de la red online.', C.blue, 'network')}
    ${principleV(468, 952, 335, 'Diana', 'target con recompensa y futuro.', C.violet, 'formula')}
    ${principleV(855, 952, 335, 'Pérdida', 'distancia entre Q e y.', C.red, 'gauge')}
    ${principleV(1242, 952, 335, 'Gradiente', 'la red se mueve hacia la diana.', C.green, 'gradient')}
  `);
}

function color(name) {
  return C[name] ?? C.blue;
}

function chip(x, y, text, stroke = C.blue) {
  return `${panel(x, y, 170, 76, { stroke, rx: 14 })}${t(x + 85, y + 46, text, { size: 23, weight: 900, anchor: 'middle', fill: stroke })}`;
}

function vectorDots(x, y, n = 7, stroke = C.green) {
  let out = `<rect x="${x}" y="${y}" width="86" height="${n * 26 + 20}" rx="12" fill="#fff" stroke="${stroke}" stroke-width="3"/>`;
  for (let i = 0; i < n; i++) out += `<circle cx="${x + 43}" cy="${y + 20 + i * 26}" r="8" fill="${stroke}"/>`;
  return out;
}

function progressBars(x, y, labels, vals, colors) {
  return labels.map((label, i) => {
    const yy = y + i * 50;
    const c = colors[i % colors.length];
    return `${t(x, yy + 23, label, { size: 20, weight: 800, fill: C.text })}
      <rect x="${x + 150}" y="${yy}" width="230" height="28" rx="10" fill="#e8eef7"/>
      <rect x="${x + 150}" y="${yy}" width="${Math.round(230 * vals[i])}" height="28" rx="10" fill="${c}"/>`;
  }).join('');
}

function centralDiagram(kind, x, y, w, h) {
  if (kind === 'journey') {
    const labels = ['tarea', 'estado', 'algoritmo', 'test', 'evidencia'];
    return labels.map((label, i) => {
      const xx = x + 55 + i * 280;
      return `${chip(xx, y + 110, label, [C.blue, C.cyan, C.violet, C.green, C.orange][i])}${i < labels.length - 1 ? arrow(xx + 182, y + 148, xx + 252, y + 148, C.blue) : ''}`;
    }).join('') + t(x + w / 2, y + 275, 'La cifra final solo se entiende si toda la cadena queda visible.', { size: 28, weight: 900, anchor: 'middle', fill: C.blue });
  }
  if (kind === 'rlLoop' || kind === 'transition') {
    const labels = ['estado s', 'acción a', 'recompensa r', 'nuevo s′'];
    return labels.map((label, i) => {
      const xx = x + 100 + i * 310;
      return `${chip(xx, y + 112, label, [C.blue, C.cyan, C.orange, C.violet][i])}${i < labels.length - 1 ? arrow(xx + 185, y + 150, xx + 285, y + 150, C.blue) : ''}`;
    }).join('') + `${panel(x + 475, y + 230, 410, 70, { stroke: C.green, rx: 16 })}${t(x + 680, y + 276, 'se guarda como experiencia', { size: 25, weight: 900, anchor: 'middle', fill: C.green })}`;
  }
  if (kind === 'reward') {
    return `
      ${progressBars(x + 120, y + 72, ['sobrevive', 'rompe algo', 'limpia', 'generaliza'], [.85, .58, .32, .18], [C.amber, C.orange, C.green, C.violet])}
      ${arrow(x + 650, y + 150, x + 795, y + 150, C.blue)}
      ${panel(x + 820, y + 50, 470, 210, { stroke: C.green, rx: 18 })}
      ${t(x + 1055, y + 102, 'Éxito externo', { size: 34, weight: 900, anchor: 'middle', fill: C.green })}
      ${t(x + 1055, y + 157, 'limpiar niveles no vistos', { size: 27, weight: 800, anchor: 'middle', fill: C.text })}
      ${t(x + 1055, y + 211, 'no solo cobrar más', { size: 24, weight: 900, anchor: 'middle', fill: C.orange })}
    `;
  }
  if (kind === 'protocol') {
    return `
      ${chip(x + 120, y + 80, 'train', C.blue)}
      ${chip(x + 440, y + 80, 'validación', C.cyan)}
      ${chip(x + 790, y + 80, 'test', C.green)}
      ${chip(x + 1110, y + 80, 'OOD', C.orange)}
      ${arrow(x + 300, y + 118, x + 410, y + 118, C.blue)}
      ${arrow(x + 626, y + 118, x + 760, y + 118, C.blue)}
      ${arrow(x + 970, y + 118, x + 1080, y + 118, C.blue)}
      ${t(x + w / 2, y + 245, 'aprender ≠ decidir ≠ declarar', { size: 34, weight: 900, anchor: 'middle', fill: C.blue })}
    `;
  }
  if (kind === 'blind') {
    return `
      ${panel(x + 105, y + 55, 480, 230, { stroke: C.orange, rx: 18 })}
      ${t(x + 345, y + 105, 'observación ciega', { size: 31, weight: 900, anchor: 'middle', fill: C.orange })}
      ${chip(x + 170, y + 150, 'bola', C.blue)}${chip(x + 380, y + 150, 'pala', C.cyan)}
      ${t(x + 345, y + 250, 'intercepta, pero no apunta', { size: 24, weight: 900, anchor: 'middle', fill: C.text })}
      ${arrow(x + 625, y + 170, x + 755, y + 170, C.blue)}
      ${panel(x + 795, y + 55, 480, 230, { stroke: C.green, rx: 18 })}
      ${t(x + 1035, y + 105, 'estado completo', { size: 31, weight: 900, anchor: 'middle', fill: C.green })}
      ${board(x + 900, y + 140, 16)}
      ${t(x + 1035, y + 250, 've el objetivo espacial', { size: 24, weight: 900, anchor: 'middle', fill: C.text })}
    `;
  }
  if (kind === 'diagnosis') {
    const data = [['reloj', C.red, 'tiempo insuficiente'], ['shaping', C.orange, 'proxy cómodo'], ['observación', C.blue, 'falta el muro']];
    return data.map((d, i) => {
      const xx = x + 160 + i * 390;
      return `${panel(xx, y + 55, 300, 230, { stroke: d[1], rx: 18 })}${badge(String(i + 1), xx + 58, y + 112, d[1])}${t(xx + 180, y + 112, d[0], { size: 30, weight: 900, anchor: 'middle', fill: d[1] })}${lines(xx + 55, y + 175, d[2], { size: 25, max: 17, maxLines: 2, fill: C.text })}`;
    }).join('');
  }
  if (kind === 'recipe') {
    return `${panel(x + 90, y + 60, 430, 220, { stroke: C.orange, rx: 18 })}${t(x + 305, y + 112, 'antes', { size: 34, weight: 900, anchor: 'middle', fill: C.orange })}${progressBars(x + 135, y + 145, ['poca info', 'reloj fijo', 'shaping'], [.8, .55, .7], [C.orange, C.red, C.amber])}${arrow(x + 555, y + 170, x + 720, y + 170, C.blue)}${panel(x + 760, y + 60, 520, 220, { stroke: C.green, rx: 18 })}${t(x + 1020, y + 112, 'después', { size: 34, weight: 900, anchor: 'middle', fill: C.green })}${board(x + 810, y + 150, 14)}${miniNetwork(x + 1000, y + 190, [3, 4, 3], C.green, .75)}`;
  }
  if (kind === 'conquest') {
    return `${progressBars(x + 140, y + 75, ['agente ciego', 'receta nueva', 'test ID', 'OOD'], [.06, .62, .91, .74], [C.red, C.orange, C.green, C.violet])}${arrow(x + 620, y + 160, x + 780, y + 160, C.blue)}${panel(x + 820, y + 68, 430, 200, { stroke: C.green, rx: 18 })}${t(x + 1035, y + 130, 'causa antes que magia', { size: 32, weight: 900, anchor: 'middle', fill: C.green })}${lines(x + 900, y + 175, 'cada mejora elimina un fallo de formulación', { size: 25, max: 28, maxLines: 2 })}`;
  }
  if (kind === 'state') {
    return `${chip(x + 115, y + 98, 'estado real', C.blue)}${arrow(x + 300, y + 136, x + 420, y + 136, C.blue)}${chip(x + 450, y + 98, 'observación', C.cyan)}${arrow(x + 635, y + 136, x + 755, y + 136, C.blue)}${panel(x + 790, y + 58, 240, 170, { stroke: C.violet, rx: 16 })}${t(x + 910, y + 112, 'tensor', { size: 31, weight: 900, anchor: 'middle', fill: C.violet })}${board(x + 833, y + 140, 11)}${arrow(x + 1060, y + 136, x + 1180, y + 136, C.blue)}${chip(x + 1210, y + 98, 'decisión', C.green)}`;
  }
  if (kind === 'return') {
    const vals = [.9, .7, .5, .35, .2];
    return vals.map((v, i) => `<rect x="${x + 160 + i * 190}" y="${y + 165 - v * 115}" width="85" height="${v * 115}" rx="10" fill="${[C.orange, C.amber, C.green, C.cyan, C.violet][i]}"/><text x="${x + 203 + i * 190}" y="${y + 215}" font-size="20" font-weight="800" text-anchor="middle" fill="${C.text}">t+${i}</text>`).join('') + `${panel(x + 1120, y + 80, 260, 140, { stroke: C.violet, rx: 16 })}${t(x + 1250, y + 137, 'G = Σ γᵗ rₜ', { size: 32, weight: 900, anchor: 'middle', fill: C.violet })}`;
  }
  if (kind === 'explore') {
    return `${gauge(x + 250, y + 145, C.cyan)}${t(x + 250, y + 260, 'explorar', { size: 28, weight: 900, anchor: 'middle', fill: C.cyan })}${arrow(x + 390, y + 155, x + 560, y + 155, C.blue)}${progressBars(x + 600, y + 80, ['inicio', 'mitad', 'final'], [.9, .52, .18], [C.cyan, C.violet, C.green])}${arrow(x + 1030, y + 155, x + 1160, y + 155, C.blue)}${gauge(x + 1280, y + 145, C.green)}${t(x + 1280, y + 260, 'explotar', { size: 28, weight: 900, anchor: 'middle', fill: C.green })}`;
  }
  if (kind === 'replay') {
    return `${panel(x + 115, y + 60, 430, 220, { stroke: C.blue, rx: 18 })}${t(x + 330, y + 110, 'replay buffer', { size: 32, weight: 900, anchor: 'middle', fill: C.blue })}${board(x + 190, y + 150, 13)}${board(x + 330, y + 150, 13)}${arrow(x + 585, y + 170, x + 720, y + 170, C.blue)}${panel(x + 760, y + 60, 430, 220, { stroke: C.green, rx: 18 })}${t(x + 975, y + 110, 'target network', { size: 32, weight: 900, anchor: 'middle', fill: C.green })}${miniNetwork(x + 840, y + 190, [3, 4, 3], C.green, .8)}${t(x + 975, y + 260, 'copia lenta', { size: 24, weight: 900, anchor: 'middle', fill: C.text })}`;
  }
  if (kind === 'training') {
    const labels = ['jugar', 'guardar', 'actualizar', 'evaluar'];
    return labels.map((label, i) => {
      const a = (Math.PI * 2 * i) / labels.length - Math.PI / 2;
      const cx = x + w / 2 + Math.cos(a) * 410;
      const cy = y + h / 2 + Math.sin(a) * 110;
      return `${chip(cx - 85, cy - 38, label, [C.blue, C.cyan, C.violet, C.green][i])}`;
    }).join('') + `${arrow(x + 895, y + 90, x + 1120, y + 178, C.blue)}${arrow(x + 1120, y + 222, x + 895, y + 310, C.blue)}${arrow(x + 590, y + 310, x + 365, y + 222, C.blue)}${arrow(x + 365, y + 178, x + 590, y + 90, C.blue)}`;
  }
  if (kind === 'dqn') {
    return `${panel(x + 130, y + 60, 360, 220, { stroke: C.blue, rx: 18 })}${t(x + 310, y + 112, 'estado', { size: 32, weight: 900, anchor: 'middle', fill: C.blue })}${board(x + 215, y + 150, 14)}${arrow(x + 520, y + 170, x + 690, y + 170, C.blue)}${miniNetwork(x + 720, y + 170, [4, 5, 3], C.violet, 1)}${arrow(x + 1040, y + 170, x + 1140, y + 170, C.blue)}${progressBars(x + 1180, y + 95, ['izq', 'quieto', 'der'], [.45, .72, .58], [C.blue, C.green, C.orange])}`;
  }
  if (kind === 'ppo') {
    return `${panel(x + 120, y + 65, 330, 220, { stroke: C.violet, rx: 18 })}${t(x + 285, y + 115, 'actor', { size: 32, weight: 900, anchor: 'middle', fill: C.violet })}${miniNetwork(x + 170, y + 190, [3, 4, 3], C.violet, .8)}${panel(x + 520, y + 65, 330, 220, { stroke: C.green, rx: 18 })}${t(x + 685, y + 115, 'crítico', { size: 32, weight: 900, anchor: 'middle', fill: C.green })}${gauge(x + 685, y + 170, C.green)}${panel(x + 940, y + 65, 430, 220, { stroke: C.orange, rx: 18 })}${t(x + 1155, y + 115, 'clip', { size: 32, weight: 900, anchor: 'middle', fill: C.orange })}<rect x="${x + 1005}" y="${y + 160}" width="300" height="34" rx="12" fill="#e8eef7"/><rect x="${x + 1115}" y="${y + 160}" width="80" height="34" fill="${C.orange}" opacity=".7"/>`;
  }
  if (kind === 'world') {
    return `${chip(x + 145, y + 85, 'entorno real', C.green)}${arrow(x + 330, y + 123, x + 520, y + 123, C.green)}${chip(x + 550, y + 85, 'modelo', C.orange)}${arrow(x + 735, y + 123, x + 925, y + 123, C.orange, 5, true)}${chip(x + 955, y + 85, 'rollouts', C.violet)}${arrow(x + 1140, y + 123, x + 1280, y + 123, C.violet)}${chip(x + 1310, y + 85, 'aprendizaje', C.blue)}${t(x + 850, y + 245, 'más práctica, pero con riesgo de sesgo', { size: 30, weight: 900, anchor: 'middle', fill: C.orange })}`;
  }
  if (kind === 'rnn') {
    return `${['o₁', 'o₂', 'o₃', 'o₄'].map((l, i) => `${chip(x + 150 + i * 180, y + 92, l, C.blue)}${i < 3 ? arrow(x + 325 + i * 180, y + 130, x + 405 + i * 180, y + 130, C.blue) : ''}`).join('')}${arrow(x + 860, y + 130, x + 1010, y + 130, C.violet)}${panel(x + 1040, y + 70, 300, 155, { stroke: C.violet, rx: 18 })}${t(x + 1190, y + 125, 'LSTM', { size: 34, weight: 900, anchor: 'middle', fill: C.violet })}${t(x + 1190, y + 175, 'estado oculto', { size: 25, weight: 800, anchor: 'middle', fill: C.text })}`;
  }
  if (kind === 'compare') {
    const labels = [['DQN', C.blue], ['PPO', C.violet], ['SAC', C.teal], ['Modelos', C.orange]];
    return labels.map((d, i) => `${chip(x + 130 + i * 330, y + 78, d[0], d[1])}${miniBars(x + 168 + i * 330, y + 180, d[1])}`).join('') + t(x + w / 2, y + 285, 'valor · política · entropía · mundo aprendido', { size: 30, weight: 900, anchor: 'middle', fill: C.blue });
  }
  if (kind === 'stats') {
    return `${progressBars(x + 100, y + 65, ['media', 'IQM', 'semillas >80', 'colapsos'], [.72, .68, .55, .15], [C.blue, C.green, C.violet, C.red])}${panel(x + 660, y + 60, 320, 210, { stroke: C.violet, rx: 18 })}${t(x + 820, y + 115, 'dispersión', { size: 31, weight: 900, anchor: 'middle', fill: C.violet })}${gauge(x + 820, y + 170, C.violet)}${panel(x + 1060, y + 60, 300, 210, { stroke: C.green, rx: 18 })}${t(x + 1210, y + 120, '5 semillas', { size: 32, weight: 900, anchor: 'middle', fill: C.green })}${vectorDots(x + 1170, y + 145, 5, C.green)}`;
  }
  if (kind === 'ablation') {
    return `${chip(x + 150, y + 95, 'receta completa', C.green)}${arrow(x + 340, y + 133, x + 510, y + 133, C.blue)}${chip(x + 545, y + 95, 'quitar pieza', C.orange)}${arrow(x + 735, y + 133, x + 905, y + 133, C.blue)}${chip(x + 940, y + 95, 'medir caída', C.red)}${arrow(x + 1130, y + 133, x + 1300, y + 133, C.blue)}${chip(x + 1330, y + 95, 'causa', C.violet)}${t(x + 850, y + 260, 'una variable cada vez', { size: 31, weight: 900, anchor: 'middle', fill: C.blue })}`;
  }
  if (kind === 'repro') {
    const labels = ['generador', 'run', 'ledger', 'figura'];
    return labels.map((label, i) => {
      const xx = x + 150 + i * 340;
      return `${chip(xx, y + 95, label, [C.blue, C.cyan, C.green, C.orange][i])}${i < 3 ? arrow(xx + 185, y + 133, xx + 315, y + 133, C.blue) : ''}`;
    }).join('') + `${panel(x + 615, y + 220, 470, 64, { stroke: C.green, rx: 16 })}${t(x + 850, y + 262, 'hash congela condiciones', { size: 27, weight: 900, anchor: 'middle', fill: C.green })}`;
  }
  if (kind === 'app') {
    return `${panel(x + 90, y + 55, 330, 220, { stroke: C.blue, rx: 18 })}${t(x + 255, y + 105, 'inspector', { size: 30, weight: 900, anchor: 'middle', fill: C.blue })}${board(x + 175, y + 145, 13)}${panel(x + 500, y + 55, 330, 220, { stroke: C.orange, rx: 18 })}${t(x + 665, y + 105, 'curvas', { size: 30, weight: 900, anchor: 'middle', fill: C.orange })}${bars(x + 570, y + 140, C.orange)}${panel(x + 910, y + 55, 330, 220, { stroke: C.green, rx: 18 })}${t(x + 1075, y + 105, 'ledger', { size: 30, weight: 900, anchor: 'middle', fill: C.green })}${vectorDots(x + 1030, y + 130, 5, C.green)}`;
  }
  if (kind === 'atlas') {
    const items = [['tarea', C.blue], ['estado', C.cyan], ['recompensa', C.orange], ['algoritmo', C.violet], ['evidencia', C.green]];
    return items.map((it, i) => {
      const a = -Math.PI / 2 + i * (Math.PI * 2 / items.length);
      const cx = x + w / 2 + Math.cos(a) * 420;
      const cy = y + h / 2 + Math.sin(a) * 115;
      return `${chip(cx - 85, cy - 38, it[0], it[1])}${arrow(x + w / 2, y + h / 2, cx - 15, cy - 5, it[1], 3)}`;
    }).join('') + `${badge('DRL', x + w / 2, y + h / 2, C.blue)}`;
  }
  return centralDiagram('journey', x, y, w, h);
}

function generic(sec) {
  const mainColor = color(sec.accent ?? 'blue');
  return frame(`
    ${panel(18, 22, 1664, 1156, { stroke: '#b7cdf6', rx: 24 })}
    ${sectionTitle('1', sec.q, 68, 92, mainColor)}
    ${panel(48, 132, 1540, 205, { stroke: '#b7cdf6', rx: 18 })}
    ${smallVisual(sec.icon ?? 'badge1', 165, 220, mainColor)}
    ${lines(310, 178, sec.idea, { size: 28, max: 82, maxLines: 3, fill: C.text })}
    ${t(310, 292, sec.keyline, { size: 27, weight: 900, fill: mainColor })}

    ${sectionTitle('2', sec.diagramTitle, 68, 420, C.blue)}
    ${panel(48, 457, 1540, 360, { stroke: '#b7cdf6', rx: 18 })}
    ${centralDiagram(sec.visual, 70, 492, 1495, 300)}

    ${sectionTitle('3', sec.bottomTitle, 68, 890, C.blue)}
    ${panel(48, 927, 1540, 220, { stroke: '#b7cdf6', rx: 18 })}
    ${sec.principles.map((p, i) => principleV(90 + i * 384, 952, 335, p.t, p.b, color(p.c), p.k)).join('')}
  `);
}

const sections = [
  ['0.3', 'codex4_ch0_3_mapa_laboratorio', generic({
    accent: 'blue', icon: 'badge1', q: '¿Qué mapa necesitamos antes de medir?', idea: 'El laboratorio solo se entiende si conectamos tarea, estado, algoritmo, evaluación y evidencia en una misma cadena.', keyline: 'Idea clave: una cifra sin mapa causal no explica nada.', diagramTitle: 'Del Arkanoid al resultado defendible', visual: 'journey', bottomTitle: 'Principios de lectura',
    principles: [{ t: 'Separar capas', b: 'tarea, método y evidencia.', c: 'blue', k: 'blocks' }, { t: 'Mirar estado', b: 'qué sabe el agente.', c: 'cyan', k: 'board' }, { t: 'Medir test', b: 'no solo ver demos.', c: 'green', k: 'bars' }, { t: 'Auditar ruta', b: 'del run a la figura.', c: 'orange', k: 'gradient' }],
  }), 'Cierre tipo infografía de 0.3: mapa editorial del laboratorio desde tarea hasta evidencia.'],
  ['1.1', 'codex4_ch1_1_consecuencias', generic({ accent: 'blue', q: '¿Cómo aprende sin profesor?', idea: 'En RL no hay etiqueta correcta: el agente prueba, recibe consecuencias y convierte cada paso en experiencia.', keyline: 'Idea clave: aprender es acumular transiciones.', diagramTitle: 'La transición mínima', visual: 'transition', bottomTitle: 'Qué mirar', principles: [{ t: 'Estado', b: 'lo que entra en la red.', c: 'blue', k: 'board' }, { t: 'Acción', b: 'la decisión tomada.', c: 'cyan', k: 'badge1' }, { t: 'Recompensa', b: 'señal inmediata.', c: 'orange', k: 'bars' }, { t: 'Episodio', b: 'historia completa.', c: 'green', k: 'gradient' }] }), 'Cierre tipo infografía de 1.1: aprendizaje por consecuencias como transición y episodio.'],
  ['1.2', 'codex4_ch1_2_recompensa_exito', generic({ accent: 'orange', icon: 'gauge', q: '¿Por qué recompensa no es éxito?', idea: 'La recompensa guía el entrenamiento, pero puede subir por supervivencia, rebotes o shaping sin limpiar el nivel.', keyline: 'Idea clave: el proxy ayuda; el test decide.', diagramTitle: 'Escalera de exigencia', visual: 'reward', bottomTitle: 'Lectura sana', principles: [{ t: 'Proxy', b: 'puede contar una historia falsa.', c: 'orange', k: 'gauge' }, { t: 'Objetivo', b: 'limpiar niveles.', c: 'green', k: 'badge1' }, { t: 'Atajo', b: 'sobrevivir puede engañar.', c: 'red', k: 'bars' }, { t: 'Generalizar', b: 'probar no visto.', c: 'violet', k: 'gradient' }] }), 'Cierre tipo infografía de 1.2: recompensa, éxito externo y escalera de evaluación.'],
  ['1.3', 'codex4_ch1_3_protocolo', generic({ accent: 'green', icon: 'scale', q: '¿Cuándo un examen está limpio?', idea: 'Train aprende, validación ayuda a decidir y test declara. Mezclarlos convierte el resultado en autoengaño.', keyline: 'Idea clave: el juez no entrena al competidor.', diagramTitle: 'Split y generalización', visual: 'protocol', bottomTitle: 'Antídotos', principles: [{ t: 'Train', b: 'solo para aprender.', c: 'blue', k: 'board' }, { t: 'Validación', b: 'decide sin declarar.', c: 'cyan', k: 'badge1' }, { t: 'Test', b: 'declara una vez.', c: 'green', k: 'gradient' }, { t: 'OOD', b: 'mide distancia real.', c: 'orange', k: 'bars' }] }), 'Cierre tipo infografía de 1.3: protocolo limpio con train, validación, test y OOD.'],
  ['1.4', 'codex4_ch1_4_agente_ciego', generic({ accent: 'orange', q: '¿Por qué falló el agente ciego?', idea: 'El agente veía la bola y la pala, pero no veía el objetivo espacial. No falló por tonto: falló por incompleto.', keyline: 'Idea clave: lo ausente del estado no se aprende.', diagramTitle: 'Observación incompleta frente a estado útil', visual: 'blind', bottomTitle: 'Diagnóstico', principles: [{ t: 'Intercepta', b: 'puede sobrevivir.', c: 'blue', k: 'gauge' }, { t: 'No apunta', b: 'falta el muro.', c: 'red', k: 'board' }, { t: 'Techo', b: 'lo fija el estado.', c: 'orange', k: 'scale' }, { t: 'Arreglo', b: 'mostrar objetivo.', c: 'green', k: 'badge86' }] }), 'Cierre tipo infografía de 1.4: límite de información del agente ciego.'],
  ['1.5', 'codex4_ch1_5_tres_muros', generic({ accent: 'red', icon: 'gauge', q: '¿Cómo se diagnostican los tres muros?', idea: 'Cada fallo se lee como síntoma, prueba, causa y arreglo; así evitamos culpar al algoritmo por una mala formulación.', keyline: 'Idea clave: diagnosticar es encontrar la causa controlable.', diagramTitle: 'Tres causas, tres arreglos', visual: 'diagnosis', bottomTitle: 'Método clínico', principles: [{ t: 'Síntoma', b: 'observar antes de explicar.', c: 'red', k: 'gauge' }, { t: 'Prueba', b: 'aislar hipótesis.', c: 'blue', k: 'gradient' }, { t: 'Causa', b: 'mover la culpa.', c: 'orange', k: 'scale' }, { t: 'Arreglo', b: 'medir después.', c: 'green', k: 'bars' }] }), 'Cierre tipo infografía de 1.5: diagnóstico causal de reloj, shaping y observación.'],
  ['1.6', 'codex4_ch1_6_receta', generic({ accent: 'green', icon: 'badge86', q: '¿Qué cambió la receta?', idea: 'La solución alineó estado, tiempo, recompensa, red y evaluación. No es un truco: es una reformulación completa.', keyline: 'Idea clave: mejorar la pregunta mejora el aprendizaje.', diagramTitle: 'Antes y después de la formulación', visual: 'recipe', bottomTitle: 'Piezas causales', principles: [{ t: 'Estado 86', b: 'ver mapa y cinemática.', c: 'blue', k: 'badge86' }, { t: 'Reloj justo', b: 'tiempo proporcional.', c: 'orange', k: 'gauge' }, { t: 'Sin shaping', b: 'menos proxy cómodo.', c: 'red', k: 'bars' }, { t: 'Test limpio', b: 'evidencia real.', c: 'green', k: 'gradient' }] }), 'Cierre tipo infografía de 1.6: receta causal que vuelve aprendible la tarea.'],
  ['1.7', 'codex4_ch1_7_conquista', generic({ accent: 'green', q: '¿Por qué la conquista fue causal?', idea: 'El salto de rendimiento tiene explicación: se arregló qué veía el agente, qué señal seguía y cómo se evaluaba.', keyline: 'Idea clave: primero causas, después porcentajes.', diagramTitle: 'Del 0% al resultado defendible', visual: 'conquest', bottomTitle: 'Puente hacia teoría', principles: [{ t: 'Estado', b: 'ya contiene objetivo.', c: 'blue', k: 'board' }, { t: 'Valor', b: 'propaga futuro.', c: 'violet', k: 'formula' }, { t: 'Política', b: 'elige con evidencia.', c: 'green', k: 'network' }, { t: 'Protocolo', b: 'declara limpio.', c: 'orange', k: 'gradient' }] }), 'Cierre tipo infografía de 1.7: conquista como resultado causal, no mágico.'],
  ['2.1', 'codex4_ch2_1_transicion', generic({ accent: 'blue', q: '¿Cuál es el átomo de RL?', idea: 'El aprendizaje nace de transiciones: estado, acción, recompensa, siguiente estado y final de episodio.', keyline: 'Idea clave: el agente fabrica su propio dataset.', diagramTitle: 'Paso aislado → experiencia útil', visual: 'transition', bottomTitle: 'Para no perderse', principles: [{ t: 's', b: 'lo que observa.', c: 'blue', k: 'board' }, { t: 'a', b: 'lo que decide.', c: 'cyan', k: 'badge1' }, { t: 'r', b: 'lo que cobra.', c: 'orange', k: 'bars' }, { t: 's′', b: 'dónde termina.', c: 'violet', k: 'gradient' }] }), 'Infografía de cierre de 2.1: transición como unidad de experiencia.'],
  ['2.2', 'codex4_ch2_2_estado_observacion', generic({ accent: 'violet', q: '¿Veo suficiente para decidir?', idea: 'Estado real, observación y tensor no son lo mismo. Markov pregunta si el presente contiene toda la información relevante.', keyline: 'Idea clave: la observación fija el techo del agente.', diagramTitle: 'Estado real → observación → tensor', visual: 'state', bottomTitle: 'Checklist mental', principles: [{ t: 'Markov', b: 'presente suficiente.', c: 'green', k: 'gradient' }, { t: 'POMDP', b: 'falta información.', c: 'orange', k: 'gauge' }, { t: 'Tensor', b: 'números, no objetos.', c: 'violet', k: 'board' }, { t: 'Memoria', b: 'solo si aporta.', c: 'blue', k: 'network' }] }), 'Infografía de cierre de 2.2: estado, observación, tensor y memoria.'],
  ['2.3', 'codex4_ch2_3_retorno', generic({ accent: 'orange', icon: 'gauge', q: '¿Por qué mirar el futuro?', idea: 'La recompensa inmediata es local; el retorno suma consecuencias futuras con descuento gamma.', keyline: 'Idea clave: el agente aprende a preferir trayectorias.', diagramTitle: 'Calculadora temporal de retorno', visual: 'return', bottomTitle: 'No confundas', principles: [{ t: 'r ahora', b: 'señal local.', c: 'orange', k: 'bars' }, { t: 'γ', b: 'horizonte del futuro.', c: 'blue', k: 'gauge' }, { t: 'G', b: 'suma descontada.', c: 'violet', k: 'formula' }, { t: 'crédito', b: 'culpa hacia atrás.', c: 'green', k: 'gradient' }] }), 'Infografía de cierre de 2.3: recompensa, retorno y descuento.'],
  ['2.4', 'codex4_ch2_4_bellman', bellman(), 'Infografía de cierre de 2.4: Bellman como target, TD-error y actualización.'],
  ['2.5', 'codex4_ch2_5_exploracion', generic({ accent: 'cyan', icon: 'gauge', q: '¿Explorar es meter ruido?', idea: 'Explorar controla qué datos aparecerán. Explotar usa lo aprendido, pero puede cerrar rutas útiles demasiado pronto.', keyline: 'Idea clave: explorar es diseñar el dataset futuro.', diagramTitle: 'Explorar → explotar', visual: 'explore', bottomTitle: 'Preguntas sanas', principles: [{ t: 'ε', b: 'ruido explícito.', c: 'blue', k: 'gauge' }, { t: 'Entropía', b: 'variedad útil.', c: 'violet', k: 'bars' }, { t: 'Decay', b: 'bajar con criterio.', c: 'orange', k: 'gradient' }, { t: 'Greedy test', b: 'medir sin ruido.', c: 'green', k: 'badge1' }] }), 'Infografía de cierre de 2.5: exploración como control de datos.'],
  ['2.6', 'codex4_ch2_6_replay_target', generic({ accent: 'blue', q: '¿Por qué DQN necesita estabilizadores?', idea: 'Los pasos consecutivos están correlacionados y la diana de Bellman se mueve. Replay y target network atacan esos dos problemas.', keyline: 'Idea clave: la estabilidad también se diseña.', diagramTitle: 'Memoria diversa + diana lenta', visual: 'replay', bottomTitle: 'Dos problemas', principles: [{ t: 'Correlación', b: 'datos pegados.', c: 'red', k: 'bars' }, { t: 'Replay', b: 'mezcla experiencia.', c: 'blue', k: 'board' }, { t: 'Target', b: 'copia lenta.', c: 'green', k: 'network' }, { t: 'Bellman', b: 'diana menos nerviosa.', c: 'violet', k: 'formula' }] }), 'Infografía de cierre de 2.6: replay buffer y target network.'],
  ['2.7', 'codex4_ch2_7_red_tensor', tensor86(), 'Infografía de cierre de 2.7: arquitectura de dos ramas desde tensor 86 hasta cabezas.'],
  ['2.8', 'codex4_ch2_8_entrenar_rl', generic({ accent: 'orange', q: '¿Por qué entrenar RL es distinto?', idea: 'En supervisado el dataset suele estar fijo. En RL la política cambia los datos que verá después.', keyline: 'Idea clave: los datos se mueven con el agente.', diagramTitle: 'Ciclo de entrenamiento', visual: 'training', bottomTitle: 'Señales de salud', principles: [{ t: 'Jugar', b: 'recoger experiencia.', c: 'blue', k: 'board' }, { t: 'Guardar', b: 'replay buffer.', c: 'cyan', k: 'blocks' }, { t: 'Actualizar', b: 'gradiente.', c: 'violet', k: 'gradient' }, { t: 'Evaluar', b: 'greedy y test.', c: 'green', k: 'gauge' }] }), 'Infografía de cierre de 2.8: entrenamiento con distribución de datos cambiante.'],
  ['3.1', 'codex4_ch3_1_dqn', generic({ accent: 'blue', q: '¿Cómo decide DQN?', idea: 'DQN estima el retorno esperado de cada acción y decide comparando Q-values.', keyline: 'Idea clave: elegir es comparar futuros estimados.', diagramTitle: 'Estado → red → Q-values', visual: 'dqn', bottomTitle: 'Piezas DQN', principles: [{ t: 'Q(s,a)', b: 'promesa de futuro.', c: 'blue', k: 'formula' }, { t: 'Replay', b: 'memoria mezclada.', c: 'cyan', k: 'board' }, { t: 'Target', b: 'diana lenta.', c: 'green', k: 'network' }, { t: 'argmax', b: 'acción mayor Q.', c: 'orange', k: 'bars' }] }), 'Infografía de cierre de 3.1: DQN como comparación de Q-values.'],
  ['3.2', 'codex4_ch3_2_ppo', generic({ accent: 'violet', q: '¿Cómo mejora PPO sin romperse?', idea: 'PPO usa actor y crítico, pero limita el tamaño de la actualización para no destruir la política anterior.', keyline: 'Idea clave: mejorar sí, dar volantazos no.', diagramTitle: 'Actor, crítico y zona clip', visual: 'ppo', bottomTitle: 'Mecanismo', principles: [{ t: 'Actor', b: 'propone acciones.', c: 'violet', k: 'network' }, { t: 'Crítico', b: 'estima ventaja.', c: 'green', k: 'gauge' }, { t: 'Ratio', b: 'nueva contra vieja.', c: 'blue', k: 'formula' }, { t: 'Clip', b: 'limita cambios.', c: 'orange', k: 'bars' }] }), 'Infografía de cierre de 3.2: PPO como actor-crítico con recorte prudente.'],
  ['3.3', 'codex4_ch3_3_sac', sac(), 'Infografía de cierre de 3.3: SAC como equilibrio entre retorno, entropía y críticos prudentes.'],
  ['3.4', 'codex4_ch3_4_world_model', generic({ accent: 'orange', q: '¿Para qué imaginar transiciones?', idea: 'Un World Model aprende una maqueta del entorno para practicar barato, siempre que el sesgo no crezca demasiado.', keyline: 'Idea clave: imaginar ayuda mientras la maqueta no miente.', diagramTitle: 'Carril real y carril imaginado', visual: 'world', bottomTitle: 'Riesgos', principles: [{ t: 'Modelo', b: 'predice mundo.', c: 'orange', k: 'blocks' }, { t: 'Real', b: 'ancla fiable.', c: 'green', k: 'gradient' }, { t: 'Imaginado', b: 'práctica barata.', c: 'violet', k: 'network' }, { t: 'Sesgo', b: 'error acumulado.', c: 'red', k: 'gauge' }] }), 'Infografía de cierre de 3.4: World Model con experiencia real e imaginada.'],
  ['3.5', 'codex4_ch3_5_wmrnn', generic({ accent: 'violet', q: '¿Cuándo ayuda la memoria?', idea: 'Una RNN resume historia. Ayuda si la observación actual es parcial, pero puede sobrar si el estado ya es rico.', keyline: 'Idea clave: memoria no sustituye una buena observación.', diagramTitle: 'Secuencia → estado oculto', visual: 'rnn', bottomTitle: 'Regla práctica', principles: [{ t: 'Secuencia', b: 'varias observaciones.', c: 'blue', k: 'gradient' }, { t: 'LSTM', b: 'resume historia.', c: 'violet', k: 'network' }, { t: 'Coste', b: 'más complejidad.', c: 'orange', k: 'gauge' }, { t: 'Test', b: 'decide si aporta.', c: 'green', k: 'bars' }] }), 'Infografía de cierre de 3.5: memoria recurrente útil frente a complejidad sobrante.'],
  ['3.6', 'codex4_ch3_6_algoritmos', generic({ accent: 'violet', q: '¿Cómo comparar algoritmos?', idea: 'La comparación útil pregunta qué representa cada red, cómo decide, cómo explora y qué riesgo trae.', keyline: 'Idea clave: comparar algoritmos es comparar compromisos.', diagramTitle: 'Cinco métodos, tres preguntas', visual: 'compare', bottomTitle: 'Matriz mental', principles: [{ t: 'Valor', b: 'DQN estima Q.', c: 'blue', k: 'formula' }, { t: 'Política', b: 'PPO aprende π.', c: 'violet', k: 'network' }, { t: 'Entropía', b: 'SAC regula variedad.', c: 'orange', k: 'thermo' }, { t: 'Mundo', b: 'modelos imaginan.', c: 'green', k: 'blocks' }] }), 'Infografía de cierre de 3.6: matriz visual de algoritmos y compromisos.'],
  ['4.1', 'codex4_ch4_1_veredicto', generic({ accent: 'green', icon: 'scale', q: '¿Por qué una media no basta?', idea: 'La media resume, pero dispersión, colapsos, semillas y coste dicen si un resultado se puede defender.', keyline: 'Idea clave: evidencia = cifra + incertidumbre + condiciones.', diagramTitle: 'Tablero de lectura estadística', visual: 'stats', bottomTitle: 'No declares sin', principles: [{ t: 'Semillas', b: 'varianza real.', c: 'green', k: 'badge1' }, { t: 'Dispersión', b: 'estabilidad.', c: 'violet', k: 'gauge' }, { t: 'Colapsos', b: 'colas malas.', c: 'red', k: 'bars' }, { t: 'Coste', b: 'presupuesto.', c: 'orange', k: 'gradient' }] }), 'Infografía de cierre de 4.1: lectura estadística de media, dispersión y colapsos.'],
  ['4.2', 'codex4_ch4_2_ablacion', generic({ accent: 'orange', q: '¿Qué enseña una ablación?', idea: 'Quitar una pieza y medir la caída distingue una pieza causal de una decoración técnica.', keyline: 'Idea clave: quitar bien enseña más que añadir sin medir.', diagramTitle: 'Receta → quitar → medir → causa', visual: 'ablation', bottomTitle: 'Reglas', principles: [{ t: 'Una pieza', b: 'no cinco a la vez.', c: 'orange', k: 'badge1' }, { t: 'Baseline', b: 'receta completa.', c: 'green', k: 'gradient' }, { t: 'Métrica', b: 'éxito, no relato.', c: 'blue', k: 'bars' }, { t: 'Causa', b: 'con prudencia.', c: 'violet', k: 'scale' }] }), 'Infografía de cierre de 4.2: ablación como causalidad práctica.'],
  ['4.3', 'codex4_ch4_3_reproducible', generic({ accent: 'green', q: '¿Qué rastro deja una cifra confiable?', idea: 'Cada punto debe poder viajar hacia atrás: figura, agregación, ledger, run, semilla y generador.', keyline: 'Idea clave: sin trazabilidad, una cifra es una frase.', diagramTitle: 'Ruta reproducible', visual: 'repro', bottomTitle: 'Checklist', principles: [{ t: 'Generador', b: 'niveles controlados.', c: 'blue', k: 'board' }, { t: 'Semillas', b: 'runs independientes.', c: 'violet', k: 'badge1' }, { t: 'Ledger', b: 'filas trazables.', c: 'green', k: 'gradient' }, { t: 'Hash', b: 'condiciones fijas.', c: 'orange', k: 'formula' }] }), 'Infografía de cierre de 4.3: ruta reproducible desde generador hasta figura.'],
  ['4.4', 'codex4_ch4_4_app', generic({ accent: 'blue', q: '¿Qué enseña la app?', idea: 'La interfaz ayuda a entender mecanismos en vivo, pero una partida bonita no reemplaza el protocolo experimental.', keyline: 'Idea clave: la app explica; el protocolo certifica.', diagramTitle: 'Demo pedagógica frente a evidencia', visual: 'app', bottomTitle: 'Uso correcto', principles: [{ t: 'Inspector', b: 'ver decisión.', c: 'blue', k: 'board' }, { t: 'Curvas', b: 'tendencia, no veredicto.', c: 'orange', k: 'bars' }, { t: 'Transición', b: 'átomo de aprendizaje.', c: 'cyan', k: 'gradient' }, { t: 'Ledger', b: 'evidencia trazable.', c: 'green', k: 'badge1' }] }), 'Infografía de cierre de 4.4: lectura pedagógica de la app sin confundir demo con evidencia.'],
  ['5.1', 'codex4_ch5_1_atlas_final', generic({ accent: 'blue', q: '¿Qué sobrevive fuera de Arkanoid?', idea: 'Lo transferible no es el juego: es formular bien, elegir mecanismo, medir con protocolo y explicar con visuales auditables.', keyline: 'Idea clave: buen DRL = tarea + evidencia + explicación.', diagramTitle: 'Atlas final transferible', visual: 'atlas', bottomTitle: 'Regla final', principles: [{ t: 'Formular', b: 'antes de entrenar.', c: 'blue', k: 'badge1' }, { t: 'Medir', b: 'con protocolo.', c: 'green', k: 'scale' }, { t: 'Comparar', b: 'por compromiso.', c: 'violet', k: 'bars' }, { t: 'Explicar', b: 'visual y auditable.', c: 'orange', k: 'gradient' }] }), 'Infografía de cierre de 5.1: atlas final de lecciones transferibles.'],
];

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(qaDir, { recursive: true });

for (const [name, svg] of [
  ['codex4_muestra_ch3_3_sac', sac()],
  ['codex4_muestra_ch2_7_red_tensor', tensor86()],
  ['codex4_muestra_ch2_4_bellman', bellman()],
]) {
  const svgPath = path.join(outDir, `${name}.svg`);
  const pngPath = path.join(outDir, `${name}.png`);
  const qaPath = path.join(qaDir, `${name}.png`);
  fs.writeFileSync(svgPath, svg);
  const r = spawnSync('rsvg-convert', ['-w', String(W), '-h', String(H), svgPath, '-o', pngPath], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`${name}: ${r.stderr || r.stdout}`);
  fs.copyFileSync(pngPath, qaPath);
}

fs.mkdirSync(qaFullDir, { recursive: true });
for (const [, name, svg] of sections) {
  const svgPath = path.join(outDir, `${name}.svg`);
  const pngPath = path.join(outDir, `${name}.png`);
  const qaPath = path.join(qaFullDir, `${name}.png`);
  fs.writeFileSync(svgPath, svg);
  const r = spawnSync('rsvg-convert', ['-w', String(W), '-h', String(H), svgPath, '-o', pngPath], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`${name}: ${r.stderr || r.stdout}`);
  fs.copyFileSync(pngPath, qaPath);
}

let html = fs.readFileSync(reportPath, 'utf8');
for (const [key, name, , caption] of sections) {
  const marker = `<!-- codex4-panel:${key} -->`;
  const fig = `${marker}
<figure class="codex-fig codex4-panel"><img src="assets/${name}.png" alt="${esc(caption)}"><figcaption>${esc(caption)}</figcaption></figure>`;
  const safe = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<!-- codex(?:2|3|4)-panel:${safe} -->\\n<figure class="codex-fig codex(?:2|3|4)-panel">[\\s\\S]*?<\\/figure>`, 'm');
  html = html.replace(re, fig);
}
fs.writeFileSync(reportPath, html);

console.log(`Generated ${sections.length} codex4 editorial infographics and updated HTML.`);
