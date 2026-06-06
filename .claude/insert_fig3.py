#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Integra las infografías/gráficas nuevas (gen_visuals + gen_visuals_data) en sus
   secciones. Posición 'top' = tras la pregunta; 'end' = antes del bloque experto.
   Parte 0/I/II → chapters_v3.html (por id). Parte III/IV/V → p2_*.html."""
import re, io

def fig(src, cap):
    alt=re.sub(r'<[^>]+>','',cap)[:120]
    return f'\n<figure><img src="assets/{src}" alt="{alt}"><figcaption>{cap}</figcaption></figure>\n'

C=dict  # alias
# (archivo de imagen, posición, pie)
PLACE = {
 '0.2':[('vis_niveles_lectura.svg','top','Las cuatro capas de lectura conviven en la misma página: la de intuición es autosuficiente; las demás añaden profundidad para quien la quiera. Puedes parar en la capa que te sirva.'),
        ('vis_leyenda_cajas.svg','end','El idioma visual del libro: cada recuadro tiene color y función fijos. No hay que memorizarlo — aquí están los diez tipos, del «error común» (ámbar) al rojo «para expertos».'),
        ('vis_coreografia.svg','end','Todos los capítulos siguen los mismos nueve pasos, de la pregunta a la autocomprobación. Saber la estructura te dice siempre dónde estás y qué viene después.')],
 '0.3':[('vis_roadmap.svg','top','La ruta completa del libro en cinco tramos, con la pregunta que responde cada uno. Abajo, el gran arco: del agente ciego (0%) a PPO (91% en niveles nunca vistos).'),
        ('vis_personajes.svg','end','Los siete protagonistas y cómo se encadenan: el agente decide una acción, el entorno responde con recompensa y nuevo estado. El valor vive dentro del agente, estimando el futuro.'),
        ('vis_salto_0_91.svg','end','La tesis del libro en una imagen: el salto del 0% al 91% no vino de un algoritmo mágico, sino de reformular la tarea (observación, reloj y meta).')],
 '1.1':[('vis_bucle.svg','top','El bucle agente–entorno, el diagrama base de todo el libro: el agente actúa, el entorno devuelve recompensa y nuevo estado, y el ciclo se repite millones de veces.'),
        ('vis_humano_agente.svg','end','El agente no «entiende» el juego como nosotros: donde el humano ve un tablero, el agente recibe 6 números cinemáticos + una matriz 8×10 de unos y ceros, y una recompensa escasa.')],
 '1.2':[('vis_escalera.svg','top','Cuatro niveles de competencia fáciles de confundir. Una recompensa al alza puede quedarse en el primer escalón; el examen de verdad es el cuarto: generalizar a niveles no vistos.'),
        ('m_recompensa_exito.png','end','Esquema conceptual del mensaje central: la recompensa media (proxy) puede subir mientras el éxito real —limpiar niveles— apenas se mueve. Por eso medimos el logro, no el proxy.'),
        ('m_descomp_recompensa.png','end','Por qué una recompensa «razonable» puede premiar sobrevivir: 60 rebotes a +0,2 pesan 12 puntos frente a los 4 de romper ladrillos. El agente aprende a no perder, no a ganar.'),
        ('vis_lleno_disperso.svg','end','La clave del espejismo del 56%: con el muro lleno la bola rompe ladrillos por física aunque el agente no apunte; en un nivel disperso, atraviesa los huecos si no apunta.')],
 '1.3':[('vis_split_datos.svg','top','El generador reparte los niveles en tres bolsas disjuntas: se aprende en TRAIN, se decide en VALIDACIÓN y se declara el resultado solo en TEST (niveles nunca vistos).'),
        ('vis_tres_examenes.svg','end','Tres niveles de exigencia del examen: TEST-ID (mismo tipo, interpolar), OOD-patrón y OOD-dificultad (familias y densidades nuevas, generalizar de verdad).')],
 '1.4':[('vis_ciego_ojos.svg','top','La misma escena, dos observaciones. Sin la matriz de ladrillos en la entrada, el agente puede rebotar pero no elegir objetivo: el techo es de información, no de entrenamiento.'),
        ('m_trampa_56.png','end','Los resultados del agente ciego: 0% en niveles dispersos y un 56% engañoso solo en la rejilla llena, donde la bola toca ladrillos por física. Un número alto que no medía puntería.')],
 '1.5':[('vis_tres_muros.svg','top','El diagnóstico de un vistazo: tres muros (reloj, recompensa, observación), cada uno con su síntoma, la hipótesis falsa, la prueba que lo destapa, la causa real y el arreglo.'),
        ('m_reloj.png','end','Muro 1 cuantificado: con el reloj fijo de 600 pasos, un tablero de 80 ladrillos era inalcanzable (≈7,5 pasos/ladrillo). El arreglo —timeout proporcional— da 90 pasos por ladrillo.'),
        ('vis_shaping.svg','end','Muro 2: cómo una ayuda saboteaba el objetivo. El shaping Φ premiaba acercar la pala a la bola; el agente aprendió a sobrevivir, no a apuntar. Quitarlo subió el éxito +8 puntos.')],
 '1.6':[('vis_receta.svg','top','Los cinco ingredientes que convierten el problema en aprendible, cada uno atacando un muro distinto. El número es su aporte medido en la ablación; juntos llevan del 0% al 91%.')],
 '2.2':[('vis_mdp_pomdp.svg','top','MDP frente a POMDP sin formalismo: si la observación contiene todo lo relevante (matriz 8×10), el problema es casi observable; si oculta los ladrillos (agente ciego), es parcial y tiene techo.')],
 '2.3':[('m_retorno.png','end','El descuento, visto: cada recompensa futura pesa γ^t. Con γ=0,99 el futuro pesa casi tanto como el presente (agente previsor); con γ=0,9 se desvanece rápido (cortoplacista).')],
 '2.4':[('vis_v_q.svg','top','Dos maneras de medir «lo bueno»: V(s) resume la situación; Q(s,a) afina por acción. DQN aprende Q y actúa eligiendo el mayor (aquí, «mantener»).')],
 '2.5':[('m_epsilon_decay.png','end','El horario de exploración de ε-greedy: empieza explorando casi siempre (ε=1,0) y baja a ε=0,05 en 25.000 pasos. Mucho azar al principio, casi nada al final.')],
 '2.7':[('vis_dos_ramas.svg','top','La red de dos ramas: la matriz 8×10 entra por un encoder convolucional y los 6 cinemáticos por una rama densa; se concatenan y la cabeza cambia según el algoritmo. El sesgo espacial de la conv vale ~20 puntos.')],
}
P2 = {
 'p2_cinco':[('vis_taxonomia.svg','top','Los cinco algoritmos en un mapa: el eje vertical es qué aprenden (valor↔política), el horizontal si usan modelo del mundo, y la forma distingue on-policy (PPO) de off-policy (el resto).')],
 'p2_metodo':[('m_semillas.png','end','Por qué no se reporta la mejor ejecución: cada algoritmo se entrena con 5 semillas; mostramos sus cinco puntos, la media (raya) y los colapsos (círculo rojo). SAC-híbrido tiene una semilla hundida.')],
 'p2_cierre':[('vis_lecciones_finales.svg','top','Las cuatro lecciones para llevarse: medir en lo no visto, recompensa ≠ éxito, la formulación pesa más que el algoritmo, y a veces quitar (el shaping Φ) mejora.')],
}

def apply(text, items):
    tops=''.join(fig(s,c) for s,p,c in items if p=='top' and f'assets/{s}' not in text)
    ends=''.join(fig(s,c) for s,p,c in items if p=='end' and f'assets/{s}' not in text)
    if ends:
        idx=text.find('<div class="experto">'); idx=idx if idx>=0 else len(text)
        text=text[:idx]+ends+text[idx:]
    if tops:
        m=re.search(r'(<p class="pregunta">.*?</p>)',text,re.S)
        if m: text=text[:m.end()]+tops+text[m.end():]
        else: text=tops+text
    return text

# --- Parte 0/I/II ---
t=io.open('.claude/chapters_v3.html',encoding='utf-8').read()
parts=t.split('</section>'); n=0
for i,ch in enumerate(parts):
    m=re.search(r'·\s*(\d+\.\d+)</div>',ch)
    if m and m.group(1) in PLACE:
        new=apply(ch,PLACE[m.group(1)])
        if new!=ch: parts[i]=new; n+=1
io.open('.claude/chapters_v3.html','w',encoding='utf-8').write('</section>'.join(parts))
print('secciones Parte 0/I/II tocadas:',n)

# --- Parte III/IV/V ---
m2=0
for fn,items in P2.items():
    f=f'.claude/{fn}.html'; txt=io.open(f,encoding='utf-8').read()
    new=apply(txt,items)
    if new!=txt: io.open(f,'w',encoding='utf-8').write(new); m2+=1
print('ficheros p2 tocados:',m2)
