# Plan de refuerzo visual desde Parte II en adelante

Base revisada: `docs/report_v3_version_codex.html`

Punto de corte indicado por el usuario: `PARTE II · FUNDAMENTOS DE RL Y DEEP RL · 2.1`.

## Diagnóstico

La versión actual no está vacía visualmente: desde `2.1` hasta el cierre hay 41 visuales Codex nuevos, además de capturas, curvas y gráficas reales. El problema es más fino: a partir de Parte II muchos visuales son fichas sintéticas o tarjetas de concepto. Funcionan como recordatorio, pero no siempre enseñan el mecanismo interno.

Antes de `2.1`, la guía tiene más sensación de historia visual: escenas, diagnóstico, antes/después, receta, causa y evidencia. Desde `2.1`, en cambio, la documentación entra en teoría de RL, redes neuronales y algoritmos; justo ahí harían falta más diagramas estructurales, secuenciales y anatómicos.

La mejora recomendada es una segunda pasada visual centrada en:

- Redes neuronales y tensores.
- Flujos de entrenamiento.
- Buffers, targets y gradientes.
- Actor-crítico, políticas y distribuciones.
- Modelos del mundo y memoria.
- Lectura guiada de gráficas y evidencia.

## Regla de estilo

Mantener el estilo ya aprobado:

- Fondo blanco en infografías.
- Paleta funcional estable.
- Tarjetas con borde suave y radio discreto.
- Sin feria de colores: cada color debe tener significado.
- No depender solo de SVG si una captura anotada, raster compuesto o gráfica replotteada enseña mejor.
- Todo texto dentro de cajas debe ir con líneas cortas, ancho suficiente y QA visual.
- Cada figura debe responder a una pregunta pedagógica concreta.

## Infografía de cierre por sección

Nueva regla: cada sección/capítulo desde `2.1` hasta el final debe cerrar con una infografía blanca de síntesis, en la línea del ejemplo de métricas aportado por el usuario.

No debe ser una ficha mínima ni una colección de tarjetas sueltas. Debe ser una pieza editorial completa, con jerarquía clara.

Importante: esta regla no significa repetir siempre el mismo diseño. El cierre debe ser coherente en estilo, pero variado en composición. La audiencia debe reconocer el libro como un sistema, no sentir que está viendo la misma lámina una y otra vez con el texto cambiado.

La coherencia viene de:

- Fondo blanco.
- Tipografía común.
- Paleta funcional.
- Iconos limpios.
- Bordes y espaciados estables.
- Lenguaje visual compartido para variables, redes, datos y evidencia.

La variedad viene de:

- Cambiar el arquetipo visual según el concepto.
- Alternar composiciones horizontales, radiales, matriciales, secuenciales y de radiografía.
- Usar capturas anotadas cuando el sistema real sea lo importante.
- Usar gráficos replotteados cuando la evidencia sea lo importante.
- Usar diagramas de arquitectura cuando el mecanismo interno sea lo importante.
- Usar storyboards cuando el aprendizaje sea una secuencia.

## Biblioteca de arquetipos visuales

Cada visual debe elegir el arquetipo que mejor enseñe la idea. No repetir más de dos cierres consecutivos con la misma estructura.

| Arquetipo | Cuándo usarlo | Ejemplos en este libro |
|---|---|---|
| Mapa de sistema | Cuando hay piezas y relaciones. | Bucle agente-entorno, familias de algoritmos, protocolo experimental. |
| Radiografía o anatomía | Cuando hay que abrir una caja negra. | Red neuronal, PPO actor-crítico, SAC con cinco redes, World Model. |
| Flujo secuencial | Cuando hay pasos temporales. | Transición, replay, rollout PPO, generación de ledger. |
| Storyboard | Cuando importa la historia de una decisión. | Episodio, exploración, pérdida de bola, imaginación del World Model. |
| Antes/después | Cuando se quiere mostrar desbloqueo o mejora. | Estado ciego vs estado 86, formulación mala vs buena, ablación. |
| Matriz comparativa | Cuando hay familias, variantes o tradeoffs. | DQN/PPO/SAC/WM/WM-RNN, pure vs hybrid, on-policy/off-policy. |
| Dashboard anotado | Cuando la interfaz real enseña el mecanismo. | App, inspectores, curvas en vivo, panel de algoritmo. |
| Gráfica explicada | Cuando hay datos y lectura estadística. | Veredicto, eficiencia, convergencia, dificultad, semillas. |
| Microscopio de fórmula | Cuando una ecuación debe volverse legible. | Retorno, Bellman, TD-error, clip PPO, temperatura SAC. |
| Ruta reproducible | Cuando importa trazabilidad. | Generador -> splits -> entrenamiento -> evaluación -> ledger -> figura. |
| Diagnóstico clínico | Cuando hay síntomas, causas y arreglos. | Tres muros, colapsos, reward hacking, señales de salud. |
| Postal de cierre | Cuando se quiere una síntesis memorable. | Final de parte, lecciones transferibles, glosario visual. |

