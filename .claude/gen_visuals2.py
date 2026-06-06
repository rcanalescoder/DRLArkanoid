#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Lote 2 de infografías/esquemas SVG (mecanismo de fundamentos, 5 algoritmos, medición, cierre).
   Reutiliza el toolkit de gen_visuals.py. Salida: docs/assets/vis_*.svg."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_visuals import *   # T,R,LN,AR,circle,para,wrap,svg,write,esc + paleta + ALGO

def chip(x,y,w,h,title,sub,c,bg):
    return R(x,y,w,h,bg,c,10,1.5)+T(x+w/2,y+h/2-2,title,13.5,800,'middle',c)+(T(x+w/2,y+h/2+15,sub,10.5,400,'middle',INK) if sub else '')

# ---------------- FUNDAMENTOS ----------------
def transicion_atomo():
    W,H=980,250; b=T(40,42,'La transición: el átomo de la experiencia',20,800)
    b+=T(40,64,'El agente no aprende de «partidas»: aprende de millones de estas tuplas.',13,400,fill=SUB)
    items=[('s','estado actual',INTU,INTU_BG),('a','acción',VIO,VIO_BG),('r','recompensa',EVID,EVID_BG),('s′','nuevo estado',CYAN,CYAN_BG),('done','¿terminó?',ERR,ERR_BG)]
    n=len(items); x0=60; xw=170; y=120
    for i,(t,d,c,bg) in enumerate(items):
        x=x0+i*xw
        b+=R(x,y,130,70,bg,c,12,1.6); b+=T(x+65,y+34,t,22,800,'middle',c); b+=T(x+65,y+56,d,11,500,'middle',INK)
        if i<n-1: b+=AR(x+132,y+35,x+xw-2,y+35,SUB,2.4)
    b+=R(40,212,900,28,SOFT,LINE,8,1.2)
    b+=T(60,231,'(s, a, r, s′, done)  —  en Arkanoid: «desde aquí, muevo la pala, gano +1, y queda este tablero»',12.5,600,fill=INK)
    return svg(W,H,b)

def done_terminales():
    W,H=980,250; b=T(40,42,'Cómo termina un episodio (y qué aprende el agente)',20,800)
    cards=[('Limpiar el nivel','recompensa terminal +5','¡objetivo! refuerza la jugada',EVID,EVID_BG),
           ('Perder la bola','recompensa terminal −1','evita lo que llevó a perder',ERR,ERR_BG),
           ('Agotar el tiempo (timeout)','sin recompensa terminal','no llegó: ni premio ni castigo',SUB,'#f5f6f8')]
    bw=290
    for i,(t,r,d,c,bg) in enumerate(cards):
        x=40+i*(bw+15); y=86
        b+=R(x,y,bw,130,bg,c,12,1.6); b+=R(x,y,bw,8,c,c,12,0)
        b+=T(x+16,y+38,t,14,800,fill=c)
        b+=R(x+16,y+54,120,24,'#fff',c,6,1.2); b+=T(x+76,y+71,'done = 1',12,800,'middle',c)
        b+=para(x+16,y+100,r+'. '+d,11.5,500,INK,15,40)
    return svg(W,H,b)

def bellman_puente():
    W,H=980,300; b=T(40,42,'Bellman: un puente al futuro, no solo una fórmula',20,800)
    b+=R(40,86,900,46,'#eef4ff','#cfe0fb',10,1.4)
    b+=T(480,116,'objetivo  =  r  +  γ · (1 − done) · máx Q(s′, a′)',18,800,'middle','#1d4ed8')
    parts=[('r','el premio de AHORA',EVID,90),('γ · máx Q(s′,a′)','lo que vale el FUTURO',INTU,500),]
    b+=R(70,170,360,90,EVID_BG,EVID,12,1.5); b+=T(250,200,'r — premio inmediato',13,800,'middle',EVID); b+=para(90,224,'lo que se gana en este paso (romper, rebotar, perder)',11.5,500,INK,15,42)
    b+=AR(434,215,500,215,SUB,2.6)
    b+=R(510,170,420,90,INTU_BG,INTU,12,1.5); b+=T(720,200,'γ · máx Q(s′, a′) — valor del futuro',13,800,'middle',INTU); b+=para(530,224,'la mejor expectativa desde el estado siguiente; si done=1, el futuro vale 0',11.5,500,INK,15,46)
    return svg(W,H,b)

