# Protocolo de ejecución honesta — Comparativa DRL Arkanoid 8×10
### Instrucciones para Claude Code (vinculantes, no se pueden saltar)

> Copia de referencia en disco del protocolo vinculante. Para el traspaso a otra máquina,
> re-pega este documento al nuevo Claude como instrucción de sistema/usuario; esta copia
> sirve para que el agente pueda leerlo. El estado de ejecución vive en `ESTADO-PROTOCOLO.md`.

> Este documento NO es una sugerencia. Es un protocolo. Cada tarea tiene un **artefacto obligatorio** en una **ruta concreta** y un **check de hecho**. El informe final del proyecto se generará a partir de estos artefactos. El objetivo es **ejecutar, verificar y resolver** de forma honesta, sin atajos.

---

## 0. Reglas de juego (leer primero; son vinculantes)

1. **Ningún número existe sin artefacto.** Toda cifra reportada debe poder señalarse a un fichero concreto generado por una ejecución real.
2. **Prohibido estimar.** Solo cifras **medidas**.
3. **Una ejecución no está "hecha"** hasta que existan: checkpoint guardado, recuento de pasos en el log y fichero de métricas.
4. **Multi-semilla obligatorio.** Nunca una sola semilla ni el "mejor run". Se reporta la **distribución** (media, mediana, desviación, mín, máx) incluyendo colapsos.
5. **Protocolo congelado.** Tras congelar (Fase B), no se cambia hiperparámetro, generador, semillas ni niveles test. Cualquier cambio obliga a re-ejecutar todos los modelos y anotarlo.
6. **Los fallos se reportan, no se esconden.** Colapsos/no-convergencia se registran. Prohibido descartar en silencio o re-tirar semilla.
7. **Todo va al ledger.** Cada ejecución añade una fila a `results/ledger.csv` (§6.3). El informe final se genera desde el ledger.
8. **Parada obligatoria en cada puerta.** Al final de cada fase: PARA, presenta artefactos y espera.
9. **Si no puedes hacer un paso, PARA y dilo.** Un "no he podido por X" es válido; un número inventado no.
10. **Un solo framework:** Python/PyTorch-MPS. El lab JS/TF.js es solo demo. Prohibido mezclar cifras JS y Python.

Al terminar cada tarea: `HECHO <tarea> — artefacto: <ruta> — check: <qué verificaste>` o `BLOQUEADO <tarea> — motivo: <...>`.

---

## 1. Objetivo
Llevar el proyecto de "tengo un 98% en un run" a "este modelo da X±Y% en N semillas sobre M niveles test no vistos, con protocolo congelado". Para cada algoritmo: o se mejora hasta su techo, o se caracteriza honestamente por qué su techo está donde está.

## 2. Fase A — Infraestructura de honestidad
- **A1.** `eval_run(model,variant,seed,test_set)`: carga checkpoint, evalúa greedy sobre lista fija, calcula métricas §6.1, guarda `results/runs/{...}.json` y `results/heatmaps/{...}.png`.
- **A2.** `run_multiseed(...)`: lanza cada semilla, registra en ledger, produce `results/aggregate/{...}.json` (§6.2).
- **A3.** Curvas de aprendizaje cada K pasos → `results/curves/{...}.csv` → `results/plots/curve_{...}.png`.
- **A4.** Manifiesto: `results/runs/{...}.config.json` con hiperparámetros, semilla, commit git, versión, generador. `config_hash` (sin la semilla).
- **A5.** Ledger central `results/ledger.csv` append-only (§6.3).
- **A6.** Verificar limpiabilidad de todos los niveles test → `results/test_sets/clearability_report.json`. 0 no-limpiables.
- **PUERTA A:** enseñar `results/` con A1–A6 sobre una run de prueba.

## 3. Fase B — Congelado del protocolo
Congelar y commitear (`git tag protocolo-v1`): generador, los 3 test sets (§7), lista de semillas (mín 5, objetivo 10), presupuestos (700k/1.5M/3M), `eval=greedy`, métricas (§6). Guardar `frozen_protocol.json` + hash. **PUERTA B:** enseñar `frozen_protocol.json` y el tag.

