#!/usr/bin/env python3
# ============================================================================
#  Arkanoid DRL en la GPU (Apple Metal / MPS) — port de la MISMA tarea del lab JS
#  Entorno Arkanoid 8x10 VECTORIZADO en numpy (N entornos en paralelo, CPU) +
#  DQN con encoder CONVOLUCIONAL y rama cinematica en PyTorch sobre device='mps'
#  (la GPU del M4 Max). Replica Fase 2b: vision de ladrillos (matriz 8x10),
#  niveles procedurales con splits train/test y curriculo facil->dificil.
#  Objetivo: usar la GPU de verdad y reproducir la generalizacion (success_rate
#  en test sobre niveles no vistos).
#    Uso:  python3 gpu/arkanoid_mps.py [pasos] [envs]
# ============================================================================
import sys, time, math
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

# --- Dispositivo: MPS (GPU Metal) si esta disponible ------------------------
DEV = torch.device("mps" if torch.backends.mps.is_available()
                    else "cuda" if torch.cuda.is_available() else "cpu")

# --- Geometria / fisica (identicas al entorno JS) ---------------------------
FILAS, COLS = 8, 10
NUM = FILAS * COLS                      # 80
V = 0.022                               # VELOCIDAD_PELOTA
R = 0.018                               # RADIO_PELOTA
ANCHO_PALA, ALTO_PALA = 0.22, 0.025
VEL_PALA = 0.040
YPALA = 0.92                            # POSICION_PALA_Y
FACTOR = 0.9                            # FACTOR_REBOTE
MARGEN_X, TOPE, ALTO_L, ESPACIO = 0.06, 0.09, 0.045, 0.012
ANCHO_L = (1 - MARGEN_X * 2 - ESPACIO * (COLS - 1)) / COLS
MAXP = 90 * NUM                         # timeout = 90 por ladrillo (7200)
DIM = 6 + NUM                           # estado plano: 6 cinematica + 80 ocupacion

