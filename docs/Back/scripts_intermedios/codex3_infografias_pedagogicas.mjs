import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const assetsDir = path.join(root, 'docs', 'assets');
const reportPath = path.join(root, 'docs', 'report_v3_version_codex.html');
const qaDir = path.join(root, 'docs', 'qa_visual_codex', 'refuerzo_codex3', 'png');

const W = 1491;
const H = 1055;

const C = {
  ink: '#061126',
  navy: '#082766',
  slate: '#334155',
  muted: '#64748b',
  line: '#cbd5e1',
  panel: '#ffffff',
  softBlue: '#f1f7ff',
  softGreen: '#effdf6',
  softTeal: '#effdfa',
  softViolet: '#f6f2ff',
  softAmber: '#fff8e7',
  softOrange: '#fff4ed',
  softRose: '#fff1f6',
  blue: '#1554b7',
  cyan: '#0786a0',
  teal: '#0f766e',
  green: '#0b8f50',
  violet: '#6d38c6',
  amber: '#b77905',
  orange: '#df5b14',
  rose: '#d63376',
  red: '#d32727',
};

const themes = {
  blue: [C.blue, C.softBlue],
  cyan: [C.cyan, '#eefbff'],
  teal: [C.teal, C.softTeal],
  green: [C.green, C.softGreen],
  violet: [C.violet, C.softViolet],
  amber: [C.amber, C.softAmber],
  orange: [C.orange, C.softOrange],
  rose: [C.rose, C.softRose],
  red: [C.red, '#fff1f1'],
  slate: [C.slate, '#f8fafc'],
};

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrap(text, max = 38) {
  const words = String(text ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
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

function textLines(x, y, lines, opts = {}) {
  const size = opts.size ?? 24;
  const gap = opts.gap ?? Math.round(size * 1.28);
  const weight = opts.weight ?? 500;
  const fill = opts.fill ?? C.slate;
  const anchor = opts.anchor ?? 'start';
  const family = opts.family ?? 'Arial, Helvetica, sans-serif';
  return lines.map((line, i) => (
    `<text x="${x}" y="${y + i * gap}" font-family="${family}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${fill}">${esc(line)}</text>`
  )).join('\n');
}

function textBlock(x, y, text, width, opts = {}) {
  const size = opts.size ?? 23;
  const max = opts.max ?? Math.floor(width / (size * 0.48));
  const lines = wrap(text, max).slice(0, opts.maxLines ?? 5);
  return textLines(x, y, lines, opts);
}

function panel(x, y, w, h, theme = 'blue', rx = 10) {
  const [color, soft] = themes[theme] ?? themes.blue;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${soft}" stroke="${color}" stroke-width="2"/>`;
}

function whitePanel(x, y, w, h, theme = 'blue', rx = 12) {
  const [color] = themes[theme] ?? themes.blue;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="#fff" stroke="${color}" stroke-width="2"/>`;
}

function header(title, subtitle) {
  return `
    <text x="${W / 2}" y="62" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="900" text-anchor="middle" fill="${C.ink}">${esc(title)}</text>
    ${textLines(W / 2, 98, wrap(subtitle, 95).slice(0, 2), { size: 23, weight: 500, anchor: 'middle', fill: C.ink })}
  `;
}

function icon(type, x, y, r, color) {
  const soft = '#eef4ff';
  if (type === 'target') {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${soft}"/><circle cx="${x}" cy="${y}" r="${r * .68}" fill="#fff" stroke="${color}" stroke-width="9"/><circle cx="${x}" cy="${y}" r="${r * .38}" fill="#fff" stroke="${color}" stroke-width="9"/><circle cx="${x}" cy="${y}" r="${r * .12}" fill="${color}"/><line x1="${x + r * .1}" y1="${y - r * .1}" x2="${x + r * .95}" y2="${y - r * .95}" stroke="${C.ink}" stroke-width="6"/><polygon points="${x + r * .95},${y - r * .95} ${x + r * .78},${y - r * .62} ${x + r * 1.12},${y - r * .77}" fill="${color}"/>`;
  }
  if (type === 'network') {
    let out = `<circle cx="${x}" cy="${y}" r="${r}" fill="${soft}"/>`;
    const cols = [-36, 0, 36];
    const rows = [-38, 0, 38];
    for (const cx of cols) for (const cy of rows) out += `<circle cx="${x + cx}" cy="${y + cy}" r="9" fill="#fff" stroke="${color}" stroke-width="4"/>`;
    for (let i = 0; i < cols.length - 1; i++) for (const a of rows) for (const b of rows) out += `<line x1="${x + cols[i]}" y1="${y + a}" x2="${x + cols[i + 1]}" y2="${y + b}" stroke="${color}" stroke-opacity=".28" stroke-width="2"/>`;
    return out;
  }
  if (type === 'check') {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${soft}"/><rect x="${x - 44}" y="${y - 50}" width="88" height="100" rx="12" fill="#fff" stroke="${color}" stroke-width="5"/><path d="M${x - 24} ${y - 2} L${x - 5} ${y + 19} L${x + 34} ${y - 25}" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><line x1="${x - 28}" y1="${y + 38}" x2="${x + 30}" y2="${y + 38}" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`;
  }
  if (type === 'scale') {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${soft}"/><line x1="${x}" y1="${y - 50}" x2="${x}" y2="${y + 45}" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/><line x1="${x - 52}" y1="${y - 18}" x2="${x + 52}" y2="${y - 18}" stroke="${color}" stroke-width="7" stroke-linecap="round"/><path d="M${x - 36} ${y - 18} L${x - 58} ${y + 34} L${x - 14} ${y + 34} Z" fill="#fff" stroke="${color}" stroke-width="5"/><path d="M${x + 36} ${y - 18} L${x + 14} ${y + 34} L${x + 58} ${y + 34} Z" fill="#fff" stroke="${color}" stroke-width="5"/><line x1="${x - 32}" y1="${y + 50}" x2="${x + 32}" y2="${y + 50}" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>`;
  }
  if (type === 'gauge') {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${soft}"/><path d="M${x - 62} ${y + 38} A72 72 0 0 1 ${x + 62} ${y + 38}" fill="none" stroke="#e2e8f0" stroke-width="17" stroke-linecap="round"/><path d="M${x - 62} ${y + 38} A72 72 0 0 1 ${x + 42} ${y - 28}" fill="none" stroke="${color}" stroke-width="17" stroke-linecap="round"/><line x1="${x}" y1="${y + 38}" x2="${x + 46}" y2="${y - 18}" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/><circle cx="${x}" cy="${y + 38}" r="10" fill="${C.ink}"/>`;
  }
  if (type === 'ledger') {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${soft}"/><rect x="${x - 46}" y="${y - 55}" width="92" height="110" rx="12" fill="#fff" stroke="${color}" stroke-width="5"/><line x1="${x - 24}" y1="${y - 28}" x2="${x + 26}" y2="${y - 28}" stroke="${color}" stroke-width="6" stroke-linecap="round"/><line x1="${x - 24}" y1="${y - 2}" x2="${x + 30}" y2="${y - 2}" stroke="${color}" stroke-width="6" stroke-linecap="round"/><line x1="${x - 24}" y1="${y + 24}" x2="${x + 18}" y2="${y + 24}" stroke="${color}" stroke-width="6" stroke-linecap="round"/>`;
  }
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${soft}"/><circle cx="${x}" cy="${y}" r="${r * .45}" fill="#fff" stroke="${color}" stroke-width="8"/><circle cx="${x}" cy="${y}" r="${r * .16}" fill="${color}"/>`;
}

function arrow(x1, y1, x2, y2, color = C.navy, width = 5) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const hx = x2 - 15 * Math.cos(angle);
  const hy = y2 - 15 * Math.sin(angle);
  const left = `${hx - 9 * Math.sin(angle)},${hy + 9 * Math.cos(angle)}`;
  const right = `${hx + 9 * Math.sin(angle)},${hy - 9 * Math.cos(angle)}`;
  return `<line x1="${x1}" y1="${y1}" x2="${hx}" y2="${hy}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/><polygon points="${x2},${y2} ${left} ${right}" fill="${color}"/>`;
}

