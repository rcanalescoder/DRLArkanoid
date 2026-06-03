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
</style>
```

> **Escapado en el HTML:** dentro de `<pre>` y `.mono`, escapa `<` como `&lt;` y `&`  como `&amp;`.
> El `>` y las flechas `→`, símbolos matemáticos (√, γ, ∇, π, ε, ·) van bien tal cual en UTF-8.
> En los bloques de código, envuelve los comentarios en `<span class="cm"># ...</span>`.

### 3.3 Estructura del documento (orden de secciones)

1. **Portada** (`.cover`): kicker, título a 3 líneas, subtítulo, `.chips` con los temas, `.credits`
   (Autor / Licencia MIT / Repositorio) y `.foot`.
2. **Introducción** (`.band b-ink`): de qué va, los protagonistas en una frase (`.defs`), y el hilo
   conductor (la **mejora con agentes de IA**: proponer → entrenar → medir → quedarse con lo que
   mejora). Nota recordando que **todas las cifras son reales**.
3. **Una sección por tema/algoritmo** (alterna colores de banda: `b-blue`, `b-violet`, `b-pink`,
   `b-cyan`), cada una con la **estructura pedagógica de 7 partes** de §3.4.
4. **Comparador** (`.band b-ink`): tabla `table.compare` + conclusiones (`.takeaway`).
5. **«Descárgalo y pruébalo»** (`.band b-green`): instrucciones de instalación en bloques `.code`
   (clonar, backend, frontend/CLI, generar modelos/demos). Pon la URL del repo en un `.tint`.
6. **«Cómo está organizado el código»** (`.band b-ink`): un `.tree` del monorepo (resaltando en
   `.hot` dónde están **las redes** y **el entrenamiento**) + `.defs` de "dónde vive cada cosa".
7. **«El código clave, tema a tema»** (`.band b-blue`): por cada algoritmo, 2–3 bloques `.code`
   con **código REAL** del repo (ruta en `.fn`, etiqueta en `.role`): *la red*, *el entrenamiento*
   y un *extra*. Cada bloque con su `.codecap`.
8. **«Licencia y autoría»** (`.band b-ink`): `.defs` (Autor/Licencia/Repo/Entorno) + un bloque
   `.code` con el **texto MIT completo EN CASTELLANO** (el mismo del fichero `LICENSE`).

### 3.4 Plantilla de cada tema/algoritmo (las 7 partes) — rellénala con datos reales