def td_error():
    W,H=920,250; b=T(40,42,'El TD-error: la «sorpresa» que mueve el aprendizaje',20,800)
    b+=T(40,64,'Es la diferencia entre lo que la red predijo y el objetivo de Bellman. Más sorpresa = más que aprender.',13,400,fill=SUB)
    rows=[('Predicción de la red  Q(s,a)',2.5,'#94a3b8'),('Objetivo de Bellman',3.97,INTU)]
    for i,(t,v,c) in enumerate(rows):
        y=110+i*46; b+=T(60,y,t,12.5,600,fill=INK)
        b+=R(360,y-15,460,20,'#fff',LINE,5,1); b+=R(360,y-15,460*(v/5),20,c,'none',5,0)
        b+=T(828,y,str(v).replace('.',','),12,800,'start',c)
    b+=R(360,196,460*(2.5/5),22,'#fde68a','#f59e0b',5,1.2)
    b+=R(360+460*(2.5/5),196,460*((3.97-2.5)/5),22,'#fca5a5','#dc2626',5,1.4)
    b+=T(360+460*(2.5/5)+30,212,'TD-error = 1,47  (sorpresa)',12,800,'start','#b91c1c')
    return svg(W,H,b)

def dilema():
    W,H=900,250; b=T(40,42,'Exploración vs explotación: el dilema de cada paso',20,800)
    b+=R(60,110,180,70,'#fff',INK,12,1.6); b+=T(150,142,'estado actual',13,800,'middle',INK); b+=T(150,162,'¿qué hago?',11.5,400,'middle',SUB)
    b+=AR(242,135,330,110,EVID,2.6); b+=R(335,86,300,52,EVID_BG,EVID,10,1.5); b+=T(355,108,'EXPLOTAR',12.5,800,fill=EVID); b+=T(355,126,'la acción con mayor Q (lo conocido)',11.5,500,fill=INK)
    b+=AR(242,160,330,190,ERR,2.6); b+=R(335,164,300,52,ERR_BG,ERR,10,1.5); b+=T(355,186,'EXPLORAR',12.5,800,fill=ERR); b+=T(355,204,'probar otra, por si es mejor',11.5,500,fill=INK)
    b+=R(665,110,200,70,SOFT,LINE,10,1.3); b+=para(680,138,'ε-greedy reparte las dos con probabilidad ε',11.5,500,INK,15,26)
    return svg(W,H,b)

def replay_objetivo():
    W,H=980,330; b=T(40,42,'Replay buffer + red objetivo: estudiar bien y a una diana quieta',20,800)
    # buffer
    b+=R(60,90,210,200,SOFT,INTU,12,1.6); b+=T(165,114,'REPLAY BUFFER',13,800,'middle',INTU); b+=T(165,132,'100.000 transiciones',10.5,400,'middle',SUB)
    for i in range(6):
        b+=R(78,144+i*22,174,16,'#fff',LINE,4,1); b+=T(86,156+i*22,'(s, a, r, s′, done)',10.5,400,fill=SUB)
    b+=AR(272,190,340,190,INTU,2.6); b+=T(306,180,'lote',10.5,700,'middle',INTU); b+=T(306,205,'aleatorio',10.5,400,'middle',SUB)
    # online net
    b+=R(345,150,150,80,INTU_BG,INTU,12,1.6); b+=T(420,184,'RED ONLINE',12.5,800,'middle',INTU); b+=T(420,204,'se entrena',11,400,'middle',INK)
    # target net
    b+=R(345,250,150,60,'#fff',SUB,12,1.5,dash='4 3'); b+=T(420,278,'RED OBJETIVO',12,800,'middle',SUB); b+=T(420,296,'calcula el target',10.5,400,'middle',SUB)
    b+=AR(420,232,420,248,SUB,2)
    b+=T(508,200,'soft update de Polyak',12,700,fill=VIO); b+=T(508,218,'θ⁻ ← τθ + (1−τ)θ⁻ , τ=0,01',12,500,fill=INK)
    b+=para(508,250,'la red objetivo persigue a la online MUY despacio: una diana que casi no se mueve, así el aprendizaje no «persigue su propia sombra».',12,500,INK,16,42)
    return svg(W,H,b)