Regla práctica: una sección puede tener una infografía de cierre tipo panel, pero su composición debe salir de uno de estos arquetipos. Por ejemplo, `World Model` no debería cerrarse con cuatro tarjetas genéricas, sino con una radiografía de dos carriles: experiencia real, modelo aprendido, imaginación y sesgo acumulado.

## Anatomía flexible del cierre

La infografía de cierre puede usar estas piezas, pero no tiene que usarlas siempre en el mismo orden:

1. **Título grande e interpretativo**  
   Debe decir qué se lleva el lector, no solo repetir el nombre técnico del capítulo.

2. **Subtítulo de contexto**  
   Una frase que conecte la sección con el proyecto Arkanoid DRL.

3. **Bloques principales superiores**  
   Dos paneles grandes para la idea central y el mecanismo principal.

4. **Fila de tarjetas pedagógicas**  
   Tres o cuatro tarjetas con conceptos, variables, errores comunes o pasos del método.

5. **Mini-flujo o mini-ejemplo**  
   Algo que obligue a la infografía a explicar, no solo enumerar: fórmula leída, transición, red, buffer, política, curva o protocolo.

6. **Franja inferior de conclusión**  
   Una síntesis fuerte: "si recuerdas una cosa, recuerda esto".

7. **Iconografía consistente**  
   Iconos grandes, limpios y funcionales: objetivo, escoba/limpieza, balanza, red, buffer, lupa, termómetro, tablero, gráfico, checklist, etc.

Reglas visuales específicas:

- Fondo blanco o blanco ligeramente cálido.
- Bordes finos coloreados por función.
- No usar bloques oscuros como fondo principal.
- Usar color para significado, no para decorar.
- Los textos deben ser cortos y con salto de línea controlado.
- La conclusión final debe poder leerse de un vistazo.
- La infografía debe funcionar sola si se recorta fuera del libro.
- La composición debe aportar variedad respecto a las dos secciones anteriores.

Dimensión recomendada:

- Horizontal 16:9 o similar para HTML/PDF.
- Ancho suficiente para 2 filas de contenido y franja final.
- Si hay demasiado texto, dividir en dos infografías: mecanismo y cierre.

## Aplicación retroactiva

Aunque este plan nace desde `2.1`, la regla de variedad aplica también hacia atrás. Las Partes 0 y I ya tienen más riqueza narrativa, pero en la segunda pasada se deben revisar para evitar que los cierres se vuelvan una secuencia monótona de tarjetas.

Checklist retroactivo:

- Si dos secciones seguidas cierran con el mismo tipo de panel, cambiar una.
- Si una figura solo enumera, añadir relación: flechas, eje, matriz, mini-ejemplo o comparación.
- Si una sección habla de causa, usar diagnóstico, puente, receta o antes/después.
- Si una sección habla de red o algoritmo, usar anatomía o radiografía.
- Si una sección habla de evidencia, usar gráfica explicada o dashboard anotado.

## Objetivo de la segunda pasada

No sustituir todo lo existente. Añadir o reemplazar selectivamente las figuras que hoy resumen demasiado y no muestran suficiente mecanismo.

Meta orientativa:

