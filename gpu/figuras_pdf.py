#!/usr/bin/env python3
# ============================================================================
#  Figuras para el PDF v2 (orientado a resultado) — TODAS desde el ledger/artefactos.
#  F1 la conquista (antes ciego 0% / después visión) · F2 curvas de aprendizaje
#  multi-semilla (5 modelos, banda min-max) · F4 éxito por dificultad (buckets).
#  + copia 3 heatmaps reales para F3 (el agente apunta vs colapso).
#  Salida: docs/assets/v2/*.png
#    python3 gpu/figuras_pdf.py
# ============================================================================
import sys, os, json, csv, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
import lab

OUT = os.path.join(lab.ROOT, "docs", "assets", "v2"); os.makedirs(OUT, exist_ok=True)
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 11, "axes.edgecolor": "#41464f",
                     "axes.labelcolor": "#11181f", "text.color": "#11181f", "xtick.color": "#41464f",
                     "ytick.color": "#41464f", "axes.linewidth": 0.8, "figure.dpi": 150})
COL = {"ppo": "#7c3aed", "dqn": "#2563eb", "sac": "#db2777", "worldModel": "#d97706", "worldModelRecurrente": "#0891b2"}
LBL = {"ppo": "PPO", "dqn": "DQN", "sac": "SAC-hybrid", "worldModel": "WM (Dyna-Q)", "worldModelRecurrente": "WM-RNN"}
ORD = ["ppo", "dqn", "sac", "worldModel", "worldModelRecurrente"]

def led_rows():
    return [r for r in csv.DictReader(open(lab.LEDGER)) if r["status"] == "done" and r["variant"] == "base"]

def mean_test_id(rows, model, budget):
    v = [float(r["success_test_id"]) for r in rows if r["model"] == model and int(r["budget"]) == budget]
    return float(np.mean(v)) if v else None

# ---------------------------------------------------------------- F1 conquista
def fig_f1(rows):
    fig, (a0, a1) = plt.subplots(1, 2, figsize=(11, 4.2), gridspec_kw={"width_ratios": [1, 2.4]})
    # ANTES — ciego
    a0.bar([0], [0.0], width=0.5, color="#c0344d")
    a0.text(0, 0.04, "0%", ha="center", va="bottom", fontsize=20, fontweight="bold", color="#c0344d")
    a0.set_title("ANTES · agente CIEGO\n(6 variables, no ve los ladrillos)", fontsize=11, fontweight="bold")
    a0.set_ylim(0, 1); a0.set_xlim(-0.6, 0.6); a0.set_xticks([])
    a0.set_ylabel("éxito en niveles de TEST no vistos")
    a0.text(0, 0.55, "rompe ~2/28\nsolo sobrevive", ha="center", va="center", fontsize=10, color="#7a2233")
    a0.spines[["top", "right"]].set_visible(False)
    # DESPUÉS — visión (TEST-ID @1.5M)
    vals = [mean_test_id(rows, m, 1_500_000) or 0 for m in ORD]
    bars = a1.bar(range(len(ORD)), vals, color=[COL[m] for m in ORD], width=0.66)
    for b, v in zip(bars, vals):
        a1.text(b.get_x() + b.get_width() / 2, v + 0.015, f"{v*100:.0f}%", ha="center", va="bottom",
                fontsize=12, fontweight="bold", color="#11181f")
    a1.set_title("DESPUÉS · agente CON VISIÓN\n(matriz de ocupación 8×10 + encoder conv · éxito en TEST-ID @1.5M)",
                 fontsize=11, fontweight="bold")
    a1.set_ylim(0, 1); a1.set_xticks(range(len(ORD))); a1.set_xticklabels([LBL[m] for m in ORD], fontsize=10)
    a1.set_ylabel("éxito en TEST-ID (greedy, 5 semillas)")
    a1.spines[["top", "right"]].set_visible(False); a1.grid(axis="y", color="#e7e9ef", lw=0.7)
    fig.suptitle("La conquista: de sobrevivir sin ver, a limpiar niveles NUNCA vistos apuntando",
                 fontsize=13, fontweight="bold", y=1.02)
    fig.tight_layout(); fig.savefig(os.path.join(OUT, "f1_conquista.png"), bbox_inches="tight"); plt.close(fig)
    print("F1 ok")

