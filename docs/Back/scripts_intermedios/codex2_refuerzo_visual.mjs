import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const assetsDir = path.join(root, 'docs', 'assets');
const reportPath = path.join(root, 'docs', 'report_v3_version_codex.html');

const C = {
  ink: '#0f172a',
  slate: '#475569',
  muted: '#64748b',
  line: '#dbe3ef',
  soft: '#f8fafc',
  blue: '#2563eb',
  blueSoft: '#eff6ff',
  cyan: '#0891b2',
  cyanSoft: '#ecfeff',
  violet: '#7c3aed',
  violetSoft: '#f5f3ff',
  green: '#059669',
  greenSoft: '#ecfdf5',
  amber: '#d97706',
  amberSoft: '#fff7ed',
  pink: '#db2777',
  pinkSoft: '#fdf2f8',
  red: '#dc2626',
  redSoft: '#fef2f2',
  gray: '#334155',
  graySoft: '#f1f5f9',
};

const themes = {
  idea: [C.blue, C.blueSoft],
  system: [C.cyan, C.cyanSoft],
  tech: [C.violet, C.violetSoft],
  evidence: [C.green, C.greenSoft],
  warning: [C.amber, C.amberSoft],
  risk: [C.pink, C.pinkSoft],
  limit: [C.gray, C.graySoft],
  error: [C.red, C.redSoft],
};

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrap(text, max = 32) {
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (!line) {
      line = word;
    } else if ((line + ' ' + word).length <= max) {
      line += ' ' + word;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function textLines(x, y, lines, opts = {}) {
  const {
    size = 24,
    weight = 500,
    fill = C.slate,
    anchor = 'start',
    gap = Math.round(size * 1.35),
    family = '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  } = opts;
  return lines.map((line, i) => (
    `<text x="${x}" y="${y + i * gap}" font-family="${family}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${fill}">${esc(line)}</text>`
  )).join('');
}

function header(title, subtitle) {
  return `
    <text x="80" y="72" font-size="52" font-weight="900" fill="${C.ink}">${esc(title)}</text>
    ${textLines(80, 114, wrap(subtitle, 88), { size: 25, fill: C.slate, weight: 500 })}
  `;
}

function footer(text, theme = 'evidence') {
  const [color, soft] = themes[theme] ?? themes.evidence;
  const lines = wrap(text, 90).slice(0, 2);
  return `
    <rect x="80" y="850" width="1440" height="108" rx="18" fill="${soft}" stroke="${color}" stroke-width="2"/>
    ${textLines(120, 895, lines, { size: 28, weight: 800, fill: color, gap: 38 })}
  `;
}

function card(x, y, w, h, title, body, theme = 'idea', opts = {}) {
  const [color, soft] = themes[theme] ?? themes.idea;
  const titleSize = opts.titleSize ?? 27;
  const bodySize = opts.bodySize ?? 21;
  const max = opts.max ?? Math.max(18, Math.floor(w / 17));
  const bodyLines = Array.isArray(body) ? body : wrap(body, max);
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${soft}" stroke="${color}" stroke-width="2.2"/>
    <rect x="${x + 24}" y="${y + 24}" width="52" height="52" rx="14" fill="#fff" stroke="${color}" stroke-width="2"/>
    <circle cx="${x + 50}" cy="${y + 50}" r="11" fill="${color}"/>
    ${textLines(x + 92, y + 54, wrap(title, Math.floor((w - 120) / 16)), { size: titleSize, weight: 900, fill: color, gap: 31 })}
    ${textLines(x + 28, y + 112, bodyLines.slice(0, opts.maxLines ?? 5), { size: bodySize, weight: 520, fill: C.ink, gap: Math.round(bodySize * 1.35) })}
  `;
}

function pill(x, y, w, text, theme = 'idea') {
  const [color, soft] = themes[theme] ?? themes.idea;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="44" rx="22" fill="${color}"/>
    <text x="${x + w / 2}" y="${y + 29}" font-size="20" font-weight="800" text-anchor="middle" fill="#fff">${esc(text)}</text>
  `;
}

function arrow(x1, y1, x2, y2, color = C.cyan, width = 5) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const hx = x2 - 16 * Math.cos(angle);
  const hy = y2 - 16 * Math.sin(angle);
  const left = `${hx - 10 * Math.sin(angle)},${hy + 10 * Math.cos(angle)}`;
  const right = `${hx + 10 * Math.sin(angle)},${hy - 10 * Math.cos(angle)}`;
  return `
    <line x1="${x1}" y1="${y1}" x2="${hx}" y2="${hy}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>
    <polygon points="${x2},${y2} ${left} ${right}" fill="${color}"/>
  `;
}

function svg(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" role="img" aria-labelledby="title desc">
  <rect width="1600" height="1000" fill="#ffffff"/>
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.12"/>
    </filter>
  </defs>
  ${body}
</svg>
`;
}

function gridIcon(x, y, rows = 5, cols = 7, cell = 16) {
  let out = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const active = (r + c * 2) % 4 !== 0;
      out += `<rect x="${x + c * (cell + 4)}" y="${y + r * (cell + 4)}" width="${cell}" height="${cell}" rx="3" fill="${active ? C.blue : '#e2e8f0'}"/>`;
    }
  }
  return out;
}

function network(x, y, layers, color = C.violet) {
  const gapX = 120;
  let out = '';
  const coords = [];
  layers.forEach((n, li) => {
    const cx = x + li * gapX;
    const start = y - ((n - 1) * 34) / 2;
    const layer = [];
    for (let i = 0; i < n; i++) {
      layer.push([cx, start + i * 34]);
    }
    coords.push(layer);
  });
  for (let li = 0; li < coords.length - 1; li++) {
    for (const a of coords[li]) {
      for (const b of coords[li + 1]) {
        out += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#cbd5e1" stroke-width="1.4"/>`;
      }
    }
  }
  for (const layer of coords) {
    for (const [cx, cy] of layer) {
      out += `<circle cx="${cx}" cy="${cy}" r="12" fill="#fff" stroke="${color}" stroke-width="3"/>`;
    }
  }
  return out;
}

function barSet(x, y, labels, values, color = C.blue, w = 220) {
  return labels.map((label, i) => {
    const yy = y + i * 52;
    return `
      <text x="${x}" y="${yy + 24}" font-size="19" font-weight="700" fill="${C.ink}">${esc(label)}</text>
      <rect x="${x + 120}" y="${yy}" width="${w}" height="30" rx="9" fill="#e2e8f0"/>
      <rect x="${x + 120}" y="${yy}" width="${Math.round(w * values[i])}" height="30" rx="9" fill="${color}"/>
      <text x="${x + 132 + w}" y="${yy + 22}" font-size="18" font-weight="800" fill="${color}">${Math.round(values[i] * 100)}%</text>
    `;
  }).join('');
}

