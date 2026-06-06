#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Construye chapters_full.html = Parte I (chapters_v3.html) + Parte II (p2_*.html envueltos).
   Mismo marco <section> que el workflow original."""
import io

def esc(s): return s.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')

P3 = dict(part='PARTE III · CINCO MANERAS DE APRENDER', band='b-violet', accent='#7c3aed', soft='#f4effe')
P4 = dict(part='PARTE IV · MEDIR DE VERDAD',           band='b-cyan',   accent='#0e7490', soft='#ecfeff')
P5 = dict(part='PARTE V · CIERRE',                     band='b-ink',    accent='#475569', soft='#f1f5f9')

CH = [
 (P3,'3.1','p2_dqn',    'DQN — Deep Q-Network',                  'Aprender el valor de cada acción.'),
 (P3,'3.2','p2_ppo',    'PPO — Proximal Policy Optimization',    'Mejorar la política a pasos prudentes.'),
 (P3,'3.3','p2_sac',    'SAC — Soft Actor-Critic (discreto)',    'Ganar sin dejar de explorar.'),
 (P3,'3.4','p2_wm',     'World Model — Dyna-Q',                  'Practicar en una maqueta del juego.'),
 (P3,'3.5','p2_wmrnn',  'World Model RNN — Dyna-Q + LSTM',       'Imaginar con memoria (y un hallazgo honesto).'),
 (P3,'3.6','p2_cinco',  'Los cinco, cara a cara',                'Valor o política, on u off-policy, con o sin modelo.'),
 (P4,'4.1','p2_datos',  'Qué dicen los datos: el veredicto',     'Éxito en niveles no vistos, media de 5 semillas.'),
 (P4,'4.2','p2_ablacion','La ablación: qué ingrediente desbloquea','Se quita una pieza y se mide el daño.'),
 (P4,'4.3','p2_metodo', 'Cómo se midió (y por qué te puedes fiar)','Protocolo congelado y conjuntos disjuntos.'),
 (P4,'4.4','p2_jugar',  'Jugar: los modelos entrenados, en acción','El laboratorio web, en vivo.'),
 (P5,'5.1','p2_cierre', 'Lo que nos llevamos · Glosario · Código','Síntesis, vocabulario y reproducibilidad.'),
]

def wrap(P, cid, title, tag, body):
    return ('<section class="section">\n'
            f'  <div class="band {P["band"]}"><div class="n">{esc(P["part"])} · {esc(cid)}</div><h2>{esc(title)}</h2>\n'
            f'    <div class="tag">{esc(tag)}</div></div>\n'
            f'  <div class="pad" style="--accent:{P["accent"]};--accent-soft:{P["soft"]}">\n{body}\n  </div>\n</section>')

parte1 = io.open('.claude/chapters_v3.html', encoding='utf-8').read()
secs = [parte1.rstrip()]
for P, cid, fn, title, tag in CH:
    body = io.open(f'.claude/{fn}.html', encoding='utf-8').read().strip()
    secs.append(wrap(P, cid, title, tag, body))
out = '\n\n'.join(secs) + '\n'
io.open('.claude/chapters_full.html', 'w', encoding='utf-8').write(out)
print('chapters_full.html:', len(out), 'chars,', out.count('<section class="section">'), 'secciones')
