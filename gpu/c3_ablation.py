#!/usr/bin/env python3
# ============================================================================
#  C3 — Ablación mínima de la receta (protocolo §4.C3)
#  ---------------------------------------------------------------------------
#  Parte de la receta base (DQN-conv) y quita UN ingrediente por variante, al
#  presupuesto headline (1.5M), multi-semilla. Ordena los ingredientes por impacto
#  (delta de success_test_id frente a base). 'sin_conv' reutiliza 'flat' (config idéntica).
#  Salida: results/analysis/ablation.csv (+ tabla por consola).
#    python3 gpu/c3_ablation.py [budget]      # def. 1500000
# ============================================================================
import sys, os, json, csv
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import lab

# variante -> (etiqueta del ingrediente QUITADO, variante real en el ledger)
ABLATIONS = [
    ("base",                 "— (receta completa)",                  "base"),
    ("sin_curriculo",        "currículo fácil→difícil",              "sin_curriculo"),
    ("sin_conv",             "conv (encoder espacial)",              "flat"),        # ≡ flat
    ("sin_escala",           "escala 1.0 (pasa a 0.25)",             "sin_escala"),
    ("sin_shaping",          "shaping (+0.2 por devolver bola)",     "sin_shaping"),
    ("epsdecay_lento",       "ε-decay rápido (pasa a 40k)",          "epsdecay_lento"),
    ("timeout_proporcional", "timeout constante (pasa a prop.)",     "timeout_proporcional"),
]

def agg(rows, variant, budget):
    vals = [float(r["success_test_id"]) for r in rows
            if r["model"] == "dqn" and r["variant"] == variant and int(r["budget"]) == budget]
    if not vals: return None
    a = np.array(vals)
    return {"mean": float(a.mean()), "median": float(np.median(a)),
            "std": float(a.std(ddof=1)) if len(a) > 1 else 0.0, "min": float(a.min()), "max": float(a.max()),
            "collapse_rate": float(np.mean(a < 0.10)), "n": len(a)}

def main():
    budget = int(sys.argv[1]) if len(sys.argv) > 1 else 1_500_000
    rows = [r for r in csv.DictReader(open(lab.LEDGER)) if r["status"] == "done"]
    base = agg(rows, "base", budget)
    if not base:
        print("falta dqn/base @budget — corre C6 primero"); return
    table = []
    for name, ingr, real in ABLATIONS:
        a = agg(rows, real, budget)
        if not a:
            print(f"  (falta {name} -> variante '{real}')"); continue
        delta = a["mean"] - base["mean"]
        table.append({"variante": name, "ingrediente_quitado": ingr, "mean": round(a["mean"], 4),
                      "median": round(a["median"], 4), "std": round(a["std"], 4),
                      "collapse_rate": round(a["collapse_rate"], 4),
                      "delta_vs_base_pts": round(delta * 100, 1), "n": a["n"]})
    # ordenar por impacto: más negativo (su eliminación más daña) = ingrediente más importante
    abl = [r for r in table if r["variante"] != "base"]
    abl.sort(key=lambda r: r["delta_vs_base_pts"])
    ordered = [r for r in table if r["variante"] == "base"] + abl

    out = os.path.join(lab.DIRS["analysis"], "ablation.csv")
    with open(out, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["variante", "ingrediente_quitado", "mean", "median", "std",
                                          "collapse_rate", "delta_vs_base_pts", "n"])
        w.writeheader(); w.writerows(ordered)

    print(f"=== C3 · ablación DQN @{budget//1000}k (TEST-ID) · base={base['mean']*100:.0f}% ===")
    print(f"{'variante':22} {'ingrediente quitado':34} {'mean':>5} {'Δ vs base':>9} {'colapso':>7}")
    print("-" * 82)
    for r in ordered:
        d = f"{r['delta_vs_base_pts']:+.1f}" if r["variante"] != "base" else "  —"
        print(f"{r['variante']:22} {r['ingrediente_quitado']:34} {r['mean']*100:4.0f}% {d:>9} {r['collapse_rate']*100:6.0f}%")
    print("\nRanking de importancia (lo que más cae al quitarlo):")
    for r in abl[:3]:
        print(f"  · {r['ingrediente_quitado']}: {r['delta_vs_base_pts']:+.1f} pts")
    print(f"\nescrito: {os.path.relpath(out, lab.ROOT)}")

if __name__ == "__main__":
    main()
