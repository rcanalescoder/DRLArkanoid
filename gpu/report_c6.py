#!/usr/bin/env python3
# ============================================================================
#  C6 — Tabla comparativa final DESDE EL LEDGER (protocolo §8).
#  ---------------------------------------------------------------------------
#  Lee results/ledger.csv (fuente de verdad, una fila por run real) y, por
#  (modelo, presupuesto), agrega sobre las semillas: mean/median/std/min/max,
#  IC95, collapse_rate, %seeds>80, steps-to-clear, éxito en el bucket 60-80
#  ladrillos (de los JSON por run) y TEST-OOD-patrón. Genera:
#    - tabla por consola (una por presupuesto; headline = 1.5M)
#    - results/analysis/tabla_c6.md   (deliverable markdown)
#    - results/analysis/tabla_c6.csv  (deliverable CSV, una fila por modelo×presupuesto)
#  NO entrena ni toca artefactos: solo lee. Funciona con datos parciales.
#    python3 gpu/report_c6.py
# ============================================================================
import sys, os, json, csv, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lab

MODELS = lab.MODELS_C6
# Etiquetas honestas (regla del protocolo): el SAC actual es el híbrido, los WM son Dyna-Q cinemático.
LABELS = {"dqn": "DQN", "ppo": "PPO", "sac": "SAC-critic-hybrid",
          "worldModel": "WM (Dyna-Q cinem.)", "worldModelRecurrente": "WM-RNN (Dyna-Q cinem.)"}

def _f(x):
    try: return float(x)
    except (TypeError, ValueError): return None

def load_ledger():
    # C6 = comparativa de la receta BASE. Filtra variant==base para NO mezclar variantes C2/C3.
    if not os.path.exists(lab.LEDGER): return []
    with open(lab.LEDGER) as f:
        return [r for r in csv.DictReader(f) if r.get("status") == "done" and r.get("variant") == "base"]

