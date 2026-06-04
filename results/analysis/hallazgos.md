# Hallazgos honestos — Comparativa DRL Arkanoid 8×10 (Fase C)

> Protocolo **congelado** `frozen_hash=a1ab7ce18d7bad6b` · framework `torch2.12.0+np2.4.4+py3.13·mps`
> · eval **greedy** · **5 semillas** [0–4] · presupuestos **700k/1.5M/3M** · umbral de colapso **<10%**.
> Test sets disjuntos y limpiabilidad verificada (oráculo): TEST-ID 500 · OOD-patrón 250 · OOD-dificultad 199.
> Cada cifra sale de `results/ledger.csv` (75 runs C6 + variantes) y de `results/analysis/*`.

## El mensaje que este trabajo puede defender
Con protocolo congelado y multi-semilla, **PPO es el mejor y el más fiable** (91%±IC en TEST-ID @1.5M,
0% colapsos, 100% de semillas >80%). A 3M, **PPO, DQN y SAC (pure 91% / hybrid 88%) convergen ~85–91%** → en esta
tarea **gana el model-free**; los World Models cinemáticos se quedan en un techo ~55%. Ningún número
sin artefacto; los fallos y colapsos se reportan, no se esconden.

## C6 — comparativa congelada (headline @1.5M, TEST-ID greedy, niveles no vistos)
| Modelo | Mean | Median | Std | Min–Max | Colapso | %>80 | OOD-patrón | 60–80 ladr |
|---|--:|--:|--:|--:|--:|--:|--:|--:|
| **PPO** | **91%** | 94 | 7 | 80–96 | 0% | 100% | 89 | 85 |
| DQN | 77% | 85 | 19 | 44–87 | 0% | 80% | 74 | 65 |
| SAC-critic-hybrid | 61% | 61 | 38 | 1–97 | 20% | 40% | 60 | 54 |
| WM (Dyna-Q cinemático) | 55% | 65 | 21 | 28–79 | 0% | 0% | 53 | 44 |
| WM-RNN (Dyna-Q cinemático) | 35% | 20 | 22 | 19–61 | 0% | 0% | 29 | 22 |

Barrido de presupuesto (mean TEST-ID 700k→1.5M→3M): PPO 90→91→87 · DQN 67→77→85 · SAC 4→61→88 ·
WM 33→55→56 · WM-RNN 54→35→40. Artefacto: `results/analysis/tabla_c6.{md,csv}`.

## Conclusiones por experimento
- **C1 · fallos de PPO** (`ppo_failures.json`): el residual ~10% es **techo de CONTROL de la política**,
  no de datos ni de representación ni de física. Niveles 100% limpiables (oráculo), fallo uniforme entre
  familias (spread ~5 pts), domina "pierde la bola" (84–92%) dejando 71–80% sin romper (falla pronto), y
  **@3M no mejora** (87%<91%). Es meseta de la política.
- **C2 · representación DQN** (`dqn_representation.json`): el **gap DQN–PPO es ALGORÍTMICO, no de
  representación**. conv es la mejor representación de DQN (gana a 700k y a 3M) y aun así la mejor rep
  (≈78@1.5M) queda 13 pts por debajo de PPO (91). `flat_0.25` colapsa al 100% → el encoder flat es muy
  sensible a la escala de entrada.
- **C3 · ablación** (`ablation.csv`, DQN@1.5M, base=77%): por impacto al quitar el ingrediente →
  **escala 1.0 (−76,5, colapso total)** ≫ timeout constante (−23,5) > conv (−20,4) > ε-decay (−2,6) ≈
  currículo (−1,9); y **el shaping HACE DAÑO: quitarlo sube +8,0**. Inversión histórica: la escala 0.25,
  que en la era flat 4×7 fue LA pieza que desbloqueó el aprendizaje, con el encoder CONV lo MATA → el
  ingrediente óptimo depende de la arquitectura.
- **C4 · SAC-pure vs SAC-critic-hybrid** (`sac_variants.json`): **SAC-pure (actor) iguala o supera al
  híbrido en los 3 presupuestos** (700k 25 vs 4, 1.5M 87 vs 61, 3M 91 vs 88) y **colapsa menos** (1.5M:
  0% vs 20%). La premisa histórica "el actor SAC discreto colapsa, por eso se usa el crítico" **NO se
  sostiene** bajo protocolo congelado + multi-semilla → el híbrido era una sobre-corrección. Se reportan
  ambos por separado (nombre honesto).
- **C5 · World Models** (`wm_variants.json`): los Dyna-Q **cinemáticos** topan bajo (MLP ~55–56%, RNN
  ~35–40%) frente a model-free (~85–88%). La hipótesis "el LSTM predice peor la cinemática" queda
  **REFUTADA midiendo**: MSE 1-paso LSTM ≈ MLP (~1,02×). El techo lo pone la **dinámica solo-cinemática**
  (ladrillos congelados en imaginación), no el modelo; la recurrencia no aporta y añade varianza
  (el "no-monótono" del RNN es sobre todo ruido de semilla). Hallazgo negativo principista.

## Honestidad (atajos NO tomados)
- Multi-semilla siempre (nunca "el mejor run"): varias conclusiones precipitadas de 1 semilla se
  corrigieron con las 5 (p.ej. SAC parecía roto a 700k pero funciona a ≥1.5M; el currículo parecía −27
  pts con 1 semilla pero es −1,9 con 5).
- Receta congelada: las variantes C2/C3/C4 son aditivas; `base` conserva su `config_hash` (87db7e354ae3).
- Nombres honestos: el "sac" es **SAC-critic-hybrid** (política del crítico soft), no SAC a secas; los WM
  son **Dyna-Q con modelo cinemático**, no "simuladores del juego".
- Paralelización validada: misma run en paralelo == en solitario (84,9% == 84,93%); no altera los números.
