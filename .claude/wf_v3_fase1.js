export const meta = {
  name: 'v3-fase1-historia-fundamentos',
  description: 'V3 libro: redacta Parte 0 + I (historia) + II (fundamentos) como fragmentos HTML pedagógicos',
  phases: [
    { title: 'Redactar', detail: 'un agente por capítulo, coreografía + hoja de datos' },
    { title: 'Pulir', detail: 'auto-revisión: honestidad, cajas, HTML válido' },
  ],
}

// ────────────────────────────────────────────────────────────────────────
// HOJA DE DATOS (solo números REALES; los agentes no deben inventar nada)
// ────────────────────────────────────────────────────────────────────────
const FACTS = [
  'TAREA: Arkanoid/Breakout. Rejilla 8x10 = 80 ladrillos. 3 acciones discretas (izquierda, mantener, derecha).',
  'ESTADO actual (con vision): 86 numeros = 6 cinematicos (pelota x,y; velocidad vx,vy; pala x; distancia pelota-pala) + matriz de ocupacion 8x10 (80 celdas, 1=ladrillo vivo / 0=hueco).',
  'RECOMPENSA: +1.0 por ladrillo roto (+0.5 de bonus por cada ladrillo extra de un combo sin tocar la pala); +0.2 por rebote con la pala; -1.0 por perder la bola; +5.0 por limpiar el nivel.',
  'TIMEOUT proporcional: 90 pasos por ladrillo -> 7200 en la rejilla 8x10.',
  'ERA CIEGA (primer intento, historico): observacion de solo 6 cinematicos (SIN ladrillos); rejilla 4x7 = 28 ladrillos; timeout CONSTANTE de 600 pasos. Resultados: 0% en niveles dispersos, ~2/28 ladrillos rotos, ~56% de "exito" SOLO en rejilla LLENA (supervivencia degenerada: una bola rebotando ~2200 pasos toca casi todo por fisica, no por punteria).',
  'DEEPMIND (contexto externo, NO es nuestro resultado): DQN aprendio 49 juegos de Atari (Breakout entre ellos) mirando los pixeles, con ~50 millones de fotogramas por juego (~38 dias de partidas continuas), red convolucional, Nature 2015.',
  'ARQUITECTURA (red de DOS ramas): la matriz 8x10 entra en un encoder CONVOLUCIONAL (filtros 16 y 32); los 6 cinematicos entran por una rama DENSA; se CONCATENAN -> 128 -> 128 (ReLU) -> salida. Salida segun algoritmo: DQN y World Model = 3 valores Q(s,a); PPO y SAC = actor con 3 probabilidades + critico con 1 valor.',
  'DQN: Double DQN, perdida de Huber, red objetivo con soft update tau=0.01, replay 100.000, lote 128, epsilon 1.0->0.05 en 25.000 pasos, gamma=0.99. Off-policy, basado en valor. Objetivo de Bellman: r + gamma*(1-done)*Q-objetivo(s-prima, argmax_a Q(s-prima,a)).',
  'PPO: actor-critico, ON-policy. Rollout de 256 pasos por entorno, 4 epocas, minibatch 1024, clip epsilon=0.2 (mantiene el ratio en la banda [0.8,1.2]), GAE lambda=0.95, coef. valor 0.5, coef. entropia 0.01.',
  'SAC (discreto): actor + 2 criticos + 2 redes objetivo; marco de maxima entropia; off-policy. replay 100.000, lote 128; temperatura alpha APRENDIBLE (arranca en 0.20); entropia objetivo 0.55*log(3) ~= 0.60; tau=0.01. Se reportan SEPARADAS dos variantes: SAC-pure (actor puro) y SAC-critic-hybrid.',
  'WORLD MODEL (Dyna-Q): model-based. Q-net identico al de DQN + un modelo de dinamica (red 200x200) que predice (incremento Delta-s, recompensa r, done); s = s + Delta-s. Planning: 5 transiciones IMAGINADAS por cada paso real. Arranque del modelo a las 1.000 experiencias, del Q-net a las 2.000. Calidad del modelo = error RMSE.',
  'WORLD MODEL RNN: como el World Model pero el modelo de dinamica es un LSTM (estado oculto de 128), entrenado con SECUENCIAS de 16 pasos, 32 por lote, buffer de 256 episodios. HALLAZGO (negativo y honesto): el LSTM NO mejora al World Model normal en esta tarea.',
  'PROTOCOLO CONGELADO: frozen_hash=a1ab7ce18d7bad6b; framework torch 2.12.0 + numpy 2.4.4 + py3.13 sobre MPS (Apple M3 Ultra); 5 semillas [0,1,2,3,4]; presupuestos 700k / 1.5M / 3M pasos; evaluacion GREEDY; "colapso" = una semilla por debajo del 10% de exito. 160 runs reales en results/ledger.csv. NUNCA se re-congela.',
  'NIVELES: generador procedural; familias = {dispersion, filas, columnas, bloque, simetrico}; repartidas en conjuntos DISJUNTOS train / validacion / test. Conjuntos de test: TEST-ID (mismo tipo de patron visto), OOD-patron (patrones no vistos), OOD-dificultad (densidades no vistas). Hay un oraculo de "limpiabilidad" que descarta niveles imposibles.',
  'RESULTADOS T1 (TEST-ID, evaluacion greedy a 1.5M pasos, MEDIA de 5 semillas). Columnas: TEST-ID, OOD-patron, OOD-dificultad, tramo 60-80 ladrillos, % colapsos, % de semillas >80, pasos para limpiar. ',
  '  PPO: 91, 89, 86, 85, 0%, 100%, 1923 -> el mejor y el mas fiable.',
  '  SAC-pure (actor): 87, 84, 68, 62, 0%, 80%, 2732 -> el actor SI funciona.',
  '  DQN: 77, 74, 64, 65, 0%, 80%, 2125 -> necesita presupuesto; estable.',
  '  SAC-critic-hybrid: 61, 60, 51, 54, 20%, 40%, 1716 -> bimodal: a veces colapsa.',
  '  World Model (Dyna-Q): 55, 53, 42, 44, 0%, 0%, 1977 -> techo ~55%.',
  '  World Model RNN: 35, 29, 27, 22, 0%, 0%, 1370 -> no-monotono; el LSTM no ayuda.',
  'PRESUPUESTO (exito a 700k / 1.5M / 3M): PPO 90/91/87 (ya aprende a 700k; el mas sample-efficient). SAC-pure 25/87/91 (despega entre 700k y 1.5M). SAC-hybrid 4/61/88 (dependencia brutal del presupuesto). DQN 67/77/85 (mejora monotona). World Model 33/55/56 (techo ~55%). WM-RNN 54/35/40 (no-monotono, alta varianza).',
  'ABLACION T2 (se parte de la receta completa con DQN = 77% y se quita UN ingrediente): ',
  '  Escala de los ladrillos 1.0 -> 0.25: cae a 1% (Delta -76,5), 100% colapsos -> INGREDIENTE CRITICO.',
  '  Timeout proporcional -> constante: 54% (Delta -23,5).',
  '  Encoder conv -> lista plana (MLP): 57% (Delta -20,4) -> el sesgo espacial vale ~20 puntos.',
  '  epsilon-decay rapido -> lento: 75% (Delta -2,6).',
  '  Sin curriculo: 75% (Delta -1,9).',
  '  Sin shaping Phi: 85% (Delta +8,0) -> QUITARLO MEJORA: Phi saboteaba el objetivo.',
  'INVERSION HISTORICA: en la era antigua (rejilla pequena, lista plana) bajar la escala a 0.25 DESBLOQUEO el aprendizaje; con el encoder conv, esa misma escala 0.25 lo MATA. El ingrediente optimo depende de la arquitectura.',
  'TESIS CENTRAL (mantenerla siempre): el problema NO se desbloqueo por cambiar de algoritmo ni por entrenar mas, sino por FORMULAR bien la tarea: reloj justo (timeout proporcional), meta limpia (quitar el shaping Phi), observacion con ladrillos (matriz 8x10), escala de senal adecuada, encoder convolucional, curriculo sobre niveles generados y evaluacion honesta sobre niveles NO vistos.',
].join('\n')

