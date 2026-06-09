# Plan visual Codex para `report_v3`

Objetivo: convertir la guia en un documento mas visual, pedagogico y revisable sin perder el informe original.

Reglas de estilo:

- Trabajar siempre sobre una copia tipo `report_v3_version_codex.html`, nunca sobre `report_v3.html` hasta aprobar cambios.
- Todas las infografias nuevas con fondo blanco.
- No limitarse a SVG: se puede usar SVG, PNG rasterizado, graficas replotteadas, capturas anotadas o composiciones mixtas.
- Cada capitulo/seccion debe cerrar con una infografia-resumen blanca tipo panel docente: titulo grande, subtitulo, bloques principales, tarjetas intermedias, mini-flujo o mini-grafico y una franja final con la conclusion.
- Evitar monotonia: el sistema visual debe ser coherente, pero los cierres deben alternar arquetipos (mapa, radiografia, flujo, storyboard, matriz, dashboard anotado, grafica explicada, diagnostico, ruta reproducible o postal editorial).
- Las capturas reales de la app se conservan cuando aportan evidencia, pero se deberian anotar con callouts.
- Las graficas de datos se deberian replottear desde `results/` cuando sea posible, con titulo interpretativo y guia de lectura integrada.

## Diagnostico general

El documento actual ya tiene muchas figuras, pero mezcla cuatro estilos: `dg_*` tecnico simple, `vis_*` pedagogico, `m_*` graficas metricas y capturas JPG/PNG de la app. La mejora no es solo "hacerlo mas bonito"; es que cada imagen tenga una mision: orientar, explicar, medir, comparar o resumir.

Prioridad alta:

- Rehacer los diagramas `dg_*` mas planos como infografias narrativas.
- Reemplazar figuras demasiado finas o pobres en PDF, especialmente `transicion.jpg` y algunas capturas verticales estrechas.
- Añadir una infografia de cierre tipo panel al final de cada capitulo.
- Revisar tambien hacia atras que los cierres de Parte 0 y Parte I no parezcan la misma composicion repetida.
- Anotar capturas de app/inspectores con etiquetas sobre lo que debe mirar el lector.
- Replottear graficas `m_*` y `v2/f*.png` con estilo unificado y fondo blanco.

## Arquetipos para no hacer un libro monotono

Elegir el formato por funcion pedagogica, no por comodidad:

- **Mapa de sistema**: piezas y relaciones.
- **Radiografia/anatomia**: abrir redes, algoritmos o modelos.
- **Flujo secuencial**: pasos de entrenamiento, transiciones o pipelines.
- **Storyboard**: historia de una decision o episodio.
- **Antes/despues**: bloqueo frente a desbloqueo.
- **Matriz comparativa**: familias, variantes y tradeoffs.
- **Dashboard anotado**: interfaz real, inspector o app.
- **Grafica explicada**: resultados, semillas, coste y colapsos.
- **Microscopio de formula**: Bellman, retorno, TD-error, PPO clip.
- **Diagnostico**: sintoma, causa, prueba y arreglo.
- **Ruta reproducible**: codigo, datos, ledger, figura y libro.
- **Postal editorial**: cierre memorable de una parte.

Regla: no repetir mas de dos cierres consecutivos con el mismo arquetipo. Si una figura parece una lista de tarjetas, debe ganar una relacion visual: flecha, eje, comparativa, mini-ejemplo, mapa o grafica.

## Plan por capitulo

