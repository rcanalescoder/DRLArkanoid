#!/usr/bin/env python3
# ============================================================================
#  Benchmark de THROUGHPUT — ¿cuántos entrenamientos concurrentes aprovechan
#  mejor esta máquina (M3 Ultra: 80 GPU cores / 32 CPU)?
#  ---------------------------------------------------------------------------
#  NO escribe NINGÚN artefacto del protocolo. Es una medición de ingeniería para
#  dimensionar la concurrencia de la tanda paralela. El entorno Arkanoid es
#  numpy/CPU y la red es MPS/GPU: una sola run infrautiliza ambos, así que correr
#  K runs a la vez debería multiplicar el throughput SIN cambiar ningún número
#  (cada proceso es independiente y mantiene su config congelada).
#
#  Usa el MISMO modelo (comparativa_mps.DQN) y bucle (run_offpolicy) que la tanda,
#  así que el coste por paso es representativo de las runs reales DQN/SAC (256 envs).
#
#    worker:   python gpu/bench_concurrency.py worker <steps>
#    launcher: python gpu/bench_concurrency.py <steps> <N1> <N2> ...
# ============================================================================
import sys, os, json, time, subprocess

def worker(steps):
    import torch
    torch.set_num_threads(1)                       # 1 core CPU por worker -> escalado limpio
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import comparativa_mps as C
    from arkanoid_mps import gen_pool, split_pool
    pool = gen_pool(400); train, _, _ = split_pool(pool)
    algo = C.DQN()
    t0 = time.time()
    C.run_offpolicy(algo, train, steps, algo.envs)  # entrena, NO escribe nada
    dt = time.time() - t0
    print(json.dumps({"steps": steps, "sec": dt}))

def launch(steps, levels):
    # Limitar hilos BLAS/torch por worker evita sobre-suscripción de los 32 cores
    # (no cambia resultados: RNG y física numpy son deterministas con cualquier nº de hilos).
    thr = {k: "1" for k in ["OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS",
                            "VECLIB_MAXIMUM_THREADS", "NUMEXPR_NUM_THREADS"]}
    env = {**os.environ, **thr, "PYTORCH_ENABLE_MPS_FALLBACK": "1"}
    me = os.path.abspath(__file__); py = sys.executable
    print(f"steps/worker={steps}  ·  midiendo escalado de concurrencia en MPS\n")
    print(f"{'N':>3} | {'agg exp/s':>11} | {'per-run exp/s':>13} | {'loop s (max)':>12} | {'efic/N=1':>8}")
    print("-" * 64)
    base_per = None
    for N in levels:
        procs = [subprocess.Popen([py, me, "worker", str(steps)],
                                  stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, env=env)
                 for _ in range(N)]
        outs = [p.communicate()[0] for p in procs]
        recs = []
        for o in outs:
            line = o.decode().strip().splitlines()[-1] if o.strip() else "{}"
            recs.append(json.loads(line))
        secs = [r["sec"] for r in recs if "sec" in r]
        if len(secs) < N:
            print(f"{N:>3} | FALLO: solo {len(secs)}/{N} workers devolvieron resultado")
            continue
        loop = max(secs)                            # throughput agregado = trabajo total / tiempo del más lento
        agg = sum(r["steps"] for r in recs) / loop
        per = agg / N
        if base_per is None: base_per = per
        print(f"{N:>3} | {agg:>11.0f} | {per:>13.0f} | {loop:>12.1f} | {per/base_per*100:>7.0f}%", flush=True)

if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "worker":
        worker(int(sys.argv[2]))
    else:
        steps = int(sys.argv[1]) if len(sys.argv) > 1 else 200_000
        levels = [int(x) for x in sys.argv[2:]] if len(sys.argv) > 2 else [1, 8, 16, 24, 32]
        launch(steps, levels)