function flowPanel(p) {
  const stepW = 250;
  const sx = 96;
  const body = `
    ${header(p.title, p.subtitle)}
    ${card(80, 155, 680, 230, p.leftTitle, p.leftBody, p.leftTheme ?? 'idea')}
    ${card(840, 155, 680, 230, p.rightTitle, p.rightBody, p.rightTheme ?? 'system')}
    ${p.steps.map((s, i) => {
      const x = sx + i * (stepW + 34);
      return `
        <rect x="${x}" y="470" width="${stepW}" height="170" rx="18" fill="${themes[s.theme ?? 'tech'][1]}" stroke="${themes[s.theme ?? 'tech'][0]}" stroke-width="2"/>
        <text x="${x + 24}" y="512" font-size="18" font-weight="900" fill="${themes[s.theme ?? 'tech'][0]}">PASO ${i + 1}</text>
        ${textLines(x + 24, 552, wrap(s.title, 15), { size: 27, weight: 900, fill: C.ink, gap: 31 })}
        ${textLines(x + 24, 610, wrap(s.body, 19).slice(0, 3), { size: 18, weight: 520, fill: C.slate, gap: 24 })}
        ${i < p.steps.length - 1 ? arrow(x + stepW + 8, 555, x + stepW + 30, 555, C.cyan, 5) : ''}
      `;
    }).join('')}
    ${p.extra ?? ''}
    ${footer(p.footer, p.footerTheme ?? 'evidence')}
  `;
  return svg(body);
}

function comparePanel(p) {
  const body = `
    ${header(p.title, p.subtitle)}
    ${card(80, 160, 680, 260, p.leftTitle, p.leftBody, p.leftTheme ?? 'warning', { max: 39, maxLines: 5 })}
    ${card(840, 160, 680, 260, p.rightTitle, p.rightBody, p.rightTheme ?? 'evidence', { max: 39, maxLines: 5 })}
    ${arrow(762, 292, 828, 292, C.cyan, 7)}
    <rect x="130" y="490" width="550" height="250" rx="22" fill="#fff" stroke="${themes[p.leftTheme ?? 'warning'][0]}" stroke-width="2"/>
    ${p.leftVisual ?? ''}
    <rect x="920" y="490" width="550" height="250" rx="22" fill="#fff" stroke="${themes[p.rightTheme ?? 'evidence'][0]}" stroke-width="2"/>
    ${p.rightVisual ?? ''}
    ${p.extra ?? ''}
    ${footer(p.footer, p.footerTheme ?? 'evidence')}
  `;
  return svg(body);
}

function formulaPanel(p) {
  const body = `
    ${header(p.title, p.subtitle)}
    <rect x="80" y="160" width="1440" height="190" rx="24" fill="${C.violetSoft}" stroke="${C.violet}" stroke-width="2.5"/>
    ${textLines(130, 235, wrap(p.formula, 56), { size: 44, weight: 900, fill: C.violet, gap: 58, family: 'Menlo, Consolas, monospace' })}
    ${p.parts.map((part, i) => {
      const x = 100 + i * 355;
      return card(x, 425, 310, 230, part.title, part.body, part.theme ?? 'idea', { max: 22, maxLines: 4, titleSize: 25, bodySize: 20 });
    }).join('')}
    ${p.extra ?? ''}
    ${footer(p.footer, p.footerTheme ?? 'evidence')}
  `;
  return svg(body);
}

function anatomyPanel(p) {
  const body = `
    ${header(p.title, p.subtitle)}
    ${card(80, 170, 360, 210, p.leftTitle, p.leftBody, p.leftTheme ?? 'system', { max: 23, maxLines: 4 })}
    <rect x="500" y="170" width="600" height="520" rx="26" fill="#fff" stroke="${C.violet}" stroke-width="2.5" filter="url(#shadow)"/>
    <text x="800" y="220" font-size="30" font-weight="900" text-anchor="middle" fill="${C.violet}">${esc(p.centerTitle)}</text>
    ${p.centerVisual ?? network(590, 445, [4, 5, 4, 3], C.violet)}
    ${card(1160, 170, 360, 210, p.rightTitle, p.rightBody, p.rightTheme ?? 'evidence', { max: 23, maxLines: 4 })}
    ${p.cards.map((c, i) => card(80 + i * 370, 720, 330, 130, c.title, c.body, c.theme ?? 'idea', { max: 20, maxLines: 2, titleSize: 23, bodySize: 18 })).join('')}
    ${footer(p.footer, p.footerTheme ?? 'evidence')}
  `;
  return svg(body);
}

function matrixPanel(p) {
  const cols = p.cols.length;
  const rows = p.rows.length;
  const x0 = 110;
  const y0 = 210;
  const cw = Math.floor(1380 / (cols + 1));
  const ch = Math.floor(430 / (rows + 1));
  let table = '';
  p.cols.forEach((c, i) => {
    table += `<rect x="${x0 + (i + 1) * cw}" y="${y0}" width="${cw}" height="${ch}" fill="${C.gray}" stroke="#fff"/><text x="${x0 + (i + 1) * cw + cw / 2}" y="${y0 + ch / 2 + 8}" font-size="20" font-weight="900" text-anchor="middle" fill="#fff">${esc(c)}</text>`;
  });
  p.rows.forEach((r, ri) => {
    table += `<rect x="${x0}" y="${y0 + (ri + 1) * ch}" width="${cw}" height="${ch}" fill="${ri % 2 ? C.graySoft : '#fff'}" stroke="${C.line}"/><text x="${x0 + 22}" y="${y0 + (ri + 1) * ch + ch / 2 + 8}" font-size="20" font-weight="900" fill="${C.ink}">${esc(r)}</text>`;
    p.cells[ri].forEach((cell, ci) => {
      const theme = themes[cell.theme ?? 'idea'];
      table += `<rect x="${x0 + (ci + 1) * cw}" y="${y0 + (ri + 1) * ch}" width="${cw}" height="${ch}" fill="${theme[1]}" stroke="${C.line}"/>${textLines(x0 + (ci + 1) * cw + cw / 2, y0 + (ri + 1) * ch + 34, wrap(cell.text, 14).slice(0, 2), { size: 18, weight: 800, fill: theme[0], anchor: 'middle', gap: 24 })}`;
    });
  });
  return svg(`
    ${header(p.title, p.subtitle)}
    ${table}
    ${p.extra ?? ''}
    ${footer(p.footer, p.footerTheme ?? 'evidence')}
  `);
}

