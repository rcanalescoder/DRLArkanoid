// ============================================================================
//  Verificación rápida de los 4 algoritmos (backend CPU en Node)
//  Lanza scripts/entrenar.mjs para cada algoritmo con un presupuesto corto y
//  recoge el veredicto de convergencia. Uso: npm run verificar
// ============================================================================

import { spawnSync } from "node:child_process";

const PRUEBAS = [
  { algo: "dqn", pasos: 30000, envs: 128 },
  { algo: "ppo", pasos: 60000, envs: 32 },
  { algo: "sac", pasos: 30000, envs: 128 },
  { algo: "worldModel", pasos: 24000, envs: 128 },
];

console.log("\n══════════ VERIFICACIÓN DE LOS 4 ALGORITMOS ══════════\n");
const resultados = [];

for (const p of PRUEBAS) {
  process.stdout.write(`▶ ${p.algo.padEnd(11)} (pasos=${p.pasos}, envs=${p.envs})… `);
  const r = spawnSync(
    "node",
    ["scripts/entrenar.mjs", p.algo, "--pasos", String(p.pasos), "--envs", String(p.envs)],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
  );
  const salida = (r.stdout || "") + (r.stderr || "");
  const resumen = salida.match(/reward inicial[^\n]*/)?.[0] ?? "(sin resumen)";
  const veredicto = salida.match(/Veredicto:[^\n]*/)?.[0] ?? "(sin veredicto)";
  const tensores = salida.match(/tensores finales=(\d+)/)?.[1] ?? "?";
  resultados.push({ algo: p.algo, resumen: resumen.trim(), veredicto: veredicto.trim(), tensores });
  console.log(veredicto.replace("Veredicto:", "").trim());
}

console.log("\n──────────────────── RESUMEN ────────────────────");
for (const r of resultados) {
  console.log(`\n${r.algo.toUpperCase()}  [tensores=${r.tensores}]`);
  console.log(`  ${r.resumen}`);
  console.log(`  ${r.veredicto}`);
}
console.log("\n══════════════════════════════════════════════════\n");