- Parte II: añadir o rehacer 18-22 visuales, incluyendo 8 infografías de cierre.
- Parte III: añadir o rehacer 18-22 visuales, incluyendo 6 infografías de cierre.
- Parte IV: añadir o rehacer 10-14 visuales, incluyendo 4 infografías de cierre.
- Parte V: añadir 2-4 visuales, incluyendo 1 infografía de cierre.

Total recomendado: 48-62 intervenciones visuales, priorizando calidad sobre cantidad.

## Componentes visuales transversales

Crear una librería visual común para usar desde `2.1` hasta el final:

| Componente | Uso |
|---|---|
| Badge de variable | `s`, `a`, `r`, `s'`, `done`, `gamma`, `Q`, `V`, `pi`, `epsilon`, `alpha`. |
| Tensor 86 | Siempre la misma forma: 6 cinemáticos + matriz 8x10. |
| Red de dos ramas | Rama densa + rama convolucional + fusión. |
| Cabezas de salida | Q-values, actor, crítico, modelo de dinámica. |
| Carril de datos | Experiencia real, replay, rollout fresco, imaginación. |
| Carril de evidencia | Semillas, split, greedy, presupuesto, colapso, OOD. |
| Sello de límite | Qué demuestra / qué no demuestra. |

## Inventario de infografías de cierre

Estas son obligatorias si se ejecuta el refuerzo completo:

| Sección | Infografía de cierre propuesta | Mensaje final |
|---|---|---|
| 2.1 | Del paso aislado al dataset vivo | RL aprende de transiciones, no de explicaciones. |
| 2.2 | Qué información basta para decidir | Markov no es una sigla: es una pregunta sobre información suficiente. |
| 2.3 | Recompensa ahora, retorno después | El agente no persigue premios sueltos, persigue futuro descontado. |
| 2.4 | Bellman como máquina de convertir experiencia en target | Aprender valor es corregir predicciones con consecuencias reales. |
| 2.5 | Explorar sin perder el control | La exploración útil produce datos, no ruido sin dirección. |
| 2.6 | Dos estabilizadores: memoria y diana lenta | Replay arregla los datos; la red objetivo arregla el blanco. |
| 2.7 | De tensor 86 a acción | La arquitectura traduce el estado al idioma que la red puede aprender. |
| 2.8 | Entrenar cuando los datos se mueven | En RL no solo cambia la red: cambia la fuente de datos. |
| 3.1 | DQN en una página | Valorar acciones + Bellman + replay produce una base fiable. |
| 3.2 | PPO en una página | Actualizar la política con prudencia da estabilidad. |
| 3.3 | SAC en una página | Entropía, críticos dobles y temperatura equilibran control y variedad. |
| 3.4 | World Model en una página | Imaginar ayuda mientras el modelo no mienta demasiado. |
| 3.5 | WM-RNN en una página | La memoria solo ayuda si el presente no contiene suficiente información. |
| 3.6 | Cinco algoritmos, tres preguntas | Qué aprende, de qué datos aprende y si imagina el mundo. |
| 4.1 | Cómo leer un veredicto experimental | Una media alta no basta: importan coste, varianza, split y colapsos. |
| 4.2 | Ablación como causalidad práctica | Quitar una pieza mide qué sostenía realmente el resultado. |
| 4.3 | De generador a ledger | Una cifra confiable deja rastro reproducible. |
| 4.4 | Qué mirar cuando juegas | La demo enseña mecanismos; el resultado lo declara el protocolo. |
| 5.1 | Lo que sobrevive al proyecto | Estado, objetivo, test y varianza viajan a cualquier proyecto de RL. |

## Plan por capítulo

### 2.1 · El bucle agente-entorno

Visuales actuales:

- `codex_ch2_1_transicion_frase.svg`
- `codex_ch2_1_episodio_done.svg`

Refuerzo recomendado:

1. **Escena completa del bucle RL en Arkanoid**  
   Un panel con tablero, agente, acción, recompensa y nuevo estado. Debe verse que el agente no "ve el juego" como un humano, sino una observación estructurada.

2. **Tupla como fila de datos entrenable**  
   Convertir `(s, a, r, s', done)` en una fila tipo dataset que luego alimenta replay, Bellman y loss.

