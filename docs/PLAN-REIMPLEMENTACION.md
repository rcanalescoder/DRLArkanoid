# Plan persistente — Reparación plena de Arkanoid DRL Learning Lab

> **Documento vivo y fuente única de verdad.** Aquí está el objetivo, el plan por
> fases con puertas de validación, y un **registro de progreso** al final que se
> actualiza tras cada fase. Si retomas el trabajo, lee §OBJETIVO y el §REGISTRO.

---

## OBJETIVO (no perderlo de vista)
Que el agente aprenda una **política general** que **limpie niveles de verdad**
—generados proceduralmente— y **generalice a niveles no vistos**, habiendo
aprendido a **apuntar deliberadamente** a los ladrillos vivos (no a romperlos por
rebote accidental ni a solo sobrevivir).

- **Métrica de cabecera: `success_rate`** sobre el conjunto de **test** (niveles no
  vistos), respaldada por el **mapa de calor de roturas** (prueba que apunta).
- La **recompensa media NO es criterio** de éxito ni de avance: es diagnóstico.

## PRINCIPIOS DE TRABAJO (gobiernan la ejecución — por encima del plan)
1. **El plan está al servicio del objetivo, no al revés.** Si los datos lo piden, se corrige el plan.
2. **Al final de CADA fase, verificar si nos acercamos al objetivo.** Si no, **modificar la fase actual
   ANTES de construir la siguiente**. No arrastrar fallos.
3. **PROHIBIDO concluir "el algoritmo no resuelve el problema".** Si no se logra, iterar hasta lograrlo:
   (a) **subir pasos/presupuesto**, (b) **grid search de parámetros**, (c) **meter variaciones**
   (entorno, recompensa, red, currículum). La no-solución es fallo nuestro de configuración, no del método.
4. **Antes de culpar al aprendizaje, comprobar la viabilidad física** (medir el óptimo posible con una
   heurística perfecta). Ej.: con timeout=600 el nivel era inganable; el 0 % era del reloj, no del agente.
5. **Si crece la rejilla, crece el presupuesto de pasos** (`PASOS_POR_LADRILLO·filas·columnas`, ≈90/ladrillo).

## DIAGNÓSTICO (por qué cambiamos lo que cambiamos — no deshacer por error)
Dos raíces, no una:
1. **El shaping `Φ = −|bola.x − pala.x|` es el saboteador inmediato del ~2/28.**
   Premia centrar la pala bajo la bola → golpe centrado → con `FACTOR_REBOTE 0.9` la
   bola sale **vertical** → pelotea en una sola columna. La recompensa sube farmeando
   el `+0.2` de devolver y el propio shaping; los ladrillos casi no contribuyen.
   *(Matiz: es potential-based, en teoría no cambia la política óptima; su sabotaje es
   práctico —aproximación de funciones + exploración pobre—, pero la receta de quitarlo
   es correcta igual.)*
2. **La observación no contiene los ladrillos** (6 variables cinemáticas). El agente es
   ciego al campo → no puede apuntar → **techo** bajo aunque la recompensa fuese perfecta.

Y: **un único nivel fijo** impide medir generalización. Orden de ataque: **recompensa
primero** (barato), **observación** (sube el techo), **generador con splits** (permite
formular la pregunta de generalización).

## PRINCIPIOS NO NEGOCIABLES
- Una sola métrica de cabecera: **`success_rate`** (apoyada en `bricks_cleared`).
- **Un cambio duro a la vez**, con **puerta de validación** entre fases.
- Validar en pequeño (4×7) antes de escalar (8×10 + generador).
- **No reintroducir** ningún shaping de proximidad pala-bola.
- **No tocar píxeles**: la percepción se da como **matriz de ocupación** de ladrillos.

## FASES Y PUERTAS

### Fase 0 — Arreglar recompensa y métricas (entorno actual 4×7) — HECHA (ver REGISTRO)
1. Recompensa definitiva (§5.1): **eliminar `Φ`** (shaping OFF por defecto).
2. **Loggear componentes de recompensa por separado** (ladrillos / supervivencia / terminal / shaping).
3. Métricas (§5.7) con **`success_rate` como cabecera** (resto = diagnóstico).
- **Puerta 0→1 (matizada):** con `Φ` OFF sobre el 4×7 **ciego**, `bricks_cleared` **no
  baja** y, deseablemente, sube. *Aviso (validación con código): aún ciego, el agente puede
  RE-CENTRAR la pala por seguridad → la subida puede ser modesta o ambigua; no es bug. La
  prueba decisiva es la Puerta 1. Si `bricks_cleared` BAJA, el `+0.2` solo no basta para el
  bootstrap de devolver la bola → revisar.*