def conv_kernel():
    W,H=980,300; b=T(40,42,'Qué es una convolución: una ventana que se desliza',20,800)
    b+=T(40,64,'Un filtro 3×3 recorre la matriz 8×10 detectando estructuras locales de ladrillos.',13,400,fill=SUB)
    gx,gy,cs=70,96,20
    for r in range(8):
        for c in range(10):
            on=(r*3+c*2)%5 not in (0,)
            b+=R(gx+c*cs,gy+r*cs,cs-3,cs-3,('#3b82f6' if on else '#1f2937'),'none',2,0)
    # ventana 3x3 resaltada
    b+=R(gx+3*cs-2,gy+2*cs-2,3*cs,3*cs,'none','#f59e0b',4,3)
    b+=AR(gx+10*cs+10,gy+3*cs,gx+10*cs+60,gy+3*cs,ERR,2.6)
    det=[('borde',EVID),('hueco',INTU),('columna',VIO),('bloque',ERR)]
    for i,(t,c) in enumerate(det):
        b+=R(gx+10*cs+70,gy+i*38,150,30,'#fff',c,8,1.4); b+=T(gx+10*cs+145,gy+i*38+20,'detecta: '+t,12,700,'middle',c)
    b+=T(gx+10*cs+70+75,gy+170,'mismos pesos en toda la rejilla → respeta la vecindad espacial',11,500,'middle',SUB)
    return svg(W,H,b)

def loss_gradiente():
    W,H=900,300; b=T(40,42,'Entrenar = bajar una cuesta a pasitos',20,800)
    b+=T(40,64,'La pérdida mide el error; el gradiente apunta cuesta abajo; el learning rate fija el tamaño del paso.',13,400,fill=SUB)
    # parabola
    import math
    pts=[];
    for i in range(0,101):
        x=i/100; px=120+x*640; py=250-((x-0.55)**2)*640
        pts.append(f'{px:.1f},{py:.1f}')
    b+=f'<polyline points="{" ".join(pts)}" fill="none" stroke="{INTU}" stroke-width="2.6"/>'
    # punto y paso
    b+=circle(220,250-((0.16-0.55)**2)*640,7,ERR)
    b+=AR(228,250-((0.16-0.55)**2)*640+4,300,250-((0.34-0.55)**2)*640+6,ERR,2.6)
    b+=T(250,150,'paso = learning rate',11.5,700,'middle',ERR)
    b+=circle(120+0.55*640,250-0,8,EVID); b+=T(120+0.55*640,275,'mínimo (menor error)',11,600,'middle',EVID)
    b+=T(120,120,'pérdida',12,700,'middle',SUB)
    return svg(W,H,b)

# ---------------- ALGORITMOS ----------------
def flujo_dqn():
    W,H=980,290; b=T(40,42,'DQN: el ciclo de entrenamiento, paso a paso',20,800)
    steps=['1 jugar','2 guardar\ntransición','3 muestrear\nlote','4 target de\nBellman','5 calcular\npérdida','6 actualizar\nred online','7 soft update\nobjetivo']
    n=len(steps); x0=55; xw=128; y=140; c=ALGO['DQN']
    for i,s in enumerate(steps):
        x=x0+i*xw
        b+=R(x,y-30,108,70,VIO_BG,c,10,1.5)
        for j,ln in enumerate(s.split('\n')): b+=T(x+54,y-6+j*15,ln,11.5,700,'middle',c)
        if i<n-1: b+=AR(x+110,y+5,x+xw-2,y+5,SUB,2.2)
    b+=AR(x0+ (n-1)*xw+54,y+42,x0+54,y+42,EVID,2.2)
    b+=T((x0+ (n-1)*xw+54+x0+54)/2,y+62,'8 · repetir (replay + Bellman + red objetivo encajan aquí)',12,700,'middle',EVID)
    return svg(W,H,b)

