#!/usr/bin/env python3
# ============================================================================
#  C4 — SAC honesto: SAC-pure vs SAC-critic-hybrid (protocolo §4.C4)
#  ---------------------------------------------------------------------------
#  El 'sac' de C6 NO es SAC a secas: es SAC-critic-hybrid (conducta y eval con la
#  política greedy del CRÍTICO soft, porque el actor discreto colapsa). 'sac_pure'
#  usa el ACTOR para conducta (muestreo) y eval (argmax) — el SAC "de libro".
#  Compara ambos honestamente (incluidos colapsos) por presupuesto, multi-semilla.
#  Salida: results/analysis/sac_variants.json
#    python3 gpu/c4_sac.py
# ============================================================================
import sys, os, json, csv
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import lab

MODELS = {"sac": "SAC-critic-hybrid", "sac_pure": "SAC-pure (actor)"}

def agg(rows, model, budget):
    vals = [float(r["success_test_id"]) for r in rows
            if r["model"] == model and r["variant"] == "base" and int(r["budget"]) == budget]
    if not vals: return None
    a = np.array(vals)
    return {"mean": round(float(a.mean()), 4), "median": round(float(np.median(a)), 4),
            "std": round(float(a.std(ddof=1)) if len(a) > 1 else 0.0, 4),
            "min": round(float(a.min()), 4), "max": round(float(a.max()), 4),
            "collapse_rate": round(float(np.mean(a < 0.10)), 4), "n": len(a)}

def main():
    proto = json.load(open(lab.FROZEN_PATH)); budgets = proto["budgets"]
    rows = [r for r in csv.DictReader(open(lab.LEDGER)) if r["status"] == "done"]
    rep = {"frozen_hash": proto.get("frozen_hash"), "metric": "success_test_id (greedy)",
           "naming": "sac = SAC-critic-hybrid (política del crítico soft); sac_pure = SAC con el ACTOR",
           "por_presupuesto": {}}
    print("=== C4 · SAC-pure vs SAC-critic-hybrid (TEST-ID) ===")
    print(f"{'presupuesto':12} {'SAC-critic-hybrid':>26} {'SAC-pure (actor)':>26}")
    for b in budgets:
        h = agg(rows, "sac", b); p = agg(rows, "sac_pure", b)
        rep["por_presupuesto"][str(b)] = {"sac_critic_hybrid": h, "sac_pure": p}
        def fmt(x): return f"{x['mean']*100:3.0f}% (col {x['collapse_rate']*100:.0f}%, n{x['n']})" if x else "—"
        print(f"  @{b//1000}k{'':6} {fmt(h):>26} {fmt(p):>26}")

    # conclusión sobre el headline + 3M
    concl = []
    for b in budgets:
        d = rep["por_presupuesto"][str(b)]; h, p = d["sac_critic_hybrid"], d["sac_pure"]
        if h and p:
            diff = h["mean"] - p["mean"]
            concl.append(f"@{b//1000}k: hybrid {h['mean']*100:.0f}% vs pure {p['mean']*100:.0f}% "
                         f"(hybrid {'+' if diff>=0 else ''}{diff*100:.0f} pts; colapsos pure {p['collapse_rate']*100:.0f}%, hybrid {h['collapse_rate']*100:.0f}%)")
    rep["comparacion"] = concl
    # veredicto honesto sobre los 3 presupuestos (media Y colapsos)
    wins = ncmp = pure_menos_colapso = 0
    for b in budgets:
        d = rep["por_presupuesto"][str(b)]; h, p = d["sac_critic_hybrid"], d["sac_pure"]
        if h and p:
            ncmp += 1
            if p["mean"] >= h["mean"] - 0.02: wins += 1
            if p["collapse_rate"] <= h["collapse_rate"]: pure_menos_colapso += 1
    h15 = rep["por_presupuesto"].get("1500000", {}).get("sac_critic_hybrid")
    p15 = rep["por_presupuesto"].get("1500000", {}).get("sac_pure")
    cp = (p15["collapse_rate"] if p15 else 0) * 100; ch = (h15["collapse_rate"] if h15 else 0) * 100
    if ncmp and wins == ncmp and pure_menos_colapso == ncmp:
        rep["conclusion"] = (f"SAC-pure (actor) IGUALA O SUPERA al híbrido del crítico en los {ncmp} presupuestos y "
                             f"colapsa menos o igual (a 1.5M: pure {cp:.0f}% vs hybrid {ch:.0f}% de colapso). La premisa "
                             f"histórica 'el actor SAC discreto colapsa, por eso se usa el crítico' NO se sostiene bajo "
                             f"el protocolo congelado + multi-semilla: el híbrido era una sobre-corrección innecesaria. "
                             f"Aun así se reportan AMBOS por separado y con nombre honesto.")
    elif ncmp:
        rep["conclusion"] = (f"Resultado mixto: SAC-pure gana en {wins}/{ncmp} presupuestos; "
                             f"colapsos a 1.5M pure {cp:.0f}% vs hybrid {ch:.0f}%. Se reportan ambos por separado.")
    print(f"\nCONCLUSIÓN: {rep.get('conclusion','')}")
    with open(os.path.join(lab.DIRS["analysis"], "sac_variants.json"), "w") as f:
        json.dump(rep, f, indent=2, ensure_ascii=False)
    print("\nescrito: results/analysis/sac_variants.json")

if __name__ == "__main__":
    main()
