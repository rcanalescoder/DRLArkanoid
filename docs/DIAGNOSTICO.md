# Arkanoid DRL Learning Lab — diagnóstico para replantear

> **Propósito de este documento.** Es un *brief* autocontenido para que otra guía
> (sin contexto previo) nos ayude a definir un plan. Resume qué tenemos, qué hemos
> hecho, los datos reales que manejamos y el problema de fondo. **Conclusión
> anticipada:** la maquinaria de RL está bien construida, pero el **diseño de la
> observación** y el **entorno de un solo nivel** hacen que lo actual sea **inválido
> para el objetivo** (un agente que aprenda a *jugar* y resolver el juego).

---

## 1. Qué tenemos
Un laboratorio educativo **en el navegador** donde varios algoritmos de Deep RL
aprenden a jugar a un **Arkanoid simplificado**, con entrenamiento **real** (no simulado).

- **Stack:** Vite + JavaScript vanilla (ES modules) + **TensorFlow.js** con detección
  de backend **WebGPU → WebGL → CPU**. Entrena en el navegador; existe además un harness
  en **Node (backend CPU)** para verificar convergencia. Máquina de referencia: Mac M4 Max
  (Apple Silicon).
- **Entorno (Arkanoid):**
  - Física de **paso fijo**: `paso(accion)` avanza exactamente un instante de simulación.
  - **3 acciones** discretas: izquierda / mantener / derecha. **Solo mueve la pala.**
  - **Un único nivel**: 28 ladrillos en rejilla **4×7, idéntica en cada episodio**.
  - La bola se lanza con **dirección aleatoria** (es la única variación entre episodios).
  - El **ángulo de rebote depende del punto de impacto en la pala** (`FACTOR_REBOTE = 0.9`),
    por lo que **apuntar es físicamente posible**.
  - El episodio termina por: **perder la bola**, **limpiar el nivel** o **timeout a 600 pasos**.
- **Arquitectura:** un pool *headless* (256 entornos, generan los datos de entrenamiento)
  desacoplado de un pool *visual* (8 entornos, solo se dibujan); registro de algoritmos
  (factoría); inspectores por algoritmo; gestor de tensores con detección de fugas.

## 2. Qué hemos hecho
- Implementados y verificados **5 algoritmos** (aprenden de verdad, sin fugas de memoria,
  en Node CPU y en navegador WebGPU):
  1. **DQN** — Double DQN + pérdida Huber + *soft update* de la red objetivo. MLP 6→128→128→3.
  2. **PPO** — actor-crítico, ventajas con GAE, objetivo recortado. On-policy.
  3. **SAC discreto** — dos críticos Q, política estocástica, temperatura α automática (máxima entropía). Off-policy.
  4. **World Model (Dyna-Q)** — un MLP de dinámica `(s,a) → (Δs, r, done)` que genera
     experiencia **imaginada** con la que entrena un Q-net.
  5. **World Model RNN (Dyna-Q + LSTM)** — el modelo de dinámica es un **LSTM** entrenado
     con **secuencias** (mantiene estado oculto/memoria).
- **Pestaña "Comparativa"**: entrena los 5 con el mismo presupuesto y los evalúa en modo
  **greedy** (sin exploración) sobre partidas nuevas, con un dashboard de curvas y métricas.
- **Grid search** en vivo + **afinado de hiperparámetros validado con datos**
  (p. ej. PPO coef. de entropía 0.01→0.003: **+144 %**; DQN decaimiento de ε 25k→12k: **+37 %**;
  World Model ε 20k→12k: +19 %; World Model RNN prefiere ε lento; SAC insensible a la entropía objetivo).
- Un **cuaderno PDF divulgativo (72 págs)** + **README** visual + **LICENSE**.

## 3. Los datos que manejamos (reales, medidos)
- **Estado / observación (EL DATO CLAVE):** vector de **6 variables**, todas cinemáticas:
  ```
  [ bola.x , bola.y , bola.vx , bola.vy , pala.x , (bola.x − pala.x) ]   (normalizadas)
  ```
  **No contiene ninguna información de los ladrillos** (ni cuáles quedan, ni dónde están).
- **Recompensas:** paso `0.0` · devolver con la pala `+0.2` · **romper ladrillo `+1.0`** ·
  bonus de combo `+0.5·(n−1)` · **perder la bola `−1.0`** · **completar el nivel `+5.0`** ·
  más *reward shaping* potencial `Φ(s) = −|bola.x − pala.x|` (coef. `0.30`), que premia
  mantener la pala bajo la bola.
