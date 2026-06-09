# Seguimiento persistente del rediseño visual Codex

Objetivo activo: ejecutar el rediseño pedagogico y visual de `report_v3` en una version Codex revisable, sin perder la version original.

Documento de trabajo:

- Original intocable: `docs/report_v3.html`
- Version Codex actual: `docs/report_v3_version_codex.html`
- Auditoria base: `docs/auditoria_pedagogica_visual_codex.md`
- Plan visual base: `docs/plan_visual_codex.md`

## Criterios de aceptacion visual

Una imagen o infografia solo se marca como validada si cumple:

- Fondo blanco en toda infografia nueva.
- Textos dentro de sus cajas, sin invadir otras tarjetas ni el margen.
- No hay solapamiento entre texto, flechas, iconos, ejes o callouts.
- Legible al ancho del PDF, no solo ampliada en pantalla.
- Titulo interpretativo: dice que ensena, no solo el nombre tecnico.
- La figura cumple una funcion pedagogica clara: orientar, explicar, medir, comparar o resumir.
- Si representa datos, la fuente y condiciones quedan claras en caption o figura.
- Si es captura real, lleva anotaciones o caption que diga que mirar.

## Rutina de QA para cada SVG/infografia

1. Renderizar con `rsvg-convert` a PNG de inspeccion.
2. Revisar visualmente el PNG.
3. Corregir textos, cajas o proporciones si hay overflow/solape.
4. Volver a renderizar.
5. Registrar resultado en esta tabla.

## Estado por fases

| Fase | Alcance | Estado | Notas |
|---|---|---|---|
| 0 | Sistema, auditoria y plan | En curso | Auditoria, plan y registro QA creados. Se trabaja por lotes con render persistente. |
| 0.2 | Como leer esta guia | Validado v1 | Version Codex creada. Overflow detectado por el usuario corregido y revalidado en PNG. |
| 0.3 | El mapa del laboratorio | Validado v1 | Cinco visuales nuevos integrados en `report_v3_version_codex.html` y revisados en PDF paginas 7-14. |
| Parte I | Historia del problema | Validado v1 | `1.1` a `1.7` validados v1. Parte I completa. Siguiente: `2.1 El bucle agente-entorno`. |
| 1.1 | Aprender por consecuencias | Validado v1 | Seis visuales nuevos integrados y revisados en PDF paginas 15-25. |
| 1.2 | Sobrevivir no es resolver | Validado v1 | Seis visuales nuevos integrados y revisados en PDF paginas 26-34. |
| 1.3 | El examen de los niveles no vistos | Validado v1 | Siete visuales nuevos integrados y revisados en PDF paginas 35-44. |
| 1.4 | El primer intento: el agente ciego | Validado v1 | Seis visuales nuevos integrados y revisados en PDF paginas 45-53. |
| 1.5 | Diagnostico: tres muros, ninguno el algoritmo | Validado v1 | Seis visuales nuevos integrados y revisados en PDF paginas 54-65. |
| 1.6 | La receta que desbloquea | Validado v1 | Seis visuales nuevos integrados y revisados en PDF paginas 66-75. |
| 1.7 | La primera conquista | Validado v1 | Cinco visuales nuevos integrados y revisados en PDF paginas 76-82. `2.1` empieza limpio en pagina 83. |
| Parte II | Fundamentos | Validado v1 | 16 visuales Codex integrados (`2.1` a `2.8`) y revisados en PDF paginas 83-139. |
| Parte III | Algoritmos | Validado v1 | 12 visuales Codex integrados; se conservan capturas/curvas de evidencia. Revisado en PDF paginas 140-188. |
| Parte IV | Medicion | Validado v1 | 9 visuales Codex integrados; se conservan graficas/capturas de evidencia. Revisado en PDF paginas 189-221. |
| Parte V | Cierre | Validado v1 | 4 visuales Codex integrados y revisados en PDF paginas 222-229. |

## Registro de QA de imagenes

