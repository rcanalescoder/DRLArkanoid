# ESTADO DEL PROTOCOLO DE HONESTIDAD — punto de continuación

> Documento de traspaso. Dice **exactamente dónde estamos** y **cómo seguir** (en esta
> máquina o en otra más potente). La fuente de verdad técnica es `frozen_protocol.json`
> y el tag de git `protocolo-v1`. El protocolo vinculante está en
> `docs/PROTOCOLO-ejecucion-honesta.md` (re-pégalo al nuevo Claude como instrucción).

_Última actualización: 2026-06-04 (Sesión 4) · **Fase C COMPLETA** en Apple M3 Ultra · commit base `9844120` · tag `protocolo-v1`._

---

## Dónde estamos

| Fase | Estado |
|---|---|
| **A — Infraestructura de honestidad** | ✅ COMPLETA y verificada (PUERTA A pasada, 6/6 checks) |
| **B — Congelado del protocolo** | ✅ COMPLETA (PUERTA B: existe `frozen_protocol.json` + tag `protocolo-v1`) |
| **C — Experimentos** | ✅ COMPLETA (C1–C6) con infra paralela nueva (K=24). Artefactos en `results/analysis/`. Pendiente: PUERTA C (revisión) y Fase D (opcional). |

## Fase C — COMPLETA (Sesión 4, M3 Ultra · infra paralela)
- **Infra nueva**: venv clavado al congelado (`requirements.txt`); `gpu/bench_concurrency.py` (pico
  concurrencia K=24, GPU-bound); `gpu/tanda_par.py` (work-queue K=24, resumible, ledger con lock fcntl);
  fix de naming de artefactos (incluyen budget → no se sobrescriben); encoders flat/branches +
  `variant_cfg` (ADITIVO, base intacto `config_hash=87db7e354ae3`); generadores de análisis
  `report_c6.py`, `c1_ppo_failures.py`, `c2_representation.py`, `c3_ablation.py`, `c4_sac.py`,
  `c5_world_models.py`. Bitácora narrativa: `pasosrealizados.txt` (cap. 10).
- **C6** (75/75 runs, 64 min, 0 fallos, 6 colapsos) → `results/ledger.csv`, `results/analysis/tabla_c6.{md,csv}`.
  Headline @1.5M (TEST-ID): PPO 91 · DQN 77 · SAC-hybrid 61 · WM 55 · WM-RNN 35. A 3M, PPO/DQN/SAC ~85–91%.
- **C1** `ppo_failures.json`: residual de PPO = techo de CONTROL (no datos/representación/física).
- **C2** `dqn_representation.json`: gap DQN-PPO ALGORÍTMICO (conv ya es la mejor rep de DQN; aún < PPO).
- **C3** `ablation.csv`: escala 1.0 = ingrediente crítico (−76 al pasar a 0.25); el shaping HACE DAÑO
  (+8 al quitarlo); inversión histórica del rol de la escala 0.25.
- **C4** `sac_variants.json`: SAC-pure ≥ SAC-critic-hybrid en los 3 presupuestos y colapsa menos → la
  premisa "el actor SAC colapsa" no se sostiene.
- **C5** `wm_variants.json`: WM cinemático topa ~55% << model-free; el LSTM no aporta (MSE dinámico = MLP).
- **Síntesis honesta**: `results/analysis/hallazgos.md`. **Pendiente**: PUERTA C, Fase D (opcional), commit.

## Decisiones ya tomadas (congeladas — no re-decidir)

- **Receta base · timeout = CONSTANTE 7200** (coincide con el código GPU e histórico).
  → en C3 la ablación de timeout será **"proporcional 90×ladrillos"**, no "fijo".
- **5 semillas**: `[0,1,2,3,4]`.
- **Presupuestos**: `700k / 1.5M / 3M` pasos.
- **Eval** = greedy. **Umbral de colapso** = `<10%`.
- `frozen_hash = a1ab7ce18d7bad6b`.

## Conjuntos de test congelados (en `results/test_sets/`, versionados en git)

- **TEST-ID**: 500 niveles (familias de train, disjuntos) · sha `1e7d8e95687d77e6`
- **TEST-OOD-patrón**: 250 niveles · 10 familias nuevas (túnel, túnel-h, diagonal, X, anillo,
  hueco central, ajedrez, esquinas, cruz, muros laterales) · sha `71e74c6071ad6f51`
- **TEST-OOD-dificultad**: 199 niveles (denso/casi-lleno/lleno/denso-bajo) · sha `7b8d2c5610c1c6a4`
- 0 niveles no-limpiables (verificado recargando de disco). Limpiabilidad = oráculo de
  seguimiento determinista por nivel (cota inferior honesta).

---

## ⚠️ CRÍTICO al continuar (sobre todo en otra máquina)

- **NO re-ejecutes `python3 gpu/lab.py freeze`.** El protocolo YA está congelado. Re-congelar
  recalcularía `framework`/`device`/`commit` → cambiaría `frozen_hash` y rompería la garantía.
  Usa `frozen_protocol.json` y `results/test_sets/*.npz` **tal cual** (vienen en git).
- El entrenamiento es **dependiente del dispositivo** (MPS vs CUDA dan números distintos
  con la misma semilla). Es esperado y honesto: el protocolo reporta **distribución** sobre
  5 semillas, el protocolo congelado (test sets/receta/semillas/presupuestos) es idéntico, y
  el `ledger.csv` registra el `framework`/`device` real de cada run. La otra máquina puede
  usar CUDA o MPS sin problema (auto-detección en `arkanoid_mps.py`).

---

## Próximos pasos (comandos exactos)