function mini(kind, x, y, w, h, color) {
  let out = '';
  if (kind === 'flow') {
    const labels = ['s', 'a', 'r', "s'"];
    for (let i = 0; i < 4; i++) {
      const bx = x + i * (w / 4);
      out += `<rect x="${bx}" y="${y + 22}" width="${w / 4 - 18}" height="${h - 44}" rx="10" fill="#fff" stroke="${color}" stroke-width="2"/><text x="${bx + (w / 4 - 18) / 2}" y="${y + h / 2 + 9}" font-size="28" font-weight="900" text-anchor="middle" fill="${color}">${esc(labels[i])}</text>`;
      if (i < 3) out += arrow(bx + w / 4 - 14, y + h / 2, bx + w / 4 + 10, y + h / 2, color, 4);
    }
    return out;
  }
  if (kind === 'bars') {
    const vals = [.88, .66, .46, .28];
    vals.forEach((v, i) => {
      out += `<rect x="${x + 10}" y="${y + 15 + i * 34}" width="${w - 30}" height="22" rx="8" fill="#e2e8f0"/><rect x="${x + 10}" y="${y + 15 + i * 34}" width="${(w - 30) * v}" height="22" rx="8" fill="${color}"/>`;
    });
    return out;
  }
  if (kind === 'network') {
    const layers = [4, 5, 4, 3];
    const coords = [];
    layers.forEach((n, li) => {
      const cx = x + 30 + li * ((w - 60) / (layers.length - 1));
      const start = y + h / 2 - (n - 1) * 18;
      const pts = [];
      for (let i = 0; i < n; i++) pts.push([cx, start + i * 36]);
      coords.push(pts);
    });
    for (let li = 0; li < coords.length - 1; li++) for (const a of coords[li]) for (const b of coords[li + 1]) out += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#cbd5e1" stroke-width="1.4"/>`;
    for (const layer of coords) for (const [cx, cy] of layer) out += `<circle cx="${cx}" cy="${cy}" r="10" fill="#fff" stroke="${color}" stroke-width="3"/>`;
    return out;
  }
  if (kind === 'formula') {
    return `<rect x="${x}" y="${y + 25}" width="${w}" height="${h - 50}" rx="12" fill="#fff" stroke="${color}" stroke-width="2"/><text x="${x + w / 2}" y="${y + h / 2 + 8}" font-size="27" font-family="Menlo, Consolas, monospace" font-weight="800" text-anchor="middle" fill="${color}">y = r + gamma max Q</text>`;
  }
  if (kind === 'matrix') {
    for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) {
      const active = (r * 3 + c) % 5 !== 0;
      out += `<rect x="${x + c * 28}" y="${y + r * 24}" width="21" height="18" rx="4" fill="${active ? color : '#e2e8f0'}" opacity="${active ? .9 : 1}"/>`;
    }
    return out;
  }
  if (kind === 'gauge') {
    return `<path d="M${x + 18} ${y + h - 20} A${w / 2 - 22} ${w / 2 - 22} 0 0 1 ${x + w - 18} ${y + h - 20}" fill="none" stroke="#e2e8f0" stroke-width="18" stroke-linecap="round"/><path d="M${x + 18} ${y + h - 20} A${w / 2 - 22} ${w / 2 - 22} 0 0 1 ${x + w * .74} ${y + 22}" fill="none" stroke="${color}" stroke-width="18" stroke-linecap="round"/><line x1="${x + w / 2}" y1="${y + h - 20}" x2="${x + w * .72}" y2="${y + 36}" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/><circle cx="${x + w / 2}" cy="${y + h - 20}" r="10" fill="${C.ink}"/>`;
  }
  if (kind === 'split') {
    const cx = x + w / 2;
    out += `<circle cx="${cx}" cy="${y + 22}" r="18" fill="${color}"/><line x1="${cx}" y1="${y + 40}" x2="${cx}" y2="${y + 78}" stroke="${color}" stroke-width="5"/>`;
    [-1, 0, 1].forEach((d, i) => {
      const bx = x + 25 + i * ((w - 70) / 2);
      out += `<line x1="${cx}" y1="${y + 78}" x2="${bx + 25}" y2="${y + 116}" stroke="${color}" stroke-width="4"/><rect x="${bx}" y="${y + 116}" width="50" height="36" rx="8" fill="#fff" stroke="${color}" stroke-width="3"/>`;
    });
    return out;
  }
  if (kind === 'clip') {
    out += `<rect x="${x + 10}" y="${y + 20}" width="${w - 20}" height="${h - 40}" rx="10" fill="#fff" stroke="${color}" stroke-width="2"/><rect x="${x + w * .38}" y="${y + 20}" width="${w * .24}" height="${h - 40}" fill="${color}" opacity=".12"/>`;
    out += `<path d="M${x + 25} ${y + h - 38} C ${x + w * .32} ${y + h - 42}, ${x + w * .42} ${y + 54}, ${x + w * .55} ${y + 58} S ${x + w * .75} ${y + h - 50}, ${x + w - 25} ${y + 35}" fill="none" stroke="${color}" stroke-width="5"/>`;
    return out;
  }
  if (kind === 'thermo') {
    return `<rect x="${x + w / 2 - 16}" y="${y + 18}" width="32" height="${h - 58}" rx="16" fill="#fff" stroke="${color}" stroke-width="4"/><rect x="${x + w / 2 - 9}" y="${y + 70}" width="18" height="${h - 110}" rx="9" fill="${color}"/><circle cx="${x + w / 2}" cy="${y + h - 34}" r="28" fill="#fff" stroke="${color}" stroke-width="4"/><circle cx="${x + w / 2}" cy="${y + h - 34}" r="18" fill="${color}"/>`;
  }
  if (kind === 'twoTracks') {
    ['real', 'imaginado'].forEach((label, i) => {
      const yy = y + 20 + i * 62;
      out += `<text x="${x + 5}" y="${yy + 24}" font-size="18" font-weight="800" fill="${color}">${label}</text>`;
      for (let j = 0; j < 5; j++) out += `<rect x="${x + 105 + j * 48}" y="${yy}" width="34" height="34" rx="8" fill="${j < 3 || i === 0 ? color : '#e2e8f0'}" opacity="${i === 0 ? .9 : .55}"/>`;
      out += arrow(x + 115, yy + 50, x + 295, yy + 50, color, 4);
    });
    return out;
  }
  if (kind === 'checklist') {
    for (let i = 0; i < 4; i++) {
      out += `<circle cx="${x + 25}" cy="${y + 24 + i * 34}" r="12" fill="${color}"/><path d="M${x + 18} ${y + 24 + i * 34} L${x + 24} ${y + 30 + i * 34} L${x + 34} ${y + 16 + i * 34}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><line x1="${x + 50}" y1="${y + 24 + i * 34}" x2="${x + w - 10}" y2="${y + 24 + i * 34}" stroke="#cbd5e1" stroke-width="6" stroke-linecap="round"/>`;
    }
    return out;
  }
  return mini('bars', x, y, w, h, color);
}

function topBox(box, x, y, w, h) {
  const [color, soft] = themes[box.theme ?? 'blue'] ?? themes.blue;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${soft}" stroke="${color}" stroke-width="2"/>
    ${icon(box.icon ?? 'target', x + 96, y + 88, 72, color)}
    <text x="${x + 190}" y="${y + 48}" font-size="30" font-weight="900" fill="${color}">${esc(box.title)}</text>
    ${textBlock(x + 190, y + 84, box.body, w - 220, { size: 20, maxLines: 4, fill: C.ink, weight: 520 })}
    ${mini(box.visual ?? 'flow', x + 190, y + 175, w - 225, 70, color)}
  `;
}

function card(card, x, y, w, h, index) {
  const [color, soft] = themes[card.theme ?? 'blue'] ?? themes.blue;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${soft}" stroke="${color}" stroke-width="2"/>
    <circle cx="${x + 55}" cy="${y + 48}" r="34" fill="${color}"/>
    <text x="${x + 55}" y="${y + 59}" font-size="28" font-weight="900" text-anchor="middle" fill="#fff">${index}</text>
    ${textLines(x + 106, y + 47, wrap(card.title, 18).slice(0, 2), { size: 27, weight: 900, fill: color, gap: 31 })}
    ${textBlock(x + 26, y + 111, card.body, w - 52, { size: 19, maxLines: 4, fill: C.ink, weight: 520 })}
    <line x1="${x + 22}" y1="${y + 191}" x2="${x + w - 22}" y2="${y + 191}" stroke="${color}" stroke-dasharray="4 7" stroke-width="2"/>
    ${mini(card.visual ?? 'bars', x + 38, y + 207, w - 76, h - 220, color)}
  `;
}

function bottom(sec) {
  const [color, soft] = themes[sec.bottomTheme ?? 'amber'] ?? themes.amber;
  const bullets = (sec.bottomBullets ?? []).slice(0, 4);
  return `
    <rect x="28" y="770" width="1435" height="250" rx="10" fill="${soft}" stroke="${color}" stroke-width="2"/>
    ${icon(sec.bottomIcon ?? 'check', 118, 895, 68, color)}
    <text x="225" y="824" font-size="32" font-weight="900" fill="${C.ink}">${esc(sec.bottomTitle ?? 'Por qué importa')}</text>
    ${bullets.map((b, i) => `<circle cx="240" cy="${866 + i * 34}" r="8" fill="${color}"/><text x="262" y="${874 + i * 34}" font-size="21" font-weight="${i === 0 ? 800 : 520}" fill="${C.ink}">${esc(b)}</text>`).join('')}
    <line x1="745" y1="810" x2="745" y2="982" stroke="${C.navy}" stroke-dasharray="4 8" stroke-width="2" opacity=".55"/>
    ${mini(sec.bottomVisual ?? 'checklist', 805, 835, 220, 130, color)}
    <rect x="1090" y="842" width="330" height="115" rx="10" fill="#fffaf0" stroke="${color}" stroke-width="2"/>
    ${textBlock(1120, 882, sec.callout ?? sec.footer ?? '', 275, { size: 24, maxLines: 3, weight: 900, fill: C.ink })}
  `;
}