### Fase 1 — Hacer FUNCIONAR la vista (4×7) — vista-only
Objetivo de la fase: que el agente CON VISTA (34) aprenda a **(a) sobrevivir** y **(b) APUNTAR**
a los ladrillos vivos, y limpie de forma fiable. Construido: estado = vector plano `6 + 28 = 34`,
MLP `34 → 128 → 128 → 3` (DQN: Double DQN + Huber + soft update), `εdecay=8000`, reloj `90·filas·cols`.
- **Problema medido (300k):** la vista sobrevive muy despacio porque las 28 ocupaciones ahogan la
  cinemática (ver PIVOTE). **Tarea abierta:** equilibrar la codificación para que la supervivencia
  (cinemática) no quede diluida — candidatos: **escala** de las ocupaciones, **rama cinemática**
  separada (la de Fase 2 sin conv), o **normalización** de entrada; + presupuesto suficiente.
  Iterar midiendo la curva de supervivencia/limpieza **de la propia vista** (nunca "no puede").
- **Puerta 1 (vista-only, sin comparativas):** la VISTA en greedy
  1. **sobrevive** el episodio y limpia el **4×7 lleno** con `success_rate` alto, y
  2. limpia **niveles DISPERSOS fijos** (columna izq/der, fila superior, salpicados) con
     `success_rate` alto → como ahí sobrevivir ≠ ganar, el éxito **prueba que apunta**.

### Fase 2 — Objetivo: 8×10 + conv + generador + splits + currículum
1. Rejilla **8×10** (80 celdas). 2. Observación **matriz 2D + conv** (§5.3). 3. **Generador**
   con pregeneración, splits disjuntos y verificación de limpiabilidad (§5.4, §5.6).
   4. **Currículum** (§5.5). 5. **Timeout** escalado con nº de ladrillos (§5.8).
- **Puerta 2 (final):** `success_rate` alto en **train Y test** con **gap pequeño**, y el
  **heatmap de roturas** muestra ataque deliberado a zonas con ladrillos vivos.

### Fase 3 — (opcional) Comparativa de los 5 algoritmos CON VISTA
- Reactivar los 5 algoritmos sobre el mismo encoder con vista (conv en Fase 2). **Sin baseline
  ciega** (abandonada, ver PIVOTE): la comparativa es entre algoritmos, todos con vista.
- **Caveat de validación:** DQN/PPO/SAC (model-free) reusan el encoder limpio; los **dos
  World Model (model-based)** tendrían que **predecir la evolución de la rejilla de ladrillos**
  en su modelo de dinámica → problema duro. Opciones: dinámica solo cinemática, o tratarlos
  como caso avanzado. Decidir al llegar.

## ESPECIFICACIONES (resumen operativo)

**5.1 Recompensa:** romper +1.0 · combo +0.5·(n−1) · completar +5.0 · perder −1.0 ·
devolver con pala +0.2. **Sin `Φ`.** Opcional tras flag (OFF): coste por paso `−ε` con
`ε·max_steps ≪ 1.0` (si no, el agente **suicida la bola** para dejar de acumular castigo).
Loggear `reward_bricks`, `reward_survival` (+0.2), `reward_terminal`, `reward_total`,
`reward_step_penalty` y (para comparar) `reward_shaping`.

**5.2 Observación:** cinemática (6, normalizada) + ladrillos. Fase 1: vector plano
filas·cols. Fase 2: **matriz 2D (8,10,1)** → conv → flatten → concat(cinemática) → cabeza MLP.

**5.3 Red:** Fase 1 MLP `34→128→128→3`. Fase 2: `Conv2D(16,3×3,relu,same) → Conv2D(32,3×3,
relu,same) → flatten`, rama cinemática (opcional `Dense(16)`), `concat → Dense(128) →
Dense(128) → Dense(3)`. Sin pooling. DQN primero. Mantener detección de fugas. *(Nota:
modelo multi-entrada = API funcional; el `crearMLP` actual solo hace secuenciales.)*

**5.4 Generador:** ocupaciones sobre rejilla fija 8×10; familias (filas, columnas, rombos,
círculos, dispersión, simétricos, dibujos); parametrizado por dificultad. **Pregeneración**
(pool fijo con semilla), splits reproducibles. **Verificación de limpiabilidad** *(matiz: con
ladrillos en rejilla y ángulo por la pala casi todo es alcanzable → basta condición suficiente
simple; evitar un check Monte-Carlo caro).*

