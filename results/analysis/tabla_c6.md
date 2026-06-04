# C6 — Comparativa final (protocolo congelado `a1ab7ce18d7bad6b`)

Framework: `torch2.12.0+np2.4.4+py3.13·mps` · eval greedy · 5 semillas [0, 1, 2, 3, 4] · umbral de colapso <10% · fuente: `results/ledger.csv` (75 runs).

Etiquetas honestas: SAC = `SAC-critic-hybrid` (conducta y eval del crítico soft); WM/WM-RNN = Dyna-Q con modelo **cinemático** (no simulador del juego).

### Presupuesto 1500k pasos  ·  TEST-ID (greedy, niveles no vistos)

| Modelo | n | Mean | Median | Std | Min | Max | IC95 | Collapse | %>80 | OOD-patrón | 60-80 ladr. | Steps-clear | Comentario |
|---|--:|--:|--:|--:|--:|--:|:--:|--:|--:|--:|--:|--:|---|
| DQN | 5 | **77%** | 85% | 19 | 44% | 87% | [61, 94] | 0% | 80% | 74% | 65% | 2125 | ok |
| PPO | 5 | **91%** | 94% | 7 | 80% | 96% | [85, 96] | 0% | 100% | 89% | 85% | 1923 | ok |
| SAC-critic-hybrid | 5 | **61%** | 61% | 38 | 1% | 97% | [28, 95] | 20% | 40% | 60% | 54% | 1716 | 20% colapsos, alta varianza |
| WM (Dyna-Q cinem.) | 5 | **55%** | 65% | 21 | 28% | 79% | [37, 74] | 0% | 0% | 53% | 44% | 1977 | alta varianza |
| WM-RNN (Dyna-Q cinem.) | 5 | **35%** | 20% | 22 | 19% | 61% | [16, 54] | 0% | 0% | 29% | 22% | 1370 | alta varianza, muere mucho |

### Presupuesto 700k pasos  ·  TEST-ID (greedy, niveles no vistos)

| Modelo | n | Mean | Median | Std | Min | Max | IC95 | Collapse | %>80 | OOD-patrón | 60-80 ladr. | Steps-clear | Comentario |
|---|--:|--:|--:|--:|--:|--:|:--:|--:|--:|--:|--:|--:|---|
| DQN | 5 | **67%** | 78% | 30 | 17% | 93% | [41, 93] | 0% | 40% | 66% | 49% | 2050 | alta varianza |
| PPO | 5 | **90%** | 92% | 8 | 79% | 98% | [84, 97] | 0% | 80% | 89% | 83% | 2334 | ok |
| SAC-critic-hybrid | 5 | **4%** | 1% | 7 | 1% | 16% | [-2, 10] | 80% | 0% | 4% | 2% | 545 | 80% colapsos, muere mucho |
| WM (Dyna-Q cinem.) | 5 | **33%** | 27% | 17 | 21% | 62% | [18, 47] | 0% | 0% | 28% | 7% | 1351 | muere mucho |
| WM-RNN (Dyna-Q cinem.) | 5 | **54%** | 60% | 24 | 28% | 80% | [33, 75] | 0% | 20% | 52% | 36% | 1891 | alta varianza |

### Presupuesto 3000k pasos  ·  TEST-ID (greedy, niveles no vistos)

| Modelo | n | Mean | Median | Std | Min | Max | IC95 | Collapse | %>80 | OOD-patrón | 60-80 ladr. | Steps-clear | Comentario |
|---|--:|--:|--:|--:|--:|--:|:--:|--:|--:|--:|--:|--:|---|
| DQN | 5 | **85%** | 89% | 15 | 60% | 98% | [72, 98] | 0% | 80% | 82% | 87% | 1858 | ok |
| PPO | 5 | **87%** | 87% | 4 | 82% | 93% | [84, 91] | 0% | 100% | 84% | 86% | 1648 | estable |
| SAC-critic-hybrid | 5 | **88%** | 89% | 9 | 75% | 97% | [81, 96] | 0% | 80% | 89% | 69% | 2447 | ok |
| WM (Dyna-Q cinem.) | 5 | **56%** | 71% | 34 | 14% | 88% | [26, 86] | 0% | 40% | 53% | 48% | 1992 | alta varianza |
| WM-RNN (Dyna-Q cinem.) | 5 | **40%** | 42% | 22 | 8% | 66% | [21, 59] | 20% | 0% | 37% | 20% | 1446 | 20% colapsos, alta varianza, muere mucho |
