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

### Fase 1 — Observación estructurada plana (4×7, MLP)
1. Estado de ladrillos como **vector plano** concatenado: `6 + 28 = 34` entradas.
2. MLP `34 → 128 → 128 → 3`, reutilizando DQN (Double DQN + Huber + soft update).
- **Puerta 1→2:** agente **con vista** sobre 4×7 fijo alcanza **`success_rate` alto**
  (limpia el nivel de forma fiable). Demuestra que la observación arregla el techo.

### Fase 2 — Objetivo: 8×10 + conv + generador + splits + currículum
1. Rejilla **8×10** (80 celdas). 2. Observación **matriz 2D + conv** (§5.3). 3. **Generador**
   con pregeneración, splits disjuntos y verificación de limpiabilidad (§5.4, §5.6).
   4. **Currículum** (§5.5). 5. **Timeout** escalado con nº de ladrillos (§5.8).
- **Puerta 2 (final):** `success_rate` alto en **train Y test** con **gap pequeño**, y el
  **heatmap de roturas** muestra ataque deliberado a zonas con ladrillos vivos.

### Fase 3 — (opcional) Comparativa y baseline ciega
- Reactivar los 5 algoritmos sobre el mismo encoder conv. Conservar la **versión ciega (6
  vars)** como baseline pedagógica (contraste ciego/con-vista/con-niveles).
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
- Mantener detección de fugas tras añadir conv. Conservar baseline ciega (6 vars).
- Reutilizar el grid search para ajustar **recompensa** y **generador/currículum**, no solo HP.
- *Cambiar la observación es invasivo* (DIM_ESTADO, obtenerVectorEstado, buffer del gestor,
  entradas de los 5 agentes, replay buffer, inspectores) — preverlo en Fases 1–2.

---

## REGISTRO DE PROGRESO / DECISIONES (actualizar tras cada fase)

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
- **Fase 0.5 — El reloj (NUEVA, antes de Fase 1):** subir `MAX_PASOS_EPISODIO` para que el nivel sea
  **físicamente limpiable con margen** (28 → ~2.500). Re-medir Puerta 0 con el reloj arreglado: ¿sube
  ahora `bricks_cleared`? (un superviviente debería romper más). Mantener el timeout escalado por nivel.
- **Fase 1 — Observación (vista):** como estaba, pero ya con reloj suficiente, para que la Puerta 1
  ("limpia el nivel de forma fiable") sea físicamente alcanzable.

*(Próximo: implementar Fase 0.5 —timeout— y re-medir, antes de la vista.)*
