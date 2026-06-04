# PROMPT REUTILIZABLE — "Cuaderno de divulgación + README visual + LICENSE"

> **Cómo usarlo:** abre Claude Code dentro de tu repo (en este caso, el de **Deep Reinforcement
> Learning**) y pega TODO el bloque de abajo (desde «=== INICIO DEL PROMPT ===» hasta el final).
> Está escrito para que el agente reproduzca, de forma **homogénea** con mis otros proyectos, los
> mismos complementos: el **fichero LICENSE**, el **cuaderno PDF** (idéntico estilo) y el **README
> visual**. Sustituye los marcadores `«...»` si quieres fijar algo; si no, el agente los infiere
> leyendo tu repo.
>
> **Estado de este fichero (especializado para ESTE proyecto — Arkanoid DRL con visión):** la
> maquinaria (§1–§4: toolchain, sistema de diseño, plantilla y criterios pedagógicos) es REUTILIZABLE
> e idéntica al resto de mis proyectos; el **§5 fija el CONTENIDO real** de este (historia, algoritmos,
> datos medidos). Las cifras definitivas se toman de **`pasosrealizados.txt`** (la bitácora) al generar.
> ⚠ El proyecto **sigue en evolución (SAC y World Model RNN aún en iteración): NO generar el PDF hasta
> que se cierre y los datos sean definitivos.**

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
- **Público (doble):** (a) alguien que comparte en LinkedIn ante gente que probablemente no sabe de IA;
  y (b) **un ingeniero junior o un estudiante avanzado** que quiere ENTENDER de verdad cómo funciona
  cada algoritmo y por qué se tomó cada decisión. La prueba de fuego: ese ingeniero/estudiante debe
  poder leer el cuaderno **de corrido**, sin material externo, y quedarse capaz de explicar (y casi
  reimplementar) cada pieza. Hay que ser **pedagógico sin perder rigor**: explica cada tecnicismo en
  cuanto aparece. **Prohibido** describir una arquitectura con metáforas baratas tipo «es como un
  embudo»: describe la **estructura real** de la red/el algoritmo (capas, dimensiones, regla de
  actualización).
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

## 5) ESTE PROYECTO EN CONCRETO — la historia, los algoritmos y los DATOS reales

> Esto fija el CONTENIDO; la plantilla y el estilo (§1–§4) NO cambian. Es un laboratorio de **Deep
> Reinforcement Learning** donde varios algoritmos aprenden a jugar al **Arkanoid mirando el tablero**,
> en el navegador (TF.js/WebGPU) y en GPU (PyTorch-MPS). El cuaderno debe contar UNA HISTORIA con un
> protagonista: **un agente que pasa de CIEGO a VER, y de sobrevivir a APUNTAR y GENERALIZAR.**
> Todos los datos de abajo están MEDIDOS en el repo: cronología narrativa en **`pasosrealizados.txt`**
> (la bitácora) y registro técnico en **`docs/PLAN-REIMPLEMENTACION.md`**. **Al generar el PDF, usa las
> cifras DEFINITIVAS de la bitácora** (el proyecto sigue evolucionando; no congeles números desde aquí).

### 5.1 El hilo narrativo (la espina del cuaderno)
El documento sigue este arco; cada hito es material para una sección o un «antes/después» (`.pm`):
1. **El agente ciego.** Ve 6 variables (posición y velocidad de la bola, posición de la pala); NO ve
   los ladrillos. Aprende a DEVOLVER la bola, no a APUNTAR. En la rejilla llena «gana» el 56%… pero
   **sobreviviendo** (la bola rebota por todo). Éxito **degenerado**, no inteligencia.
2. **Dos muros físicos (no del algoritmo).** El **reloj**: timeout 600 hacía el nivel INGANABLE
   (limpiar 28 ladrillos exige ~1.760 pasos) → se ata a 90·nº-ladrillos. La **exploración**: decaer ε
   antes (εdecay 8000) sube de 1,7 a 9,9 ladrillos. Lección: medir la métrica REAL, no la recompensa.
3. **El pivote: darle VISTA.** Se añade al estado la ocupación de los ladrillos.
4. **La pieza clave (escala 0,25).** Con ocupación {0,1} pura, las 28/80 entradas de ladrillos AHOGAN
   en magnitud a las 6 cinemáticas → no aprende ni a sobrevivir. Atenuarlas (×0,25) lo desbloquea todo.