function dashboardPanel(p) {
  return svg(`
    ${header(p.title, p.subtitle)}
    <rect x="80" y="155" width="920" height="610" rx="28" fill="#fff" stroke="${C.line}" stroke-width="2.5" filter="url(#shadow)"/>
    <rect x="120" y="205" width="390" height="310" rx="18" fill="${C.graySoft}" stroke="${C.line}"/>
    ${gridIcon(155, 235, 7, 10, 22)}
    <circle cx="325" cy="455" r="15" fill="${C.amber}"/>
    <rect x="270" y="485" width="110" height="22" rx="10" fill="${C.green}"/>
    <rect x="560" y="205" width="390" height="130" rx="18" fill="${C.blueSoft}" stroke="${C.blue}"/>
    ${barSet(595, 242, ['PPO', 'DQN', 'WM'], [0.91, 0.77, 0.55], C.blue, 160)}
    <rect x="560" y="370" width="390" height="145" rx="18" fill="${C.violetSoft}" stroke="${C.violet}"/>
    ${barSet(595, 407, ['izq.', 'quieto', 'der.'], [0.18, 0.25, 0.57], C.violet, 160)}
    <rect x="120" y="555" width="830" height="150" rx="18" fill="${C.greenSoft}" stroke="${C.green}"/>
    ${textLines(155, 602, wrap(p.panelText, 58), { size: 25, weight: 800, fill: C.green, gap: 34 })}
    ${p.callouts.map((c, i) => card(1040, 160 + i * 150, 480, 120, c.title, c.body, c.theme ?? 'idea', { max: 34, maxLines: 2, titleSize: 24, bodySize: 19 })).join('')}
    ${footer(p.footer, p.footerTheme ?? 'evidence')}
  `);
}

function posterPanel(p) {
  return svg(`
    ${header(p.title, p.subtitle)}
    <circle cx="800" cy="465" r="230" fill="${C.blueSoft}" stroke="${C.blue}" stroke-width="3"/>
    <circle cx="800" cy="465" r="150" fill="${C.greenSoft}" stroke="${C.green}" stroke-width="3"/>
    <circle cx="800" cy="465" r="72" fill="${C.violetSoft}" stroke="${C.violet}" stroke-width="3"/>
    <text x="800" y="450" font-size="32" font-weight="900" text-anchor="middle" fill="${C.violet}">${esc(p.centerA)}</text>
    <text x="800" y="490" font-size="28" font-weight="900" text-anchor="middle" fill="${C.green}">${esc(p.centerB)}</text>
    ${p.cards.map((c, i) => {
      const pos = [[80, 190], [1160, 190], [80, 585], [1160, 585]][i];
      return card(pos[0], pos[1], 360, 210, c.title, c.body, c.theme ?? 'idea', { max: 24, maxLines: 4 });
    }).join('')}
    ${p.extra ?? ''}
    ${footer(p.footer, p.footerTheme ?? 'evidence')}
  `);
}

