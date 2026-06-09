# Auditoria pedagogica y sistema visual Codex

Base revisada: `docs/report_v3.html`.

Inventario objetivo:

- 28 secciones/capitulos.
- 113 figuras referenciadas.
- El documento ya usa una estructura pedagogica fuerte: pregunta inicial, cajas de lectura, mini-ejemplos, autocomprobacion y bloque experto.
- El riesgo principal no es falta de contenido, sino exceso de densidad y falta de una interfaz visual uniforme que guie siempre igual al lector junior.

## Veredicto general

El texto es razonablemente lineal: casi siempre empieza por escena/intucion, pasa a concepto, traduce a Arkanoid, muestra mini-ejemplo y cierra con lectura critica. Eso esta bien.

Lo que mejoraria para un ingeniero junior no experto:

1. **Anclas visuales recurrentes**. Conceptos que vuelven muchas veces (`estado`, `accion`, `recompensa`, `exito`, `test`, `semilla`, `greedy`, `Q`, `pi`, `gamma`) deberian tener siempre el mismo icono/badge/color. Ahora el lector debe recordarlos por texto.
2. **Respiracion en capitulos densos**. Hay capitulos muy largos y ricos (`1.5`, `1.6`, `2.7`, `3.1`, `3.3`, `3.4`, `3.5`) que son lineales, pero pueden agotar. Necesitan mapas intermedios y fichas de checkpoint.
3. **Plantilla comun para algoritmos**. DQN, PPO, SAC, World Model y WM-RNN explican cosas equivalentes con formas visuales distintas. Para un junior, una plantilla fija reduciria carga cognitiva.
4. **Separar teoria, implementacion y evidencia**. Muchos capitulos mezclan concepto, codigo, resultado y limitacion. Es correcto, pero cada plano deberia estar senalizado igual en todos los capitulos.
5. **Graficas con lectura integrada**. Varias graficas tienen buena informacion, pero el lector junior necesita ver dentro de la figura que mirar primero, que comparar y que conclusion NO sacar.
6. **Cierre visual por capitulo**. El `takeaway` textual ayuda, pero una ficha-resumen blanca por capitulo fijaria la idea y haria la guia mas visual.

## Huecos pedagogicos transversales

Estas explicaciones deberian aparecer como piezas estables y reutilizables:

- **Mapa de notacion minima**: `s`, `a`, `r`, `s'`, `done`, `gamma`, `Q`, `V`, `pi`, `epsilon`, `alpha`. Una ficha temprana y badges repetidos.
- **Estado real vs observacion vs tensor**: que existe en el juego, que recibe el agente y que entra en la red.
- **Recompensa vs exito vs retorno**: tres numeros distintos que un junior puede confundir.
- **Validacion vs test vs OOD**: que decisiones permite cada conjunto y que afirmaciones permite cada resultado.
- **Semilla, media, dispersion y colapso**: por que una run no basta.
- **Greedy vs entrenamiento con exploracion**: por que se evalua sin ruido aunque se entrene explorando.
- **Familias de algoritmos**: valor, politica, actor-critico, model-based, on-policy/off-policy.
- **Arquitectura de entrada/salida**: 86 entradas, dos ramas, salida segun algoritmo.
- **Protocolo congelado**: frozen hash, presupuesto, seeds, splits, ledger.

## Auditoria por seccion