5. **Apuntar y generalizar.** Se mide en niveles DISPERSOS (donde sobrevivir ≠ ganar) y en niveles
   NUNCA vistos (splits train/test). El éxito ahí PRUEBA que apunta y generaliza.
6. **A lo grande: 8×10 + convolución.** Encoder conv sobre la matriz de ocupación + rama cinemática.
7. **La GPU.** TF.js en Node es solo CPU; la GPU Metal se alcanza en el navegador (WebGPU) o portando a
   **PyTorch-MPS** (~5,5× más rápido). Es honesto contar por qué y cómo.
8. **Los 5 algoritmos con visión + el comparador**, con el tratamiento HONESTO de qué funcionó y qué
   costó: la «cacería de bugs» de los model-based y de SAC es PARTE de la historia, no se esconde.

### 5.2 Los protagonistas (los algoritmos REALES — todos CON VISIÓN)
Una sección por algoritmo (§3.4), alternando colores. La «escalera» pedagógica de este repo:
- **La observación / la VISTA** (cimiento, antes de los algoritmos): estado = 6 cinemáticas + matriz de
  ocupación de ladrillos; por qué importa la **escala**; flat (MLP) vs **convolución** (rama conv + cinemática).
- **DQN** (model-free, basado en valor) — Double DQN + pérdida Huber + red objetivo + replay. Caballo de batalla.
- **PPO** (model-free, actor-crítico on-policy) — *surrogate* recortado + GAE.
- **SAC** (model-free, actor-crítico off-policy, máxima entropía) — doble crítico + temperatura.
- **World Model** (model-based, Dyna-Q) — modelo de dinámica (s,a)→(s′,r) + imaginación/planning.
- **World Model RNN** (model-based, dinámica LSTM) — imaginación recurrente.
- **El generador de niveles + la generalización** (sección propia o dentro de «medición»): familias de
  patrones, splits disjuntos, currículo, y por qué `success_rate` en TEST es la métrica honesta.

### 5.3 Los DATOS reales que DEBEN aparecer (tablas medidas; nada inventado)
> Son las cifras de esta saga, para «Resultados»/«Interpretación»/«Comparador». Verifica/actualiza
> contra la bitácora al generar el PDF.
- **La escala lo desbloquea** (greedy, 4×7 lleno): escala 1,0 → atascada (128 pasos · 0% a 600k);
  escala 0,25 → despega (2209 pasos · 27/28 ladrillos · **51%**).
- **Apuntar (Puerta 1):** 77–84% de éxito en niveles dispersos, en 2 semillas, **zero-shot** (esos
  patrones no se entrenaron).
- **Generalización 4×7:** niveles variados 78% test (gap 6,4) → **con currículo 86%** (gap 2,5).
- **8×10 + conv:** TRAIN 86% · **TEST 86%** · gap ≈ 0.
- **GPU (misma tarea/arquitectura):** TF.js-CPU nativo 1.5M → 222s · 86% · 6.800 exp/s; **PyTorch-MPS
  (GPU) 1.5M → 40s · 81% · 37.591 exp/s** (~5,5×); MPS 3M → 80s · **89%**.
- **Comparador final (los 5 con visión, GPU/MPS, 1.5M, success_rate TEST)** — *usa las cifras
  DEFINITIVAS de la bitácora al generar*; instantánea actual: **PPO 100% · DQN 93% · World Model 71%**
  (resueltos); **WM-RNN 2%** (capaz de 82%, varianza de semilla) · **SAC 0%** (capaz de 98%, inestable)
  — estos dos en iteración.

### 5.4 El entorno, la métrica y los parámetros reales
- **Entorno:** Arkanoid de física de **paso fijo**, rejilla **8×10** (80 ladrillos), coordenadas
  normalizadas, timeout = 90·nº-ladrillos. La «velocidad» de la UI solo controla lotes/frame, NO la física.
- **Observación:** 6 cinemáticas (∈[-1,1]) + ocupación de ladrillos (matriz 8×10 para la conv, o vector
  plano ×**escala 0,25** para el MLP).
- **Métrica de cabecera:** `success_rate` (greedy, ε=0) sobre niveles de **TEST no vistos**. La
  recompensa media NO es criterio (es diagnóstico). Honestidad: en rejilla llena «éxito» puede ser solo
  «sobrevivir»; por eso se mide en niveles dispersos/variados (sobrevivir ≠ ganar → el éxito prueba apuntar).
