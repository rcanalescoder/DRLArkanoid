#!/usr/bin/env python3
# ============================================================================
#  PROTOCOLO DE HONESTIDAD — Harness único (Fase A: A1–A5)  ·  Arkanoid DRL 8x10
#  ---------------------------------------------------------------------------
#  Un solo framework (PyTorch-MPS). Reutiliza el entorno/generador de
#  arkanoid_mps.py y las clases de modelo de comparativa_mps.py, y añade encima
#  todo lo que el protocolo exige para que NINGÚN número exista sin artefacto:
#    A1  eval_run(model,variant,seed,test_set) -> métricas (§6.1) + heatmap PNG
#    A2  run_multiseed(...)                      -> agregados (§6.2)
#    A3  curvas de aprendizaje (CSV por semilla + PNG con banda)
#    A4  manifiesto de reproducibilidad (.config.json + config_hash + git)
#    A5  ledger central append-only (results/ledger.csv, esquema §6.3)
#    A6  (en lab_levels.py) conjuntos test + limpiabilidad; aquí se materializan
#
#  Variantes: en Fase A solo está implementada la receta "base" (conv + currículo
#  + shaping + timeout constante + εdecay 8000). Las variantes de ablación
#  (sin_conv, sin_curriculo, sin_escala, sin_shaping, epsdecay_lento, timeout_fijo)
#  son de la Fase C: aquí se rechazan explícitamente para no fingir que existen.
#
#  Uso:
#    python3 gpu/lab.py testsets [n_id n_ood_pat n_ood_dif]   # A6: construir test sets
#    python3 gpu/lab.py smoke                                  # PUERTA A: demo A1–A6
#    python3 gpu/lab.py multiseed <model> <budget> <s0..sk>    # una run multi-semilla
# ============================================================================
import os, sys, json, time, csv, hashlib, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import torch
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt

import arkanoid_mps as A
from arkanoid_mps import VecArkanoid, NUM, FILAS, COLS, DIM, MAXP
import comparativa_mps as C
import lab_levels as L

# ---------------------------------------------------------------------------
#  Rutas de artefactos
# ---------------------------------------------------------------------------
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "results")
DIRS = {k: os.path.join(RES, k) for k in
        ["runs", "heatmaps", "aggregate", "curves", "plots", "test_sets", "analysis", "checkpoints"]}
LEDGER = os.path.join(RES, "ledger.csv")
FROZEN_PATH = os.path.join(ROOT, "frozen_protocol.json")
LEDGER_COLS = ["run_id", "timestamp", "model", "variant", "framework", "seed", "budget",
               "config_hash", "git_commit", "success_test_id", "success_test_ood_pattern",
               "success_test_ood_diff", "success_train", "bricks_cleared_median", "steps_to_clear",
               "death_rate", "reward_no_shaping", "collapsed", "status",
               "config_path", "metrics_path", "heatmap_path", "curve_path"]

def ensure_dirs():
    os.makedirs(RES, exist_ok=True)
    for d in DIRS.values(): os.makedirs(d, exist_ok=True)

# ---------------------------------------------------------------------------
#  Reproducibilidad: semillas, git, framework, config_hash
# ---------------------------------------------------------------------------
def seed_all(seed):
    np.random.seed(seed); torch.manual_seed(seed)
    try: torch.mps.manual_seed(seed)
    except Exception: pass

def git_commit():
    try:
        c = subprocess.check_output(["git", "-C", ROOT, "rev-parse", "--short", "HEAD"],
                                    stderr=subprocess.DEVNULL).decode().strip()
        dirty = subprocess.check_output(["git", "-C", ROOT, "status", "--porcelain"],
                                        stderr=subprocess.DEVNULL).decode().strip() != ""
        return c + ("*" if dirty else "")
    except Exception:
        return "nogit"

def framework():
    return f"torch{torch.__version__}+np{np.__version__}+py{sys.version_info.major}.{sys.version_info.minor}·{A.DEV.type}"

def config_hash(cfg):
    c = {k: v for k, v in cfg.items() if k != "seed"}
    return hashlib.sha256(json.dumps(c, sort_keys=True).encode()).hexdigest()[:12]

# ---------------------------------------------------------------------------
#  Registro de modelos + checkpoints
# ---------------------------------------------------------------------------
REG = {"dqn": C.DQN, "sac": C.SAC, "worldModel": C.WorldModel,
       "worldModelRecurrente": C.WorldModelRNN, "ppo": C.PPO}

