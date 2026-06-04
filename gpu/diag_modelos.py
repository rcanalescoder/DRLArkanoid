#!/usr/bin/env python3
# Diagnóstico: ¿por qué SAC y los World Models sacan 1%? (en GPU/MPS)
#  - WM plan=0 (Q-net solo con transiciones REALES) vs plan=5 (con imaginación):
#    si plan=0 aprende y plan=5 no → la imaginación (dinámica pobre) los envenena.
#  - SAC ×2 semillas: confirmar la inestabilidad (colapsa vs converge).
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import comparativa_mps as C

P = 700_000
pool = C.gen_pool(400); train, val, test = C.split_pool(pool)
print(f"=== DIAG modelos · {C.DEV} · {P} pasos/trial ===", flush=True)

def trial(name, algo):
    dt = C.run_offpolicy(algo, train, P, algo.envs)
    s, p = C.evaluate(algo.eval_act, test)
    print(f"{name:<26} TEST {s*100:3.0f}% · %ladr {p*100:3.0f}% · {dt:.0f}s", flush=True)

trial("WM", C.WorldModel())
trial("WM-RNN", C.WorldModelRNN())
trial("SAC semilla A", C.SAC())
trial("SAC semilla B", C.SAC())
trial("SAC semilla C", C.SAC())
trial("SAC semilla D", C.SAC())
