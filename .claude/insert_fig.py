#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Inserta diagramas conceptuales en secciones de la Parte I (tras su <p class="pregunta">)."""
import re, io

FIGS = {
 '1.1': ('dg_paradigmas.svg',
   'Las tres familias del aprendizaje automático. En el <b>supervisado</b> cada ejemplo trae su respuesta correcta; '
   'en el <b>no supervisado</b> solo hay datos sin etiqueta; en el <b>refuerzo</b> no hay respuestas, solo una '
   'recompensa que llega —a veces tarde— como consecuencia de actuar. Esa diferencia define todo el libro.'),
 '2.1': ('transicion.jpg',
   'Una transición, la unidad mínima del aprendizaje por refuerzo: desde el estado <span class="mono">s</span> el '
   'agente toma la acción <span class="mono">a</span>, recibe la recompensa <span class="mono">r</span> y aparece el '
   'nuevo estado <span class="mono">s′</span> (y <span class="mono">done</span> si la partida acabó). Millones de '
   'estas tuplas son todo lo que el agente llega a saber del juego.'),
 '2.4': ('dg_valor.svg',
   'Dos maneras de medir «lo bueno»: el valor del estado <span class="mono">V(s)</span> resume cómo de prometedora es '
   'una situación, y el valor de acción <span class="mono">Q(s,a)</span> afina esa medida para cada movimiento '
   'posible. DQN aprende <span class="mono">Q</span>; la política sale de elegir el <span class="mono">Q</span> mayor.'),
 '2.5': ('dg_entropia.svg',
   'La entropía mide cuánta variedad guarda una política en sus decisiones: alta cuando reparte probabilidad entre '
   'varias acciones (explora), baja cuando apuesta casi todo a una (explota). Regularla es el corazón del equilibrio '
   'entre exploración y explotación.'),
 '2.6': ('replay_conceptual.jpg',
   'El <i>replay buffer</i> guarda las transiciones vividas y las vuelve a muestrear al azar para entrenar. Así rompe '
   'la correlación entre experiencias consecutivas y reaprovecha cada jugada muchas veces, en lugar de usarla una sola '
   'vez y tirarla.'),
}

text = io.open('.claude/chapters_v3.html', encoding='utf-8').read()
parts = text.split('</section>')
n = 0
for i, chunk in enumerate(parts):
    m = re.search(r'·\s*(\d+\.\d+)</div>', chunk)
    if not m or m.group(1) not in FIGS: continue
    img, cap = FIGS[m.group(1)]
    if f'assets/{img}' in chunk: continue   # idempotente
    pm = re.search(r'(<p class="pregunta">.*?</p>)', chunk, re.S)
    if not pm: continue
    fig = (f'\n<figure><img src="assets/{img}" alt="{re.sub(chr(60)+"[^"+chr(62)+"]*"+chr(62),"",cap)[:120]}">'
           f'<figcaption>{cap}</figcaption></figure>')
    parts[i] = chunk[:pm.end()] + fig + chunk[pm.end():]
    n += 1
io.open('.claude/chapters_v3.html', 'w', encoding='utf-8').write('</section>'.join(parts))
print('diagramas insertados en Parte I:', n)
