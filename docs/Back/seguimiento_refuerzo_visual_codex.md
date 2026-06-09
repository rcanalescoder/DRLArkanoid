# Seguimiento persistente del refuerzo visual Codex

Objetivo: ejecutar una segunda pasada visual sobre `docs/report_v3_version_codex.html` para que desde `PARTE II · 2.1` hasta el cierre tenga el mismo nivel pedagógico y visual que las partes anteriores, sin caer en monotonía.

Reglas del usuario que gobiernan esta fase:

- Mantener el plan persistente para poder continuar si la sesión se corta.
- Ejecutar el plan completo, no quedarse solo en diagnóstico.
- No generar PDF hasta que el usuario lo pida al final.
- Crear infografías de cierre con fondo blanco al final de cada sección/capítulo.
- Evitar monotonía: coherencia de sistema, variedad de arquetipos.
- Verificar visualmente que no haya textos fuera de cajas, solapes ni rutas rotas.

Documentos de referencia:

- Documento de trabajo: `docs/report_v3_version_codex.html`
- Plan de refuerzo: `docs/plan_refuerzo_visual_parte_ii_en_adelante.md`
- Plan visual base: `docs/plan_visual_codex.md`
- Instrucciones reutilizables: `docs/instrucciones generación de libros.md`
- Seguimiento v1: `docs/seguimiento_visual_codex.md`

## Estado global

| Área | Estado | Notas |
|---|---|---|
| Auditoría inicial | Completada | Detectado: desde Parte II había visuales válidos, pero muchos eran fichas sintéticas y faltaban mecanismos. |
| Plan persistente | Activo | Este archivo queda como bitácora activa de la segunda pasada. |
| Biblioteca visual | Rehecha v4 | `codex2` y `codex3` quedan como histórico. La línea activa es `codex4`: PNGs editoriales con fondo blanco, secciones numeradas, borde azul, diagramas centrales grandes y cierre tipo principios. |
| Parte II | Integrada v4 | 8 infografías `codex4` insertadas de `2.1` a `2.8`. |
| Parte III | Integrada v4 | 6 infografías `codex4` insertadas de `3.1` a `3.6`; SAC, Bellman y red 86 tienen diseño específico revisado a tamaño completo. |
| Parte IV | Integrada v4 | 4 infografías `codex4` insertadas de `4.1` a `4.4`. |
| Parte V | Integrada v4 | 1 infografía `codex4` insertada en `5.1`. |
| Revisión hacia atrás Parte 0/I | Integrada v4 | 8 infografías `codex4` insertadas de `0.3` a `1.7`; `0.2` sigue sin cierre propio porque no existe como sección independiente en el HTML actual. |
| QA HTML/PNG | Validada v4 | 27 PNGs `codex4_ch*.png`, 5 hojas de contacto en `docs/qa_visual_codex/refuerzo_codex4/contact/`; HTML con 27 marcadores `codex4-panel`, sin `codex2/codex3` activos y sin rutas rotas. |
| PDF | Generado v4 | Generado tras autorización explícita del usuario: `docs/Arkanoid-DRL-Learning-Lab-v3-version-codex.pdf`. |

## Inventario de arquetipos asignados

Regla: no repetir más de dos cierres consecutivos con el mismo arquetipo.