```bash
# 0) Requisitos: python3 con torch (MPS o CUDA), numpy, matplotlib.
python3 -c "import torch; print(torch.__version__, torch.backends.mps.is_available(), torch.cuda.is_available())"

# 1) (Opcional pero recomendado) CALIBRAR: medir coste real de 1 run @1.5M antes de la tanda.
#    Basta con lanzar 1 modelo @1.5M y cronometrar; cuenta como run real (la tanda la saltará).
python3 gpu/lab.py multiseed dqn 1500000 0      # 1 semilla DQN @1.5M (mide y deja artefacto)

# 2) FASE C / C6 — tanda completa multi-semilla (RESUMIBLE: salta lo ya hecho).
#    5 modelos × 5 semillas × {700k,1.5M,3M} = 75 runs. Genera ledger + agregados + curvas.
python3 gpu/lab.py tanda                          # todo
#    o por partes:
python3 gpu/lab.py tanda 1500000                  # solo 1.5M (headline)
python3 gpu/lab.py tanda 700000,1500000,3000000 dqn,ppo   # subconjunto

# 3) Monitorizar progreso (cuántas de las 75 runs van).
python3 gpu/lab.py status

# Lanzar en segundo plano y seguir el log (útil en sesión larga):
nohup python3 gpu/lab.py tanda > tanda.log 2>&1 &
tail -f tanda.log
```

## Qué está IMPLEMENTADO y qué FALTA en la Fase C

**Listo y turnkey:**
- **C6** (comparativa de los 5 modelos, receta base, multi-semilla, 3 presupuestos) → `tanda`.
  Produce `results/ledger.csv`, `results/aggregate/*.json`, `results/plots/curve_*.png`,
  `results/runs/*.json`, `results/heatmaps/*.png`.

**Pendiente de implementar (es el grueso de la Fase C tras la tanda):**
- **C1** — análisis de fallos de PPO → `results/analysis/ppo_failures.json` (+ heatmaps de fallos):
  desglosar episodios fallidos por familia / nº ladrillos / causa (perder bola vs timeout vs
  sin ladrillos alcanzables) y concluir si el residual es aprendible o techo de física.
- **C2** — aislamiento de representación: `DQN-flat-0.25`, `DQN-conv`, `DQN-branches`
  → `results/analysis/dqn_representation.json`. **Requiere implementar el encoder flat y la
  variante de ramas** (ahora `build_model` lanza `NotImplementedError` para no-conv).
- **C3** — ablación: variantes `sin_curriculo`, `sin_conv`, `sin_escala`, `sin_shaping`,
  `epsdecay_lento`, `timeout_proporcional` → `results/analysis/ablation.csv`.
  **Requiere implementar esas variantes en `variant_cfg()`** (ahora solo existe `base`).
- **C4** — SAC honesto separado: `SAC-pure` (actor para conducta y eval) vs `SAC-critic-hybrid`
  (lo actual: conducta ε-greedy del crítico + eval greedy del crítico) →
  `results/analysis/sac_variants.json`. **Falta separar `SAC-pure`** (el SAC actual ES el híbrido).
- **C5** — caracterización honesta de World Models (WM = Dyna-Q cinemático, NO simulador) →
  `results/analysis/wm_variants.json`. Datos vienen de C6; falta el análisis/redacción y el
  experimento opcional de ensemble.

> Naming honesto obligatorio (regla del protocolo): el SAC actual NO es "SAC" a secas, es
> `SAC-critic-hybrid`. Los WM son "Dyna-Q con modelo cinemático", no "simulador del juego".

---

## Mapa de ficheros (todo en git salvo lo regenerable)

| Fichero | Qué es |
|---|---|
| `gpu/lab.py` | Harness único: `eval_run` (§6.1), `run_multiseed` (§6.2), curvas, manifiesto, ledger (§6.3), `freeze`, `tanda`, `status`, `smoke`. |
| `gpu/lab_levels.py` | Los 3 test sets (§7) + oráculo de limpiabilidad determinista. |
| `gpu/arkanoid_mps.py` | Entorno vectorizado + generador + DQN conv. Hooks opt-in (shaping/timeout/causa/reward-sin-shaping/heatmap). |
| `gpu/comparativa_mps.py` | Clases de los 5 modelos (DQN, SAC=hybrid, WorldModel, WorldModelRNN, PPO). |
| `frozen_protocol.json` | Protocolo congelado + `frozen_hash`. **No regenerar.** |
| `results/test_sets/` | Test sets congelados (.npz) + `clearability_report.json`. **Versionado.** |
| `docs/PROTOCOLO-ejecucion-honesta.md` | El protocolo vinculante (referencia). |

**Regenerable (gitignored, NO se transfiere por git — se recrea al correr la tanda):**
`results/{checkpoints,runs,heatmaps,curves,plots,aggregate}/` y `results/ledger.csv`.

---

## Traspaso a otra máquina

**Opción A — git (recomendada; hay remoto `origin` en GitHub):**
```bash
# en ESTA máquina (tras tu OK):   git push origin main --tags
# en la OTRA máquina:
git clone https://github.com/rcanalescoder/DRLArkanoid.git   # o git pull si ya lo tienes
cd DRLArkanoid
# instalar deps de python (torch/numpy/matplotlib) y seguir "Próximos pasos".
```
Lo regenerable no viaja por git (no existe aún), así que el clon queda exactamente en este punto.

**Opción B — copia directa:** copia la carpeta `DRLArkanoid/` SIN `node_modules/`
(para el trabajo GPU/Python no hace falta; es lo único pesado). Todo lo necesario son los
`.py` de `gpu/`, `frozen_protocol.json`, `results/test_sets/` y la carpeta `.git`.
