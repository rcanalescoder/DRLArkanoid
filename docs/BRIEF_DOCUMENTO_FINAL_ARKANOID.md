# Brief de producción del documento final — Arkanoid DRL Learning Lab (PDF)
### Instrucciones para Claude Code: de los datos a un PDF orientado a resultados y pedagógico

> Complementa a `PROTOCOLO_EJECUCION_HONESTA_ARKANOID.md`, que define **cómo medir** (métricas, semillas, splits, ledger). Este documento define **qué reportar** (variables → figuras y tablas orientadas a resultado) y **cómo reescribir el PDF** para que cuente lo que se ha **conseguido**, no lo que se ha **hecho**, y para que un ingeniero junior pueda leerlo sin quedar avasallado por los conceptos.

---

## 0. Punto de partida: qué falla en el PDF actual

El PDF existente documenta la **versión vieja** del proyecto: estado ciego de 6 variables, un único nivel fijo 4×7 (28 ladrillos), reward shaping `Φ` activo, recompensa media como métrica reina, y tasa de éxito 0 % (rompe ~2/28). Tiene tres problemas que hay que corregir, no maquillar:

1. **Tesis falsa.** Su conclusión honesta —"el cuello de botella no es el algoritmo, sino el tiempo de entrenamiento"— es **incorrecta** a la luz de los resultados nuevos. El cuello de botella era la **formulación**: la observación (ciego a los ladrillos) y la recompensa (`Φ` arreaba al agente a un rebote casi vertical). Además, el PDF presenta `Φ` como algo bueno ("sin cambiar la política óptima, acelera el aprendizaje"); en la práctica era el saboteador. La reescritura debe **dar la vuelta a la tesis**, no pegar números nuevos sobre la narrativa vieja.
2. **Orientado a proceso, no a logro.** Está organizado como un tour de técnicas (un capítulo por algoritmo = "lo que hicimos") y muestra curvas de recompensa de entrenamiento, no éxito en niveles no vistos (lo que se consiguió).
3. **Avasalla.** Introduce mucho vocabulario antes de que el lector sepa por qué importa, y no enmarca primero el problema.

**Objetivo:** reconstruir el PDF entero sobre los datos nuevos, orientado a resultado, con pedagogía progresiva, **conservando la calidad de diseño y el tono divulgativo** del actual (que es bueno).

---

## 1. Regla rectora

Cada sección responde primero **"qué conseguimos y qué significa"** y solo después, como apoyo, **"cómo funciona"**. La métrica de cabecera de todo el documento es el **éxito en niveles de TEST no vistos**, nunca la recompensa de entrenamiento.

---

## 2. Parte A — Variables y artefactos de reporte (orientados a resultado)

Las **definiciones** de métricas están en `PROTOCOLO_EJECUCION_HONESTA_ARKANOID.md` §6; no se reescriben aquí. Esta parte define los **artefactos de reporte** que el documento necesita. Todos se generan desde `results/ledger.csv`; **ninguna cifra del documento puede no estar en el ledger** (ver §4).

Figuras y tablas a producir:

- **F1 — La conquista (figura de cabecera).** Antes/después: baseline ciega (éxito 0 %, ~2/28) frente a agente con visión (limpia niveles). Es el "qué conseguimos" en una imagen.
- **F2 — Curvas de aprendizaje.** `success_rate` (en test) vs pasos, los cinco modelos superpuestos, con **banda multi-semilla** (no una línea por el mejor run). Convergencia y asíntota se ven por separado.
- **F3 — Mapas de calor de ladrillos rotos.** Ciego vs con visión. Prueba **visual** de que el agente aprendió a **apuntar** (concentra impactos en zonas con ladrillos) en lugar de rebotar al azar.
- **T1 — Comparativa final.** Una fila por modelo y por **variante honesta** (incl. `SAC-pure` y `SAC-critic-hybrid` separados). Columnas: éxito en test, éxito por **dificultad** (tramos de ladrillos), éxito por **familia** de nivel, **gap train-test**, `collapse_rate`, `steps_to_clear`. Marcar la mejor de cada columna.
- **T2 — Ablación.** Qué ingrediente desbloqueó el aprendizaje (sin currículo / sin conv / sin escala / sin shaping / εdecay lento vs rápido / timeout fijo vs proporcional), ordenado por impacto.
- **F4 (opcional) — Éxito por dificultad.** Curva o barras de `success_rate` por tramo de ladrillos, para mostrar que no solo gana niveles fáciles.