- **Resultados de entrenamiento** (recompensa media de los últimos 100 episodios, valores
  aproximados de corridas reales): DQN `~0 → 1.5` (40k pasos); PPO afinado `~0.1 → 4.6`
  (pico 5.3); SAC `~0 → 1.6`; World Model `~0.9–1.05`; World Model RNN `~1.33` (30k pasos).
  Throughput ~24.000 exp/s en WebGPU. Recuento de tensores constante (sin fugas).
- **La métrica que de verdad importa — tasa de éxito (limpiar el nivel): `0,0 %` en TODOS
  los algoritmos y TODOS los presupuestos probados.** Ladrillos rotos: **~1–2 de 28** de media.
- ⚠️ **Trampa de la métrica:** esa recompensa "alta" (p. ej. PPO 4.6) procede casi toda del
  *shaping* + devolver la bola muchas veces + algún ladrillo suelto, **no** de completar
  niveles. La recompensa sube mientras el objetivo real (ganar) sigue en **0 %**.

## 4. El problema identificado (por el autor)
1. **No resuelve el nivel** (éxito 0 %, ~2/28 ladrillos). Lo que aprende es un **reflejo de
   mantener la bola viva**, no a *jugar* para ganar.
2. **Solo hay un nivel** → imposible distinguir si **memoriza** ese nivel concreto o **aprende
   a jugar** en general (no se puede estudiar la generalización).
3. **El agente solo ve 6 variables cinemáticas, no la pantalla.** En el DRL "de verdad"
   (Atari/Breakout de DeepMind) el agente lee **los píxeles** y por tanto **ve los ladrillos**.
   Nuestro atajo a 6 números **omite los ladrillos**.

## Síntesis honesta (la raíz)
Los tres puntos son **el mismo fallo**: **la observación**. Al no incluir información de los
ladrillos, el agente es **ciego a ellos**: no sabe cuáles quedan ni dónde están, así que
**rompe ladrillos por rebote accidental, nunca apuntando**. Con estas 6 variables **no
despejaría el nivel ni con entrenamiento infinito** (no es falta de pasos, es falta de
información). Y como no percibe el nivel —y además solo hay uno—, la pregunta
**memorización vs generalización ni siquiera puede formularse**.

**Por tanto:** la *maquinaria de RL* (los 5 algoritmos, el pipeline, el afinado, la
comparativa, la verificación sin fugas) está **bien construida y es reutilizable**; lo
**inválido para el objetivo** es el **diseño de la observación (6 variables, sin ladrillos)**
y el **entorno de un solo nivel fijo**.

## Direcciones a evaluar en el plan
- **A — añadir la rejilla de ladrillos al estado** (6 → 6 + 28 booleanos vivo/muerto, o
  representación equivalente): el agente *ve* los ladrillos, puede apuntar y despejar; sigue
  siendo un MLP (coste bajo). Es el punto medio honesto ("leemos el estado interno COMPLETO").
- **B — píxeles + CNN** (estilo Atari, lo "auténtico"): ve toda la pantalla; coste alto y
  reescritura grande (estado, red, rendimiento) en TF.js/navegador.
- **C — múltiples niveles / aleatorios** (requiere A o B para tener sentido): permite medir
  **memorización vs generalización** (entrenar en unos niveles, evaluar en otros no vistos).
- Conservar la versión de **6 variables como "línea base ciega"** para el contraste
  pedagógico *ciego vs con vista* (responde directamente a la duda de los píxeles).
- **Aviso realista:** aun con percepción de ladrillos, Arkanoid es **difícil** para RL
  (apuntar mediante el punto de impacto en la pala + asignación de crédito a largo plazo);
  romperá muchos más y a veces completará niveles, pero el dominio pleno exige bastante
  más entrenamiento/cómputo del que cabe en una demo de navegador.

## Restricciones y contexto para que el plan sea realista
- **Debe seguir corriendo en el navegador** (TF.js, WebGPU/WebGL/CPU). Es un laboratorio
  *didáctico* que la gente abre y entrena en vivo; no un cluster.
- **Presupuesto de cómputo modesto:** cientos de entornos en paralelo, decenas de miles de
  pasos en una sesión razonable. Lo que tarde minutos, no horas.
- **Vocación pedagógica:** prioriza que se *entienda* (estado interpretable, inspectores,
  curvas) por encima del rendimiento absoluto. El valor está en *ver* aprender, no solo en ganar.
- **Comparabilidad:** sea cual sea la observación elegida, conviene poder enfrentar
  variantes (p. ej. "ciego" vs "con ladrillos") con el mismo presupuesto, como ya hace la
  pestaña Comparativa.
- **Reutilizable:** los 5 algoritmos y el pipeline ya funcionan; idealmente el cambio de
  observación/entorno no obliga a reescribirlos (el grueso del trabajo debería ser entorno +
  representación del estado + posible CNN, no los algoritmos).