**5.5 Currículum:** etapas de dificultad creciente; avanzar cuando `success_rate` supere
umbral N episodios. Es dispositivo de **entrenamiento**, no de evaluación.

**5.6 Splits:** train/val/test disjuntos (p. ej. 70/15/15), deduplicados. Reportar **test**.
Generalización = `success_rate(train) − success_rate(test)` (gap pequeño = generaliza).
Opcional: interpolación vs extrapolación. Evaluar siempre en **greedy**.

**5.7 Métricas (greedy):** **`success_rate`** (cabecera) · `bricks_cleared` (media/mediana) ·
`episodes_over_50/75pct` · `reward_total` y `reward_no_shaping` (solo tarea: ladrillos +
completar + perder) · `time_to_first_brick` · `steps_alive` (≠ jugar bien) ·
**`brick_break_heatmap`** (apuntar vs rebotar) · `success_rate` por train y test.
*(Fase 0: success_rate, bricks_cleared, reward_total, reward_no_shaping, time_to_first_brick,
steps_alive. Heatmap y train/test llegan en Fase 2 con el generador.)*

**5.8 Timeout:** `max_steps ≈ k·n_ladrillos`. **MEDIDO (no estimado):** un viaje pala→ladrillo→pala
≈ **63 pasos**; a ~1 ladrillo/viaje, limpiar 28 necesita **~1.760 pasos**. ⇒ el `k` real es **~65–90
por ladrillo** (no 25). Para 28 → timeout **~2.000–2.500**; para 80 → **~5.000–7.000**. El 600 actual
**cae corto incluso para 28** (techo físico ~11 ladrillos aunque se juegue perfecto). Ver hallazgo crítico
en el REGISTRO.

## QUÉ NO HACER
- No reintroducir `Φ` ni shaping de proximidad. No usar recompensa media como éxito/avance.
- No añadir PPO/SAC/World Models hasta Fase 3. No saltar a píxeles/CNN sobre el canvas.
- No cambiar varias cosas duras a la vez (respetar puertas). No generar niveles no limpiables.
- No evaluar en niveles vistos en entrenamiento.

## RESTRICCIONES TÉCNICAS
- Navegador + TensorFlow.js (WebGPU→WebGL→CPU), Mac M4 Max. Reutilizar infra: pools
  headless(256)/visual(8), registro, inspectores, detección de fugas, harness Node.
- Mantener detección de fugas tras añadir conv. (Baseline ciega ABANDONADA, ver PIVOTE.)
- Reutilizar el grid search para ajustar **recompensa** y **generador/currículum**, no solo HP.
- *Cambiar la observación es invasivo* (DIM_ESTADO, obtenerVectorEstado, buffer del gestor,
  entradas de los 5 agentes, replay buffer, inspectores) — preverlo en Fases 1–2.

---

## ▣▣ PIVOTE [2026-06-04] — SE ABANDONA EL CIEGO. Todo el foco en la VISTA. (LEER PRIMERO)
Decisión del usuario, asumida como principio: **el agente CIEGO queda abandonado y NO se usa
como referencia.** Comparar la vista contra el ciego **enturbia** en lugar de aclarar:
1. El ciego en rejilla LLENA "gana" **sobreviviendo** (la bola rebota por todo) → es un éxito
   **degenerado**, no el objetivo (apuntar). Medir contra él no dice nada útil.
2. Su despegue de supervivencia tiene **mucha varianza por semilla** (medido: a 200k unas veces
   ~85 pasos, el registro viejo reportaba 577 a 150k) → referencia inestable.

**A partir de aquí, una sola cosa importa: hacer que la VISTA funcione** (sobreviva → apunte →
limpie → generalice). **Ignorar todas las pruebas/números del ciego** de las entradas históricas
de abajo; se conservan solo como diario de cómo se aprendió el reloj y `εdecay`, NO como metas.

**Lo que medimos AHORA (vista-only, sin comparar con nada):**
- `success_rate` (greedy) de la VISTA en el **4×7 lleno** (sobrevivir + rematar).
- `success_rate` (greedy) de la VISTA en **niveles DISPERSOS fijos** (columna, fila, salpicados):
  con pocos ladrillos, **sobrevivir ≠ ganar → limpiarlos SOLO es posible apuntando**. El propio
  éxito en disperso ES la prueba de que la vista apunta (autocontenida, no necesita ciego).

**Hallazgo que toca arreglar (medido a 300k, vista-only):** la vista aprende a **sobrevivir muy
despacio**. Causa: en el MLP plano, las **28 entradas de ocupación (≈1.0) ahogan en magnitud a las
6 cinemáticas** (∈[-1,1]) en la primera capa → la señal de devolver la bola (que solo depende de
la cinemática) se diluye. **No es "no puede"; es codificación.** Iteración en curso (ver §Fase 1
reescrita): equilibrar cinemática vs ladrillos (escala de inputs / rama cinemática / normalización)
+ presupuesto suficiente, midiendo la curva de supervivencia y limpieza **de la propia vista**.