| Sección | Cierre propuesto | Arquetipo principal | Estado |
|---|---|---|---|
| 2.1 | Del paso aislado al dataset vivo | Flujo secuencial + mapa de sistema | Integrado v1 |
| 2.2 | Qué información basta para decidir | Comparativa + test/checklist | Integrado v1 |
| 2.3 | Recompensa ahora, retorno después | Microscopio de fórmula + línea temporal | Integrado v1 |
| 2.4 | Bellman convierte experiencia en target | Microscopio de fórmula + radiografía | Integrado v1 |
| 2.5 | Explorar sin perder el control | Dashboard de controles + distribuciones | Integrado v1 |
| 2.6 | Memoria y diana lenta | Anatomía de buffer + red doble | Integrado v1 |
| 2.7 | De tensor 86 a acción | Radiografía de red | Integrado v1 |
| 2.8 | Entrenar cuando los datos se mueven | Ciclo de entrenamiento + contraste supervisado/RL | Integrado v1 |
| 3.1 | DQN en una página | Pipeline + radiografía Q | Integrado v1 |
| 3.2 | PPO en una página | Actor-crítico + clip visual | Integrado v1 |
| 3.3 | SAC en una página | Anatomía de cinco redes + termostato | Integrado v1 |
| 3.4 | World Model en una página | Dos carriles real/imaginado | Integrado v1 |
| 3.5 | WM-RNN en una página | Storyboard de secuencia + memoria útil/sobrante | Integrado v1 |
| 3.6 | Cinco algoritmos, tres preguntas | Matriz comparativa + árbol de decisión | Integrado v1 |
| 4.1 | Cómo leer un veredicto experimental | Gráfica explicada + tablero de evidencia | Integrado v1 |
| 4.2 | Ablación como causalidad práctica | Antes/después + puente causal | Integrado v1 |
| 4.3 | De generador a ledger | Ruta reproducible | Integrado v1 |
| 4.4 | Qué mirar cuando juegas | Dashboard anotado | Integrado v1 |
| 5.1 | Lo que sobrevive al proyecto | Postal editorial + mapa de transferencia | Integrado v1 |

## Lotes de ejecución

### Ola 1 · Núcleo pedagógico

Prioridad: crear visuales que enseñen mecanismo, no solo resumen.

| Asset previsto | Sección | Función | Estado |
|---|---|---|---|
| `docs/assets/codex2_ch2_4_bellman_microscopio.svg` | 2.4 | Predicción, target, TD-error y actualización | Integrado + QA PNG |
| `docs/assets/codex2_ch2_6_replay_target_anatomia.svg` | 2.6 | Buffer y red objetivo como estabilizadores | Integrado + QA PNG |
| `docs/assets/codex2_ch2_7_red_tensor_86.svg` | 2.7 | Tensor 86, ramas, fusión y cabezas | Integrado + QA PNG; barras recolocadas para no invadir tarjeta derecha. |
| `docs/assets/codex2_ch3_2_actor_critico_clip.svg` | 3.2 | PPO actor-crítico y clip | Integrado + QA PNG; texto del actor acortado para no cortar frase. |
| `docs/assets/codex2_ch3_3_sac_cinco_redes.svg` | 3.3 | SAC actor, críticos, objetivos y alfa | Integrado + QA PNG; anatomía simplificada para evitar salida del panel. |
| `docs/assets/codex2_ch3_4_world_model_real_imaginado.svg` | 3.4 | Carril real vs imaginado y sesgo | Integrado + QA PNG |
| `docs/assets/codex2_ch4_1_veredicto_estadistico.svg` | 4.1 | Media, varianza, coste, split y colapso | Integrado + QA PNG |
| `docs/assets/codex2_ch4_3_ruta_reproducible.svg` | 4.3 | Generador -> ledger -> figura | Integrado + QA PNG |

### Ola 2 · Cierres de sección

Crear o sustituir cierres tipo panel docente para 2.1-5.1 con arquetipos variados.

Estado: integrado v1. Además se insertaron cierres retroactivos en `0.3` y Parte I (`1.1` a `1.7`) para aplicar la regla anti-monotonía hacia atrás.

### Ola 3 · Integración y revisión hacia atrás

Integrar visuales en el HTML, revisar Parte 0/I para monotonía, renderizar QA y comprobar rutas.

Estado: integración HTML completada con familia `codex4`. PDF generado y revisado con render de páginas de muestra. Falta solo revisión manual final del usuario sobre el PDF completo.

## QA pendiente

Checklist por lote:

1. Renderizar SVGs a PNG.
2. Crear contact sheet.
3. Revisar visualmente en imagen.
4. Corregir overflow/solapes.
5. Insertar en HTML.
6. Comprobar rutas.
7. Registrar estado.

Resultado v4:

