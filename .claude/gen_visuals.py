#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Genera infografías/esquemas SVG (lenguaje visual consistente) para el libro v3.
   Salida: docs/assets/vis_*.svg. Vectoriales → nítidas en el PDF y ligeras.
   Paleta alineada con la propuesta visual y con los colores de algoritmo ya usados."""
import io, os

# ---- paleta ----
INK='#1f2937'; SUB='#6b7280'; LINE='#d8dde6'; SOFT='#f8fafc'
INTU='#2563eb'; INTU_BG='#eff4fe'; CYAN='#0e7490'; CYAN_BG='#ecfeff'
ERR='#b45309'; ERR_BG='#fff8ec'; EVID='#0c9f6e'; EVID_BG='#f0fdf9'
EXP='#991b1b'; EXP_BG='#fff5f5'; VIO='#6d28d9'; VIO_BG='#f4effe'
ALGO={'DQN':'#7c3aed','PPO':'#2563eb','SAC':'#db2777','World Model':'#059669','WM-RNN':'#b45309'}
FONT='-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif'

def esc(s): return str(s).replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
def T(x,y,s,size=14,w=400,anc='start',fill=INK,it=0):
    st=' font-style="italic"' if it else ''
    return f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" font-weight="{w}" text-anchor="{anc}" fill="{fill}"{st}>{esc(s)}</text>'
def R(x,y,w,h,fill='#fff',stroke=LINE,rx=12,sw=1.5,dash=''):
    d=f' stroke-dasharray="{dash}"' if dash else ''
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>'
def LN(x1,y1,x2,y2,color=SUB,sw=2,dash=''):
    d=f' stroke-dasharray="{dash}"' if dash else ''
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{sw}"{d}/>'
def AR(x1,y1,x2,y2,color=SUB,sw=2.4):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{sw}" marker-end="url(#ah-{color.strip(chr(35))})"/>'
def circle(x,y,r,fill,stroke='none',sw=0):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'
def wrap(words,maxc):
    out,cur=[],''
    for wd in words.split():
        if len(cur)+len(wd)+1<=maxc: cur=(cur+' '+wd).strip()
        else: out.append(cur); cur=wd
    if cur: out.append(cur)
    return out
def para(x,y,s,size=12.5,w=400,fill=INK,lh=17,maxc=40,anc='start'):
    return ''.join(T(x,y+i*lh,ln,size,w,anc,fill) for i,ln in enumerate(wrap(s,maxc)))

def svg(w,h,body):
    # marcadores de flecha para los colores usados
    cols=[SUB,INTU,EVID,EXP,ERR,VIO,CYAN,'#dc2626','#334155']
    defs='<defs>'+''.join(
        f'<marker id="ah-{c.strip(chr(35))}" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="{c}"/></marker>'
        for c in cols)+'</defs>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" font-family="{FONT}" '
            f'style="width:100%;height:auto">{defs}<rect width="{w}" height="{h}" fill="#ffffff"/>{body}</svg>')

def write(name,s):
    io.open(f'docs/assets/{name}.svg','w',encoding='utf-8').write(s)
    return name

# ============================================================ DIAGRAMAS

def niveles_lectura():
    W,H=980,300; b=''
    layers=[('Intuición','Para todos · escena de Arkanoid, analogías','Imprescindible',INTU,INTU_BG),
            ('Técnica','Definiciones, variables y fórmulas',' Recomendable',VIO,VIO_BG),
            ('Código','Pseudocódigo e idea de implementación','Opcional',CYAN,CYAN_BG),
            ('Reproducibilidad','Protocolo, semillas, datos','Opcional',EVID,EVID_BG)]
    b+=T(40,46,'Cuatro niveles de lectura superpuestos',20,800)
    b+=T(40,70,'La misma página leída a distinta profundidad. Para en la capa que te sirva.',13,400,fill=SUB)
    y=96
    for i,(t,d,who,c,bg) in enumerate(layers):
        b+=R(40+i*14,y,880-i*28,40,bg,c,10,1.5)
        b+=circle(64+i*14,y+20,6,c)
        b+=T(82+i*14,y+19,t,14.5,800,fill=c)
        b+=T(82+i*14,y+33,d,11.5,400,fill=INK)
        b+=T(900-i*14,y+24,who,11,700,'end',c)
        y+=48
    return svg(W,H,b)

def leyenda_cajas():
    W,H=980,360; b=T(40,44,'El sistema de cajas: el idioma visual del libro',20,800)
    b+=T(40,67,'Cada recuadro tiene un color y una función. No hace falta memorizarlos: aquí están todos.',13,400,fill=SUB)
    cajas=[('Antes de la fórmula','qué calcula, en palabras',INTU,INTU_BG),
           ('Traducción al juego','cómo se ve en Arkanoid',CYAN,CYAN_BG),
           ('Error común','la confusión típica',ERR,ERR_BG),
           ('Qué mirar','cómo leer una gráfica',ERR,'#fff8ec'),
           ('Qué no demuestra','los límites del dato',SUB,'#f5f6f8'),
           ('Para curiosos','formalismo opcional',SUB,'#f5f6f8'),
           ('Quédate con esto','la idea para llevar',EVID,EVID_BG),
           ('Autocomprobación','3 preguntas de repaso',EVID,EVID_BG),
           ('Ejercicio','practica el concepto',VIO,VIO_BG),
           ('Y ahora, para expertos','el mismo tema, técnico',EXP,EXP_BG)]
    x0,y0,cw,ch,gx,gy=40,86,300,48,12,10
    for i,(t,d,c,bg) in enumerate(cajas):
        col=i%3; row=i//3; x=x0+col*(cw+gx); y=y0+row*(ch+gy)
        b+=R(x,y,cw,ch,bg,c,9,1.4); b+=R(x,y,5,ch,c,c,0,0)
        b+=T(x+16,y+20,t,12.5,800,fill=c); b+=T(x+16,y+37,d,11,400,fill=INK)
    return svg(W,H,b)

def coreografia():
    W,H=980,250; b=T(40,44,'La coreografía de cada capítulo',20,800)
    b+=T(40,67,'Todos los capítulos siguen los mismos 9 pasos. Sabes siempre dónde estás.',13,400,fill=SUB)
    pasos=['Pregunta','Intuición','Concepto','Traducción\nal juego','Mini-\nejemplo','Código','Resultado','Lectura\ncrítica','Auto-\ncomprob.']
    n=len(pasos); x0=55; xw=(880)/n; y=150
    for i,p in enumerate(pasos):
        cx=x0+xw*i+xw/2
        col=INTU if i<2 else (VIO if i<6 else EVID)
        b+=circle(cx,y,18,col); b+=T(cx,y+5,str(i+1),15,800,'middle','#fff')
        for j,ln in enumerate(p.split('\n')):
            b+=T(cx,y+40+j*13,ln,11,600,'middle',INK)
        if i<n-1: b+=AR(cx+22,y,x0+xw*(i+1)+xw/2-22,y,LINE if False else SUB,2)
    return svg(W,H,b)

def roadmap():
    W,H=980,330; b=T(40,44,'El mapa del laboratorio: la ruta completa',20,800)
    tramos=[('1 · Historia','¿por qué no ganaba?','el problema mal formulado',CYAN),
            ('2 · Fundamentos','¿qué es aprender por RL?','MDP, valor, Bellman, redes',VIO),
            ('3 · Cinco algoritmos','¿cómo aprende cada uno?','DQN·PPO·SAC·WM·WM-RNN',INTU),
            ('4 · Medición','¿quién juega mejor?','protocolo y resultados',EVID),
            ('5 · Cierre','¿qué nos llevamos?','glosario y reproducibilidad',ERR)]
    n=len(tramos); cw=170; gx=12; x0=40; y=90
    for i,(t,q,d,c) in enumerate(tramos):
        x=x0+i*(cw+gx)
        b+=R(x,y,cw,150,SOFT,c,12,1.6); b+=R(x,y,cw,30,c,c,12,0)
        b+=R(x,y+16,cw,14,c,c,0,0)
        b+=T(x+14,y+20,t,13,800,fill='#fff')
        b+=para(x+14,y+52,q,11.5,700,c,15,24)
        b+=para(x+14,y+96,d,11,400,INK,14,26)
        if i<n-1: b+=AR(x+cw+1,y+75,x+cw+gx-1,y+75,c,2.6)
    b+=R(40,262,900,42,'#fff7ed','#fdba74',10,1.5)
    b+=T(60,288,'El gran arco:',13,800,fill=ERR)
    b+=T(165,288,'agente ciego 0% en dispersos  →  reformular la tarea  →  PPO 91% en niveles NUNCA vistos',13,600,fill=INK)
    return svg(W,H,b)

def personajes():
    W,H=980,360; b=T(40,42,'Los siete personajes del bucle',20,800)
    b+=T(40,64,'Reaparecen en todo el libro. El valor vive dentro del agente, estimando el futuro.',13,400,fill=SUB)
    # agente y entorno como dos cajas grandes, con el ciclo
    b+=R(120,110,260,150,INTU_BG,INTU,14,1.8); b+=T(250,140,'AGENTE',16,800,'middle',INTU)
    b+=T(250,164,'política  π(a|s)',13,600,'middle',INK)
    b+=R(160,180,180,56,'#fff',VIO,10,1.4); b+=T(250,202,'Valor  V(s) · Q(s,a)',12.5,700,'middle',VIO)
    b+=T(250,222,'«estimador del futuro»',11,400,'middle',SUB)
    b+=R(600,110,260,150,CYAN_BG,CYAN,14,1.8); b+=T(730,140,'ENTORNO',16,800,'middle',CYAN)
    b+=T(730,166,'Arkanoid (rejilla 8×10)',13,600,'middle',INK)
    # mini tablero
    for r in range(3):
        for c in range(6):
            cols=['#ef4444','#f59e0b','#10b981']
            b+=R(645+c*24,186+r*14,20,10,cols[r],'none',2,0)
    # ciclo
    b+=AR(385,150,595,150,INK,2.6); b+=T(490,140,'acción  a',12.5,700,'middle',INK)
    b+=AR(595,220,385,220,EVID,2.6); b+=T(490,238,'recompensa r + estado s′',12.5,700,'middle',EVID)
    b+=T(490,256,'(y done)',11,400,'middle',SUB)
    b+=R(40,300,900,40,SOFT,LINE,10,1.4)
    b+=T(60,325,'estado s  →  agente/política  →  acción a  →  entorno  →  recompensa r + nuevo estado s′  →  …',13.5,700,fill=INK)
    return svg(W,H,b)

def salto_0_91():
    W,H=980,320; b=T(40,42,'El gran arco de resultados: del 0% al 91%',20,800)
    # panel izq (ciego) / der (con ojos)
    b+=R(40,72,430,210,'#fef2f2','#fca5a5',14,1.6)
    b+=T(60,100,'ERA CIEGA',15,800,fill='#b91c1c')
    for i,t in enumerate(['observación: 6 números (sin ladrillos)','rejilla 4×7 · reloj fijo de 600 pasos','0% en niveles dispersos','~2 de 28 ladrillos rotos','56% solo en rejilla llena = espejismo']):
        b+=T(60,128+i*26,'•  '+t,12.5,500,fill=INK)
    b+=R(510,72,430,210,'#f0fdf9','#86efac',14,1.6)
    b+=T(530,100,'FORMULACIÓN CORREGIDA',15,800,fill='#0a6b4e')
    for i,t in enumerate(['observación: 6 cinemáticos + matriz 8×10','timeout proporcional · sin shaping Φ · conv','5 semillas · evaluación GREEDY','medido en niveles NUNCA vistos','PPO 91% TEST-ID (0 colapsos)']):
        b+=T(530,128+i*26,'•  '+t,12.5,500,fill=INK)
    b+=AR(472,177,508,177,EVID,3.2)
    b+=R(40,294,900,18,'none','none',0,0)
    return svg(W,H,b)

def bucle():
    W,H=900,420; cx,cy=450,225; b=T(40,40,'El bucle agente–entorno: el corazón de todo',20,800,)
    b+=R(cx-150,cy-150,300,90,INTU_BG,INTU,14,1.8); b+=T(cx,cy-118,'AGENTE',16,800,'middle',INTU); b+=T(cx,cy-96,'elige la acción según π(a|s)',12.5,500,'middle',INK)
    b+=R(cx-150,cy+60,300,95,CYAN_BG,CYAN,14,1.8); b+=T(cx,cy+90,'ENTORNO (Arkanoid)',15,800,'middle',CYAN)
    for r in range(3):
        for c in range(8):
            cols=['#ef4444','#f59e0b','#10b981']
            b+=R(cx-92+c*24,cy+108+r*11,20,8,cols[r],'none',2,0)
    b+=AR(cx+152,cy-100,cx+152,cy+105,INK,2.8); b+=T(cx+250,cy,'acción  a',13,700,'middle',INK); b+=T(cx+250,cy+18,'← · mantener · →',11.5,400,'middle',SUB)
    b+=AR(cx-152,cy+105,cx-152,cy-100,EVID,2.8); b+=T(cx-258,cy-6,'recompensa  r',13,700,'middle',EVID); b+=T(cx-258,cy+12,'+ nuevo estado s′',11.5,400,'middle',SUB); b+=T(cx-258,cy+30,'+ done',11.5,400,'middle',SUB)
    b+=R(40,372,820,38,'#fff7ed','#fdba74',10,1.4)
    b+=T(60,396,'+1 romper ladrillo · +0,2 rebote en pala · −1 perder bola · +5 limpiar nivel',13,600,fill=ERR)
    return svg(W,H,b)

def humano_agente():
    W,H=980,330; b=T(40,42,'Lo que ve un humano  vs  lo que recibe el agente',20,800)
    b+=T(40,64,'El agente no «entiende» el juego: solo recibe números y una recompensa.',13,400,fill=SUB)
    b+=R(40,84,430,210,'#f8fafc',INTU,14,1.6); b+=T(60,110,'EL HUMANO VE',14,800,fill=INTU)
    # mini tablero bonito
    for r in range(4):
        for c in range(8):
            cols=['#ef4444','#f59e0b','#10b981','#3b82f6']
            b+=R(70+c*44,124+r*16,40,12,cols[r],'none',3,0)
    b+=circle(250,210,7,'#111827'); b+=R(210,240,80,12,'#6366f1','none',6,0)
    b+=T(60,285,'«hay ladrillos arriba, devuelvo la bola y apunto»',12,500,fill=INK)
    b+=R(510,84,430,210,'#0b1020','#334155',14,1.6); b+=T(530,110,'EL AGENTE RECIBE',14,800,fill='#93c5fd')
    b+=T(530,138,'6 cinemáticos:',12,700,fill='#e5e7eb')
    b+=T(530,158,'bola(0.59,0.53) v(−.02,.04) pala 0.61 d 0.18',11.5,400,fill='#9ca3af')
    b+=T(530,184,'matriz 8×10 (1=ladrillo, 0=hueco):',12,700,fill='#e5e7eb')
    grid='1 1 0 1 1 1 0 1 / 1 0 0 1 1 0 0 1 / 0 1 1 1 0 1 1 0 / 1 1 0 0 1 1 0 1'
    for i,row in enumerate(grid.split('/')):
        b+=T(530,206+i*17,row.strip(),11,400,fill='#6ee7b7')
    b+=T(530,285,'recompensa: +1 ocasional · −1 al perder',12,500,fill='#fca5a5')
    return svg(W,H,b)

def escalera():
    W,H=980,330; b=T(40,42,'Cuatro niveles de exigencia (no uno)',20,800)
    b+=T(40,64,'Recompensa al alza puede quedarse en el primer escalón. El examen es el cuarto.',13,400,fill=SUB)
    pasos=[('1 · Sobrevivir','devolver la bola','recompensa positiva','#94a3b8'),
           ('2 · Romper algunos','tocar ladrillos','reward / ladrillos rotos','#60a5fa'),
           ('3 · Limpiar el nivel','vaciar el tablero','éxito = nivel limpiado',INTU),
           ('4 · Generalizar','limpiar niveles NO vistos','éxito en TEST / OOD',EVID)]
    bw=210; x0=40; y0=290; sh=46
    for i,(t,d,m,c) in enumerate(pasos):
        x=x0+i*(bw+12); h=(i+1)*sh; y=y0-h
        b+=R(x,y,bw,h,'#fff',c,10,1.6); b+=R(x,y,bw,26,c,c,10,0); b+=R(x,y+14,bw,12,c,c,0,0)
        b+=T(x+14,y+18,t,12.5,800,fill='#fff')
        b+=T(x+14,y+44,d,12,600,fill=INK); b+=T(x+14,y+62,m,11,400,fill=SUB)
        if i==3: b+=T(x+bw/2,y-10,'★ el de verdad',11.5,800,'middle',EVID)
    return svg(W,H,b)

def lleno_disperso():
    W,H=980,330; b=T(40,42,'Por qué el 56% era un espejismo',20,800)
    b+=T(40,64,'Con el muro lleno, la bola rompe ladrillos por física aunque el agente no apunte.',13,400,fill=SUB)
    def board(x,y,full,traj_color,brk):
        s=R(x,y,360,200,'#0b1020','#334155',12,1.4)
        import_rows=8; cols=10
        for r in range(import_rows):
            for c in range(cols):
                on = True if full else ((r+c)%3==0 and (c%2==0))
                if on:
                    col=['#ef4444','#f59e0b','#10b981','#3b82f6'][r%4]
                    s+=R(x+16+c*33,y+16+r*9,29,6,col,'none',2,0)
        # trayectoria (línea quebrada)
        pts=[(x+40,y+185),(x+150,y+60),(x+250,y+120),(x+330,y+40)]
        for i in range(len(pts)-1):
            s+=LN(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],traj_color,2.4)
        s+=circle(pts[-1][0],pts[-1][1],5,'#fff')
        s+=R(x+150,y+188,70,7,'#6366f1','none',4,0)
        return s
    b+=board(40,90,True,'#fbbf24','x')
    b+=T(220,312,'MURO LLENO → toca ladrillos casi siempre',12.5,700,'middle',ERR)
    b+=board(580,90,False,'#22d3ee','x')
    b+=T(760,312,'NIVEL DISPERSO → atraviesa huecos si no apunta',12.5,700,'middle',INTU)
    return svg(W,H,b)

def split_datos():
    W,H=980,300; b=T(40,42,'Conjuntos disjuntos: estudiar y examinarse con cosas distintas',20,800)
    b+=R(70,100,180,120,VIO_BG,VIO,12,1.6); b+=T(160,150,'GENERADOR',14,800,'middle',VIO); b+=T(160,172,'de niveles',12,500,'middle',INK); b+=T(160,194,'5 familias',11,400,'middle',SUB)
    dest=[('TRAIN','el agente aprende aquí',INTU,INTU_BG,90),('VALIDACIÓN','ajustamos durante el desarrollo',ERR,ERR_BG,170),('TEST','examen final · niveles NUNCA vistos',EVID,EVID_BG,250)]
    for t,d,c,bg,y in dest:
        b+=AR(252,160,360,y+24,c,2.4)
        b+=R(370,y,460,50,bg,c,10,1.5); b+=T(388,y+22,t,13.5,800,fill=c); b+=T(388,y+40,d,12,500,fill=INK)
    b+=R(40,266,900,20,'none','none',0,0)
    return svg(W,H,b)

def tres_examenes():
    W,H=980,300; b=T(40,42,'Los tres exámenes',20,800)
    b+=T(40,64,'No es lo mismo interpolar (variar lo conocido) que generalizar (lo nuevo de verdad).',13,400,fill=SUB)
    ex=[('TEST-ID','niveles nuevos del MISMO tipo visto','interpola',INTU),
        ('OOD-patrón','familias estructuralmente NUEVAS','generaliza',VIO),
        ('OOD-dificultad','densidades / dificultades NUEVAS','generaliza',EVID)]
    bw=290
    for i,(t,d,k,c) in enumerate(ex):
        x=40+i*(bw+15); y=90
        b+=R(x,y,bw,150,'#fff',c,12,1.6); b+=R(x,y,bw,30,c,c,12,0); b+=R(x,y+16,bw,14,c,c,0,0)
        b+=T(x+14,y+20,t,14,800,fill='#fff')
        # mini board
        for r in range(4):
            for cc in range(8):
                on=(r*cc+i)%3!=0
                if on: b+=R(x+18+cc*32,y+44+r*9,28,6,c if i<2 else '#10b981','none',2,0)
        b+=para(x+14,y+106,d,11.5,500,INK,14,34)
        b+=T(x+bw-14,y+142,k,11,800,'end',c)
    return svg(W,H,b)

def ciego_ojos():
    W,H=980,340; b=T(40,42,'La palabra clave es «observación»',20,800)
    b+=T(40,64,'El mismo tablero, dos observaciones. Sin ladrillos en la entrada, apuntar es imposible.',13,400,fill=SUB)
    # ciego
    b+=R(40,88,430,212,'#fef2f2','#fca5a5',14,1.6); b+=T(60,114,'AGENTE CIEGO',14,800,fill='#b91c1c')
    b+=T(60,140,'observación = 6 números',12.5,700,fill=INK)
    b+=T(60,160,'bola x,y · velocidad · pala x · distancia',11.5,400,fill=SUB)
    b+=R(60,176,390,90,'#0b1020','#334155',10,1.2)
    b+=T(255,210,'¿?  ¿?  ¿?',26,800,'middle','#6b7280')
    b+=T(255,238,'no ve qué ladrillos quedan',12,500,'middle','#9ca3af')
    b+=T(60,288,'→ rebota, pero no puede ELEGIR objetivo',12.5,700,fill='#b91c1c')
    # con ojos
    b+=R(510,88,430,212,'#f0fdf9','#86efac',14,1.6); b+=T(530,114,'AGENTE CON OJOS',14,800,fill='#0a6b4e')
    b+=T(530,140,'observación = 6 números + matriz 8×10',12.5,700,fill=INK)
    b+=R(530,156,390,108,'#0b1020','#334155',10,1.2)
    grid=['1 1 0 1 1 1 0 1 1 0','1 0 0 1 1 0 0 1 1 1','0 1 1 1 0 1 1 0 0 1','1 1 0 0 1 1 0 1 1 0']
    for i,row in enumerate(grid):
        b+=T(548,180+i*20,row,12,400,fill='#6ee7b7')
    b+=T(530,288,'→ sabe qué queda y puede APUNTAR',12.5,700,fill='#0a6b4e')
    return svg(W,H,b)

def tres_muros():
    W,H=980,400; b=T(40,40,'Diagnóstico: tres muros, ninguno el algoritmo',20,800)
    b+=T(40,62,'Cada muro: síntoma → hipótesis falsa → prueba → causa real → corrección.',13,400,fill=SUB)
    muros=[('MURO 1 · El reloj','Síntoma: nunca limpia.','Hipótesis falsa: «falta entrenar».','Prueba: 600 pasos < 7.200 que pide un 8×10.','Causa: timeout fijo demasiado corto.','Arreglo: timeout proporcional (90/ladrillo).',ERR),
           ('MURO 2 · La recompensa','Síntoma: sobrevive, no gana.','Hipótesis falsa: «mal algoritmo».','Prueba: quitar el shaping Φ sube +8.','Causa: Φ premiaba acercarse, no ganar.','Arreglo: meta limpia, sin shaping Φ.',VIO),
           ('MURO 3 · La observación','Síntoma: no apunta.','Hipótesis falsa: «más pasos».','Prueba: sin matriz de ladrillos, techo.','Causa: la observación no ve los ladrillos.','Arreglo: matriz de ocupación 8×10.',INTU)]
    bw=290
    for i,(t,*rows,c) in enumerate(muros):
        x=40+i*(bw+15); y=82
        b+=R(x,y,bw,300,'#fff',c,12,1.7); b+=R(x,y,bw,34,c,c,12,0); b+=R(x,y+18,bw,16,c,c,0,0)
        b+=T(x+14,y+23,t,13.5,800,fill='#fff')
        yy=y+56
        for j,r in enumerate(rows):
            lines=wrap(r,38)
            for k,ln in enumerate(lines):
                w=700 if (':' in r and k==0) else 400
                b+=T(x+14,yy,ln,11.5,w,fill=INK)
                yy+=16
            yy+=4
    return svg(W,H,b)

def shaping():
    W,H=980,300; b=T(40,42,'Muro 2: cómo una «ayuda» saboteaba el objetivo',20,800)
    b+=T(40,64,'El shaping Φ premiaba acercar la pala a la bola. El agente optimizó eso… no ganar.',13,400,fill=SUB)
    chain=[('Shaping Φ','premia «pala cerca de la bola»',ERR),
           ('Rebote vertical','la bola sube recta',ERR),
           ('Sobrevive','muchos pasos vivos',ERR),
           ('Menos puntería','no busca ladrillos',ERR),
           ('Baja limpieza','no gana el nivel','#b91c1c')]
    bw=160; y=110
    for i,(t,d,c) in enumerate(chain):
        x=40+i*(bw+22)
        b+=R(x,y,bw,80,'#fff7ed',c,10,1.5)
        b+=para(x+12,y+26,t,12.5,800,c,15,22)
        b+=para(x+12,y+52,d,11,400,INK,13,24)
        if i<len(chain)-1: b+=AR(x+bw+2,y+40,x+bw+20,y+40,c,2.6)
    b+=R(40,214,900,52,EVID_BG,EVID,10,1.5)
    b+=T(60,238,'Quitar Φ → +8 puntos de éxito.',13.5,800,fill='#0a6b4e')
    b+=T(285,238,'A veces, la mejor ayuda es no ayudar: deja que la recompensa real (ganar) guíe.',12.5,500,fill=INK)
    return svg(W,H,b)

def receta():
    W,H=980,330; b=T(40,42,'La receta que desbloquea (5 ingredientes)',20,800)
    b+=T(40,64,'No fue un algoritmo mágico: fue formular bien la tarea. El número = puntos de la ablación.',13,400,fill=SUB)
    ing=[('1 · Reloj justo','timeout proporcional','−23 si falta',ERR),
         ('2 · Meta limpia','quitar el shaping Φ','+8 al quitarlo',VIO),
         ('3 · Ojos','matriz de ocupación 8×10','crítico',INTU),
         ('4 · Encoder conv','respeta la vecindad','−20 si falta',CYAN),
         ('5 · Variedad','currículo + generador','robustez',EVID)]
    bw=172; y=92
    for i,(t,d,ev,c) in enumerate(ing):
        x=40+i*(bw+10)
        b+=R(x,y,bw,150,'#fff',c,12,1.6); b+=R(x,y,bw,8,c,c,12,0)
        b+=para(x+13,y+34,t,13,800,c,16,18)
        b+=para(x+13,y+70,d,11.5,500,INK,15,22)
        b+=R(x+13,y+112,bw-26,26,'#f8fafc',c,7,1.2); b+=T(x+bw/2,y+129,ev,11.5,800,'middle',c)
    b+=R(40,260,900,44,'#eff4fe',INTU,10,1.5)
    b+=T(60,287,'Resultado:',13,800,fill=INTU); b+=T(150,287,'de 0% (ciego) a 91% en niveles no vistos (PPO). Cada pieza ataca un muro distinto.',12.5,500,fill=INK)
    return svg(W,H,b)

def mdp_pomdp():
    W,H=980,300; b=T(40,42,'MDP vs POMDP, sin asustar',20,800)
    b+=T(40,64,'Si la observación contiene todo lo relevante es un MDP; si oculta algo necesario, un POMDP.',13,400,fill=SUB)
    b+=R(60,90,400,170,'#f0fdf9',EVID,12,1.6); b+=T(80,118,'MDP — observable',14,800,fill='#0a6b4e')
    b+=T(80,144,'la observación = el estado',12.5,600,fill=INK)
    b+=T(80,166,'todo lo relevante está a la vista',11.5,400,fill=SUB)
    b+=T(80,200,'Arkanoid con matriz 8×10:',12.5,700,fill=INK)
    b+=T(80,220,'ve ladrillos y velocidad → casi markoviano',11.5,400,fill=SUB)
    b+=R(520,90,400,170,'#fef2f2','#fca5a5',12,1.6); b+=T(540,118,'POMDP — parcial',14,800,fill='#b91c1c')
    b+=T(540,144,'la observación oculta información',12.5,600,fill=INK)
    b+=T(540,166,'el agente «ve con rendijas»',11.5,400,fill=SUB)
    b+=T(540,200,'Agente ciego (sin ladrillos):',12.5,700,fill=INK)
    b+=T(540,220,'techo de INFORMACIÓN, no de cómputo',11.5,400,fill=SUB)
    return svg(W,H,b)

def v_q():
    W,H=980,290; b=T(40,42,'Dos formas de medir «lo bueno»: V(s) y Q(s,a)',20,800)
    b+=R(60,86,360,170,INTU_BG,INTU,12,1.6); b+=T(80,114,'V(s) — valor del estado',14,800,fill=INTU)
    b+=para(80,142,'¿Qué pinta tiene esta situación, juegue como juegue bien?',12.5,500,INK,17,40)
    b+=R(520,86,400,170,VIO_BG,VIO,12,1.6); b+=T(540,114,'Q(s,a) — valor de una acción',14,800,fill=VIO)
    b+=para(540,142,'¿Qué pinta tiene HACER esta acción aquí?',12.5,500,INK,17,42)
    acc=[('← izquierda','0,42'),('· mantener','0,71'),('→ derecha','0,55')]
    for i,(a,v) in enumerate(acc):
        y=176+i*24; best=(i==1)
        b+=T(560,y,a,12,700 if best else 400,fill=(VIO if best else INK))
        b+=R(660,y-12,160,16,'#fff',LINE,5,1)
        b+=R(660,y-12,160*float(v.replace(',','.')),16,VIO if best else '#c4b5fd','none',5,0)
        b+=T(828,y,v,11.5,700,'start',VIO if best else SUB)
    b+=T(540,256,'DQN aprende Q; la política sale de elegir el Q mayor (argmax).',11.5,500,fill=SUB)
    return svg(W,H,b)

def dos_ramas():
    W,H=980,360; b=T(40,40,'La red de dos ramas (arquitectura real)',20,800)
    # rama conv
    b+=R(60,80,250,120,CYAN_BG,CYAN,12,1.6); b+=T(80,104,'RAMA ESPACIAL',12.5,800,fill=CYAN)
    b+=T(80,126,'matriz 8×10',12,600,fill=INK)
    b+=R(80,138,70,46,'#0b1020','none',6,0)
    for r in range(4):
        for c in range(6): b+=R(86+c*10,144+r*10,8,8,'#10b981' if (r+c)%2 else '#1f2937','none',1,0)
    b+=AR(160,160,200,160,CYAN); b+=R(205,138,40,46,'#fff',CYAN,6,1.2); b+=T(225,158,'conv',10,700,'middle',CYAN); b+=T(225,172,'16',10,400,'middle',SUB)
    b+=AR(247,160,260,160,CYAN); b+=R(262,138,40,46,'#fff',CYAN,6,1.2); b+=T(282,158,'conv',10,700,'middle',CYAN); b+=T(282,172,'32',10,400,'middle',SUB)
    # rama densa
    b+=R(60,224,250,90,VIO_BG,VIO,12,1.6); b+=T(80,248,'RAMA CINEMÁTICA',12.5,800,fill=VIO)
    b+=T(80,270,'6 números (bola, velocidad, pala…)',11.5,500,fill=INK)
    b+=R(205,262,97,40,'#fff',VIO,6,1.2); b+=T(253,286,'densa',11,700,'middle',VIO)
    # concat + cabeza
    b+=AR(312,160,360,200,CYAN); b+=AR(312,282,360,225,VIO)
    b+=R(360,180,90,60,'#f8fafc',INK,10,1.5); b+=T(405,206,'concat',12,800,'middle',INK); b+=T(405,224,'+ ReLU',10.5,400,'middle',SUB)
    b+=AR(452,210,500,210,INK); b+=R(500,185,70,50,'#fff',INK,8,1.2); b+=T(535,206,'128',12,700,'middle',INK)
    b+=AR(572,210,610,210,INK); b+=R(610,185,70,50,'#fff',INK,8,1.2); b+=T(645,206,'128',12,700,'middle',INK)
    b+=AR(682,210,730,210,INK)
    heads=[('DQN / WM','3 valores Q(s,a)',ALGO['DQN']),('PPO / SAC','actor (3 probs) + crítico',ALGO['PPO'])]
    for i,(t,d,c) in enumerate(heads):
        y=170+i*48; b+=R(735,y,210,42,'#fff',c,9,1.4); b+=T(748,y+18,t,11.5,800,fill=c); b+=T(748,y+34,d,10.5,400,fill=INK)
    b+=R(40,330,900,22,'none','none',0,0)
    b+=T(60,346,'El sesgo espacial de la convolución vale ~20 puntos de éxito (ablación).',11.5,500,fill=SUB)
    return svg(W,H,b)

def taxonomia():
    W,H=900,560; b=T(40,40,'Los cinco, cara a cara: un mapa',20,800)
    b+=T(40,62,'Dos ejes: aprende valor↔política y sin modelo↔con modelo. Forma = on/off-policy.',13,400,fill=SUB)
    ox,oy,ax,ay=120,500,760,110
    b+=LN(ox,oy,ox,ay,LINE,1.6); b+=LN(ox,oy,ax,oy,LINE,1.6)
    b+=T(ox-10,ay-6,'política',12,700,'middle',SUB); b+=T(ox-10,oy+22,'valor',12,700,'middle',SUB)
    b+=T(ax,oy+22,'con modelo →',12,700,'end',SUB); b+=T(ox+90,oy+22,'sin modelo (model-free)',12,700,'middle',SUB)
    b+=T(70,300,'eje Y: qué aprende',11,500,'middle',SUB)
    pts=[('PPO','on-policy · actor-crítico',260,180,ALGO['PPO'],'cuadrado'),
         ('SAC','off · máx. entropía',360,230,ALGO['SAC'],'circulo'),
         ('DQN','off · valor',300,430,ALGO['DQN'],'circulo'),
         ('World Model','off · model-based (Dyna-Q)',600,400,ALGO['World Model'],'circulo'),
         ('WM-RNN','off · model-based + LSTM',650,300,ALGO['WM-RNN'],'circulo')]
    for t,d,x,y,c,shape in pts:
        if shape=='cuadrado': b+=R(x-13,y-13,26,26,c,'#fff',6,2)
        else: b+=circle(x,y,14,c,'#fff',2)
        b+=T(x+22,y-2,t,13.5,800,fill=c); b+=T(x+22,y+15,d,11,400,fill=INK)
    b+=R(120,524,640,28,SOFT,LINE,8,1.2)
    b+=T(140,543,'■ = on-policy (no recicla experiencia: PPO)      ● = off-policy (usa replay)',12,600,fill=INK)
    return svg(W,H,b)

def lecciones_finales():
    W,H=980,300; b=T(40,42,'Cuatro lecciones para llevarte',20,800)
    lec=[('Mide en lo NO visto','El éxito en niveles de entrenamiento no dice casi nada. El 91% cuenta porque se midió fuera.',EVID,EVID_BG),
         ('Recompensa ≠ éxito','Una recompensa al alza puede convivir con 0% de niveles limpiados. Mide el logro, no el proxy.',INTU,INTU_BG),
         ('La forma de los datos importa','Reloj, escala y convolución (la formulación) pesaron más que cambiar de algoritmo.',VIO,VIO_BG),
         ('A veces, quitar mejora','Quitar el shaping Φ subió +8. Más piezas no es mejor; las correctas sí.',ERR,ERR_BG)]
    bw=445
    for i,(t,d,c,bg) in enumerate(lec):
        x=40+(i%2)*(bw+10); y=86+(i//2)*100
        b+=R(x,y,bw,88,bg,c,12,1.5); b+=R(x,y,6,88,c,c,0,0)
        b+=T(x+22,y+28,('%d · '%(i+1))+t,14,800,fill=c)
        b+=para(x+22,y+48,d,12,500,INK,16,62)
    return svg(W,H,b)

DIAGRAMS={
 'vis_niveles_lectura':niveles_lectura,'vis_leyenda_cajas':leyenda_cajas,'vis_coreografia':coreografia,
 'vis_roadmap':roadmap,'vis_personajes':personajes,'vis_salto_0_91':salto_0_91,'vis_bucle':bucle,
 'vis_humano_agente':humano_agente,'vis_escalera':escalera,'vis_lleno_disperso':lleno_disperso,
 'vis_split_datos':split_datos,'vis_tres_examenes':tres_examenes,'vis_ciego_ojos':ciego_ojos,
 'vis_tres_muros':tres_muros,'vis_shaping':shaping,'vis_receta':receta,'vis_mdp_pomdp':mdp_pomdp,
 'vis_v_q':v_q,'vis_dos_ramas':dos_ramas,'vis_taxonomia':taxonomia,'vis_lecciones_finales':lecciones_finales,
}
if __name__=='__main__':
    os.makedirs('docs/assets',exist_ok=True)
    for name,fn in DIAGRAMS.items(): write(name,fn());
    print('SVG generados:',len(DIAGRAMS))
    print(' ',', '.join(DIAGRAMS))