- **Parámetros clave (`table.params`, en llano):** `escala_ladrillos` (0,25), `εdecay` (8000),
  `learning_rate`, `γ` (0,99), `τ` (soft update, 0,01), `replay` (100k), `batch` (256/128), currículo por
  nº de ladrillos; y los propios de cada algoritmo (GAE λ y clip en PPO; α/entropía en SAC; pasos de
  planning, horizonte e imaginación en los World Models).

### 5.5 El tratamiento HONESTO por modelo (la «cacería de bugs» es parte del cuaderno)
Aplica §0.1 (honestidad por encima del marketing). En «Resultados» y la caja `.interp` (qué observamos /
qué funcionó / qué mejoraríamos) de cada modelo, cuenta lo que DE VERDAD pasó:
- **DQN, PPO:** resuelven bien y rápido (93% / 100%); PPO es el más sólido.
- **World Model / WM-RNN:** su Q-net **resuelve solo** (66%), pero la **imaginación los envenenaba**
  (caían a 1%) por un modelo de dinámica pobre. Mejora encontrada: **dinámica solo cinemática, ladrillos
  fijos en imaginación, sin recompensa/`done` imaginados, cinemática acotada y peso bajo del planning** →
  World Model 71%. Caso real de **sesgo del modelo (model bias)** en Dyna-Q.
- **SAC:** **colapso bimodal** (una semilla 98%, casi todas 0%) por un bucle *actor-malo→datos-malos→
  crítico-malo*. Se documenta lo probado (exploración ε-greedy, α fijo, desplegar la política del
  crítico…) — caso real de **inestabilidad de SAC discreto**. (Pendiente de fiabilizar.)

### 5.6 Analogías y usos (para `.analogy` / `.uses`)
Analogías: aprender por premios/castigos; ensayo y error; **aprender a apuntar mirando el tablero**, no a
ciegas. Usos reales del RL: videojuegos (Atari/AlphaGo), robótica y control, conducción autónoma, gestión
de energía/recursos, recomendación, trading, y **RLHF** para alinear LLMs.

### 5.7 Mapeo de los entregables a ESTE repo (rellena al generar)
- **«Resultados»** = `success_rate`/`%ladrillos` en TEST + curvas reales (de la app o de los scripts) +
  tira de fotogramas de un episodio bueno (opcional). NO son imágenes generadas: son métricas medidas.
- **«Estructura de la red»** (`.pipe`) = Estado (6 cin + matriz 8×10) → conv 16/32 + rama cinemática →
  128→128 → 3 acciones (←/·/→) o Q/valor según el algoritmo.
- **«Código clave»** por algoritmo (`src/agentes/*.js` para la app; `gpu/*.py` para la versión GPU):
  *la red* (`constructorRedes.js`/`crearRedConv`), *el entrenamiento* (la actualización: Double DQN /
  PPO step / SAC / Dyna-Q), y un *extra* (replay, GAE, imaginación, `_predRed` del split conv).
- **Capturas de la app**: pestaña Laboratorio (juego 8×10 + métricas + inspector + curvas), pestaña
  **Comparativa de modelos** y el **grid search**. Backend WebGPU visible en cabecera.
- **Medición**: sección propia — por qué la curva de entrenamiento no basta, evaluación **greedy** sobre
  niveles no vistos, splits train/test y currículo; captura del comparador.

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
- [ ] **La HISTORIA (§5.1)** es la espina del cuaderno: ciego → vista → apuntar → generalizar → GPU →
      comparador. El protagonista (un agente que aprende a VER) se nota de principio a fin.
- [ ] **Los DATOS reales (§5.3)** están: la tabla de la escala 0,25 (atascada vs despega), generalización
      78→86% con currículo, 8×10 gap≈0, GPU CPU-vs-MPS (~5,5×), y el **comparador final** con las cifras
      DEFINITIVAS de la bitácora (no las de aquí).
- [ ] **Honestidad por modelo (§5.5)**: se cuenta el envenenamiento por imaginación de los World Models
      (Q-net 66% vs imaginado 1%) y el colapso de SAC, con qué se arregló o qué queda pendiente. Sin maquillar.
- [ ] **Generalización bien explicada**: por qué `success_rate` en TEST (niveles no vistos) y no la
      recompensa; por qué en rejilla llena «éxito» puede ser solo «sobrevivir».

=== FIN DEL PROMPT ===