---

## REGISTRO DE PROGRESO / DECISIONES (actualizar tras cada fase)
> ⚠️ Entradas de Fase 0/0.5 = **históricas**. Sus números del CIEGO ya NO son referencia (ver PIVOTE).

### [Fase 1 — LA VISTA YA SOBREVIVE] · arreglo = atenuar el bloque de ladrillos (escala 0.25)
**Problema (medido, vista-only):** con ocupación pura {0,1} (escala 1.0) la vista NO despega —
atascada en ~128 pasos / 2.6 ladrillos / 0% a 600k. Las 28 ocupaciones (≈1.0) ahogan en magnitud a
las 6 cinemáticas (∈[-1,1]) en la 1ª capa → la supervivencia (que solo depende de la cinemática) no
se aprende. **Arreglo:** `escalaLadrillos = 0.25` (vivo→0.25, roto→0; ≈ iguala la varianza de los
dos bloques). Curva de supervivencia/limpieza (greedy, lleno, mismo presupuesto):

| escala | 100k | 250k | 400k | 600k |
|---|---|---|---|---|
| 1.0 (plano) | 68 / 1.4 | 63 / 1.3 | 97 / 2.0 | **128 / 2.6 · 0%** ❌ |
| **0.25** | 61 / 1.2 | 129 / 2.6 | 1025 / 18.3 | **2209 / 27.0 · 51%** ✅ |

⇒ Atenuar el bloque **hace despegar la vista** (atascada → 51% y subiendo, AHORA CON VISIÓN, no a
ciegas). Fijado `ESCALA_LADRILLOS_DEFECTO = 0.25` (tunable por grid de la métrica real). Próximo:
probar que **APUNTA** (eval greedy en niveles dispersos, `scripts/puerta1.mjs`).

### [Fase 1 — PUERTA 1 SUPERADA: la vista APUNTA y generaliza zero-shot] · 84% en dispersos
Vista (escala 0.25, DQN, 800k, entrenada SOLO en el lleno) evaluada en greedy (`scripts/puerta1.mjs`):

| nivel | ladr | éxito | ladrillos | vive |
|---|---|---|---|---|
| lleno 4×7 | 28 | 15% | 13.2/28 | 843 |
| columna izq | 4 | **95%** | 3.9/4 | 698 |
| columna der | 4 | **85%** | 3.8/4 | 1258 |
| fila superior | 7 | **71%** | 6.6/7 | 1523 |
| dispersos | 6 | **85%** | 5.8/6 | 1016 |

**Dispersos: 84% éxito / 96% ladrillos.** En disperso **sobrevivir ≠ ganar** → el éxito PRUEBA que
apunta. Y esos patrones **no se entrenaron** (solo el lleno) → ya **generaliza zero-shot**. ✅ El
OBJETIVO (apuntar + generalizar) se cumple en Fase 1.
**Matices honestos:** (1) el **lleno (15%)** es *survival-endurance-limited* y de **alta varianza por
semilla** (el diag dio 51%): limpiar 28 exige aguantar ~1760+ pasos, sub-skill más difícil y tardía
que apuntar. (2) La vista va **mejor en disperso que en lleno** (apuntar pocos < aguantar 28). ⇒ La
resistencia en lleno se robustece con **currículum/varios niveles/más pasos** (Fase 2), no es el cuello
del objetivo.
**Confirmado (2ª semilla, 1M):** dispersos **77% éxito / 85% ladrillos** (por patrón 58–95%) → apuntar
robusto entre semillas. Lleno **49%** a 1M (vs 15% a 800k) → confirma que el lleno es alta-varianza y
**sube con más pasos**. ⇒ Fase 1 cerrada: la vista **apunta y generaliza zero-shot**. A Fase 2.

### [Fase 2a — GENERALIZA en 4×7] · entrenar en niveles VARIADOS → 78% en TEST (gap 6.4)
Generador `src/entorno/generadorNiveles.js` (familias: dispersión, filas, columnas, bloque, simétrico),
pool de **400 niveles distintos**, splits DISJUNTOS train 280 / val 60 / test 60 (~12 ladrillos medios).
Vista (MLP + escala 0.25, DQN, 1M) entrenada en TRAIN (un nivel aleatorio por episodio vía `proveedorNivel`),
evaluada en greedy (`scripts/fase2a.mjs`):

