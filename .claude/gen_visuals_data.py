#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gráficas de datos nuevas (matplotlib) para los desiertos. Datos reales de
   results/ledger.csv y de la config; las puramente ilustrativas van rotuladas
   como «esquema conceptual». Salida: docs/assets/m_*.png."""
import csv, statistics as st
import numpy as np, matplotlib
matplotlib.use('Agg'); import matplotlib.pyplot as plt
plt.rcParams.update({'font.size':11,'axes.titlesize':13,'axes.titleweight':'bold',
                     'axes.spines.top':False,'axes.spines.right':False})
ALGO=[('ppo','PPO','#2563eb'),('sac_pure','SAC-pure','#0891b2'),('dqn','DQN','#7c3aed'),
      ('sac','SAC-híbrido','#db2777'),('worldModel','World Model','#059669'),('worldModelRecurrente','WM-RNN','#b45309')]
ROWS=[r for r in csv.DictReader(open('results/ledger.csv')) if r['status']=='done']

# 1) trampa del 56% (era ciega) — bars
fig,ax=plt.subplots(figsize=(7.4,4.2),dpi=150)
xs=['Niveles\ndispersos','Rejilla\nllena']; ys=[0,56]; cols=['#94a3b8','#dc2626']
bars=ax.bar(xs,ys,color=cols,width=.55)
for b,y in zip(bars,ys): ax.text(b.get_x()+b.get_width()/2,y+1.5,f'{y}%',ha='center',fontweight='bold')
ax.annotate('TRAMPA: densidad + supervivencia\n(la bola toca ladrillos por física, no por puntería)',
            xy=(1,56),xytext=(0.25,72),fontsize=10,color='#b91c1c',
            arrowprops=dict(arrowstyle='->',color='#b91c1c'))
ax.set_ylim(0,90); ax.set_ylabel('«Éxito» del agente ciego (%)')
ax.set_title('El 56% era un espejismo (≈2 de 28 ladrillos en niveles medios)')
fig.tight_layout(); fig.savefig('docs/assets/m_trampa_56.png'); plt.close(fig)

# 2) el reloj imposible — bars de pasos
fig,ax=plt.subplots(figsize=(7.4,4.0),dpi=150)
xs=['Timeout fijo\n(era ciega)','Pasos necesarios\npara un 8×10']; ys=[600,7200]; cols=['#dc2626','#0c9f6e']
bars=ax.bar(xs,ys,color=cols,width=.5)
for b,y,t in zip(bars,ys,['7,5 pasos/ladrillo','90 pasos/ladrillo']):
    ax.text(b.get_x()+b.get_width()/2,y+120,f'{y:,}'.replace(',','.'),ha='center',fontweight='bold')
    ax.text(b.get_x()+b.get_width()/2,y/2,t,ha='center',color='white',fontweight='bold',fontsize=10)
ax.set_ylim(0,8200); ax.set_ylabel('Pasos disponibles por episodio')
ax.set_title('Muro 1 — el reloj imposible: no era difícil, era inalcanzable')
fig.tight_layout(); fig.savefig('docs/assets/m_reloj.png'); plt.close(fig)

# 3) decaimiento de epsilon (config real DQN: 1.0 -> 0.05 en 25.000 pasos)
fig,ax=plt.subplots(figsize=(7.4,4.0),dpi=150)
x=np.linspace(0,60000,400); eps=np.clip(1.0-(1.0-0.05)*(x/25000),0.05,1.0)
ax.plot(x/1000,eps,color='#f59e0b',lw=2.6)
ax.axvspan(0,25,color='#fef3c7',alpha=.6); ax.axvspan(25,60,color='#dbeafe',alpha=.5)
ax.text(12,0.75,'explora\n(ε alto)',ha='center',color='#b45309',fontweight='bold')
ax.text(43,0.30,'explota\n(ε≈0,05)',ha='center',color='#1d4ed8',fontweight='bold')
ax.set_xlabel('Pasos de entrenamiento (miles)'); ax.set_ylabel('ε (prob. de acción aleatoria)')
ax.set_title('ε-greedy: el horario de exploración (1,0 → 0,05 en 25.000 pasos)')
ax.set_ylim(0,1.05); ax.grid(alpha=.25)
fig.tight_layout(); fig.savefig('docs/assets/m_epsilon_decay.png'); plt.close(fig)

# 4) recompensa vs éxito (ESQUEMA CONCEPTUAL)
fig,ax=plt.subplots(figsize=(7.4,4.0),dpi=150)
t=np.linspace(0,1,100)
ax.plot(t,0.2+0.7*(1-np.exp(-3*t)),color='#2563eb',lw=2.6,label='recompensa media (proxy)')
ax.plot(t,0.02+0.06*t,color='#dc2626',lw=2.6,label='éxito = niveles limpiados')
ax.set_xlabel('Entrenamiento →'); ax.set_ylabel('valor (normalizado)')
ax.set_title('Recompensa alta ≠ ganar  ·  esquema conceptual'); ax.set_ylim(0,1)
ax.legend(loc='center right',frameon=False,fontsize=10); ax.set_xticks([]); ax.grid(alpha=.2)
ax.text(0.5,0.93,'esquema conceptual (no datos)',transform=ax.transAxes,ha='center',fontsize=9,color='#9ca3af')
fig.tight_layout(); fig.savefig('docs/assets/m_recompensa_exito.png'); plt.close(fig)

# 5) descomposición de recompensa (ejemplo: 60 rebotes ×0,2 vs 4 ladrillos ×1) — donut
fig,ax=plt.subplots(figsize=(5.6,4.4),dpi=150)
vals=[12,4]; labs=['Rebotes\n60 × 0,2 = 12  (75%)','Ladrillos\n4 × 1 = 4  (25%)']
ax.pie(vals,labels=labs,colors=['#93c5fd','#0c9f6e'],startangle=90,counterclock=False,
       wedgeprops=dict(width=0.42,edgecolor='white'),textprops=dict(fontsize=11,fontweight='bold'))
ax.text(0,0,'16\ntotal',ha='center',va='center',fontsize=14,fontweight='bold')
ax.set_title('Una recompensa «razonable» puede premiar sobrevivir\n(ejemplo)',fontsize=12)
fig.tight_layout(); fig.savefig('docs/assets/m_descomp_recompensa.png'); plt.close(fig)

# 6) retorno descontado: peso del futuro (ESQUEMA con γ=0,9 y 0,99)
fig,ax=plt.subplots(figsize=(7.4,4.0),dpi=150)
k=np.arange(0,12); w=.38
for off,g,c in [(-w/2,0.9,'#f59e0b'),(w/2,0.99,'#2563eb')]:
    ax.bar(k+off,g**k,width=w,color=c,label=f'γ = {g}'.replace('.',','))
ax.set_xlabel('pasos en el futuro (t)'); ax.set_ylabel('peso de la recompensa a t pasos  (γ^t)')
ax.set_title('El retorno descontado: cuánto pesa el futuro'); ax.legend(frameon=False)
ax.grid(alpha=.2,axis='y')
fig.tight_layout(); fig.savefig('docs/assets/m_retorno.png'); plt.close(fig)

# 7) una run vs cinco semillas (DATOS REALES, TEST-ID a 1,5M) — strip + media
fig,ax=plt.subplots(figsize=(8.0,4.4),dpi=150)
for i,(key,name,c) in enumerate(ALGO):
    v=[100*float(r['success_test_id']) for r in ROWS if r['model']==key and r['variant']=='base' and int(r['budget'])==1500000]
    col=[100*float(r['success_test_id']) for r in ROWS if r['model']==key and r['variant']=='base' and int(r['budget'])==1500000 and r['collapsed']=='True']
    if not v: continue
    xj=np.random.default_rng(i).normal(i,0.06,len(v))
    ax.scatter(xj,v,s=70,color=c,alpha=.85,edgecolor='white',zorder=3,linewidth=1)
    if col:
        cj=np.random.default_rng(i).normal(i,0.06,len(col))
        ax.scatter(cj[:len(col)],col,s=140,facecolors='none',edgecolor='#dc2626',linewidth=2,zorder=4)
    ax.plot([i-0.22,i+0.22],[st.mean(v)]*2,color=c,lw=3,zorder=5)
ax.set_xticks(range(len(ALGO))); ax.set_xticklabels([n for _,n,_ in ALGO],rotation=12,fontsize=9.5)
ax.set_ylabel('Éxito TEST-ID (%) — 5 semillas'); ax.set_ylim(0,100); ax.grid(alpha=.2,axis='y')
ax.set_title('Por qué no se reporta el mejor run: 5 semillas, su media (—) y colapsos (○)')
ax.scatter([],[],s=140,facecolors='none',edgecolor='#dc2626',linewidth=2,label='semilla colapsada')
ax.legend(loc='lower left',frameon=False,fontsize=9)
fig.tight_layout(); fig.savefig('docs/assets/m_semillas.png'); plt.close(fig)

print('Gráficas de datos generadas: m_trampa_56, m_reloj, m_epsilon_decay, m_recompensa_exito, m_descomp_recompensa, m_retorno, m_semillas')
