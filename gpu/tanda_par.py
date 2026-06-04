#!/usr/bin/env python3
# ============================================================================
#  TANDA PARALELA — runner genérico de runs (model, variant, budget, seed) con
#  hasta K unidades a la vez, para exprimir el M3 Ultra (env=CPU/numpy, red=GPU/MPS:
#  1 run infrautiliza ambos; ~24 concurrentes maximizan throughput — medido en
#  bench_concurrency.py). Lo usan C6 (variant=base, 5 modelos) y C2/C3/C4 (variantes).
#  ---------------------------------------------------------------------------
#  Honesto: NO toca hiperparámetros. Cada unidad es un proceso aislado (`lab.py
#  runseed`) con su MPS/RNG -> resultado idéntico a correrla sola; solo cambia el
#  wall-clock. Ledger seguro entre procesos (lock en lab.ledger_upsert). Resumible
#  (salta ckpt + 4 JSON de eval con su budget/variant). Agrega por (model,variant,
#  budget) desde artefactos (run_multiseed) y dibuja curvas. Single-process -> sin carreras.
#
#    python3 gpu/tanda_par.py [budgets] [models] [variants]
#      tanda_par.py                                  -> C6: budgets×MODELS_C6×base
#      tanda_par.py 1500000 dqn flat,branches        -> C2: dqn × {flat,branches} @1.5M
#    TANDA_K=24 python3 gpu/tanda_par.py             -> nº runs concurrentes (def. 24)
# ============================================================================
import sys, os, json, time, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lab

K = int(os.environ.get("TANDA_K", "24"))
THREAD_CAPS = {k: "1" for k in ["OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS",
                                "VECLIB_MAXIMUM_THREADS", "NUMEXPR_NUM_THREADS"]}

def is_done(m, v, b, s):
    """Misma condición que el skip de lab.run_seed: ckpt + 4 JSON de eval (con budget+variant)."""
    ck = lab.ckpt_path(m, v, b, s)
    js = [os.path.join(lab.DIRS["runs"], f"{m}_{v}_b{b}_seed{s}_{ts}.json")
          for ts in lab.TEST_NAMES + ["train"]]
    return os.path.exists(ck) and all(os.path.exists(j) for j in js)

def main():
    proto = json.load(open(lab.FROZEN_PATH))
    seeds = proto["seeds"]
    budgets = [int(x) for x in sys.argv[1].split(",")] if len(sys.argv) > 1 else proto["budgets"]
    models = sys.argv[2].split(",") if len(sys.argv) > 2 else lab.MODELS_C6
    variants = sys.argv[3].split(",") if len(sys.argv) > 3 else ["base"]
    lab.ensure_dirs()

    units = [(m, v, b, s) for b in budgets for m in models for v in variants for s in seeds]
    todo = [u for u in units if not is_done(*u)]
    print(f"=== TANDA PARALELA · device={lab.A.DEV} · K={K} · frozen={proto.get('frozen_hash')} ===", flush=True)
    print(f"{len(models)} modelos × {len(variants)} variantes × {len(seeds)} semillas × {len(budgets)} presup. "
          f"= {len(units)} runs · ya hechas {len(units)-len(todo)} · por hacer {len(todo)}", flush=True)
    print(f"  modelos={models} · variantes={variants} · budgets={[b//1000 for b in budgets]}k\n", flush=True)

    env = {**os.environ, **THREAD_CAPS, "PYTORCH_ENABLE_MPS_FALLBACK": "1"}
    py = sys.executable; me = lab.__file__
    running = {}; qi = 0; done = 0; fails = []; collapses = []
    t_all = time.time()
    while qi < len(todo) or running:
        while qi < len(todo) and len(running) < K:
            m, v, b, s = todo[qi]; qi += 1
            p = subprocess.Popen([py, me, "runseed", m, str(b), str(s), v],
                                 stdout=subprocess.PIPE, stderr=subprocess.STDOUT, env=env)
            running[p] = ((m, v, b, s), time.time())
        time.sleep(0.3)
        for p in list(running):
            if p.poll() is None:
                continue
            (m, v, b, s), t0 = running.pop(p)
            out = (p.stdout.read() or b"").decode(errors="replace").strip()
            dt = time.time() - t0; done += 1
            status = [l for l in out.splitlines() if l.startswith(("DONE", "SKIP"))]
            ok = p.returncode == 0 and bool(status)
            last = status[-1] if status else (out.splitlines()[-1] if out else "(sin salida)")
            if not ok:
                fails.append((m, v, b, s, out[-500:]))
            elif "collapsed=True" in last:
                collapses.append((m, v, b, s, last))
            el = time.time() - t_all; rate = done / el if el > 0 else 0
            eta = (len(todo) - done) / rate / 60 if rate > 0 else 0
            print(f"[{done}/{len(todo)}] {'OK ' if ok else 'XXX'} {m}/{v} @{b//1000}k s{s} · {dt:4.0f}s · "
                  f"{last[:80]} · {el/60:.1f}m ETA~{eta:.0f}m", flush=True)

    print(f"\n--- entrenamiento+eval: {(time.time()-t_all)/60:.1f} min ---", flush=True)
    if fails:
        print(f"⚠ {len(fails)} FALLOS (diagnosticar):", flush=True)
        for m, v, b, s, tail in fails:
            print(f"  ---- {m}/{v} @{b//1000}k s{s} ----\n{tail}\n", flush=True)
    if collapses:
        print(f"⚠ {len(collapses)} COLAPSOS (<{proto['collapse_threshold']*100:.0f}% TEST-ID):", flush=True)
        for m, v, b, s, last in collapses:
            print(f"  {m}/{v} @{b//1000}k s{s} · {last}", flush=True)

    print("\n=== agregados + curvas (desde artefactos) ===", flush=True)
    for b in budgets:
        for m in models:
            for v in variants:
                try:
                    agg = lab.run_multiseed(m, v, b, seeds, collapse_thr=proto["collapse_threshold"])
                    blk = agg["blocks"]["success_test_id"]
                    print(f"  {m}/{v:<20} @{b//1000}k · TEST-ID mean={blk['mean']*100:4.0f}% med={blk['median']*100:4.0f}% "
                          f"min={blk['min']*100:3.0f}% max={blk['max']*100:3.0f}% collapse={blk['collapse_rate']*100:3.0f}% "
                          f">80={blk['pct_seeds_gt80']*100:3.0f}%", flush=True)
                except Exception as e:
                    print(f"  {m}/{v} @{b//1000}k · ERROR agregando: {e}", flush=True)

    nled = (sum(1 for _ in open(lab.LEDGER)) - 1) if os.path.exists(lab.LEDGER) else 0
    print(f"\nTANDA en {(time.time()-t_all)/60:.1f} min · ledger {nled} filas · "
          f"{('sin fallos' if not fails else str(len(fails))+' FALLOS')} · {len(collapses)} colapsos", flush=True)

if __name__ == "__main__":
    main()