| Seccion | Linealidad para junior | Ampliaciones textuales recomendadas | Visuales/infografias que encajan |
|---|---|---|---|
| 0.2 Como leer esta guia | Buena, pero el original explica el contrato con mucho texto. | Reducir carga y convertir en rutas: entender, construir, auditar. | Ya probado en `report_v3_version_codex.html`: mapa de rutas, herramientas, carriles, pacto de honestidad, ficha final. |
| 0.3 El mapa del laboratorio | Buena introduccion, pero mezcla mapa del libro, personajes, resultado y DeepMind. | Añadir una "leyenda de personajes" antes de usar tantos terminos. Explicar que 91% es headline condicionado, no promesa universal. | Mapa del viaje completo; captura de app anotada; ficha "quien es quien"; infografia 0% -> 91% causal. |
| 1.1 Aprender por consecuencias | Muy lineal, pero larga y con muchos conceptos base. | Antes del bucle, añadir "lo minimo que debes saber". Separar estado/accion/recompensa de retorno, que aparece al final para expertos. | Tira de viñetas del bucle; humano vs tensor; mapa supervisado/no supervisado/RL con ejemplos. |
| 1.2 Sobrevivir no es resolver | Pedagogicamente fuerte. Riesgo: el 56% y recompensa/exito aparecen varias veces. | Añadir definicion visual de proxy/objetivo. Reforzar que "sobrevivir" no es malo, solo insuficiente. | Infografia reward hacking; curva proxy vs exito; lleno vs disperso con trayectorias de bola. |
| 1.3 El examen de niveles no vistos | Lineal y riguroso, pero introduce muchos terminos de evaluacion. | Añadir tabla breve "que decision permite cada split". Explicar OOD con analogia sencilla antes de nombres tecnicos. | Pipeline generador -> train/val/test/OOD; ejemplo de fuga de datos; ficha de protocolo de evaluacion. |
| 1.4 El primer intento: agente ciego | Buena historia, pero se apoya mucho en contexto historico y numeros. | Marcar claramente "que veia" y "que no veia" antes de entrar en DeepMind. | Escena con venda: humano/tablero vs agente/6 numeros; trampa del 56% como fisica, no inteligencia. |
| 1.5 Tres muros | Es uno de los mejores capitulos, pero muy denso. | Dividir en micro-checkpoints tras cada muro: sintoma, causa, arreglo. El lector junior necesita no perder cual muro explica que fallo. | Panel diagnostico clinico; reloj imposible; shaping como balanza; observacion ciega como techo de informacion. |
| 1.6 La receta que desbloquea | Lineal, pero muchos ingredientes acoplados. | Añadir "receta completa antes de detalle" y repetir que los ingredientes no son independientes. | Arquitectura de solucion; antes/despues de formulacion; red de dos ramas mas pedagogica; receta causal. |
| 1.7 La primera conquista | Clara, pero podria cerrar Parte I con mas fuerza visual. | Añadir una recapitulacion textual de los tres fallos y los cinco arreglos antes del salto 0->91. | Doble panel narrativo; resumen de Parte I; ficha "que demuestra / que no demuestra". |
| 2.1 Bucle agente-entorno | Lineal, pero la transicion se puede hacer mucho mas visual. | Añadir una "tupla leida como frase": en estado s, accion a, pasa r y s'. | Sustituir `transicion.jpg`; timeline de episodio; mapa de `done`. |
| 2.2 MDP/POMDP | Bien estructurado, pero Markov/POMDP puede ser abstracto. | Introducir "estado completo" y "observacion parcial" con lenguaje de juego antes de formula. | Ventana de observacion; MDP vs POMDP como dos tableros; dado cargado conectado a rebotes. |
| 2.3 Recompensa, retorno y descuento | Bastante lineal. | Explicar "gamma como miopia" antes de formula. Añadir mini-tabla de horizontes para gamma. | Monedas futuras que se desvanecen; curva gamma con horizonte visual. |
| 2.4 Valor y Bellman | Correcto pero con muchas figuras solapadas. | Dividir en cuatro pasos fijos: prediccion actual, premio inmediato, futuro estimado, sorpresa TD. | Una gran infografia V/Q -> Bellman -> TD-error; ejemplo numerico en tarjetas. |
| 2.5 Exploracion/explotacion | Lineal, pero epsilon, politica estocastica y entropia son tres lentes distintas. | Añadir "tres formas de hablar de incertidumbre" antes de entrar en cada una. | Panel de control de exploracion; epsilon decay replotteado; distribuciones de politica lado a lado. |
| 2.6 Replay y redes objetivo | Buena analogia, pero podria distinguir mejor datos y blanco. | Explicar que replay arregla datos correlacionados y red objetivo arregla blanco movil como dos problemas separados. | Dos carriles de estabilidad; buffer barajado; diana lenta con Polyak. |
| 2.7 Redes neuronales para jugar | Muy denso para junior. | Insertar preambulo "de numero suelto a imagen 8x10". Separar neurona, MLP, convolucion y arquitectura final con checkpoints. | Arquitectura completa blanca; zoom kernel 3x3; tensor de entrada 6+80; ficha de sesgo espacial. |
| 2.8 Entrenar una red | Lineal. Riesgo: el lector espere que loss baje siempre. | Reforzar pronto que en RL las distribuciones cambian, por eso las curvas no son como supervisado puro. | Prediccion -> perdida -> gradiente -> pesos; señales de salud del entrenamiento. |
| 3.1 DQN | Muy completo, pero largo. | Aplicar plantilla de algoritmo. Añadir "DQN en una frase" y "piezas heredadas" al principio. | Ficha algoritmo; pipeline DQN; inspector anotado; curva anotada; resumen final. |
| 3.2 PPO | Bastante lineal. | Explicar ratio antes de clip con una analogia de cambio de opinion. Señalar que on-policy implica tirar datos por estabilidad. | Actor-critico; clip como carril de seguridad; inspector anotado; ficha final. |
| 3.3 SAC | Denso: muchas redes y dos variantes. | Añadir mapa de redes antes de formulas. Separar SAC-pure y SAC-hybrid de forma muy visible. | Termostato alfa; cinco redes como tablero; comparativa pure/hybrid; ficha final. |
| 3.4 World Model | Buena intuicion, pero model bias necesita mas preparacion. | Explicar "maqueta util pero imperfecta" antes de hablar de techo. | Real vs imaginado en dos carriles; error acumulado; inspector prediccion/realidad anotado. |
| 3.5 WM-RNN | Lineal, pero LSTM puede ser excesivo. | Explicar por que "memoria" parece buena idea antes de decir que no ayuda. Añadir que negativo tambien enseña. | Memoria util vs inutil; LSTM simplificada; resultado negativo honesto. |
| 3.6 Los cinco cara a cara | Buena comparacion, pero faltan ranuras visuales comunes. | Añadir "tres preguntas para clasificar cualquier algoritmo" como interfaz estable. | Mapa de familias unico; matriz de decision; ficha de cinco algoritmos homogénea. |
| 4.1 Veredicto | Conceptualmente fuerte, pero graficas requieren alfabetizacion. | Antes de cada grafica, decir eje x/eje y/que significa una banda/que significa colapso. | Graficas replotteadas con anotaciones; small multiples por presupuesto/test; resumen de veredicto. |
| 4.2 Ablacion | Muy buena historia causal. | Reforzar que una ablacion no es "probar todo", sino quitar una pieza de una receta congelada. | Puente sostenido por ingredientes; barra de ablacion replotteada; grid search como matriz simplificada. |
| 4.3 Como se midio | Lineal y esencial, pero es el capitulo que mas necesita visualizacion. | Añadir checklist de confianza antes de detalles. Explicar escalas de heatmaps antes de compararlas. | Protocolo congelado; flujo ledger; heatmaps anotados; checklist reproducible. |
| 4.4 Jugar | Claro, pero muchas capturas de UI pueden saturar. | Añadir "que mirar cuando abres la app" y despues ir panel por panel. | Capturas anotadas; guia de lectura de curvas; mapa de controles. |
| 5.1 Cierre | Buen cierre, pero podria ser mas editorial. | Separar lecciones, glosario, codigo y referencias en bloques mas navegables. | Poster final blanco; glosario visual; ruta reproducible repo -> ledger -> figuras -> libro. |