3. **Del episodio a millones de transiciones**  
   Línea temporal: un episodio produce muchas filas; muchos episodios producen el dataset vivo del agente.

### 2.2 · MDP, observación y POMDP

Visuales actuales:

- `codex_ch2_2_mdp_pomdp.svg`
- `codex_ch2_2_dado_rebotes.svg`

Refuerzo recomendado:

1. **Estado real vs observación vs tensor**  
   Tres columnas: mundo físico completo, lo que observa el agente, tensor que entra en la red.

2. **Test de Markov para juniors**  
   Una checklist visual: "¿con esta información puedo predecir razonablemente el siguiente paso?".

3. **POMDP como sombra informativa**  
   Mostrar dos mundos distintos que producen la misma observación y por qué eso confunde al agente.

### 2.3 · Recompensa, retorno y descuento

Visuales actuales:

- `codex_ch2_3_retorno_gamma.svg`
- `codex_ch2_3_horizonte_gamma.svg`

Refuerzo recomendado:

1. **Calculadora visual de retorno**  
   Tabla con recompensas por paso, potencias de `gamma`, pesos y suma final.

2. **Propagación hacia atrás de un premio tardío**  
   Un ladrillo roto al final ilumina pasos anteriores con descuento decreciente.

3. **Gamma como horizonte efectivo**  
   Rehacer el visual para incluir `1/(1-gamma)` y ejemplos con `0.5`, `0.9`, `0.99`.

### 2.4 · Valor y Bellman

Visuales actuales:

- `codex_ch2_4_vq_bellman.svg`
- `codex_ch2_4_td_error.svg`

Refuerzo recomendado:

1. **Microscopio de Bellman**  
   Una figura grande con: predicción actual, recompensa real, valor futuro, target y TD-error.

2. **`max Q` vs `argmax Q`**  
   Mini-tablero con tres acciones: una figura que distinga número ganador y acción ganadora.

3. **Ruta del error hasta la red**  
   `TD-error -> loss Huber -> gradiente -> pesos -> nueva Q`. Esta pieza prepara `2.8` y DQN.

4. **Terminal `done` apagando el futuro**  
   Comparativa de target con `done=0` y `done=1`, con el término futuro tachado visualmente.

### 2.5 · Exploración y explotación

Visuales actuales:

- `codex_ch2_5_panel_exploracion.svg`
- `codex_ch2_5_decay_zonas.svg`

Refuerzo recomendado:

1. **Distribuciones de política lado a lado**  
   Barras para determinista, estocástica controlada y casi aleatoria.

2. **Entropía como termómetro**  
   Baja, media y alta entropía con acciones y riesgo pedagógico.

3. **Qué datos recoge cada fase de epsilon**  
   Inicio: diversidad; medio: aprendizaje; final: datos parecidos a evaluación.

### 2.6 · Replay y redes objetivo

Visuales actuales:

- `codex_ch2_6_replay_objetivo.svg`
- `codex_ch2_6_dos_problemas.svg`

Refuerzo recomendado:

1. **Anatomía del replay buffer**  
   Flujo correlacionado de transiciones que entra; batch barajado que sale.

2. **Red online vs red objetivo**  
   Dos redes iguales, una viva y otra lenta, con `tau=0.01` como actualización suave.

3. **La tríada letal en versión pedagógica**  
   Aproximación de funciones + bootstrapping + off-policy, y qué piezas mitigan cada riesgo.

### 2.7 · Redes neuronales para jugar

Visuales actuales:

- `codex_ch2_7_arquitectura_86.svg`
- `codex_ch2_7_kernel_conv.svg`

Este es el capítulo con mayor necesidad de refuerzo.

Refuerzo recomendado:

1. **De observación a tensor 86**  
   Descomponer visualmente: 6 valores cinemáticos + 80 celdas de ladrillos.

2. **Neurona, capa y activación**  
   Mini-secuencia: entradas ponderadas, sesgo, ReLU, salida.

3. **Por qué no aplanar la matriz 8x10**  
   Comparar lista plana sin vecindad frente a matriz con relaciones espaciales.