const panels = [
  {
    key: '0.2',
    file: 'codex2_ch0_2_cierre_panel.svg',
    insert: false,
    type: 'matrix',
    title: 'Leer la guía es elegir el nivel de zoom',
    subtitle: 'El mismo capítulo sirve para entender, construir o auditar, sin obligar a todos a bajar igual de profundo.',
    cols: ['Intuición', 'Mecanismo', 'Evidencia'],
    rows: ['Pregunta', 'Figura', 'Cierre'],
    cells: [
      [{ text: 'qué problema', theme: 'idea' }, { text: 'qué piezas', theme: 'tech' }, { text: 'qué prueba', theme: 'evidence' }],
      [{ text: 'mapa visual', theme: 'system' }, { text: 'flujo o red', theme: 'tech' }, { text: 'gráfica anotada', theme: 'warning' }],
      [{ text: 'idea clave', theme: 'idea' }, { text: 'error común', theme: 'risk' }, { text: 'límite honesto', theme: 'limit' }],
    ],
    footer: 'La guía no es lineal por obligación: es un control de zoom para aprender con el nivel de detalle que necesitas.',
    caption: 'Cierre tipo panel de 0.2: el lector puede moverse entre intuición, mecanismo y evidencia sin perder el hilo.',
  },
  {
    key: '0.3',
    file: 'codex2_ch0_3_cierre_panel.svg',
    type: 'flow',
    title: 'El laboratorio completo cabe en una cadena',
    subtitle: 'El proyecto se entiende cuando separas tarea, agente, algoritmo, protocolo y resultado.',
    leftTitle: 'Lo que se construye',
    leftBody: 'Un Arkanoid controlado donde el agente recibe estado, actúa y aprende por consecuencias.',
    rightTitle: 'Lo que se declara',
    rightBody: 'Resultados en niveles no vistos, con semillas, presupuesto y evaluación greedy.',
    steps: [
      { title: 'Tarea', body: 'qué ve y qué debe lograr', theme: 'system' },
      { title: 'Receta', body: 'estado, reloj, recompensa', theme: 'warning' },
      { title: 'Agentes', body: 'cinco familias comparables', theme: 'tech' },
      { title: 'Evidencia', body: 'splits, semillas, ledger', theme: 'evidence' },
      { title: 'Lectura', body: 'qué demuestra y qué no', theme: 'limit' },
    ],
    footer: 'La cifra final solo importa porque puedes rastrear la historia completa que la produjo.',
    caption: 'Cierre tipo panel de 0.3: mapa causal desde el laboratorio hasta la evidencia declarable.',
  },
  {
    key: '1.1',
    file: 'codex2_ch1_1_cierre_panel.svg',
    type: 'flow',
    title: 'Aprender por consecuencias no es recibir respuestas',
    subtitle: 'El agente no tiene etiqueta correcta: tiene estados, acciones, recompensas y tiempo.',
    leftTitle: 'Sin profesor',
    leftBody: 'Nadie dice la acción correcta. El entorno solo devuelve consecuencias después de actuar.',
    rightTitle: 'Con memoria de actos',
    rightBody: 'Cada transición guarda lo que pasó y permite corregir la política o el valor.',
    steps: [
      { title: 'Observar', body: 'estado s', theme: 'system' },
      { title: 'Actuar', body: 'acción a', theme: 'tech' },
      { title: 'Cobrar', body: 'recompensa r', theme: 'warning' },
      { title: 'Guardar', body: 'siguiente estado', theme: 'idea' },
      { title: 'Ajustar', body: 'valor o política', theme: 'evidence' },
    ],
    footer: 'RL aprende una conducta a partir de consecuencias acumuladas, no una respuesta correcta por ejemplo.',
    caption: 'Cierre tipo panel de 1.1: el aprendizaje por refuerzo como secuencia de consecuencias acumuladas.',
  },
  {
    key: '1.2',
    file: 'codex2_ch1_2_cierre_panel.svg',
    type: 'compare',
    title: 'Una recompensa alta puede contar la historia equivocada',
    subtitle: 'Sobrevivir, rebotar y limpiar son señales distintas; medirlas como si fueran una sola engaña.',
    leftTitle: 'Proxy cómodo',
    leftBody: 'Rebotes y supervivencia suben la recompensa aunque el nivel siga sin resolverse.',
    rightTitle: 'Objetivo real',
    rightBody: 'El éxito pregunta si el agente limpia el nivel y generaliza a tableros no vistos.',
    leftTheme: 'warning',
    rightTheme: 'evidence',
    leftVisual: `${barSet(185, 560, ['rebotes', 'tiempo', 'ladrillos'], [0.75, 0.55, 0.22], C.amber, 250)}`,
    rightVisual: `${barSet(975, 560, ['limpia', 'test', 'OOD'], [0.91, 0.89, 0.72], C.green, 250)}`,
    footer: 'La recompensa guía el entrenamiento; el éxito juzga la tarea. Confundirlos abre la puerta al reward hacking.',
    caption: 'Cierre tipo panel de 1.2: separación entre proxy de entrenamiento y objetivo real.',
  },
  {
    key: '1.3',
    file: 'codex2_ch1_3_cierre_panel.svg',
    type: 'flow',
    title: 'Un resultado solo vale si el examen está limpio',
    subtitle: 'Train, validación, test y OOD no son nombres: son permisos distintos para tomar decisiones.',
    leftTitle: 'Decidir durante el desarrollo',
    leftBody: 'Train aprende y validación orienta cambios. Ahí se ajusta la receta.',
    rightTitle: 'Declarar al final',
    rightBody: 'Test y OOD deben quedar protegidos para que la cifra no esté cocinada.',
    steps: [
      { title: 'Generador', body: 'crea familias', theme: 'system' },
      { title: 'Train', body: 'aprende', theme: 'idea' },
      { title: 'Valid', body: 'decide', theme: 'warning' },
      { title: 'Test', body: 'declara', theme: 'evidence' },
      { title: 'OOD', body: 'estresan generalización', theme: 'risk' },
    ],
    footer: 'Si el test influye en la receta, deja de ser test y se convierte en entrenamiento encubierto.',
    caption: 'Cierre tipo panel de 1.3: protocolo de evaluación y frontera contra fuga de datos.',
  },
  {
    key: '1.4',
    file: 'codex2_ch1_4_cierre_panel.svg',
    type: 'compare',
    title: 'El agente ciego no falló por tonto: falló por incompleto',
    subtitle: 'La observación fija el techo de lo que un algoritmo puede aprender.',
    leftTitle: 'Veía movimiento',
    leftBody: 'Bola, pala y velocidades bastaban para sobrevivir e interceptar.',
    rightTitle: 'No veía objetivo',
    rightBody: 'Sin matriz de ladrillos no podía apuntar ni planificar limpieza.',
    leftTheme: 'idea',
    rightTheme: 'risk',
    leftVisual: `${barSet(185, 560, ['interceptar', 'sobrevivir', 'limpiar'], [0.75, 0.62, 0.02], C.blue, 250)}`,
    rightVisual: `${gridIcon(1015, 530, 5, 8, 22)}${textLines(1010, 690, wrap('La rejilla que faltaba era la meta.', 24), { size: 22, weight: 900, fill: C.pink })}`,
    footer: 'Más entrenamiento no inventa una variable ausente: antes de culpar al algoritmo, mira qué información recibe.',
    caption: 'Cierre tipo panel de 1.4: comparación entre sobrevivir con cinemática y decidir con mapa del objetivo.',
  },
  {
    key: '1.5',
    file: 'codex2_ch1_5_cierre_panel.svg',
    type: 'matrix',
    title: 'Diagnosticar es mover la culpa al sitio correcto',
    subtitle: 'Los tres muros parecían fallos de algoritmo, pero cada prueba apuntaba a la formulación.',
    cols: ['Síntoma', 'Causa real', 'Arreglo'],
    rows: ['Reloj', 'Shaping', 'Estado'],
    cells: [
      [{ text: 'no da tiempo', theme: 'warning' }, { text: 'timeout fijo', theme: 'risk' }, { text: 'reloj proporcional', theme: 'evidence' }],
      [{ text: 'premio sube', theme: 'warning' }, { text: 'proxy cómodo', theme: 'risk' }, { text: 'quitar ayuda', theme: 'evidence' }],
      [{ text: 'no apunta', theme: 'warning' }, { text: 'no ve muro', theme: 'risk' }, { text: 'matriz 8x10', theme: 'evidence' }],
    ],
    footer: 'El diagnóstico sano no pregunta qué algoritmo está de moda, sino qué variable está impidiendo aprender.',
    caption: 'Cierre tipo panel de 1.5: diagnóstico de los tres muros como síntoma, causa y arreglo.',
  },
  {
    key: '1.6',
    file: 'codex2_ch1_6_cierre_panel.svg',
    type: 'anatomy',
    title: 'La receta traduce Arkanoid a una tarea aprendible',
    subtitle: 'El salto no vino de una pieza aislada, sino de encajar estado, reloj, recompensa y red.',
    leftTitle: 'Entrada honesta',
    leftBody: '6 cinemáticos y matriz 8x10 permiten ver física y objetivo.',
    centerTitle: 'Dos ramas, una decisión',
    centerVisual: `${gridIcon(585, 300, 5, 8, 18)}${network(725, 445, [4, 5, 5, 3], C.violet)}${arrow(675, 380, 725, 420, C.cyan, 5)}${arrow(920, 445, 1010, 445, C.violet, 5)}${textLines(1015, 438, ['Q o pi'], { size: 28, weight: 900, fill: C.violet })}`,
    rightTitle: 'Examen serio',
    rightBody: 'Éxito en niveles no vistos, greedy, semillas y presupuesto fijo.',
    cards: [
      { title: 'Reloj', body: 'escala con ladrillos', theme: 'warning' },
      { title: 'Recompensa', body: 'menos proxy', theme: 'risk' },
      { title: 'Encoder', body: 'respeta espacio', theme: 'tech' },
      { title: 'Test', body: 'no visto', theme: 'evidence' },
    ],
    footer: 'Una buena formulación convierte el problema en algo que distintos algoritmos pueden aprender y comparar.',
    caption: 'Cierre tipo panel de 1.6: anatomía de la receta que desbloquea el aprendizaje.',
  },
  {
    key: '1.7',
    file: 'codex2_ch1_7_cierre_panel.svg',
    type: 'flow',
    title: 'La conquista fue causal, no mágica',
    subtitle: 'El 91% se entiende como una cadena de arreglos, no como un golpe de suerte algorítmico.',
    leftTitle: 'Antes',
    leftBody: 'Agente ciego, reloj corto, recompensa desviada y test que revela el techo.',
    rightTitle: 'Después',
    rightBody: 'Estado completo, reloj justo, red espacial y evaluación limpia.',
    steps: [
      { title: 'Fallo', body: '0% disperso', theme: 'risk' },
      { title: 'Diagnóstico', body: 'tres muros', theme: 'warning' },
      { title: 'Receta', body: 'estado y reloj', theme: 'system' },
      { title: 'Agentes', body: 'cinco familias', theme: 'tech' },
      { title: 'Evidencia', body: '91% PPO', theme: 'evidence' },
    ],
    footer: 'La Parte I no demuestra que un algoritmo sea mágico; demuestra que formular bien cambia el techo.',
    caption: 'Cierre tipo panel de 1.7: arco causal desde el agente ciego hasta la primera conquista.',
  },
  {
    key: '2.1',
    file: 'codex2_ch2_1_bucle_dataset.svg',
    type: 'flow',
    title: 'Del paso aislado al dataset vivo',
    subtitle: 'Una transición no enseña por sí sola; millones de transiciones alimentan el aprendizaje.',
    leftTitle: 'Una vuelta del bucle',
    leftBody: 'Estado, acción, recompensa, nuevo estado y done forman la unidad mínima de experiencia.',
    rightTitle: 'Un archivo que crece jugando',
    rightBody: 'Cada episodio añade filas que luego usan Bellman, replay, redes y evaluación.',
    steps: [
      { title: 's', body: 'estado 86', theme: 'system' },
      { title: 'a', body: 'izq. quieto der.', theme: 'tech' },
      { title: 'r', body: 'consecuencia', theme: 'warning' },
      { title: "s'", body: 'nuevo estado', theme: 'idea' },
      { title: 'done', body: 'corta futuro', theme: 'risk' },
    ],
    footer: 'RL aprende de filas de experiencia: cada decisión se convierte en dato entrenable.',
    caption: 'Infografía de cierre de 2.1: la transición como unidad de datos que alimenta todo el aprendizaje.',
  },
  {
    key: '2.2',
    file: 'codex2_ch2_2_estado_observacion_tensor.svg',
    type: 'compare',
    title: 'Markov pregunta si la información basta',
    subtitle: 'La diferencia entre MDP y POMDP se entiende mirando qué entra en el estado del agente.',
    leftTitle: 'Observación parcial',
    leftBody: 'Dos mundos distintos pueden verse iguales si falta una variable relevante.',
    rightTitle: 'Estado suficiente',
    rightBody: 'La matriz de ladrillos y la física hacen que el siguiente paso sea predecible con sentido.',
    leftTheme: 'risk',
    rightTheme: 'evidence',
    leftVisual: `${gridIcon(185, 540, 4, 6, 25)}${textLines(190, 675, wrap('misma sombra, mundos distintos', 25), { size: 22, weight: 900, fill: C.pink })}`,
    rightVisual: `${gridIcon(975, 520, 5, 8, 20)}${barSet(975, 665, ['x,y', 'vx,vy', 'muro'], [0.7, 0.65, 1], C.green, 170)}`,
    footer: 'No memorices siglas: pregunta si el estado contiene lo necesario para decidir y predecir.',
    caption: 'Infografía de cierre de 2.2: estado real, observación y tensor como niveles de información.',
  },
  {
    key: '2.3',
    file: 'codex2_ch2_3_retorno_calculadora.svg',
    type: 'formula',
    title: 'El agente persigue futuro descontado',
    subtitle: 'La recompensa de ahora es solo una pieza; el retorno suma lo que viene después.',
    formula: 'G_t = r_t + gamma r_{t+1} + gamma^2 r_{t+2} + ...',
    parts: [
      { title: 'r ahora', body: 'lo que acaba de pasar en este paso', theme: 'warning' },
      { title: 'gamma', body: 'cuánto pesa el futuro', theme: 'tech' },
      { title: 'premio tardío', body: 'un ladrillo puede explicar acciones previas', theme: 'system' },
      { title: 'retorno', body: 'la cantidad que realmente se maximiza', theme: 'evidence' },
    ],
    footer: 'Gamma no es decoración matemática: define el horizonte mental del agente.',
    caption: 'Infografía de cierre de 2.3: calculadora visual de recompensa, descuento y retorno.',
  },
  {
    key: '2.4',
    file: 'codex2_ch2_4_bellman_microscopio.svg',
    type: 'formula',
    title: 'Bellman convierte experiencia en una diana',
    subtitle: 'La red no aprende de una etiqueta externa: aprende corrigiendo su predicción con lo ocurrido.',
    formula: 'target = r + gamma (1-done) Q_obj(s\', argmax Q(s\',a))',
    parts: [
      { title: 'Predicción', body: 'Q actual dijo cuánto valía la acción', theme: 'idea' },
      { title: 'Evidencia', body: 'r y s prima vienen del juego real', theme: 'evidence' },
      { title: 'Futuro', body: 'done apaga estados terminales', theme: 'warning' },
      { title: 'TD-error', body: 'sorpresa que mueve los pesos', theme: 'tech' },
    ],
    footer: 'Aprender valor es reducir la distancia entre lo que la red esperaba y lo que Bellman revela.',
    caption: 'Infografía de cierre de 2.4: microscopio de Bellman, target y TD-error.',
  },
  {
    key: '2.5',
    file: 'codex2_ch2_5_exploracion_distribuciones.svg',
    type: 'dashboard',
    title: 'Explorar no es actuar sin criterio',
    subtitle: 'Epsilon, política estocástica y entropía controlan cómo se recoge experiencia nueva.',
    panelText: 'Tres distribuciones pueden elegir la misma acción favorita, pero producir datos muy distintos.',
    callouts: [
      { title: 'Epsilon alto', body: 'rompe rutinas y descubre estados', theme: 'warning' },
      { title: 'Política estocástica', body: 'mantiene alternativas vivas', theme: 'tech' },
      { title: 'Entropía', body: 'mide variedad, no inteligencia', theme: 'risk' },
      { title: 'Evaluación greedy', body: 'quita ruido para declarar resultado', theme: 'evidence' },
    ],
    footer: 'La exploración útil produce datos que enseñan; la evaluación limpia mide la política sin azar.',
    caption: 'Infografía de cierre de 2.5: exploración como control de datos y no como ruido libre.',
  },
  {
    key: '2.6',
    file: 'codex2_ch2_6_replay_target_anatomia.svg',
    type: 'anatomy',
    title: 'DQN necesita memoria y una diana lenta',
    subtitle: 'Replay y red objetivo estabilizan problemas distintos: datos correlacionados y blanco móvil.',
    leftTitle: 'Replay buffer',
    leftBody: 'Guarda transiciones y saca minibatches barajados para romper correlación temporal.',
    centerTitle: 'Dos redes, dos ritmos',
    centerVisual: `${network(595, 390, [3, 5, 4], C.blue)}${network(820, 510, [3, 5, 4], C.green)}${arrow(755, 430, 835, 490, C.green, 5)}${textLines(610, 265, ['online: cambia rápido'], { size: 23, weight: 900, fill: C.blue })}${textLines(845, 650, ['objetivo: cambia lento'], { size: 23, weight: 900, fill: C.green })}`,
    rightTitle: 'Target estable',
    rightBody: 'La copia lenta evita que la red persiga una diana que ella misma mueve.',
    cards: [
      { title: 'Datos', body: 'mezclados', theme: 'system' },
      { title: 'Batch', body: '128 muestras', theme: 'idea' },
      { title: 'Tau', body: '0.01 suave', theme: 'tech' },
      { title: 'Efecto', body: 'menos nervio', theme: 'evidence' },
    ],
    footer: 'Replay arregla la muestra; la red objetivo arregla el blanco. Son dos estabilizadores, no adornos.',
    caption: 'Infografía de cierre de 2.6: anatomía del replay buffer y la red objetivo.',
  },
  {
    key: '2.7',
    file: 'codex2_ch2_7_red_tensor_86.svg',
    type: 'anatomy',
    title: 'De tensor 86 a acción',
    subtitle: 'La arquitectura traduce dos tipos de información a una decisión entrenable.',
    leftTitle: 'Entrada mixta',
    leftBody: '6 cinemáticos describen movimiento; 80 celdas describen el muro.',
    centerTitle: 'Ramas, fusión y cabeza',
    centerVisual: `${gridIcon(555, 280, 5, 8, 18)}${textLines(555, 245, ['matriz 8x10'], { size: 22, weight: 900, fill: C.blue })}${network(740, 410, [4, 5, 5], C.violet)}${arrow(695, 355, 740, 390, C.cyan, 5)}${barSet(870, 385, ['Q izq', 'Q quieto', 'Q der'], [0.42, 0.71, 0.55], C.violet, 105)}`,
    rightTitle: 'Cabeza variable',
    rightBody: 'DQN devuelve Q; PPO/SAC devuelven política; WM añade dinámica.',
    cards: [
      { title: 'Conv', body: 'vecindad', theme: 'tech' },
      { title: 'Densa', body: 'cinemática', theme: 'system' },
      { title: 'Fusión', body: 'estado útil', theme: 'idea' },
      { title: 'Salida', body: 'acción', theme: 'evidence' },
    ],
    footer: 'La red no solo calcula: impone un idioma para que el agente pueda leer el tablero.',
    caption: 'Infografía de cierre de 2.7: radiografía de la red de dos ramas y sus cabezas.',
  },
  {
    key: '2.8',
    file: 'codex2_ch2_8_rl_datos_moviles.svg',
    type: 'compare',
    title: 'En RL también se mueve la fuente de datos',
    subtitle: 'Entrenar una red en RL no es supervisado clásico: la política cambia lo que ve después.',
    leftTitle: 'Supervisado',
    leftBody: 'El dataset está quieto. La red persigue etiquetas fijas y la pérdida suele ser más legible.',
    rightTitle: 'Refuerzo',
    rightBody: 'La política cambia, recoge otros datos y vuelve móvil la distribución de entrenamiento.',
    leftTheme: 'idea',
    rightTheme: 'warning',
    leftVisual: `${barSet(185, 565, ['loss', 'datos', 'target'], [0.3, 0.95, 0.9], C.blue, 250)}`,
    rightVisual: `${barSet(975, 565, ['loss', 'datos', 'target'], [0.62, 0.45, 0.55], C.amber, 250)}`,
    footer: 'Una loss que vibra no siempre significa fracaso: en RL la cámara también se mueve.',
    caption: 'Infografía de cierre de 2.8: contraste entre entrenamiento supervisado y aprendizaje por refuerzo.',
  },
  {
    key: '3.1',
    file: 'codex2_ch3_1_dqn_q_radiografia.svg',
    type: 'anatomy',
    title: 'DQN decide comparando tres valores',
    subtitle: 'La política no está escrita aparte: sale de elegir la acción con mayor Q.',
    leftTitle: 'Aprende Q(s,a)',
    leftBody: 'Cada salida estima retorno futuro para una acción concreta.',
    centerTitle: 'Estado -> red -> Q-values',
    centerVisual: `${gridIcon(555, 295, 4, 7, 18)}${network(705, 430, [4, 5, 4], C.violet)}${barSet(870, 380, ['izq.', 'quieto', 'der.'], [0.38, 0.64, 0.91], C.blue, 110)}${textLines(1010, 575, ['argmax: der.'], { size: 26, weight: 900, fill: C.blue })}`,
    rightTitle: 'Estabiliza',
    rightBody: 'Replay mezcla datos y target network calcula blancos menos nerviosos.',
    cards: [
      { title: 'Off-policy', body: 'recicla pasado', theme: 'system' },
      { title: 'Bellman', body: 'crea target', theme: 'tech' },
      { title: 'Huber', body: 'controla outliers', theme: 'warning' },
      { title: 'Resultado', body: 'fiable', theme: 'evidence' },
    ],
    footer: 'DQN es transparente: si el estado está bien formulado, jugar es comparar valores.',
    caption: 'Infografía de cierre de 3.1: DQN como radiografía de estado, Q-values y argmax.',
  },
  {
    key: '3.2',
    file: 'codex2_ch3_2_actor_critico_clip.svg',
    type: 'anatomy',
    title: 'PPO mejora la política sin dar volantazos',
    subtitle: 'Actor y crítico comparten mirada; el clip limita cuánto puede cambiar la conducta.',
    leftTitle: 'Actor',
    leftBody: 'Devuelve probabilidades para izquierda, quieto y derecha.',
    centerTitle: 'Tronco compartido, dos cabezas',
    centerVisual: `${network(610, 415, [4, 5, 5], C.violet)}${arrow(885, 385, 995, 330, C.blue, 5)}${arrow(885, 465, 995, 555, C.green, 5)}${barSet(1010, 280, ['izq.', 'quieto', 'der.'], [0.18, 0.22, 0.60], C.blue, 120)}${textLines(1010, 545, ['V(s) = 3.4'], { size: 30, weight: 900, fill: C.green })}${pill(655, 620, 300, 'ratio 0.8 - 1.2', 'warning')}`,
    rightTitle: 'Crítico',
    rightBody: 'Estima V(s) para decir si la acción fue mejor o peor de lo esperado.',
    cards: [
      { title: 'On-policy', body: 'datos frescos', theme: 'warning' },
      { title: 'Ratio', body: 'cambio medido', theme: 'tech' },
      { title: 'Clip', body: 'prudencia', theme: 'risk' },
      { title: '91%', body: 'fiable', theme: 'evidence' },
    ],
    footer: 'PPO gana estabilidad porque aprende directamente la política, pero le impone un carril de seguridad.',
    caption: 'Infografía de cierre de 3.2: PPO como actor-crítico con recorte de actualización.',
  },
  {
    key: '3.3',
    file: 'codex2_ch3_3_sac_cinco_redes.svg',
    type: 'anatomy',
    title: 'SAC equilibra control y variedad',
    subtitle: 'No es una red: es un pequeño ecosistema con actor, críticos, copias objetivo y temperatura.',
    leftTitle: 'Máxima entropía',
    leftBody: 'No solo busca retorno: premia mantener alternativas útiles abiertas.',
    centerTitle: 'Cinco redes y un termostato',
    centerVisual: `
      <rect x="570" y="285" width="150" height="92" rx="18" fill="${C.pinkSoft}" stroke="${C.pink}" stroke-width="2.5"/>
      <text x="645" y="322" font-size="22" font-weight="900" text-anchor="middle" fill="${C.pink}">Actor</text>
      <text x="645" y="354" font-size="18" font-weight="700" text-anchor="middle" fill="${C.pink}">pi(a|s)</text>
      ${arrow(722, 330, 770, 330, C.cyan, 5)}
      <rect x="780" y="255" width="135" height="82" rx="18" fill="${C.blueSoft}" stroke="${C.blue}" stroke-width="2.5"/>
      <text x="847" y="302" font-size="22" font-weight="900" text-anchor="middle" fill="${C.blue}">Q1</text>
      <rect x="780" y="372" width="135" height="82" rx="18" fill="${C.blueSoft}" stroke="${C.blue}" stroke-width="2.5"/>
      <text x="847" y="419" font-size="22" font-weight="900" text-anchor="middle" fill="${C.blue}">Q2</text>
      ${arrow(917, 296, 955, 296, C.cyan, 5)}
      ${arrow(917, 413, 955, 413, C.cyan, 5)}
      <rect x="965" y="255" width="135" height="82" rx="18" fill="${C.greenSoft}" stroke="${C.green}" stroke-width="2.5"/>
      <text x="1032" y="292" font-size="21" font-weight="900" text-anchor="middle" fill="${C.green}">Target</text>
      <text x="1032" y="323" font-size="17" font-weight="700" text-anchor="middle" fill="${C.green}">Q1'</text>
      <rect x="965" y="372" width="135" height="82" rx="18" fill="${C.greenSoft}" stroke="${C.green}" stroke-width="2.5"/>
      <text x="1032" y="409" font-size="21" font-weight="900" text-anchor="middle" fill="${C.green}">Target</text>
      <text x="1032" y="440" font-size="17" font-weight="700" text-anchor="middle" fill="${C.green}">Q2'</text>
      <rect x="635" y="515" width="330" height="70" rx="22" fill="${C.amberSoft}" stroke="${C.amber}" stroke-width="2.5"/>
      <text x="800" y="560" font-size="24" font-weight="900" text-anchor="middle" fill="${C.amber}">alpha ajusta entropía</text>
    `,
    rightTitle: 'Dos críticos',
    rightBody: 'Tomar el mínimo reduce el optimismo que inflaría valores ruidosos.',
    cards: [
      { title: 'Actor', body: 'política', theme: 'risk' },
      { title: 'Q1/Q2', body: 'doble control', theme: 'idea' },
      { title: 'Targets', body: 'lentos', theme: 'evidence' },
      { title: 'Alpha', body: 'termostato', theme: 'warning' },
    ],
    footer: 'SAC no es solo exploración: es una negociación continua entre retorno, prudencia y diversidad.',
    caption: 'Infografía de cierre de 3.3: anatomía de SAC con cinco redes y temperatura de entropía.',
  },
  {
    key: '3.4',
    file: 'codex2_ch3_4_world_model_real_imaginado.svg',
    type: 'flow',
    title: 'Imaginar ayuda mientras la maqueta no mienta',
    subtitle: 'El World Model aprende del juego real y luego practica barato en un juego aproximado.',
    leftTitle: 'Carril real',
    leftBody: 'El entorno produce transiciones verdaderas: pocas, caras y confiables.',
    rightTitle: 'Carril imaginado',
    rightBody: 'El modelo produce transiciones baratas: muchas, útiles y potencialmente sesgadas.',
    steps: [
      { title: 'Jugar', body: 'experiencia real', theme: 'system' },
      { title: 'Modelar', body: 'predice delta s', theme: 'tech' },
      { title: 'Imaginar', body: '5 pasos ficticios', theme: 'warning' },
      { title: 'Actualizar', body: 'Q aprende', theme: 'idea' },
      { title: 'Techo', body: 'sesgo acumulado', theme: 'risk' },
    ],
    footer: 'Model-based es poderoso cuando la imaginación es fiel; aquí el sesgo del modelo puso el techo.',
    caption: 'Infografía de cierre de 3.4: World Model como carril real e imaginado con sesgo acumulado.',
  },
  {
    key: '3.5',
    file: 'codex2_ch3_5_wmrnn_memoria_secuencia.svg',
    type: 'compare',
    title: 'La memoria solo ayuda si falta información actual',
    subtitle: 'Una LSTM puede recordar historia, pero si el estado ya basta, añade coste y varianza.',
    leftTitle: 'Memoria útil',
    leftBody: 'Cuando la observación es parcial, la historia puede revelar velocidad, intención o contexto.',
    rightTitle: 'Memoria sobrante',
    rightBody: 'Con mapa y física suficientes, recordar puede complicar sin aportar señal nueva.',
    leftTheme: 'evidence',
    rightTheme: 'warning',
    leftVisual: `${arrow(210, 620, 305, 620, C.green, 5)}${arrow(335, 620, 430, 620, C.green, 5)}${arrow(460, 620, 555, 620, C.green, 5)}${textLines(185, 570, ['t-3', 't-2', 't-1', 't'], { size: 24, weight: 900, fill: C.green, gap: 42 })}`,
    rightVisual: `${barSet(975, 560, ['WM', 'WM-RNN', 'varianza'], [0.55, 0.35, 0.72], C.amber, 250)}`,
    footer: 'El resultado negativo también enseña: más arquitectura no sustituye a una pregunta experimental limpia.',
    caption: 'Infografía de cierre de 3.5: memoria útil frente a memoria sobrante en WM-RNN.',
  },
  {
    key: '3.6',
    file: 'codex2_ch3_6_algoritmos_matriz.svg',
    type: 'matrix',
    title: 'Cinco algoritmos, tres preguntas',
    subtitle: 'La comparación deja de ser una lista cuando separas qué aprende, de qué datos aprende y si imagina.',
    cols: ['Qué aprende', 'Datos', 'Modelo'],
    rows: ['DQN', 'PPO', 'SAC', 'WM', 'WM-RNN'],
    cells: [
      [{ text: 'Q valor', theme: 'tech' }, { text: 'replay', theme: 'system' }, { text: 'no', theme: 'limit' }],
      [{ text: 'política', theme: 'idea' }, { text: 'frescos', theme: 'warning' }, { text: 'no', theme: 'limit' }],
      [{ text: 'política + Q', theme: 'risk' }, { text: 'replay', theme: 'system' }, { text: 'no', theme: 'limit' }],
      [{ text: 'Q + dinámica', theme: 'tech' }, { text: 'replay + sueño', theme: 'warning' }, { text: 'sí', theme: 'evidence' }],
      [{ text: 'Q + memoria', theme: 'tech' }, { text: 'secuencias', theme: 'warning' }, { text: 'sí, RNN', theme: 'evidence' }],
    ],
    footer: 'Elegir algoritmo es elegir compromisos: fiabilidad, coste, reciclaje de datos, exploración e imaginación.',
    caption: 'Infografía de cierre de 3.6: matriz comparativa de los cinco algoritmos.',
  },
  {
    key: '4.1',
    file: 'codex2_ch4_1_veredicto_estadistico.svg',
    type: 'dashboard',
    title: 'Un veredicto sano no cabe en una media',
    subtitle: 'La cifra fuerte combina nivel, coste, varianza, split, semillas y colapsos.',
    panelText: 'PPO gana alto y fiable; DQN es cimiento estable; World Model muestra techo; SAC-hybrid avisa de bimodalidad.',
    callouts: [
      { title: 'Altura', body: 'éxito medio en test', theme: 'evidence' },
      { title: 'Banda', body: 'semillas y dispersión', theme: 'warning' },
      { title: 'Coste', body: '700k, 1.5M, 3M', theme: 'tech' },
      { title: 'Split', body: 'ID y OOD no son iguales', theme: 'risk' },
    ],
    footer: 'Una media alta empieza la conversación; varianza, coste y split deciden si puedes creerla.',
    caption: 'Infografía de cierre de 4.1: tablero de lectura estadística del veredicto.',
  },
  {
    key: '4.2',
    file: 'codex2_ch4_2_ablacion_causalidad.svg',
    type: 'compare',
    title: 'Ablación es causalidad práctica',
    subtitle: 'Quitar una pieza de una receta congelada revela qué sostenía realmente el puente.',
    leftTitle: 'Receta completa',
    leftBody: 'DQN base funciona con estado, escala, reloj, conv, currículo y epsilon.',
    rightTitle: 'Quitar una pieza',
    rightBody: 'El delta de éxito mide el daño atribuible a esa pieza, si lo demás no cambia.',
    leftTheme: 'evidence',
    rightTheme: 'warning',
    leftVisual: `${barSet(185, 560, ['base', 'test', 'semillas'], [0.77, 0.77, 1.0], C.green, 250)}`,
    rightVisual: `${barSet(975, 540, ['escala', 'reloj', 'conv', 'shaping'], [0.96, 0.38, 0.32, 0.18], C.amber, 250)}`,
    footer: 'Si cambias dos cosas a la vez, pierdes la causa. La ablación manda porque congela el resto.',
    caption: 'Infografía de cierre de 4.2: ablación como puente entre receta y causalidad.',
  },
  {
    key: '4.3',
    file: 'codex2_ch4_3_ruta_reproducible.svg',
    type: 'flow',
    title: 'Una cifra confiable deja rastro',
    subtitle: 'El resultado debe poder recorrerse hacia atrás: desde la figura hasta el generador.',
    leftTitle: 'Protocolo congelado',
    leftBody: 'Semillas, presupuestos, splits, greedy, métrica y hash fijados antes de mirar.',
    rightTitle: 'Ledger verificable',
    rightBody: 'Cada fila registra configuración, resultado y condiciones de evaluación.',
    steps: [
      { title: 'Generador', body: 'familias y niveles', theme: 'system' },
      { title: 'Splits', body: 'train valid test OOD', theme: 'risk' },
      { title: 'Entrenar', body: 'presupuesto y seed', theme: 'tech' },
      { title: 'Evaluar', body: 'greedy y éxito', theme: 'evidence' },
      { title: 'Ledger', body: 'figura rastreable', theme: 'idea' },
    ],
    footer: 'La reproducibilidad no es burocracia: es la diferencia entre contar una historia y sostener una prueba.',
    caption: 'Infografía de cierre de 4.3: ruta reproducible desde generador hasta ledger y figura.',
  },
  {
    key: '4.4',
    file: 'codex2_ch4_4_app_dashboard_anotado.svg',
    type: 'dashboard',
    title: 'La app enseña mecanismos; el protocolo declara resultados',
    subtitle: 'Jugar con los modelos ayuda a mirar, pero la evidencia final vive en el test congelado.',
    panelText: 'Lo visible es una ventana didáctica: detrás hay entornos headless, buffers, actualizaciones y métricas.',
    callouts: [
      { title: 'Tablero', body: 'conducta observada', theme: 'system' },
      { title: 'Selector', body: 'familia del algoritmo', theme: 'tech' },
      { title: 'Curvas', body: 'salud del entrenamiento', theme: 'warning' },
      { title: 'Veredicto', body: 'solo con test congelado', theme: 'evidence' },
    ],
    footer: 'La demo sirve para entender cómo aprende; el ledger sirve para declarar cuánto aprendió.',
    caption: 'Infografía de cierre de 4.4: dashboard anotado para separar demo y evidencia.',
  },
  {
    key: '5.1',
    file: 'codex2_ch5_1_atlas_final.svg',
    type: 'poster',
    title: 'Lo que sobrevive al proyecto',
    subtitle: 'Más allá de Arkanoid, quedan cuatro hábitos transferibles para cualquier proyecto de RL.',
    centerA: 'formulación',
    centerB: 'evidencia',
    cards: [
      { title: 'Estado manda', body: 'lo que no entra no se aprende', theme: 'system' },
      { title: 'Objetivo manda', body: 'recompensa no es éxito', theme: 'warning' },
      { title: 'Test se protege', body: 'validar no es declarar', theme: 'risk' },
      { title: 'Varianza importa', body: 'una semilla no es evidencia', theme: 'evidence' },
    ],
    footer: 'Buen RL es ingeniería experimental: definir bien la tarea, medir limpio y contar también los límites.',
    caption: 'Infografía de cierre de 5.1: atlas final de lecciones transferibles.',
  },
];