function standard(sec) {
  const cardW = 348;
  const gap = 14;
  return wrapSvg(`
    ${header(sec.title, sec.subtitle)}
    ${topBox(sec.top[0], 28, 122, 700, 280)}
    ${topBox(sec.top[1], 762, 122, 701, 280)}
    ${sec.cards.map((c, i) => card(c, 28 + i * (cardW + gap), 430, cardW, 300, i + 1)).join('')}
    ${bottom(sec)}
  `);
}

function algorithm(sec) {
  const [mainColor, mainSoft] = themes[sec.mainTheme ?? 'violet'] ?? themes.violet;
  const cardW = 348;
  const gap = 14;
  return wrapSvg(`
    ${header(sec.title, sec.subtitle)}
    ${topBox(sec.top[0], 28, 122, 330, 280)}
    <rect x="386" y="122" width="718" height="280" rx="12" fill="${mainSoft}" stroke="${mainColor}" stroke-width="2.4"/>
    <text x="745" y="165" font-size="28" font-weight="900" text-anchor="middle" fill="${mainColor}">${esc(sec.mainTitle)}</text>
    ${textLines(745, 195, wrap(sec.mainSubtitle ?? '', 56).slice(0, 1), { size: 18, weight: 700, fill: C.ink, anchor: 'middle' })}
    ${mini(sec.mainVisual ?? 'network', 470, 215, 550, 140, mainColor)}
    ${topBox(sec.top[1], 1133, 122, 330, 280)}
    ${sec.cards.map((c, i) => card(c, 28 + i * (cardW + gap), 430, cardW, 300, i + 1)).join('')}
    ${bottom(sec)}
  `);
}

function evidence(sec) {
  const [color] = themes[sec.mainTheme ?? 'green'] ?? themes.green;
  const cardW = 348;
  const gap = 14;
  return wrapSvg(`
    ${header(sec.title, sec.subtitle)}
    <rect x="28" y="122" width="700" height="280" rx="10" fill="#f8fbff" stroke="${color}" stroke-width="2"/>
    ${icon(sec.mainIcon ?? 'gauge', 120, 235, 70, color)}
    <text x="220" y="168" font-size="31" font-weight="900" fill="${color}">${esc(sec.top[0].title)}</text>
    ${textBlock(220, 205, sec.top[0].body, 455, { size: 20, maxLines: 4, fill: C.ink })}
    ${mini(sec.top[0].visual ?? 'bars', 220, 315, 440, 60, color)}
    ${topBox(sec.top[1], 762, 122, 701, 280)}
    ${sec.cards.map((c, i) => card(c, 28 + i * (cardW + gap), 430, cardW, 300, i + 1)).join('')}
    ${bottom(sec)}
  `);
}

function atlas(sec) {
  const [color, soft] = themes[sec.mainTheme ?? 'blue'] ?? themes.blue;
  return wrapSvg(`
    ${header(sec.title, sec.subtitle)}
    <rect x="28" y="122" width="1435" height="600" rx="12" fill="${soft}" stroke="${color}" stroke-width="2.3"/>
    <text x="92" y="178" font-size="34" font-weight="900" fill="${color}">${esc(sec.mainTitle)}</text>
    ${textBlock(92, 215, sec.mainSubtitle, 600, { size: 22, maxLines: 3, fill: C.ink })}
    ${sec.cards.map((c, i) => {
      const x = 70 + (i % 3) * 455;
      const y = 315 + Math.floor(i / 3) * 190;
      const [tc, ts] = themes[c.theme ?? 'blue'] ?? themes.blue;
      return `<rect x="${x}" y="${y}" width="390" height="145" rx="12" fill="#fff" stroke="${tc}" stroke-width="2"/>
        ${icon(c.icon ?? 'target', x + 62, y + 72, 45, tc)}
        <text x="${x + 128}" y="${y + 48}" font-size="25" font-weight="900" fill="${tc}">${esc(c.title)}</text>
        ${textBlock(x + 128, y + 82, c.body, 230, { size: 18, maxLines: 3, fill: C.ink })}`;
    }).join('')}
    ${bottom(sec)}
  `);
}