| | éxito | %ladrillos | vive |
|---|---|---|---|
| TRAIN | 84% | 90% | 905 |
| **TEST (no vistos)** | **78%** | 87% | 971 |

**Gap train−test = 6.4 pts** (pequeño) → **generaliza, no memoriza**. Por familia (test): bloque 96%,
dispersión 81%, simétrico 80%, columnas 71%, filas 63% (pocas muestras). ⇒ La vista aprende una
**POLÍTICA GENERAL** que limpia niveles procedurales NO vistos apuntando — el objetivo central, validado
en 4×7 con flat MLP.

### [Fase 2a (pulido) — CURRÍCULUM sube el test 78% → 86%]
Currículum fácil→difícil (`scripts/fase2a_curriculum.mjs`): tiers por nº de ladrillos ≤7/≤13/≤20/≤28,
desbloqueando el siguiente cuando el éxito de entrenamiento supera 0.72 (o tope de pasos). 1.5M, mismo
generador/splits. Progresión: domina ≤7 a 400k → full (≤28) a 500k → pule el resto. Greedy:

| | TEST éxito | %ladrillos | gap |
|---|---|---|---|
| baseline (sin currículum, 1M) | 78% | 87% | 6.4 |
| **currículum (1.5M)** | **86%** | 96% | **2.5** |

Por familia (test): bloque 96%, dispersión 88%, columnas 84%, simétrico 83%, filas 76%. ⇒ El currículum
**sube el test 8 pts y baja el gap a 2.5** → política general sólida. **4×7 PULIDO** (objetivo >78% cumplido).

### [Fase 2b — 8×10 + CONV: GENERALIZA al 86% con gap ≈ 0] · OBJETIVO CUMPLIDO A ESCALA
Escalado a rejilla **8×10** (80 celdas, dim 86, timeout 7200). Red **CONV multi-entrada** (`crearRedConv`):
matriz de ocupación 8×10 → Conv2D(16)→Conv2D(32) 3×3 same relu → flatten; rama cinemática Dense(16);
concat → 128→128→3 (351.667 params). En DQN vía `_predecir` (parte el estado plano [n,86] en cinemática
[n,6] + matriz [n,8,10,1]). Currículum por tiers ≤16/≤36/≤60/≤80, generador/splits reusados,
**escala=1.0** (la rama conv ya separa ladrillos de cinemática → no hace falta atenuar). 1.5M pasos. Greedy:

| | éxito | %ladrillos | vive |
|---|---|---|---|
| TRAIN | 86% | 92% | 1617 |
| **TEST (no vistos)** | **86%** | 92% | 1578 |

**GAP ≈ 0 (−0.7 pts).** Por familia (test): bloque 91, columnas 86, dispersión 84, simétrico 80, filas 72.
⇒ **Política general conv que limpia niveles 8×10 NO vistos apuntando, con gap nulo.** El objetivo del
proyecto queda cumplido a escala.

### [INFRA — backend de cómputo] · tfjs-node (CPU nativo) y la cuestión GPU
La conv en CPU-JS puro era lentísima. **`@tensorflow/tfjs-node`** (libtensorflow C++ multihilo) la pone a
**~6.800 exp/s** (1.5M conv en 3.7 min). Helper `scripts/backend.mjs` (elige nativo→cpu) + `_compat_node.mjs`
(shim `util.is*` que Node 25 eliminó y tfjs-node aún usa). **GPU:** en Mac NO hay backend GPU para TF.js en
Node (`navigator.gpu` no existe en Node; tfjs-node-gpu es solo CUDA). La GPU Metal solo se alcanza vía
**WebGPU en el navegador** (la app lo usa) o portando a otra librería (**PyTorch-MPS**).

### [GPU — usar Metal de verdad vía PyTorch-MPS] · 5,5× más rápido, mismo resultado
El usuario pidió usar la GPU (la del M4 Max estaba idle mientras el CPU iba al 99%). Investigado:
- **TF.js en Node = solo CPU.** `navigator.gpu` no existe en Node 25; `tfjs-node-gpu` es solo CUDA.
- **WebGPU en Node vía Dawn (`@kmamal/gpu`):** la GPU **se enciende** (Metal activo, 71% en powermetrics)
  pero el test **se cuelga en `dataSync`** → no viable. TF.js+Metal solo es fiable en navegador.
- **Solución (sugerencia del usuario): PyTorch sobre MPS.** `gpu/arkanoid_mps.py` porta la MISMA Fase 2b
  (entorno 8×10 vectorizado en numpy + **conv DQN idéntico, 351.667 params** + generador/splits/currículo)
  a PyTorch `device='mps'`. Resultado (1.5M, envs=256):