function renderPanel(panel) {
  switch (panel.type) {
    case 'flow':
      return flowPanel(panel);
    case 'compare':
      return comparePanel(panel);
    case 'formula':
      return formulaPanel(panel);
    case 'anatomy':
      return anatomyPanel(panel);
    case 'matrix':
      return matrixPanel(panel);
    case 'dashboard':
      return dashboardPanel(panel);
    case 'poster':
      return posterPanel(panel);
    default:
      throw new Error(`Unknown panel type: ${panel.type}`);
  }
}

function generateAssets() {
  fs.mkdirSync(assetsDir, { recursive: true });
  for (const panel of panels) {
    fs.writeFileSync(path.join(assetsDir, panel.file), renderPanel(panel), 'utf8');
  }
}

function sectionBoundaries(html) {
  const re = /<section class="section">\s*<div class="band[^>]*><div class="n">([^<]+)<\/div><h2>([^<]+)<\/h2>/g;
  const starts = [];
  let m;
  while ((m = re.exec(html))) {
    starts.push({ start: m.index, label: m[1], title: m[2] });
  }
  return starts.map((s, i) => ({ ...s, end: starts[i + 1]?.start ?? html.length }));
}

function marker(panel) {
  return `<!-- codex2-panel:${panel.key} -->`;
}