## Como encaja esto con el plan de imagenes

El plan de imagenes debe salir de esta auditoria, no al reves:

1. Si falta una explicacion base, primero se añade una pieza textual corta o una caja "Antes de seguir".
2. Si la explicacion existe pero es abstracta, se añade una infografia conceptual.
3. Si la explicacion existe y hay datos, se replottea o anota la grafica.
4. Si la explicacion es sobre producto real, se conserva la captura y se anota.
5. Cada capitulo cierra con una ficha-resumen blanca para consolidar.

Prioridad visual ajustada:

- **Parte 0 y Parte I**: maxima prioridad narrativa. Aqui se decide si el junior entiende la tesis.
- **Parte II**: maxima prioridad conceptual. Aqui se consolidan notacion y mecanismos.
- **Parte III**: prioridad de homogeneidad. Todos los algoritmos deben tener la misma interfaz.
- **Parte IV**: prioridad de lectura de datos. Graficas y protocolo deben ser impecables.
- **Parte V**: prioridad editorial. Cierre visual memorable.

## Interfaz homogénea de capitulos

Para que no parezca una feria de colores, propongo un sistema fijo.

### Paleta funcional

Usar pocos colores, siempre con el mismo significado:

- Azul: intuicion, ruta de lectura, idea base.
- Cian: traduccion a Arkanoid, estado/accion/juego.
- Violeta: mecanismo tecnico, formula, red, algoritmo.
- Verde: evidencia, resultado, test, reproducibilidad.
- Ambar: que mirar, advertencia suave, lectura de grafica.
- Rojo: error comun, trampa conceptual, resultado negativo critico.
- Gris/pizarra: limites, experto, reproducibilidad formal.