| Capitulo | Imagenes actuales que tocaria | Que haria |
|---|---|---|
| 0.2 Como leer esta guia | `vis_niveles_lectura.svg`, `vis_leyenda_cajas.svg`, `vis_coreografia.svg` | Ya hay propuesta Codex v2: mapa de rutas, cajas como herramientas, carriles narrativos, pacto de honestidad y ficha final. |
| 0.3 El mapa del laboratorio | `vis_roadmap.svg`, `app_intro_1.jpg`, `vis_personajes.svg`, `vis_salto_0_91.svg` | Rehacer como "mapa del viaje completo": problema -> reformulacion -> cinco algoritmos -> protocolo -> resultado. Anotar captura de app con callouts. Añadir mini-infografia "quien es quien" con agente, entorno, estado, accion, recompensa, politica y valor. |
| 1.1 Aprender por consecuencias | `vis_bucle.svg`, `dg_paradigmas.svg`, `vis_humano_agente.svg` | Sustituir por una escena paso a paso: humano ve tablero vs agente ve tensor; bucle RL como tira de 4 viñetas; mapa de aprendizaje supervisado/no supervisado/refuerzo con ejemplos visuales. |
| 1.2 Sobrevivir no es resolver | `vis_escalera.svg`, `m_recompensa_exito.png`, `m_descomp_recompensa.png`, `vis_lleno_disperso.svg` | Hacer una infografia de "reward hacking": proxy sube, objetivo real no. Replottear las dos graficas con anotaciones. Mejorar lleno vs disperso como comparativa fisica de trayectorias de bola. |
| 1.3 El examen de niveles no vistos | `vis_split_datos.svg`, `v2/puzzles_familias.svg`, `vis_tres_examenes.svg` | Unificar en una infografia de protocolo: generador -> train/val/test -> TEST-ID/OOD patron/OOD dificultad. Añadir ejemplo visual de fuga de datos y por que seria trampa. |
| 1.4 El agente ciego | `vis_ciego_ojos.svg`, `m_trampa_56.png` | Rehacer como "agente sin mapa": misma escena con y sin matriz 8x10. Añadir tablero lleno vs disperso con el 56% engañoso como caso de fisica, no inteligencia. |
| 1.5 Tres muros | `vis_tres_muros.svg`, `m_reloj.png`, `vis_shaping.svg` | Convertir en panel diagnostico: sintoma -> hipotesis falsa -> prueba -> causa real -> arreglo. Replottear reloj con escala visual de pasos/ladrillo. Hacer shaping como balanza "sobrevivir vs limpiar". |
| 1.6 La receta que desbloquea | `vis_receta.svg`, `red_conv.svg`, `v2/puzzles_familias.svg` | Rehacer receta como arquitectura de solucion: observacion + reloj + recompensa + conv + curriculum. Red conv como diagrama mas grande y explicativo. Añadir "antes/despues de la formulacion". |
| 1.7 La primera conquista | `v2/f1_conquista.png` | Replottear o rediseñar la conquista como doble panel narrativo: ciego 0% -> vision 91%. Añadir resumen de Parte I con los ingredientes que causan el salto. |
| 2.1 Bucle agente-entorno | `vis_transicion_atomo.svg`, `transicion.jpg`, `vis_done_terminales.svg` | Sustituir `transicion.jpg` por una infografia rica de transicion `(s,a,r,s',done)`. Añadir episodio como linea temporal con finales: perder, limpiar, timeout. |
| 2.2 MDP/POMDP | `vis_mdp_pomdp.svg`, `dg_dado.svg` | Rehacer como tablero con ventana de observacion: estado completo vs observacion parcial. Añadir "dado cargado" de transicion estocastica, pero conectado a rebotes reales. |
| 2.3 Retorno y descuento | `dg_descuento.svg`, `m_retorno.png` | Unificar en una figura: recompensas futuras como monedas que se van desvaneciendo. Replottear gamma con lectura visual de horizonte. |
| 2.4 Valor y Bellman | `vis_v_q.svg`, `dg_valor.svg`, `dg_bellman.svg`, `vis_bellman_puente.svg`, `vis_td_error.svg` | Hay demasiadas piezas solapadas. Consolidar en una gran infografia: V vs Q -> objetivo Bellman -> TD-error. Mantener una figura separada solo si aporta ejemplo numerico. |
| 2.5 Exploracion/explotacion | `vis_dilema.svg`, `dg_entropia.svg`, `dg_epsilon.svg`, `dg_estocastica.svg`, `m_epsilon_decay.png` | Agrupar epsilon-greedy, entropia y politica estocastica en un "panel de control de exploracion". Replottear epsilon decay con zonas "explorar", "transicion", "explotar". |
| 2.6 Replay y redes objetivo | `vis_replay_objetivo.svg`, `replay_conceptual.jpg` | Hacer una infografia de estabilidad: experiencia correlacionada -> buffer barajado -> minibatch -> red objetivo lenta. La foto conceptual actual se podria reemplazar. |
| 2.7 Redes neuronales | `vis_dos_ramas.svg`, `dg_neurona.svg`, `red_conv.svg`, `vis_conv_kernel.svg` | Rehacer como una infografia de arquitectura completa: matriz 8x10 + 6 cinemáticos -> conv/densa -> fusion -> cabeza por algoritmo. Añadir una vista zoom de kernel 3x3 sobre ladrillos. |
| 2.8 Entrenar una red | `vis_loss_gradiente.svg`, `dg_gradiente.svg`, `curvas_vacias.jpg` | Consolidar los dos gradientes. Añadir flujo "prediccion -> perdida -> gradiente -> pesos". Anotar curvas vacias como panel de señales de salud. |
| 3.1 DQN | `vis_flujo_dqn.svg`, `dg_dqn.svg`, `inspector_dqn.jpg`, `curvas_dqn.jpg`, `app_dqn.jpg`, `gridcard_dqn.svg` | Usar plantilla de algoritmo: idea mental, pipeline, inspector anotado, curva anotada, ficha final. Rehacer `dg_dqn` y `gridcard_dqn` como ficha blanca mas rica. |
| 3.2 PPO | `vis_ppo_prudencia.svg`, `gridcard_ppo.svg`, `dg_ppo_clip.svg`, `curvas_ppo.jpg`, `inspector_ppo.jpg`, `app_ppo.jpg` | Plantilla equivalente. Figura clave: "pasos pequeños para no romper la politica" con ratio clip. Anotar actor, critico, ventaja y entropia en inspector. |
| 3.3 SAC | `vis_sac_balanza.svg`, `dg_sac.svg`, `inspector_sac.jpg`, `curvas_sac.jpg`, `app_sac.jpg`, `gridcard_sac.svg`, `vis_sac_variantes.svg` | Plantilla equivalente. Dar mas peso a SAC-pure vs critic-hybrid como comparativa honesta. Infografia de temperatura alfa como termostato de exploracion. |
| 3.4 World Model | `vis_real_imaginado.svg`, `dg_dyna.svg`, `gridcard_worldModel.svg`, `curvas_worldmodel.jpg`, `inspector_worldmodel.jpg`, `app_worldmodel.jpg` | Hacer la diferencia real/imaginado con dos carriles. Añadir "model bias" como error que se acumula al imaginar. Anotar inspector con prediccion vs realidad. |
| 3.5 World Model RNN | `vis_wm_memoria.svg`, `dg_wmrnn.svg`, `dg_lstm.svg`, `gridcard_worldModelRecurrente.svg`, `app_worldmodel_rnn.jpg` | Simplificar LSTM: memoria util vs memoria inutil en tarea casi markoviana. Infografia de resultado negativo honesto: mas complejidad, menos rendimiento. |
| 3.6 Los cinco cara a cara | `vis_taxonomia.svg`, `dg_actorcritico.svg`, `dg_onoff.svg`, `comparativa_dashboard.jpg`, `vis_ficha_cinco.svg`, `vis_eleccion.svg` | Rehacer como "mapa de familias" unico: valor/politica, on/off-policy, model-free/model-based. Añadir matriz de decision: si buscas estabilidad, eficiencia, interpretabilidad, etc. |
| 4.1 Veredicto | `m_eficiencia.png`, `m_convergencia.png`, `comparativa_dashboard.jpg`, `v2/f2_curvas.png`, `v2/f4_dificultad.png` | Replottear todas con estilo editorial blanco, anotaciones y lectura guiada. Añadir una grafica maestra tipo small multiples: algoritmo x presupuesto x test. |
| 4.2 Ablacion | `m_ablacion.png`, `grid_dqn.jpg` | Replottear ablacion como "que ingrediente sostiene el puente". Grid search deberia ser captura anotada o reemplazada por matriz simplificada con leyenda de ruido experimental. |
| 4.3 Como se midio | `vis_protocolo_sello.svg`, `rejilla_entornos.jpg`, `flujo_datos.jpg`, heatmaps, `m_semillas.png`, `vis_pipeline_exp.svg` | Capitulo clave para infografias. Hacer protocolo congelado como pipeline formal. Mejorar rejilla de entornos, flujo de datos y heatmaps con explicacion de escala. Añadir checklist de reproducibilidad. |
| 4.4 Jugar | `vis_curvas_galeria.svg`, `v2/app_jugar.png`, `panel_juego.jpg`, `panel_algoritmo.jpg`, `panel_controles.jpg`, `app_intro_2.jpg` | Mantener capturas, pero anotarlas. Añadir guia visual "que mirar cuando juegas": tablero, selector, velocidad, curvas, conceptos, replay. |
| 5.1 Cierre | `vis_arco_final.svg`, `vis_lecciones_finales.svg`, `vis_glosario_mapa.svg`, `vis_codigo_resultado.svg` | Rehacer como cierre editorial: arco completo, cuatro lecciones, glosario como mapa mental, reproducibilidad del repo a las figuras. Añadir poster final de una pagina. |