```html
<section class="section">
  <div class="band b-blue"><div class="n">TEMA 0X · «SUBTÍTULO»</div><h2>«Nombre del algoritmo»</h2>
    <div class="tag">«Una frase de qué resuelve»</div></div>
  <div class="pad" style="--accent:#2563eb;--accent-soft:#eff4fe">

    <!-- 1) ¿QUÉ ES? + analogía -->
    <h3 class="sub">¿Qué es «el algoritmo»?</h3>
    <p>«Explicación en lenguaje llano; define cada término al usarlo con <span class="term">así</span>.»</p>
    <div class="analogy"><div class="ic">🎯</div><div class="bd"><div class="t">Una analogía</div>
      «Analogía cotidiana (p. ej. aprender por premios/castigos, ensayo y error).»</div></div>

    <!-- 2) ¿PARA QUÉ SIRVE? (mundo real) -->
    <h3 class="sub">¿Para qué sirve? (en el mundo real)</h3>
    <div class="uses">
      <div class="use"><div class="h"><span class="e">🎮</span>«Uso 1»</div><p>«…»</p></div>
      <div class="use"><div class="h"><span class="e">🤖</span>«Uso 2»</div><p>«…»</p></div>
      <div class="use"><div class="h"><span class="e">🚗</span>«Uso 3»</div><p>«…»</p></div>
      <div class="use"><div class="h"><span class="e">📈</span>«Uso 4»</div><p>«…»</p></div>
    </div>

    <!-- 3) CÓMO ES (estructura REAL, nada de "embudo") -->
    <h3 class="sub">Cómo funciona (su estructura)</h3>
    <p>«Describe la red real (capas y dimensiones) y la regla de actualización real.»</p>
    <div class="pipe">
      <div class="stage"><div class="nm">Estado</div><div class="dim">«dim»</div></div>
      <div class="arrow">→</div>
      <div class="stage"><div class="nm">Red «política/valor»</div><div class="dim">«capas»</div></div>
      <div class="arrow">→</div>
      <div class="stage"><div class="nm">«Acción / Q / valor»</div><div class="dim">«dim»</div></div>
    </div>
    <div class="formula">«Regla real: p.ej. Q(s,a) ← Q(s,a) + α·[r + γ·max Q(s',·) − Q(s,a)]»</div>
    <div class="tint"><div class="t">«La idea clave»</div>«El truco central (Bellman, gradiente de política, clip de PPO…).»</div>

    <!-- 4) EL EXPERIMENTO: objetivo + entorno + parámetros EXPLICADOS -->
    <h3 class="sub">El experimento: objetivo, entorno y parámetros</h3>
    <p><b>El entorno.</b> «Nombre del entorno, qué observa el agente, qué acciones tiene, qué recompensa.»
       <b>El objetivo:</b> maximizar la recompensa acumulada a lo largo de «N» episodios/pasos.</p>
    <table class="params">
      <tr><th>Ajuste</th><th>Qué es y qué efecto tiene</th></tr>
      <tr><td class="k">learning_rate</td><td>«El tamaño de cada paso de aprendizaje…»</td></tr>
      <tr><td class="k">gamma (γ)</td><td>«Cuánto importan las recompensas futuras vs. las inmediatas (0=cortoplacista, →1=previsor).»</td></tr>
      <tr><td class="k">epsilon (ε)</td><td>«Probabilidad de explorar al azar en vez de explotar lo aprendido; suele decaer con el tiempo.»</td></tr>
      <tr><td class="k">«replay/batch/…»</td><td>«…explicado en términos comprensibles.»</td></tr>
    </table>

    <!-- 5) LA INTERFAZ (captura real) -->
    <h3 class="sub">La interfaz</h3>
    <figure><img src="assets/tab_«tema».jpg" /><figcaption>«Qué se ve: render del entorno, curva de recompensa, política…».</figcaption></figure>

    <!-- 6) RESULTADOS + mejora con agentes -->
    <h3 class="sub">Resultados y la mejora con agentes</h3>
    <p>«Qué consigue: recompensa final/tasa de éxito REAL. Pon la curva de recompensa.»</p>
    <figure><img src="assets/«curva_recompensa».jpg" /><figcaption>«Curva real de recompensa por episodio (medida por el propio proyecto).»</figcaption></figure>
    <div class="pm">
      <div class="box prob"><div class="h">⚠ El problema</div>«El defecto de la 1ª versión (inestable, no converge, lento…).»</div>
      <div class="box mejo"><div class="h">✔ La mejora encontrada</div>«La variante que sí funcionó y POR QUÉ (target network, normalizar ventajas, reward shaping, doble DQN…).»</div>
    </div>

    <!-- 7) CONCLUSIONES (con los tecnicismos explicados) -->
    <h3 class="sub">Conclusiones</h3>
    <div class="takeaway"><div class="t">En una frase</div><div class="bd">«Resumen claro; usa los términos técnicos PERO explicándolos (γ, ε-greedy, on/off-policy, ventaja, sample efficiency…).»</div></div>
  </div>
</section>
```

> Si el agente **juega** un episodio, añade una tira de fotogramas (varias `figure` en `.imgrow`, o
> una sola imagen-montaje) mostrando el agente actuando: es el equivalente vistoso a una animación.

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
- [ ] `LICENSE` MIT en castellano, copyright a nombre de Roberto Canales Mora.
- [ ] PDF generado, **verificado página a página** (rasterizado), en pocos MB, español.
- [ ] Portada con Autor / Licencia MIT / Repositorio.
- [ ] Cada tema con sus **7 partes**; estructura real (sin metáforas baratas); **parámetros explicados**.
- [ ] Sección de instalación + estructura del código (árbol) + **código clave real** por algoritmo.
- [ ] Sección de licencia con el **texto MIT completo en castellano** (idéntico al fichero `LICENSE`).
- [ ] README visual: hero del PDF (portada clicable + botón de descarga + tira de páginas) y **captura
      bajo cada tema**; pie de licencia a MIT.
- [ ] **Nada inventado**: todo sale del código/ejecuciones reales del repo.

=== FIN DEL PROMPT ===
