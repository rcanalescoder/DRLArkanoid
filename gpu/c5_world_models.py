#!/usr/bin/env python3
# ============================================================================
#  C5 — Caracterización honesta de los World Models (protocolo §4.C5)
#  ---------------------------------------------------------------------------
#  Naming honesto: NO son "simuladores del juego". Son Dyna-Q con un modelo
#  DINÁMICO CINEMÁTICO (predice Δ de las 6 cinemáticas + r + done; los ladrillos
#  se mantienen fijos en la imaginación). 'worldModel'=MLP, 'worldModelRecurrente'=LSTM.
#
#  En C6: WM-MLP hace meseta ~55% y WM-RNN es NO-monótono y peor (54→35→40).
#  Hipótesis del hallazgo negativo: la imaginación sobre un modelo dinámico FLOJO
#  inyecta objetivos malos; si el LSTM predice la cinemática peor que el MLP, con
#  más presupuesto imagina más y se hace MÁS daño. Esto lo MEDIMOS:
#    A) resumen de rendimiento C6 desde el ledger (por presupuesto)
#    B) error de predicción 1-paso del modelo dinámico (MSE de Δcinemática) sobre
#       transiciones REALES, MLP vs LSTM, por presupuesto.
#  Salida: results/analysis/wm_variants.json
#    python3 gpu/c5_world_models.py
# ============================================================================
import sys, os, json, csv
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np, torch
import torch.nn.functional as F
import lab
from arkanoid_mps import VecArkanoid, DIM

WMS = {"worldModel": "WM (Dyna-Q cinemático, MLP)", "worldModelRecurrente": "WM-RNN (Dyna-Q cinemático, LSTM)"}

def perf_from_ledger(budgets):
    """A) Resumen de rendimiento C6 (variant=base) de los dos WM, por presupuesto."""
    rows = [r for r in csv.DictReader(open(lab.LEDGER))
            if r["status"] == "done" and r["variant"] == "base" and r["model"] in WMS]
    out = {}
    for m in WMS:
        out[m] = {}
        for b in budgets:
            vals = [float(r["success_test_id"]) for r in rows if r["model"] == m and int(r["budget"]) == b]
            if vals:
                a = np.array(vals)
                out[m][str(b)] = {"mean": round(float(a.mean()), 4), "median": round(float(np.median(a)), 4),
                                  "std": round(float(a.std(ddof=1)) if len(a) > 1 else 0.0, 4),
                                  "min": round(float(a.min()), 4), "max": round(float(a.max()), 4), "n": len(vals)}
    return out

def dyn_pred_error(model, budget, seeds, n_trans=4096):
    """B) MSE de predicción 1-paso de la cinemática (Δ de los 6 primeros dims) del modelo
    dinámico entrenado, sobre transiciones REALES generadas con su política greedy."""
    vcfg = lab.variant_cfg("base")
    _, train, _, _ = lab.L.train_split()
    errs = []
    for s in seeds:
        ck = lab.ckpt_path(model, "base", budget, s)
        if not os.path.exists(ck): continue
        lab.seed_all(s); algo = lab.build_model(model, vcfg); lab.load_ckpt(algo, ck)
        env = VecArkanoid(256, train, seed=2024, shaping=vcfg["shaping"], timeout_mode=vcfg["timeout_mode"])
        S, A, S2 = [], [], []
        while sum(len(x) for x in S) < n_trans:
            s0 = env.state(vcfg["scale"]); a = algo.eval_act(s0); s2, *_ = env.step(a)
            S.append(s0); A.append(a); S2.append(s2)
        s0 = torch.from_numpy(np.concatenate(S)[:n_trans]).to(lab.A.DEV)
        a0 = torch.from_numpy(np.concatenate(A)[:n_trans]).to(lab.A.DEV)
        s2 = torch.from_numpy(np.concatenate(S2)[:n_trans]).to(lab.A.DEV)
        a1h = F.one_hot(a0, 3).float()
        with torch.no_grad():
            if model == "worldModelRecurrente":
                x = torch.cat([s0, a1h], 1).unsqueeze(1); out, _ = algo.dyn(x); dk = out[:, 0, :6]
            else:
                dk = algo.dyn(s0, a1h)[:, :6]
            target = (s2 - s0)[:, :6]
            mse = F.mse_loss(dk, target).item()
        errs.append(mse)
    return {"dyn_kin_mse_mean": round(float(np.mean(errs)), 6), "n_seeds": len(errs),
            "per_seed": [round(e, 6) for e in errs]} if errs else None

def main():
    proto = json.load(open(lab.FROZEN_PATH)); seeds = proto["seeds"]; budgets = proto["budgets"]
    os.makedirs(lab.DIRS["analysis"], exist_ok=True)
    perf = perf_from_ledger(budgets)
    print("=== A) Rendimiento C6 (TEST-ID) por presupuesto ===")
    for m in WMS:
        line = " · ".join(f"@{b//1000}k {perf[m].get(str(b),{}).get('mean','?')}" for b in budgets)
        print(f"  {WMS[m]:38} {line}")
    print("\n=== B) Error de predicción del modelo dinámico (MSE Δcinemática, transiciones reales) ===")
    dyn = {}
    for m in WMS:
        dyn[m] = {}
        for b in budgets:
            r = dyn_pred_error(m, b, seeds)
            dyn[m][str(b)] = r
            if r: print(f"  {WMS[m]:38} @{b//1000}k · MSE={r['dyn_kin_mse_mean']}", flush=True)

    # conclusión: ¿el LSTM predice peor la cinemática que el MLP? -> imaginación peor -> lastra
    concl = []
    for b in budgets:
        mlp = dyn["worldModel"].get(str(b), {})
        rnn = dyn["worldModelRecurrente"].get(str(b), {})
        if mlp and rnn:
            ratio = rnn["dyn_kin_mse_mean"] / max(1e-9, mlp["dyn_kin_mse_mean"])
            concl.append(f"@{b//1000}k: MSE_LSTM/MSE_MLP = {ratio:.2f}x "
                         f"({'LSTM peor' if ratio > 1.1 else 'similar'})")
    report = {"frozen_hash": proto.get("frozen_hash"), "framework": lab.framework(),
              "naming": "Dyna-Q con modelo dinámico CINEMÁTICO (NO simulador del juego); ladrillos fijos en imaginación",
              "rendimiento_c6_test_id": perf, "error_modelo_dinamico_mse": dyn,
              "comparacion_dinamica": concl}
    with open(os.path.join(lab.DIRS["analysis"], "wm_variants.json"), "w") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print("\n" + "\n".join("  " + c for c in concl))
    print("\nescrito: results/analysis/wm_variants.json")

if __name__ == "__main__":
    main()
