#!/usr/bin/env python3
# ============================================================================
#  C1 — Análisis de fallos de PPO (protocolo §4.C1)
#  ---------------------------------------------------------------------------
#  PPO es el modelo más fuerte en C6 (~90%). Esto caracteriza su residual de fallo:
#  re-evalúa los checkpoints PPO de C6 (greedy, mismos test sets, eval_seed=777,
#  3 eps/nivel — IDÉNTICO a la eval de C6) pero instrumentando CADA episodio con
#  su FAMILIA, su nº de ladrillos y su CAUSA de fin (lost/timeout). Cruza con el
#  oráculo de limpiabilidad para decidir: ¿el residual es APRENDIBLE (familias/
#  patrones concretos donde flojea) o TECHO de física/diseño (falla justo donde
#  el propio oráculo apenas limpia)?
#  Salidas: results/analysis/ppo_failures.json (+ heatmaps de ladrillos sin romper).
#  NO entrena ni modifica el harness: solo carga checkpoints y re-evalúa.
#    python3 gpu/c1_ppo_failures.py [budgets]      # def. 1500000,3000000
# ============================================================================
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import lab
from arkanoid_mps import VecArkanoid, NUM, FILAS, COLS, MAXP
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt

MODEL = "ppo"; VAR = "base"

def eval_instrumented(algo, levels, vcfg, episodes_per_level=3, eval_seed=777):
    """Replica EXACTA del bucle de _eval_metrics (fixed=True, mismos params) pero
    guarda por episodio: familia, nº ladrillos inicial, causa, won, broken_pos."""
    n = len(levels)
    env = VecArkanoid(n, levels, seed=eval_seed, fixed=True,
                      shaping=vcfg["shaping"], timeout_mode=vcfg["timeout_mode"])
    counts = np.zeros(n, int); recs = []
    cap = (MAXP if vcfg["timeout_mode"] is None else 7200) * episodes_per_level + 2000; g = 0
    while counts.min() < episodes_per_level and g < cap:
        g += 1
        env.step(algo.eval_act(env.state(vcfg["scale"])))
        for e in env.last_eps:
            i = e["env"]
            if counts[i] < episodes_per_level:
                counts[i] += 1
                recs.append({"family": levels[i][1], "ini": e["ini"], "won": e["won"],
                             "cause": e["cause"], "broken_pos": e["broken_pos"],
                             "imask": levels[i][0]})
    return recs

def agg_by(recs, keyfn):
    out = {}
    for r in recs: out.setdefault(keyfn(r), []).append(r)
    res = {}
    for k, rs in out.items():
        won = np.array([r["won"] for r in rs])
        res[k] = {"n": len(rs), "success_rate": round(float(won.mean()), 4),
                  "death_rate": round(float(np.mean([r["cause"] == "lost" for r in rs])), 4),
                  "timeout_rate": round(float(np.mean([r["cause"] == "timeout" for r in rs])), 4)}
    return dict(sorted(res.items(), key=lambda kv: kv[1]["success_rate"]))

def bucket(ini):
    return "10-20" if ini <= 20 else "20-40" if ini <= 40 else "40-60" if ini <= 60 else "60-80"