1. Generadas 27 infografías editoriales PNG `docs/assets/codex4_ch*.png`.
2. Generadas fuentes SVG `docs/assets/codex4_ch*.svg` solo como editable técnico; el HTML usa PNG.
3. Sustituidas las 27 inserciones activas por marcadores `codex4-panel`.
4. Validado que no quedan marcadores `codex2-panel` ni `codex3-panel` en el HTML.
5. Validado que no hay imágenes referenciadas ausentes.
6. Revisadas hojas de contacto `docs/qa_visual_codex/refuerzo_codex4/contact/contact_sheet_01.png` a `contact_sheet_05.png`.

## Log

- 2026-06-09: Creado seguimiento persistente de segunda pasada visual. Se mantiene la instrucción de no generar PDF hasta autorización final.
- 2026-06-09: Creado `scripts/codex2_refuerzo_visual.mjs`, generador idempotente de paneles SVG con arquetipos variados.
- 2026-06-09: Generados 28 paneles `codex2_*.svg`; 27 insertados en `docs/report_v3_version_codex.html` con marcadores `codex2-panel`. El panel `0.2` queda como asset de referencia porque el HTML actual no contiene sección independiente `0.2`.
- 2026-06-09: Renderizado QA PNG de los 28 SVGs en `docs/qa_visual_codex/refuerzo_codex2/png/` y hojas de contacto en `docs/qa_visual_codex/refuerzo_codex2/contact/`.
- 2026-06-09: Incidencias corregidas en QA: comillas de `font-family` que rompían XML; pies de panel que quedaban bajos; `argmax` de DQN solapado con barras; anatomía de SAC saliendo del panel; texto de actor PPO cortado; barras de `2.7` demasiado cerca de la tarjeta derecha.
- 2026-06-09: El usuario rechazó el aspecto visual de `codex3`/paneles previos por parecer pobre y demasiado alejado de infografías generadas por ChatGPT. Nuevo criterio: fondo blanco real, azul editorial, secciones numeradas, paneles grandes, más color en elementos y diagramas centrales ricos; evitar fondos verde pastel.
- 2026-06-09: Creado `scripts/codex4_muestras_editoriales.mjs`. Primero se generaron y revisaron muestras críticas: `codex4_muestra_ch3_3_sac.png`, `codex4_muestra_ch2_7_red_tensor.png` y `codex4_muestra_ch2_4_bellman.png`. Se corrigieron solapes en bandas inferiores, fórmula de Bellman y etiquetas de SAC.
- 2026-06-09: Escalada la familia `codex4` a 27 infografías finales `docs/assets/codex4_ch*.png` e integrada en `docs/report_v3_version_codex.html`. Validación HTML: 146 imágenes totales, 27 `codex4`, 27 marcadores `codex4-panel`, 0 marcadores `codex2/codex3` activos, 0 rutas rotas.
- 2026-06-09: Generado `docs/Arkanoid-DRL-Learning-Lab-v3-version-codex.pdf` desde `docs/report_v3_version_codex.html`. Resultado: 244 páginas, 22 MB. QA PDF por render de páginas 1, 116, 140, 172, 206 y 243 en `docs/qa_visual_codex/pdf_final_codex4/`.
- 2026-06-09: Creado `docs/report_v4.html` como edición 4 independiente. Cambios visibles: portada `Edición 4`, autoría `Roberto Canales Mora · con Claude y Codex`, eliminación de la marca visible `versión Codex`, y anexos finales nuevos: A) instalación y ejecución, B) mapa del código, C) código esencial, D) glosario operativo y lecturas.
- 2026-06-09: Generado `docs/Arkanoid-DRL-Learning-Lab-v4.pdf` desde `docs/report_v4.html`. Resultado: 259 páginas, 22.86 MB. QA PDF: texto antiguo `versión Codex`/`Codex visual`/`Edición 3` = 0 apariciones; anexos localizados en páginas 245, 248, 250 y 257; render de muestra en `docs/qa_visual_codex/pdf_v4_appendices/`.
