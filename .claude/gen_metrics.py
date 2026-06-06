#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Genera gráficas y tabla de métricas del libro v3 a partir de results/ledger.csv
   (y results/curves/*.csv), 100% datos reales del protocolo congelado.
   Salidas en docs/assets/: m_eficiencia.png, m_ablacion.png, m_convergencia.png
   y el fragmento HTML .claude/m_tabla.html (tabla maestra para empotrar).
   Eje TIEMPO/COSTE (decision D1): coste = pasos de entrenamiento (budget) y
   pasos-para-limpiar; NO hay wall-clock y no se inventa."""
import csv, glob, statistics as st, io, os
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROWS = [r for r in csv.DictReader(open('results/ledger.csv')) if r['status'] == 'done']
BUDGETS = [700000, 1500000, 3000000]
# 6 "personajes" (orden de mejor a peor a 1.5M); nombre y color de marca
MODELS = [
    ('ppo',                  'PPO',          '#2563eb'),
    ('sac_pure',             'SAC-pure',     '#0891b2'),
    ('dqn',                  'DQN',          '#7c3aed'),
    ('sac',                  'SAC-híbrido',  '#db2777'),
    ('worldModel',           'World Model',  '#059669'),
    ('worldModelRecurrente', 'WM-RNN',       '#b45309'),
]

def cell(model, variant, budget, col):
    v = [float(r[col]) for r in ROWS if r['model']==model and r['variant']==variant and int(r['budget'])==budget]
    return v or None

def pct_mean(model, variant, budget, col):
    v = cell(model, variant, budget, col)
    return 100*st.mean(v) if v else None

plt.rcParams.update({'font.size': 11, 'axes.titlesize': 13, 'axes.titleweight': 'bold',
                     'svg.fonttype': 'none', 'axes.spines.top': False, 'axes.spines.right': False})

# ───────────────────────── 1) EFICIENCIA MUESTRAL (tiempo/coste) ─────────────────────────
fig, ax = plt.subplots(figsize=(7.6, 4.6), dpi=150)
xs = [0.7, 1.5, 3.0]
for key, name, color in MODELS:
    ys = [pct_mean(key, 'base', b, 'success_test_id') for b in BUDGETS]
    pts = [(x, y) for x, y in zip(xs, ys) if y is not None]
    if not pts: continue
    px, py = zip(*pts)
    ax.plot(px, py, '-o', color=color, lw=2.4, ms=7, label=name)
    ax.annotate(f'{py[-1]:.0f}', (px[-1], py[-1]), textcoords='offset points',
                xytext=(8, 0), color=color, fontweight='bold', fontsize=10, va='center')
ax.set_xticks(xs); ax.set_xticklabels(['700k', '1,5 M', '3 M'])
ax.set_xlabel('Presupuesto de entrenamiento (pasos) — el coste en cómputo')
ax.set_ylabel('Éxito en TEST-ID (%)  ·  media de 5 semillas')
ax.set_title('Eficiencia muestral: cuánto cómputo cuesta cada punto de éxito')
ax.set_ylim(0, 100); ax.grid(True, alpha=.25)
ax.legend(loc='lower right', frameon=False, fontsize=9.5, ncol=2)
fig.tight_layout(); fig.savefig('docs/assets/m_eficiencia.png'); plt.close(fig)

# ───────────────────────── 2) ABLACIÓN (qué ingrediente desbloquea) ─────────────────────────
BASE = pct_mean('dqn', 'base', 1500000, 'success_test_id')
ABL = [  # (etiqueta, variante) a 1.5M; Δ = variante − base
    ('Sin shaping Φ (quitarlo)',        'sin_shaping'),
    ('Sin currículo',                   'sin_curriculo'),
    ('ε-decay lento (en vez de rápido)','epsdecay_lento'),
    ('Encoder conv → lista plana (MLP)','flat'),
    ('Timeout proporcional → constante','timeout_proporcional'),
    ('Escala de la señal → baja',       'sin_escala'),
]
labs, deltas = [], []
for lab, var in ABL:
    m = pct_mean('dqn', var, 1500000, 'success_test_id')
    if m is None: continue
    labs.append(lab); deltas.append(m - BASE)
order = np.argsort(deltas)
labs = [labs[i] for i in order]; deltas = [deltas[i] for i in order]
fig, ax = plt.subplots(figsize=(7.8, 4.4), dpi=150)
colors = ['#059669' if d >= 0 else ('#dc2626' if d < -15 else '#f59e0b') for d in deltas]
bars = ax.barh(labs, deltas, color=colors, height=.62)
for b, d in zip(bars, deltas):
    ax.text(d + (1.2 if d >= 0 else -1.2), b.get_y()+b.get_height()/2,
            f'{d:+.1f}', va='center', ha='left' if d >= 0 else 'right', fontweight='bold', fontsize=10)
ax.axvline(0, color='#334155', lw=1)
ax.set_xlabel(f'Variación del éxito TEST-ID frente a la receta completa (DQN base = {BASE:.0f}%)')
ax.set_title('Ablación: se quita un ingrediente y se mide el daño')
ax.set_xlim(-90, 20); ax.grid(True, axis='x', alpha=.25)
fig.tight_layout(); fig.savefig('docs/assets/m_ablacion.png'); plt.close(fig)

# ───────────────────────── 3) CONVERGENCIA (curvas reales de evaluación) ─────────────────────────
def mean_curve(model, budget, n=200):
    files = sorted(glob.glob(f'results/curves/{model}__base__b{budget}__s*.csv'))
    series = []
    for f in files:
        d = list(csv.DictReader(open(f)))
        xs = np.array([float(r['step']) for r in d]); ys = np.array([float(r['success_rate_eval']) for r in d])
        if len(xs) > 2: series.append((xs, ys))
    if not series: return None
    top = min(s[0].max() for s in series)
    grid = np.linspace(0, top, n)
    M = np.vstack([np.interp(grid, xs, ys) for xs, ys in series])
    return grid, 100*M.mean(0), len(series)
fig, ax = plt.subplots(figsize=(7.6, 4.6), dpi=150)
plotted = 0
for key, name, color in MODELS:
    bud = next((b for b in (1500000, 3000000, 700000) if glob.glob(f'results/curves/{key}__base__b{b}__s*.csv')), None)
    if bud is None: continue
    res = mean_curve(key, bud)
    if res is None: continue
    grid, mean, nse = res
    ax.plot(grid/1e6, mean, color=color, lw=2.3, label=f'{name} ({bud//1000}k, {nse} sem.)')
    plotted += 1
ax.set_xlabel('Pasos de entrenamiento (millones)')
ax.set_ylabel('Éxito en evaluación (%)  ·  media de semillas')
ax.set_title('Velocidad de convergencia: cuándo empieza a jugar bien')
ax.set_ylim(0, 100); ax.grid(True, alpha=.25); ax.legend(loc='lower right', frameon=False, fontsize=9)
fig.tight_layout(); fig.savefig('docs/assets/m_convergencia.png'); plt.close(fig)

# ───────────────────────── 4) TABLA MAESTRA (HTML para empotrar) ─────────────────────────
def collapse_pct(model, budget):
    v = [r['collapsed']=='True' for r in ROWS if r['model']==model and r['variant']=='base' and int(r['budget'])==budget]
    return 100*sum(v)/len(v) if v else None
def seeds_over(model, budget, thr=0.80):
    v = [float(r['success_test_id'])>=thr for r in ROWS if r['model']==model and r['variant']=='base' and int(r['budget'])==budget]
    return 100*sum(v)/len(v) if v else None
def steps_clear(model, budget):
    v = [float(r['steps_to_clear']) for r in ROWS if r['model']==model and r['variant']=='base' and int(r['budget'])==budget and float(r['steps_to_clear'])>0]
    return st.mean(v) if v else None

B = 1500000
rows_html = []
for key, name, color in MODELS:
    idv = pct_mean(key,'base',B,'success_test_id'); op = pct_mean(key,'base',B,'success_test_ood_pattern')
    od = pct_mean(key,'base',B,'success_test_ood_diff'); col = collapse_pct(key,B); so = seeds_over(key,B); sc = steps_clear(key,B)
    rows_html.append(
        f'<tr><td style="font-weight:700;color:{color}">{name}</td>'
        f'<td>{idv:.0f}</td><td>{op:.0f}</td><td>{od:.0f}</td>'
        f'<td>{col:.0f}%</td><td>{so:.0f}%</td><td>{sc:.0f}</td></tr>')
table = (
 '<table class="compare">\n<tr><th>Algoritmo</th><th>TEST-ID</th><th>OOD-patrón</th><th>OOD-dificultad</th>'
 '<th>% colapsos</th><th>% semillas &gt;80</th><th>Pasos para limpiar</th></tr>\n' + '\n'.join(rows_html) + '\n</table>')
io.open('.claude/m_tabla.html','w',encoding='utf-8').write(table)

print('OK. Generadas: m_eficiencia.png, m_ablacion.png, m_convergencia.png (curvas:%d modelos) y m_tabla.html' % plotted)
print('DQN base 1.5M =', round(BASE,1), '| ablación Δ:', [(l, round(d,1)) for l,d in zip(labs,deltas)])