## 4. Fase C — Experimentos controlados (un cambio duro por experimento)
- **C1.** Análisis de fallos de PPO → `results/analysis/ppo_failures.json` + heatmaps. Resolver: ¿residual aprendible o techo de física/diseño?
- **C2.** Aislamiento de representación (gap DQN vs PPO): `DQN-flat-0.25`, `DQN-conv`, `DQN-branches`, multi-semilla → `results/analysis/dqn_representation.json`. Prohibido saltar a Rainbow.
- **C3.** Ablación mínima de la receta (base, sin_curriculo, sin_conv, sin_escala, sin_shaping, epsdecay_lento, timeout_*) → `results/analysis/ablation.csv`. Ordenar ingredientes por impacto.
- **C4.** SAC honesto: `SAC-pure` y `SAC-critic-hybrid` separados y nombrados → `results/analysis/sac_variants.json`. Prohibido presentar el híbrido como "SAC".
- **C5.** World Models (WM MLP y WM-RNN) → `results/analysis/wm_variants.json`. Nombrar "Dyna-Q con modelo cinemático", no "simulador". Reportar el hallazgo negativo principista.
- **C6.** Comparativa final congelada (1.5M, y 700k/3M): los 5 modelos + variantes honestas, multi-semilla, mismos test sets, eval greedy. Generar tabla (§8) desde el ledger. Prohibido tunear entre runs.
- **PUERTA C:** enseñar artefactos C1–C6.

## 5. Fase D — Exploración (opcional)
Re-calentar ε/entropía en cada salto de currículo, multi-semilla → `results/analysis/explore_rewarm.json`. Reportar el delta ayude o no.

## 6. Definiciones exactas
- **6.1 Métricas por run (greedy):** `success_rate` (por bloque ID/OOD y por bucket 10-20/20-40/40-60/60-80), `success_rate_train`, `bricks_cleared_mean/median`, `steps_to_clear`, `death_rate`, `reward_no_shaping`, `brick_break_heatmap`.
- **6.2 Agregados:** media, mediana, std, mín, máx, IC95, `collapse_rate` (umbral en `frozen_protocol.json`, p.ej. <10%), `%seeds>80%`.
- **6.3 Ledger:** `run_id, timestamp, model, variant, framework, seed, budget, config_hash, git_commit, success_test_id, success_test_ood_pattern, success_test_ood_diff, success_train, bricks_cleared_median, steps_to_clear, death_rate, reward_no_shaping, collapsed, status, config_path, metrics_path, heatmap_path, curve_path`.

## 7. Conjuntos de test (disjuntos de train; limpiabilidad verificada)
- **TEST-ID:** mismo generador/familias que train (≥100, objetivo 500).
- **TEST-OOD-patrón:** familias estructuralmente distintas (túneles, diagonales, bloques protegidos, huecos centrales…).
- **TEST-OOD-dificultad:** más densidad / casi completos / más duros que el tope del currículo.
- Decir explícitamente a qué bloque corresponde cada cifra.

## 8. Tabla final (desde el ledger)
Una fila por modelo y variante honesta (incl. `SAC-pure` y `SAC-critic-hybrid` separados): Mean, Median, Std, Min, Max, IC95, Collapse rate, %seeds>80, Steps-to-clear, Éxito 60–80 ladr., TEST-OOD-patrón, Comentario. Con curvas superpuestas, ablación (C3), representación (C2) y conclusión de fallos (C1).

## 9. Atajos prohibidos
Una sola semilla / mejor run; tunear durante la comparativa; números no medidos; descartar runs malas en silencio; mezclar JS y Python; presentar el híbrido como "SAC" o WM al 65% como "resuelto" sin caracterización; pasar Rainbow como "DQN"; saltar C1 o C3; cruzar una puerta sin enseñar artefactos; decir "funciona" sin checkpoint+pasos+métricas.

## 10. Entregables
`results/ledger.csv` (con fallos/colapsos), tabla final (§8) + curvas, `ablation.csv` (C3), `dqn_representation.json` (C2), `sac_variants.json` y `wm_variants.json` (C4,C5), `ppo_failures.json` (C1), tablas por dificultad y por bloque, y una nota de hallazgos honestos.

El mensaje que el documento final debe poder defender: **"este modelo obtiene X±Y% en N semillas sobre M niveles test no vistos, con protocolo congelado, y aquí está cada artefacto que lo respalda."**