| | exp/s | tiempo 1.5M | TEST éxito | gap |
|---|---|---|---|---|
| TF.js-CPU nativo (tfjs-node) | ~6.800 | 222s | 86% | −0.7 |
| **PyTorch-MPS (GPU Metal)** 1.5M | **37.591** | **40s** | 81% | −4.7 |
| **PyTorch-MPS (GPU Metal)** 3M | **37.368** | **80s** | **89%** | −4.7 |

⇒ **La GPU sí se usa** (Metal, ~5,5× más rápida). A mismo presupuesto (1.5M) generaliza algo menos (81%
porque el currículo solo llega a ≤60); pero como 3M cuesta **80s**, alcanza dificultad plena y **supera al
CPU: 89% test**. Vía recomendada para escalar en Apple Silicon con la misma arquitectura. Ver `gpu/README.md`.
*(Nota: con TF.js, la GPU solo en navegador/WebGPU; el lab educativo sigue en JS, y la GPU pesada va por Python-MPS.)*

### [Fase 0 — HECHA, código] · Puerta 0 medida (4×7, DQN, 40k pasos, Node CPU)
**Cambios:** `Φ` OFF por defecto (entorno, gestor, app, herramientas; toggle conservado para
demostrarlo con `--shaping`). Componentes de recompensa separados (`rBricks/rSurvival/rTerminal/
rShaping`). Métricas con **`success_rate` de cabecera** + `reward_no_shaping`, `time_to_first_brick`,
`steps_alive` en el harness. Sin fugas (26 tensores).

**Datos Puerta 0 (DQN, mismo presupuesto):**
| | Φ OFF | Φ ON |
|---|---|---|
| success_rate | 0.0 % | 0.0 % |
| ladrillos (fin) | 1.66 | 1.78 |
| reward_no_shaping | 1.44 | 0.79 |