def agg(vals, thr):
    v = [x for x in vals if x is not None]
    if not v: return None
    n = len(v); mean = sum(v) / n
    std = (sum((x - mean) ** 2 for x in v) / (n - 1)) ** 0.5 if n > 1 else 0.0
    ic = 1.96 * std / math.sqrt(n) if n > 1 else 0.0
    sv = sorted(v); med = sv[n // 2] if n % 2 else (sv[n // 2 - 1] + sv[n // 2]) / 2
    return {"n": n, "mean": mean, "median": med, "std": std, "min": min(v), "max": max(v),
            "ic95": (mean - ic, mean + ic), "collapse_rate": sum(1 for x in v if x < thr) / n,
            "pct_gt80": sum(1 for x in v if x >= 0.80) / n}

def bucket_60_80(model, budget, seeds):
    """Éxito medio en niveles de 60-80 ladrillos (de los JSON de TEST-ID por semilla)."""
    vals = []
    for s in seeds:
        p = os.path.join(lab.DIRS["runs"], f"{model}_base_b{budget}_seed{s}_test_id.json")
        if not os.path.exists(p): continue
        j = json.load(open(p))
        b = j.get("success_by_bricks_bucket", {}).get("60-80")
        if b and b.get("n", 0) > 0: vals.append(b["success_rate"])
    return (sum(vals) / len(vals)) if vals else None

def comment(a_id, collapse, deaths):
    if a_id is None: return "sin datos"
    parts = []
    if collapse and collapse > 0: parts.append(f"{collapse*100:.0f}% colapsos")
    if a_id["std"] >= 0.20: parts.append("alta varianza")
    elif a_id["std"] <= 0.05: parts.append("estable")
    if deaths is not None and deaths >= 0.5: parts.append("muere mucho")
    return ", ".join(parts) if parts else "ok"

def build_rows(led, budget, seeds, thr):
    rows = []
    for m in MODELS:
        rs = [r for r in led if r["model"] == m and int(r["budget"]) == budget]
        if not rs:
            rows.append({"model": m, "n": 0}); continue
        a_id = agg([_f(r["success_test_id"]) for r in rs], thr)
        a_op = agg([_f(r["success_test_ood_pattern"]) for r in rs], thr)
        a_od = agg([_f(r["success_test_ood_diff"]) for r in rs], thr)
        stc = agg([_f(r["steps_to_clear"]) for r in rs], thr)
        dth = agg([_f(r["death_rate"]) for r in rs], thr)
        rows.append({"model": m, "n": a_id["n"], "id": a_id, "ood_p": a_op, "ood_d": a_od,
                     "steps": stc["mean"] if stc else None,
                     "b6080": bucket_60_80(m, budget, seeds),
                     "death": dth["mean"] if dth else None,
                     "comment": comment(a_id, a_id["collapse_rate"], dth["mean"] if dth else None)})
    return rows

def fmt_pct(x): return f"{x*100:.0f}" if x is not None else "—"

def console_table(rows, budget):
    print(f"\n=== C6 · presupuesto {budget//1000}k · TEST-ID (greedy, niveles no vistos) ===")
    h = f"{'modelo':<24} {'n':>2} {'mean':>5} {'med':>4} {'std':>4} {'min':>4} {'max':>4} {'IC95':>11} {'col%':>4} {'>80':>4} {'OODp':>4} {'60-80':>5} {'steps':>6}  comentario"
    print(h); print("-" * len(h))
    for r in rows:
        if not r.get("n"):
            print(f"{LABELS[r['model']]:<24} {'0':>2}  (sin runs todavía)"); continue
        a = r["id"]; ic = f"[{a['ic95'][0]*100:.0f},{a['ic95'][1]*100:.0f}]"
        steps_str = f"{r['steps']:.0f}" if r["steps"] is not None else "—"
        print(f"{LABELS[r['model']]:<24} {a['n']:>2} {fmt_pct(a['mean']):>5} {fmt_pct(a['median']):>4} "
              f"{fmt_pct(a['std']):>4} {fmt_pct(a['min']):>4} {fmt_pct(a['max']):>4} {ic:>11} "
              f"{fmt_pct(a['collapse_rate']):>4} {fmt_pct(a['pct_gt80']):>4} "
              f"{fmt_pct(r['ood_p']['mean'] if r['ood_p'] else None):>4} {fmt_pct(r['b6080']):>5} "
              f"{steps_str:>6}  {r['comment']}")

def md_table(rows, budget):
    out = [f"### Presupuesto {budget//1000}k pasos  ·  TEST-ID (greedy, niveles no vistos)\n",
           "| Modelo | n | Mean | Median | Std | Min | Max | IC95 | Collapse | %>80 | OOD-patrón | 60-80 ladr. | Steps-clear | Comentario |",
           "|---|--:|--:|--:|--:|--:|--:|:--:|--:|--:|--:|--:|--:|---|"]
    for r in rows:
        if not r.get("n"):
            out.append(f"| {LABELS[r['model']]} | 0 | — | | | | | | | | | | | sin runs |"); continue
        a = r["id"]; ic = f"[{a['ic95'][0]*100:.0f}, {a['ic95'][1]*100:.0f}]"
        steps_str = f"{r['steps']:.0f}" if r["steps"] is not None else "—"
        out.append(f"| {LABELS[r['model']]} | {a['n']} | **{fmt_pct(a['mean'])}%** | {fmt_pct(a['median'])}% | "
                   f"{fmt_pct(a['std'])} | {fmt_pct(a['min'])}% | {fmt_pct(a['max'])}% | {ic} | "
                   f"{fmt_pct(a['collapse_rate'])}% | {fmt_pct(a['pct_gt80'])}% | {fmt_pct(r['ood_p']['mean'] if r['ood_p'] else None)}% | "
                   f"{fmt_pct(r['b6080'])}% | {steps_str} | {r['comment']} |")
    return "\n".join(out) + "\n"

def main():
    proto = json.load(open(lab.FROZEN_PATH))
    seeds = proto["seeds"]; budgets = proto["budgets"]; thr = proto["collapse_threshold"]
    led = load_ledger()
    print(f"ledger: {len(led)} runs · frozen={proto.get('frozen_hash')} · umbral colapso <{thr*100:.0f}%")
    os.makedirs(lab.DIRS["analysis"], exist_ok=True)
    md = [f"# C6 — Comparativa final (protocolo congelado `{proto.get('frozen_hash')}`)\n",
          f"Framework: `{proto.get('framework')}` · eval greedy · {len(seeds)} semillas {seeds} · "
          f"umbral de colapso <{thr*100:.0f}% · fuente: `results/ledger.csv` ({len(led)} runs).\n",
          "Etiquetas honestas: SAC = `SAC-critic-hybrid` (conducta y eval del crítico soft); "
          "WM/WM-RNN = Dyna-Q con modelo **cinemático** (no simulador del juego).\n"]
    csv_rows = []
    # orden de presentación: headline (1.5M) primero si existe
    order = ([b for b in budgets if b == 1_500_000] + [b for b in budgets if b != 1_500_000])
    for b in order:
        rows = build_rows(led, b, seeds, thr)
        console_table(rows, b)
        md.append(md_table(rows, b))
        for r in rows:
            if r.get("n"):
                a = r["id"]
                csv_rows.append({"model": r["model"], "budget": b, "n": a["n"],
                    "mean": round(a["mean"], 4), "median": round(a["median"], 4), "std": round(a["std"], 4),
                    "min": round(a["min"], 4), "max": round(a["max"], 4),
                    "ic95_lo": round(a["ic95"][0], 4), "ic95_hi": round(a["ic95"][1], 4),
                    "collapse_rate": round(a["collapse_rate"], 4), "pct_seeds_gt80": round(a["pct_gt80"], 4),
                    "ood_pattern_mean": round(r["ood_p"]["mean"], 4) if r["ood_p"] else "",
                    "ood_diff_mean": round(r["ood_d"]["mean"], 4) if r["ood_d"] else "",
                    "bucket_60_80": round(r["b6080"], 4) if r["b6080"] is not None else "",
                    "steps_to_clear": round(r["steps"], 1) if r["steps"] is not None else "",
                    "death_rate": round(r["death"], 4) if r["death"] is not None else "",
                    "comment": r["comment"]})
    with open(os.path.join(lab.DIRS["analysis"], "tabla_c6.md"), "w") as f:
        f.write("\n".join(md))
    if csv_rows:
        with open(os.path.join(lab.DIRS["analysis"], "tabla_c6.csv"), "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=list(csv_rows[0].keys())); w.writeheader(); w.writerows(csv_rows)
    print(f"\nescrito: results/analysis/tabla_c6.md · results/analysis/tabla_c6.csv ({len(csv_rows)} filas)")

if __name__ == "__main__":
    main()