def ppo_prudencia():
    W,H=980,300; b=T(40,42,'PPO: mejorar la política a pasos prudentes («proximal»)',20,800)
    b+=R(60,90,400,180,'#fff',ERR,12,1.5); b+=T(80,116,'Salto agresivo',13.5,800,fill=ERR)
    b+=f'<polyline points="80,250 180,150 240,200 300,70 340,240" fill="none" stroke="{ERR}" stroke-width="2.6"/>'
    b+=circle(340,240,7,'#dc2626'); b+=T(370,245,'se cae (política rota)',11.5,600,fill='#b91c1c')
    b+=R(520,90,400,180,'#fff',INTU,12,1.5); b+=T(540,116,'PPO: paso recortado',13.5,800,fill=INTU)
    b+=f'<polyline points="540,250 600,210 660,175 720,150 800,135 880,128" fill="none" stroke="{INTU}" stroke-width="2.6"/>'
    b+=circle(880,128,7,INTU); b+=T(700,250,'ratio en banda [0,8 – 1,2]',11.5,700,'middle',INTU)
    return svg(W,H,b)

def sac_balanza():
    W,H=920,290; b=T(40,42,'SAC: maximizar recompensa SIN dejar de explorar',20,800)
    b+=LN(460,120,460,235,SUB,3); b+=f'<polygon points="430,235 490,235 460,255" fill="{SUB}"/>'
    b+=LN(300,140,620,140,INK,3)
    b+=R(250,90,160,46,EVID_BG,EVID,10,1.5); b+=T(330,118,'recompensa',13,800,'middle',EVID)
    b+=R(510,90,160,46,INTU_BG,INTU,10,1.5); b+=T(590,118,'entropía (variedad)',12.5,800,'middle',INTU)
    b+=R(395,250,130,34,VIO_BG,VIO,8,1.4); b+=T(460,272,'temperatura α',12,800,'middle',VIO)
    b+=para(680,150,'α regula el equilibrio y se AJUSTA sola durante el entrenamiento.',12,500,INK,16,24)
    return svg(W,H,b)

def sac_variantes():
    W,H=920,240; b=T(40,42,'SAC: dos variantes que conviene no confundir',20,800)
    cards=[('SAC-pure (actor)','el ACTOR decide','87% · sube a 91% a 3M','el actor SÍ funciona',EVID,EVID_BG),
           ('SAC-híbrido (crítico)','el crítico guía la acción','61% a 1,5M · 20% colapsos','bimodal: a veces colapsa',ERR,ERR_BG)]
    bw=420
    for i,(t,d,r,lec,c,bg) in enumerate(cards):
        x=40+i*(bw+20); y=84
        b+=R(x,y,bw,130,bg,c,12,1.6); b+=R(x,y,bw,8,c,c,12,0)
        b+=T(x+18,y+38,t,14.5,800,fill=c); b+=T(x+18,y+62,d,12,500,fill=INK)
        b+=R(x+18,y+76,bw-36,28,'#fff',c,7,1.2); b+=T(x+bw/2,y+95,r,12.5,800,'middle',c)
        b+=T(x+18,y+122,'→ '+lec,12,700,fill=c)
    return svg(W,H,b)

def real_imaginado():
    W,H=980,320; b=T(40,42,'World Model (Dyna-Q): aprender de la realidad Y de lo imaginado',20,800)
    c=ALGO['World Model']
    b+=R(60,96,360,80,CYAN_BG,CYAN,12,1.6); b+=T(80,124,'MUNDO REAL',12.5,800,fill=CYAN); b+=T(80,146,'1 transición real por paso',11.5,500,fill=INK); b+=T(80,164,'→ replay',11,400,fill=SUB)
    b+=R(60,206,360,90,'#ecfdf5',c,12,1.6); b+=T(80,234,'MODELO APRENDIDO (maqueta)',12.5,800,fill=c); b+=T(80,256,'5 transiciones IMAGINADAS por paso',11.5,500,fill=INK); b+=T(80,274,'predice (Δs, r, done)',11,400,fill=SUB)
    b+=AR(422,136,520,180,CYAN,2.4); b+=AR(422,250,520,200,c,2.4)
    b+=R(525,165,180,60,VIO_BG,VIO,10,1.5); b+=T(615,190,'entrena la política',12,800,'middle',VIO); b+=T(615,209,'real + imaginado',11,400,'middle',INK)
    b+=R(745,150,190,90,'#fff7ed','#fdba74',12,1.5); b+=T(840,176,'⚠ model bias',12.5,800,'middle',ERR); b+=para(760,198,'si el modelo se equivoca un poco, lo imaginado sesga → techo ~55%',11,500,INK,14,28)
    return svg(W,H,b)