Todas las infografias nuevas:

- Fondo blanco (`fondo blanco` como regla buscable de estilo).
- Tarjetas con borde suave.
- Un unico color dominante por funcion, no por decoracion.
- Sin degradados llamativos ni fondos oscuros.
- Misma tipografia del informe.
- Titular interpretativo arriba, no solo nombre tecnico.

### Anatomia comun de un capitulo conceptual

1. **Pregunta inicial**: problema que resolvera el capitulo.
2. **Mapa de la idea**: una infografia blanca de apertura si el concepto tiene varias piezas.
3. **Intuicion**: escena o analogia.
4. **Mecanismo**: definicion y formula, siempre con "Antes de la formula".
5. **Traduccion a Arkanoid**: como aparece en el proyecto.
6. **Mini-ejemplo**: un caso numerico o una transicion.
7. **Que no demuestra / Error comun**: una sola trampa central.
8. **Ficha-resumen final**: idea, mecanismo, metricas, error comun, frase.

### Anatomia comun de un capitulo de algoritmo

Cada algoritmo deberia tener exactamente estas ranuras visuales:

1. **Ficha de identidad**: familia, que aprende, on/off-policy, usa replay, usa modelo, resultado headline.
2. **Diagrama mental**: que problema resuelve y que intuicion lo guia.
3. **Pipeline de entrenamiento**: datos -> buffer/rollout -> red -> perdida -> actualizacion.
4. **Inspector anotado**: que mirar en la interfaz real.
5. **Curva anotada**: que significa aprender, estancarse o colapsar.
6. **Resultado honesto**: test, OOD, semillas, colapsos.
7. **Ficha-resumen final**: cuando usarlo, cuando no, que nos enseño.

### Anatomia comun de un capitulo de medicion

1. **Pregunta estadistica**: que afirmacion queremos defender.
2. **Protocolo visual**: splits, semillas, presupuesto, greedy, ledger.
3. **Grafica principal anotada**: ejes, lectura, conclusion.
4. **Control de trampas**: que sesgo evita el protocolo.
5. **Resultado y limite**: que demuestra y que no demuestra.
6. **Ficha-resumen final**: metrica, condicion, caveat, siguiente pregunta.

### Componentes visuales reutilizables

- Badge de variable: `s`, `a`, `r`, `s'`, `done`, `Q`, `V`, `pi`, `gamma`.
- Badge de evaluacion: `TRAIN`, `VALID`, `TEST-ID`, `OOD-patron`, `OOD-dificultad`.
- Badge de evidencia: `5 semillas`, `greedy`, `1.5M`, `frozen_hash`.
- Tarjeta de error comun.
- Tarjeta de "que mirar".
- Tarjeta de "que no demuestra".
- Ficha-resumen blanca.
- Captura anotada con numeros y leyenda lateral.
- Grafica con llamada interpretativa integrada.

## Cambios textuales prioritarios antes de producir imagenes

1. Añadir al inicio de Parte 0 o 0.3 una ficha "notacion minima del libro".
2. Añadir una ficha "como leer una cifra" antes de empezar resultados.
3. Añadir preambulos cortos en capitulos densos:
   - `1.5`: "los tres muros en una frase".
   - `1.6`: "la receta completa antes de los ingredientes".
   - `2.7`: "de tensor a accion".
   - `3.1` a `3.5`: "este algoritmo en una frase".
   - `4.1`: "como leer las graficas de resultados".
4. Reducir duplicaciones textuales donde una infografia pueda asumir parte de la carga.
5. Sustituir cierres largos por ficha-resumen + takeaway breve.

## Decision final

Si queremos que un junior lo entienda todo, el documento no necesita solo mejores imagenes. Necesita una **interfaz pedagogica estable**:

- Misma ruta de lectura.
- Misma paleta funcional.
- Misma plantilla por tipo de capitulo.
- Misma forma de leer numeros.
- Misma ficha-resumen final.

Con esa base, el plan de imagenes encaja mejor: no se trata de cambiar 113 figuras una a una, sino de convertirlas en un sistema visual coherente.
