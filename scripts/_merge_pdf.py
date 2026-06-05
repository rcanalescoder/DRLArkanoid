#!/usr/bin/env python3
# Fusiona PDFs (sin recomprimir: copia los objetos tal cual) con pypdf.
#   uso: python scripts/_merge_pdf.py "/tmp/zoo_pdf/part*.pdf" salida.pdf
import sys, glob
from pypdf import PdfWriter

patron, salida = sys.argv[1], sys.argv[2]
partes = sorted(glob.glob(patron))
if not partes:
    print("sin partes que fusionar:", patron, file=sys.stderr)
    sys.exit(1)
w = PdfWriter()
for f in partes:
    w.append(f)
with open(salida, "wb") as o:
    w.write(o)
print(f"fusionadas {len(partes)} partes -> {salida}")