# posicion (x,y) de cada celda de ladrillo (fila-mayor), igual que el JS
_LX = np.array([MARGEN_X + (i % COLS) * (ANCHO_L + ESPACIO) for i in range(NUM)], dtype=np.float32)
_LY = np.array([TOPE + (i // COLS) * (ALTO_L + ESPACIO) for i in range(NUM)], dtype=np.float32)

# ---------------------------------------------------------------------------
#  Generador de niveles (familias) + splits — equivalente a generadorNiveles.js
# ---------------------------------------------------------------------------
def _rng(seed): return np.random.default_rng(seed)

def gen_pool(n=400, seed=12345):
    rng = _rng(seed); fams = ["dispersion", "filas", "columnas", "bloque", "simetrico"]
    seen, pool = set(), []
    while len(pool) < n and len(seen) < n * 60:
        fam = fams[rng.integers(len(fams))]
        m = np.zeros(NUM, dtype=np.float32)
        if fam == "dispersion":
            p = 0.2 + rng.random() * 0.5
            m = (rng.random(NUM) < p).astype(np.float32)
        elif fam == "filas":
            for f in rng.permutation(FILAS)[: 1 + rng.integers(FILAS)]:
                m[f * COLS:(f + 1) * COLS] = 1
        elif fam == "columnas":
            for c in rng.permutation(COLS)[: 1 + rng.integers(COLS)]:
                m[c::COLS] = 1
        elif fam == "bloque":
            f0, c0 = rng.integers(FILAS), rng.integers(COLS)
            f1, c1 = f0 + 1 + rng.integers(FILAS - f0), c0 + 1 + rng.integers(COLS - c0)
            for f in range(f0, f1):
                for c in range(c0, c1): m[f * COLS + c] = 1
        else:  # simetrico
            half = (COLS + 1) // 2
            for f in range(FILAS):
                for c in range(half):
                    if rng.random() < 0.5: m[f * COLS + c] = 1; m[f * COLS + (COLS - 1 - c)] = 1
        if m.sum() < 1: continue
        key = m.tobytes()
        if key in seen: continue
        seen.add(key); pool.append((m, fam, int(m.sum())))
    return pool

def split_pool(pool, seed=999):
    idx = _rng(seed).permutation(len(pool))
    n_tr = int(len(pool) * 0.7); n_va = int(len(pool) * 0.15)
    take = lambda a, b: [pool[i] for i in idx[a:b]]
    return take(0, n_tr), take(n_tr, n_tr + n_va), take(n_tr + n_va, len(pool))

# ---------------------------------------------------------------------------
#  Entorno Arkanoid VECTORIZADO (N entornos, numpy) — misma fisica que el JS
# ---------------------------------------------------------------------------
class VecArkanoid:
    # Hooks opcionales (todos con el comportamiento ACTUAL por defecto, para no romper
    # los scripts existentes ni la reproducibilidad de las runs ya hechas):
    #   shaping=True      -> recompensa +0.2 por devolver la bola (la 'r' de tarea NUNCA la incluye)
    #   timeout_mode=None -> timeout constante MAXP (7200); "prop" -> 90*ladrillos del nivel; int -> constante
    #   fixed=False       -> cada reset elige una máscara al azar; True -> el entorno i usa SIEMPRE masks[i]
    # Además registra, sin coste para los llamadores antiguos, datos por episodio terminado en
    # self.last_eps (causa, recompensa con/sin shaping, posiciones de ladrillos rotos) para el harness.
    def __init__(self, n, masks, seed=0, shaping=True, timeout_mode=None, fixed=False):
        self.n = n; self.rng = _rng(seed); self.masks = masks  # lista de (mask,fam,vivos)
        self.shaping = shaping; self.timeout_mode = timeout_mode; self.fixed = fixed
        self.bx = np.zeros(n, np.float32); self.by = np.zeros(n, np.float32)
        self.bvx = np.zeros(n, np.float32); self.bvy = np.zeros(n, np.float32)
        self.pax = np.zeros(n, np.float32); self.alive = np.zeros((n, NUM), np.float32)
        self.steps = np.zeros(n, np.int32); self.combo = np.zeros(n, np.int32)
        self.ini = np.zeros(n, np.int32); self.broken = np.zeros(n, np.int32)
        self.imask = np.zeros((n, NUM), np.float32)            # máscara inicial (para heatmap de rotos)
        self.tmax = np.full(n, MAXP, np.int32)                 # timeout por entorno
        self.rfull = np.zeros(n, np.float32); self.rtask = np.zeros(n, np.float32)
        self.last_eps = []                                     # episodios terminados en el último step()
        for i in range(n): self._reset_one(i)

    def set_masks(self, masks): self.masks = masks

    def _tmax_for(self, vivos):
        if self.timeout_mode is None: return MAXP             # constante (comportamiento actual)
        if self.timeout_mode == "prop": return int(max(900, 90 * vivos))  # proporcional a ladrillos
        return int(self.timeout_mode)                         # constante explícito

    def _reset_one(self, i):
        m = self.masks[i % len(self.masks)][0] if self.fixed else self.masks[self.rng.integers(len(self.masks))][0]
        self.alive[i] = m; self.imask[i] = m
        ang = self.rng.uniform(-0.9, 0.9)
        self.bx[i] = self.rng.uniform(0.3, 0.7); self.by[i] = self.rng.uniform(0.55, 0.68)
        self.bvx[i] = math.sin(ang) * V; self.bvy[i] = -math.cos(ang) * V
        self.pax[i] = self.rng.uniform(0.35, 0.65)
        self.steps[i] = 0; self.combo[i] = 0
        self.ini[i] = int(m.sum()); self.broken[i] = 0
        self.tmax[i] = self._tmax_for(self.ini[i])
        self.rfull[i] = 0.0; self.rtask[i] = 0.0

    def state(self, escala=1.0):
        s = np.empty((self.n, DIM), np.float32)
        s[:, 0] = self.bx * 2 - 1; s[:, 1] = self.by * 2 - 1
        s[:, 2] = self.bvx / V; s[:, 3] = self.bvy / V
        s[:, 4] = self.pax * 2 - 1
        s[:, 5] = np.clip((self.bx - self.pax) * 2, -1, 1)
        s[:, 6:] = self.alive * escala
        return s

    def step(self, a):
        n = self.n; r = np.zeros(n, np.float32); rs = np.zeros(n, np.float32)  # r=tarea, rs=shaping
        self.pax += (a.astype(np.float32) - 1) * VEL_PALA
        np.clip(self.pax, ANCHO_PALA / 2, 1 - ANCHO_PALA / 2, out=self.pax)
        self.bx += self.bvx; self.by += self.bvy
        # paredes
        l = self.bx < R; self.bx[l] = R; self.bvx[l] = np.abs(self.bvx[l])
        rt = self.bx > 1 - R; self.bx[rt] = 1 - R; self.bvx[rt] = -np.abs(self.bvx[rt])
        tp = self.by < R; self.by[tp] = R; self.bvy[tp] = np.abs(self.bvy[tp])
        # pala
        hp = (self.bvy > 0) & (self.by + R >= YPALA) & (self.by - R <= YPALA + ALTO_PALA) \
             & (self.bx >= self.pax - ANCHO_PALA / 2) & (self.bx <= self.pax + ANCHO_PALA / 2)
        if hp.any():
            rel = np.clip((self.bx[hp] - self.pax[hp]) / (ANCHO_PALA / 2), -1, 1)
            self.bvx[hp] = rel * FACTOR * V; self.bvy[hp] = -np.abs(self.bvy[hp])
            self.by[hp] = YPALA - R - 1e-4
            mag = np.hypot(self.bvx[hp], self.bvy[hp]); mag[mag == 0] = V
            vx, vy = self.bvx[hp] / mag * V, self.bvy[hp] / mag * V
            vymin = 0.35 * V; sm = np.abs(vy) < vymin
            vy[sm] = -np.sign(np.where(vy[sm] == 0, -1, vy[sm])) * vymin
            vx[sm] = np.sign(np.where(vx[sm] == 0, 1, vx[sm])) * np.sqrt(np.maximum(0, V ** 2 - vy[sm] ** 2))
            self.bvx[hp] = vx; self.bvy[hp] = vy
            if self.shaping: rs[hp] += 0.2          # shaping: NO entra en la recompensa de tarea
            self.combo[hp] = 0
        # ladrillos
        over = (self.bx[:, None] + R >= _LX) & (self.bx[:, None] - R <= _LX + ANCHO_L) \
             & (self.by[:, None] + R >= _LY) & (self.by[:, None] - R <= _LY + ALTO_L)
        hit = over & (self.alive > 0)
        anyhit = hit.any(1); e = np.where(anyhit)[0]
        if e.size:
            bi = np.argmax(hit[e], 1)
            self.alive[e, bi] = 0; self.broken[e] += 1
            cx = _LX[bi] + ANCHO_L / 2; cy = _LY[bi] + ALTO_L / 2
            dx = (self.bx[e] - cx) / ANCHO_L; dy = (self.by[e] - cy) / ALTO_L
            fx = np.abs(dx) > np.abs(dy)
            self.bvx[e[fx]] *= -1; self.bvy[e[~fx]] *= -1
            self.combo[e] += 1
            r[e] += 1.0 + 0.5 * (self.combo[e] - 1)
        # terminal
        self.steps += 1
        cnt = self.alive.sum(1)
        lost = self.by - R > 1; won = cnt == 0; tout = self.steps >= self.tmax
        r[lost] -= 1.0; r[won] += 5.0
        rtot = r + rs                                # devuelta = tarea + shaping (idéntica a antes si shaping=True)
        self.rfull += rtot; self.rtask += r          # acumuladores por episodio
        done = lost | won | tout
        info = []; self.last_eps = []
        for i in np.where(done)[0]:
            cause = "won" if won[i] else ("lost" if lost[i] else "timeout")
            broken_pos = ((self.imask[i] > 0) & (self.alive[i] <= 0)).astype(np.float32).copy()
            self.last_eps.append({
                "env": int(i), "won": bool(won[i]), "broken": int(self.broken[i]),
                "ini": int(self.ini[i]), "steps": int(self.steps[i]), "cause": cause,
                "reward_full": float(self.rfull[i]), "reward_task": float(self.rtask[i]),
                "broken_pos": broken_pos,
            })
            info.append((bool(won[i]), int(self.broken[i]), int(self.ini[i]), int(self.steps[i])))
            self._reset_one(int(i))
        return self.state(), rtot, done, info

# ---------------------------------------------------------------------------
#  DQN con encoder conv + rama cinematica (en la GPU)
# ---------------------------------------------------------------------------
class ConvDQN(nn.Module):
    def __init__(self):
        super().__init__()
        self.c1 = nn.Conv2d(1, 16, 3, padding=1)
        self.c2 = nn.Conv2d(16, 32, 3, padding=1)
        self.kin = nn.Linear(6, 16)
        self.h1 = nn.Linear(32 * NUM + 16, 128)
        self.h2 = nn.Linear(128, 128)
        self.out = nn.Linear(128, 3)

    def forward(self, s):                       # s: [B, 86]
        k = F.relu(self.kin(s[:, :6]))
        m = s[:, 6:].view(-1, 1, FILAS, COLS)   # [B,1,8,10]
        m = F.relu(self.c1(m)); m = F.relu(self.c2(m)); m = m.flatten(1)
        x = torch.cat([k, m], 1)
        x = F.relu(self.h1(x)); x = F.relu(self.h2(x))
        return self.out(x)

class Replay:
    def __init__(self, cap):
        self.cap = cap; self.s = np.zeros((cap, DIM), np.float32); self.s2 = np.zeros((cap, DIM), np.float32)
        self.a = np.zeros(cap, np.int64); self.r = np.zeros(cap, np.float32); self.d = np.zeros(cap, np.float32)
        self.pos = 0; self.full = False
    def add(self, s, a, r, s2, d):
        n = len(r); idx = (self.pos + np.arange(n)) % self.cap
        self.s[idx] = s; self.a[idx] = a; self.r[idx] = r; self.s2[idx] = s2; self.d[idx] = d
        self.pos = (self.pos + n) % self.cap; self.full = self.full or self.pos < n
    def size(self): return self.cap if self.full else self.pos
    def sample(self, b):
        i = np.random.randint(0, self.size(), b)
        return self.s[i], self.a[i], self.r[i], self.s2[i], self.d[i]

# ---------------------------------------------------------------------------
def evaluate(net, masks, kEps=300, escala=1.0):
    env = VecArkanoid(48, masks, seed=777); eps = won = 0; pct = 0.0; steps = 0
    while eps < kEps:
        with torch.no_grad():
            q = net(torch.from_numpy(env.state(escala)).to(DEV))
            a = q.argmax(1).cpu().numpy().astype(np.int64)
        _, _, done, info = env.step(a)
        for w, br, ini, st in info:
            eps += 1; won += int(w); pct += br / max(1, ini); steps += st
    return won / eps, pct / eps, steps / eps

def main():
    pasos = int(sys.argv[1]) if len(sys.argv) > 1 else 1_500_000
    N = int(sys.argv[2]) if len(sys.argv) > 2 else 256
    print(f"=== Arkanoid DRL en GPU (PyTorch · device={DEV}) ===")
    print(f"torch {torch.__version__} · 8x10 conv DQN · envs={N} · pasos={pasos} · timeout={MAXP}")
    pool = gen_pool(400); train, val, test = split_pool(pool)
    print(f"pool {len(pool)} · train {len(train)} / test {len(test)} (disjuntos) · vivos medios train="
          f"{np.mean([v for _,_,v in train]):.1f}/{NUM}")

    net = ConvDQN().to(DEV); tgt = ConvDQN().to(DEV); tgt.load_state_dict(net.state_dict())
    opt = torch.optim.Adam(net.parameters(), lr=8e-4)
    nparams = sum(p.numel() for p in net.parameters())
    print(f"red conv: {nparams} params · backend GPU = {DEV}")
    buf = Replay(100_000)
    GAMMA, TAU, BATCH, START = 0.99, 0.01, 256, 2000
    EPS0, EPSF, EPSDECAY = 1.0, 0.05, 8000

    # curriculo por tiers (nº ladrillos)
    TIERS = [16, 36, 60, NUM]; tier = 0; cap = TIERS[0]; tier_steps = 0
    def train_subset(c): return [m for m in train if m[2] <= c]
    env = VecArkanoid(N, train_subset(cap), seed=1)
    succ_win = []  # exitos recientes (entrenamiento)

    t0 = time.time(); env_steps = 0; last = 0
    while env_steps < pasos:
        eps = max(EPSF, EPS0 + (EPSF - EPS0) * min(1, env_steps / EPSDECAY))
        s = env.state()
        with torch.no_grad():
            q = net(torch.from_numpy(s).to(DEV))
            greedy = q.argmax(1).cpu().numpy()
        a = np.where(np.random.random(N) < eps, np.random.randint(0, 3, N), greedy).astype(np.int64)
        s2, r, done, info = env.step(a)
        buf.add(s, a, r, s2, done.astype(np.float32))
        env_steps += N
        for w, br, ini, st in info: succ_win.append(1 if w else 0)
        if len(succ_win) > 200: succ_win = succ_win[-200:]

        # entrenamiento DQN (en la GPU)
        if buf.size() >= START:
            bs, ba, br_, bs2, bd = buf.sample(BATCH)
            bs = torch.from_numpy(bs).to(DEV); bs2 = torch.from_numpy(bs2).to(DEV)
            ba = torch.from_numpy(ba).to(DEV); br_ = torch.from_numpy(br_).to(DEV); bd = torch.from_numpy(bd).to(DEV)
            with torch.no_grad():
                astar = net(bs2).argmax(1, keepdim=True)
                q2 = tgt(bs2).gather(1, astar).squeeze(1)
                y = br_ + GAMMA * (1 - bd) * q2
            qa = net(bs).gather(1, ba.unsqueeze(1)).squeeze(1)
            loss = F.smooth_l1_loss(qa, y)
            opt.zero_grad(); loss.backward(); opt.step()
            with torch.no_grad():
                for tp, p in zip(tgt.parameters(), net.parameters()): tp.mul_(1 - TAU).add_(TAU * p)

        # curriculo: avanzar tier
        tier_steps += N
        sr = np.mean(succ_win) if succ_win else 0
        if tier < len(TIERS) - 1 and ((sr >= 0.7 and len(succ_win) >= 100) or tier_steps >= 500_000):
            tier += 1; cap = TIERS[tier]; tier_steps = 0; env.set_masks(train_subset(cap))
            print(f"  [{env_steps//1000}k] train-exito {sr*100:.0f}% -> desbloquea <= {cap} ladrillos ({time.time()-t0:.0f}s)")
        if env_steps - last >= 200_000:
            last = env_steps
            print(f"  [{env_steps//1000}k] tier<={cap} · train-exito {sr*100:.0f}% · {env_steps/(time.time()-t0):.0f} exp/s · {time.time()-t0:.0f}s")

    dt = time.time() - t0
    print(f"\nEntrenado en {dt:.0f}s ({pasos/dt:.0f} exp/s) en {DEV}.")
    tr_s, tr_p, _ = evaluate(net, train); te_s, te_p, te_st = evaluate(net, test)
    print(f"TRAIN  exito {tr_s*100:.0f}% · %ladrillos {tr_p*100:.0f}%")
    print(f"TEST   exito {te_s*100:.0f}% · %ladrillos {te_p*100:.0f}%  <- niveles NO vistos · gap {((tr_s-te_s)*100):.1f} pts")
    fams = sorted(set(f for _, f, _ in test))
    for f in fams:
        sub = [m for m in test if m[1] == f]
        if len(sub) < 3: continue
        s_, p_, _ = evaluate(net, sub, 150)
        print(f"  {f:<11} exito {s_*100:3.0f}% · %ladrillos {p_*100:3.0f}% · {len(sub)} niveles")
    print(f"\n{'OK' if te_s>0.6 else 'parcial'} · GPU {DEV} usada para conv-DQN. (compara con TF.js-CPU: 86% test)")

if __name__ == "__main__":
    main()
