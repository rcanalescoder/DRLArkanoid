// ============================================================================
//  Genera docs/Arkanoid-DRL-Learning-Lab-v2.pdf desde docs/report_v2.html.
//  Pipeline CDP: Chrome 148+ revienta (OOM) al rasterizar ~90 páginas de una
//  vez, así que imprimimos por RANGOS de 20 páginas con Page.printToPDF y las
//  fusionamos con pypdf (sin recomprimir). Reproducible desde el repo (el viejo
//  script vivía en /tmp).
//
//    Uso:  node scripts/generarPDF.mjs        (o: npm run pdf)
// ============================================================================
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPORT = resolve(RAIZ, "docs/report_v2.html");
const OUT = resolve(RAIZ, "docs/Arkanoid-DRL-Learning-Lab-v2.pdf");
const TMP = "/tmp/zoo_pdf";
const DBG = 9222;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PY = resolve(RAIZ, ".venv/bin/python");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const RANGOS = [];
for (let a = 1; a <= 200; a += 20) RANGOS.push(`${a}-${a + 19}`);

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${DBG}`,
  "--user-data-dir=/tmp/chrome-pdf-drl",        // instancia aislada → expone el debug port
  "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--mute-audio",
  "about:blank",
], { stdio: "ignore" });
chrome.on("error", (e) => { console.error("No se pudo lanzar Chrome:", e.message); process.exit(1); });

(async () => {
  let page = null;
  for (let i = 0; i < 80; i++) {
    try {
      const targets = await (await fetch(`http://localhost:${DBG}/json`)).json();
      page = targets.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (page) break;
    } catch (_) {}
    await sleep(500);
  }
  if (!page) { console.error("NO_PAGE_TARGET"); chrome.kill(); process.exit(1); }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map(); const eventos = new Map();
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id; pending.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const esperarEvento = (method, timeout = 30000) => new Promise((res, rej) => {
    const to = setTimeout(() => { eventos.delete(method); rej(new Error("timeout " + method)); }, timeout);
    eventos.set(method, () => { clearTimeout(to); eventos.delete(method); res(); });
  });
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
    else if (m.method && eventos.has(m.method)) eventos.get(m.method)();
  };

  await send("Page.enable");
  const cargado = esperarEvento("Page.loadEventFired", 30000);
  await send("Page.navigate", { url: "file://" + REPORT });
  await cargado;
  await sleep(8000); // decodificar imágenes locales (assets/*.jpg, v2/*.png)

  let n = 0, ok = 0;
  for (const rg of RANGOS) {
    try {
      const { data } = await send("Page.printToPDF", {
        printBackground: true, preferCSSPageSize: true,
        marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0, pageRanges: rg,
      });
      const f = `${TMP}/part${String(n).padStart(2, "0")}.pdf`;
      writeFileSync(f, Buffer.from(data, "base64"));
      console.log("OK", rg, "->", f);
      ok++;
    } catch (err) {
      // rango fuera del total de páginas → fin natural del documento.
      if (/exceeds|out of|invalid/i.test(err.message)) break;
      console.error("SKIP", rg, err.message);
    }
    n++;
  }
  ws.close();
  chrome.kill();

  if (!ok) { console.error("No se generó ninguna parte"); process.exit(1); }
  execFileSync(PY, [resolve(RAIZ, "scripts/_merge_pdf.py"), `${TMP}/part*.pdf`, OUT], { stdio: "inherit" });
  console.log(`\nPDF → ${OUT}`);
  process.exit(0);
})().catch((e) => { console.error(e); chrome.kill(); process.exit(1); });