// ────────────────────────────────────────────────────────────────────────
// SPEC de estilo (coreografia + vocabulario de clases + honestidad)
// ────────────────────────────────────────────────────────────────────────
const SPEC = [
  'Eres redactor tecnico-pedagogico del libro "Arkanoid DRL Learning Lab" (Version 3). Escribes en espanol de Espana, con tono tecnico, natural y claro. Nada de marketing ni de "como se ve claramente". Las analogias son breves y SIEMPRE vuelven al concepto tecnico.',
  '',
  'HONESTIDAD (critico): usa SOLO numeros, resultados e hiperparametros de la HOJA DE DATOS. NUNCA inventes cifras. Si te falta un dato concreto, describelo cualitativamente sin numero. Distingue siempre: recompensa vs exito; validacion vs test; una semilla vs la media de 5. No ocultes los resultados negativos (el LSTM del WM-RNN no mejora; el shaping Phi saboteaba): conviertelos en aprendizaje.',
  '',
  'COREOGRAFIA del capitulo (usala como guia, no fuerces los 9 pasos si alguno no aplica): (1) pregunta o problema concreto que abre el capitulo; (2) intuicion o escena de Arkanoid; (3) concepto tecnico con su definicion y variables; (4) traduccion al juego (estado, accion, recompensa, matriz 8x10, red, buffer, evaluacion); (5) mini-ejemplo guiado (un calculo, una transicion o una lectura paso a paso); (6) implementacion en pseudocodigo o idea de codigo, SOLO si aplica y SOLO despues de la idea; (7) resultado observado con su metrica y sus limites, si aplica; (8) lectura critica (que significa y que NO significa); (9) autocomprobacion.',
  '',
  'FORMATO DE SALIDA: devuelve EXCLUSIVAMENTE el cuerpo HTML del capitulo (lo que va dentro de <div class="pad">). NO incluyas <html>, <head>, <body>, <section>, <style>, ni el <h2> del titulo: el marco, el titulo y la banda de color los anado yo. Empieza directamente por el contenido (idealmente una <p class="pregunta">). No uses estilos inline.',
  '',
  'VOCABULARIO DE CLASES (usa SOLO estas; no inventes clases):',
  ' - <p class="pregunta">...</p>  -> la pregunta/problema que abre el capitulo (una sola, al principio).',
  ' - <h3 class="sub">Subtitulo</h3>  -> secciones internas.',
  ' - <p>...</p> texto; <b>...</b> negrita; <i>...</i> enfasis; <span class="mono">simbolo</span> para variables/formulas en linea; <span class="term">termino</span> al introducir un termino nuevo.',
  ' - <div class="formula">ecuacion centrada</div>  -> una formula destacada.',
  ' - <div class="defs"><dt>Concepto</dt><dd>definicion</dd> ...</div>  -> lista de definiciones.',
  ' - <table class="compare"><tr><th>...</th>...</tr> ...</table>  -> tablas (precede de una caja "Que mirar" y sigue de una lectura).',
  ' - CAJAS, cada una con la forma  <div class="caja caja-XXX"><div class="ch">Etiqueta</div> ...cuerpo... </div> :',
  '     caja-formula  (Etiqueta: "Antes de la formula")  -> explicacion verbal de que calcula la formula, ANTES de mostrarla.',
  '     caja-juego    (Etiqueta: "Traduccion al juego")  -> como se ve el concepto en Arkanoid.',
  '     caja-error    (Etiqueta: "Error comun")          -> la interpretacion equivocada tipica.',
  '     caja-mirar    (Etiqueta: "Que mirar")            -> guia de lectura de una grafica o tabla.',
  '     caja-limite   (Etiqueta: "Que no demuestra")     -> limites del resultado.',
  '     caja-curiosos (Etiqueta: "Para curiosos")        -> formalismo, paper o detalle avanzado opcional.',
  ' - <div class="takeaway"><div class="t">Quedate con esto</div><div class="bd">...</div></div>  -> mini-conclusion al final.',
  ' - <div class="autocheck"><div class="ch">Autocomprobacion</div><ol><li>...</li><li>...</li><li>...</li></ol></div>  -> 3 preguntas cortas.',
  ' - <div class="ejercicio"><div class="ch">Ejercicio</div> enunciado; <b>Pista:</b> ...; <b>Respuesta:</b> ... ; y una frase de que significa para el agente.</div>',
  '',
  'IMAGENES: solo puedes usar <figure><img src="assets/NOMBRE"/><figcaption>...</figcaption></figure> con las imagenes que se te indiquen como disponibles en el capitulo. Si no se indica ninguna, NO pongas imagenes (no inventes <img>). El pie de figura debe INTERPRETAR, no solo describir.',
  '',
  'SIMBOLOS: usa con normalidad gamma, epsilon, alpha, lambda, tau, pi, Sigma, ->, <-, y subindices/superindices con <sub>/<sup>. Variables clave: Q(s,a), V(s), pi(a|s), r, gamma, s, a, s prima, done.',
  '',
  'PROFUNDIDAD: escribe con densidad de LIBRO, no de resumen. No te quedes corto: desarrolla, ejemplifica y explica. Es preferible denso y bien explicado que breve.',
].join('\n')