def wm_memoria():
    W,H=920,280; b=T(40,42,'WM-RNN: añadir memoria… que aquí no compensa (hallazgo honesto)',20,800)
    b+=R(60,92,380,150,SOFT,LINE,12,1.4)
    bars=[('World Model',55,ALGO['World Model']),('WM-RNN (+LSTM)',35,ALGO['WM-RNN'])]
    for i,(t,v,c) in enumerate(bars):
        y=120+i*52; b+=T(80,y-6,t,12,700,fill=c)
        b+=R(80,y,300,24,'#fff',LINE,5,1); b+=R(80,y,300*v/100,24,c,'none',5,0); b+=T(80+300*v/100+10,y+17,f'{v}%',12,800,'start',c)
    b+=R(470,92,450,150,'#fff7ed','#fdba74',12,1.5); b+=T(490,120,'Más complejidad, peor resultado:',13,800,fill=ERR)
    for i,t in enumerate(['+ coste (LST M, secuencias de 16 pasos)','+ varianza (resultados inestables)','la observación 8×10 ya es casi markoviana','→ la memoria no tiene nada útil que recordar']):
        b+=T(490,148+i*22,'•  '+t.replace('LST M','LSTM'),11.5,500,fill=INK)
    return svg(W,H,b)

def ficha_cinco():
    W,H=980,330; b=T(40,40,'Los cinco, cara a cara: ficha funcional',20,800)
    cols=['Algoritmo','Qué aprende','Replay','Política','Modelo','Rasgo principal']
    cw=[150,150,90,150,110,220]; x0=30; y0=78; rh=40
    cx=x0
    for j,h in enumerate(cols):
        b+=R(cx,y0,cw[j],rh,'#1f2937','#1f2937',0,0); b+=T(cx+8,y0+25,h,11.5,800,'start','#fff'); cx+=cw[j]
    rows=[('DQN','valor Q(s,a)','sí','off-policy','no','cimiento simple y fiable',ALGO['DQN']),
          ('PPO','política (actor)','no','on-policy','no','el mejor y más fiable (91%)',ALGO['PPO']),
          ('SAC','política + entropía','sí','off-policy','no','estable, pero el más caro',ALGO['SAC']),
          ('World Model','Q + modelo','sí','off-policy','sí','eficiente, techo ~55%',ALGO['World Model']),
          ('WM-RNN','Q + modelo LSTM','sí','off-policy','sí','memoria que no ayuda aquí',ALGO['WM-RNN'])]
    for i,r in enumerate(rows):
        y=y0+rh+i*rh; cx=x0; bg='#fff' if i%2==0 else SOFT
        for j in range(6):
            b+=R(cx,y,cw[j],rh,bg,LINE,0,1)
            txt=r[j]; c=r[6] if j==0 else INK; w=800 if j==0 else 400
            b+=T(cx+8,y+25,txt,11 if j!=0 else 12,w,'start',c); cx+=cw[j]
    return svg(W,H,b)

def eleccion():
    W,H=980,300; b=T(40,42,'¿Qué algoritmo elegir? (criterio práctico)',20,800)
    b+=R(60,130,150,60,'#fff',INK,12,1.6); b+=T(135,160,'¿Qué buscas?',13,800,'middle',INK); b+=T(135,178,'',10,400,'middle',SUB)
    opts=[('fiabilidad','PPO',ALGO['PPO']),('valor + replay','DQN',ALGO['DQN']),('máxima entropía','SAC',ALGO['SAC']),('modelo del mundo','World Model',ALGO['World Model']),('historia parcial','WM-RNN (mide)',ALGO['WM-RNN'])]
    for i,(q,a,c) in enumerate(opts):
        y=70+i*44
        b+=AR(212,160,300,y+16,SUB,1.8)
        b+=T(310,y+5,q,12,600,fill=SUB)
        b+=R(470,y-6,250,32,'#fff',c,8,1.5); b+=T(486,y+15,'→ '+a,12.5,800,fill=c)
    return svg(W,H,b)

