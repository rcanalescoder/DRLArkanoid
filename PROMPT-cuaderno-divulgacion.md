# PROMPT REUTILIZABLE — "Cuaderno de divulgación + README visual + LICENSE"

> **Cómo usarlo:** abre Claude Code dentro de tu repo (en este caso, el de **Deep Reinforcement
> Learning**) y pega TODO el bloque de abajo (desde «=== INICIO DEL PROMPT ===» hasta el final).
> Está escrito para que el agente reproduzca, de forma **homogénea** con mis otros proyectos, los
> mismos complementos: el **fichero LICENSE**, el **cuaderno PDF** (idéntico estilo) y el **README
> visual**. Sustituye los marcadores `«...»` si quieres fijar algo; si no, el agente los infiere
> leyendo tu repo.

---

=== INICIO DEL PROMPT ===

Eres mi compañero de programación. Vas a crear, en ESTE repositorio (un proyecto educativo de
**Deep Reinforcement Learning**), tres complementos de divulgación con un estilo y una estructura
**idénticos** a los de mis otros proyectos, para que todos queden homogéneos:

1. Un fichero **`LICENSE`** (MIT, en castellano).
2. Un **cuaderno PDF** divulgativo (`docs/<NombreDelProyecto>.pdf`) generado desde un HTML propio.
3. Un **`README.md` visual** que incrusta capturas y enlaza el PDF para descargarlo.

## 0) REGLAS DURAS (no negociables)

- **Idioma:** todo el contenido divulgativo en **castellano**.
- **Cero invención:** todas las cifras, curvas, capturas y fragmentos de código deben salir del
  **código y las ejecuciones REALES de este repo**. Nada inventado ni maquillado. Si un dato no lo
  puedes medir/extraer, no lo pongas.
- **Público:** alguien que comparte en LinkedIn ante gente que probablemente no sabe de IA. Hay que
  ser **pedagógico**: explica cada tecnicismo en cuanto aparece, sin perder rigor. **Prohibido**
  describir una arquitectura con metáforas baratas tipo «es como un embudo»: describe la **estructura
  real** de la red/el algoritmo (capas, dimensiones, regla de actualización).
- **Licencia MIT en castellano EN TODOS LOS SITIOS** donde aparezca su texto completo (el fichero
  `LICENSE` y la sección de licencia del PDF). El README solo la referencia.
- **Autoría (constante):** Autor = `Roberto Canales Mora`, atribución = `Roberto Canales Mora · con
  Claude Chat / Code`. Copyright = `Copyright (c) «AÑO» Roberto Canales Mora`.
- **Verificación visual obligatoria:** tras generar el PDF, **rasteriza cada página nueva** con
  `pypdfium2` y compruébala (que no se corte nada, que las capturas muestren resultados buenos).
- **No subas a git** (`git push`) ni hagas commits salvo que yo lo pida; sí puedes hacer commits
  locales por hito si te lo digo.

## 0.1) VOZ Y REDACCIÓN (criterios de estilo — innegociables)

Estos criterios definen CÓMO se escribe cada explicación. Son el resultado de iterar el estilo hasta
que un ingeniero junior —o alguien curioso sin background de IA— pueda leerlo de corrido. Respétalos
en TODO el documento; pesan tanto como las reglas duras.

- **Idea primero, término después.** Explica SIEMPRE la idea en lenguaje llano (y, si ayuda, con una
  analogía) ANTES de nombrar el tecnicismo. El término técnico llega AL FINAL, como etiqueta de algo ya
  entendido: «… y a ese porcentaje de azar se le denomina épsilon (ε)». NUNCA abras un párrafo con el
  palabro para definirlo después.
- **Registro neutro.** Nada de «los técnicos dicen», «los expertos llaman», «en el argot…», ni
  coloquialismos ni guiños, ni condescendencia («como ves, es facilísimo»). Describe; no charles.
- **Cero meta-información.** El documento NO se narra a sí mismo ni explica cómo leerse. Prohibido:
  «en este capítulo verás», «fíjate que», «como adelantábamos», «las claves van resaltadas en azul»,
  «tres palabras que oirás», «la regla de este capítulo». Cuenta el contenido, no el continente.
- **Las fórmulas son OPCIONALES y van aparte.** El texto principal debe entenderse SIN leer una sola
  fórmula. Toda fórmula vive en una caja gris «🔬 Para curiosos» (clase `.curiosos`), claramente
  saltable. Nunca metas una ecuación en mitad de la explicación llana.
- **Estructura real, no metáforas baratas.** La analogía da intuición; pero la sección «cómo funciona»
  describe la estructura REAL (capas, dimensiones, regla de actualización). Prohibido «es como un embudo».
- **Definir nombrando.** Cuando un concepto ya está explicado en llano, fíjalo en una caja naranja
  `.palabra`: «<b>Épsilon (ε) y ε-greedy.</b> El porcentaje de movimientos al azar se denomina…».
- **Pedagógico ≠ simplista.** No omitas el porqué de las decisiones: qué alternativas había y por qué se
  eligió esta (idealmente en una tabla `table.compare`). Cada cifra es real y medida en el repo.
- **Honestidad por encima del marketing.** Si un método NO gana en esta tarea, dilo y explica por qué
  (p. ej. «en una tarea casi markoviana la memoria aporta poco»). Un matiz honesto vale más que un titular.

## 1) PASO 0 — Entiende el repo ANTES de escribir nada

Explora el repositorio y deja por escrito (para ti) el inventario real:
- Qué **algoritmos/temas** hay implementados (p. ej. Q-Learning tabular, DQN, REINFORCE/Policy
  Gradient, Actor-Critic/A2C/PPO, y un posible Comparador). Usa **los que existan de verdad**.