## Imagenes que mantendria, pero anotaria

- Capturas de app: `app_intro_1.jpg`, `app_intro_2.jpg`, `app_dqn.jpg`, `app_ppo.jpg`, `app_sac.jpg`, `app_worldmodel.jpg`, `app_worldmodel_rnn.jpg`, `v2/app_jugar.png`.
- Inspectores: `inspector_dqn.jpg`, `inspector_ppo.jpg`, `inspector_sac.jpg`, `inspector_worldmodel.jpg`.
- Paneles UI: `panel_juego.jpg`, `panel_algoritmo.jpg`, `panel_controles.jpg`, `comparativa_dashboard.jpg`.

Accion: no reemplazarlas por dibujos; crear versiones anotadas con llamadas numeradas y leyenda. Son evidencia de producto real.

## Imagenes que reemplazaria primero

Alta prioridad por baja calidad pedagogica o solapamiento:

- `transicion.jpg`: demasiado estrecha; sustituir por infografia completa de transicion.
- `dg_*`: rehacer como infografias mas narrativas, especialmente `dg_paradigmas.svg`, `dg_bellman.svg`, `dg_epsilon.svg`, `dg_gradiente.svg`, `dg_dqn.svg`, `dg_sac.svg`, `dg_dyna.svg`, `dg_lstm.svg`.
- `gridcard_*`: convertir en fichas de algoritmo mas ricas y consistentes.
- Duplicados conceptuales: `vis_v_q.svg` + `dg_valor.svg`; `vis_loss_gradiente.svg` + `dg_gradiente.svg`; `vis_transicion_atomo.svg` + `transicion.jpg`.
- Graficas metricas `m_*`: replottear con estilo comun y anotaciones.