4. **Convolución 3x3 en movimiento**  
   Un kernel recorriendo el tablero y detectando patrones locales.

5. **Arquitectura completa con dimensiones**  
   Rama conv, rama densa, concatenación, capas de 128, cabeza de salida.

6. **La misma base, distintas cabezas**  
   DQN: 3 valores Q. PPO/SAC: política y/o valor. World Model: Q + dinámica. Esto prepara Parte III.

### 2.8 · Entrenar una red

Visuales actuales:

- `codex_ch2_8_flujo_entrenar.svg`
- `codex_ch2_8_senales_salud.svg`

Refuerzo recomendado:

1. **Ciclo forward-loss-backward-update**  
   Diagrama clásico de entrenamiento con nombres simples.

2. **Por qué RL no se comporta como supervisado**  
   En supervisado el dataset está quieto; en RL la política cambia y cambia también los datos.

3. **Learning rate: tres pendientes**  
   Muy bajo, razonable, demasiado alto, con trayectorias de pérdida.

## Parte III · Algoritmos

Aquí el objetivo es que cada algoritmo tenga la misma interfaz visual. La estructura recomendada por algoritmo:

1. Ficha de identidad.
2. Arquitectura real.
3. Flujo de entrenamiento.
4. Qué datos usa.
5. Cómo decide.
6. Resultado y límite.

### 3.1 · DQN

Refuerzo recomendado:

1. **Arquitectura DQN anotada desde tensor 86 a tres Q-values**.
2. **Double DQN: quien elige vs quien valora**.
3. **Una transición de replay convertida en loss**.
4. **DQN en ejecución: estado -> Q izquierda/mantener/derecha -> acción**.

### 3.2 · PPO

Refuerzo recomendado:

1. **Actor-crítico con tronco compartido**.
2. **Rollout on-policy: recoger, aprender varias épocas, descartar**.
3. **Ratio antes/después como barras de probabilidad**.
4. **Clip PPO como función visual con zona permitida y zona recortada**.

### 3.3 · SAC

Refuerzo recomendado:

1. **Cinco redes de SAC sin susto**: actor, dos críticos, dos objetivos.
2. **Termostato de entropía `alpha`**: demasiada certeza vs demasiada aleatoriedad.
3. **Por qué dos críticos**: tomar el mínimo para reducir optimismo.
4. **SAC-pure vs SAC-hybrid con evidencia separada**.

### 3.4 · World Model

Refuerzo recomendado:

1. **Dos carriles: experiencia real e imaginación**.
2. **Dyna-Q en una vuelta completa**: jugar, aprender modelo, imaginar, actualizar Q.
3. **Model bias acumulado**: un pequeño error a 1 paso se convierte en mala planificación a varios pasos.
4. **Inspector real vs predicho anotado**.

### 3.5 · World Model RNN

Refuerzo recomendado:

1. **LSTM simplificada como memoria con compuertas**.
2. **Ventana de secuencia**: cómo entran varios pasos, no una transición aislada.
3. **Cuándo la memoria ayuda y cuándo sobra**.
4. **Resultado negativo pedagógico**: más complejidad no garantiza más rendimiento.

### 3.6 · Los cinco, cara a cara

Refuerzo recomendado:

1. **Mapa único de familias con los cinco algoritmos colocados**.
2. **Tabla visual homogénea**: qué aprende, datos, replay, modelo, cabeza de salida, coste.
3. **Árbol de decisión**: si buscas fiabilidad, interpretabilidad, exploración o eficiencia.

## Parte IV · Medición

Aquí no basta con decorar gráficas. Hay que convertir resultados en lectura estadística.

### 4.1 · Veredicto

Refuerzo recomendado:

1. **Cómo leer una gráfica de resultados**  
   Eje X, eje Y, banda, semillas, presupuesto y split.

2. **Small multiples por presupuesto**  
   Una comparación más limpia entre 700k, 1.5M y 3M.

3. **Media no es historia completa**  
   Media, dispersión, colapsos y porcentaje de semillas fuertes.

4. **Resultado sano: ganador + caveat**  
   PPO gana, pero el veredicto vive dentro de protocolo, splits y semillas.