Reglas de honestidad de los artefactos: distribuciones, no el mejor run; variantes de SAC separadas; World Model caracterizado como "Dyna-Q con modelo cinemático auxiliar", no "simulador completo"; cada figura/tabla trazable a una fila del ledger.

---

## 3. Parte B — Reescritura del documento

### 3.1 La tesis corregida (lo que el documento debe defender)

- **Vieja (falsa):** el cuello de botella es el tiempo de entrenamiento; el algoritmo y la formulación están bien; `Φ` ayuda.
- **Nueva (verdadera):** el cuello de botella nunca fue "entrenar más", sino la **formulación de la tarea**, en tres capas que conviene separar: **(1) el reloj** —el timeout por episodio (600 pasos) hacía ganar literalmente imposible, porque limpiar 28 ladrillos exige ~1.760 pasos; se arregló con un timeout proporcional al número de ladrillos—; **(2) la recompensa** —el shaping `Φ` (acercar la pala a la bola) arreaba al agente a un rebote casi vertical y a una estrategia degenerada (limpiar como mucho una columna)—; y **(3) la observación** —ciego a los ladrillos, no podía apuntar ni generalizar; este es el techo real—. Arreglar las tres (timeout proporcional + recompensa corregida + visión por matriz de ocupación, con encoder conv + currículo + niveles procedurales) es lo que desbloqueó el problema; **PPO entonces funcionó a la primera**. La lección: en Deep RL, la formulación —reloj, recompensa, observación, currículo, evaluación— importa tanto o más que el algoritmo.
- Explícito: **eliminar** la tesis "el cuello de botella es el tiempo de entrenamiento" —era un plazo mal puesto (el reloj), no falta de entrenamiento—. **No** presentar `Φ` como bueno; explicar que distorsionaba la política. Y ser honesto con el matiz: incluso tras arreglar el reloj y la exploración, el ciego solo "ganaba" por **supervivencia degenerada** (≈56 % en rejilla llena —una bola que dura ~2.258 pasos acaba tocando casi todo por rebote— pero 0 % en niveles dispersos); eso fue lo que motivó darle vista. La versión ciega de 6 variables deja de ser "el proyecto" y pasa a ser la **línea base** deliberada que da sentido al contraste.

### 3.2 El arco narrativo (estructura nueva)

Reorganizar de "un capítulo por algoritmo" a un arco de **viaje y resultado**:

1. **El problema (primero, claro).** Queremos que el agente aprenda a **pasar niveles** (no a sobrevivir), en niveles **nunca vistos**. Qué significa resolverlo y cómo se mide (éxito en test). Aquí no hay todavía jerga: solo el objetivo y por qué es difícil.
2. **El primer intento — el agente ciego.** Solo bola + pala. Sobrevive pero no limpia (0 %, ~2/28). Plantea el misterio: ¿por qué?
3. **El diagnóstico (tres muros, ninguno del algoritmo).** No era el algoritmo ni "entrenar más". Eran tres cosas separadas: **el reloj** (el timeout hacía ganar imposible: 28 ladrillos piden ~1.760 pasos y el límite era 600), **la recompensa** (`Φ` arreaba a sobrevivir, no a apuntar) y **la observación** (ciego a los ladrillos: el techo real). Aquí se introducen, anclados a cada muro, los conceptos de límite de episodio, reward shaping y observación/observabilidad parcial —uno por causa, sin amontonarlos—.
4. **El arreglo.** Timeout proporcional a los ladrillos (que ganar sea posible) + recompensa corregida + visión (matriz de ocupación) con encoder conv + currículo + niveles procedurales. Aquí se introducen, justo cuando hacen falta, la convolución, el currículo y la separación train/test.
5. **El resultado (lo conseguido).** Ahora los agentes limpian niveles no vistos. Las métricas de logro (F1, F2, F3, T1, F4). **Honesto:** distribuciones multi-semilla, la fragilidad de SAC, el hallazgo negativo del model-based.
6. **Los algoritmos (reparto secundario).** Breve, cada uno con su carácter y cómo le fue, **al servicio de la comparativa** —no el plato principal—. Se conservan las explicaciones pedagógicas por algoritmo, pero recortadas y subordinadas al resultado.
7. **Las lecciones.** Formulación > algoritmo; la trampa de la métrica (recompensa ≠ éxito); el model-based no siempre ayuda y por qué; SAC frágil y qué significa; cómo medir con honestidad (greedy, multi-semilla, splits).