def variant_cfg(variant):
    # Solo "base" en Fase A. Devuelve la receta como dict (entra en el config_hash).
    if variant == "base":
        return {"conv": True, "scale": 1.0, "curriculum": True, "shaping": True,
                "timeout_mode": None, "eps_decay": 8000}
    raise NotImplementedError(
        f"variante '{variant}': pendiente Fase C (ablación). En Fase A solo existe 'base'.")

def build_model(model, vcfg):
    if model not in REG: raise ValueError(f"modelo desconocido: {model}")
    if not vcfg["conv"]:
        raise NotImplementedError("encoder flat (sin_conv/sin_escala): pendiente Fase C")
    return REG[model]()

def _modules(algo): return {k: v for k, v in vars(algo).items() if isinstance(v, torch.nn.Module)}

def save_ckpt(algo, path):
    torch.save({k: m.state_dict() for k, m in _modules(algo).items()}, path)

def load_ckpt(algo, path):
    sd = torch.load(path, map_location=A.DEV)
    mods = _modules(algo)
    for k, s in sd.items():
        if k in mods: mods[k].load_state_dict(s)

def ckpt_path(model, variant, budget, seed):
    return os.path.join(DIRS["checkpoints"], f"{model}__{variant}__b{budget}__s{seed}.pt")

def run_id(model, variant, budget, seed):
    return f"{model}__{variant}__b{budget}__s{seed}"

# ---------------------------------------------------------------------------
#  Conjuntos de test (A6): construir una vez (deterministas) y persistir
# ---------------------------------------------------------------------------
TEST_NAMES = ["test_id", "test_ood_pattern", "test_ood_diff"]

def _save_set(name, levels):
    masks = np.stack([m for m, _, _ in levels]).astype(np.uint8)
    fams = [f for _, f, _ in levels]; vivos = np.array([v for _, _, v in levels], np.int32)
    np.savez(os.path.join(DIRS["test_sets"], f"{name}.npz"),
             masks=masks, fams=np.array(fams), vivos=vivos)

def _load_set(name):
    z = np.load(os.path.join(DIRS["test_sets"], f"{name}.npz"), allow_pickle=False)
    return [(z["masks"][i].astype(np.float32), str(z["fams"][i]), int(z["vivos"][i]))
            for i in range(len(z["vivos"]))]

def build_test_sets(n_id=150, n_pat=100, n_dif=100, seed=20240601):
    ensure_dirs()
    pool, train, val, test = L.train_split()
    excl = {L.mask_key(m) for m, _, _ in train} | {L.mask_key(m) for m, _, _ in val}
    raw = {"test_id": L.gen_test_id(n_id, seed, excl),
           "test_ood_pattern": L.gen_test_ood_pattern(n_pat, seed + 1, excl),
           "test_ood_diff": L.gen_test_ood_diff(n_dif, seed + 2, excl)}
    report = {"method": "oráculo de seguimiento (cota inferior); clearable = limpiado en >=1 de K reinicios "
                        "dentro del timeout base (constante MAXP=%d). Niveles no limpiables se DESCARTAN." % MAXP,
              "restarts": 6, "timeout": MAXP, "git_commit": git_commit(), "sets": {}}
    for name in TEST_NAMES:
        lv = raw[name]
        rep = L.clearability(lv, restarts=6, timeout=MAXP)
        keep = [lv[i] for i in range(len(lv)) if rep[i]["clearable"]]
        drop = len(lv) - len(keep)
        ceil = float(np.mean([rep[i]["best_broken_frac"] for i in range(len(lv))])) if lv else 0.0
        _save_set(name, keep)
        # garantía A6: re-verificar el set FINAL ya guardado en disco -> debe dar 0 no-limpiables
        saved = _load_set(name)
        rep2 = L.clearability(saved, restarts=6, timeout=MAXP)
        no_clear_final = int(sum(0 if r["clearable"] else 1 for r in rep2))
        fams = {}
        for _, f, _ in keep: fams[f] = fams.get(f, 0) + 1
        report["sets"][name] = {"generados": len(lv), "descartados_no_limpiables": drop,
                                "en_set_final": len(keep), "no_limpiables_en_set_final": no_clear_final,
                                "techo_alcanzable_medio": round(ceil, 4), "familias": fams,
                                "vivos_min": int(min(v for _, _, v in keep)) if keep else 0,
                                "vivos_max": int(max(v for _, _, v in keep)) if keep else 0}
    with open(os.path.join(DIRS["test_sets"], "clearability_report.json"), "w") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    return report