# ---------------- MEDICIÓN ----------------
def protocolo_sello():
    W,H=900,300; b=T(40,42,'El protocolo congelado: por qué te puedes fiar',20,800)
    b+=R(60,84,500,196,'#f0fdf9',EVID,14,1.8)
    b+=T(84,116,'❄ PROTOCOLO CONGELADO',15,800,fill='#0a6b4e')
    items=['frozen_hash a1ab7ce18d7bad6b','5 semillas [0,1,2,3,4]','presupuestos 700k / 1,5M / 3M','evaluación GREEDY (sin exploración)','conjuntos disjuntos train/val/test','160 runs reales en ledger.csv']
    for i,t in enumerate(items):
        b+=circle(96,148+i*22,3,EVID); b+=T(108,152+i*22,t,12.5,500,fill=INK)
    b+=R(590,84,290,196,'#fff7ed','#fdba74',14,1.6); b+=T(610,116,'La regla de oro:',13.5,800,fill=ERR)
    b+=para(610,144,'todo se fija ANTES de medir; nunca se re-congela. Sin trucos a posteriori, sin elegir la mejor semilla.',12.5,500,INK,17,28)
    return svg(W,H,b)

def pipeline_exp():
    W,H=980,210; b=T(40,42,'De dónde salen las cifras: el pipeline experimental',20,800)
    steps=[('Generador','5 familias',VIO),('Split','train/val/test',INTU),('Entrenar','×5 semillas',CYAN),('Eval GREEDY','niveles no vistos',EVID),('ledger.csv','160 runs',SUB),('Tablas y figuras','del libro',ERR)]
    n=len(steps); x0=30; xw=158; y=110
    for i,(t,d,c) in enumerate(steps):
        x=x0+i*xw
        b+=R(x,y,140,64,'#fff',c,11,1.5); b+=T(x+70,y+28,t,12.5,800,'middle',c); b+=T(x+70,y+48,d,10.5,400,'middle',INK)
        if i<n-1: b+=AR(x+142,y+32,x+xw-2,y+32,SUB,2.2)
    return svg(W,H,b)

def curvas_galeria():
    W,H=980,300; b=T(40,42,'Cómo leer las curvas en vivo (cuatro formas)',20,800)
    defs=[('Sana','sube y se estabiliza',EVID,[(0,.9),(.3,.55),(.6,.3),(.8,.22),(1,.2)]),
          ('Colapso','sube y se desploma',ERR,[(0,.9),(.3,.4),(.5,.3),(.7,.6),(1,.85)]),
          ('Ruido','oscila sin tendencia',INTU,[(0,.5),(.2,.3),(.35,.6),(.5,.35),(.65,.62),(.8,.4),(1,.55)]),
          ('Estancada','plana, no aprende',SUB,[(0,.7),(.5,.68),(1,.69)])]
    bw=215
    for i,(t,d,c,pts) in enumerate(defs):
        x=40+i*(bw+10); y=92
        b+=R(x,y,bw,160,'#fff',LINE,10,1.3)
        poly=' '.join(f'{x+14+px*(bw-28):.0f},{y+24+py*110:.0f}' for px,py in pts)
        b+=f'<polyline points="{poly}" fill="none" stroke="{c}" stroke-width="2.6"/>'
        b+=T(x+14,y+150,t,12.5,800,fill=c); b+=T(x+bw-12,y+150,d,10,400,'end',SUB)
    return svg(W,H,b)

