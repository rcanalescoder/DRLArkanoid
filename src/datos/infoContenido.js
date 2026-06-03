// ============================================================================
//  Contenido de los pop-ups de información rica.
//  Cada entrada se muestra en un modal con cabecera de color por categoría,
//  secciones, fórmula, ejemplo y datos reales. Objetivo: que cada elemento de
//  la interfaz se pueda entender a fondo sin salir de la app.
// ============================================================================

const COLOR = {
  Algoritmo: "#2563eb",
  Concepto: "#7c3aed",
  Métrica: "#0c9f6e",
  Dato: "#0891b2",
  Control: "#d97706",
  Interfaz: "#0891b2",
};

export const INFO = {
  // ───────────────────────── ALGORITMOS ─────────────────────────
  dqn: {
    emoji: "🎯", titulo: "DQN — Deep Q-Network", categoria: "Algoritmo",
    resumen: "Aprende cuánto vale cada acción y elige la de mayor valor.",
    secciones: [
      { h: "La idea en palabras llanas", cuerpo: "Imagina que en cada situación del juego alguien apunta, junto a cada movimiento posible, una nota: «si haces esto, a la larga ganarás aproximadamente tantos puntos». Si esas notas son fiables, jugar bien es trivial: basta elegir siempre el movimiento con la nota más alta. DQN aprende a poner esas notas a base de jugar y observar qué pasa.<br><br>Esa nota que estima la recompensa futura total de hacer la acción <span class=\"mono\">a</span> en el estado <span class=\"mono\">s</span> se denomina <b>valor Q</b>, y se escribe <span class=\"mono\">Q(s,a)</span>. La «D» de <b>Deep</b> indica que esas notas no se guardan en una tabla (habría infinitos estados posibles), sino que las produce una <b>red neuronal</b>: aprende a partir de los estados que ha visto y generaliza a situaciones nuevas parecidas." },
      { h: "Qué es el estado y qué decide", cuerpo: "La red recibe el estado del juego como un vector de <b>6 números</b> (posición y velocidad de la pelota, posición de la pala y la distancia entre ambas) y devuelve <b>3 valores Q</b>, uno por cada acción posible: mover la pala a la izquierda, mantenerla quieta o moverla a la derecha. Actuar consiste en quedarse con la acción de mayor Q. Esta forma de decidir, «elige siempre la mejor», se denomina política <b>greedy</b> (codiciosa)." },
      { h: "Cómo aprende aquí", cuerpo: "El agente no sabe las reglas del Arkanoid; las descubre jugando. Cada paso que da produce una experiencia: estaba en un estado, hizo una acción, recibió una recompensa y acabó en otro estado. Esas experiencias se guardan en una memoria llamada <b>replay buffer</b> (aquí, capacidad 100.000). Para entrenar, se sacan al azar lotes de 128 experiencias de esa memoria y se ajusta la red para que sus valores Q se acerquen al objetivo de Bellman.<br><br>El objetivo de cada experiencia es: la recompensa que se recibió ahora, más lo que la red cree que vale el futuro a partir del estado siguiente (descontado por <span class=\"mono\">γ=0.99</span>, que da algo menos de peso a lo lejano que a lo inmediato). Poco a poco, las estimaciones se vuelven coherentes entre sí y reflejan el juego real." },
      { h: "Los tres trucos que lo estabilizan", cuerpo: "Entrenar una red con su propio objetivo es delicado, porque el objetivo se calcula con la misma red que se está moviendo. DQN usa tres mecanismos para no «perseguir su propia sombra». Primero, una <b>red objetivo</b>: una copia de la red que cambia muy despacio y que fija el objetivo, de modo que no se mueve a cada paso. Segundo, <b>Double DQN</b>: separa quién <i>elige</i> la mejor acción del futuro (la red en entrenamiento) de quién la <i>evalúa</i> (la red objetivo), lo que evita inflar los valores. Tercero, la <b>pérdida de Huber</b>, que mide el error de forma robusta y no se dispara cuando una experiencia es muy sorprendente." },
      { h: "Explorar o explotar", cuerpo: "Si el agente eligiera siempre la mejor acción conocida desde el principio, nunca descubriría jugadas mejores. Para evitarlo usa <b>ε-greedy</b>: con probabilidad <span class=\"mono\">ε</span> mueve la pala al azar (explorar) y el resto del tiempo elige la de mayor Q (explotar). Ese <span class=\"mono\">ε</span> arranca en 1.0 (todo al azar) y baja hasta 0.05 a lo largo de los primeros 25.000 pasos, de manera que primero prueba mucho y luego confía cada vez más en lo aprendido." },
      { h: "Qué se observa en pantalla", cuerpo: "El inspector muestra los 3 valores Q del estado que se está observando, con la acción de mayor Q resaltada en verde. En las curvas: la recompensa media debería subir, <span class=\"mono\">ε</span> baja siguiendo su programa y el replay buffer se va llenando hasta su capacidad." },
    ],
    formula: "objetivo = r + γ · (1−done) · Q⁻( s', argmaxₐ' Q(s',a') )",
    dato: "Red 6→128→128→3 · replay 100.000 · lote 128 · ε 1.0→0.05 en 25.000 pasos · γ=0.99 · τ=0.01 · Double DQN + Huber · off-policy, basado en valor.",
  },
  ppo: {
    emoji: "🧗", titulo: "PPO — Proximal Policy Optimization", categoria: "Algoritmo",
    resumen: "Mejora la política directamente, a pasos pequeños y controlados.",
    secciones: [
      { h: "La idea en palabras llanas", cuerpo: "DQN aprende a puntuar cada acción y luego elige la mejor. PPO toma otro camino: ajusta <b>directamente</b> la forma de jugar, sin pasar por puntuaciones de acciones. En cada estado tiene unas preferencias («en esta situación, suelo ir a la derecha») y el aprendizaje consiste en reforzar las decisiones que salieron bien y debilitar las que salieron mal.<br><br>Esas preferencias, expresadas como la probabilidad de cada acción en cada estado, se denominan <b>política</b> y se escriben <span class=\"mono\">π(a|s)</span>. PPO es de la familia <b>actor-crítico</b>: combina dos redes que se ayudan." },
      { h: "Actor y crítica", cuerpo: "El <b>actor</b> es la red que decide: recibe el estado de 6 números y produce las probabilidades de las 3 acciones, de las que se muestrea una. La <b>crítica</b> es una segunda red que no decide nada; solo estima cuánto vale el estado actual, es decir, cuántos puntos se esperan a partir de ahí en promedio. Ese valor se denomina <span class=\"mono\">V(s)</span>.<br><br>La crítica sirve de vara de medir. Comparando lo que realmente ocurrió tras una acción con lo que la crítica esperaba del estado, se sabe si la acción fue mejor o peor de lo normal. Esa diferencia, «cuánto mejor que la media salió esta acción», se denomina <b>ventaja</b>." },
      { h: "Cómo aprende aquí", cuerpo: "PPO es <b>on-policy</b>: solo aprende de experiencias generadas por su política actual. El ciclo es: jugar un tramo recogiendo datos (un <b>rollout</b> de 256 pasos por cada entorno en paralelo), calcular las ventajas de todas esas decisiones, ajustar las redes durante unas pocas pasadas sobre esos datos, y después <b>descartarlos</b> porque la política ya ha cambiado y dejaron de ser representativos. Recoger, aprender y tirar; recoger de nuevo.<br><br>Las ventajas se estiman con una técnica llamada <b>GAE</b> (Generalized Advantage Estimation, con <span class=\"mono\">λ=0.95</span>), que combina información de varios pasos para que la señal sea estable y no demasiado ruidosa." },
      { h: "Por qué \"proximal\": el recorte", cuerpo: "El riesgo de ajustar la política directamente es pasarse: un cambio demasiado grande en una sola actualización puede arruinar lo aprendido. PPO lo impide midiendo cuánto cambia la probabilidad de una acción respecto a la política con la que se recogieron los datos, y <b>recortando</b> ese cambio a una banda estrecha (<span class=\"mono\">[0.8, 1.2]</span> con <span class=\"mono\">ε=0.2</span>). Así, por muy tentador que sea un dato, ningún paso desplaza la política más allá de lo prudente. De ahí «proximal»: se mantiene cerca de la versión anterior. Además se añade un pequeño premio a la <b>entropía</b> para que no deje de explorar antes de tiempo." },
      { h: "Qué se observa en pantalla", cuerpo: "El inspector muestra <span class=\"mono\">π(a|s)</span> como barras de probabilidad de las 3 acciones, el valor <span class=\"mono\">V(s)</span> estimado por la crítica y la entropía actual. La curva de exploración no sigue a <span class=\"mono\">ε</span> (PPO no usa ε-greedy), sino a la entropía, que mide lo repartida que está la política." },
    ],
    formula: "L = E[ mín( ρ·A , clip(ρ, 1−ε, 1+ε)·A ) ]   con   ρ = π_nueva(a|s) / π_vieja(a|s)",
    dato: "Actor 6→128→128→3 · crítica 6→128→128→1 · rollout 256 pasos/entorno · 4 épocas · minibatch 1024 · clip ε=0.2 · GAE λ=0.95 · coef. valor 0.5 · coef. entropía 0.01 · on-policy.",
  },
  sac: {
    emoji: "🎲", titulo: "SAC — Soft Actor-Critic (discreto)", categoria: "Algoritmo",
    resumen: "Maximiza recompensa y, a la vez, no dejar de explorar; se autorregula.",
    secciones: [
      { h: "La idea en palabras llanas", cuerpo: "La mayoría de los métodos buscan una sola cosa: la máxima recompensa. SAC busca dos a la vez: mucha recompensa <b>y</b> mantener cierta variedad en sus decisiones. La intuición es que un jugador que siempre repite exactamente la misma jugada se queda atrapado pronto en una estrategia mediocre; uno que conserva algo de variedad sigue descubriendo opciones mejores y resiste mejor los cambios.<br><br>Esa variedad, medida como lo impredecible que es la política, se denomina <b>entropía</b>. Por eso SAC se describe como un método de <b>máxima entropía</b>: premia explícitamente no cerrarse en una única acción." },
      { h: "Actor y dos críticos", cuerpo: "Como PPO, SAC es actor-crítico: un <b>actor</b> estocástico produce las probabilidades de las 3 acciones y muestrea de ellas. La diferencia es que SAC mantiene <b>dos críticos</b> en vez de uno, y cada crítico estima el valor Q de las acciones. Al calcular el objetivo se toma el <b>mínimo</b> de los dos. Esto corrige un problema clásico: una sola red de valor tiende a sobreestimar sistemáticamente, y esa euforia infundada lleva a políticas malas; quedarse con el menor de dos estimadores la frena. Cada crítico tiene además su copia lenta (<b>red objetivo</b>) para estabilizar el objetivo." },
      { h: "La temperatura que se ajusta sola", cuerpo: "El equilibrio entre «buscar recompensa» y «mantener variedad» lo controla un peso llamado <b>temperatura</b>, <span class=\"mono\">α</span>. Lo característico de SAC es que <span class=\"mono\">α</span> no se fija a mano: se ajusta automáticamente hacia una <b>entropía objetivo</b>. Si el agente explora menos de lo deseado, <span class=\"mono\">α</span> sube y la entropía vuelve a pesar más; si explora de más, <span class=\"mono\">α</span> baja. Aquí la entropía objetivo es <span class=\"mono\">0.55·log(3)</span>, una fracción del máximo posible con 3 acciones." },
      { h: "Cómo aprende aquí", cuerpo: "SAC es <b>off-policy</b>: guarda todas las experiencias en un <b>replay buffer</b> (capacidad 100.000) y entrena con lotes aleatorios de 128, reutilizando cada experiencia muchas veces. En cada actualización ajusta los dos críticos (para que predigan bien el valor, contando la bonificación por entropía), después el actor (para preferir acciones que los críticos valoran sin renunciar a la variedad) y por último la temperatura <span class=\"mono\">α</span>. Empieza a entrenar tras acumular 2.000 experiencias." },
      { h: "Qué se observa en pantalla", cuerpo: "El inspector muestra las probabilidades de la política, los valores de ambos críticos, la temperatura <span class=\"mono\">α</span> y la entropía. La curva de exploración sigue a <span class=\"mono\">α</span>, que en estas corridas tiende a bajar desde su valor inicial de 0.20 a medida que el agente afina su juego." },
    ],
    formula: "y = r + γ·(1−done)·Σₐ π(a|s')·[ mín(Q1', Q2') − α·log π(a|s') ]",
    dato: "Actor + 2 críticos + 2 redes objetivo, todos 6→128→128→3 · replay 100.000 · lote 128 · α aprendible (arranca en 0.20) · entropía objetivo 0.55·log(3) · τ=0.01 · off-policy, máxima entropía.",
  },
  worldModel: {
    emoji: "🧠", titulo: "World Model — Dyna-Q", categoria: "Algoritmo",
    resumen: "Aprende un modelo del juego y entrena también con partidas imaginadas.",
    secciones: [
      { h: "La idea en palabras llanas", cuerpo: "Los otros tres métodos aprenden a jugar sin entender nunca el mundo: asocian situaciones con buenas acciones, pero no podrían predecir qué pasaría si hicieran tal cosa. A esa familia se la denomina <b>model-free</b>. El World Model pertenece a la familia contraria, <b>model-based</b>: además de aprender a jugar, aprende un <b>modelo</b> de cómo funciona el juego.<br><br>La ventaja es que, con ese modelo, el agente puede entrenar «en su cabeza», imaginando partidas, sin gastar pasos reales. Quien ha jugado mucho a un videojuego puede anticipar la siguiente jugada con los ojos cerrados; aquí el agente aprende esa capacidad y la aprovecha para practicar más por cada experiencia real." },
      { h: "El modelo de dinámica", cuerpo: "El corazón del método es una red, el <b>modelo de dinámica</b>, entrenada de forma <b>supervisada</b> (como un predictor normal) para responder: dado el estado actual y una acción, ¿cuál será el estado siguiente, qué recompensa habrá y terminará el episodio? Es una red más grande que las demás, de 200·200 neuronas, porque predecir la física es más exigente que decidir una acción.<br><br>En lugar de predecir el estado siguiente entero, predice el <b>incremento</b> <span class=\"mono\">Δs</span> (cuánto cambia cada número) y luego suma <span class=\"mono\">s' = s + Δs</span>. Predecir el cambio es más estable que predecir la posición absoluta, sobre todo cuando entre un paso y el siguiente casi todo se mantiene igual." },
      { h: "Cómo aprende aquí: Dyna-Q", cuerpo: "Por dentro, para decidir, el World Model usa un <b>Q-net</b> idéntico al de DQN (Double DQN, red objetivo, exploración ε-greedy de 1.0 a 0.05). Lo distinto es de dónde saca los datos para entrenarlo. La receta se denomina <b>Dyna-Q</b>: por cada paso real, primero actualiza el Q-net con experiencia <b>real</b> del replay buffer, y después genera 5 transiciones <b>imaginadas</b> con el modelo y entrena el Q-net también con ellas. El modelo empieza a aprenderse tras 1.000 experiencias y el Q-net arranca tras 2.000.<br><br>Esas 5 actualizaciones extra por paso multiplican el aprovechamiento de cada experiencia real, siempre que el modelo sea suficientemente bueno." },
      { h: "El riesgo: aprender de un mundo falso", cuerpo: "La eficiencia tiene un precio. Si el modelo se equivoca, el agente entrena con experiencias que nunca ocurrirían, y aprende de un mundo falso. Este problema se denomina <b>sesgo del modelo</b> (model bias). Por eso conviene vigilar el error del modelo: mientras sea bajo, la imaginación ayuda; si fuese alto, las transiciones imaginadas serían más perjudiciales que útiles. El error se mide como la distancia (RMSE) entre el estado siguiente que predijo el modelo y el que ocurrió de verdad." },
      { h: "Qué se observa en pantalla", cuerpo: "Las métricas se adaptan a este método: aparecen «Error del modelo» y «Pasos de planning». El inspector compara, número a número, el estado real con el que el modelo predijo para la acción elegida, de modo que se ve directamente si el modelo acierta." },
    ],
    formula: "s' = s + Δs_pred   ·   error del modelo = RMSE( s + Δs_pred , s'_real )",
    dato: "Q-net 6→128→128→3 (Double DQN) · modelo de dinámica (6+3)→200→200→(Δs, r, done) · replay 100.000 · planning 5 imaginadas/paso real · arranque modelo 1.000, Q-net 2.000 · ε 1.0→0.05 · off-policy, model-based.",
  },

  worldModelRecurrente: {
    emoji: "🧬", titulo: "World Model recurrente — Dyna-Q + LSTM", categoria: "Algoritmo",
    resumen: "Como el World Model, pero su modelo del juego tiene memoria: un LSTM que aprende secuencias.",
    secciones: [
      { h: "La idea en palabras llanas", cuerpo: "Esta es una variante del World Model. Comparte casi todo con él: aprende un <b>modelo</b> de cómo funciona el juego y entrena «en su cabeza» imaginando partidas (Dyna-Q), con un Q-net idéntico al de DQN para decidir. Lo único que cambia es <b>cómo es ese modelo del juego</b>.<br><br>El World Model normal predice de uno en uno: le das una situación y una acción, y te dice la siguiente, sin recordar nada de antes. Esta variante usa un modelo con <b>memoria</b>: procesa los pasos en orden y va arrastrando un resumen de todo lo que ha visto. Es la diferencia entre describir una foto suelta y entender una película." },
      { h: "Qué es un LSTM (la memoria)", cuerpo: "El modelo con memoria es una <b>red recurrente</b>, en concreto un <b>LSTM</b> (Long Short-Term Memory). Una red normal trata cada entrada como independiente; una recurrente, en cambio, mantiene un <b>estado oculto</b> que actualiza paso a paso y que funciona como su memoria de lo ocurrido. Así, para predecir el siguiente estado no se basa solo en el actual, sino en toda la trayectoria reciente.<br><br>Por eso este modelo no se entrena con transiciones sueltas y barajadas, sino con <b>secuencias</b> ordenadas de un mismo episodio (aquí, tramos de 16 pasos). Necesita ver el orden para aprender a recordar." },
      { h: "Por qué puede mejorar al World Model", cuerpo: "El punto débil del modelo de un solo paso aparece al <b>imaginar varios pasos seguidos</b>: encadena predicción sobre predicción, y un pequeño error en cada una se va acumulando hasta que la partida imaginada se vuelve irreal. Ese problema se denomina <b>sesgo del modelo</b> (model bias).<br><br>El LSTM se entrena precisamente para encajar secuencias enteras, y al imaginar arrastra su memoria de lo ya imaginado. El resultado es que sus rollouts imaginados se mantienen coherentes durante más pasos, con menos deriva. La pestaña «Comparativa» permite enfrentarlo al World Model normal y ver si, en la práctica, esa diferencia se traduce en aprender mejor." },
      { h: "De dónde viene", cuerpo: "La idea está tomada de <b>«World Models»</b> (Ha &amp; Schmidhuber, 2018), donde un agente aprende un VAE que comprime la imagen, una memoria recurrente (MDN-RNN, un LSTM) que predice cómo evoluciona esa imagen comprimida, y un pequeño controlador. Aquí no hace falta el VAE —nuestro estado ya son 6 números, no una imagen— así que tomamos solo la pieza valiosa para nosotros: la <b>memoria recurrente</b> como modelo de dinámica. Usamos una versión simplificada que predice el estado directamente, sin la mezcla de gaussianas del MDN-RNN original." },
      { h: "Qué se observa en pantalla", cuerpo: "Las métricas son las del World Model (error del modelo, pasos de planning) más el tamaño de la <b>memoria LSTM</b>. El inspector, igual que en el World Model, compara número a número el estado real con el que predijo el modelo recurrente." },
    ],
    formula: "h_t = LSTM(s_t ⊕ a_t, h_{t-1})   ·   (Δs, r, done) = Dense(h_t)   ·   s' = s + Δs",
    dato: "Q-net 6→128→128→3 (Double DQN) · dinámica LSTM: (6+3)→128 (estado oculto)→(Δs, r, done) · entrena secuencias de 16 pasos, 32 por lote · buffer de 256 episodios · planning 5 imaginadas/paso real · ε 1.0→0.05 · off-policy, model-based recurrente.",
  },

  // ───────────────────────── CONCEPTOS ─────────────────────────
  modelFree: { emoji:"🚀", titulo:"Model-free", categoria:"Concepto",
    resumen:"Aprende qué hacer sin construir un modelo del entorno.",
    secciones:[
      {h:"La idea",cuerpo:"Un método <b>model-free</b> (sin modelo) aprende directamente qué conviene hacer —una política— o cuánto vale cada situación —una función de valor— a partir de la pura experiencia. Lo que <b>no</b> hace es construir una representación de cómo funciona el entorno: no intenta predecir cuál será el siguiente estado ni qué recompensa traerá una acción. Solo asocia situaciones con buenas decisiones."},
      {h:"Qué implica",cuerpo:"Como no entiende la «física», necesita muchas repeticiones para captar las regularidades del entorno por simple ensayo y error. A cambio, es más sencillo y robusto: no hay un modelo que pueda equivocarse y contaminar el aprendizaje. La mayoría de los algoritmos clásicos de aprendizaje por refuerzo son de esta familia."},
      {h:"En este laboratorio",cuerpo:"DQN, PPO y SAC son model-free. DQN, por ejemplo, aprende los valores <span class=\"mono\">Q(s,a)</span> probando acciones y observando recompensas, sin saber jamás cómo rebota la pelota ni dónde están los ladrillos; lo único que llega a la red son los 6 números del estado y la recompensa de cada paso."}] },
  modelBased: { emoji:"🔮", titulo:"Model-based", categoria:"Concepto",
    resumen:"Aprende un modelo del entorno y lo usa para planificar o imaginar.",
    secciones:[
      {h:"La idea",cuerpo:"Un método <b>model-based</b> (basado en modelo) aprende un <b>modelo de la dinámica</b> del entorno: dado un estado y una acción, predice cuál será el estado siguiente y qué recompensa habrá. Con ese modelo puede planificar hacia delante o generar experiencia «imaginada» sin gastar pasos reales."},
      {h:"La ventaja y el riesgo",cuerpo:"La gran ventaja es la <b>eficiencia en datos</b>: cada experiencia real puede aprovecharse muchas veces para practicar en simulación. El riesgo es el <b>sesgo del modelo</b> (model bias): si el modelo se equivoca, el agente aprende de un mundo falso y puede empeorar. El equilibrio entre eficiencia y fiabilidad del modelo es la cuestión central de esta familia."},
      {h:"En este laboratorio",cuerpo:"El World Model es el único método model-based. Predice cómo evolucionará la pelota tras una acción y entrena al agente con esas predicciones, además de con la experiencia real. Vigilar su «error del modelo» indica hasta qué punto se puede confiar en lo que imagina."}] },
  replay: { emoji:"🗃️", titulo:"Replay buffer", categoria:"Concepto",
    resumen:"Memoria de experiencias pasadas de la que se muestrea para entrenar.",
    secciones:[
      {h:"La idea",cuerpo:"El <b>replay buffer</b> es una memoria que almacena las transiciones vividas, cada una con la forma <span class=\"mono\">(s, a, r, s', done)</span>: estado, acción, recompensa, estado siguiente y si el episodio terminó. Para entrenar no se usa la última experiencia, sino lotes <b>aleatorios</b> sacados de toda la memoria."},
      {h:"Por qué importa",cuerpo:"Cumple dos funciones. Primera, romper la <b>correlación temporal</b>: los pasos consecutivos de una partida se parecen mucho entre sí, y entrenar con ellos en orden desestabiliza el aprendizaje; muestrear al azar los mezcla y los vuelve más independientes. Segunda, <b>reutilizar</b> cada experiencia muchas veces en vez de verla una sola vez y descartarla, lo que multiplica el rendimiento de los datos."},
      {h:"Quién lo usa",cuerpo:"Es propio de los métodos <b>off-policy</b>, que pueden aprender de datos antiguos: aquí lo usan DQN, SAC y el World Model. PPO no lo usa, porque es on-policy y sus datos caducan en cuanto la política cambia. Funciona como un buffer circular: al llenarse, las experiencias nuevas sobrescriben las más viejas."}],
    dato:"Aquí: capacidad 100.000 transiciones, lotes (minibatches) de 128." },
  targetNet: { emoji:"🎯", titulo:"Red objetivo", categoria:"Concepto",
    resumen:"Una copia lenta de la red que fija el objetivo de entrenamiento.",
    secciones:[
      {h:"La idea",cuerpo:"La <b>red objetivo</b> es una copia de la red principal que se actualiza muy despacio y que sirve para calcular el objetivo de cada paso de entrenamiento. La red que se entrena cambia en cada actualización; la objetivo se queda casi quieta."},
      {h:"Qué problema resuelve",cuerpo:"Sin ella, el objetivo se calcularía con la misma red que se está modificando, así que se movería a cada paso a la vez que la red lo persigue. Es como intentar dar en una diana que se desplaza justo cuando vas a disparar: el aprendizaje oscila y puede divergir. Fijar el objetivo con una copia estable rompe ese bucle."},
      {h:"En este laboratorio",cuerpo:"La copia no se renueva de golpe, sino mediante una <b>actualización suave</b> (Polyak): en cada paso, la red objetivo se acerca un poquito a la principal. Lo usan DQN, SAC y el World Model. SAC mantiene una red objetivo por cada uno de sus dos críticos."}],
    formula:"θ⁻ ← τ·θ + (1−τ)·θ⁻   (actualización suave de Polyak, τ=0.01)" },
  epsilon: { emoji:"🎲", titulo:"Exploración ε-greedy", categoria:"Concepto",
    resumen:"Actuar al azar con probabilidad ε; el resto del tiempo, la mejor acción.",
    secciones:[
      {h:"La idea",cuerpo:"La estrategia <b>ε-greedy</b> resuelve la tensión entre explorar y explotar de la forma más simple posible. Con probabilidad <span class=\"mono\">ε</span> el agente actúa al azar (explorar, probar algo distinto); con probabilidad <span class=\"mono\">1−ε</span> elige la mejor acción conocida (explotar lo aprendido)."},
      {h:"Por qué importa",cuerpo:"Un agente que solo explotara desde el principio se quedaría con la primera estrategia decente que encontrara y nunca descubriría otra mejor: no puede saber que existe algo superior si no lo prueba. Algo de azar garantiza que siga tropezando con situaciones nuevas."},
      {h:"El programa de decaimiento",cuerpo:"<span class=\"mono\">ε</span> empieza alto, para explorar mucho cuando aún no se sabe casi nada, y <b>decae</b> con el tiempo, para confiar cada vez más en lo aprendido. Aquí pasa de 1.0 (todo al azar) a 0.05 de forma lineal a lo largo de los primeros pasos. Lo usan DQN y el World Model; PPO y SAC exploran de otra manera, a través de la aleatoriedad propia de su política."}],
    dato:"Aquí: ε pasa de 1.0 a 0.05 en 25.000 pasos (DQN) o 20.000 (World Model)." },
  politicaEstocastica: { emoji:"🎰", titulo:"Política estocástica", categoria:"Concepto",
    resumen:"La política es una distribución de probabilidad sobre las acciones.",
    secciones:[
      {h:"La idea",cuerpo:"Una política <b>estocástica</b> no elige siempre la misma acción en el mismo estado. En vez de eso devuelve una distribución de probabilidad <span class=\"mono\">π(a|s)</span> —cuánto de probable es cada acción— y luego muestrea una al azar conforme a esas probabilidades. La alternativa, elegir siempre la misma, se denomina política determinista."},
      {h:"Por qué importa",cuerpo:"Tiene dos ventajas. Primera, aporta <b>exploración natural</b>: como las acciones menos probables también se prueban de vez en cuando, no hace falta añadir un mecanismo aparte de azar. Segunda, permite <b>optimizar la política con gradientes</b>: al ser una distribución suave, se puede empujar matemáticamente para subir la probabilidad de las acciones buenas."},
      {h:"En este laboratorio",cuerpo:"PPO y SAC tienen política estocástica. El actor puede dar, por ejemplo, <span class=\"mono\">[0.2, 0.5, 0.3]</span> para [izquierda, mantener, derecha] y muestrear de ahí; lo más probable sería mantener, pero los giros también ocurren. A medida que aprende, esa distribución se va afilando hacia las acciones que funcionan."}] },
  ventajaGae: { emoji:"📐", titulo:"Ventaja (GAE)", categoria:"Concepto",
    resumen:"Cuánto mejor o peor salió una acción comparada con la media del estado.",
    secciones:[
      {h:"La idea",cuerpo:"La <b>ventaja</b> de una acción, <span class=\"mono\">A(s,a)</span>, mide cuánto mejor (o peor) fue esa acción respecto a lo que se esperaba del estado en promedio: es el valor de la acción menos el valor medio del estado, <span class=\"mono\">Q(s,a) − V(s)</span>. Si es positiva, la acción superó la media y conviene reforzarla; si es negativa, fue peor de lo normal y conviene debilitarla."},
      {h:"Por qué importa",cuerpo:"Usar la ventaja en lugar de la recompensa bruta reduce muchísimo el ruido al ajustar la política. Lo que importa para mejorar no es si una jugada dio muchos puntos en términos absolutos, sino si dio más de lo que cabía esperar; restar el valor medio del estado elimina el «fondo» común a todas las acciones y deja solo la señal útil."},
      {h:"Cómo se estima: GAE",cuerpo:"La <b>GAE</b> (Generalized Advantage Estimation) calcula la ventaja combinando los errores de predicción de varios pasos consecutivos, ponderados por un factor <span class=\"mono\">λ</span> que equilibra sesgo y varianza: con <span class=\"mono\">λ</span> alto la estimación mira más lejos (menos sesgo, más ruido) y con <span class=\"mono\">λ</span> bajo se fía más del paso inmediato (más sesgo, menos ruido). Aquí la usa PPO con <span class=\"mono\">λ=0.95</span>."}],
    formula:"A_t = Σₗ (γλ)ˡ · δ_{t+l}   con   δ_t = r_t + γ·V(s_{t+1}) − V(s_t)" },
  clipSurrogate: { emoji:"✂️", titulo:"Objetivo recortado (clip)", categoria:"Concepto",
    resumen:"Limita cuánto puede cambiar la política en una sola actualización.",
    secciones:[
      {h:"La idea",cuerpo:"El <b>objetivo recortado</b> es el truco que da nombre a PPO. En cada actualización se mide el <b>ratio</b> entre la probabilidad que la política nueva asigna a una acción y la que le asignaba la política con la que se recogieron los datos. Ese ratio se <b>recorta</b> a una banda estrecha alrededor de 1, de modo que la política no se aleje demasiado de la versión anterior."},
      {h:"Qué problema resuelve",cuerpo:"Si una acción tuvo gran ventaja, el optimizador querría subir su probabilidad todo lo posible en un solo paso; pero un cambio tan brusco, calculado con datos que ya quedaron obsoletos, suele arruinar la política. El recorte elimina el incentivo a pasarse: una vez el ratio sale de la banda permitida, empujar más no aporta nada al objetivo. Se obtiene así estabilidad sin las restricciones matemáticas complejas de métodos anteriores como TRPO."}],
    formula:"con ε=0.2 → el ratio se mantiene en la banda [0.8, 1.2]" },
  onPolicy: { emoji:"📜", titulo:"On-policy / rollouts", categoria:"Concepto",
    resumen:"Aprende solo de experiencias generadas por su política actual.",
    secciones:[
      {h:"La idea",cuerpo:"Un método <b>on-policy</b> solo puede aprender de experiencias generadas por la política que tiene ahora mismo. En cuanto se actualiza, los datos anteriores reflejan una forma de jugar que ya no es la suya y dejan de servir, así que se descartan. La familia contraria, <b>off-policy</b>, sí puede reutilizar datos antiguos (por eso usa replay buffer)."},
      {h:"Cómo trabaja",cuerpo:"El ciclo es recoger un <b>rollout</b> —un tramo de varios pasos seguidos con la política actual—, procesarlo durante unas pocas pasadas para mejorar la política, y tirarlo. Después se recoge un rollout nuevo con la política ya mejorada, y se repite."},
      {h:"El compromiso",cuerpo:"Ser on-policy aporta <b>estabilidad</b> (siempre se aprende de datos coherentes con la política actual), pero a costa de ser <b>menos eficiente en datos</b>: cada experiencia se usa pocas veces antes de desecharse. Aquí lo es PPO, que recoge 256 pasos por entorno antes de cada actualización."}] },
  dobleCritico: { emoji:"⚖️", titulo:"Doble crítico (clipped double-Q)", categoria:"Concepto",
    resumen:"Mantener dos redes de valor y quedarse con la menor.",
    secciones:[
      {h:"La idea",cuerpo:"En lugar de una sola red que estime el valor de las acciones, se mantienen <b>dos</b> y, al calcular el objetivo de entrenamiento, se toma el <b>mínimo</b> de las dos estimaciones."},
      {h:"Qué problema resuelve",cuerpo:"Una sola red de valor tiende a <b>sobreestimar</b> de forma sistemática: por el ruido propio del aprendizaje, al elegir siempre el valor más alto se acaban favoreciendo errores optimistas, y esa euforia infundada se propaga y degrada la política. Quedarse con el menor de dos estimadores independientes corrige ese sesgo hacia arriba y estabiliza el aprendizaje."},
      {h:"En este laboratorio",cuerpo:"Lo usa SAC, que mantiene dos críticos y combina esta idea con la máxima entropía. Es también una pieza central de otros métodos modernos como TD3."}],
    formula:"objetivo = r + γ · mín(Q1', Q2')" },
  maxEntropia: { emoji:"🌪️", titulo:"Máxima entropía", categoria:"Concepto",
    resumen:"Premiar no solo la recompensa, también mantener variedad en las acciones.",
    secciones:[
      {h:"La idea",cuerpo:"El marco de <b>máxima entropía</b> cambia el objetivo del agente: en vez de buscar solo la máxima recompensa, busca la máxima recompensa <b>más</b> entropía de la política. La entropía mide lo impredecible o repartida que está la política, así que se está premiando explícitamente no concentrar toda la probabilidad en una sola acción."},
      {h:"Por qué importa",cuerpo:"Mantiene la exploración de forma natural y duradera, evita que la política <b>colapse</b> prematuramente en una única jugada que parecía buena al principio, y produce políticas más robustas, que se defienden mejor cuando las condiciones cambian un poco."},
      {h:"En este laboratorio",cuerpo:"Es la idea que define a SAC (Soft Actor-Critic; lo «soft» viene precisamente de este término de entropía). El peso que se da a la entropía es la temperatura <span class=\"mono\">α</span>, que aquí además se ajusta sola."}],
    formula:"objetivo = E[ Σ r + α·H(π) ]   con H(π) = entropía de la política" },
  temperaturaAuto: { emoji:"🌡️", titulo:"Temperatura α automática", categoria:"Concepto",
    resumen:"El peso de la entropía se ajusta solo hacia una entropía objetivo.",
    secciones:[
      {h:"La idea",cuerpo:"En un método de máxima entropía hay que decidir cuánto pesa la entropía frente a la recompensa: ese peso es la <b>temperatura</b> <span class=\"mono\">α</span>. Afinarlo a mano es delicado y depende de la tarea. La solución es dejar que <span class=\"mono\">α</span> se ajuste <b>automáticamente</b> por gradiente para alcanzar una <b>entropía objetivo</b> prefijada."},
      {h:"Cómo se comporta",cuerpo:"El mecanismo actúa como un termostato. Si la política explora menos que la entropía objetivo, <span class=\"mono\">α</span> sube y la entropía vuelve a pesar más, forzando más variedad; si explora de más, <span class=\"mono\">α</span> baja para que importe más la recompensa. Así no hay que retocar nada a mano según la fase del entrenamiento."},
      {h:"En este laboratorio",cuerpo:"Lo usa SAC. La entropía objetivo se fija como una fracción del máximo posible: con 3 acciones, ese máximo es <span class=\"mono\">log(3)≈1.10</span>, y el objetivo es el 55 % de ese valor."}],
    dato:"Aquí: entropía objetivo = 0.55·log(3) ≈ 0.60. α arranca en 0.20." },
  modeloDinamica: { emoji:"🔭", titulo:"Modelo de dinámica", categoria:"Concepto",
    resumen:"Una red que predice, dado (s,a), el siguiente estado, la recompensa y si termina.",
    secciones:[
      {h:"La idea",cuerpo:"El <b>modelo de dinámica</b> es una red entrenada de forma <b>supervisada</b> (como cualquier predictor que aprende de ejemplos etiquetados) para responder: a partir del estado actual y la acción que se va a tomar, ¿cuál será el estado siguiente, qué recompensa se obtendrá y terminará el episodio? Es lo que distingue a los métodos model-based."},
      {h:"Un detalle clave",cuerpo:"En lugar de predecir el estado siguiente completo, predice el <b>incremento</b> <span class=\"mono\">Δs</span> respecto al estado actual, y luego se reconstruye con <span class=\"mono\">s' = s + Δs</span>. Predecir el cambio es más estable y fácil de aprender que predecir la posición absoluta, porque de un paso al siguiente buena parte del estado apenas varía."},
      {h:"En este laboratorio",cuerpo:"Lo usa el World Model. Su entrada es el estado de 6 números junto con la acción codificada, y su salida son los 6 incrementos del estado, la recompensa y un indicador de fin de episodio. Su calidad se vigila con el «error del modelo» (RMSE): mientras sea bajo, las partidas imaginadas son fiables."}],
    dato:"Aquí: red (6+3)→200→200→(Δs de 6, r, done). Error RMSE típico ~0.07–0.15 sobre estados normalizados." },
  planning: { emoji:"💭", titulo:"Planning / imaginación", categoria:"Concepto",
    resumen:"Entrenar con experiencia simulada por el modelo, sin tocar el entorno real.",
    secciones:[
      {h:"La idea",cuerpo:"Una vez se dispone de un modelo de dinámica, se pueden generar transiciones <b>imaginadas</b> —partidas que el agente juega «en su cabeza»— sin gastar ni un paso del entorno real, y usarlas también para entrenar la política o la función de valor. Esta práctica se denomina <b>planning</b>, y la receta concreta de mezclar datos reales e imaginados, <b>Dyna-Q</b>."},
      {h:"Por qué importa",cuerpo:"Multiplica el aprovechamiento de cada experiencia real: con un solo paso real se pueden hacer varias actualizaciones adicionales a partir de lo imaginado, acelerando el aprendizaje. El beneficio depende por completo de la calidad del modelo; si el modelo fuese malo, esas actualizaciones harían más daño que bien (sesgo del modelo)."},
      {h:"En este laboratorio",cuerpo:"Lo usa el World Model. Por cada paso real genera 5 transiciones imaginadas, encadenándolas en pequeños rollouts a partir de estados reales del buffer, y reinicia los que el modelo predice como terminados."}],
    dato:"Aquí: 5 actualizaciones imaginadas por cada paso real." },

  // ───────────────────────── MÉTRICAS / DATOS ─────────────────────────
  rewardMedio100: { emoji:"🏆", titulo:"Recompensa media (·100)", categoria:"Métrica",
    resumen:"La métrica principal: si sube de forma sostenida, el agente está aprendiendo.",
    secciones:[
      {h:"Qué mide",cuerpo:"La recompensa total media de los <b>últimos 100 episodios</b> (partidas) terminados. Es el mejor resumen de lo bien que juega el agente ahora mismo: cuántos puntos saca por partida en promedio reciente."},
      {h:"Cómo leerla",cuerpo:"Debe <b>subir</b> a medida que avanza el entrenamiento; es la señal de que algo se está aprendiendo. Conviene fijarse en la <b>tendencia</b>, no en el punto a punto: el aprendizaje por refuerzo es ruidoso y la cifra oscila incluso cuando el agente mejora."},
      {h:"Qué valores esperar",cuerpo:"Al principio suele ser <b>negativa</b>: el agente pierde la pelota una y otra vez (cada pérdida resta 1). Se vuelve <b>positiva</b> cuando aprende a devolverla con la pala (+0.2 por rebote) y a romper ladrillos (+1 cada uno, con bonus de combo), y crece más si llega a completar niveles (+5)."}] },
  loss: { emoji:"📉", titulo:"Pérdida", categoria:"Métrica",
    resumen:"El error de la red respecto a su objetivo en cada actualización.",
    secciones:[
      {h:"Qué mide",cuerpo:"Cuánto se equivoca la red respecto al objetivo que se le marca en cada paso de gradiente. Es la cantidad que el optimizador trata de reducir al ajustar los pesos. Según el algoritmo se muestra la pérdida más representativa: la de Huber del valor Q (DQN), la del crítico (SAC), la total (PPO) o la del Q-net (World Model)."},
      {h:"Cómo leerla",cuerpo:"A diferencia del aprendizaje supervisado, en aprendizaje por refuerzo la pérdida <b>no tiene por qué bajar siempre</b>. El objetivo se mueve junto con la propia red (la red persigue una diana que ella misma desplaza), así que la pérdida puede subir y bajar sin que eso indique nada malo. Lo verdaderamente importante es que <b>no diverja</b>: que no se dispare hacia valores enormes, señal de inestabilidad."}] },
  tdError: { emoji:"⚡", titulo:"TD-error", categoria:"Métrica",
    resumen:"La «sorpresa» de la red ante una transición concreta.",
    secciones:[
      {h:"Qué mide",cuerpo:"El <b>TD-error</b> (error de diferencia temporal) es la diferencia entre lo que la red predecía para una acción y el objetivo de Bellman calculado tras ver lo que ocurrió. Un TD-error grande significa que la transición sorprendió a la red: lo que pasó se aparta mucho de lo que esperaba."},
      {h:"Para qué sirve",cuerpo:"Las transiciones más sorprendentes son las más <b>informativas</b>: contienen aprendizaje que la red aún no ha asimilado. Por eso el TD-error es la base del replay prioritario, donde las experiencias con mayor TD-error se vuelven a muestrear con más frecuencia. En el panel se muestra la media de su valor absoluto sobre el último lote."}],
    formula:"TD = ( r + γ·(1−done)·maxₐ' Q⁻(s',a') ) − Q(s,a)" },
  bufferSize: { emoji:"🗃️", titulo:"Tamaño del buffer", categoria:"Métrica",
    resumen:"Cuántas experiencias hay almacenadas en la memoria de repetición.",
    secciones:[
      {h:"Qué mide",cuerpo:"Cuántas transiciones lleva guardadas el replay buffer, hasta llegar a su capacidad máxima. Sube rápido al principio (cada paso de cada entorno añade una experiencia) y se estabiliza al llenarse, momento en que las nuevas empiezan a sobrescribir las más viejas."},
      {h:"Por qué importa",cuerpo:"El agente no empieza a entrenar de inmediato: espera a tener un mínimo de experiencias para que los primeros lotes sean variados y no estén dominados por las pocas situaciones iniciales. Hasta ese umbral, solo recoge datos."}],
    dato:"Capacidad: 100.000. Arranca a entrenar tras 1.500 experiencias (DQN) o 2.000 (SAC y World Model)." },
  tasaExito100: { emoji:"🥇", titulo:"Tasa de éxito", categoria:"Métrica",
    resumen:"Porcentaje de partidas recientes en que el agente limpia todos los ladrillos.",
    secciones:[
      {h:"Qué mide",cuerpo:"El porcentaje de los <b>últimos 100 episodios</b> en que el agente <b>completó el nivel</b>, es decir, rompió los 28 ladrillos (4 filas × 7 columnas) antes de perder la pelota o agotar el tiempo."},
      {h:"Cómo leerla",cuerpo:"Es una métrica exigente: completar un nivel entero requiere encadenar muchos rebotes acertados sin fallar ninguno, así que normalmente se mantiene en cero durante buena parte del entrenamiento y solo empieza a despegar cuando la política ya es sólida. Que suba aunque sea ligeramente es señal de un dominio avanzado del juego."}] },
  entropia: { emoji:"🌪️", titulo:"Entropía de la política", categoria:"Métrica",
    resumen:"Cómo de aleatoria o repartida está la política.",
    secciones:[
      {h:"Qué mide",cuerpo:"La <b>entropía</b> cuantifica lo impredecible que es la política. Alta significa que reparte la probabilidad entre varias acciones y explora mucho; baja significa que se ha «afilado» y concentra casi toda la probabilidad en una o dos acciones concretas."},
      {h:"Cómo leerla",cuerpo:"Suele <b>bajar despacio</b> conforme el agente decide con más seguridad, lo cual es sano. La señal de alarma es que caiga a casi cero <b>demasiado pronto</b>: indicaría que la política dejó de explorar antes de tiempo y corre el riesgo de haberse quedado atrapada en una estrategia mediocre."}],
    dato:"Con 3 acciones, el máximo posible es log(3) ≈ 1.10 (las tres acciones equiprobables)." },
  temperatura: { emoji:"🌡️", titulo:"Temperatura α (SAC)", categoria:"Métrica",
    resumen:"El peso que SAC da a la entropía, ajustado automáticamente.",
    secciones:[
      {h:"Qué mide",cuerpo:"Cuánto premia SAC mantener la exploración frente a buscar pura recompensa. Es el peso de la entropía en su objetivo: con <span class=\"mono\">α</span> alto, conservar variedad importa mucho; con <span class=\"mono\">α</span> bajo, manda la recompensa."},
      {h:"Cómo leerla",cuerpo:"<span class=\"mono\">α</span> <b>se ajusta solo</b> hacia la entropía objetivo, como un termostato: si la política explora poco, sube; si explora demasiado, baja. No hay un valor «correcto» fijo; lo que cuenta es que se mueva para mantener la exploración en su punto."}],
    dato:"Arranca en 0.20. En estas corridas tiende a bajar a medida que la política se afina." },
  errorModelo: { emoji:"🔭", titulo:"Error del modelo (World Model)", categoria:"Métrica",
    resumen:"Cómo de bien predice el modelo de dinámica el estado siguiente.",
    secciones:[
      {h:"Qué mide",cuerpo:"La distancia (RMSE, raíz del error cuadrático medio) entre el estado siguiente que <b>predice</b> el modelo de dinámica y el que ocurre de verdad. Cuanto más bajo, más fiel es el modelo y más fiables son las partidas que el agente imagina con él."},
      {h:"Cómo leerla",cuerpo:"Debe <b>bajar</b> conforme el modelo aprende la física del juego. Si se mantuviera alto, el agente estaría entrenando con un mundo falso (sesgo del modelo) y la imaginación, lejos de ayudar, podría perjudicarle. Es la métrica que indica cuánto fiarse del planning."}],
    dato:"Buen valor aquí: RMSE ~0.07 sobre estados normalizados aproximadamente a [-1, 1]." },
  pasosPlanning: { emoji:"💭", titulo:"Pasos de planning", categoria:"Métrica",
    resumen:"Cuántas actualizaciones imaginadas se hacen por cada paso real.",
    secciones:[
      {h:"Qué mide",cuerpo:"Cuántas veces se entrena el Q-net con experiencia <b>imaginada</b> por el modelo de dinámica en cada paso real. Multiplica el aprovechamiento de cada experiencia del entorno: a más pasos de planning, más práctica por dato real."},
      {h:"El matiz",cuerpo:"Su utilidad depende por entero de la calidad del modelo. Con un modelo preciso (error bajo), estas actualizaciones extra aceleran el aprendizaje; con un modelo malo, propagarían errores. Por eso se interpreta junto con el «error del modelo»."}],
    dato:"Aquí: 5." },
  lossValor: { emoji:"📉", titulo:"Pérdida de la crítica (PPO)", categoria:"Métrica",
    resumen:"Cómo de bien estima la crítica el valor V(s) de cada estado.",
    secciones:[
      {h:"Qué mide",cuerpo:"El error de la red <b>crítica</b> al predecir el retorno —los puntos que se esperan a partir de un estado—, es decir, su estimación del valor <span class=\"mono\">V(s)</span>. Una crítica precisa produce mejores estimaciones de la <b>ventaja</b>, y por tanto actualizaciones más certeras del actor."},
      {h:"Cómo leerla",cuerpo:"Tiende a bajar conforme la crítica aprende, aunque es normal que <b>repunte</b> justo después de recoger un rollout nuevo, cuando aparecen estados todavía no bien estimados. Como toda pérdida en RL, lo importante es que no diverja."}] },
  rolloutProgreso: { emoji:"📜", titulo:"Rollout (PPO)", categoria:"Métrica",
    resumen:"Cuánto lleva lleno el rollout on-policy antes de la siguiente actualización.",
    secciones:[
      {h:"Qué mide",cuerpo:"PPO es on-policy: recoge un tramo fijo de experiencia —256 pasos por entorno— y solo entonces actualiza la política. Esta barra indica cuánto falta para completar ese tramo."},
      {h:"Qué ocurre al llenarse",cuerpo:"Al llegar al 100 %, PPO calcula las ventajas de todo lo recogido, ajusta el actor y la crítica durante unas pocas épocas, <b>vacía el rollout</b> y vuelve a empezar a recoger con la política ya mejorada. Por eso el progreso avanza y se reinicia de forma cíclica."}] },

  // ───────────────────────── LA INTERFAZ (paneles y vistas) ─────────────────────────
  lab: { emoji:"🧠", titulo:"Arkanoid DRL Learning Lab", categoria:"Interfaz",
    resumen:"Un laboratorio para ver y entender cómo aprende un agente, en tiempo real.",
    secciones:[
      {h:"Qué es",cuerpo:"Un entorno en el que cinco algoritmos de aprendizaje por refuerzo profundo aprenden a jugar al Arkanoid <b>de verdad</b>, con redes neuronales reales ejecutándose en la GPU del navegador. A ninguno se le explican las reglas del juego: las descubren jugando miles de partidas y ajustando sus redes con lo que observan."},
      {h:"El bucle de aprendizaje",cuerpo:"Todo gira en torno al mismo ciclo. El agente observa el <b>estado</b> (la situación del juego), elige una <b>acción</b> (mover la pala), el entorno responde con una <b>recompensa</b> y un nuevo estado, y el agente usa esa señal para ajustar su <b>política</b>. Repetido una y otra vez, ese ciclo es lo que llamamos aprender."},
      {h:"Cómo usarlo",cuerpo:"Se elige un algoritmo en la parte superior y se pulsa Entrenar; entonces puede observarse la partida, las métricas, el inspector y las curvas de aprendizaje. Cada elemento tiene un icono de información que abre una explicación a fondo de esa pieza."}],
    formula:"estado → acción → recompensa → estado siguiente → (y vuelta a empezar)" },
  partidaObservada: { emoji:"🎮", titulo:"Partida observada", categoria:"Interfaz",
    resumen:"Una ventana para ver jugar al agente con su política del momento.",
    secciones:[
      {h:"Qué se ve",cuerpo:"Una de las partidas que el agente juega usando su política <b>actual</b>, dibujada en tiempo real. La <b>pala</b> es lo único que el agente controla, con tres movimientos posibles (izquierda, mantener, derecha); la <b>pelota</b>, los rebotes y los ladrillos forman la dinámica del entorno, que el agente no maneja directamente."},
      {h:"Es solo observación",cuerpo:"Estas partidas visibles no entrenan al agente. El entrenamiento de verdad ocurre en cientos de entornos que corren sin dibujarse (más rápido, en paralelo). Lo que se muestra aquí es una ventana al comportamiento de la política mientras mejora: sirve para juzgar cualitativamente cómo juega, no para generar los datos de aprendizaje."}] },
  inspector: { emoji:"🔬", titulo:"Inspector del algoritmo", categoria:"Interfaz",
    resumen:"La radiografía de lo que el agente piensa del estado que observa.",
    secciones:[
      {h:"Qué muestra",cuerpo:"El contenido se adapta al algoritmo. En DQN y en los dos World Model muestra los <b>valores Q</b> de cada acción (cuánto cree que vale cada movimiento), con la mejor resaltada. En PPO y SAC muestra las <b>probabilidades</b> de la política y el valor estimado del estado. En los World Model añade, además, la comparación entre el estado real y el que predice su modelo de dinámica."},
      {h:"Para qué sirve",cuerpo:"Permite asomarse al «razonamiento» interno del agente: por qué prefiere una acción sobre otra en una situación concreta, y cómo cambian esas estimaciones a medida que entrena. Es la forma más directa de relacionar lo que se ve en la partida con lo que la red ha aprendido."}] },
  curvas: { emoji:"📈", titulo:"Curvas de entrenamiento", categoria:"Interfaz",
    resumen:"Cómo evoluciona el aprendizaje a lo largo del tiempo.",
    secciones:[
      {h:"Cómo leerlas",cuerpo:"La curva de <b>recompensa</b> (verde) es la principal y debería subir; suele acompañarse de la tasa de éxito. La de <b>pérdida</b> no tiene por qué bajar siempre, pero no debe dispararse. Las otras dos gráficas se adaptan al algoritmo: tamaño del buffer y ε en DQN y World Model, entropía en PPO, temperatura α en SAC, y el error del modelo en el World Model."},
      {h:"Por qué oscilan",cuerpo:"Es normal que las curvas suban y bajen: el aprendizaje por refuerzo es ruidoso por naturaleza, porque el agente explora y el entorno tiene azar. Lo informativo es la <b>tendencia</b> a lo largo de muchos puntos, no el valor de un instante. Se registra un punto nuevo cada 250 experiencias acumuladas."}] },
  selectorAlgoritmo: { emoji:"🧩", titulo:"Versión del experimento", categoria:"Interfaz",
    resumen:"Elige cuál de los cinco algoritmos pilota al agente.",
    secciones:[
      {h:"Qué hace",cuerpo:"Los cinco algoritmos resuelven exactamente el mismo juego con filosofías distintas. Al cambiar de uno a otro, el agente se <b>recrea desde cero</b> (pierde todo lo aprendido) y toda la interfaz —métricas, curvas, inspector, tabla de conceptos— se reconfigura para reflejar el método elegido."},
      {h:"Para comparar",cuerpo:"Cada tarjeta indica la familia del algoritmo y si es on-policy u off-policy, y su icono de información abre la explicación completa. Cambiar de uno a otro permite contrastar cómo aborda cada filosofía el mismo problema."}] },
  controlEjecucion: { emoji:"⚙️", titulo:"Control de ejecución", categoria:"Interfaz",
    resumen:"Ajustes sobre cómo corre la simulación, en su mayoría sin afectar al aprendizaje.",
    secciones:[
      {h:"Qué agrupa",cuerpo:"Reúne los mandos de ejecución: la velocidad de simulación, cuántos entornos generan datos, cuántos se dibujan y si está activo el reward shaping."},
      {h:"Qué cambia y qué no",cuerpo:"Salvo el reward shaping, ninguno de estos ajustes altera la física del juego ni el modelo que aprende el agente: solo cambian el <b>ritmo</b> y la <b>cantidad</b> de datos. La velocidad es un avance rápido; el número de entornos afecta a cuántas experiencias se producen por segundo. El shaping sí modifica la señal de recompensa, por lo que cambiarlo reinicia el agente."}] },
  entornosParalelos: { emoji:"🪟", titulo:"Entornos en paralelo", categoria:"Interfaz",
    resumen:"Muchas partidas simultáneas compartiendo la misma política.",
    secciones:[
      {h:"Por qué varias a la vez",cuerpo:"Todas estas partidas usan el <b>mismo</b> cerebro, el agente que se está entrenando. Verlas juntas ayuda a juzgar si la política es buena en general y no por suerte en una partida concreta: si la mayoría devuelven la pelota, la política realmente ha aprendido a hacerlo."},
      {h:"Dos grupos de entornos",cuerpo:"Los que se muestran aquí son el grupo <b>visual</b>: pocos y dibujados, solo para observar. El entrenamiento de verdad lo hacen cientos de entornos <b>headless</b> (sin dibujar), que corren mucho más rápido en lotes sobre la GPU y producen casi todos los datos. Pulsar una de estas partidas la selecciona para inspeccionarla arriba."}] },
  panelConceptos: { emoji:"📚", titulo:"Conceptos de DRL", categoria:"Interfaz",
    resumen:"Qué técnicas usa, y cuáles no, el algoritmo seleccionado.",
    secciones:[
      {h:"Qué muestra",cuerpo:"El aprendizaje por refuerzo profundo funciona como un menú de técnicas combinables; cada algoritmo usa unas pocas. Esta tabla marca cuáles están activas en el método seleccionado: replay buffer, red objetivo, exploración ε-greedy, ventaja con GAE, objetivo recortado, doble crítico, máxima entropía, modelo de dinámica, planning, etc."},
      {h:"Para qué sirve",cuerpo:"Permite ver de un vistazo en qué se parecen y en qué se diferencian los cinco algoritmos, y entender por qué cada uno se comporta como lo hace. El icono de información de cada concepto abre su explicación detallada."}] },
  flujoDatos: { emoji:"🔄", titulo:"Flujo de datos", categoria:"Interfaz",
    resumen:"El recorrido de una experiencia, desde que se genera hasta que mejora la política.",
    secciones:[
      {h:"Qué muestra",cuerpo:"El camino completo de los datos en este algoritmo: desde que los entornos generan experiencias jugando, hasta que esas experiencias entrenan la red y la política mejorada vuelve a actuar sobre los entornos."},
      {h:"Cómo se adapta",cuerpo:"El recorrido cambia según el método. Los off-policy (DQN, SAC y los dos World Model) pasan las experiencias por un <b>replay buffer</b> del que muestrean lotes aleatorios. PPO, on-policy, recoge <b>rollouts</b>, los procesa y los descarta. Los World Model añaden un paso extra: un <b>modelo de dinámica</b> que genera experiencia imaginada (en la variante recurrente, un LSTM entrenado con secuencias)."}] },
  replayPanel: { emoji:"🗃️", titulo:"Replay buffer (conceptual)", categoria:"Interfaz",
    resumen:"Las experiencias arquetípicas del juego, con su recompensa y su sorpresa.",
    secciones:[
      {h:"Qué muestra",cuerpo:"Una selección de las transiciones <span class=\"mono\">(s, a, r, s', done)</span> más representativas del Arkanoid, cada una con su recompensa real y su <b>TD-error</b> asociado, para ilustrar de qué están hechos los datos con los que se entrena."},
      {h:"Qué resalta",cuerpo:"Las experiencias más informativas —perder la pelota, romper un ladrillo— tienen mayor TD-error porque sorprenden más a la red. Con replay prioritario, justamente esas se volverían a muestrear con más frecuencia durante el entrenamiento, para que la red aprenda antes de los momentos clave."}] },
  familias: { emoji:"🎓", titulo:"Las familias de algoritmos", categoria:"Interfaz",
    resumen:"El mapa de los algoritmos del laboratorio y sus rasgos.",
    secciones:[
      {h:"Qué muestra",cuerpo:"Un resumen comparado de los cinco algoritmos: a qué familia pertenece cada uno —basado en valor, actor-crítico o model-based—, si es on-policy u off-policy, y qué aprende exactamente (valores de acción, una política, o además un modelo del entorno). El recuadro resaltado corresponde al algoritmo activo."},
      {h:"Para qué sirve",cuerpo:"Sitúa cada método dentro del panorama del aprendizaje por refuerzo profundo y ayuda a entender las grandes decisiones de diseño que los separan, antes de entrar en los detalles de cada uno."}] },
  transicion: { emoji:"🔗", titulo:"Transición actual", categoria:"Interfaz",
    resumen:"La unidad mínima de aprendizaje, mostrada en vivo.",
    secciones:[
      {h:"Qué es",cuerpo:"Cada paso del entorno produce una tupla <span class=\"mono\">(s, a, r, s', done)</span>: dónde estaba el agente, qué acción hizo, qué recompensa recibió, a qué estado llegó y si el episodio terminó. Esa tupla es la <b>transición</b>, el ladrillo elemental con el que se construye todo el aprendizaje."},
      {h:"Para qué sirve",cuerpo:"Ver una transición en vivo conecta lo abstracto (los vectores con los que entrena la red) con lo concreto (lo que ocurre en la pantalla). Todo lo que el agente sabe procede de acumular y procesar millones de tuplas como esta."}] },

  // ───────────────────────── CONTROLES ─────────────────────────
  velocidad: { emoji:"⏩", titulo:"Velocidad de simulación", categoria:"Control",
    resumen:"Avance rápido: cambia el ritmo, no la física ni el modelo.",
    secciones:[
      {h:"Qué hace",cuerpo:"Controla cuántos pasos de simulación ocurren por cada fotograma, tanto en el entrenamiento como en la animación que se ve. Es, literalmente, un avance rápido: a mayor velocidad, más pasos por segundo y más rápido progresa el aprendizaje y la partida visible."},
      {h:"Lo que NO cambia",cuerpo:"<b>No altera la física ni el modelo</b>. La pelota se mueve exactamente igual en cada paso individual; solo cambia cuántos pasos pasan por unidad de tiempo. Esto es importante: escalar la física rompería la dinámica que el agente intenta aprender. Conviene subirla para ver y entrenar más rápido, y bajarla para observar una partida con calma."}] },
  poolHeadless: { emoji:"🏭", titulo:"Entornos de entrenamiento (headless)", categoria:"Control",
    resumen:"Las partidas que realmente generan los datos de aprendizaje.",
    secciones:[
      {h:"Qué hace",cuerpo:"Fija cuántos entornos corren <b>sin dibujarse</b> para producir las experiencias de entrenamiento. Al ir en paralelo y procesarse en lotes sobre la GPU, son muchísimo más eficientes que las partidas visibles."},
      {h:"Por qué importa el número",cuerpo:"Más entornos significan más experiencias por segundo y, sobre todo, <b>gradientes más estables</b>: cada actualización se basa en una variedad mayor de situaciones, lo que reduce el ruido del aprendizaje. El coste es más cómputo por paso."}],
    dato:"Rango de 50 a 2.000 entornos. Por defecto, 256." },
  poolVisual: { emoji:"👁️", titulo:"Entornos visuales", categoria:"Control",
    resumen:"Los pocos entornos que se dibujan para poder observarlos.",
    secciones:[
      {h:"Qué hace",cuerpo:"Fija cuántos entornos se dibujan en pantalla. Ejecutan la <b>misma política</b> del agente que los entornos de entrenamiento, pero su única función es la observación."},
      {h:"Su papel",cuerpo:"No generan la mayoría de los datos con los que el agente aprende (de eso se encargan los headless); son una ventana para ver con tus ojos cómo se comporta la política mientras mejora. Mantener pocos evita gastar cómputo en dibujar cuando lo que importa es entrenar."}] },
  shaping: { emoji:"🎯", titulo:"Reward shaping potencial", categoria:"Control",
    resumen:"Una recompensa densa que acelera el aprendizaje sin cambiar la meta.",
    secciones:[
      {h:"Qué hace",cuerpo:"Añade una pequeña recompensa por acercar la pala a la vertical de la pelota, basada en la distancia entre ambas: <span class=\"mono\">Φ(s) = −|pelota.x − pala.x|</span>. Así el agente recibe señal útil en <b>cada paso</b>, no solo en los momentos puntuales de romper un ladrillo o perder la bola."},
      {h:"Por qué ayuda",cuerpo:"Al principio, las recompensas naturales son muy escasas (pasan muchos pasos sin que ocurra nada premiado), y aprender con una señal tan rara es lento. El shaping rellena ese vacío con una pista continua —«acércate a la pelota»— que orienta al agente mientras descubre lo demás."},
      {h:"Por qué es seguro",cuerpo:"Es un shaping <b>basado en potencial</b> (Ng et al., 1999): matemáticamente está construido de forma que <b>no cambia la política óptima</b>, solo acelera el camino hacia ella. Es una ayuda, no un atajo que distorsione la meta. Desactivarlo permite comprobar cuánto cuesta aprender sin esa pista, y reinicia el agente porque cambia la señal de recompensa."}],
    formula:"recompensa de modelado = γ·Φ(s') − Φ(s)   ·   coef. 0.30" },

  // ───────────────────────── TRANSICIÓN (componentes) ─────────────────────────
  estado: { emoji:"👁️", titulo:"Estado (s)", categoria:"Concepto",
    resumen:"Toda la información sobre la que el agente decide.",
    secciones:[
      {h:"Qué es",cuerpo:"El <b>estado</b> es la «foto» del juego que recibe la red en cada paso: un vector de <b>6 números</b> normalizados aproximadamente al rango [-1, 1]. En concreto: la posición horizontal y vertical de la pelota, su velocidad horizontal y vertical, la posición horizontal de la pala y la distancia entre la pelota y la pala."},
      {h:"Por qué estos 6",cuerpo:"Son la información mínima suficiente para decidir bien: dónde está la pelota, hacia dónde va y dónde está la pala respecto a ella. La red no ve los píxeles del juego ni los ladrillos individuales; trabaja con esta representación compacta, que es la única ventana del agente al mundo."},
      {h:"En el panel",cuerpo:"En la tira de transición se muestra un resumen legible (por ejemplo, las coordenadas de la pelota), pero lo que entra de verdad en la red son los 6 números completos."}] },
  accion: { emoji:"🎮", titulo:"Acción (a)", categoria:"Concepto",
    resumen:"La decisión que el agente toma en cada paso.",
    secciones:[
      {h:"Qué es",cuerpo:"La <b>acción</b> es lo único que el agente controla. Hay <b>3 acciones discretas</b>: mover la pala a la izquierda, mantenerla quieta o moverla a la derecha. La política convierte el estado observado en una de estas tres elecciones."},
      {h:"Cómo se elige",cuerpo:"Depende del algoritmo. Los basados en valor (DQN, World Model) eligen la acción de mayor valor Q, salvo cuando exploran al azar. Los de política (PPO, SAC) producen una probabilidad para cada acción y muestrean de ahí, de modo que incluso las menos probables se prueban de vez en cuando."}] },
  recompensa: { emoji:"🎁", titulo:"Recompensa (r)", categoria:"Concepto",
    resumen:"El premio o castigo que el entorno devuelve por cada paso.",
    secciones:[
      {h:"Qué es",cuerpo:"La <b>recompensa</b> es la única guía del agente: un número que el entorno entrega en cada paso y que el agente trata de maximizar a largo plazo. No se le dice qué hacer; solo se le premia o castiga, y de esa señal deduce qué conviene."},
      {h:"De qué se compone aquí",cuerpo:"Es la suma de los eventos del paso. Devolver la pelota con la pala vale <span class=\"mono\">+0.2</span>; romper un ladrillo, <span class=\"mono\">+1.0</span> (más un bonus de combo si se encadenan varios sin que la bola vuelva a la pala); perder la pelota, <span class=\"mono\">−1.0</span>; completar el nivel, <span class=\"mono\">+5.0</span>. A esto se añade, si está activo, la pequeña recompensa del shaping."},
      {h:"El combo",cuerpo:"El bonus de combo (<span class=\"mono\">+0.5</span> por cada ladrillo extra de una misma subida, sin tocar la pala) premia la jugada maestra del Breakout: colar la bola por un lateral y reventar muchos ladrillos de golpe por arriba. Incentiva no conformarse con romper de uno en uno."}] },
  estadoSiguiente: { emoji:"➡️", titulo:"Estado siguiente (s')", categoria:"Concepto",
    resumen:"El estado al que lleva la acción.",
    secciones:[
      {h:"Qué es",cuerpo:"El <b>estado siguiente</b> <span class=\"mono\">s'</span> es la foto del juego justo después de aplicar la acción: la nueva situación que resulta de moverse un paso. Junto con el estado, la acción y la recompensa, completa la transición."},
      {h:"Para qué se usa",cuerpo:"Es la pieza que conecta el presente con el futuro. La red lo usa para estimar cuánto vale lo que viene después y descontarlo en el objetivo de aprendizaje (la parte <span class=\"mono\">γ·Q(s')</span> de la ecuación de Bellman). Así el agente aprende no solo del premio inmediato, sino de las consecuencias a las que conduce cada acción."}] },
  done: { emoji:"🏁", titulo:"¿Terminado? (done)", categoria:"Concepto",
    resumen:"Indica si el episodio acabó en este paso.",
    secciones:[
      {h:"Qué es",cuerpo:"<span class=\"mono\">done</span> vale verdadero si el episodio terminó en este paso. Aquí ocurre por tres motivos: se perdió la pelota (cae por abajo), se limpió el nivel (se rompieron los 28 ladrillos) o se agotó el tiempo (el límite de 600 pasos por episodio)."},
      {h:"Por qué importa para aprender",cuerpo:"Cuando <span class=\"mono\">done</span> es verdadero, al calcular el objetivo de aprendizaje <b>no se mira el futuro</b>: el episodio se acabó, así que no hay un estado siguiente cuyo valor sumar. Por eso en las fórmulas aparece el factor <span class=\"mono\">(1−done)</span>, que anula la parte del futuro justo en las transiciones terminales. Distinguir bien el fin de un episodio es clave para que las estimaciones de valor sean correctas."}] },

  // ───────────────────────── DATO DE PARTIDA ─────────────────────────
  rewardEpisodio: { emoji:"🏆", titulo:"Recompensa del episodio", categoria:"Métrica",
    resumen:"Los puntos acumulados en la partida que se observa.",
    secciones:[
      {h:"Qué mide",cuerpo:"La suma de todos los premios y castigos del episodio en curso de la partida observada: rebotes con la pala, ladrillos rotos (con sus combos), la penalización si se pierde la pelota y el shaping. Es exactamente la cifra que el agente intenta maximizar."},
      {h:"Cómo evoluciona",cuerpo:"Crece mientras la partida va bien (cada rebote y cada ladrillo suman) y cae de golpe si se pierde la pelota. Al terminar el episodio se reinicia a cero para la siguiente partida. Observada a lo largo de muchas partidas, su nivel medio es lo que resume la métrica principal de recompensa."}] },
};

const COLOR_SOFT = {
  Algoritmo: "#eff4fe",
  Concepto: "#f4effe",
  Métrica: "#e9fbf4",
  Dato: "#e7f7fb",
  Control: "#fef3e6",
  Interfaz: "#e7f7fb",
};

export function colorCategoria(cat) {
  return COLOR[cat] || "#2563eb";
}
export function colorSoftCategoria(cat) {
  return COLOR_SOFT[cat] || "#eff4fe";
}