const CHECKLIST = [
  'Revisa el capitulo HTML contra este checklist y devuelve una version MEJORADA del cuerpo (mismo formato, solo el contenido de .pad):',
  '- Empieza con una pregunta/problema concreto (<p class="pregunta">).',
  '- La primera definicion tecnica llega DESPUES de una intuicion.',
  '- Hay al menos un ejemplo concreto de Arkanoid y, si aplica, un mini-calculo numerico.',
  '- Hay una caja-error (error comun) y una mini-conclusion (takeaway) y una autocomprobacion (3 preguntas).',
  '- HONESTIDAD: cada numero coincide con la HOJA DE DATOS; corrige o elimina cualquier cifra inventada; no confunde recompensa con exito ni validacion con test.',
  '- Solo usa las clases permitidas y solo imagenes realmente disponibles; sin <img> inventadas; sin <h2>/<section>/<style>; sin estilos inline.',
  '- HTML bien formado (etiquetas cerradas).',
  'Mejora la claridad y la profundidad donde flojee, pero NO recortes contenido tecnico. Devuelve solo el cuerpo HTML.',
].join('\n')

// ────────────────────────────────────────────────────────────────────────
// CAPITULOS (Parte 0 + I + II). part/color/accent -> los aplico yo al envolver.
// ────────────────────────────────────────────────────────────────────────
const P0 = { part: 'PARTE 0 · COMO LEER ESTA GUIA', band: 'b-ink', accent: '#475569', soft: '#f1f5f9' }
const P1 = { part: 'PARTE I · LA HISTORIA DEL PROBLEMA', band: 'b-cyan', accent: '#0e7490', soft: '#ecfeff' }
const P2 = { part: 'PARTE II · FUNDAMENTOS DE RL Y DEEP RL', band: 'b-violet', accent: '#7c3aed', soft: '#f4effe' }