function figure(panel) {
  return `${marker(panel)}
<figure class="codex-fig codex2-panel"><img src="assets/${panel.file}" alt="${esc(panel.title)}"><figcaption>${esc(panel.caption)}</figcaption></figure>
`;
}

function insertPanels() {
  let html = fs.readFileSync(reportPath, 'utf8');
  const boundaries = sectionBoundaries(html);
  for (const panel of panels) {
    if (panel.insert === false) continue;
    if (html.includes(marker(panel))) continue;
    boundaries.splice(0, boundaries.length, ...sectionBoundaries(html));
    const sec = boundaries.find((s) => s.label.includes(panel.key));
    if (!sec) throw new Error(`Section ${panel.key} not found`);
    const chunk = html.slice(sec.start, sec.end);
    const lastTakeaway = chunk.lastIndexOf('<div class="takeaway"');
    const insertAt = lastTakeaway >= 0 ? sec.start + lastTakeaway : sec.end;
    html = html.slice(0, insertAt) + figure(panel) + html.slice(insertAt);
  }
  fs.writeFileSync(reportPath, html, 'utf8');
}

function main() {
  generateAssets();
  insertPanels();
  const inserted = panels.filter((panel) => panel.insert !== false).length;
  console.log(`Generated ${panels.length} Codex2 visual panels; ${inserted} are inserted in the current HTML.`);
}

main();