function wrapSvg(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#fff"/>
  ${body}
</svg>
`;
}

const sections = [
  {
    key: '0.3', file: 'codex3_ch0_3_mapa_laboratorio', layout: 'standard',
    title: 'El laboratorio completo en una página',
    subtitle: 'Antes de creer una cifra, separa tarea, agente, algoritmo, evaluación y evidencia.',
    top: [
      { title: 'Objetivo del mapa', body: 'Ver cómo un Arkanoid se convierte en un experimento medible, no en una demo bonita.', theme: 'blue', icon: 'target', visual: 'flow' },
      { title: 'Cadena de lectura', body: 'Cada resultado nace de una formulación: observación, recompensa, red, entrenamiento y test.', theme: 'green', icon: 'ledger', visual: 'split' },
    ],
    cards: [
      { title: 'Tarea', body: 'Pala, bola, ladrillos y niveles generados. El entorno fija qué puede aprenderse.', theme: 'blue', visual: 'matrix' },
      { title: 'Estado', body: 'El agente solo decide con lo que observa: cinemática, mapa y tiempo disponible.', theme: 'cyan', visual: 'flow' },
      { title: 'Método', body: 'DQN, PPO, SAC y modelos del mundo responden preguntas distintas.', theme: 'violet', visual: 'network' },
      { title: 'Evidencia', body: 'Éxito en test, cinco semillas y split limpio convierten una historia en resultado.', theme: 'green', visual: 'checklist' },
    ],
    bottomTitle: 'La promesa del libro', bottomBullets: ['Primero entenderás la tarea; después, por qué fallaba.', 'El salto al 91% se leerá como causa, no como magia.', 'Cada número vendrá con protocolo y condiciones.', 'La guía visual debe impedir conclusiones rápidas.'], bottomTheme: 'amber', bottomIcon: 'check', bottomVisual: 'ledger',
    callout: 'Mapa antes de detalle: así se evita aprender nombres sin mecanismo.',
    caption: 'Cierre tipo infografía de 0.3: el laboratorio visto como cadena completa de tarea, método y evidencia.',
  },
  {
    key: '1.1', file: 'codex3_ch1_1_consecuencias', layout: 'standard',
    title: 'Aprender por consecuencias',
    subtitle: 'En RL no hay respuestas correctas etiquetadas: hay decisiones, consecuencias y memoria.',
    top: [
      { title: 'Qué cambia respecto a supervisado', body: 'El agente no recibe la acción ideal; la descubre probando y acumulando señales.', theme: 'blue', icon: 'target', visual: 'flow' },
      { title: 'Unidad mínima', body: 'Una transición junta lo que vio, lo que hizo, lo que cobró y dónde terminó.', theme: 'teal', icon: 'ledger', visual: 'flow' },
    ],
    cards: [
      { title: 'Estado', body: 'Lo que entra en la red. Si falta el muro, no puede apuntar al muro.', theme: 'blue', visual: 'matrix' },
      { title: 'Acción', body: 'Mover izquierda, quedarse o mover derecha. Tres opciones, muchas consecuencias.', theme: 'cyan', visual: 'split' },
      { title: 'Recompensa', body: 'Señal interna de aprendizaje. Ayuda, pero puede premiar atajos.', theme: 'amber', visual: 'bars' },
      { title: 'Episodio', body: 'La historia completa: empieza, evoluciona y termina con éxito o fallo.', theme: 'green', visual: 'flow' },
    ],
    bottomTitle: 'Pregunta sana', bottomBullets: ['Qué información tenía el agente cuando decidió?', 'Qué consecuencia llegó inmediatamente?', 'Qué consecuencia llegó tarde?', 'Qué se guardó para aprender después?'], bottomTheme: 'green', bottomIcon: 'check', bottomVisual: 'timeline',
    callout: 'RL se entiende cuando dejas de buscar etiquetas y miras trayectorias.',
    caption: 'Cierre tipo infografía de 1.1: aprendizaje por consecuencias como cadena de transición y episodio.',
  },
  {
    key: '1.2', file: 'codex3_ch1_2_recompensa_exito', layout: 'evidence', mainTheme: 'orange',
    title: 'Recompensa alta no significa éxito',
    subtitle: 'La recompensa guía el entrenamiento; el éxito juzga si el nivel se limpió de verdad.',
    top: [
      { title: 'La trampa del proxy', body: 'Una curva puede subir porque el agente sobrevive, rebota o explota una ayuda de shaping.', visual: 'bars' },
      { title: 'La pregunta correcta', body: 'No preguntes si cobró más. Pregunta si limpia niveles no vistos bajo evaluación limpia.', theme: 'green', icon: 'target', visual: 'checklist' },
    ],
    cards: [
      { title: 'Sobrevivir', body: 'Puede dar puntos sin resolver el objetivo real.', theme: 'amber', visual: 'gauge' },
      { title: 'Romper algo', body: 'Mejora parcial: útil, pero no suficiente.', theme: 'cyan', visual: 'matrix' },
      { title: 'Limpiar', body: 'La métrica externa exige terminar el nivel.', theme: 'green', visual: 'checklist' },
      { title: 'Generalizar', body: 'El salto serio ocurre en patrones no vistos.', theme: 'violet', visual: 'split' },
    ],
    bottomTitle: 'Lectura honesta', bottomBullets: ['Recompensa es instrumento, no veredicto.', 'Éxito se mide fuera del entrenamiento.', 'El escenario puede facilitar atajos.', 'Una ayuda mal diseñada puede empeorar el objetivo.'], bottomTheme: 'amber', bottomIcon: 'scale', bottomVisual: 'bars',
    callout: 'La curva bonita debe pasar por test, no por entusiasmo.',
    caption: 'Cierre tipo infografía de 1.2: separación entre señal de recompensa, objetivo real y evidencia.',
  },
  {
    key: '1.3', file: 'codex3_ch1_3_protocolo', layout: 'standard',
    title: 'Un resultado solo vale si el examen está limpio',
    subtitle: 'Train, validación y test no son nombres decorativos: separan aprender, decidir y declarar.',
    top: [
      { title: 'Split sin contaminación', body: 'Train ajusta la política; validación guía decisiones; test declara el resultado final.', theme: 'green', icon: 'check', visual: 'split' },
      { title: 'Tres exámenes', body: 'TEST-ID mide interpolación; OOD-patrón y OOD-dificultad miden extrapolación.', theme: 'violet', icon: 'target', visual: 'bars' },
    ],
    cards: [
      { title: 'Train', body: 'Datos para aprender. Puede verse muchas veces.', theme: 'blue', visual: 'matrix' },
      { title: 'Validación', body: 'Sirve para elegir sin tocar el test.', theme: 'cyan', visual: 'checklist' },
      { title: 'Test', body: 'Solo se abre para declarar, no para ajustar.', theme: 'green', visual: 'ledger' },
      { title: 'OOD', body: 'Cambia patrón o dificultad para medir robustez.', theme: 'orange', visual: 'split' },
    ],
    bottomTitle: 'Antídotos contra autoengaño', bottomBullets: ['No escoger hiperparámetros con test.', 'No reportar solo la mejor semilla.', 'No cambiar métrica tras mirar resultados.', 'No mezclar niveles entrenados con niveles de examen.'], bottomTheme: 'red', bottomIcon: 'check', bottomVisual: 'checklist',
    callout: 'El juez no puede entrenar al competidor.',
    caption: 'Cierre tipo infografía de 1.3: protocolo limpio, splits disjuntos y lectura de generalización.',
  },
  {
    key: '1.4', file: 'codex3_ch1_4_agente_ciego', layout: 'standard',
    title: 'El agente ciego falló por información',
    subtitle: 'No basta con una red potente si el estado no contiene el objetivo que hay que perseguir.',
    top: [
      { title: 'Lo que veía', body: 'Seis cinemáticos bastaban para interceptar la bola, pero no para elegir ladrillos.', theme: 'blue', icon: 'target', visual: 'flow' },
      { title: 'Lo que faltaba', body: 'El mapa 8x10 del muro convierte supervivencia en decisión dirigida.', theme: 'teal', icon: 'network', visual: 'matrix' },
    ],
    cards: [
      { title: 'Supervivencia', body: 'La pala aprende a no perder, que no es limpiar.', theme: 'blue', visual: 'gauge' },
      { title: 'Rebote', body: 'Premia una conducta cómoda y repetible.', theme: 'amber', visual: 'bars' },
      { title: 'Azar físico', body: 'En muros densos, algunas roturas caen solas.', theme: 'orange', visual: 'matrix' },
      { title: 'Techo', body: 'Lo ausente del estado no se aprende por insistir.', theme: 'red', visual: 'checklist' },
    ],
    bottomTitle: 'Diagnóstico correcto', bottomBullets: ['No culpar al algoritmo antes de auditar la observación.', 'Un buen agente resuelve la tarea que le formulaste.', 'Mostrar el objetivo cambia el problema aprendible.', 'Más pasos no inventan variables ausentes.'], bottomTheme: 'amber', bottomIcon: 'target', bottomVisual: 'matrix',
    callout: 'La red no ve intenciones: ve tensores.',
    caption: 'Cierre tipo infografía de 1.4: fracaso del agente ciego como límite de información disponible.',
  },
  {
    key: '1.5', file: 'codex3_ch1_5_tres_muros', layout: 'evidence', mainTheme: 'red',
    title: 'Tres muros, tres causas reales',
    subtitle: 'El diagnóstico pedagógico mueve la culpa desde el agente hacia la formulación de la tarea.',
    top: [
      { title: 'Diagnosticar no es adivinar', body: 'Cada muro se lee como síntoma, prueba, causa y arreglo medible.', visual: 'checklist' },
      { title: 'Hipótesis falsas', body: 'Decir que el agente es malo oculta si faltan tiempo, objetivo o señal adecuada.', theme: 'orange', icon: 'scale', visual: 'bars' },
    ],
    cards: [
      { title: 'Reloj', body: 'Timeout fijo premia sobrevivir y corta niveles largos.', theme: 'red', visual: 'gauge' },
      { title: 'Shaping', body: 'Una ayuda puede crear un proxy más fácil que limpiar.', theme: 'amber', visual: 'scale' },
      { title: 'Observación', body: 'Sin mapa de ladrillos, no hay puntería informada.', theme: 'blue', visual: 'matrix' },
      { title: 'Receta', body: 'Arreglar causa por causa desbloquea aprendizaje.', theme: 'green', visual: 'checklist' },
    ],
    bottomTitle: 'Método clínico', bottomBullets: ['Síntoma observable antes que explicación cómoda.', 'Prueba específica para cada hipótesis.', 'Arreglo mínimo que ataque la causa.', 'Resultado comparado antes/después.'], bottomTheme: 'green', bottomIcon: 'ledger', bottomVisual: 'flow',
    callout: 'Un buen diagnóstico reduce misterio y aumenta control.',
    caption: 'Cierre tipo infografía de 1.5: diagnóstico causal de reloj, shaping y observación.',
  },
  {
    key: '1.6', file: 'codex3_ch1_6_receta', layout: 'algorithm', mainTheme: 'green',
    title: 'La receta traduce Arkanoid a una tarea aprendible',
    subtitle: 'El salto no viene de un truco: viene de alinear estado, objetivo, tiempo, red y evaluación.',
    top: [
      { title: 'Antes', body: 'Poca información, reloj rígido y señal auxiliar que desviaba la conducta.', theme: 'orange', icon: 'gauge', visual: 'bars' },
      { title: 'Después', body: 'Mapa del muro, timeout proporcional, sin shaping y encoder adecuado.', theme: 'green', icon: 'check', visual: 'checklist' },
    ],
    mainTitle: 'Arquitectura de dos ramas', mainSubtitle: 'cinemática + mapa 8x10 -> decisión',
    mainVisual: 'network',
    cards: [
      { title: 'Estado 86', body: 'Seis cinemáticos más ochenta ladrillos visibles.', theme: 'blue', visual: 'matrix' },
      { title: 'Reloj justo', body: 'El presupuesto escala con el trabajo del nivel.', theme: 'amber', visual: 'gauge' },
      { title: 'Sin shaping', body: 'La recompensa deja de premiar el proxy cómodo.', theme: 'red', visual: 'bars' },
      { title: 'Test limpio', body: 'La conquista se declara en niveles no vistos.', theme: 'green', visual: 'ledger' },
    ],
    bottomTitle: 'Por qué funcionó', bottomBullets: ['La observación contiene el objetivo.', 'La red puede procesar geometría y movimiento.', 'La recompensa ya no desvía la conducta.', 'La evaluación prueba generalización.'], bottomTheme: 'green', bottomIcon: 'check', bottomVisual: 'network',
    callout: 'La receta no mejora el marcador: mejora la pregunta.',
    caption: 'Cierre tipo infografía de 1.6: receta causal que convierte Arkanoid en tarea aprendible.',
  },
  {
    key: '1.7', file: 'codex3_ch1_7_conquista', layout: 'standard',
    title: 'La conquista fue causal, no mágica',
    subtitle: 'El 91% tiene sentido porque antes se arregló qué veía, qué cobraba y cómo se evaluaba.',
    top: [
      { title: 'Arco narrativo', body: 'De 0% en niveles difíciles a éxito alto tras reformular la tarea.', theme: 'blue', icon: 'target', visual: 'bars' },
      { title: 'Arco causal', body: 'Cada mejora elimina una causa de fallo: tiempo, proxy, información y protocolo.', theme: 'green', icon: 'check', visual: 'flow' },
    ],
    cards: [
      { title: 'No era magia', body: 'El algoritmo no cambió el mundo: cambió la formulación.', theme: 'violet', visual: 'network' },
      { title: 'No era suerte', body: 'Cinco semillas evitan enamorarse de un run.', theme: 'green', visual: 'bars' },
      { title: 'No era reward', body: 'El éxito externo decide si se limpió el nivel.', theme: 'orange', visual: 'gauge' },
      { title: 'No era demo', body: 'El protocolo permite declarar un resultado defendible.', theme: 'blue', visual: 'ledger' },
    ],
    bottomTitle: 'Puente hacia la teoría', bottomBullets: ['Ahora las palabras RL tendrán anclaje concreto.', 'Bellman explicará cómo se propaga valor.', 'Las redes explicarán cómo se codifica el estado.', 'Los algoritmos serán variantes de una pregunta común.'], bottomTheme: 'violet', bottomIcon: 'network', bottomVisual: 'split',
    callout: 'La Parte II pone formalismo sobre una historia ya entendida.',
    caption: 'Cierre tipo infografía de 1.7: lectura causal de la primera conquista y puente hacia RL formal.',
  },
  {
    key: '2.1', file: 'codex3_ch2_1_transicion', layout: 'standard',
    title: 'RL aprende de transiciones',
    subtitle: 'La experiencia mínima no es una frase: es observar, actuar, cobrar y guardar el siguiente estado.',
    top: [
      { title: 'Unidad de datos', body: 'Cada paso produce una tupla: estado, acción, recompensa, siguiente estado y final.', theme: 'blue', icon: 'ledger', visual: 'flow' },
      { title: 'Dataset vivo', body: 'El agente crea los datos que después usa para corregirse. Por eso la distribución se mueve.', theme: 'teal', icon: 'network', visual: 'twoTracks' },
    ],
    cards: [
      { title: 'Observa', body: 'Recibe un tensor con bola, pala, ladrillos y reloj.', theme: 'blue', visual: 'matrix' },
      { title: 'Actúa', body: 'Elige entre izquierda, quieto o derecha.', theme: 'cyan', visual: 'split' },
      { title: 'Recibe', body: 'El entorno devuelve recompensa y nuevo estado.', theme: 'amber', visual: 'bars' },
      { title: 'Aprende', body: 'Guarda la transición y actualiza valor o política.', theme: 'green', visual: 'network' },
    ],
    bottomTitle: 'Clave para un junior', bottomBullets: ['No hay ejemplos independientes como en supervisado.', 'La política influye en qué datos aparecen.', 'Un episodio encadena muchas transiciones.', 'El aprendizaje se rompe si la experiencia está sesgada.'], bottomTheme: 'green', bottomIcon: 'check', bottomVisual: 'flow',
    callout: 'La transición es el átomo de Deep RL.',
    caption: 'Infografía de cierre de 2.1: transición como unidad de experiencia que alimenta el aprendizaje.',
  },
  {
    key: '2.2', file: 'codex3_ch2_2_estado_observacion', layout: 'standard',
    title: 'Estado, observación y memoria',
    subtitle: 'La pregunta de Markov es sencilla: con lo que veo ahora, puedo decidir bien?',
    top: [
      { title: 'Estado real', body: 'Contiene toda la verdad del entorno, aunque el agente no siempre la reciba.', theme: 'blue', icon: 'target', visual: 'matrix' },
      { title: 'Observación', body: 'Es la versión que entra en la red. Si es parcial, aparece POMDP y puede ayudar la memoria.', theme: 'violet', icon: 'network', visual: 'network' },
    ],
    cards: [
      { title: 'Markov', body: 'El presente basta si resume todo lo relevante del pasado.', theme: 'green', visual: 'checklist' },
      { title: 'POMDP', body: 'Falta información: una sola foto no cuenta toda la historia.', theme: 'orange', visual: 'split' },
      { title: 'Tensor', body: 'El agente no ve objetos; recibe números organizados.', theme: 'blue', visual: 'matrix' },
      { title: 'Memoria', body: 'Puede ayudar si la observación actual no basta.', theme: 'violet', visual: 'twoTracks' },
    ],
    bottomTitle: 'Lectura práctica', bottomBullets: ['Antes de culpar al algoritmo, mira el estado.', 'Una red buena no inventa variables ausentes.', 'La memoria no arregla una tarea mal definida.', 'Arkanoid mejora cuando el muro entra en la observación.'], bottomTheme: 'amber', bottomIcon: 'target', bottomVisual: 'matrix',
    callout: 'La calidad del estado fija el techo del aprendizaje.',
    caption: 'Infografía de cierre de 2.2: diferencia entre estado real, observación, tensor y memoria.',
  },
  {
    key: '2.3', file: 'codex3_ch2_3_retorno', layout: 'evidence', mainTheme: 'amber',
    title: 'El agente persigue futuro descontado',
    subtitle: 'La recompensa inmediata importa, pero el retorno enseña a valorar consecuencias futuras.',
    top: [
      { title: 'Calculadora de retorno', body: 'G suma recompensas futuras con descuento gamma. Lo lejano pesa, pero no igual que lo inmediato.', visual: 'formula' },
      { title: 'Por qué descontar', body: 'Gamma controla el horizonte: miopía, paciencia y estabilidad del aprendizaje.', theme: 'blue', icon: 'gauge', visual: 'gauge' },
    ],
    cards: [
      { title: 'r ahora', body: 'Señal instantánea: rompió ladrillo, rebotó o perdió bola.', theme: 'orange', visual: 'bars' },
      { title: 'gamma', body: 'El dial que decide cuánto futuro cabe en la decisión.', theme: 'blue', visual: 'gauge' },
      { title: 'G retorno', body: 'Suma descontada que valora trayectorias completas.', theme: 'green', visual: 'formula' },
      { title: 'Crédito', body: 'Una recompensa tardía debe influir en acciones anteriores.', theme: 'violet', visual: 'flow' },
    ],
    bottomTitle: 'No confundas', bottomBullets: ['Recompensa es local; retorno mira trayectoria.', 'Gamma bajo acorta el horizonte.', 'Gamma alto exige más estabilidad.', 'El objetivo real sigue siendo éxito en test.'], bottomTheme: 'amber', bottomIcon: 'gauge', bottomVisual: 'bars',
    callout: 'RL aprende a preferir caminos, no solo pasos.',
    caption: 'Infografía de cierre de 2.3: recompensa inmediata, retorno y descuento temporal.',
  },
  {
    key: '2.4', file: 'codex3_ch2_4_bellman', layout: 'evidence', mainTheme: 'violet',
    title: 'Bellman convierte experiencia en diana',
    subtitle: 'La red no sabe el valor verdadero: fabrica un objetivo temporal y corrige su predicción.',
    top: [
      { title: 'Microscopio Bellman', body: 'Predicción actual, recompensa observada, mejor valor futuro y error TD forman el pulso de aprendizaje.', visual: 'formula' },
      { title: 'La diana se mueve', body: 'En Deep RL el target depende de redes que también cambian; por eso hacen falta estabilizadores.', theme: 'red', icon: 'gauge', visual: 'twoTracks' },
    ],
    cards: [
      { title: 'Q actual', body: 'Lo que la red cree antes de corregirse.', theme: 'blue', visual: 'bars' },
      { title: 'Target', body: 'r + gamma por el mejor valor futuro estimado.', theme: 'violet', visual: 'formula' },
      { title: 'TD-error', body: 'La distancia entre predicción y diana.', theme: 'orange', visual: 'gauge' },
      { title: 'Update', body: 'El gradiente empuja Q hacia el target.', theme: 'green', visual: 'network' },
    ],
    bottomTitle: 'Por qué importa', bottomBullets: ['Bellman propaga consecuencias futuras hacia atrás.', 'El target bootstrapped puede ser inestable.', 'Replay y target network reducen ruido.', 'Sin esta pieza, DQN no se entiende.'], bottomTheme: 'violet', bottomIcon: 'network', bottomVisual: 'formula',
    callout: 'Bellman es la contabilidad del futuro.',
    caption: 'Infografía de cierre de 2.4: predicción, target, TD-error y actualización de valor.',
  },
  {
    key: '2.5', file: 'codex3_ch2_5_exploracion', layout: 'standard',
    title: 'Explorar no es actuar sin criterio',
    subtitle: 'La exploración decide qué datos aparecen; la explotación decide cómo usar lo aprendido.',
    top: [
      { title: 'Exploración', body: 'Probar acciones permite descubrir trayectorias que la política actual no elegiría.', theme: 'cyan', icon: 'target', visual: 'split' },
      { title: 'Explotación', body: 'Usar la mejor acción conocida aumenta rendimiento, pero puede cerrar alternativas.', theme: 'green', icon: 'gauge', visual: 'bars' },
    ],
    cards: [
      { title: 'epsilon', body: 'Ruido explícito: a veces se ignora la mejor Q.', theme: 'blue', visual: 'gauge' },
      { title: 'entropía', body: 'La política conserva variedad útil durante el aprendizaje.', theme: 'violet', visual: 'bars' },
      { title: 'decaimiento', body: 'Explorar mucho al inicio, menos al final.', theme: 'amber', visual: 'timeline' },
      { title: 'riesgo', body: 'Explorar mal llena el buffer de datos pobres.', theme: 'red', visual: 'matrix' },
    ],
    bottomTitle: 'Pregunta sana', bottomBullets: ['Qué estados descubre el agente gracias a explorar?', 'Cuándo conviene bajar la aleatoriedad?', 'La exploración mejora datos o solo mete ruido?', 'El test debe ejecutarse greedy para medir política aprendida.'], bottomTheme: 'green', bottomIcon: 'check', bottomVisual: 'gauge',
    callout: 'Explorar es diseñar el dataset futuro.',
    caption: 'Infografía de cierre de 2.5: exploración como control de datos, no como caos gratuito.',
  },
  {
    key: '2.6', file: 'codex3_ch2_6_replay_target', layout: 'algorithm', mainTheme: 'blue',
    title: 'DQN necesita memoria y una diana lenta',
    subtitle: 'Replay buffer y red objetivo atacan dos inestabilidades distintas del aprendizaje online.',
    top: [
      { title: 'Replay', body: 'Rompe correlaciones: mezcla transiciones viejas y nuevas antes de entrenar.', theme: 'blue', icon: 'ledger', visual: 'matrix' },
      { title: 'Target', body: 'Congela una copia lenta para que la diana no cambie a cada paso.', theme: 'green', icon: 'target', visual: 'twoTracks' },
    ],
    mainTitle: 'Dos estabilizadores',
    mainSubtitle: 'memoria diversa + diana menos nerviosa',
    mainVisual: 'twoTracks',
    cards: [
      { title: 'Correlación', body: 'Pasos consecutivos se parecen demasiado.', theme: 'red', visual: 'bars' },
      { title: 'Muestreo', body: 'El minibatch mezcla épocas y situaciones.', theme: 'blue', visual: 'matrix' },
      { title: 'Bootstrapping', body: 'El target usa una estimación futura.', theme: 'violet', visual: 'formula' },
      { title: 'Sincronía', body: 'La red objetivo se copia cada cierto tiempo.', theme: 'green', visual: 'flow' },
    ],
    bottomTitle: 'Idea transferible', bottomBullets: ['En RL los datos llegan ordenados y sesgados.', 'Entrenar online directo puede oscilar.', 'Replay mejora diversidad del minibatch.', 'Target network reduce el baile de la diana.'], bottomTheme: 'blue', bottomIcon: 'ledger', bottomVisual: 'checklist',
    callout: 'La estabilidad también se diseña.',
    caption: 'Infografía de cierre de 2.6: replay buffer y target network como estabilizadores de DQN.',
  },
  {
    key: '2.7', file: 'codex3_ch2_7_red_tensor', layout: 'algorithm', mainTheme: 'violet',
    title: 'De tensor 86 a acción',
    subtitle: 'La red combina cinemática continua y mapa discreto antes de producir valor o política.',
    top: [
      { title: 'Entrada mixta', body: 'Seis variables físicas más una rejilla 8x10 con la geometría del muro.', theme: 'blue', icon: 'target', visual: 'matrix' },
      { title: 'Salida útil', body: 'Tres acciones con Q-values o probabilidades, según el algoritmo.', theme: 'green', icon: 'gauge', visual: 'bars' },
    ],
    mainTitle: 'Dos ramas, una decisión',
    mainSubtitle: 'cinemática + convolución de ladrillos',
    mainVisual: 'network',
    cards: [
      { title: 'Cinemática', body: 'Bola, pala y velocidades dan control local.', theme: 'blue', visual: 'flow' },
      { title: 'Mapa 8x10', body: 'El muro aporta objetivo espacial.', theme: 'cyan', visual: 'matrix' },
      { title: 'Fusión', body: 'La red mezcla movimiento y geometría.', theme: 'violet', visual: 'network' },
      { title: 'Cabezas', body: 'Valor, política o Q-values según método.', theme: 'green', visual: 'split' },
    ],
    bottomTitle: 'Lectura para implementar', bottomBullets: ['No aplanes todo sin pensar en estructura.', 'La rama conv ve patrones de ladrillos.', 'La rama densa procesa variables físicas.', 'La salida debe coincidir con las acciones reales.'], bottomTheme: 'violet', bottomIcon: 'network', bottomVisual: 'network',
    callout: 'La arquitectura codifica qué relaciones importan.',
    caption: 'Infografía de cierre de 2.7: radiografía de la red de dos ramas desde tensor 86 hasta acción.',
  },
  {
    key: '2.8', file: 'codex3_ch2_8_entrenar_rl', layout: 'standard',
    title: 'Entrenar en RL es perseguir datos móviles',
    subtitle: 'En supervisado el dataset suele estar fijo; en RL la política cambia los datos que verá después.',
    top: [
      { title: 'Supervisado', body: 'El conjunto de ejemplos existe antes del entrenamiento y no depende del modelo.', theme: 'blue', icon: 'ledger', visual: 'checklist' },
      { title: 'Refuerzo', body: 'El agente produce experiencia con su política actual; aprender cambia lo que explora.', theme: 'orange', icon: 'gauge', visual: 'twoTracks' },
    ],
    cards: [
      { title: 'Recoger', body: 'Jugar episodios produce transiciones nuevas.', theme: 'blue', visual: 'flow' },
      { title: 'Guardar', body: 'Replay conserva memoria útil y diversa.', theme: 'cyan', visual: 'matrix' },
      { title: 'Actualizar', body: 'La red corrige predicciones o política.', theme: 'violet', visual: 'network' },
      { title: 'Evaluar', body: 'Se mide sin exploración para juzgar la política.', theme: 'green', visual: 'gauge' },
    ],
    bottomTitle: 'Señales de salud', bottomBullets: ['La pérdida sola no demuestra aprendizaje.', 'La recompensa puede subir por atajos.', 'La evaluación greedy separa ruido de política.', 'El test final exige protocolo congelado.'], bottomTheme: 'amber', bottomIcon: 'check', bottomVisual: 'bars',
    callout: 'En RL el dataset también es consecuencia del modelo.',
    caption: 'Infografía de cierre de 2.8: ciclo de entrenamiento con distribución de datos cambiante.',
  },
  {
    key: '3.1', file: 'codex3_ch3_1_dqn', layout: 'algorithm', mainTheme: 'blue',
    title: 'DQN decide comparando Q-values',
    subtitle: 'Una red estima cuánto futuro espera cada acción y elige el valor más alto.',
    top: [
      { title: 'Entrada', body: 'El estado actual entra como tensor: cinemática y mapa del muro.', theme: 'blue', icon: 'target', visual: 'matrix' },
      { title: 'Decisión', body: 'argmax selecciona la acción con mayor Q estimada.', theme: 'green', icon: 'gauge', visual: 'bars' },
    ],
    mainTitle: 'Estado -> Q(izq, quieto, der)',
    mainSubtitle: 'la política greedy sale de comparar valores',
    mainVisual: 'network',
    cards: [
      { title: 'Q(s,a)', body: 'Promesa de retorno si actúo así desde este estado.', theme: 'blue', visual: 'formula' },
      { title: 'Replay', body: 'Entrena con memoria mezclada, no con pasos pegados.', theme: 'cyan', visual: 'matrix' },
      { title: 'Target', body: 'Usa una copia lenta para estabilizar Bellman.', theme: 'violet', visual: 'twoTracks' },
      { title: 'epsilon', body: 'Explora al entrenar; en test decide greedy.', theme: 'amber', visual: 'gauge' },
    ],
    bottomTitle: 'DQN en una frase', bottomBullets: ['Convierte cada estado en tres promesas de futuro.', 'Bellman enseña a corregir esas promesas.', 'Replay y target evitan inestabilidad online.', 'Funciona bien si el estado contiene el objetivo.'], bottomTheme: 'blue', bottomIcon: 'network', bottomVisual: 'bars',
    callout: 'DQN no elige acciones: compara futuros estimados.',
    caption: 'Infografía de cierre de 3.1: DQN como red de Q-values, replay, target y selección greedy.',
  },
  {
    key: '3.2', file: 'codex3_ch3_2_ppo', layout: 'algorithm', mainTheme: 'violet',
    title: 'PPO mejora sin dar volantazos',
    subtitle: 'Actor y crítico colaboran, pero el clip evita que una actualización demasiado optimista rompa la política.',
    top: [
      { title: 'Actor', body: 'Propone probabilidades de acción para jugar y explorar.', theme: 'violet', icon: 'network', visual: 'split' },
      { title: 'Crítico', body: 'Evalúa si lo ocurrido fue mejor o peor de lo esperado.', theme: 'green', icon: 'scale', visual: 'gauge' },
    ],
    mainTitle: 'Zona segura de actualización',
    mainSubtitle: 'mejorar, sí; destruir la política anterior, no',
    mainVisual: 'clip',
    cards: [
      { title: 'Política', body: 'Distribución de acciones, no solo argmax.', theme: 'violet', visual: 'split' },
      { title: 'Ventaja', body: 'Mide si una acción superó la expectativa.', theme: 'green', visual: 'bars' },
      { title: 'Ratio', body: 'Compara política nueva contra política vieja.', theme: 'blue', visual: 'formula' },
      { title: 'Clip', body: 'Recorta cambios para mantener entrenamiento estable.', theme: 'orange', visual: 'clip' },
    ],
    bottomTitle: 'Intuición práctica', bottomBullets: ['PPO no busca el salto más grande.', 'Busca mejoras repetibles y controladas.', 'La política vieja actúa como referencia.', 'El clip protege contra actualizaciones bruscas.'], bottomTheme: 'violet', bottomIcon: 'check', bottomVisual: 'clip',
    callout: 'Prudencia estadística aplicada a una política.',
    caption: 'Infografía de cierre de 3.2: PPO como actor-crítico con zona segura de actualización.',
  },
  {
    key: '3.3', file: 'codex3_ch3_3_sac', layout: 'algorithm', mainTheme: 'teal',
    title: 'SAC equilibra retorno y variedad',
    subtitle: 'No es solo exploración: negocia continuamente entre prudencia, entropía y valor esperado.',
    top: [
      { title: 'Máxima entropía', body: 'No solo busca retorno: premia mantener alternativas útiles abiertas.', theme: 'cyan', icon: 'gauge', visual: 'gauge' },
      { title: 'Dos críticos', body: 'Toma el mínimo para reducir optimismo y controlar sobreestimación.', theme: 'green', icon: 'scale', visual: 'bars' },
    ],
    mainTitle: 'Cinco redes y un termostato',
    mainSubtitle: 'actor + Q1/Q2 + targets + alpha',
    mainVisual: 'network',
    cards: [
      { title: 'Actor', body: 'Política que mantiene distribución de acciones.', theme: 'rose', visual: 'split' },
      { title: 'Q1/Q2', body: 'Doble control para evitar valor inflado.', theme: 'blue', visual: 'bars' },
      { title: 'Targets', body: 'Copias lentas que estabilizan el objetivo.', theme: 'teal', visual: 'twoTracks' },
      { title: 'Alpha', body: 'Termostato que ajusta el peso de la entropía.', theme: 'orange', visual: 'thermo' },
    ],
    bottomTitle: 'SAC no se resume en explorar más', bottomBullets: ['El actor conserva variedad útil.', 'Los críticos frenan optimismo excesivo.', 'Las targets suavizan la diana de Bellman.', 'Alpha regula cuánta entropía conviene.'], bottomTheme: 'teal', bottomIcon: 'gauge', bottomVisual: 'thermo',
    callout: 'SAC es una negociación entre retorno, prudencia y diversidad.',
    caption: 'Infografía de cierre de 3.3: SAC como sistema de cinco redes, críticos dobles y temperatura de entropía.',
  },
  {
    key: '3.4', file: 'codex3_ch3_4_world_model', layout: 'algorithm', mainTheme: 'orange',
    title: 'World Model aprende también una maqueta',
    subtitle: 'Puede imaginar transiciones baratas, pero la imaginación solo ayuda mientras el modelo no mienta demasiado.',
    top: [
      { title: 'Carril real', body: 'El entorno verdadero corrige al modelo y aporta experiencia fiable.', theme: 'green', icon: 'ledger', visual: 'flow' },
      { title: 'Carril imaginado', body: 'El modelo genera prácticas adicionales con riesgo de sesgo acumulado.', theme: 'orange', icon: 'gauge', visual: 'twoTracks' },
    ],
    mainTitle: 'Real + imaginado',
    mainSubtitle: 'más datos, pero con deuda de modelo',
    mainVisual: 'twoTracks',
    cards: [
      { title: 'Modelo', body: 'Predice siguiente estado y recompensa.', theme: 'orange', visual: 'formula' },
      { title: 'Planificación', body: 'Usa rollouts simulados para entrenar más.', theme: 'blue', visual: 'flow' },
      { title: 'Sesgo', body: 'Errores pequeños crecen en secuencias largas.', theme: 'red', visual: 'bars' },
      { title: 'Ancla', body: 'La experiencia real mantiene el sistema honesto.', theme: 'green', visual: 'checklist' },
    ],
    bottomTitle: 'La idea Dyna', bottomBullets: ['Aprender del mundo y de una maqueta del mundo.', 'Imaginar ahorra interacción real.', 'El modelo debe verificarse continuamente.', 'El sesgo limita cuánto conviene soñar.'], bottomTheme: 'orange', bottomIcon: 'target', bottomVisual: 'twoTracks',
    callout: 'Imaginar ayuda cuando la maqueta conserva las causas importantes.',
    caption: 'Infografía de cierre de 3.4: World Model con carril real, carril imaginado y riesgo de sesgo.',
  },
  {
    key: '3.5', file: 'codex3_ch3_5_wmrnn', layout: 'algorithm', mainTheme: 'violet',
    title: 'La memoria ayuda solo cuando falta presente',
    subtitle: 'Una RNN puede resumir historia, pero no siempre mejora si el estado actual ya contiene lo necesario.',
    top: [
      { title: 'Secuencia', body: 'La LSTM procesa una cadena de observaciones, no una foto aislada.', theme: 'violet', icon: 'network', visual: 'twoTracks' },
      { title: 'Coste', body: 'Más memoria añade complejidad, varianza y más formas de sobreajuste.', theme: 'orange', icon: 'gauge', visual: 'bars' },
    ],
    mainTitle: 'Estado oculto recurrente',
    mainSubtitle: 'historia comprimida para decidir ahora',
    mainVisual: 'twoTracks',
    cards: [
      { title: 'Cuándo sirve', body: 'Si la observación actual oculta variables relevantes.', theme: 'green', visual: 'checklist' },
      { title: 'Cuándo sobra', body: 'Si el tensor ya contiene mapa y cinemática suficiente.', theme: 'amber', visual: 'gauge' },
      { title: 'Riesgo', body: 'Puede aprender correlaciones temporales frágiles.', theme: 'red', visual: 'bars' },
      { title: 'Veredicto', body: 'Se decide por test, no por elegancia del modelo.', theme: 'blue', visual: 'ledger' },
    ],
    bottomTitle: 'Regla práctica', bottomBullets: ['Añade memoria para resolver parcialidad, no por moda.', 'Compara contra un estado rico sin RNN.', 'Mide coste y robustez, no solo recompensa.', 'En este proyecto, la memoria no era la pieza decisiva.'], bottomTheme: 'violet', bottomIcon: 'check', bottomVisual: 'twoTracks',
    callout: 'Memoria no sustituye una buena observación.',
    caption: 'Infografía de cierre de 3.5: cuándo una RNN aporta memoria útil y cuándo solo añade complejidad.',
  },
  {
    key: '3.6', file: 'codex3_ch3_6_algoritmos', layout: 'standard',
    title: 'Cinco algoritmos, tres preguntas',
    subtitle: 'La comparación útil no enumera nombres: pregunta qué aprende, cómo decide y qué riesgo trae.',
    top: [
      { title: 'Familias', body: 'DQN estima valor; PPO aprende política; SAC combina política, valor y entropía; modelos imaginan.', theme: 'violet', icon: 'network', visual: 'split' },
      { title: 'Criterio de elección', body: 'No hay algoritmo universal. Hay ajuste entre tarea, datos, estabilidad y coste.', theme: 'green', icon: 'scale', visual: 'checklist' },
    ],
    cards: [
      { title: 'DQN', body: 'Bueno para acciones discretas y valores comparables.', theme: 'blue', visual: 'bars' },
      { title: 'PPO', body: 'Robusto con actualizaciones prudentes.', theme: 'violet', visual: 'clip' },
      { title: 'SAC', body: 'Exploración controlada con entropía.', theme: 'teal', visual: 'thermo' },
      { title: 'Modelos', body: 'Ahorra interacción si la maqueta es fiable.', theme: 'orange', visual: 'twoTracks' },
    ],
    bottomTitle: 'Matriz mental', bottomBullets: ['Qué representa la red: valor, política o mundo?', 'Cómo evita inestabilidad?', 'Cuánta exploración necesita?', 'Qué evidencia soporta la elección?'], bottomTheme: 'green', bottomIcon: 'check', bottomVisual: 'checklist',
    callout: 'Comparar algoritmos es comparar compromisos.',
    caption: 'Infografía de cierre de 3.6: matriz conceptual de DQN, PPO, SAC y World Models.',
  },
  {
    key: '4.1', file: 'codex3_ch4_1_veredicto', layout: 'evidence', mainTheme: 'green',
    title: 'Un veredicto sano no cabe en una media',
    subtitle: 'La media resume, pero dispersión, colapsos, semillas y coste dicen si el resultado es defendible.',
    top: [
      { title: 'Lectura estadística', body: 'Mira altura, intervalo, colapsos y coste antes de ordenar ganadores.', visual: 'bars' },
      { title: 'Cinco semillas', body: 'Una ejecución puede tener suerte o mala suerte. La distribución importa.', theme: 'violet', icon: 'gauge', visual: 'split' },
    ],
    cards: [
      { title: 'Media', body: 'Resumen útil, pero sensible a extremos.', theme: 'blue', visual: 'bars' },
      { title: 'Dispersión', body: 'Muestra estabilidad entre ejecuciones.', theme: 'violet', visual: 'gauge' },
      { title: 'Colapso', body: 'Una cola mala puede ocultarse tras un promedio.', theme: 'red', visual: 'bars' },
      { title: 'Coste', body: 'Más pasos y tiempo también forman parte del resultado.', theme: 'orange', visual: 'ledger' },
    ],
    bottomTitle: 'Lectura completa', bottomBullets: ['No declares con una sola semilla.', 'No compares medias sin variabilidad.', 'No ignores colapsos aunque la media suba.', 'No olvides presupuesto y protocolo congelado.'], bottomTheme: 'green', bottomIcon: 'scale', bottomVisual: 'checklist',
    callout: 'Evidencia es resultado más incertidumbre más condiciones.',
    caption: 'Infografía de cierre de 4.1: media, dispersión, colapsos, coste y protocolo para leer el veredicto.',
  },
  {
    key: '4.2', file: 'codex3_ch4_2_ablacion', layout: 'standard',
    title: 'Ablación es causalidad práctica',
    subtitle: 'Quitar una pieza de la receta y medir el daño ayuda a distinguir adorno de causa.',
    top: [
      { title: 'Antes y después', body: 'La pregunta no es si una receta funciona, sino qué parte sostiene el efecto.', theme: 'blue', icon: 'scale', visual: 'bars' },
      { title: 'Causalidad útil', body: 'Si al retirar una pieza cae el rendimiento, esa pieza era candidata causal.', theme: 'green', icon: 'check', visual: 'flow' },
    ],
    cards: [
      { title: 'Baseline', body: 'Receta completa bajo protocolo congelado.', theme: 'green', visual: 'ledger' },
      { title: 'Quitar', body: 'Retiras una pieza, no cinco a la vez.', theme: 'orange', visual: 'split' },
      { title: 'Medir', body: 'Comparas éxito, dispersión y colapso.', theme: 'blue', visual: 'bars' },
      { title: 'Concluir', body: 'Atribuyes efecto con prudencia experimental.', theme: 'violet', visual: 'checklist' },
    ],
    bottomTitle: 'No es grid search', bottomBullets: ['Grid search busca configuración.', 'Ablación pregunta por mecanismo.', 'Debe cambiar una pieza cada vez.', 'El resultado se lee con la misma métrica final.'], bottomTheme: 'amber', bottomIcon: 'target', bottomVisual: 'flow',
    callout: 'Quitar bien enseña más que añadir sin medir.',
    caption: 'Infografía de cierre de 4.2: ablación como puente entre receta, mecanismo y causalidad práctica.',
  },
  {
    key: '4.3', file: 'codex3_ch4_3_reproducible', layout: 'standard',
    title: 'Una cifra confiable deja rastro',
    subtitle: 'El resultado reproducible conecta generador, semillas, ledger, figura y hash de protocolo.',
    top: [
      { title: 'Ruta de datos', body: 'Nivel generado, episodio evaluado, fila en ledger, agregación y figura final.', theme: 'blue', icon: 'ledger', visual: 'flow' },
      { title: 'Protocolo congelado', body: 'El hash fija condiciones antes de mirar resultados y evita redecidir a posteriori.', theme: 'green', icon: 'check', visual: 'checklist' },
    ],
    cards: [
      { title: 'Generador', body: 'Produce familias y dificultad controladas.', theme: 'blue', visual: 'matrix' },
      { title: 'Semillas', body: 'Repiten entrenamiento y evaluación de forma independiente.', theme: 'violet', visual: 'split' },
      { title: 'Ledger', body: 'Cada run queda como fila trazable.', theme: 'green', visual: 'ledger' },
      { title: 'Figura', body: 'La gráfica resume sin perder el origen.', theme: 'orange', visual: 'bars' },
    ],
    bottomTitle: 'Checklist de confianza', bottomBullets: ['Puedo reconstruir de dónde salió cada punto?', 'Los splits son disjuntos?', 'La métrica estaba fijada antes?', 'El protocolo no se re-congeló tras ver resultados?'], bottomTheme: 'green', bottomIcon: 'check', bottomVisual: 'ledger',
    callout: 'Sin trazabilidad, una cifra es solo una frase bonita.',
    caption: 'Infografía de cierre de 4.3: ruta reproducible desde generador y ledger hasta figura.',
  },
  {
    key: '4.4', file: 'codex3_ch4_4_app', layout: 'evidence', mainTheme: 'blue',
    title: 'La app enseña mecanismos; el protocolo declara resultados',
    subtitle: 'Una demo interactiva sirve para comprender, pero la evidencia vive en evaluación congelada.',
    top: [
      { title: 'Qué mirar al jugar', body: 'Estado, acción, Q-values, recompensa, transición y curva cuentan partes distintas.', visual: 'bars' },
      { title: 'Qué no declarar', body: 'Una partida bonita no reemplaza test, semillas, split y ledger reproducible.', theme: 'red', icon: 'check', visual: 'checklist' },
    ],
    cards: [
      { title: 'Inspector', body: 'Permite ver por qué el agente decidió.', theme: 'blue', visual: 'matrix' },
      { title: 'Curvas', body: 'Muestran tendencia, pero no son veredicto final.', theme: 'amber', visual: 'bars' },
      { title: 'Transición', body: 'Conecta pantalla actual con aprendizaje.', theme: 'cyan', visual: 'flow' },
      { title: 'Test', body: 'Solo el protocolo cerrado declara rendimiento.', theme: 'green', visual: 'ledger' },
    ],
    bottomTitle: 'Uso pedagógico correcto', bottomBullets: ['La interfaz ayuda a ver mecanismos.', 'Las capturas no prueban generalización.', 'El dashboard debe apuntar al ledger.', 'El informe separa demo y evidencia.'], bottomTheme: 'blue', bottomIcon: 'target', bottomVisual: 'checklist',
    callout: 'La app explica; el protocolo certifica.',
    caption: 'Infografía de cierre de 4.4: cómo leer la app sin confundir demo con evidencia experimental.',
  },
  {
    key: '5.1', file: 'codex3_ch5_1_atlas_final', layout: 'atlas', mainTheme: 'blue',
    title: 'Lo que sobrevive al proyecto',
    subtitle: 'El valor transferible no es Arkanoid: es aprender a formular, medir y explicar Deep RL con rigor.',
    mainTitle: 'Atlas final de aprendizaje transferible',
    mainSubtitle: 'Cada pieza puede viajar a otro proyecto: tarea, observación, recompensa, red, protocolo y visualización pedagógica.',
    cards: [
      { title: 'Formulación', body: 'La tarea correcta vale más que insistir con una mala.', theme: 'blue', icon: 'target' },
      { title: 'Estado', body: 'Lo que no entra en el tensor no puede guiar la política.', theme: 'cyan', icon: 'network' },
      { title: 'Recompensa', body: 'El proxy guía, pero la métrica externa juzga.', theme: 'orange', icon: 'gauge' },
      { title: 'Algoritmo', body: 'Cada método trae compromisos de estabilidad y exploración.', theme: 'violet', icon: 'scale' },
      { title: 'Evidencia', body: 'Semillas, splits y protocolo convierten demo en resultado.', theme: 'green', icon: 'ledger' },
      { title: 'Docencia', body: 'Una buena figura enseña mecanismo, no solo decora.', theme: 'rose', icon: 'check' },
    ],
    bottomTitle: 'Regla final', bottomBullets: ['Primero formula bien el problema.', 'Después elige el algoritmo por mecanismo.', 'Mide con protocolo antes de celebrar.', 'Explica con visuales que permitan auditar.'], bottomTheme: 'blue', bottomIcon: 'check', bottomVisual: 'checklist',
    callout: 'Buen Deep RL = buena tarea + buena evidencia + buena explicación.',
    caption: 'Infografía de cierre de 5.1: atlas final de lecciones transferibles del proyecto.',
  },
];

function render(sec) {
  if (sec.layout === 'algorithm') return algorithm(sec);
  if (sec.layout === 'evidence') return evidence(sec);
  if (sec.layout === 'atlas') return atlas(sec);
  return standard(sec);
}

function replacePanels() {
  let html = fs.readFileSync(reportPath, 'utf8');
  for (const sec of sections) {
    const marker = `<!-- codex3-panel:${sec.key} -->`;
    const figure = `${marker}
<figure class="codex-fig codex3-panel"><img src="assets/${sec.file}.png" alt="${esc(sec.title)}"><figcaption>${esc(sec.caption)}</figcaption></figure>`;
    const escapedKey = sec.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existing = new RegExp(`<!-- codex(?:2|3)-panel:${escapedKey} -->\\n<figure class="codex-fig codex(?:2|3)-panel">[\\s\\S]*?<\\/figure>`, 'm');
    if (existing.test(html)) {
      html = html.replace(existing, figure);
    }
  }
  fs.writeFileSync(reportPath, html);
}

function main() {
  fs.mkdirSync(assetsDir, { recursive: true });
  fs.mkdirSync(qaDir, { recursive: true });
  for (const sec of sections) {
    const svgPath = path.join(assetsDir, `${sec.file}.svg`);
    const pngPath = path.join(assetsDir, `${sec.file}.png`);
    const qaPath = path.join(qaDir, `${sec.file}.png`);
    fs.writeFileSync(svgPath, render(sec));
    const args = ['-w', String(W), '-h', String(H), svgPath, '-o', pngPath];
    const result = spawnSync('rsvg-convert', args, { encoding: 'utf8' });
    if (result.status !== 0) {
      throw new Error(`rsvg-convert failed for ${sec.file}: ${result.stderr || result.stdout}`);
    }
    fs.copyFileSync(pngPath, qaPath);
  }
  replacePanels();
  console.log(`Generated ${sections.length} codex3 infographics and updated report panels.`);
}

main();
