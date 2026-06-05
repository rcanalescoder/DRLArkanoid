// ============================================================================
//  Captura la pestaña "🎮 Jugar" de la app a un PNG, vía CDP (Chrome DevTools).
//  Lanza Chrome headless, navega de forma controlada al dev server (espera el
//  load), activa la pestaña, prepara el modo (todos/uno), conduce unos pasos de
//  juego para que haya acción visible (en headless el rAF puede no correr) y
//  captura la página completa.
//
//    Uso:  node scripts/capturarJugar.mjs [puerto=5199] [salida] [modo=todos]
//          (requiere el dev server: npm run dev -- --port 5199)
// ============================================================================
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const PORT = +(process.argv[2] || 5199);
const OUT = resolve(process.argv[3] || "docs/assets/v2/app_jugar.png");
const MODO = process.argv[4] || "todos";        // "todos" | "uno"
const URL = `http://localhost:${PORT}/`;
const DBG = 9222;
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  "--headless=new", `--remote-debugging-port=${DBG}`,
  "--user-data-dir=/tmp/chrome-captura-drl",   // instancia aislada → expone el debug port
  "--enable-unsafe-webgpu", "--enable-features=Vulkan,WebGPU",
  "--window-size=1680,1180", "--force-device-scale-factor=2",
  "--hide-scrollbars", "--no-first-run", "--no-default-browser-check",
  "--mute-audio", "about:blank",
], { stdio: "ignore" });
chrome.on("error", (e) => { console.error("No se pudo lanzar Chrome:", e.message); process.exit(1); });

const PREP = `(async () => {
  const t0 = Date.now();
  while (!window.__drl && Date.now() - t0 < 25000) await new Promise(r => setTimeout(r, 200));
  if (!window.__drl) return { ok:false, err:'no __drl' };
  document.querySelector('#tabsVista .tab[data-vista="jugar"]')?.click();
  const arena = window.__drl.app.arena;
  const t1 = Date.now();
  while ((!arena._iniciada || arena.pistas.length === 0) && Date.now() - t1 < 25000) await new Promise(r => setTimeout(r, 200));
  document.querySelector('.am-modo[data-modo="${MODO}"]')?.click();
  const objetivo = '${MODO}' === 'todos' ? 5 : 1;
  const t2 = Date.now();
  while (arena.pistas.length < objetivo && Date.now() - t2 < 20000) await new Promise(r => setTimeout(r, 200));
  for (let i = 0; i < 4000; i++) for (const p of arena.pistas) {
    if (!p.env.estaTerminado()) { const a = p.reproductor.seleccionarAcciones(p.env.obtenerVectorEstado(), 1); p.env.paso(a[0]); }
    else { arena._registrarFin(p); p.env.reiniciar(); p._contado = false; }
  }
  arena._render(); arena._refrescarMarcadores(true);
  window.scrollTo(0, 0);
  const app = document.querySelector('.app');
  return { ok:true, backend: window.__drl.tf.getBackend(), pistas: arena.pistas.length,
           w: Math.ceil(app.scrollWidth), h: Math.ceil(app.scrollHeight) };
})()`;

(async () => {
  // Esperar el target de página (con about:blank aparece enseguida).
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
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id);
      m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result);
    } else if (m.method && eventos.has(m.method)) {
      eventos.get(m.method)();
    }
  };

  await send("Page.enable");
  await send("Runtime.enable");

  // Navegación CONTROLADA: navegar y esperar el load antes de evaluar nada
  // (si no, el contexto inicial se destruye al cargar la app → "context destroyed").
  const cargado = esperarEvento("Page.loadEventFired", 30000);
  await send("Page.navigate", { url: URL });
  await cargado;
  await sleep(1500); // dar margen a que arranque el módulo ESM (tf backend, etc.)

  const prep = await send("Runtime.evaluate", { expression: PREP, awaitPromise: true, returnByValue: true });
  const info = prep.result?.value || {};
  console.log("prep:", JSON.stringify(info));
  if (!info.ok) { console.error("Preparación falló:", info.err); ws.close(); chrome.kill(); process.exit(1); }

  await sleep(600); // asentar el render
  const W = Math.min(info.w || 1680, 1680);
  const H = Math.min(info.h || 1180, 2400);
  const shot = await send("Page.captureScreenshot", {
    format: "png", captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: W, height: H, scale: 2 },
  });
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, Buffer.from(shot.data, "base64"));
  console.log(`OK → ${OUT} (${W}×${H} @2x, backend=${info.backend}, pistas=${info.pistas})`);

  ws.close();
  chrome.kill();
  process.exit(0);
})().catch((e) => { console.error(e); chrome.kill(); process.exit(1); });
