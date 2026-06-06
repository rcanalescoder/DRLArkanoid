#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Inserta las imágenes de la v2 que faltaban en v3, antes del bloque .experto de cada sección.
   Parte I → chapters_v3.html (por id de banner). Parte II → fichero p2_*.html (1 experto cada uno)."""
import re, io

def figure(src, cap):
    alt = re.sub(r'<[^>]+>', '', cap)[:120]
    return f'\n<figure><img src="{src}" alt="{alt}"><figcaption>{cap}</figcaption></figure>\n'

# Parte I: id de sección -> lista de (src, caption)
P1 = {
 '0.3': [('assets/app_intro_1.jpg',
   'El laboratorio web de un vistazo: a la izquierda la <b>partida observada</b> sobre la rejilla 8×10; en el '
   'centro las <b>métricas clave</b> y las <b>curvas de entrenamiento</b>; a la derecha el <b>inspector</b>, que abre '
   'la red y muestra los valores <span class="mono">Q(s,a)</span> de cada acción. Abajo, el selector de algoritmo y '
   'los controles. Todo lo que cuenta este libro se puede ver aquí en vivo.')],
 '2.2': [('assets/dg_dado.svg',
   'La transición es <b>estocástica</b>: desde un estado y una acción, el siguiente estado no está fijado; sale de una '
   'distribución de probabilidad <span class="mono">P(s′|s,a)</span>, como tirar un dado cargado. El MDP es justo eso: '
   'las reglas del azar del entorno.')],
 '2.5': [('assets/dg_estocastica.svg',
   'Una política <b>determinista</b> elige siempre la misma acción en un estado; una política <b>estocástica</b> '
   'devuelve una distribución de probabilidad sobre las acciones y muestrea de ella. PPO y SAC aprenden políticas '
   'estocásticas: explorar forma parte de su propia definición.')],
 '2.8': [('assets/curvas_vacias.jpg',
   'Las cuatro señales que el laboratorio vigila durante el entrenamiento: <b>recompensa/éxito</b> por episodio, la '
   '<b>pérdida</b> (Huber), el tamaño del <b>replay buffer</b> y el decaimiento de <span class="mono">ε</span>. Aquí '
   'están vacías —antes de entrenar—; se van llenando paso a paso.')],
}
# Parte II: fichero p2 -> lista de (src, caption)
P2 = {
 'p2_datos': [
   ('assets/v2/f2_curvas.png',
    'Curvas de aprendizaje reales: <b>éxito en validación</b> frente a pasos de entorno, con banda mín–máx sobre las '
    '5 semillas (presupuesto 1,5 M). PPO (morado) despega antes y se mantiene arriba; los <i>model-based</i> (WM, '
    'WM-RNN) se quedan atrás. Una banda ancha = semillas dispares, es decir, más riesgo.'),
   ('assets/v2/f4_dificultad.png',
    'Éxito desglosado por <b>dificultad del nivel</b> (número de ladrillos), en TEST-ID a 1,5 M. Todos rinden peor '
    'cuanto más lleno está el nivel, pero el orden se mantiene: PPO aguanta mejor; WM-RNN se desploma. Generalizar a '
    'niveles más densos es lo más difícil.')],
 'p2_ablacion': [
   ('assets/grid_dqn.jpg',
    'La <b>búsqueda en rejilla</b> (grid search) del laboratorio: prueba combinaciones de hiperparámetros —aquí ritmo '
    'de aprendizaje × descuento <span class="mono">γ</span> para DQN—, las entrena con presupuesto corto y las ordena '
    'por recompensa. Es una exploración rápida y ruidosa; la ablación rigurosa (5 semillas, protocolo congelado) es la '
    'que de verdad manda.')],
 'p2_metodo': [
   ('assets/v2/heat_dqn.png',
    'Mapa de <b>limpiabilidad</b> de DQN: cada celda cuenta cuántas veces se rompió ese ladrillo en la evaluación. El '
    'color caliente repartido por todo el tablero dice que el agente <b>apunta</b> a cualquier ladrillo, no solo a los '
    'que la bola toca de paso.'),
   ('assets/v2/heat_ppo.png',
    'El mismo mapa para PPO: cobertura caliente y homogénea de las 80 celdas, incluidas las filas de arriba (las '
    'difíciles). Romper ladrillos en todo el tablero —y no solo sobrevivir— es lo que distingue a un agente que '
    'generaliza.'),
   ('assets/v2/heat_colapso.png',
    'Y así se ve un <b>colapso</b> (una semilla que se atascó): fíjate en la escala, diez veces menor, y en que las '
    'pocas roturas se amontonan en las filas de abajo, por donde la bola pasa por física. Rebota, pero no apunta: '
    'supervivencia degenerada. Por eso el veredicto se mide en éxito (limpiar), no en recompensa.')],
 'p2_jugar': [
   ('assets/app_intro_2.jpg',
    'La mitad inferior del laboratorio: qué <b>conceptos</b> usa cada algoritmo (aquí DQN: replay, red objetivo, '
    'ε-greedy), el <b>flujo de datos</b> entorno→experiencia→buffer→red→política, el <b>replay buffer</b> con el '
    'TD-error de cada transición, y las fichas de las cuatro familias. La interfaz no solo enseña a jugar: enseña el '
    'mecanismo.')],
}

def insert_before_experto(text, figs):
    idx = text.find('<div class="experto">')
    if idx < 0: idx = len(text)
    add = ''.join(figure(s, c) for s, c in figs if s not in text)
    return text[:idx] + add + text[idx:]

# --- Parte I (chapters_v3.html, por sección) ---
t = io.open('.claude/chapters_v3.html', encoding='utf-8').read()
parts = t.split('</section>')
n1 = 0
for i, chunk in enumerate(parts):
    m = re.search(r'·\s*(\d+\.\d+)</div>', chunk)
    if m and m.group(1) in P1:
        new = insert_before_experto(chunk, P1[m.group(1)])
        if new != chunk: parts[i] = new; n1 += 1
io.open('.claude/chapters_v3.html', 'w', encoding='utf-8').write('</section>'.join(parts))
print('Parte I: secciones tocadas =', n1)

# --- Parte II (cada p2_*.html) ---
n2 = 0
for fn, figs in P2.items():
    f = f'.claude/{fn}.html'
    txt = io.open(f, encoding='utf-8').read()
    new = insert_before_experto(txt, figs)
    if new != txt:
        io.open(f, 'w', encoding='utf-8').write(new); n2 += sum(1 for s, _ in figs if s in new)
print('Parte II: figuras insertadas =', n2)