- Dónde está, para cada uno: **la red/política/valor** (arquitectura), **el bucle de entrenamiento**
  (la regla de actualización) y algún **extra interesante** (replay buffer, ε-greedy, cálculo de
  ventaja/GAE, objetivo recortado de PPO…). Anota archivo y líneas.
- El **entorno/dataset** (CartPole, LunarLander, Atari, gridworld…), su tamaño/escala, y los
  **hiperparámetros** clave.
- Cómo se **arranca** (backend/CLI/notebook), si hay **app/UI** o solo gráficas, cómo se generan los
  **resultados** (curvas de recompensa, tasa de éxito, vídeos/fotogramas del agente).
- Stack y plataforma (si es Mac/Apple Silicon, MPS con fallback CPU; PyTorch, etc.).

Construye TODO el material a partir de ese inventario real.

## 2) ENTREGABLE 1 — `LICENSE` (MIT en castellano)

Crea/actualiza el fichero `LICENSE` en la raíz con EXACTAMENTE este texto (ajusta el año):

```text
Licencia MIT

Copyright (c) «AÑO» Roberto Canales Mora

Por la presente se concede permiso, sin cargo, a cualquier persona que obtenga una copia
de este software y de los archivos de documentación asociados (el "Software"), para utilizar
el Software sin restricción, incluyendo sin limitación los derechos a usar, copiar, modificar,
fusionar, publicar, distribuir, sublicenciar y/o vender copias del Software, y a permitir a
las personas a las que se les proporcione el Software a hacer lo mismo, sujeto a las
siguientes condiciones:

El aviso de copyright anterior y este aviso de permiso se incluirán en todas las copias o
partes sustanciales del Software.

EL SOFTWARE SE PROPORCIONA "TAL CUAL", SIN GARANTÍA DE NINGÚN TIPO, EXPRESA O IMPLÍCITA,
INCLUYENDO PERO NO LIMITADO A GARANTÍAS DE COMERCIALIZACIÓN, IDONEIDAD PARA UN PROPÓSITO
PARTICULAR Y NO INFRACCIÓN. EN NINGÚN CASO LOS AUTORES O PROPIETARIOS DE LOS DERECHOS DE
AUTOR SERÁN RESPONSABLES DE NINGUNA RECLAMACIÓN, DAÑOS U OTRAS RESPONSABILIDADES, YA SEA
EN UNA ACCIÓN DE CONTRATO, AGRAVIO O DE OTRO MODO, QUE SURJA DE, FUERA DE O EN CONEXIÓN
CON EL SOFTWARE O EL USO U OTROS NEGOCIOS EN EL SOFTWARE.
```

## 3) ENTREGABLE 2 — El cuaderno PDF (idéntico estilo)

### 3.1 Toolchain (instálalo en un dir temporal de trabajo, p. ej. `/tmp/pdfgen`)

```bash
# Node + Playwright para HTML -> PDF y capturas
mkdir -p /tmp/pdfgen && cd /tmp/pdfgen && npm init -y && npm i playwright
npx playwright install chromium
# Python para rasterizar/verificar el PDF y montar las imágenes del README
python3 -m venv /tmp/pdfgen/.venv && source /tmp/pdfgen/.venv/bin/activate
pip install pypdfium2 pillow
# (macOS) 'sips' viene de serie para optimizar capturas a JPEG
```

El PDF se genera desde **`docs/report.html`** (un único HTML con todo el contenido). Render:

```js
// /tmp/pdfgen/render.js  ->  node render.js
const { chromium } = require('playwright')
const path = require('path')
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage()
  const html = 'file://' + path.resolve('docs/report.html')   // ejecútalo desde la raíz del repo
  await p.goto(html, { waitUntil: 'networkidle' })
  await p.pdf({
    path: 'docs/«NombreDelProyecto».pdf',
    printBackground: true,        // imprescindible: respeta fondos/colores
    preferCSSPageSize: true,      // respeta @page (A4 + portada a sangre)
  })
  console.log('PDF OK'); await b.close()
})()
```

Capturas de la app (si hay UI web en localhost). Si NO hay app, usa en su lugar las **figuras reales**
que genere el proyecto (curvas de recompensa en PNG, fotogramas del agente):