const CHAPTERS = [
  { ...P0, id: '0.2', title: 'Como leer esta guia', tag: 'Tres niveles de lectura y el sistema de cajas.', pages: 3,
    brief: 'Capitulo META que explica el contrato de lectura del libro. Explica los tres (o cuatro) niveles de lectura: intuicion, tecnica, codigo y reproducibilidad, y que el lector junior puede seguir solo la capa de intuicion. Explica el SISTEMA DE CAJAS con una lista de definiciones (defs): que significa y cuando leer cada caja (Antes de la formula, Traduccion al juego, Error comun, Que mirar, Que no demuestra, Para curiosos), ademas de Quedate con esto, Autocomprobacion y Ejercicio. Indica que cada capitulo sigue una misma coreografia (pregunta -> intuicion -> concepto -> juego -> ejemplo -> codigo -> resultado -> lectura critica -> autocomprobacion). No necesita imagenes.', imgs: 'ninguna' },
  { ...P0, id: '0.3', title: 'El mapa del laboratorio', tag: 'Todo el recorrido de un vistazo.', pages: 2,
    brief: 'Vista de pajaro del libro y del proyecto. Explica el arco completo: la historia del problema -> los fundamentos de RL -> el laboratorio Arkanoid -> los cinco algoritmos -> la medicion y los resultados -> el codigo. Y el gran arco de resultados: de un agente CIEGO al 0% en niveles dispersos a PPO con 91% en niveles no vistos. Presenta de pasada quien es quien (agente, entorno, estado, accion, recompensa, politica, valor). Usa una lista defs para el recorrido. Sin imagenes.', imgs: 'ninguna' },

  { ...P1, id: '1.1', title: 'Aprender por consecuencias', tag: 'Que es el aprendizaje por refuerzo, con un Arkanoid.', pages: 5,
    brief: 'Entrada para lectores no especialistas. Explica RL desde cero usando Arkanoid: agente, entorno, accion, recompensa, episodio y el bucle (estado -> accion -> recompensa -> siguiente estado -> repetir). Incluye un MINI-ESCENARIO de unos 10 pasos: en cada paso, que ve el agente, que accion toma, que recompensa recibe y que aprende. Anade una caja-juego y una tabla "lo que cree un humano" vs "lo que recibe el agente". Situa RL frente a aprendizaje supervisado y no supervisado (que dato recibe cada uno). Termina con que "aprender por consecuencias" es la idea central.', imgs: 'ninguna' },
  { ...P1, id: '1.2', title: 'Sobrevivir no es resolver', tag: 'Por que recompensa alta no es ganar.', pages: 5,
    brief: 'Capitulo puente entre narrativa y evaluacion: las metricas proxy enganan. Define cuatro niveles de exigencia crecientes: sobrevivir (devolver la bola), romper algunos ladrillos, limpiar el nivel entero y generalizar a niveles no vistos. Explica por que un agente puede tener recompensa al alza y aun asi no resolver. Usa el dato real del agente ciego (0% en dispersos, ~2/28, 56% solo en rejilla llena por fisica). Caja-error: confundir aprendizaje aparente con logro real. Es la idea mas importante del libro para un junior.', imgs: 'ninguna' },
  { ...P1, id: '1.3', title: 'El examen de los niveles no vistos', tag: 'Train, validacion y test disjuntos.', pages: 5,
    brief: 'Fija la metrica principal y la metafora del examen. Explica train / validacion / test DISJUNTOS y por que entrenar y examinar en el mismo nivel seria hacer trampa (memorizar). Define TEST-ID, OOD-patron y OOD-dificultad y la evaluacion GREEDY. Menciona el oraculo de limpiabilidad. Usa la figura de las familias de niveles. Caja-mirar para leer la idea de generalizacion. Metafora: estudiar con unos ejercicios y examinarse con otros.', imgs: 'assets/v2/puzzles_familias.svg' },
  { ...P1, id: '1.4', title: 'El primer intento: el agente ciego', tag: 'Devolvia la bola, pero no apuntaba.', pages: 6,
    brief: 'Construye el misterio narrativo. Cuenta el origen del juego (Breakout Atari 1976 -> Arkanoid Taito 1986) y el hito de DeepMind (DQN desde pixeles, ~50M fotogramas ~38 dias, Nature 2015) como contraste. Nuestra primera modelizacion: observacion MINIMA de 6 cinematicos (sin ladrillos), rejilla 4x7=28, timeout constante 600. Reconstruccion paso a paso de una partida del ciego: devuelve la bola, acumula recompensa, pero no puede ELEGIR objetivo. Separa claramente "se mueve bien" de "decide bien". Usa los datos reales (0% dispersos, ~2/28, 56% rejilla llena = trampa). Caja-juego "lo que ve el humano vs lo que ve el agente".', imgs: 'ninguna' },
  { ...P1, id: '1.5', title: 'Diagnostico: tres muros, ninguno el algoritmo', tag: 'Reloj, recompensa y observacion.', pages: 8,
    brief: 'Capitulo conceptual central. Tres muros, cada uno con la MISMA plantilla: sintoma observado -> hipotesis falsa -> prueba -> causa real -> correccion. Muro 1: reloj imposible (timeout constante 600 demasiado corto para 80 ladrillos). Muro 2: recompensa saboteadora (el shaping potencial Phi premiaba "acercarse a la bola" en vez de ganar; quitarlo MEJORA +8). Muro 3: observacion ciega (sin la matriz de ladrillos no se puede apuntar). Incluye una tabla de diagnostico clinico: sintoma -> explicacion incorrecta -> explicacion correcta. Deja claro que el algoritmo NO puede compensar una mala formulacion (correccion de la tesis anterior). Tres cajas, una por muro.', imgs: 'ninguna' },
  { ...P1, id: '1.6', title: 'La receta que desbloquea', tag: 'Cinco cambios de formulacion.', pages: 6,
    brief: 'La receta minima que convierte el problema en aprendible. Los cinco cambios, cada uno con: por que se necesitaba, que se cambio exactamente, que habria pasado si no se cambiaba. (1) timeout proporcional (90/ladrillo). (2) meta limpia (quitar Phi). (3) ojos: matriz de ocupacion 8x10. (4) encoder convolucional. (5) curriculo + generador de niveles. Enfasis especial en matriz 8x10 + conv como "ojos estructurados", y en las DOS opciones que habia para ver (A: pixeles como DeepMind; B: matriz estructurada -> elegimos B). Usa las figuras de familias de niveles y de la red de dos ramas.', imgs: 'assets/v2/puzzles_familias.svg, assets/red_conv.svg' },
  { ...P1, id: '1.7', title: 'La primera conquista', tag: 'De 0% a 91% en niveles no vistos.', pages: 5,
    brief: 'Muestra el resultado principal sin que las tablas aplasten al lector, y cierra la Parte I. Antes de la figura F1, la pregunta que responde; despues, una caja-mirar (que mirar) y una caja-limite (que no demuestra: es media multi-semilla en test, no una sola run brillante). Presenta a los CINCO algoritmos como personajes, una linea cada uno (DQN valora acciones; PPO cambia con prudencia; SAC gana sin perder variedad; World Model practica en una maqueta; WM-RNN imagina con memoria). Transicion hacia los fundamentos: "para entender por que funciona, primero el vocabulario".', imgs: 'assets/v2/f1_conquista.png' },

  { ...P2, id: '2.1', title: 'El bucle agente-entorno', tag: 'La transicion s, a, r, s-prima, done.', pages: 4,
    brief: 'Abre los fundamentos con una transicion real vista con lupa. Define estado s, accion a, recompensa r, siguiente estado s prima y done, y como se encadenan en el bucle. Muestra una transicion concreta de Arkanoid paso a paso. Explica que TODO lo que el agente sabe procede de acumular millones de estas tuplas. Caja-juego con la tupla concreta.', imgs: 'ninguna' },
  { ...P2, id: '2.2', title: 'MDP, observacion y POMDP sin asustar', tag: 'Por que el ciego tenia techo.', pages: 6,
    brief: 'Formaliza poco a poco y sin susto. Introduce el Proceso de Decision de Markov (estado, accion, transicion, recompensa) y la idea de observabilidad: cuando la observacion no contiene toda la informacion relevante, es un POMDP. Conecta con el agente ciego: su techo NO era de entrenamiento sino de INFORMACION (la matriz de ladrillos no estaba en su observacion). Caja-curiosos para el formalismo de MDP. Caja-error: "mas entrenamiento" no arregla una observacion incompleta.', imgs: 'ninguna' },
  { ...P2, id: '2.3', title: 'Recompensa, retorno y descuento', tag: 'G, gamma y el peso del futuro.', pages: 6,
    brief: 'Distingue recompensa inmediata de RETORNO (suma de recompensas futuras). Define el retorno descontado G = suma de gamma^t * r_t y explica gamma como "cuanto pesa el futuro" (cortoplacista vs previsor). Mini-ejemplo numerico con tres recompensas y dos valores de gamma. Traduce a Arkanoid (romper ahora vs colocarse para un combo). Caja-formula antes de la formula del retorno. Usa la figura del descuento.', imgs: 'assets/dg_descuento.svg' },
  { ...P2, id: '2.4', title: 'Valor y Bellman', tag: 'Q, V, target y TD-error.', pages: 7,
    brief: 'El corazon del valor. Define V(s) (valor del estado) y Q(s,a) (valor de una accion). Caja-formula ANTES de Bellman: "queremos estimar lo bueno de una accion sin simular todo el futuro". Presenta la ecuacion de Bellman y el target r + gamma*(1-done)*Q(s prima). Define el TD-error como sorpresa. Mini-calculo con r=+1, gamma=0.99 y Q futuro=3.0; y un caso con done=1 donde el futuro desaparece (factor 1-done). Conecta TD-error con el replay prioritario (aunque no se implemente de inicio). Usa la figura de Bellman.', imgs: 'assets/dg_bellman.svg' },
  { ...P2, id: '2.5', title: 'Exploracion y explotacion', tag: 'epsilon-greedy, politica estocastica, entropia.', pages: 6,
    brief: 'El dilema explorar/explotar. Explica epsilon-greedy (con probabilidad epsilon, accion al azar; el resto, la mejor conocida) y el decaimiento de epsilon 1.0->0.05 en 25.000 pasos. Distingue politica determinista de ESTOCASTICA (distribucion pi(a|s)). Introduce la entropia como medida de variedad/impredecibilidad (maximo log(3) con 3 acciones equiprobables). Mini-ejemplo comparando dos politicas con entropia baja/alta. Usa la figura de epsilon.', imgs: 'assets/dg_epsilon.svg' },
  { ...P2, id: '2.6', title: 'Replay y redes objetivo', tag: 'Por que repasar estabiliza.', pages: 6,
    brief: 'Dos piezas de estabilidad de los metodos off-policy. Replay buffer (capacidad 100.000, lotes de 128): por que muestrear experiencias antiguas al azar rompe la correlacion temporal y reutiliza datos. Red objetivo: una copia lenta que fija el target para no "perseguir la propia sombra"; soft update de Polyak con tau=0.01 (la copia se acerca un poquito cada paso). Quien las usa (DQN, SAC, World Model) y quien no (PPO, on-policy). Caja-error: usar la ultima experiencia en vez de un lote aleatorio. Sin imagen.', imgs: 'ninguna' },
  { ...P2, id: '2.7', title: 'Redes neuronales para jugar', tag: 'La red de dos ramas.', pages: 7,
    brief: 'De la neurona a la arquitectura real. Neurona (suma ponderada + sesgo + ReLU), capas, MLP. Por que la matriz 8x10 necesita una rama CONVOLUCIONAL: que es una convolucion (un filtro que se desliza por la rejilla detectando estructuras de ladrillos: bordes, huecos, columnas) y por que conserva la vecindad frente a aplanar a 80 numeros (el sesgo espacial vale ~20 puntos en la ablacion). Describe la red de DOS ramas (conv sobre 8x10 + rama cinematica de 6 -> concatenar -> 128 -> 128 -> salida). Usa las figuras de la red de dos ramas y de la neurona.', imgs: 'assets/red_conv.svg, assets/dg_neurona.svg' },
  { ...P2, id: '2.8', title: 'Entrenar una red', tag: 'Perdida, gradiente, learning rate.', pages: 5,
    brief: 'Como aprende de verdad la red. Perdida (cuanto se equivoca), descenso de gradiente (mover cada peso un poquito cuesta abajo), learning rate (tamano del paso: grande=rapido pero inestable, pequeno=lento pero estable), batch. Explica por que en RL la perdida NO tiene por que bajar siempre (el target se mueve con la propia red) y que lo importante es que NO diverja. Usa la figura del gradiente. Caja-error: creer que perdida que sube = entrenamiento roto.', imgs: 'assets/dg_gradiente.svg' },
]