def test_sets_exist():
    return all(os.path.exists(os.path.join(DIRS["test_sets"], f"{n}.npz")) for n in TEST_NAMES)

def _set_sha(name):
    z = np.load(os.path.join(DIRS["test_sets"], f"{name}.npz"))
    return hashlib.sha256(z["masks"].tobytes()).hexdigest()[:16]

# ---------------------------------------------------------------------------
#  Fase B — congelar el protocolo: test sets + frozen_protocol.json (+hash)
# ---------------------------------------------------------------------------
def freeze(seeds=(0, 1, 2, 3, 4), budgets=(700_000, 1_500_000, 3_000_000),
           n_id=500, n_pat=250, n_dif=200, collapse_thr=0.10, seed=20240601):
    ensure_dirs()
    rep = build_test_sets(n_id, n_pat, n_dif, seed)
    pool, train, val, test = L.train_split()
    proto = {
        "protocol_version": "v1",
        "frozen_by_git_commit": git_commit(),
        "framework": framework(), "device": A.DEV.type, "eval": "greedy",
        "seeds": list(seeds), "budgets": list(budgets), "collapse_threshold": collapse_thr,
        "base_recipe": {**variant_cfg("base"), "tiers": TIERS,
                        "envs_per_model": {n: c.envs for n, c in REG.items()},
                        "ppo_rollout_L": C.PPO.L,
                        "timeout_base": f"constante MAXP={MAXP} (decisión del usuario)"},
        "generator": {"pool_n": 400, "pool_seed": 12345, "split_seed": 999,
                      "train_families": ["dispersion", "filas", "columnas", "bloque", "simetrico"],
                      "n_train": len(train), "n_val": len(val)},
        "test_sets": {name: {"n": rep["sets"][name]["en_set_final"],
                             "familias": rep["sets"][name]["familias"],
                             "vivos_min": rep["sets"][name]["vivos_min"],
                             "vivos_max": rep["sets"][name]["vivos_max"],
                             "sha256_masks": _set_sha(name)} for name in TEST_NAMES},
        "metrics_per_run": ["success_rate (+ por bloque ID/OOD y por bucket 10-20/20-40/40-60/60-80)",
                            "success_rate_train", "bricks_cleared_mean", "bricks_cleared_median",
                            "steps_to_clear", "death_rate", "timeout_rate", "reward_no_shaping",
                            "brick_break_heatmap"],
        "aggregates": ["mean", "median", "std", "min", "max", "ic95", "collapse_rate", "pct_seeds_gt80"],
        "clearability": {"method": "oráculo de seguimiento (cota inferior, determinista por nivel)",
                         "restarts": 6, "timeout": MAXP},
        "notes": {
            "timeout": f"La BASE usa timeout CONSTANTE {MAXP} (coincide con el código GPU y los números "
                       "históricos). En consecuencia, la ablación de timeout de C3 será 'proporcional "
                       "90×ladrillos' (no 'fijo'), para que siga siendo un cambio real frente a la base.",
            "honestidad": "Ningún número sin artefacto; multi-semilla obligatorio; fallos/colapsos se reportan; "
                          "SAC-pure y SAC-critic-hybrid separados; WM = Dyna-Q cinemático, no simulador."},
    }
    h = hashlib.sha256(json.dumps(proto, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16]
    proto["frozen_hash"] = h
    with open(FROZEN_PATH, "w") as f: json.dump(proto, f, indent=2, ensure_ascii=False)
    return proto

# ---------------------------------------------------------------------------
#  Currículo + evaluación
# ---------------------------------------------------------------------------
TIERS = [16, 36, 60, NUM]
def subset(levels, cap):
    s = [m for m in levels if m[2] <= cap]
    return s if s else levels

def _eval_metrics(algo, levels, vcfg, episodes_per_level=3, eval_seed=777):
    """Evalúa GREEDY sobre 'levels' (entorno i = nivel i, varios episodios/nivel) y
    devuelve TODAS las métricas de §6.1 más la matriz de heatmap de ladrillos rotos."""
    n = len(levels)
    env = VecArkanoid(n, levels, seed=eval_seed, fixed=True,
                      shaping=vcfg["shaping"], timeout_mode=vcfg["timeout_mode"])
    counts = np.zeros(n, int); recs = []
    cap_steps = (MAXP if vcfg["timeout_mode"] is None else 7200) * episodes_per_level + 2000
    g = 0
    while counts.min() < episodes_per_level and g < cap_steps:
        g += 1
        a = algo.eval_act(env.state(vcfg["scale"]))
        env.step(a)
        for e in env.last_eps:
            i = e["env"]
            if counts[i] < episodes_per_level:
                counts[i] += 1; recs.append(e)
    won = np.array([r["won"] for r in recs], bool)
    broken = np.array([r["broken"] for r in recs], np.float32)
    ini = np.array([r["ini"] for r in recs], np.float32)
    steps = np.array([r["steps"] for r in recs], np.float32)
    cause = [r["cause"] for r in recs]
    rtask = np.array([r["reward_task"] for r in recs], np.float32)
    fracs = broken / np.maximum(1, ini)
    # buckets por nº de ladrillos del nivel
    buckets = {"10-20": (10, 20), "20-40": (20, 40), "40-60": (40, 60), "60-80": (60, 80)}
    by_bucket = {}
    for name, (lo, hi) in buckets.items():
        sel = (ini > lo) & (ini <= hi) if name != "10-20" else (ini >= lo) & (ini <= hi)
        by_bucket[name] = {"success_rate": float(won[sel].mean()) if sel.any() else None,
                           "n": int(sel.sum())}
    heat = np.zeros(NUM, np.float32)
    for r in recs: heat += r["broken_pos"]
    return {
        "success_rate": float(won.mean()) if len(won) else 0.0,
        "success_by_bricks_bucket": by_bucket,
        "bricks_cleared_mean": float(broken.mean()) if len(broken) else 0.0,
        "bricks_cleared_median": float(np.median(broken)) if len(broken) else 0.0,
        "bricks_cleared_frac_mean": float(fracs.mean()) if len(fracs) else 0.0,
        "steps_to_clear": float(steps[won].mean()) if won.any() else None,
        "death_rate": float(np.mean([c == "lost" for c in cause])) if cause else 0.0,
        "timeout_rate": float(np.mean([c == "timeout" for c in cause])) if cause else 0.0,
        "reward_no_shaping": float(rtask.mean()) if len(rtask) else 0.0,
        "n_episodes": int(len(recs)), "n_levels": int(n),
        "_heatmap": heat,
    }

def _quick_eval(algo, levels, vcfg, n=24):
    """Señal de progreso barata para la curva (1 episodio en <=n niveles)."""
    lv = levels[:n] if len(levels) > n else levels
    env = VecArkanoid(len(lv), lv, seed=4242, fixed=True,
                      shaping=vcfg["shaping"], timeout_mode=vcfg["timeout_mode"])
    counts = np.zeros(len(lv), int); won = 0; tot = 0
    cap = (MAXP if vcfg["timeout_mode"] is None else 7200) + 2000; g = 0
    while counts.min() < 1 and g < cap:
        g += 1; env.step(algo.eval_act(env.state(vcfg["scale"])))
        for e in env.last_eps:
            i = e["env"]
            if counts[i] < 1: counts[i] += 1; won += int(e["won"]); tot += 1
    return won / max(1, tot)

# ---------------------------------------------------------------------------
#  A3 — entrenamiento con curva (off-policy y PPO)
# ---------------------------------------------------------------------------
def _train_offpolicy(algo, train, budget, vcfg, curve, curve_eval, curve_every):
    if vcfg["curriculum"]:
        tier = 0; cap = TIERS[0]; masks = subset(train, cap)
    else:
        tier = len(TIERS) - 1; cap = NUM; masks = train
    env = VecArkanoid(algo.envs, masks, seed=1000 + curve_eval["seed"],
                      shaping=vcfg["shaping"], timeout_mode=vcfg["timeout_mode"])
    succ = []; steps = 0; tsteps = 0; next_c = 0; t0 = time.time()
    while steps < budget:
        s = env.state(vcfg["scale"]); a = algo.act(s, train=True, frac=steps)
        s2, r, done, info = env.step(a)
        algo.buf.add(s, a, r, s2, done.astype(np.float32)); steps += algo.envs
        for w, *_ in info: succ.append(1 if w else 0)
        if len(succ) > 200: succ = succ[-200:]
        algo.learn(steps)
        if vcfg["curriculum"]:
            tsteps += algo.envs; sr = np.mean(succ) if succ else 0
            if tier < len(TIERS) - 1 and ((sr >= 0.7 and len(succ) >= 100) or tsteps >= 500_000):
                tier += 1; cap = TIERS[tier]; tsteps = 0; env.set_masks(subset(train, cap))
        if steps >= next_c:
            curve.append((steps, _quick_eval(algo, curve_eval["levels"], vcfg))); next_c += curve_every
    curve.append((steps, _quick_eval(algo, curve_eval["levels"], vcfg)))
    return time.time() - t0

def _train_ppo(algo, train, budget, vcfg, curve, curve_eval, curve_every):
    tier = 0 if vcfg["curriculum"] else len(TIERS) - 1
    cap = TIERS[tier]; N = algo.envs
    env = VecArkanoid(N, subset(train, cap) if vcfg["curriculum"] else train,
                      seed=1000 + curve_eval["seed"], shaping=vcfg["shaping"], timeout_mode=vcfg["timeout_mode"])
    succ = []; steps = 0; tsteps = 0; next_c = 0; t0 = time.time()
    F = torch.nn.functional
    while steps < budget:
        S, Aa, LP, R, D, Vv = [], [], [], [], [], []
        for _ in range(algo.L):
            s = env.state(vcfg["scale"]); st = C.tens(s)
            with torch.no_grad():
                logits = algo.actor(st); p = F.softmax(logits, 1)
                a = torch.multinomial(p, 1).squeeze(1)
                lp = F.log_softmax(logits, 1).gather(1, a.unsqueeze(1)).squeeze(1)
                v = algo.critic(st).squeeze(1)
            an = a.cpu().numpy().astype(np.int64)
            s2, r, done, info = env.step(an)
            S.append(s); Aa.append(an); LP.append(lp.cpu().numpy()); R.append(r)
            D.append(done.astype(np.float32)); Vv.append(v.cpu().numpy()); steps += N
            for w, *_ in info: succ.append(1 if w else 0)
        if len(succ) > 400: succ = succ[-400:]
        with torch.no_grad(): lastv = algo.critic(C.tens(env.state(vcfg["scale"]))).squeeze(1).cpu().numpy()
        S = np.array(S); Aa = np.array(Aa); LP = np.array(LP); R = np.array(R); D = np.array(D); Vv = np.array(Vv)
        adv = np.zeros_like(R); gae = np.zeros(N, np.float32)
        for t in range(algo.L - 1, -1, -1):
            nextv = lastv if t == algo.L - 1 else Vv[t + 1]
            delta = R[t] + 0.99 * nextv * (1 - D[t]) - Vv[t]
            gae = delta + 0.99 * 0.95 * (1 - D[t]) * gae; adv[t] = gae
        ret = adv + Vv
        bs = C.tens(S.reshape(-1, DIM)); ba = C.tens(Aa.reshape(-1)); blp = C.tens(LP.reshape(-1))
        badv = C.tens(adv.reshape(-1)); bret = C.tens(ret.reshape(-1))
        badv = (badv - badv.mean()) / (badv.std() + 1e-8); M = bs.shape[0]
        for _ in range(4):
            idx = torch.randperm(M, device=A.DEV)
            for j in range(0, M, 1024):
                k = idx[j:j + 1024]
                logits = algo.actor(bs[k]); lp = F.log_softmax(logits, 1).gather(1, ba[k].unsqueeze(1)).squeeze(1)
                ratio = (lp - blp[k]).exp()
                s1 = ratio * badv[k]; s2c = ratio.clamp(0.8, 1.2) * badv[k]
                lpol = -torch.min(s1, s2c).mean()
                ent = -(F.softmax(logits, 1) * F.log_softmax(logits, 1)).sum(1).mean()
                vv = algo.critic(bs[k]).squeeze(1); lval = F.mse_loss(vv, bret[k])
                loss = lpol + 0.5 * lval - 0.003 * ent
                algo.opt.zero_grad(); loss.backward(); algo.opt.step()
        if vcfg["curriculum"]:
            tsteps += algo.L * N; sr = np.mean(succ) if succ else 0
            if tier < len(TIERS) - 1 and ((sr >= 0.7 and len(succ) >= 100) or tsteps >= 500_000):
                tier += 1; cap = TIERS[tier]; tsteps = 0; env.set_masks(subset(train, cap))
        if steps >= next_c:
            curve.append((steps, _quick_eval(algo, curve_eval["levels"], vcfg))); next_c += curve_every
    curve.append((steps, _quick_eval(algo, curve_eval["levels"], vcfg)))
    return time.time() - t0

# ---------------------------------------------------------------------------
#  train_run: entrena una semilla -> checkpoint + curva CSV + .config.json (A3,A4)
# ---------------------------------------------------------------------------
def train_run(model, variant, seed, budget, curve_every=None):
    ensure_dirs()
    vcfg = variant_cfg(variant)
    pool, train, val, test = L.train_split()
    seed_all(seed)
    algo = build_model(model, vcfg)
    curve_every = curve_every or max(budget // 12, 1)
    curve = []; ce = {"levels": val, "seed": seed}
    if hasattr(algo, "run"):  # PPO (on-policy)
        dt = _train_ppo(algo, train, budget, vcfg, curve, ce, curve_every)
    else:
        dt = _train_offpolicy(algo, train, budget, vcfg, curve, ce, curve_every)
    rid = run_id(model, variant, budget, seed)
    cpath = ckpt_path(model, variant, budget, seed); save_ckpt(algo, cpath)
    # curva CSV
    curve_path = os.path.join(DIRS["curves"], f"{rid}.csv")
    with open(curve_path, "w", newline="") as f:
        w = csv.writer(f); w.writerow(["step", "success_rate_eval"]); w.writerows(curve)
    # manifiesto de reproducibilidad
    cfg = {"model": model, "variant": variant, "budget": budget, "seed": seed,
           "recipe": vcfg, "tiers": TIERS, "envs": algo.envs, "framework": framework(),
           "git_commit": git_commit(), "generator": {"pool_n": 400, "pool_seed": 12345,
           "split_seed": 999, "train": len(train), "val": len(val), "test_id_base": len(test)},
           "device": A.DEV.type}
    chash = config_hash(cfg); cfg["config_hash"] = chash
    if os.path.exists(FROZEN_PATH):  # toda run referencia el hash del protocolo congelado
        try: cfg["frozen_hash"] = json.load(open(FROZEN_PATH)).get("frozen_hash")
        except Exception: cfg["frozen_hash"] = None
    cfg_path = os.path.join(DIRS["runs"], f"{rid}.config.json")
    with open(cfg_path, "w") as f: json.dump(cfg, f, indent=2, ensure_ascii=False)
    return {"run_id": rid, "ckpt": cpath, "config_path": cfg_path, "curve_path": curve_path,
            "config_hash": chash, "train_seconds": dt, "vcfg": vcfg}

# ---------------------------------------------------------------------------
#  A1 — eval_run: carga checkpoint, evalúa greedy en un test_set, guarda JSON+PNG
# ---------------------------------------------------------------------------
def eval_run(model, variant, seed, test_set, budget, episodes_per_level=3):
    ensure_dirs()
    vcfg = variant_cfg(variant)
    if test_set == "train":
        _, levels, _, _ = L.train_split()  # 'train' usa val como proxy de niveles vistos (rápido)
    else:
        levels = _load_set(test_set)
    seed_all(seed)  # construir la red con la MISMA init que en train (los pesos se sobrescriben al cargar)
    algo = build_model(model, vcfg)
    load_ckpt(algo, ckpt_path(model, variant, budget, seed))
    m = _eval_metrics(algo, levels, vcfg, episodes_per_level=episodes_per_level)
    heat = m.pop("_heatmap")
    rid = run_id(model, variant, budget, seed)
    base = f"{model}_{variant}_seed{seed}_{test_set}"
    heat_path = os.path.join(DIRS["heatmaps"], base + ".png")
    _save_heatmap(heat.reshape(FILAS, COLS), heat_path,
                  f"{model} · {variant} · seed{seed} · {test_set}\nladrillos rotos (greedy, {m['n_episodes']} eps)")
    out = {"model": model, "variant": variant, "seed": seed, "budget": budget,
           "test_set": test_set, "framework": framework(), "git_commit": git_commit(),
           "eval": "greedy", "episodes_per_level": episodes_per_level,
           "heatmap_path": os.path.relpath(heat_path, ROOT), **m}
    json_path = os.path.join(DIRS["runs"], base + ".json")
    with open(json_path, "w") as f: json.dump(out, f, indent=2, ensure_ascii=False)
    out["_json_path"] = json_path
    return out

def _save_heatmap(mat, path, title):
    fig, ax = plt.subplots(figsize=(5, 4))
    im = ax.imshow(mat, cmap="hot", aspect="auto")
    ax.set_title(title, fontsize=8); ax.set_xlabel("columna"); ax.set_ylabel("fila")
    fig.colorbar(im, ax=ax, label="nº rupturas")
    fig.tight_layout(); fig.savefig(path, dpi=90); plt.close(fig)

# ---------------------------------------------------------------------------
#  A5 — ledger append-only
# ---------------------------------------------------------------------------
def ledger_append(row):
    ensure_dirs(); new = not os.path.exists(LEDGER)
    with open(LEDGER, "a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=LEDGER_COLS)
        if new: w.writeheader()
        w.writerow({c: row.get(c, "") for c in LEDGER_COLS})

# ---------------------------------------------------------------------------
#  run_seed: entrena + evalúa los 3 bloques + train + escribe fila de ledger
# ---------------------------------------------------------------------------
def run_seed(model, variant, seed, budget, episodes_per_level=3, collapse_thr=0.10):
    if not test_sets_exist():
        raise RuntimeError("no existen los test sets. Ejecuta primero: python3 gpu/lab.py testsets")
    tr = train_run(model, variant, seed, budget)
    ev = {ts: eval_run(model, variant, seed, ts, budget, episodes_per_level) for ts in TEST_NAMES}
    ev_train = eval_run(model, variant, seed, "train", budget, max(1, episodes_per_level - 1))
    s_id = ev["test_id"]["success_rate"]
    row = {"run_id": tr["run_id"], "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
           "model": model, "variant": variant, "framework": framework(), "seed": seed, "budget": budget,
           "config_hash": tr["config_hash"], "git_commit": git_commit(),
           "success_test_id": round(s_id, 4),
           "success_test_ood_pattern": round(ev["test_ood_pattern"]["success_rate"], 4),
           "success_test_ood_diff": round(ev["test_ood_diff"]["success_rate"], 4),
           "success_train": round(ev_train["success_rate"], 4),
           "bricks_cleared_median": round(ev["test_id"]["bricks_cleared_median"], 2),
           "steps_to_clear": ("" if ev["test_id"]["steps_to_clear"] is None
                              else round(ev["test_id"]["steps_to_clear"], 1)),
           "death_rate": round(ev["test_id"]["death_rate"], 4),
           "reward_no_shaping": round(ev["test_id"]["reward_no_shaping"], 4),
           "collapsed": bool(s_id < collapse_thr), "status": "done",
           "config_path": os.path.relpath(tr["config_path"], ROOT),
           "metrics_path": os.path.relpath(ev["test_id"]["_json_path"], ROOT),
           "heatmap_path": ev["test_id"]["heatmap_path"],
           "curve_path": os.path.relpath(tr["curve_path"], ROOT)}
    ledger_append(row)
    return {"row": row, "eval": ev, "eval_train": ev_train, "train": tr}

# ---------------------------------------------------------------------------
#  A2 — run_multiseed: agrega sobre semillas + plot de curvas (A3)
# ---------------------------------------------------------------------------
def _agg(vals, collapse_thr=0.10):
    a = np.array(vals, np.float64)
    if len(a) == 0: return {}
    ic = 1.96 * a.std(ddof=1) / np.sqrt(len(a)) if len(a) > 1 else 0.0
    return {"mean": float(a.mean()), "median": float(np.median(a)), "std": float(a.std(ddof=1) if len(a) > 1 else 0.0),
            "min": float(a.min()), "max": float(a.max()), "ic95": [float(a.mean() - ic), float(a.mean() + ic)],
            "collapse_rate": float(np.mean(a < collapse_thr)), "pct_seeds_gt80": float(np.mean(a >= 0.80)),
            "n_seeds": int(len(a)), "values": [round(float(x), 4) for x in a]}

def run_multiseed(model, variant, budget, seeds, episodes_per_level=3, collapse_thr=0.10):
    ensure_dirs()
    results = [run_seed(model, variant, s, budget, episodes_per_level, collapse_thr) for s in seeds]
    blocks = {}
    for key in ["success_test_id", "success_test_ood_pattern", "success_test_ood_diff", "success_train"]:
        blocks[key] = _agg([r["row"][key] for r in results], collapse_thr)
    agg = {"model": model, "variant": variant, "budget": budget, "seeds": seeds,
           "framework": framework(), "git_commit": git_commit(),
           "collapse_threshold": collapse_thr, "blocks": blocks,
           "config_hash": results[0]["train"]["config_hash"]}
    apath = os.path.join(DIRS["aggregate"], f"{model}_{variant}_{budget}.json")
    with open(apath, "w") as f: json.dump(agg, f, indent=2, ensure_ascii=False)
    _plot_curves(model, variant, budget, seeds)
    agg["_path"] = apath
    return agg

def _plot_curves(model, variant, budget, seeds):
    fig, ax = plt.subplots(figsize=(6, 4)); allc = []
    for s in seeds:
        p = os.path.join(DIRS["curves"], f"{run_id(model, variant, budget, s)}.csv")
        if not os.path.exists(p): continue
        d = np.genfromtxt(p, delimiter=",", names=True)
        st = np.atleast_1d(d["step"]); sr = np.atleast_1d(d["success_rate_eval"])
        ax.plot(st, sr, alpha=0.35, lw=1)
        allc.append((st, sr))
    if allc:
        L_ = min(len(sr) for _, sr in allc)
        st0 = allc[0][0][:L_]; M = np.stack([sr[:L_] for _, sr in allc])
        ax.plot(st0, M.mean(0), color="black", lw=2, label="media")
        ax.fill_between(st0, M.mean(0) - M.std(0), M.mean(0) + M.std(0), alpha=0.2, color="gray")
        ax.legend()
    ax.set_title(f"curva de aprendizaje · {model} · {variant} · {budget}")
    ax.set_xlabel("pasos"); ax.set_ylabel("success_rate (eval rápida)"); ax.set_ylim(-0.02, 1.02)
    fig.tight_layout(); fig.savefig(os.path.join(DIRS["plots"], f"curve_{model}_{variant}_{budget}.png"), dpi=90)
    plt.close(fig)

# ---------------------------------------------------------------------------
#  CLI
# ---------------------------------------------------------------------------
def _cmd_testsets(argv):
    n = [int(x) for x in argv] if argv else []
    n_id, n_pat, n_dif = (n + [150, 100, 100])[:3]
    print(f"Construyendo test sets (id={n_id}, ood_pat={n_pat}, ood_dif={n_dif}) + limpiabilidad…", flush=True)
    rep = build_test_sets(n_id, n_pat, n_dif)
    print(json.dumps(rep, indent=2, ensure_ascii=False))

def _cmd_smoke(argv):
    """PUERTA A: demostración mínima de A1–A6 sobre runs de prueba (presupuesto pequeño)."""
    budget = int(argv[0]) if argv else 120_000
    if not test_sets_exist():
        print("· test sets no existen → construyéndolos (tamaño reducido para la demo)…", flush=True)
        build_test_sets(80, 60, 60)
    print(f"\n===== SMOKE / PUERTA A · device={A.DEV} · budget={budget} =====", flush=True)
    print("A2 multi-semilla DQN (3 semillas) — demuestra agregado, colapso y curvas:", flush=True)
    agg = run_multiseed("dqn", "base", budget, [0, 1, 2], episodes_per_level=2)
    b = agg["blocks"]["success_test_id"]
    print(f"  DQN TEST-ID: mean={b['mean']*100:.0f}% median={b['median']*100:.0f}% "
          f"std={b['std']*100:.0f} min={b['min']*100:.0f} max={b['max']*100:.0f} "
          f"collapse={b['collapse_rate']*100:.0f}% >80%={b['pct_seeds_gt80']*100:.0f}%", flush=True)
    print("PPO 1 semilla — demuestra la vía on-policy del harness:", flush=True)
    r = run_seed("ppo", "base", 0, budget, episodes_per_level=2)
    print(f"  PPO seed0: TEST-ID {r['row']['success_test_id']*100:.0f}% · "
          f"OOD-pat {r['row']['success_test_ood_pattern']*100:.0f}% · "
          f"OOD-dif {r['row']['success_test_ood_diff']*100:.0f}%", flush=True)
    print(f"\nLedger: {os.path.relpath(LEDGER, ROOT)} ({sum(1 for _ in open(LEDGER))-1} filas)", flush=True)
    print("PUERTA A: artefactos en results/ — revisa antes de Fase B.", flush=True)

def main():
    if len(sys.argv) < 2:
        print(__doc__); return
    cmd = sys.argv[1]; argv = sys.argv[2:]
    if cmd == "testsets": _cmd_testsets(argv)
    elif cmd == "freeze":
        proto = freeze()
        print(json.dumps(proto, indent=2, ensure_ascii=False))
    elif cmd == "smoke": _cmd_smoke(argv)
    elif cmd == "multiseed":
        model = argv[0]; budget = int(argv[1]); seeds = [int(x) for x in argv[2:]]
        agg = run_multiseed(model, "base", budget, seeds)
        print(json.dumps({k: v for k, v in agg.items() if k != "blocks"}, indent=2, ensure_ascii=False))
        print(json.dumps(agg["blocks"], indent=2, ensure_ascii=False))
    else:
        print(f"comando desconocido: {cmd}\n{__doc__}")

if __name__ == "__main__":
    main()
