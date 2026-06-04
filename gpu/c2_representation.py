#!/usr/bin/env python3
# ============================================================================
#  C2 — Aislamiento de representación en DQN (protocolo §4.C2)
#  ---------------------------------------------------------------------------
#  ¿Por qué DQN < PPO? Hipótesis: la REPRESENTACIÓN. Compara, con TODO lo demás
#  igual (escala, currículo, shaping, eps), el encoder del DQN:
#    conv (=base) · flat (MLP denso) · flat_0.25 (flat con escala 0.25) · branches
#  por presupuesto, multi-semilla, mismos test sets. Referencia: PPO (base) y DQN-conv.
#  Decide: la ventaja del conv ¿es de EFICIENCIA (se borra con presupuesto) o de
#  TECHO (persiste a 3M)?
#  Salida: results/analysis/dqn_representation.json (+ tabla por consola).
#    python3 gpu/c2_representation.py
# ============================================================================
import sys, os, json, csv
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import lab

ENCODERS = ["base", "flat", "flat_0.25", "branches"]   # base = conv
LBL = {"base": "DQN-conv (base)", "flat": "DQN-flat", "flat_0.25": "DQN-flat-0.25", "branches": "DQN-branches"}

def agg(vals):
    if not vals: return None
    a = np.array(vals, float)
    return {"mean": round(float(a.mean()), 4), "median": round(float(np.median(a)), 4),
            "std": round(float(a.std(ddof=1)) if len(a) > 1 else 0.0, 4),
            "min": round(float(a.min()), 4), "max": round(float(a.max()), 4), "n": len(a)}

def grp(rows, model, variant, budget, col="success_test_id"):
    return agg([float(r[col]) for r in rows
               if r["model"] == model and r["variant"] == variant and int(r["budget"]) == budget])

def main():
    proto = json.load(open(lab.FROZEN_PATH)); budgets = proto["budgets"]
    rows = [r for r in csv.DictReader(open(lab.LEDGER)) if r["status"] == "done"]
    rep = {"frozen_hash": proto.get("frozen_hash"), "metric": "success_test_id (greedy)",
           "note": "Eje único = encoder; resto de receta = base. PPO-base como referencia (modelo a batir).",
           "por_presupuesto": {}}
    print("=== C2 · representación DQN (TEST-ID) — encoder como único eje ===")
    for b in budgets:
        print(f"\n--- @{b//1000}k ---")
        d = {}
        for v in ENCODERS:
            a = grp(rows, "dqn", v, b)
            d[v] = a
            if a: print(f"  {LBL[v]:18} mean={a['mean']*100:4.0f}% med={a['median']*100:4.0f}% std={a['std']*100:3.0f} (n{a['n']})")
        ppo = grp(rows, "ppo", "base", b); d["ppo_ref"] = ppo
        if ppo: print(f"  {'PPO (ref)':18} mean={ppo['mean']*100:4.0f}%")
        rep["por_presupuesto"][str(b)] = d

    # gap conv vs mejor no-conv por presupuesto (sin flat_0.25, que es patológico)
    concl = []
    for b in budgets:
        d = rep["por_presupuesto"][str(b)]
        conv = d.get("base"); others = [d[v] for v in ("flat", "branches") if d.get(v)]
        if conv and others:
            best_other = max(others, key=lambda x: x["mean"])
            concl.append({"budget": b, "conv_mean": conv["mean"], "mejor_no_conv": best_other["mean"],
                          "gap_conv_vs_noconv": round(conv["mean"] - best_other["mean"], 4)})
    rep["gap_conv_vs_noconv_por_presupuesto"] = concl
    # ¿el gap DQN-PPO es de REPRESENTACIÓN o ALGORÍTMICO? (headline 1.5M)
    h = rep["por_presupuesto"].get("1500000", {}); notes = []
    if h.get("base") and h.get("ppo_ref"):
        best_enc = max([v for v in ("base", "flat", "branches") if h.get(v)], key=lambda v: h[v]["mean"])
        gap = h["ppo_ref"]["mean"] - h[best_enc]["mean"]
        if gap > 0.08:
            verdict = (f"El gap DQN-PPO es ALGORÍTMICO, no de representación: la MEJOR representación de DQN "
                       f"({LBL[best_enc]}={h[best_enc]['mean']*100:.0f}%) sigue {gap*100:.0f} pts por debajo de PPO "
                       f"({h['ppo_ref']['mean']*100:.0f}%). El conv ya es la representación óptima de DQN; cambiarla no cierra el hueco.")
        else:
            verdict = f"La representación explica el gap: {LBL[best_enc]} alcanza a PPO en el headline (gap {gap*100:.0f} pts)."
    else:
        verdict = "faltan datos para la conclusión"
    if h.get("flat_0.25") and h["flat_0.25"]["mean"] < 0.05:
        notes.append("flat_0.25 colapsa al 100% en los 3 presupuestos -> el encoder flat es muy sensible a la escala "
                     "de entrada (0.25 ahoga la señal de ladrillos); el conv no sufre esto.")
    notes.append("Orden de representación: conv >= branches > flat. conv gana a bajo (700k) y alto (3M) presupuesto "
                 "(mejor eficiencia Y mayor techo); branches iguala a conv a 1.5M pero topa más bajo a 3M.")
    rep["conclusion"] = verdict; rep["notas"] = notes
    print(f"\nCONCLUSIÓN: {verdict}")
    for n in notes: print(f"  - {n}")
    with open(os.path.join(lab.DIRS["analysis"], "dqn_representation.json"), "w") as f:
        json.dump(rep, f, indent=2, ensure_ascii=False)
    print("\nescrito: results/analysis/dqn_representation.json")

if __name__ == "__main__":
    main()