# ---------------------------------------------------------- F2 curvas aprendizaje
def fig_f2(budget=1_500_000):
    fig, ax = plt.subplots(figsize=(11, 5.2))
    seeds = [0, 1, 2, 3, 4]
    for m in ORD:
        curves = []
        for s in seeds:
            p = os.path.join(lab.DIRS["curves"], f"{m}__base__b{budget}__s{s}.csv")
            if not os.path.exists(p): continue
            xs, ys = [], []
            for r in csv.DictReader(open(p)): xs.append(float(r["step"])); ys.append(float(r["success_rate_eval"]))
            if ys: curves.append((np.array(xs), np.array(ys)))
        if not curves: continue
        L = min(len(y) for _, y in curves)
        X = curves[0][0][:L]; Y = np.stack([y[:L] for _, y in curves])
        mean = Y.mean(0); lo = Y.min(0); hi = Y.max(0)
        ax.plot(X / 1000, mean * 100, color=COL[m], lw=2.4, label=LBL[m], zorder=3)
        ax.fill_between(X / 1000, lo * 100, hi * 100, color=COL[m], alpha=0.13, lw=0, zorder=1)
    ax.set_xlabel("pasos de entorno (miles)"); ax.set_ylabel("éxito en validación (%)")
    ax.set_title(f"Curvas de aprendizaje · éxito en validación · banda min–max sobre 5 semillas · presupuesto {budget//1000}k",
                 fontsize=12, fontweight="bold")
    ax.set_ylim(0, 100); ax.grid(color="#e7e9ef", lw=0.7); ax.spines[["top", "right"]].set_visible(False)
    ax.legend(loc="upper left", frameon=False, fontsize=11, ncol=2)
    fig.tight_layout(); fig.savefig(os.path.join(OUT, "f2_curvas.png"), bbox_inches="tight"); plt.close(fig)
    print("F2 ok")

# ----------------------------------------------------- F4 éxito por dificultad
def fig_f4(budget=1_500_000):
    buckets = ["10-20", "20-40", "40-60", "60-80"]; seeds = [0, 1, 2, 3, 4]
    data = {}
    for m in ORD:
        per = {b: [] for b in buckets}
        for s in seeds:
            p = os.path.join(lab.DIRS["runs"], f"{m}_base_b{budget}_seed{s}_test_id.json")
            if not os.path.exists(p): continue
            j = json.load(open(p)).get("success_by_bricks_bucket", {})
            for b in buckets:
                sr = j.get(b, {}).get("success_rate")
                if sr is not None: per[b].append(sr)
        data[m] = [np.mean(per[b]) * 100 if per[b] else 0 for b in buckets]
    fig, ax = plt.subplots(figsize=(11, 4.8))
    x = np.arange(len(buckets)); w = 0.16
    for i, m in enumerate(ORD):
        ax.bar(x + (i - 2) * w, data[m], width=w, color=COL[m], label=LBL[m])
    ax.set_xticks(x); ax.set_xticklabels([f"{b} ladrillos" for b in buckets])
    ax.set_ylabel("éxito (%)"); ax.set_ylim(0, 100)
    ax.set_title(f"Éxito por dificultad (nº de ladrillos del nivel) · TEST-ID @ {budget//1000}k · 5 semillas",
                 fontsize=12, fontweight="bold")
    ax.grid(axis="y", color="#e7e9ef", lw=0.7); ax.spines[["top", "right"]].set_visible(False)
    ax.legend(loc="upper right", frameon=False, fontsize=10, ncol=2)
    fig.tight_layout(); fig.savefig(os.path.join(OUT, "f4_dificultad.png"), bbox_inches="tight"); plt.close(fig)
    print("F4 ok")

# -------------------------------------------- F3: copiar heatmaps reales (apunta vs colapso)
def copy_heatmaps():
    cands = {
        "heat_ppo.png": "ppo_base_b1500000_seed0_test_id.png",
        "heat_dqn.png": "dqn_base_b1500000_seed0_test_id.png",
        "heat_colapso.png": "sac_base_b700000_seed1_test_id.png",
    }
    for dst, src in cands.items():
        sp = os.path.join(lab.DIRS["heatmaps"], src)
        if os.path.exists(sp): shutil.copy(sp, os.path.join(OUT, dst)); print(f"F3 heatmap {dst} <- {src}")
        else: print(f"  (falta heatmap {src})")

if __name__ == "__main__":
    rows = led_rows()
    fig_f1(rows); fig_f2(); fig_f4(); copy_heatmaps()
    print("\nfiguras en", os.path.relpath(OUT, lab.ROOT))