```js
// /tmp/pdfgen/shoot.js  ->  captura cada pestaña/pantalla a docs/assets/*.png
const { chromium } = require('playwright')
const OUT = 'docs/assets', BASE = 'http://localhost:«PUERTO»'
const sleep = ms => new Promise(r => setTimeout(r, ms))
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  for (const t of ['«tab1»','«tab2»','«tab3»','«comparador»']) {
    await p.goto(`${BASE}/#${t}`, { waitUntil: 'networkidle' })
    await sleep(8000)  // deja que entrene/genere lo que tenga que mostrar
    await p.screenshot({ path: `${OUT}/tab_${t}.png`, fullPage: true })
  }
  await b.close()
})()
```

Optimiza cada captura a JPEG (mantén el PDF en pocos MB):

```bash
cd docs/assets
for f in *.png; do sips -s format jpeg -s formatOptions 82 --resampleWidth 1400 "$f" --out "${f%.png}.jpg" >/dev/null; rm -f "$f"; done
```

### 3.2 El sistema de diseño — PEGA ESTE `<style>` TAL CUAL en `docs/report.html`

Esto es lo que garantiza el «mismo estilo». No lo cambies salvo para añadir clases nuevas.

```html
<style>
  :root{
    --ink:#11181f; --slate:#41464f; --muted:#8a909b; --line:#e7e9ef;
    --blue:#2563eb; --blue-soft:#eff4fe; --violet:#7c3aed; --violet-soft:#f4effe;
    --pink:#db2777; --pink-soft:#fdeef6; --green:#0c9f6e; --green-soft:#e9fbf4;
    --amber:#d97706; --amber-soft:#fef3e6; --cyan:#0891b2; --cyan-soft:#e7f7fb;
  }
  @page{ size:A4; margin:14mm 0; }
  @page cover{ margin:0; }
  *{ box-sizing:border-box; }
  html,body{ margin:0; padding:0; }
  body{ font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    color:var(--ink); font-size:10.5pt; line-height:1.55; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .pad{ padding:0 18mm; }
  .mono{ font-family:"SFMono-Regular",Menlo,Consolas,monospace; }
  h1,h2,h3,h4{ margin:0; letter-spacing:-0.3px; }
  p{ margin:0 0 8px; }
  small{ color:var(--muted); }

  /* portada */
  .cover{ page:cover; height:297mm; display:flex; flex-direction:column; justify-content:center;
    color:#fff; padding:0 22mm; position:relative; overflow:hidden;
    background:linear-gradient(135deg,#2563eb 0%,#7c3aed 45%,#db2777 100%); }
  .cover .kicker{ font-size:12pt; letter-spacing:3px; text-transform:uppercase; opacity:.85; font-weight:600; }
  .cover h1{ font-size:46pt; line-height:1.02; margin:14px 0 0; font-weight:700; }
  .cover .sub{ font-size:15pt; opacity:.92; margin-top:18px; max-width:150mm; font-weight:400; }
  .cover .chips{ margin-top:34px; display:flex; gap:10px; flex-wrap:wrap; }
  .cover .chip{ background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.28);
    padding:8px 16px; border-radius:999px; font-size:11pt; font-weight:600; }
  .cover .credits{ margin-top:30px; display:flex; flex-direction:column; gap:6px; }
  .cover .cr{ display:flex; align-items:baseline; gap:14px; font-size:11.5pt; }
  .cover .cr .lbl{ min-width:34mm; font-size:8.5pt; letter-spacing:2px; text-transform:uppercase; opacity:.72; font-weight:700; }
  .cover .cr .val{ font-weight:600; }
  .cover .foot{ position:absolute; bottom:20mm; left:22mm; right:22mm; font-size:10pt; opacity:.85;
    display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,.25); padding-top:12px; }

  /* secciones y bandas de cabecera */
  .section{ page-break-before:always; }
  .band{ color:#fff; padding:16px 18mm; margin-bottom:14px; }
  .band .n{ font-size:11pt; font-weight:700; opacity:.8; letter-spacing:2px; }
  .band h2{ font-size:25pt; margin-top:2px; }
  .band .tag{ font-size:10.5pt; opacity:.92; margin-top:4px; }
  .b-blue{ background:linear-gradient(120deg,#2563eb,#3b82f6); }
  .b-violet{ background:linear-gradient(120deg,#7c3aed,#a855f7); }
  .b-pink{ background:linear-gradient(120deg,#db2777,#ec4899); }
  .b-cyan{ background:linear-gradient(120deg,#0891b2,#06b6d4); }
  .b-ink{ background:linear-gradient(120deg,#1f2937,#374151); }
  .b-green{ background:linear-gradient(120deg,#0c9f6e,#10b981); }

  h3.sub{ font-size:13.5pt; margin:18px 0 6px; color:var(--ink); display:flex; align-items:center; gap:8px; }
  h3.sub::before{ content:""; width:5px; height:18px; border-radius:3px; background:var(--accent,#2563eb); display:inline-block; }

  .card{ border:1px solid var(--line); border-radius:12px; padding:14px 16px; margin:8px 0; background:#fff; }
  .tint{ border:none; border-left:4px solid var(--accent,#2563eb); border-radius:10px; padding:12px 16px; margin:10px 0; background:var(--accent-soft,#eff4fe); }
  .tint .t{ font-weight:700; color:var(--accent,#2563eb); margin-bottom:3px; font-size:11pt; }

  .defs{ display:grid; grid-template-columns:30mm 1fr; gap:6px 14px; margin:6px 0; }
  .defs dt{ font-weight:700; color:var(--accent,#2563eb); font-family:"SFMono-Regular",Menlo,monospace; font-size:9.5pt; }
  .defs dd{ margin:0; color:var(--slate); }

  table.params{ width:100%; border-collapse:collapse; margin:8px 0; font-size:9.8pt; }
  table.params th{ text-align:left; background:#f6f7f9; color:var(--muted); text-transform:uppercase; font-size:8pt; letter-spacing:.4px; padding:7px 10px; border-bottom:1px solid var(--line); }
  table.params td{ padding:7px 10px; border-bottom:1px solid #f1f2f5; color:var(--slate); vertical-align:top; }
  table.params td.k{ font-family:"SFMono-Regular",Menlo,monospace; color:var(--ink); font-weight:600; white-space:nowrap; }

  figure{ margin:12px 0; }
  figure img{ width:100%; border:1px solid var(--line); border-radius:12px; box-shadow:0 10px 26px -14px rgba(17,24,39,.45); display:block; }
  figcaption{ font-size:9pt; color:var(--muted); margin-top:6px; text-align:center; }
  .imgrow{ display:flex; gap:10px; } .imgrow figure{ flex:1; margin:12px 0; min-width:0; }

  /* problema -> mejora (el "antes/después" de la mejora con agentes) */
  .pm{ display:flex; gap:12px; margin:12px 0; }
  .pm .box{ flex:1; border-radius:12px; padding:13px 15px; }
  .pm .prob{ background:#fdeef0; border:1px solid #f6d2d8; }
  .pm .mejo{ background:#e9fbf4; border:1px solid #c7eede; }
  .pm .h{ font-weight:700; font-size:10.5pt; margin-bottom:5px; display:flex; align-items:center; gap:6px; }
  .pm .prob .h{ color:#c0344d; } .pm .mejo .h{ color:#0a6b4e; }

  /* barras comparativas */
  .bars{ margin:10px 0; }
  .bars .row{ display:grid; grid-template-columns:26mm 1fr 20mm; align-items:center; gap:10px; margin:7px 0; }
  .bars .name{ font-weight:600; font-size:10pt; }
  .bars .track{ background:#eef0f4; border-radius:6px; height:18px; overflow:hidden; }
  .bars .fill{ height:100%; border-radius:6px; }
  .bars .val{ font-family:"SFMono-Regular",Menlo,monospace; font-size:9.5pt; text-align:right; color:var(--ink); font-weight:600; }
  .legend{ font-size:8.5pt; color:var(--muted); margin-top:2px; }

  .note{ background:#fff8ec; border:1px solid #f6e2bd; border-radius:10px; padding:10px 14px; font-size:9.8pt; color:#7a5408; margin:10px 0; }
  .formula{ font-family:"SFMono-Regular",Menlo,monospace; background:#f4f5f8; border:1px solid #eaecf1; border-radius:8px; padding:8px 12px; font-size:10pt; color:var(--ink); margin:8px 0; }

  table.compare{ width:100%; border-collapse:collapse; font-size:9.3pt; margin:8px 0; }
  table.compare th{ background:#f6f7f9; padding:7px 8px; text-align:left; border-bottom:2px solid var(--line); font-size:8.5pt; }
  table.compare td{ padding:7px 8px; border-bottom:1px solid #f1f2f5; color:var(--slate); }
  table.compare td:first-child{ font-weight:600; color:var(--ink); }

  /* analogía amable */
  .analogy{ display:flex; gap:12px; align-items:flex-start; background:var(--accent-soft,#eff4fe); border:1px solid var(--line); border-radius:12px; padding:13px 16px; margin:10px 0; }
  .analogy .ic{ font-size:20pt; line-height:1; flex:none; }
  .analogy .t{ font-weight:700; color:var(--accent,#2563eb); font-size:10.5pt; margin-bottom:2px; }
  .analogy .bd{ color:var(--slate); }

  /* tarjetas "¿para qué sirve?" */
  .uses{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:10px 0; }
  .use{ border:1px solid var(--line); border-radius:11px; padding:11px 13px; background:#fff; }
  .use .h{ font-weight:700; font-size:10pt; color:var(--ink); margin-bottom:2px; display:flex; gap:7px; align-items:center; }
  .use .h .e{ font-size:13pt; }
  .use p{ margin:0; color:var(--slate); font-size:9.6pt; }

  /* mini-pipeline de la estructura (estado -> red -> acción/valor) */
  .pipe{ display:flex; align-items:stretch; gap:0; flex-wrap:wrap; margin:10px 0; }
  .pipe .stage{ flex:1 1 0; min-width:24mm; border:1px solid var(--line); border-radius:10px; padding:9px 10px; background:#fff; text-align:center; }
  .pipe .stage .nm{ font-weight:700; font-size:9.3pt; color:var(--accent,#2563eb); }
  .pipe .stage .dim{ font-family:"SFMono-Regular",Menlo,monospace; font-size:8.4pt; color:var(--slate); margin-top:3px; }
  .pipe .arrow{ align-self:center; color:var(--muted); font-size:12pt; padding:0 5px; flex:none; }

  .term{ font-weight:700; color:var(--accent,#2563eb); }
  .lead{ color:var(--slate); font-size:10.2pt; margin:-2px 0 8px; }
  .takeaway{ background:#f0fdf9; border:1px solid #c7eede; border-left:4px solid #0c9f6e; border-radius:10px; padding:11px 15px; margin:10px 0; }
  .takeaway .t{ font-weight:700; color:#0a6b4e; font-size:10.5pt; margin-bottom:3px; }
  .takeaway .bd{ color:#155e4a; }

  /* impresión: no partir bloques ni dejar encabezados huérfanos */
  h3.sub{ break-after:avoid; page-break-after:avoid; }
  figure,.pm,.bars,.uses,.analogy,.takeaway,.pipe,table.compare,table.params,.defs{ break-inside:avoid; page-break-inside:avoid; }
  .code,.tree{ break-inside:avoid; page-break-inside:avoid; }

  /* bloques de código tipo editor (cabecera con color de acento + cuerpo oscuro) */
  .code{ border-radius:11px; overflow:hidden; margin:9px 0; box-shadow:0 9px 24px -15px rgba(17,24,39,.55); }
  .code .fn{ font-family:"SFMono-Regular",Menlo,monospace; font-size:8.1pt; font-weight:600; color:#fff; background:var(--accent,#2563eb); padding:6px 13px; display:flex; justify-content:space-between; align-items:center; }
  .code .fn .role{ font-family:-apple-system,"Segoe UI",sans-serif; font-weight:700; text-transform:uppercase; letter-spacing:.6px; font-size:6.8pt; opacity:.92; }
  .code pre{ margin:0; padding:12px 15px; background:#0f172a; color:#dbe4f0; font-family:"SFMono-Regular",Menlo,Consolas,monospace; font-size:8.1pt; line-height:1.54; white-space:pre-wrap; }
  .code .cm{ color:#7e8da6; font-style:italic; }   /* comentarios */
  .codecap{ font-size:8.7pt; color:var(--muted); margin:-1px 0 12px; padding-left:2px; }

  /* árbol de ficheros (oscuro) */
  .tree{ background:#0f172a; color:#dbe4f0; border-radius:11px; padding:14px 18px; margin:11px 0; font-family:"SFMono-Regular",Menlo,monospace; font-size:8.6pt; line-height:1.62; white-space:pre-wrap; box-shadow:0 9px 24px -15px rgba(17,24,39,.55); }
  .tree .dir{ color:#7dd3fc; font-weight:600; }
  .tree .cm{ color:#7e8da6; }
  .tree .hot{ color:#fcd34d; font-weight:700; }

  /* === CLASES PEDAGÓGICAS (las que materializan los criterios de §0.1) === */
  /* caja gris "Para curiosos": AQUÍ van TODAS las fórmulas (saltable) */
  .curiosos{ background:#f5f6f8; border:1px dashed #c4cad6; border-radius:11px; padding:11px 15px; margin:11px 0; break-inside:avoid; page-break-inside:avoid; }
  .curiosos .t{ font-weight:700; color:#5b6472; font-size:9pt; text-transform:uppercase; letter-spacing:.6px; margin-bottom:5px; display:flex; align-items:center; gap:7px; }
  /* caja naranja "palabra": fija el término DESPUÉS de explicarlo en llano */
  .palabra{ background:#fff8ec; border:1px solid #f6e2bd; border-left:4px solid #d97706; border-radius:9px; padding:9px 14px; margin:9px 0; font-size:9.9pt; color:#7a5408; }
  .palabra .w{ font-weight:700; color:#b45309; }
  /* ejemplo paso a paso (azul) y checklist/aviso (ámbar) */
  .ejemplo{ background:#f0f7ff; border:1px solid #cfe0fb; border-radius:11px; padding:12px 16px; margin:11px 0; }
  .ejemplo .t{ font-weight:700; color:#1d4ed8; font-size:10.8pt; margin-bottom:6px; display:flex; align-items:center; gap:7px; }
  .check{ background:#fff7ed; border:1px solid #fcd9a8; border-left:4px solid #d97706; border-radius:10px; padding:11px 15px; margin:11px 0; }
  .check .t{ font-weight:700; color:#b45309; font-size:10.5pt; margin-bottom:5px; display:flex; align-items:center; gap:7px; }
  /* "porque": párrafo destacado con el motivo de algo */
  .porque{ font-size:11pt; color:var(--slate); background:var(--accent-soft,#eff4fe); border-radius:10px; padding:11px 15px; margin:0 0 12px; }
  .porque b{ color:var(--accent,#2563eb); }
  /* etiqueta de nivel (p. ej. "BÁSICO"/"AVANZADO") junto a un h3.sub */
  .nivel{ display:inline-block; font-size:7.6pt; font-weight:700; text-transform:uppercase; letter-spacing:.6px; padding:2px 9px; border-radius:999px; background:var(--accent-soft,#eff4fe); color:var(--accent,#2563eb); margin-left:9px; vertical-align:middle; }
  /* "interpretación" en 3 columnas: qué observamos / qué funcionó / qué mejoraríamos */
  .interp{ display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin:10px 0; }
  .interp .col{ border-radius:11px; padding:11px 13px; font-size:9.5pt; }
  .interp .obs{ background:#eef4ff; border:1px solid #cfe0fb; } .interp .ok{ background:#e9fbf4; border:1px solid #c7eede; } .interp .mejora{ background:#fef3e6; border:1px solid #f6dcb3; }
  .interp .h{ font-weight:700; font-size:9.5pt; margin-bottom:4px; display:flex; gap:6px; align-items:center; }
  .interp .obs .h{ color:#1d4ed8; } .interp .ok .h{ color:#0a7f57; } .interp .mejora .h{ color:#b45309; }
  .interp ul{ margin:0; padding-left:15px; } .interp li{ margin:2px 0; color:var(--slate); }
  /* glosario a dos columnas */
  .glosario{ column-count:2; column-gap:24px; margin:8px 0; }
  /* captura de app a pantalla completa partida en dos mitades (efecto continuo) */
  .appshot{ border:1px solid var(--line); border-radius:12px; overflow:hidden; box-shadow:0 12px 30px -16px rgba(17,24,39,.45); margin:12px 0 4px; }
  .appshot img{ display:block; width:100%; }
</style>
```

> **Escapado en el HTML:** dentro de `<pre>` y `.mono`, escapa `<` como `&lt;` y `&`  como `&amp;`.
> El `>` y las flechas `→`, símbolos matemáticos (√, γ, ∇, π, ε, ·) van bien tal cual en UTF-8.
> En los bloques de código, envuelve los comentarios en `<span class="cm"># ...</span>`.

### 3.3 Estructura del documento (orden de secciones)

1. **Portada** (`.cover`): kicker, título a 3 líneas, subtítulo, `.chips` con los temas, `.credits`
   (Autor / Licencia MIT / Repositorio) y `.foot`.
2. **On-ramp «empezamos de cero»** (`.band b-cyan`): una rampa suavísima antes de la teoría —las pocas
   ideas mínimas para no perderse— para alguien que no sabe nada de IA. Sin meta-información (§0.1).
3. **Introducción** (`.band b-ink`): de qué va y los protagonistas en una frase (`.defs`). Si hay app,
   una captura a pantalla completa (puede partirse en dos mitades con `.appshot` para que quepa).
4. **Fundamentos** (`.band b-violet`): el vocabulario esencial en llano —bucle agente↔entorno,
   recompensa/retorno/descuento, exploración, valor, la idea de Bellman, qué es una red y cómo aprende
   (pérdida/gradiente), red objetivo y **buffer de experiencia**—. Cada fórmula en `.curiosos`.
5. **Anatomía / «cómo funciona por dentro»** (`.band b-cyan`): del juego a la red, paso a paso (arranque,
   episodio, cómo «ve» el agente, los dos mundos rápido/visual, cómo se guardan los datos, el bucle de
   entrenamiento, el paso de gradiente, cómo se actualizan las gráficas y **qué cuenta cada curva**).
6. **Una sección por algoritmo** (alterna colores de banda: `b-blue`, `b-violet`, `b-pink`, `b-cyan`,
   `b-green`), cada una con la **estructura pedagógica de §3.4**.
7. **Comparador** (`.band b-ink`): tabla(s) `table.compare` enfrentando TODOS los algoritmos + `.takeaway`.
8. **Medición** (`.band b-ink`): si hay herramienta de evaluación/benchmark, por qué la métrica ingenua
   no basta y cómo se compara con justicia (evaluación **greedy**, mismo presupuesto) + captura del panel.
9. **«Descárgalo y pruébalo»** (`.band b-green`): instalación en bloques `.code`. URL del repo en `.tint`.
10. **«Cómo está organizado el código»** (`.band b-ink`): `.tree` del repo (resaltando en `.hot` las
    **redes** y el **entrenamiento**) + `.defs` de "dónde vive cada cosa".
11. **«El código clave, algoritmo a algoritmo»** (`.band b-blue`): 2–3 bloques `.code` con código REAL
    por algoritmo (*la red*, *el entrenamiento*, un *extra*), cada uno con su `.codecap`.
12. **Glosario** (`.band b-ink`, `.glosario` a dos columnas) y **«para seguir aprendiendo»** (referencias).
13. **«Licencia y autoría»** (`.band b-ink`): `.defs` + bloque `.code` con el **texto MIT completo EN
    CASTELLANO** (idéntico al fichero `LICENSE`).

> **Páginas numeradas.** En `render.js` activa `displayHeaderFooter:true` con un `footerTemplate` que
> pinte el número de página centrado en gris tenue (queda invisible sobre la portada a sangre oscura y
> visible en las páginas de contenido). Mantén `preferCSSPageSize:true`.

### 3.4 Plantilla de cada tema/algoritmo (estructura pedagógica) — rellénala con datos reales

Cada algoritmo es un capítulo con estas secciones (`h3.sub`), EN ESTE ORDEN. No todas aplican a todos
(p. ej. «comparación con el anterior» solo si el algoritmo es evolución/variante de otro; «búsqueda en
rejilla» solo si la has corrido de verdad). Aplica SIEMPRE los criterios de §0.1: idea llana primero,
término al final, fórmulas SOLO en `.curiosos`, registro neutro, sin meta.

1. **¿Qué es «X»?** — idea en lenguaje llano + `.analogy`. Fija el término con una caja `.palabra`
   *después* de explicarlo. (Si el concepto base es nuevo —p. ej. «¿qué es una política?» antes de
   PPO— dale su propio `h3.sub` y su `.palabra` ANTES de este.)
2. **¿Para qué sirve? (en el mundo real)** — rejilla `.uses` con 4 usos reales.
3. **Cómo funciona (su estructura)** — describe la estructura REAL (capas, dims) + `.pipe`
   (Estado → red → salida). La regla matemática va en `.curiosos` (NO en el cuerpo). Cierra con un
   `.tint` «la idea clave». Cuando ayude, un `.ejemplo` paso a paso (numerado) de una iteración.
4. **«Mecanismos propios»** — los trucos específicos del algoritmo, cada uno explicado en llano
   (DQN: Double DQN, Huber, red objetivo; SAC: doble crítico, α automática; World Model: planning…).
   Usa `.interp`/`.pm`/`.palabra` según convenga.
5. **La función de pérdida: ¿qué error minimizamos?** — explícala en llano y justifica la elección:
   qué OPCIONES había y por qué esta, en una `table.compare` (la fórmula, si acaso, en `.curiosos`).
6. **El experimento: objetivo, entorno y parámetros** — `table.params` con CADA hiperparámetro real y
   su efecto en lenguaje comprensible.
7. **¿Por qué estos parámetros? (búsqueda en rejilla)** — SOLO si has corrido un grid search real:
   `table.compare` con resultados medidos + conclusión honesta (incluida la varianza). Si no, omítela.
8. **La interfaz** — `figure` con captura REAL del algoritmo entrenando (+ inspector si lo hay).
9. **Resultados** — cifras y curvas REALES + `.pm` (⚠ el problema / ✔ la mejora encontrada).
10. **Interpretación: qué pasó al entrenar** — caja `.interp` de 3 columnas: 📊 qué observamos /
    ✓ qué funcionó / ↗ qué mejoraríamos. Honestidad (§0.1): si no destacó, dilo y explica por qué.
11. **Comparación con el modelo del que parte** — SOLO si es variante/evolución de otro algoritmo:
    `table.compare` enfrentando ambos eje por eje.
12. **Conclusiones** — `.takeaway` «en una frase», cerrando con los términos ya explicados.

```html
<section class="section">
  <div class="band b-blue"><div class="n">ALGORITMO 0X · «FAMILIA»</div><h2>«Nombre»</h2>
    <div class="tag">«Una frase de qué resuelve, en llano»</div></div>
  <div class="pad" style="--accent:#2563eb;--accent-soft:#eff4fe">

    <h3 class="sub">¿Qué es «X»?</h3>
    <p>«Idea en lenguaje llano. El tecnicismo llega al final.»</p>
    <div class="palabra"><span class="w">«Término».</span> «Eso que acabamos de describir se denomina…».</div>
    <div class="analogy"><div class="ic">🎯</div><div class="bd"><div class="t">Una analogía</div>«…».</div></div>

    <h3 class="sub">¿Para qué sirve? (en el mundo real)</h3>
    <div class="uses"><div class="use"><div class="h"><span class="e">🎮</span>«Uso»</div><p>«…»</p></div><!-- ×4 --></div>

    <h3 class="sub">Cómo funciona (su estructura)</h3>
    <p>«Estructura REAL: capas, dimensiones, qué entra y qué sale.»</p>
    <div class="pipe"><div class="stage"><div class="nm">Estado</div><div class="dim">«dim»</div></div>
      <div class="arrow">→</div><div class="stage"><div class="nm">Red</div><div class="dim">«capas»</div></div>
      <div class="arrow">→</div><div class="stage"><div class="nm">«Salida»</div><div class="dim">«dim»</div></div></div>
    <div class="curiosos"><div class="t">🔬 Para curiosos: «la fórmula»</div><div class="bd">
      <div class="formula">«Regla real: Q(s,a) ← r + γ·max Q(s',·)»</div>«Una línea de qué dice.»</div></div>
    <div class="tint"><div class="t">La idea clave</div>«El truco central, en llano.»</div>

    <h3 class="sub">La función de pérdida: ¿qué error minimizamos?</h3>
    <p>«Qué se minimiza, en llano, y por qué esta opción y no otra.»</p>
    <table class="compare"><tr><th>Opción</th><th>Qué hace</th><th>Por qué la elegimos o no</th></tr>
      <tr><td>«A»</td><td>«…»</td><td>«…»</td></tr><tr><td>«B» ✓</td><td>«…»</td><td>«Elegida porque…»</td></tr></table>

    <h3 class="sub">El experimento: objetivo, entorno y parámetros</h3>
    <table class="params"><tr><th>Ajuste</th><th>Valor</th><th>Qué es y qué efecto tiene</th></tr>
      <tr><td class="k">«hp»</td><td>«valor»</td><td>«efecto en llano»</td></tr></table>

    <h3 class="sub">La interfaz</h3>
    <figure><img src="assets/app_«tema».jpg" /><figcaption>«Qué se ve.»</figcaption></figure>

    <h3 class="sub">Resultados</h3>
    <p>«Cifras REALES medidas.»</p>
    <figure><img src="assets/curvas_«tema».jpg" /><figcaption>«Curva real.»</figcaption></figure>
    <div class="pm"><div class="box prob"><div class="h">⚠ El problema</div>«…»</div>
      <div class="box mejo"><div class="h">✔ La mejora encontrada</div>«…»</div></div>

    <h3 class="sub">Interpretación: qué pasó al entrenar</h3>
    <div class="interp">
      <div class="col obs"><div class="h">📊 Qué observamos</div><ul><li>«…»</li></ul></div>
      <div class="col ok"><div class="h">✓ Qué funcionó</div><ul><li>«…»</li></ul></div>
      <div class="col mejora"><div class="h">↗ Qué mejoraríamos</div><ul><li>«…»</li></ul></div></div>

    <h3 class="sub">Conclusiones</h3>
    <div class="takeaway"><div class="t">En una frase</div><div class="bd">«Resumen con términos ya explicados.»</div></div>
  </div>
</section>
```

> Si el repo tiene una **pestaña/herramienta de medición** (benchmark, comparador en vivo), dale su
> propia sección: por qué la métrica ingenua no basta, cómo se mide con justicia (p. ej. evaluación
> **greedy** sobre partidas nuevas y mismo presupuesto), qué se mide y captura del panel.

### 3.5 Bloque de "código clave" (rellénalo con código REAL del repo)

```html
<div class="code" style="--accent:#2563eb"><div class="fn">«ruta/al/fichero.py»<span class="role">la red</span></div><pre>«PEGA AQUÍ el fragmento REAL de la red (recortado y legible); comentarios con »<span class="cm"># así</span></pre></div>
<div class="codecap">«Qué destacar de este fragmento.»</div>
```

### 3.6 Verificación del PDF (obligatoria)

```python
# rasteriza y revisa cada página nueva
import pypdfium2 as pdfium
pdf = pdfium.PdfDocument("docs/«NombreDelProyecto».pdf")
for i in range(len(pdf)):
    pdf[i].render(scale=2.0).to_pil().save(f"/tmp/pdfpages/p{i:02d}.png")
```
Abre las imágenes y comprueba: portada con créditos correctos; cada tema con sus 7 partes; bloques de
código sin recortes; capturas con resultados buenos; licencia en castellano. Re-renderiza hasta que
quede impecable. Mantén el PDF en pocos MB (optimiza capturas).

## 4) ENTREGABLE 3 — `README.md` visual

Genera primero las imágenes del "hero" del PDF (desde el propio PDF, así siempre reflejan el real):

```python
# /tmp/pdfgen, venv activado. Portada + tira de páginas de muestra.
import pypdfium2 as pdfium
from PIL import Image, ImageFilter, ImageDraw
pdf = pdfium.PdfDocument("docs/«NombreDelProyecto».pdf")
def page(i, s=2.0): return pdf[i].render(scale=s).to_pil().convert("RGB")
# portada
cov = page(0, 2.3); w = 900
cov.resize((w, int(w*cov.height/cov.width))).save("docs/assets/pdf_cover.jpg", quality=90)
# tira de 4 páginas representativas (elige índices con variedad: interfaz, resultados, comparador, código)
pages = [«i1»,«i2»,«i3»,«i4»]
imgs = [page(i,1.7) for i in pages]; pw=300; ph=int(pw*imgs[0].height/imgs[0].width)
imgs=[im.resize((pw,ph),Image.LANCZOS) for im in imgs]; gap=26; pad=36
W=pad*2+pw*len(imgs)+gap*(len(imgs)-1); H=pad*2+ph
base=Image.new("RGBA",(W,H),(245,246,249,255)); sh=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(sh)
x=pad
for im in imgs: d.rectangle([x+3,pad+9,x+pw+3,pad+ph+9],fill=(17,24,39,80)); x+=pw+gap
base=Image.alpha_composite(base, sh.filter(ImageFilter.GaussianBlur(13))); dr=ImageDraw.Draw(base); x=pad
for im in imgs: dr.rectangle([x-1,pad-1,x+pw,pad+ph],outline=(231,233,239,255)); base.paste(im,(x,pad)); x+=pw+gap
base.convert("RGB").save("docs/assets/pdf_preview.jpg", quality=90)
```

Estructura del README (en castellano), reproduciendo el mismo orden y bloques HTML:

1. **Título + intro** (1–2 párrafos) + **tabla** de temas (`| Tema | Algoritmo | Qué hace |`).
2. **Sección "📄 Cuaderno PDF — descárgalo"** (justo tras la tabla), con HTML centrado:

```html
<p align="center">
  <a href="docs/«NombreDelProyecto».pdf"><img src="docs/assets/pdf_cover.jpg" width="340" alt="Portada del cuaderno PDF" /></a>
</p>
<p align="center">
  <a href="docs/«NombreDelProyecto».pdf"><b>⬇️&nbsp;&nbsp;Descargar el PDF</b></a>
  &nbsp;&nbsp;·&nbsp;&nbsp;«N» páginas&nbsp;&nbsp;·&nbsp;&nbsp;~«X» MB&nbsp;&nbsp;·&nbsp;&nbsp;español
</p>
<p align="center">
  <a href="docs/«NombreDelProyecto».pdf"><img src="docs/assets/pdf_preview.jpg" width="820" alt="Páginas de muestra" /></a>
</p>

> 💡 En GitHub puedes leerlo online (clic en la portada) o descargarlo desde el visor.
```

3. **Características** · **Requisitos** · **Instalación** (con bloques ```bash```).
4. **"Cómo funciona cada tema"**: bajo cada algoritmo, su **captura** con pie:

```html
<p align="center"><img src="docs/assets/tab_«tema».jpg" width="780" alt="«Tema»" /><br/><sub>«Pie breve de qué se ve.»</sub></p>
```

5. **Arquitectura** · **Estructura del proyecto** (árbol) · **API/CLI** · **Scripts** · **Notas**.
6. **Licencia**: una línea — `Código del laboratorio: **MIT** (ver [LICENSE](LICENSE)). © «AÑO» Roberto Canales Mora — con Claude Chat / Code.`

Verifica el README renderizándolo a HTML (con `python -m markdown` + un CSS tipo GitHub y un
`<base href="file://«ruta-repo»/">`) y capturándolo con Playwright, para confirmar que las imágenes
cargan y se ve bonito.

## 5) ADAPTACIÓN A DEEP REINFORCEMENT LEARNING (el mapeo)

Aplica la MISMA plantilla, cambiando «modelos generativos» por «algoritmos de RL». Sugerencia de
escalera (usa la que de verdad esté en el repo):

- **Q-Learning tabular** (el cimiento) → tabla de valores, ecuación de Bellman, gridworld/FrozenLake.
- **DQN** (red neuronal para Q) → replay buffer + target network; CartPole/LunarLander/Atari.
- **REINFORCE / Policy Gradient** (optimiza la política directamente).
- **Actor-Critic / A2C / PPO** (lo último / caballo de batalla) → política + valor, ventaja, clip.
- **Comparador** de algoritmos (tabla + curvas con la misma semilla).

Equivalencias de contenido:
- **«Resultados»** = **curva de recompensa por episodio** (PNG real del proyecto), tasa de éxito,
  score final y **eficiencia de muestra** (no son imágenes generadas: son métricas/curvas). Opcional:
  tira de fotogramas de un episodio bueno.
- **«Estructura de la red»** (`.pipe`) = Estado → red (política/valor, MLP/CNN con sus dims) → acción/Q/valor.
- **«Parámetros»** (`table.params`, explicados en llano): `learning_rate`, `gamma (γ)`, `epsilon (ε)` y
  su decaimiento, tamaño del `replay buffer`, `batch_size`, `target_update`, `n_steps`, `GAE lambda`,
  `clip_epsilon` (PPO), `entropy_coef`, `value_coef`, nº de episodios/pasos.
- **«Código clave»** por algoritmo: *la red* (policy/value net), *el entrenamiento* (la actualización:
  Bellman/replay/PPO step) y un *extra* (replay buffer, ε-greedy, cálculo de ventaja/GAE, objetivo
  recortado de PPO).
- **Analogías** RL: aprender por premios/castigos, ensayo y error, aprender a montar en bici cayéndote.
- **Usos reales**: videojuegos (Atari/AlphaGo), robótica y control, conducción autónoma, gestión de
  energía/recursos, recomendación, trading, y **RLHF** para alinear LLMs.
- **«Mejora con agentes»**: variantes que estabilizan/aceleran (target network, doble DQN, dueling,
  prioritized replay, normalización de ventajas, reward shaping, ajuste de γ/ε…), con el «antes/después»
  real medido.

## 6) CHECKLIST FINAL antes de darlo por bueno
- [ ] **Voz (§0.1) en TODO**: idea llana antes que el término; registro neutro; **cero meta-información**;
      **toda fórmula dentro de `.curiosos`** (el cuerpo se entiende sin ellas); honestidad (si algo no gana, se dice).
- [ ] `LICENSE` MIT en castellano, copyright a nombre de Roberto Canales Mora.
- [ ] PDF generado, **verificado página a página** (rasterizado), en pocos MB, español, **páginas numeradas**.
- [ ] Portada con Autor / Licencia MIT / Repositorio.
- [ ] Cada algoritmo con su **estructura de §3.4**: ¿qué es? + analogía, para qué sirve, estructura real,
      **función de pérdida (opciones + por qué)**, parámetros explicados, interfaz, resultados,
      **interpretación (qué observamos/funcionó/mejoraríamos)** y, si es variante, **comparación con el anterior**.
- [ ] Términos fijados con `.palabra` *después* de explicarlos; conceptos con su caja, no sueltos.
- [ ] Sección de **medición** (si hay benchmark): por qué la curva de entrenamiento no basta + evaluación greedy.
- [ ] Sección de instalación + estructura del código (árbol) + **código clave real** por algoritmo.
- [ ] Sección de licencia con el **texto MIT completo en castellano** (idéntico al fichero `LICENSE`).
- [ ] README visual: hero del PDF (portada clicable + botón de descarga + tira de páginas) y **captura
      bajo cada tema**; pie de licencia a MIT.
- [ ] **Nada inventado**: todo sale del código/ejecuciones reales del repo.

=== FIN DEL PROMPT ===