### 4.2 · Ablación

Refuerzo recomendado:

1. **Ablación como causalidad controlada**  
   Receta completa, quitar una pieza, medir delta.

2. **Barra de ablación anotada**  
   Llamadas visuales sobre escala de ladrillos, timeout, conv, shaping.

3. **Grid search vs ablación como dos fases**  
   Explorar configuraciones frente a probar causalmente una pieza.

### 4.3 · Cómo se midió

Refuerzo recomendado:

1. **Cadena reproducible completa**  
   Generador -> splits -> entrenamiento -> evaluación greedy -> ledger -> figura -> libro.

2. **No leakage visual**  
   Conjuntos disjuntos con ejemplos de train, valid, test y OOD.

3. **Ficha de métrica confiable**  
   Éxito, media, IQM si se añade, intervalo, colapso, semillas.

4. **Heatmap con escala común**  
   Dos heatmaps iguales con escalas distintas para enseñar la trampa.

### 4.4 · Jugar

Refuerzo recomendado:

1. **Captura grande anotada de la app completa**  
   Raster compuesto con números y leyenda lateral.

2. **Lo que ve el usuario vs lo que aprende el agente**  
   Partida visible, entornos headless, buffer y actualización.

3. **Inspector de algoritmo como radiografía**  
   Para DQN/PPO/SAC/WM, destacar qué parte de la interfaz corresponde a qué concepto.

## Parte V · Cierre

Refuerzo recomendado:

1. **Atlas final de conceptos**  
   Un póster blanco con notación, red, algoritmos, evaluación y tesis.

2. **Checklist reproducible final**  
   Qué debe existir para poder creerse un resultado.

3. **Mapa de transferencia**  
   Qué aprende un junior que puede llevarse a otro proyecto de RL.

## Prioridad de ejecución

### Ola 1 · Máxima prioridad pedagógica

Crear primero:

- `2.7` red neuronal completa con dimensiones.
- `2.4` microscopio de Bellman.
- `2.6` replay buffer + red objetivo.
- `3.2` actor-crítico PPO.
- `3.3` cinco redes SAC.
- `3.4` real vs imaginado.
- `4.1` lectura estadística de resultados.
- `4.3` cadena reproducible.

Estas piezas arreglan la sensación de que desde Parte II faltan mecanismos visuales.

### Ola 2 · Homogeneidad de algoritmos

Completar DQN, PPO, SAC, WM y WM-RNN con la misma plantilla:

- Identidad.
- Arquitectura.
- Datos.
- Update.
- Decisión.
- Resultado y límite.

### Ola 3 · Evidencia y app

Anotar capturas y gráficas reales:

- Curvas de entrenamiento.
- Inspectores.
- App.
- Ablaciones.
- Heatmaps.

## QA obligatorio

Para cada lote:

1. Renderizar cada SVG/HTML visual a PNG.
2. Crear contact sheet.
3. Revisar manualmente:
   - texto dentro de cajas,
   - flechas alineadas,
   - etiquetas legibles,
   - sin solapes,
   - fondo blanco,
   - paleta consistente.
4. Abrir el HTML y verificar rutas.
5. No generar PDF hasta que el usuario apruebe el lote o pida cierre final.

## Criterio de aceptación

El refuerzo estará listo cuando, desde `2.1` hasta el final:

- Cada concepto difícil tenga al menos un visual de mecanismo, no solo una tarjeta-resumen.
- Cada algoritmo pueda entenderse por la misma plantilla.
- Las redes neuronales estén representadas de forma clara: entradas, ramas, fusión y cabezas.
- Las gráficas de resultados enseñen qué mirar y qué no concluir.
- El cierre conecte teoría, algoritmo, medición y reproducibilidad.

## Veredicto

Sí: la intuición del usuario es correcta. Desde `2.1` no falta trabajo, pero falta una segunda capa gráfica más anatómica y pedagógica. La primera pasada hizo el libro más limpio y homogéneo; esta segunda pasada debería hacerlo más explicativo para quien quiere entender qué ocurre dentro de las redes y los algoritmos.