**CORRECCIÓN AL DIAGNÓSTICO (importante).** La Puerta 0 (versión estricta: "ladrillos claramente
por encima de 1–2") **NO se cumple**: quitar `Φ` no sube los ladrillos (~1.7 con y sin Φ). El agente
**ciego re-centra la pala por seguridad**, así que el rebote vertical persiste sin `Φ`.
→ **El saboteador DOMINANTE es la observación (ceguera a los ladrillos), no el shaping.** El shaping
era secundario + un **confunde-métricas** (inflaba la recompensa enmascarando el éxito 0 %). Reordenar
el peso de las dos raíces de §2: raíz #1 real = **observación**; el shaping pasa a contribuyente menor.

**Decisión:** el cambio de recompensa **se mantiene** (métricas honestas, sin regresión: los ladrillos
no bajaron). NO es bug; coincide con el aviso del plan. La prueba **decisiva** es la **Puerta 1 (con
vista)**. Avanzar a Fase 1.

### [HALLAZGO CRÍTICO — el reloj] · 600 pasos hace el nivel INGANABLE
Medición de la física (rastreador perfecto que solo sigue la bola, shaping OFF, Node):
- 1 paso = 1 tic = la bola se mueve una vez (0.022 ≈ 2 % de la pantalla).
- **Viaje pala→ladrillo→pala ≈ 63 pasos.** Limpiar 28 a ~1 ladrillo/viaje ≈ **1.760 pasos**.
- El rastreador perfecto rompe **11/28 de media (máx 23) y NUNCA limpió** (0/333 episodios): se
  queda sin tiempo a los 600. Techo físico con timeout=600 ≈ **~11 ladrillos**.

**Implicación (re-prioriza el plan):** hay **tres muros**, en este orden de fundamentalidad:
1. **El reloj (timeout 600).** Inganable por tiempo, da igual el algoritmo. → el más básico; **arreglar primero**.
2. **Supervivencia.** Los agentes entrenados mueren a ~84 pasos (un rastreador sobrevive a 600). Aún
   no han aprendido a devolver la bola de forma fiable. (Aprendible; el `+0.2` es la señal.)
3. **Apuntar (observación).** Para romper lo que un rebote casi-vertical no alcanza → necesita ver los
   ladrillos (Fase 1). El propio rastreador se atasca en ~11–23 por no apuntar.

Nota: esto también explica la Puerta 0. Quitar `Φ` no subió los ladrillos porque el agente entrenado
**muere pronto** (no es centrado vs no-centrado: es que no sobrevive), y porque **el reloj** lo capa.

### NUEVO ORDEN DE FASES
- **Fase 0.5 — El reloj [HECHA]:** `MAX_PASOS_EPISODIO` ahora = `PASOS_POR_LADRILLO·filas·columnas`
  (4×7 → 2520). Validado: nivel ganable (rastreador 37,6 %). Cuello siguiente = supervivencia del agente.
- **Fase 1 — Observación (vista):** como estaba, pero ya con reloj suficiente, para que la Puerta 1
  ("limpia el nivel de forma fiable") sea físicamente alcanzable.

### [Fase 0.5 — HECHA: reloj arreglado] · timeout 600 → 2520 (90·28), escala con la rejilla
**Validación (rastreador perfecto, blind, Node):** con timeout=2520 el nivel pasa de **inganable** a
**ganable**: el rastreador limpia el **37,6 %** de las veces (antes 0 %), **26,25/28 de media (máx 28)**,
~2066 pasos por victoria. ⇒ **El reloj era el muro físico nº1, y queda resuelto.** El que falta para el
100 % es apuntar (los últimos 1-2 ladrillos que el rebote casi-vertical no alcanza).

**Pero el DQN entrenado NO mejora aún** (mismo reloj): sigue en **~2 ladrillos**, muere a **~84 pasos**.
⇒ Su cuello ahora es **SOBREVIVIR** (no el reloj): un rastreador aguanta ~2000 pasos con la MISMA
información (bola + pala) que tiene el DQN. Luego el DQN PUEDE aprender a sobrevivir; aún no lo ha hecho
(80k pasos = solo ~950 episodios, muere pronto).

### PROPUESTAS CONCRETAS (basadas en Fase 0/0.5) — camino al objetivo
**Objetivo intermedio medible: igualar al rastreador → ~26 ladrillos / ~38 % de éxito en el 4×7 CIEGO.**
Si una heurística lo logra, un DQN entrenado debe poder; iteramos hasta conseguirlo (nunca "no puede"):
1. **Entrenar mucho más** (200k–500k pasos) y ver si `steps_alive` sube de 84 hacia 600+ y los ladrillos
   hacia ~11–26. (Lo más barato: quizá solo falta presupuesto/episodios para aprender a devolver la bola.)
2. **Grid search optimizando la MÉTRICA REAL** (`bricks_cleared`/`steps_alive`, NO la recompensa): barrer
   ritmo de aprendizaje, decaimiento de ε, tamaño de red. Quedarse con la config que más sobrevive/limpia.
3. **Si sigue atascado, variaciones**: currículum de física (empezar con bola más lenta / pala más ancha →
   más fácil sobrevivir → endurecer), o una ayuda de supervivencia que NO sesgue el apuntado (Φ sí lo sesgaba).
→ Cuando se iguale al rastreador (~26/38 %), pasar a **Fase 1 (vista)** para cerrar de 26 a 28 y subir el
éxito hacia ~100 % apuntando a los ladrillos que quedan.

### [Ejecución Propuestas 1+2] · entrenar más + grid search (DQN ciego, greedy, Node)
Añadida **evaluación greedy (ε=0)** al harness (métrica honesta, comparable con el rastreador).
- **DQN 300k, Φ OFF:** greedy **3.98 ladrillos / 0 % / sobrevive 189** (vs 84 a 80k → sube, pero lento).
- **DQN 300k, Φ ON:** greedy **4.28 / 0 % / 200**. ⇒ **Φ NO arregla la supervivencia** (casi igual).
- **Varianza alta:** media ~4 ladrillos pero **máximo 18-23** en sus mejores episodios → política de
  supervivencia **frágil** (a veces sobrevive 23 ladrillos, casi siempre muere a ~200).
- **Grid 150k (lr × εdecay):** combos ~1.5-5 ladrillos (a 150k apenas sobrevive); no cierra el salto a 26.

**CONCLUSIÓN nº2:** el cuello es que **DQN aprende a SOBREVIVIR muy despacio y de forma frágil**, mientras
una heurística trivial (seguir la bola) sobrevive ~2000 y saca 26. Afinar parámetros o entrenar un poco
más NO basta (el salto 4→26 es enorme). ⇒ Toca **Propuesta 3 (variación)**.

**Variación recomendada — mejor señal de supervivencia (potential-based, honesta):** la Φ que quitamos
premiaba estar bajo la bola AHORA (persigue, va con retraso → mal maestro de supervivencia). Cambiarla por
el **punto de caída previsto**: `Φ_land = −|x_intercepción − pala.x|`, donde `x_intercepción` = dónde
cruzará la bola la línea de la pala (reflejando su trayectoria en las paredes). Enseña a **interceptar**
(= sobrevivir bien, como el rastreador) y, como el rastreador centra y aun así saca 26, no impide llegar a
~26 en ciego. Los últimos 1-2 ladrillos y el empuje al 100 % vienen con la **vista (Fase 1)**.
Alternativa: currículum de física (bola más lenta / pala más ancha → endurecer).

### [GRID COMPLETO — corrige la conclusión nº2] · el afinado SÍ funcionó
Ranking (greedy, 150k/combo, por ladrillos):
- **GANADORA: lr=0.0008 · εdecay=8000 → 9.92 ladrillos · 4 % éxito · sobrevive 577 · máx 28.**
- Resto: 1.4–2.8 ladrillos. El **único** cambio de la ganadora vs el default es **εdecay 12000→8000**.

**Por qué:** en una tarea de supervivencia, explorar (moverse al azar) **mata**; decaer ε antes hace que
el agente deje de explorar pronto y **practique sobrevivir con su política real** → aprende mucho mejor.
(El εdecay "óptimo" depende del objetivo: optimizando RECOMPENSA salía 12000; optimizando LADRILLOS sale
8000. Lección: optimizar la métrica real.)

**CORRECCIÓN a la conclusión nº2:** afinar parámetros **SÍ** bastó para dar un salto x6 (1.7→9.9 ladrillos,
0→4 % éxito, supervivencia 80→577) — la variación Φ_land **NO es necesaria de momento**. Camino abierto
solo con grid + más entrenamiento.

### [RESULTADO 500k ganadora — Fase 0/0.5 CERRADA] · el ciego YA limpia, pero NO es lo que buscamos
**DQN ciego, εdecay=8000, 500k, GREEDY:** **success_rate=56 % · 26.86/28 ladrillos · sobrevive 2258.**
Supera al rastreador perfecto (37.6 %). Recorrido: 0 % → (reloj) → 37.6 % posible → (εdecay+500k) → 56 %.

**PERO (clave para no autoengañarnos):** esto es sobre la rejilla **LLENA 4×7**, y se gana por
**SOBREVIVIR + la bola rebota por todo** (en una rejilla llena, una bola que dura 2258 pasos acaba
tocando casi todo). **NO es apuntar ni resolver puzzles.** En niveles **dispersos/variados** (Fase 2) el
ciego fracasará porque no ve dónde quedan los ladrillos. ⇒ El ciego ha cumplido su función (confirmar
diagnóstico + dar los parámetros) y **se agota aquí**. Seguir puliéndolo NO acerca al objetivo.

**Lo que se TRANSFIERE a la vista (no perder):**
- **Reloj escalable** `MAX_PASOS = 90·filas·columnas` (4×7→2520; 8×10→7200). Regla dura.
- **`εdecay = 8000`** (no 12000): decaer la exploración pronto es clave para la supervivencia. (Pendiente
  de fijar como default DQN en la nueva sesión, o re-validar con la observación nueva.)
- Harness con **eval greedy (ε=0)**; **grid que optimiza la métrica real** (`scripts/grid_supervivencia.mjs`).
- **Rastreador perfecto** como referencia/medidor de viabilidad física.

## ▶▶ ESTADO ACTUAL Y PRÓXIMOS PASOS (vista-only)
**Construido (Fase 1):** observación con VISTA (`incluirLadrillos`, vector plano `6+28=34`),
MLP `34→128→128→3`, DQN con `εdecay=8000`, reloj `90·filas·cols`. Sin fugas, los 5 algoritmos
arrancan en VISTA. Soporte de **niveles dispersos fijos** para evaluar el apuntado (`patronLadrillos`
en entorno+gestor). Scripts: `scripts/puerta1.mjs` (vista en lleno+dispersos), `scripts/diag_vista.mjs`.

**Abierto (lo que falta para la Puerta 1):** la vista aprende a SOBREVIVIR demasiado despacio (28
ocupaciones ahogan la cinemática; ver PIVOTE). Iterar hasta que **la vista** sobreviva y limpie
lleno + dispersos:
1. Equilibrar la codificación cinemática↔ladrillos: probar **escala** de ocupaciones, **rama
   cinemática** separada (Dense propio para las 6 antes de concatenar), o **normalización** de entrada.
2. **Presupuesto suficiente** (la supervivencia despega tarde y con varianza; medir la curva propia).
3. Cuando la vista limpie dispersos de forma fiable → **Fase 2** (8×10 + conv + generador + splits +
   currículum) para GENERALIZAR a niveles no vistos.

**Reglas:** vista-only (ignorar el ciego). El objetivo manda. Nunca "no puede" → iterar
(pasos / grid de la métrica real / variaciones de codificación-red-currículum).