| Asset | Render QA | Estado | Incidencias | Accion |
|---|---|---|---|---|
| `docs/assets/codex_vis_niveles_lectura.svg` | `docs/qa_visual_codex/ch0_2/01_niveles.png` | Validado v1 | Sin overflow ni solapes observables en contact sheet. | Mantener. |
| `docs/assets/codex_vis_leyenda_cajas.svg` | `docs/qa_visual_codex/ch0_2/02_cajas.png` | Validado v1 | Sin overflow ni solapes observables en contact sheet. | Mantener. |
| `docs/assets/codex_vis_coreografia.svg` | `docs/qa_visual_codex/ch0_2/03_coreografia.png` | Validado v1 | Sin overflow ni solapes observables en contact sheet. | Mantener. |
| `docs/assets/codex_ch1_pacto_honestidad.svg` | `docs/qa_visual_codex/ch0_2/04_pacto_honestidad.png` | Validado v1 | Overflow detectado por el usuario corregido dividiendo titulos largos. | Mantener vigilado en PDF. |
| `docs/assets/codex_ch1_resumen_visual.svg` | `docs/qa_visual_codex/ch0_2/05_resumen_visual.png` | Validado v1 | Sin overflow ni solapes observables en contact sheet. | Mantener. |
| `docs/assets/codex_ch0_3_mapa_viaje.svg` | `docs/qa_visual_codex/ch0_3/01_mapa_viaje.png` | Validado v1 | Revisado en lote y en PDF pagina 7. Sin overflow observable. | Integrado. |
| `docs/assets/codex_ch0_3_laboratorio_anotado.png` | `docs/qa_visual_codex/ch0_3/03_laboratorio_anotado.png` | Validado v1 | Captura real anotada; corregido pie inferior para no tapar la screenshot. | Integrado. |
| `docs/assets/codex_ch0_3_quien_es_quien.svg` | `docs/qa_visual_codex/ch0_3/02_quien_es_quien.png` | Validado v1 | Revisado en lote y en PDF pagina 10. Sin texto fuera de caja. | Integrado. |
| `docs/assets/codex_ch0_3_arco_resultados.svg` | `docs/qa_visual_codex/ch0_3/04_arco_resultados.png` | Validado v1 | Revisado en lote y en PDF pagina 12. Mantiene contexto de split, presupuesto y semillas. | Integrado. |
| `docs/assets/codex_ch0_3_resumen_visual.svg` | `docs/qa_visual_codex/ch0_3/05_resumen_visual.png` | Validado v1 | Revisado en lote y en PDF pagina 14. Sin overflow observable. | Integrado. |
| `docs/assets/codex_ch1_1_minimo_saber.svg` | `docs/qa_visual_codex/ch1_1/01_minimo_saber.png` | Validado v1 | Revisado en lote y en PDF pagina 15. Sin overflow observable. | Integrado. |
| `docs/assets/codex_ch1_1_bucle_vinetas.svg` | `docs/qa_visual_codex/ch1_1/02_bucle_vinetas.png` | Validado v1 | Revisado en lote y en PDF pagina 17. Sin texto fuera de caja. | Integrado. |
| `docs/assets/codex_ch1_1_paradigmas.svg` | `docs/qa_visual_codex/ch1_1/03_paradigmas.png` | Validado v1 | Corregido solape inicial del cluster naranja con el texto. Revisado en PDF pagina 22. | Integrado. |
| `docs/assets/codex_ch1_1_humano_tensor.svg` | `docs/qa_visual_codex/ch1_1/04_humano_tensor.png` | Validado v1 | Revisado en lote y en PDF pagina 21. Sin overflow observable. | Integrado. |
| `docs/assets/codex_ch1_1_credito_recompensa.svg` | `docs/qa_visual_codex/ch1_1/05_credito_recompensa.png` | Validado v1 | Tarjetas inferiores ampliadas para dar aire al texto. Revisado en PDF pagina 20. | Integrado. |
| `docs/assets/codex_ch1_1_resumen_visual.svg` | `docs/qa_visual_codex/ch1_1/06_resumen_visual.png` | Validado v1 | Revisado en lote y en PDF pagina 24. Sin overflow observable. | Integrado. |
| `docs/assets/codex_ch1_2_escalera_exigencia.svg` | `docs/qa_visual_codex/ch1_2/01_escalera_exigencia.png` | Validado v1 | Revisado en lote y en PDF pagina 26. Sin texto fuera de caja. | Integrado. |
| `docs/assets/codex_ch1_2_proxy_objetivo.svg` | `docs/qa_visual_codex/ch1_2/02_proxy_objetivo.png` | Validado v1 | Revisado en lote y en PDF pagina 27. Flechas, tarjetas y caption sin solapes. | Integrado. |
| `docs/assets/codex_ch1_2_recompensa_exito.svg` | `docs/qa_visual_codex/ch1_2/03_recompensa_exito.png` | Validado v1 | Recuadros laterales ampliados para dar aire al texto. Revisado en PDF pagina 29. | Integrado. |
| `docs/assets/codex_ch1_2_lleno_disperso.svg` | `docs/qa_visual_codex/ch1_2/05_lleno_disperso.png` | Validado v1 | Revisado en lote y en PDF pagina 31. Trayectorias y textos legibles, sin invasion. | Integrado. |
| `docs/assets/codex_ch1_2_resumen_visual.svg` | `docs/qa_visual_codex/ch1_2/06_resumen_visual.png` | Validado v1 | Revisado en lote y en PDF pagina 33. Tarjetas de cierre equilibradas. | Integrado. |
| `docs/assets/codex_ch1_2_descomp_recompensa.svg` | `docs/qa_visual_codex/ch1_2/04_descomp_recompensa.png` | Validado v1 | Revisado en lote y en PDF pagina 34. Barra 75/25 y tarjeta de lectura sin overflow. | Integrado. |
| `docs/assets/codex_ch1_3_protocolo_split.svg` | `docs/qa_visual_codex/ch1_3/01_protocolo_split.png` | Validado v1 | Revisado en lote y en PDF pagina 35. Flujo generador-train-valid-test legible. | Integrado. |
| `docs/assets/codex_ch1_3_fuga_datos.svg` | `docs/qa_visual_codex/ch1_3/02_fuga_datos.png` | Validado v1 | Revisado en lote y en PDF pagina 37. Flecha de fuga y comparativa limpia sin solapes. | Integrado. |
| `docs/assets/codex_ch1_3_familias_generador.svg` | `docs/qa_visual_codex/ch1_3/03_familias_generador.png` | Validado v1 | Tarjetas de familias ampliadas para dar aire al texto inferior. Revisado en PDF pagina 38. | Integrado. |
| `docs/assets/codex_ch1_3_tres_examenes.svg` | `docs/qa_visual_codex/ch1_3/04_tres_examenes.png` | Validado v1 | Etiqueta de distancia recolocada para no quedar tapada por tarjetas. Revisado en PDF pagina 39. | Integrado. |
| `docs/assets/codex_ch1_3_ficha_protocolo.svg` | `docs/qa_visual_codex/ch1_3/05_ficha_protocolo.png` | Validado v1 | Revisado en lote y en PDF pagina 41. Condiciones de evaluacion legibles. | Integrado. |
| `docs/assets/codex_ch1_3_lectura_resultados.svg` | `docs/qa_visual_codex/ch1_3/06_lectura_resultados.png` | Validado v1 | Revisado en lote y en PDF pagina 42. Lineas y etiquetas de resultados legibles. | Integrado. |
| `docs/assets/codex_ch1_3_resumen_visual.svg` | `docs/qa_visual_codex/ch1_3/07_resumen_visual.png` | Validado v1 | Revisado en lote y en PDF pagina 43. Tarjetas de cierre sin overflow. | Integrado. |
| `docs/assets/codex_ch1_4_observacion_ciega.svg` | `docs/qa_visual_codex/ch1_4/01_observacion_ciega.png` | Validado v1 | Revisado en lote y en PDF pagina 45. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch1_4_contraste_deepmind.svg` | `docs/qa_visual_codex/ch1_4/02_contraste_deepmind.png` | Validado v1 | Revisado en lote y en PDF pagina 47. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch1_4_bucle_ciego.svg` | `docs/qa_visual_codex/ch1_4/03_bucle_ciego.png` | Validado v1 | Revisado en lote y en PDF pagina 48. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch1_4_resultados_ciego.svg` | `docs/qa_visual_codex/ch1_4/04_resultados_ciego.png` | Validado v1 | Revisado en lote y en PDF pagina 50. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch1_4_reloj_atajo.svg` | `docs/qa_visual_codex/ch1_4/05_reloj_atajo.png` | Validado v1 | Revisado en lote y en PDF pagina 51. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch1_4_resumen_visual.svg` | `docs/qa_visual_codex/ch1_4/06_resumen_visual.png` | Validado v1 | Revisado en lote y en PDF pagina 52. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch1_5_panel_diagnostico.svg` | `docs/qa_visual_codex/ch1_5/01_panel_diagnostico.png` | Validado v1 | Revisado en lote y en PDF pagina 54. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch1_5_reloj_imposible.svg` | `docs/qa_visual_codex/ch1_5/02_reloj_imposible.png` | Validado v1 | Revisado en lote y en PDF pagina 56. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch1_5_shaping_balanza.svg` | `docs/qa_visual_codex/ch1_5/03_shaping_balanza.png` | Validado v1 | Revisado en lote y en PDF pagina 58. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch1_5_observacion_techo.svg` | `docs/qa_visual_codex/ch1_5/04_observacion_techo.png` | Validado v1 | Revisado en lote y en PDF pagina 61. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch1_5_cambio_culpa.svg` | `docs/qa_visual_codex/ch1_5/05_cambio_culpa.png` | Validado v1 | Revisado en lote y en PDF pagina 62. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch1_5_resumen_visual.svg` | `docs/qa_visual_codex/ch1_5/06_resumen_visual.png` | Validado v1 | Revisado en lote y en PDF pagina 64. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch1_6_receta_completa.svg` | `docs/qa_visual_codex/ch1_6/01_receta_completa.png` | Validado v1 | Revisado en lote y en PDF pagina 66. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch1_6_antes_despues.svg` | `docs/qa_visual_codex/ch1_6/02_antes_despues.png` | Validado v1 | Revisado en lote y en PDF pagina 67. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch1_6_estado_86.svg` | `docs/qa_visual_codex/ch1_6/03_estado_86.png` | Validado v1 | Revisado en lote y en PDF pagina 69. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch1_6_red_dos_ramas.svg` | `docs/qa_visual_codex/ch1_6/04_red_dos_ramas.png` | Validado v1 | Revisado en lote y en PDF pagina 71. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch1_6_variedad_evaluacion.svg` | `docs/qa_visual_codex/ch1_6/05_variedad_evaluacion.png` | Validado v1 | Revisado en lote y en PDF pagina 72. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch1_6_receta_causal.svg` | `docs/qa_visual_codex/ch1_6/06_receta_causal.png` | Validado v1 | Revisado en lote y en PDF pagina 74. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch1_7_puente_parte_i.svg` | `docs/qa_visual_codex/ch1_7/codex_ch1_7_puente_parte_i.png` | Validado v1 | Revisado en lote y en PDF pagina 76. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch1_7_salto_narrativo.svg` | `docs/qa_visual_codex/ch1_7/codex_ch1_7_salto_narrativo.png` | Validado v1 | Etiquetas del eje X corregidas para que no bajaran con las barras. Revisado en PDF pagina 77. | Integrado. |
| `docs/assets/codex_ch1_7_ficha_evidencia.svg` | `docs/qa_visual_codex/ch1_7/codex_ch1_7_ficha_evidencia.png` | Validado v1 | Revisado en lote y en PDF pagina 79. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch1_7_cinco_algoritmos.svg` | `docs/qa_visual_codex/ch1_7/codex_ch1_7_cinco_algoritmos.png` | Validado v1 | Revisado en lote y en PDF pagina 80. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch1_7_cierre_parte_i.svg` | `docs/qa_visual_codex/ch1_7/codex_ch1_7_cierre_parte_i.png` | Validado v1 | Incidencia corregida en PDF: frase central dividida en dos lineas para no salirse del recuadro. Revisado en PDF pagina 81. | Integrado. |
| `docs/assets/codex_ch2_*.svg` | `docs/qa_visual_codex/ch2/contact_sheet.png` | Validado v1 | 16 visuales revisados en contact sheet y en PDF paginas 83-139. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch3_*.svg` | `docs/qa_visual_codex/ch3/contact_sheet.png` | Validado v1 | 12 visuales revisados en contact sheet y en PDF paginas 140-188. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch4_*.svg` | `docs/qa_visual_codex/ch4/contact_sheet.png` | Validado v1 | 9 visuales revisados en contact sheet y en PDF paginas 189-221. Sin overflow/solapes observables. | Integrado. |
| `docs/assets/codex_ch5_*.svg` | `docs/qa_visual_codex/ch5/contact_sheet.png` | Validado v1 | 4 visuales revisados en contact sheet y en PDF paginas 222-229. Sin overflow/solapes observables. | Integrado. |

## Log de ejecucion

- 2026-06-06: Creado seguimiento persistente. Se inicia correccion de overflow en `codex_ch1_pacto_honestidad.svg`.
- 2026-06-06: Corregido overflow detectado por el usuario en `codex_ch1_pacto_honestidad.svg`: titulos largos partidos en dos lineas y reequilibrada la tarjeta central.
- 2026-06-06: Renderizado lote QA de 0.2 en `docs/qa_visual_codex/ch0_2/` y contact sheet en `docs/qa_visual_codex/ch0_2/contact_sheet.png`. Revision visual: sin textos fuera de caja ni solapes observables.
- 2026-06-06: Iniciado redisenyo de 0.3 con cuatro piezas: mapa del viaje, leyenda de personajes, captura de laboratorio anotada y arco causal 0% -> 91%.
- 2026-06-06: Creado lote visual de 0.3: `codex_ch0_3_mapa_viaje.svg`, `codex_ch0_3_laboratorio_anotado.png`, `codex_ch0_3_quien_es_quien.svg`, `codex_ch0_3_arco_resultados.svg` y `codex_ch0_3_resumen_visual.svg`.
- 2026-06-06: Renderizado QA de 0.3 en `docs/qa_visual_codex/ch0_3/` y contact sheet en `docs/qa_visual_codex/ch0_3/contact_sheet.png`. Se corrigio la captura anotada para que el pie no invadiera la screenshot.
- 2026-06-06: Integrado 0.3 en `docs/report_v3_version_codex.html`: sustituidas `vis_roadmap.svg`, `app_intro_1.jpg`, `vis_personajes.svg` y `vis_salto_0_91.svg` por el lote Codex ubicado en el orden pedagogico del capitulo.
- 2026-06-06: Generado PDF de verificacion `docs/Arkanoid-DRL-Learning-Lab-v3-version-codex.pdf`. Renderizadas paginas 7-14 en `docs/qa_visual_codex/ch0_3/pdf_pages/`; revision visual: figuras legibles y sin textos fuera de caja.
- 2026-06-06: Redisenado `1.1 Aprender por consecuencias` con seis piezas: minimo saber, bucle en vinetas, paradigmas de aprendizaje, humano vs tensor, recompensa escasa/asignacion de credito y resumen visual.
- 2026-06-06: Renderizado QA de `1.1` en `docs/qa_visual_codex/ch1_1/` y contact sheet en `docs/qa_visual_codex/ch1_1/contact_sheet.png`. Incidencias corregidas: solape del cluster naranja en `codex_ch1_1_paradigmas.svg` y aire inferior en `codex_ch1_1_credito_recompensa.svg`.
- 2026-06-06: Integrado `1.1` en `docs/report_v3_version_codex.html`: sustituidas `vis_bucle.svg`, `dg_paradigmas.svg` y `vis_humano_agente.svg`; nuevas figuras colocadas segun la progresion pedagogica del texto.
- 2026-06-06: Regenerado `docs/Arkanoid-DRL-Learning-Lab-v3-version-codex.pdf`. Renderizadas paginas 15-25 en `docs/qa_visual_codex/ch1_1/pdf_pages/`; revision visual: figuras legibles, captions presentes y sin cortes entre paginas.
- 2026-06-07: Verificado que el trabajo global aun no estaba completo: `1.2 Sobrevivir no es resolver` seguia usando `vis_escalera.svg`, `m_recompensa_exito.png`, `m_descomp_recompensa.png` y `vis_lleno_disperso.svg` en la version Codex.
- 2026-06-07: Redisenado `1.2` con seis piezas: escalera de exigencia, proxy frente a objetivo, curva recompensa/exito, lleno frente a disperso, resumen visual y descomposicion de recompensa.
- 2026-06-07: Renderizado QA de `1.2` en `docs/qa_visual_codex/ch1_2/` y contact sheet en `docs/qa_visual_codex/ch1_2/contact_sheet.png`. Incidencia corregida: recuadros laterales de `codex_ch1_2_recompensa_exito.svg` ampliados para evitar texto pegado al borde.
- 2026-06-07: Integrado `1.2` en `docs/report_v3_version_codex.html`: sustituidas las cuatro figuras antiguas y colocadas las seis nuevas segun la progresion pedagogica del capitulo.
- 2026-06-07: Regenerado `docs/Arkanoid-DRL-Learning-Lab-v3-version-codex.pdf`. Renderizadas paginas 26-34 en `docs/qa_visual_codex/ch1_2/pdf_pages/`; revision visual: figuras legibles, captions presentes, sin textos fuera de caja y sin cortes de pagina.
- 2026-06-07: Redisenado `1.3 El examen de los niveles no vistos` con siete piezas: protocolo de split, fuga de datos, familias del generador, tres examenes, ficha de evaluacion, lectura de resultados y resumen visual.
- 2026-06-07: Renderizado QA de `1.3` en `docs/qa_visual_codex/ch1_3/` y contact sheet en `docs/qa_visual_codex/ch1_3/contact_sheet.png`. Incidencias corregidas: tarjetas de familias ampliadas y etiqueta de distancia de `codex_ch1_3_tres_examenes.svg` recolocada.
- 2026-06-07: Integrado `1.3` en `docs/report_v3_version_codex.html`: sustituidas `vis_split_datos.svg`, `v2/puzzles_familias.svg` y `vis_tres_examenes.svg` dentro del capitulo; nuevas figuras colocadas segun el orden pedagogico del texto.
- 2026-06-07: Regenerado `docs/Arkanoid-DRL-Learning-Lab-v3-version-codex.pdf`. Renderizadas paginas 35-44 en `docs/qa_visual_codex/ch1_3/pdf_pages/`; revision visual: figuras legibles, captions presentes, sin textos fuera de caja y sin cortes de pagina.
- 2026-06-07: Redisenado `1.4 El primer intento: el agente ciego` con seis piezas: observacion ciega, contraste con DeepMind, bucle del agente ciego, lectura de resultados, reloj fijo como atajo y resumen visual.
- 2026-06-07: Renderizado QA de `1.4` en `docs/qa_visual_codex/ch1_4/` y contact sheet en `docs/qa_visual_codex/ch1_4/contact_sheet.png`. Revision visual: sin textos fuera de caja ni solapes observables.
- 2026-06-07: Integrado `1.4` en `docs/report_v3_version_codex.html`: sustituidas `vis_ciego_ojos.svg` y `m_trampa_56.png`; nuevas figuras colocadas para explicar que el fallo era de informacion, no de algoritmo.
- 2026-06-07: Regenerado `docs/Arkanoid-DRL-Learning-Lab-v3-version-codex.pdf`. Renderizadas paginas 45-53 en `docs/qa_visual_codex/ch1_4/pdf_pages/`; revision visual: figuras legibles, captions presentes, sin textos fuera de caja y sin cortes de pagina.
- 2026-06-07: Redisenado `1.5 Diagnostico: tres muros, ninguno el algoritmo` con seis piezas: panel diagnostico, reloj imposible, shaping como proxy, observacion como techo, cambio de culpa y resumen visual.
- 2026-06-07: Renderizado QA de `1.5` en `docs/qa_visual_codex/ch1_5/` y contact sheet en `docs/qa_visual_codex/ch1_5/contact_sheet.png`. Revision visual: sin textos fuera de caja ni solapes observables.
- 2026-06-07: Integrado `1.5` en `docs/report_v3_version_codex.html`: sustituida `vis_tres_muros.svg`; retiradas del cierre `m_reloj.png` y `vis_shaping.svg`; nuevas figuras colocadas junto a cada muro y al cierre del capitulo.
- 2026-06-07: Regenerado `docs/Arkanoid-DRL-Learning-Lab-v3-version-codex.pdf`. Renderizadas paginas 54-65 en `docs/qa_visual_codex/ch1_5/pdf_pages/`; revision visual: figuras legibles, captions presentes, sin textos fuera de caja y sin cortes de pagina. `1.6` empieza limpio en pagina 66.
- 2026-06-07: Redisenado `1.6 La receta que desbloquea` con seis piezas: receta completa, antes/despues de formulacion, estado 86, red de dos ramas, variedad/evaluacion y receta causal.
- 2026-06-07: Renderizado QA de `1.6` en `docs/qa_visual_codex/ch1_6/` y contact sheet en `docs/qa_visual_codex/ch1_6/contact_sheet.png`. Revision visual: sin textos fuera de caja ni solapes observables.
- 2026-06-07: Integrado `1.6` en `docs/report_v3_version_codex.html`: sustituida `vis_receta.svg`; sustituidas dentro del capitulo `red_conv.svg` y `v2/puzzles_familias.svg` por versiones especificas Codex; nuevas figuras colocadas para reforzar la receta completa, el estado 86 y la lectura causal.
- 2026-06-07: Regenerado `docs/Arkanoid-DRL-Learning-Lab-v3-version-codex.pdf`. Renderizadas paginas 66-75 en `docs/qa_visual_codex/ch1_6/pdf_pages/`; revision visual: figuras legibles, captions presentes, sin textos fuera de caja y sin cortes de pagina. `1.7` empieza limpio en pagina 76.
- 2026-06-07: Redisenado `1.7 La primera conquista` con cinco piezas: puente causal de Parte I, salto narrativo 0% -> 91%, ficha de evidencia, mapa de cinco algoritmos y cierre visual de Parte I.
- 2026-06-07: Renderizado QA de `1.7` en `docs/qa_visual_codex/ch1_7/` y contact sheet en `docs/qa_visual_codex/ch1_7/contact_sheet.png`. Incidencias corregidas: etiquetas del eje X en `codex_ch1_7_salto_narrativo.svg` y frase central de `codex_ch1_7_cierre_parte_i.svg`.
- 2026-06-07: Integrado `1.7` en `docs/report_v3_version_codex.html`: sustituida `assets/v2/f1_conquista.png` por `codex_ch1_7_salto_narrativo.svg` y anadidas cuatro infografias de apoyo y cierre.
- 2026-06-07: Regenerado `docs/Arkanoid-DRL-Learning-Lab-v3-version-codex.pdf`. Renderizadas paginas 74-94 en `docs/qa_visual_codex/ch1_7/pdf_pages/`; revision visual: `1.7` ocupa paginas 76-82, figuras legibles, captions presentes, sin textos fuera de caja y `2.1` empieza limpio en pagina 83.
- 2026-06-07: Redisenadas las Partes II-V sin generar PDF intermedio: 16 visuales para Parte II, 12 para Parte III, 9 para Parte IV y 4 para Parte V, todos con fondo blanco y plantilla homogenea.
- 2026-06-07: Renderizado QA PNG de Partes II-V: `docs/qa_visual_codex/ch2/contact_sheet.png`, `docs/qa_visual_codex/ch3/contact_sheet.png`, `docs/qa_visual_codex/ch4/contact_sheet.png` y `docs/qa_visual_codex/ch5/contact_sheet.png`. Revision visual: sin textos fuera de caja ni solapes observables.
- 2026-06-07: Integradas Partes II-V en `docs/report_v3_version_codex.html`: Parte II sustituye diagramas antiguos por infografias Codex; Parte III aplica plantilla comun de algoritmo y conserva capturas/curvas de evidencia; Parte IV anade guias de lectura manteniendo graficas/capturas de evidencia; Parte V sustituye el cierre por poster, lecciones, glosario y ruta reproducible.
- 2026-06-07: Comprobacion HTML previa al PDF final: 119 imagenes totales, 0 rutas rotas, 41 visuales Codex nuevos en Partes II-V y sin referencias restantes a esquemas antiguos `vis_`, `dg_` o `gridcard_` en el HTML.
- 2026-06-07: Generado una unica vez el PDF final `docs/Arkanoid-DRL-Learning-Lab-v3-version-codex.pdf` tras completar todas las partes pendientes.
- 2026-06-07: Renderizadas paginas 80-229 del PDF final en `docs/qa_visual_codex/final_pdf/pages/` y hojas de contacto `docs/qa_visual_codex/final_pdf/contact_sheet_01.png` a `contact_sheet_05.png`. Revision visual: Partes II-V legibles, captions presentes, sin textos fuera de caja y sin cortes observables.