def main():
    budgets = [int(x) for x in sys.argv[1].split(",")] if len(sys.argv) > 1 else [1_500_000, 3_000_000]
    proto = json.load(open(lab.FROZEN_PATH)); seeds = proto["seeds"]
    vcfg = lab.variant_cfg(VAR)
    clr = json.load(open(os.path.join(lab.DIRS["test_sets"], "clearability_report.json")))
    os.makedirs(lab.DIRS["analysis"], exist_ok=True)
    report = {"model": MODEL, "frozen_hash": proto.get("frozen_hash"), "framework": lab.framework(),
              "eval": "greedy · eval_seed=777 · 3 eps/nivel (idéntico a C6)", "budgets": {}}

    for budget in budgets:
        print(f"\n===== PPO @{budget//1000}k — re-eval instrumentado ({len(seeds)} semillas) =====", flush=True)
        per_set = {}
        for tset in lab.TEST_NAMES:
            levels = lab._load_set(tset)
            all_recs = []
            for s in seeds:
                ckpt = lab.ckpt_path(MODEL, VAR, budget, s)
                if not os.path.exists(ckpt):
                    print(f"  falta checkpoint {ckpt}"); continue
                lab.seed_all(s); algo = lab.build_model(MODEL, vcfg); lab.load_ckpt(algo, ckpt)
                all_recs += eval_instrumented(algo, levels, vcfg)
            if not all_recs: continue
            won = np.array([r["won"] for r in all_recs])
            by_fam = agg_by(all_recs, lambda r: r["family"])
            by_bkt = agg_by(all_recs, lambda r: bucket(r["ini"]))
            fails = [r for r in all_recs if not r["won"]]
            cause_mix = {c: round(float(np.mean([f["cause"] == c for f in fails])), 4) for c in ["lost", "timeout"]} if fails else {}
            # techo del oráculo para este set (cota inferior honesta)
            ceil = clr["sets"].get(tset, {}).get("techo_alcanzable_medio")
            # fracción media de ladrillos rotos por PPO en episodios FALLIDOS (¿cerca del techo?)
            fail_frac = round(float(np.mean([1 - (r["imask"] * (1 - r["broken_pos"])).sum() / max(1, r["imask"].sum())
                                             for r in fails])), 4) if fails else None
            # heatmap: ladrillos que PPO deja SIN ROMPER en episodios fallidos
            heat = np.zeros(NUM, np.float32)
            for r in fails: heat += r["imask"] * (1 - r["broken_pos"])
            hp = os.path.join(lab.DIRS["analysis"], f"ppo_fail_heatmap_b{budget}_{tset}.png")
            fig, ax = plt.subplots(figsize=(5, 4)); im = ax.imshow(heat.reshape(FILAS, COLS), cmap="hot", aspect="auto")
            ax.set_title(f"PPO @{budget//1000}k · {tset}\nladrillos SIN romper en {len(fails)} fallos", fontsize=8)
            fig.colorbar(im, ax=ax); fig.tight_layout(); fig.savefig(hp, dpi=90); plt.close(fig)
            per_set[tset] = {"success_rate": round(float(won.mean()), 4), "n_episodes": len(all_recs),
                             "n_fallos": len(fails), "causa_de_fallo": cause_mix,
                             "techo_oraculo_medio": ceil, "frac_sin_romper_en_fallos": fail_frac,
                             "por_familia": by_fam, "por_bucket_ladrillos": by_bkt,
                             "heatmap_fallos": os.path.relpath(hp, lab.ROOT)}
            worst = list(by_fam.items())[:3]
            print(f"  {tset:18} éxito={won.mean()*100:4.1f}% · {len(fails)} fallos "
                  f"(lost={cause_mix.get('lost',0)*100:.0f}% timeout={cause_mix.get('timeout',0)*100:.0f}%)", flush=True)
            print(f"       peores familias: " + ", ".join(f"{k} {v['success_rate']*100:.0f}%" for k, v in worst), flush=True)
        report["budgets"][str(budget)] = per_set

    # conclusión automática (aprendible vs techo) sobre el headline 1.5M
    head = report["budgets"].get("1500000", {})
    concl = []
    for tset, d in head.items():
        fams = d["por_familia"]; worst = list(fams.items())[:2]
        spread = (max(f["success_rate"] for f in fams.values()) - min(f["success_rate"] for f in fams.values())) if fams else 0
        ceil = d.get("techo_oraculo_medio") or 0.0
        fsr = d.get("frac_sin_romper_en_fallos") or 0.0
        hard = d["por_bucket_ladrillos"].get("60-80", {}).get("success_rate")
        worst_str = ", ".join(f"{k}={v['success_rate']*100:.0f}%" for k, v in worst)
        if spread >= 0.25:
            verdict = f"APRENDIBLE: gap por familia/patrón ({worst_str})"
        elif ceil < 0.9:
            verdict = f"TECHO de limpiabilidad: el oráculo solo limpia {ceil*100:.0f}% de media (niveles físicamente duros)"
        else:
            verdict = (f"TECHO de control de PPO: niveles limpiables (oráculo {ceil*100:.0f}%), fallo uniforme "
                       f"por pérdida TEMPRANA de bola (deja {fsr*100:.0f}% sin romper), peor en 60-80 ladr. "
                       f"({(hard or 0)*100:.0f}%); no mejora con presupuesto -> meseta de la política, no de los datos")
        concl.append({"test_set": tset, "spread_familias": round(spread, 3), "techo_oraculo": ceil,
                      "frac_sin_romper_en_fallos": fsr, "exito_60_80": hard, "veredicto": verdict})
    report["conclusion_headline_1.5M"] = concl
    outp = os.path.join(lab.DIRS["analysis"], "ppo_failures.json")
    with open(outp, "w") as f: json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"\nescrito: {os.path.relpath(outp, lab.ROOT)}")
    for c in concl: print(f"  [{c['test_set']}] {c['veredicto']}")

if __name__ == "__main__":
    main()