# ---------------- CIERRE ----------------
def arco_final():
    W,H=980,210; b=T(40,42,'El viaje completo, de un vistazo',20,800)
    hitos=['Agente ciego\n0%','Diagnóstico\n3 muros','La receta\n5 cambios','Fundamentos\nde RL','Cinco\nalgoritmos','Medición\nhonesta','PPO 91%\nreproducible']
    n=len(hitos); x0=70; xw=126; y=130
    cols=[ERR,VIO,INTU,CYAN,VIO,EVID,'#0a6b4e']
    b+=LN(x0,y,x0+(n-1)*xw,y,LINE,2)
    for i,h in enumerate(hitos):
        cx=x0+i*xw; b+=circle(cx,y,11,cols[i])
        for j,ln in enumerate(h.split('\n')): b+=T(cx,y+(34 if j==0 else 49),ln,11,700 if j==0 else 400,'middle',(cols[i] if j==0 else INK))
        if i<n-1: b+=AR(cx+14,y,x0+(i+1)*xw-14,y,SUB,2)
    return svg(W,H,b)

def glosario_mapa():
    W,H=980,380; b=T(40,42,'Mapa de conceptos: el glosario por familias',20,800)
    fam=[('Entorno y experiencia',['estado s','acción a','recompensa r','episodio','transición'],CYAN,CYAN_BG,40,86),
         ('Recompensa y retorno',['retorno G','descuento γ','shaping Φ'],EVID,EVID_BG,360,86),
         ('Valor y política',['V(s)','Q(s,a)','política π','Bellman','TD-error'],INTU,INTU_BG,680,86),
         ('Redes',['neurona','convolución','dos ramas','gradiente'],VIO,VIO_BG,40,236),
         ('Algoritmos',['DQN','PPO','SAC','World Model','WM-RNN'],ERR,ERR_BG,360,236),
         ('Medición',['éxito','TEST/OOD','colapso','GREEDY','semillas'],'#0a6b4e','#f0fdf9',680,236)]
    for t,terms,c,bg,x,y in fam:
        h=40+len(terms)*20
        b+=R(x,y,270,h,bg,c,12,1.5); b+=T(x+16,y+26,t,13,800,fill=c)
        for i,tm in enumerate(terms): b+=T(x+24,y+48+i*20,'· '+tm,11.5,500,fill=INK)
    return svg(W,H,b)

def codigo_resultado():
    W,H=980,190; b=T(40,42,'Del código al resultado: el ciclo reproducible',20,800)
    steps=[('repo','github',SUB),('entorno','Arkanoid',CYAN),('entrenamiento','5 algos · semillas',VIO),('evaluación','GREEDY',EVID),('ledger.csv','fuente de verdad',INTU),('figuras','del libro',ERR),('libro','este PDF','#0a6b4e')]
    n=len(steps); x0=20; xw=137; y=104
    for i,(t,d,c) in enumerate(steps):
        x=x0+i*xw
        b+=R(x,y,120,56,'#fff',c,10,1.5); b+=T(x+60,y+25,t,12,800,'middle',c); b+=T(x+60,y+44,d,9.5,400,'middle',INK)
        if i<n-1: b+=AR(x+122,y+28,x+xw-2,y+28,SUB,2)
    return svg(W,H,b)

DIAGRAMS2={
 'vis_transicion_atomo':transicion_atomo,'vis_done_terminales':done_terminales,'vis_bellman_puente':bellman_puente,
 'vis_td_error':td_error,'vis_dilema':dilema,'vis_replay_objetivo':replay_objetivo,'vis_conv_kernel':conv_kernel,
 'vis_loss_gradiente':loss_gradiente,'vis_flujo_dqn':flujo_dqn,'vis_ppo_prudencia':ppo_prudencia,
 'vis_sac_balanza':sac_balanza,'vis_sac_variantes':sac_variantes,'vis_real_imaginado':real_imaginado,
 'vis_wm_memoria':wm_memoria,'vis_ficha_cinco':ficha_cinco,'vis_eleccion':eleccion,
 'vis_protocolo_sello':protocolo_sello,'vis_pipeline_exp':pipeline_exp,'vis_curvas_galeria':curvas_galeria,
 'vis_arco_final':arco_final,'vis_glosario_mapa':glosario_mapa,'vis_codigo_resultado':codigo_resultado,
}
if __name__=='__main__':
    for name,fn in DIAGRAMS2.items(): write(name,fn())
    print('SVG lote 2 generados:',len(DIAGRAMS2))
    print(' ',', '.join(DIAGRAMS2))