## Imagenes o infografias que faltan

Transversales:

- Una infografia-resumen blanca tipo panel al final de cada capitulo/seccion.
- Una mini-infografia de "que mirar" antes de cada grafica importante.
- Una version anotada de cada captura de app o inspector.
- Un sistema visual fijo para estados, acciones, recompensas, politica, valor, replay, red objetivo, modelo del mundo y evaluacion.

Por contenido:

- "Tensor que ve el agente": 6 cinemáticos + matriz 8x10 + salida por accion.
- "Una partida como timeline": pasos, rebotes, ladrillos, muerte, timeout, done.
- "Reward hacking en Arkanoid": sobrevivir mucho no equivale a limpiar.
- "Split sin fuga": train/valid/test/OOD como bolsas fisicamente separadas.
- "Del 0 al 91": timeline causal de formulacion, no solo barra de resultado.
- "Plantilla de algoritmo": para DQN/PPO/SAC/WM/WMRNN con las mismas ranuras.
- "Model bias": como una prediccion ligeramente mala se acumula en mundos imaginados.
- "Colapso por semilla": por que reportar la mejor ejecucion engaña.
- "Checklist de reproducibilidad": frozen hash, semillas, presupuesto, greedy, ledger, scripts.
- "Poster final": todo el proyecto en una pagina blanca.

## Fases recomendadas

1. **Parte 0 completa**: terminar 0.2 y rehacer 0.3 para fijar el lenguaje visual.
2. **Parte I**: recontar la historia problema -> diagnostico -> receta -> conquista con infografias potentes.
3. **Fundamentos**: consolidar diagramas `dg_*` y eliminar duplicados conceptuales.
4. **Algoritmos**: aplicar una plantilla comun a DQN, PPO, SAC, WM y WMRNN.
5. **Medicion**: replottear graficas desde resultados y hacer el capitulo de protocolo muy visual.
6. **Cierre**: poster final, glosario visual y ruta reproducible.

## Criterio de aceptacion

Una figura entra en la version Codex si cumple al menos una de estas funciones:

- Permite entender algo sin leer dos parrafos.
- Evita una confusion frecuente.
- Hace visible una relacion causal.
- Enseña como leer una metrica.
- Resume un capitulo de forma memorable.
- Da evidencia real del laboratorio.

Si una imagen solo decora o repite texto, se elimina o se convierte en una figura con funcion.
