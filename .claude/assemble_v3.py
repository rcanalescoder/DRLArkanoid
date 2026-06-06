#!/usr/bin/env python3
# Ensambla docs/report_v3.html = (head+CSS del v2 + CSS v3) + portada v3 + capitulos del workflow.
# Uso: python assemble_v3.py <fichero_con_capitulos_html>
import sys, io

V3_CSS = """
  /* ===== V3: sistema pedagogico (cajas, niveles de lectura) ===== */
  .pregunta{ font-size:12.5pt; font-weight:600; color:var(--accent,#2563eb); background:var(--accent-soft,#eff4fe); border-left:4px solid var(--accent,#2563eb); border-radius:10px; padding:11px 16px; margin:4px 0 13px; line-height:1.45; }
  .caja{ border-radius:11px; padding:11px 15px; margin:11px 0; font-size:9.9pt; line-height:1.55; border:1px solid #e5e7eb; background:#fafbfc; break-inside:avoid; page-break-inside:avoid; }
  .caja .ch{ font-weight:700; font-size:8.6pt; text-transform:uppercase; letter-spacing:.7px; margin-bottom:5px; }
  .caja b{ color:var(--ink); }
  .caja-formula{ background:#eef4ff; border-color:#cfe0fb; } .caja-formula .ch{ color:#1d4ed8; }
  .caja-juego{ background:#ecfeff; border-color:#bae6fd; } .caja-juego .ch{ color:#0e7490; }
  .caja-error{ background:#fef2f2; border-color:#fbd5d5; } .caja-error .ch{ color:#b91c1c; }
  .caja-mirar{ background:#fff8ec; border-color:#f6e2bd; } .caja-mirar .ch{ color:#b45309; }
  .caja-limite{ background:#f5f6f8; border-color:#d8dde6; } .caja-limite .ch{ color:#475569; }
  .caja-curiosos{ background:#f5f6f8; border:1px dashed #c4cad6; } .caja-curiosos .ch{ color:#5b6472; }
  .autocheck{ background:#f0fdf9; border:1px solid #c7eede; border-left:4px solid #0c9f6e; border-radius:10px; padding:10px 15px; margin:12px 0; break-inside:avoid; page-break-inside:avoid; }
  .autocheck .ch{ font-weight:700; color:#0a6b4e; font-size:9pt; text-transform:uppercase; letter-spacing:.6px; margin-bottom:4px; }
  .autocheck ol{ margin:4px 0 0; padding-left:18px; } .autocheck li{ margin:3px 0; color:#155e4a; }
  .ejercicio{ background:#f4effe; border:1px solid #ddd0f5; border-left:4px solid #7c3aed; border-radius:10px; padding:10px 15px; margin:12px 0; font-size:9.9pt; break-inside:avoid; page-break-inside:avoid; }
  .ejercicio .ch{ font-weight:700; color:#6d28d9; font-size:9pt; text-transform:uppercase; letter-spacing:.6px; margin-bottom:4px; }
  .lvl{ display:inline-block; font-size:7.5pt; font-weight:700; text-transform:uppercase; letter-spacing:.5px; padding:1px 7px; border-radius:20px; }
  .lvl-int{ background:#e0f2fe; color:#0369a1; } .lvl-tec{ background:#ede9fe; color:#6d28d9; } .lvl-cod{ background:#f1f5f9; color:#475569; }
  /* ===== V3: bloque rojo "Y ahora, para expertos" (doble pista de lectura) ===== */
  .experto{ background:#fff5f5; border:1px solid #f3c9c9; border-left:5px solid #991b1b; border-radius:11px; padding:11px 16px 12px; margin:15px 0; font-size:9.3pt; line-height:1.48; break-inside:avoid; page-break-inside:avoid; }
  .experto > .ch{ font-weight:800; color:#991b1b; font-size:8.7pt; text-transform:uppercase; letter-spacing:.7px; margin-bottom:6px; }
  .experto > .ch .lvl{ margin-left:5px; }
  .experto p{ margin:6px 0; } .experto b{ color:#7f1d1d; }
  .experto code, .experto .mono{ background:#fbe4e4; color:#7f1d1d; padding:0 3px; border-radius:4px; }
  .experto .formula{ background:#fdeeee; border-color:#f3c9c9; color:#7f1d1d; }
  .experto ul, .experto ol{ margin:5px 0 0; padding-left:18px; } .experto li{ margin:3px 0; }
  /* ===== V3: tamaño de imagen seguro para el PDF (A4 util ~1017px; figure tiene break-inside:avoid) ===== */
  /* base: ancho completo, alto proporcional, tope de altura para no desbordar pagina; contain evita distorsion al topar */
  figure img{ width:100%; height:auto; max-height:800px; object-fit:contain; }
  /* rasters (jpg/png): NO ampliar por encima de su tamano nativo (heatmaps/capturas nitidas) y centrar */
  figure img[src$=".jpg"], figure img[src$=".png"]{ width:auto; height:auto; max-width:100%; max-height:800px; margin-left:auto; margin-right:auto; }
"""

V3_COVER = """
<!-- ============================ PORTADA V3 ============================ -->
<div class="cover">
  <div class="kicker">Guía-libro · Deep RL · Edición 3</div>
  <h1>Arkanoid<br/>DRL<br/>Learning Lab</h1>
  <div class="sub">Una guía para <b>entender Deep RL</b> midiendo un Arkanoid desde cero. Veremos un agente que
    <b>parecía aprender</b>, descubriremos <b>por qué no ganaba</b> y construiremos una formulación que <b>sí
    generaliza</b> a niveles nunca vistos. Primero la intuición; después el formalismo, el código y los resultados,
    sin perder rigor.</div>
  <div class="chips">
    <span class="chip">PPO</span><span class="chip">DQN</span><span class="chip">SAC</span>
    <span class="chip">World Model</span><span class="chip">World Model RNN</span><span class="chip">PyTorch · MPS</span>
    <span class="chip">Protocolo congelado</span><span class="chip">5 semillas</span>
  </div>
  <div class="credits">
    <div class="cr"><span class="lbl">Autor</span><span class="val">Roberto Canales Mora · con Claude</span></div>
    <div class="cr"><span class="lbl">Web</span><span class="val mono">www.robertocanales.com</span></div>
    <div class="cr"><span class="lbl">Repositorio</span><span class="val mono">github.com/rcanalescoder/DRLArkanoid</span></div>
    <div class="cr"><span class="lbl">Protocolo</span><span class="val mono">frozen_hash a1ab7ce18d7bad6b</span></div>
  </div>
  <div class="foot"><span>Intuición → formalismo → código → resultados.</span><span>Edición 3 · libro-guía</span></div>
</div>
"""

def main():
    chapters_file = sys.argv[1]
    # Cabecera/CSS base (extraida del v2). El report_v2.html ya no vive en docs/, asi que
    # la cabecera (todo hasta justo antes de </style>) queda congelada en .claude/head_v2.html.
    with io.open('.claude/head_v2.html', encoding='utf-8') as f:
        head = f.read()
    with io.open(chapters_file, encoding='utf-8') as f:
        chapters = f.read()
    out = head + V3_CSS + '</style>\n</head>\n<body>\n' + V3_COVER + '\n' + chapters + '\n</body>\n</html>\n'
    with io.open('docs/report_v3.html', 'w', encoding='utf-8') as f:
        f.write(out)
    print('report_v3.html escrito:', len(out), 'chars')

if __name__ == '__main__':
    main()