### 3.3 Andamiaje pedagógico (que no avasalle)

- **El problema antes que el vocabulario.** Ningún término técnico aparece antes de enmarcar el problema. El gran bloque de "Fundamentos" del PDF actual se **distribuye** a lo largo del viaje, cada concepto donde se necesita.
- **Just-in-time, uno a uno.** Un concepto nuevo por vez, cada uno con un gancho concreto al paso actual. Un junior debe poder leer en línea recta sin toparse con un término para el que no se le ha preparado.
- **Conserva el tono.** Analogías, cajas "para curiosos", lenguaje cálido y divulgativo —pero cada elemento anclado a una necesidad, no de adorno—.
- **Complejidad progresiva.** De lo básico a lo avanzado, no todo de golpe. Glosario al final, solo como referencia.
- **Honestidad sobre qué ve el agente ahora.** Antes: bola + pala (6 números). Ahora: bola + pala + **matriz de ladrillos**. Seguimos **sin** darle píxeles y **sin** explicarle las reglas. Enmarcar la conv como un **encoder ligero sobre una matriz estructurada de ocupación**, NO como percepción visual desde píxeles (evitar la confusión con el caso Atari clásico).

### 3.4 Colocación de figuras y tablas

F1 y F3 en §5 (y F3 también en §2/§3 para el contraste ciego vs con visión); F2 y T1 en §5/§6; F4 en §5; T2 en §5 o en un apéndice de método. Cada una introducida con una frase de "qué conseguimos / qué significa", no de "qué hicimos".

---

## 4. Qué NO hacer (atajos / chapuzas)

- No conservar la tesis vieja ("el cuello de botella es el tiempo"); los datos la refutan.
- No presentar `Φ` (acercar pala a bola) como bueno; fue el saboteador.
- No pegar los números nuevos sobre la narrativa vieja; reestructurar según §3.2.
- No introducir un concepto antes de que el lector lo necesite (§3.3).
- No presentar curvas de recompensa de **entrenamiento** como el logro; el logro es éxito en niveles **no vistos**.
- No reportar el mejor run; distribuciones honestas multi-semilla.
- No vender SAC como "resuelto" ni el World Model al 65 % como "resuelto" sin la caracterización honesta.
- No inventar ni estimar cifras en figuras/tablas; todo desde `results/ledger.csv`.
- No perder la calidad de diseño ni el tono divulgativo del PDF actual.

---

## 5. Entregable

Un PDF nuevo, construido desde los artefactos del ledger, **estructurado** según §3.2, **orientado a resultado** según §1, con **andamiaje pedagógico** según §3.3 y la **tesis corregida** según §3.1, conservando la calidad de diseño. Más las figuras y tablas de la Parte A como activos independientes (para el repo y para reutilizar).

La frase que el documento debe poder defender al cerrar no es "construimos cinco algoritmos", sino: **"el problema no era el algoritmo ni el tiempo; era cómo planteábamos la tarea. Al arreglar la observación, la recompensa, el currículo y la evaluación, varios algoritmos aprendieron a pasar niveles no vistos —y aquí está cada artefacto que lo demuestra."**