// ────────────────────────────────────────────────────────────────────────
const BODY = { type: 'object', additionalProperties: false, properties: { body: { type: 'string' } }, required: ['body'] }
const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

function writePrompt(ch) {
  return SPEC + '\n\n===== HOJA DE DATOS =====\n' + FACTS +
    '\n\n===== CAPITULO A REDACTAR =====\n' + ch.id + ' — ' + ch.title +
    '\nFuncion y contenido: ' + ch.brief +
    '\nPaginas objetivo (densidad de libro): ~' + ch.pages +
    '\nImagenes disponibles: ' + ch.imgs +
    '\n\nDevuelve SOLO el cuerpo HTML (lo que va dentro de <div class="pad">), empezando por <p class="pregunta">. Respeta el vocabulario de clases y la honestidad de datos.'
}
function polishPrompt(ch, draft) {
  return SPEC + '\n\n===== HOJA DE DATOS =====\n' + FACTS +
    '\n\n===== CHECKLIST DE REVISION =====\n' + CHECKLIST +
    '\n\n===== CAPITULO (' + ch.id + ' ' + ch.title + ') — BORRADOR A MEJORAR =====\n' + draft +
    '\n\nDevuelve SOLO el cuerpo HTML mejorado.'
}
function wrapSection(ch, body) {
  return '<section class="section">\n' +
    '  <div class="band ' + ch.band + '"><div class="n">' + esc(ch.part) + ' · ' + esc(ch.id) + '</div><h2>' + esc(ch.title) + '</h2>\n' +
    '    <div class="tag">' + esc(ch.tag) + '</div></div>\n' +
    '  <div class="pad" style="--accent:' + ch.accent + ';--accent-soft:' + ch.soft + '">\n' + body + '\n  </div>\n</section>'
}

log('V3 fase 1: ' + CHAPTERS.length + ' capitulos (Parte 0 + I + II)')
const results = await pipeline(
  CHAPTERS,
  (ch) => agent(writePrompt(ch), { label: 'redactar ' + ch.id, phase: 'Redactar', schema: BODY }),
  (draft, ch) => agent(polishPrompt(ch, draft && draft.body ? draft.body : ''), { label: 'pulir ' + ch.id, phase: 'Pulir', schema: BODY }),
)
const sections = CHAPTERS.map((ch, i) => wrapSection(ch, (results[i] && results[i].body) ? results[i].body : '<p>(capitulo no generado)</p>'))
return { n: CHAPTERS.length, ids: CHAPTERS.map(c => c.id), html: sections.join('\n\n') }
