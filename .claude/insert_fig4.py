#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Integra el lote 2 de visuales (gen_visuals2) en fundamentos y Parte III/IV/V."""
import re, io
def fig(src,cap):
    alt=re.sub(r'<[^>]+>','',cap)[:120]
    return f'\n<figure><img src="assets/{src}" alt="{alt}"><figcaption>{cap}</figcaption></figure>\n'
def apply(text,items):
    tops=''.join(fig(s,c) for s,p,c in items if p=='top' and f'assets/{s}' not in text)
    ends=''.join(fig(s,c) for s,p,c in items if p=='end' and f'assets/{s}' not in text)
    if ends:
        idx=text.find('<div class="experto">'); idx=idx if idx>=0 else len(text)
        text=text[:idx]+ends+text[idx:]
    if tops:
        m=re.search(r'(<p class="pregunta">.*?</p>)',text,re.S)
        text=(text[:m.end()]+tops+text[m.end():]) if m else tops+text
    return text

PLACE={
 '2.1':[('vis_transicion_atomo.svg','top','La unidad mínima del aprendizaje: una tupla (s, a, r, s′, done). El agente no aprende de partidas enteras, sino de millones de estas transiciones.'),
        ('vis_done_terminales.svg','end','Un episodio puede terminar de tres formas; solo dos dan recompensa terminal. Cuando done=1, el futuro vale 0 y el agente aprende del desenlace.')],
 '2.4':[('vis_bellman_puente.svg','end','El objetivo de Bellman es un puente: suma el premio de ahora (r) y lo que vale el futuro (γ·máx Q). Si el episodio terminó (done=1), el futuro desaparece.'),
        ('vis_td_error.svg','end','El TD-error es la sorpresa: cuánto se desvió la predicción de la red del objetivo de Bellman. Las transiciones más sorprendentes son las que más enseñan.')],
 '2.5':[('vis_dilema.svg','top','En cada paso, el dilema: explotar la mejor acción conocida o explorar otra por si es mejor. ε-greedy reparte las dos con probabilidad ε.')],
 '2.6':[('vis_replay_objetivo.svg','top','Dos piezas de estabilidad: el replay buffer baraja experiencias para romper la correlación temporal; la red objetivo fija un blanco lento (soft update τ=0,01) para no perseguir la propia sombra.')],
 '2.7':[('vis_conv_kernel.svg','end','Una convolución es un filtro 3×3 que recorre la matriz 8×10 detectando estructuras locales (bordes, huecos, columnas). Comparte pesos por todo el tablero: por eso respeta la vecindad espacial.')],
 '2.8':[('vis_loss_gradiente.svg','top','Entrenar es bajar una cuesta: la pérdida mide el error, el gradiente apunta cuesta abajo y el learning rate fija el tamaño del paso (rápido pero inestable vs. lento pero seguro).')],
}
P2={
 'p2_dqn':[('vis_flujo_dqn.svg','top','El ciclo de DQN: jugar, guardar la transición, muestrear un lote, calcular el objetivo de Bellman y la pérdida, actualizar la red online y, despacio, la objetivo. Aquí encajan replay y red objetivo.')],
 'p2_ppo':[('vis_ppo_prudencia.svg','top','Por qué «proximal»: una actualización agresiva puede romper la política; PPO da pasos pequeños y recorta el cambio para mantener el ratio en la banda [0,8–1,2]. Prudencia que paga (el mejor resultado).')],
 'p2_sac':[('vis_sac_balanza.svg','top','SAC busca dos cosas a la vez: recompensa y variedad (entropía). La temperatura α es el fiel de la balanza, y se ajusta sola durante el entrenamiento.'),
           ('vis_sac_variantes.svg','end','Cuidado al leer SAC: el actor puro funciona (87%, sube a 91% a 3M); la variante híbrida es bimodal (61%, a veces colapsa). No son lo mismo.')],
 'p2_wm':[('vis_real_imaginado.svg','top','Dyna-Q entrena con la realidad y con la imaginación: por cada paso real, 5 transiciones imaginadas por un modelo aprendido. El precio es el model bias: si el modelo se equivoca, lo imaginado sesga (techo ~55%).')],
 'p2_wmrnn':[('vis_wm_memoria.svg','top','El hallazgo honesto: añadir memoria (LSTM) al World Model no mejora aquí (55%→35%). Más coste y varianza, y la observación 8×10 ya es casi markoviana: la memoria no tiene nada útil que recordar.')],
 'p2_cinco':[('vis_ficha_cinco.svg','end','Los cinco, en una ficha funcional: qué aprende cada uno, si usa replay, on/off-policy, si tiene modelo del mundo y su rasgo principal. Diferencias de fondo, no de nombre.'),
             ('vis_eleccion.svg','end','Un criterio práctico: según qué busques, qué familia conviene. La regla del WM-RNN: si crees que hay historia parcial importante, considéralo… pero mídelo.')],
 'p2_metodo':[('vis_protocolo_sello.svg','top','El sello del rigor: semillas, presupuestos, evaluación GREEDY y conjuntos disjuntos se fijan ANTES de medir (frozen_hash) y nunca se re-congelan. Reproducibilidad sin trucos a posteriori.'),
              ('vis_pipeline_exp.svg','end','De dónde salen las cifras: generador → conjuntos disjuntos → entrenar (5 semillas) → evaluación GREEDY → ledger.csv → las tablas y figuras de este libro.')],
 'p2_jugar':[('vis_curvas_galeria.svg','top','Cómo mirar las curvas en vivo con criterio: una sana sube y se estabiliza; un colapso sube y se desploma; el ruido oscila; una plana es estancamiento.')],
 'p2_cierre':[('vis_arco_final.svg','top','El viaje completo: del agente ciego (0%) al diagnóstico de los tres muros, la receta, los fundamentos, los cinco algoritmos, la medición honesta y PPO al 91% reproducible.'),
              ('vis_glosario_mapa.svg','end','El glosario como sistema, no como lista: los términos agrupados por familias (entorno, recompensa, valor/política, redes, algoritmos, medición).'),
              ('vis_codigo_resultado.svg','end','El ciclo reproducible cerrado: del repositorio al entorno, el entrenamiento, la evaluación, el ledger, las figuras y, finalmente, este libro.')],
}
t=io.open('.claude/chapters_v3.html',encoding='utf-8').read()
parts=t.split('</section>'); n=0
for i,ch in enumerate(parts):
    m=re.search(r'·\s*(\d+\.\d+)</div>',ch)
    if m and m.group(1) in PLACE:
        new=apply(ch,PLACE[m.group(1)])
        if new!=ch: parts[i]=new; n+=1
io.open('.claude/chapters_v3.html','w',encoding='utf-8').write('</section>'.join(parts))
print('secciones fundamentos tocadas:',n)
m2=0
for fn,items in P2.items():
    f=f'.claude/{fn}.html'; txt=io.open(f,encoding='utf-8').read(); new=apply(txt,items)
    if new!=txt: io.open(f,'w',encoding='utf-8').write(new); m2+=1
print('ficheros p2 tocados:',m2)
