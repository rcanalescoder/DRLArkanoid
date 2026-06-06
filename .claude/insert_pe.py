#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Inserta los bloques rojos «para expertos» de la Parte I (pe_part1.html) al final
   de cada sección de chapters_v3.html, mapeando por el id del banner (· X.Y)."""
import re, io

raw = io.open('.claude/pe_part1.html', encoding='utf-8').read()
boxes = {}
for chunk in raw.split('<!--PE:')[1:]:
    cid, _, html = chunk.partition('-->')
    boxes[cid.strip()] = html.strip()
print('bloques cargados:', sorted(boxes))

text = io.open('.claude/chapters_v3.html', encoding='utf-8').read()
parts = text.split('</section>')
n_ins = 0
for i, chunk in enumerate(parts):
    m = re.search(r'·\s*(\d+\.\d+)</div>', chunk)
    if not m: continue
    cid = m.group(1)
    if cid in boxes and 'class="experto"' not in chunk:   # idempotente
        idx = chunk.rfind('</div>')      # cierre del .pad
        parts[i] = chunk[:idx] + boxes[cid] + '\n  ' + chunk[idx:]
        n_ins += 1
out = '</section>'.join(parts)
io.open('.claude/chapters_v3.html', 'w', encoding='utf-8').write(out)
print('bloques insertados en Parte I:', n_ins)
