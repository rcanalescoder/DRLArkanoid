#!/usr/bin/env python3
# ============================================================================
#  FASE 3 en la GPU — comparativa de los 5 algoritmos con VISIÓN en Metal/MPS
#  Porta DQN, PPO, SAC, World Model y World Model RNN a PyTorch sobre device=mps,
#  todos con el MISMO encoder conv (torso: conv 16/32 sobre la matriz 8x10 +
#  rama cinemática) sobre la MISMA tarea (8x10, niveles variados + currículo).
#  Mide success_rate en TEST (niveles no vistos) y los rankea. TODOS los modelos
#  usan la GPU (a diferencia del harness JS, que en Node solo tiene CPU).
#  Reutiliza el entorno vectorizado y el generador de gpu/arkanoid_mps.py.
#    Uso: python3 gpu/comparativa_mps.py [pasos=1000000]
# ============================================================================
import sys, os, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from arkanoid_mps import DEV, FILAS, COLS, NUM, DIM, MAXP, gen_pool, split_pool, VecArkanoid

PASOS = int(sys.argv[1]) if (len(sys.argv) > 1 and sys.argv[1].lstrip("-").isdigit()) else 1_000_000
TIERS = [16, 36, 60, NUM]
torch.manual_seed(0)

def subset(train, cap): return [m for m in train if m[2] <= cap]

# --- Torso conv compartido (matriz 8x10 -> conv; cinemática -> densa) --------
class Torso(nn.Module):
    def __init__(self):
        super().__init__()
        self.c1 = nn.Conv2d(1, 16, 3, padding=1); self.c2 = nn.Conv2d(16, 32, 3, padding=1)
        self.kin = nn.Linear(6, 16); self.h1 = nn.Linear(32 * NUM + 16, 128); self.h2 = nn.Linear(128, 128)
    def forward(self, s):
        k = F.relu(self.kin(s[:, :6]))
        m = s[:, 6:].view(-1, 1, FILAS, COLS); m = F.relu(self.c1(m)); m = F.relu(self.c2(m)); m = m.flatten(1)
        x = torch.cat([k, m], 1); x = F.relu(self.h1(x)); return F.relu(self.h2(x))

class Head(nn.Module):  # torso + cabeza lineal
    def __init__(self, out):
        super().__init__(); self.t = Torso(); self.o = nn.Linear(128, out)
    def forward(self, s): return self.o(self.t(s))

class Replay:
    def __init__(self, cap=100_000):
        self.cap = cap; self.s = np.zeros((cap, DIM), np.float32); self.s2 = np.zeros((cap, DIM), np.float32)
        self.a = np.zeros(cap, np.int64); self.r = np.zeros(cap, np.float32); self.d = np.zeros(cap, np.float32)
        self.pos = 0; self.full = False
    def add(self, s, a, r, s2, d):
        n = len(r); i = (self.pos + np.arange(n)) % self.cap
        self.s[i] = s; self.a[i] = a; self.r[i] = r; self.s2[i] = s2; self.d[i] = d
        self.pos = (self.pos + n) % self.cap; self.full = self.full or self.pos < n
    def size(self): return self.cap if self.full else self.pos
    def sample(self, b):
        i = np.random.randint(0, self.size(), b)
        T = lambda x: torch.from_numpy(x).to(DEV)
        return T(self.s[i]), T(self.a[i]), T(self.r[i]), T(self.s2[i]), T(self.d[i])

def tens(x): return torch.from_numpy(x).to(DEV)

def evaluate(act, test, kEps=240):
    env = VecArkanoid(48, test, seed=777); eps = won = 0; pct = 0.0
    while eps < kEps:
        a = act(env.state(1.0))
        _, _, done, info = env.step(a)
        for w, br, ini, st in info:
            eps += 1; won += int(w); pct += br / max(1, ini)
    return won / eps, pct / eps

# ----------------------------------------------------------------------------
#  Bucle OFF-POLICY genérico (DQN, SAC, WM, WM-RNN): env + currículo + learn()
# ----------------------------------------------------------------------------
def run_offpolicy(algo, train, pasos, envs=256):
    cap = TIERS[0]; env = VecArkanoid(envs, subset(train, cap), seed=1)
    succ = []; t0 = time.time(); steps = 0; tier = 0; tsteps = 0
    while steps < pasos:
        s = env.state(1.0)
        a = algo.act(s, train=True, frac=steps)
        s2, r, done, info = env.step(a)
        algo.buf.add(s, a, r, s2, done.astype(np.float32))
        steps += envs
        for w, *_ in info: succ.append(1 if w else 0)
        if len(succ) > 200: succ = succ[-200:]
        algo.learn(steps)
        tsteps += envs; sr = np.mean(succ) if succ else 0
        if tier < len(TIERS) - 1 and ((sr >= 0.7 and len(succ) >= 100) or tsteps >= 500_000):
            tier += 1; cap = TIERS[tier]; tsteps = 0; env.set_masks(subset(train, cap))
    return time.time() - t0

# ============================ DQN ===========================================
class DQN:
    name = "dqn"; fam = "model-free · valor"; envs = 256
    def __init__(self):
        self.q = Head(3).to(DEV); self.tgt = Head(3).to(DEV); self.tgt.load_state_dict(self.q.state_dict())
        self.opt = torch.optim.Adam(self.q.parameters(), 8e-4); self.buf = Replay()
    def act(self, s, train=False, frac=0):
        with torch.no_grad(): g = self.q(tens(s)).argmax(1).cpu().numpy()
        if not train: return g
        eps = max(0.05, 1 + (0.05 - 1) * min(1, frac / 8000))
        return np.where(np.random.random(len(g)) < eps, np.random.randint(0, 3, len(g)), g).astype(np.int64)
    def learn(self, steps):
        if self.buf.size() < 2000: return
        s, a, r, s2, d = self.buf.sample(256)
        with torch.no_grad():
            astar = self.q(s2).argmax(1, keepdim=True)
            y = r + 0.99 * (1 - d) * self.tgt(s2).gather(1, astar).squeeze(1)
        qa = self.q(s).gather(1, a.unsqueeze(1)).squeeze(1)
        loss = F.smooth_l1_loss(qa, y)
        self.opt.zero_grad(); loss.backward(); self.opt.step()
        with torch.no_grad():
            for tp, p in zip(self.tgt.parameters(), self.q.parameters()): tp.mul_(0.99).add_(0.01 * p)
    def eval_act(self, s):
        with torch.no_grad(): return self.q(tens(s)).argmax(1).cpu().numpy()

# ============================ SAC (discreto) ================================
class SAC:
    name = "sac"; fam = "model-free · actor-crítico"; envs = 256
    def __init__(self):
        self.actor = Head(3).to(DEV); self.q1 = Head(3).to(DEV); self.q2 = Head(3).to(DEV)
        self.t1 = Head(3).to(DEV); self.t2 = Head(3).to(DEV)
        self.t1.load_state_dict(self.q1.state_dict()); self.t2.load_state_dict(self.q2.state_dict())
        self.oa = torch.optim.Adam(self.actor.parameters(), 3e-4)
        self.oc = torch.optim.Adam(list(self.q1.parameters()) + list(self.q2.parameters()), 8e-4)
        self.buf = Replay()
    def _qpol(self, st):  # política greedy del CRÍTICO soft (fiable; el actor discreto colapsa)
        return torch.min(self.q1(st), self.q2(st)).argmax(1).cpu().numpy()
    def act(self, s, train=False, frac=0):
        with torch.no_grad():
            g = self._qpol(tens(s))  # conducta ε-greedy SOBRE EL CRÍTICO: rompe el bucle actor-malo→datos-malos
            if not train: return g
            eps = max(0.05, 1 + (0.05 - 1) * min(1, frac / 8000))
            rnd = np.random.random(len(g)) < eps
            if rnd.any(): g[rnd] = np.random.randint(0, 3, int(rnd.sum()))
            return g
    def learn(self, steps):
        if self.buf.size() < 2000: return
        s, a, r, s2, d = self.buf.sample(256); alpha = 0.2
        with torch.no_grad():
            minq = torch.min(self.t1(s2), self.t2(s2))
            p2 = F.softmax(minq / alpha, 1); lp2 = F.log_softmax(minq / alpha, 1)  # política soft del CRÍTICO (no del actor inestable)
            v2 = (p2 * (minq - alpha * lp2)).sum(1); y = r + 0.99 * (1 - d) * v2
        q1 = self.q1(s).gather(1, a.unsqueeze(1)).squeeze(1); q2 = self.q2(s).gather(1, a.unsqueeze(1)).squeeze(1)
        lc = F.mse_loss(q1, y) + F.mse_loss(q2, y)
        self.oc.zero_grad(); lc.backward(); self.oc.step()
        p = F.softmax(self.actor(s), 1); lp = F.log_softmax(self.actor(s), 1)
        with torch.no_grad(): minqa = torch.min(self.q1(s), self.q2(s))
        la = (p * (alpha * lp - minqa)).sum(1).mean()
        self.oa.zero_grad(); la.backward(); self.oa.step()
        with torch.no_grad():
            for tp, pp in zip(self.t1.parameters(), self.q1.parameters()): tp.mul_(0.99).add_(0.01 * pp)
            for tp, pp in zip(self.t2.parameters(), self.q2.parameters()): tp.mul_(0.99).add_(0.01 * pp)
    def eval_act(self, s):
        with torch.no_grad(): return self._qpol(tens(s))

# ============================ World Model (Dyna-Q) ==========================
# Dinámica SOLO CINEMÁTICA: (s[86], onehot(a)) -> (Δcinemática[6], r, doneLogit).
# Predecir los 80 ladrillos era el error: su MSE ahogaba las 6 cinemáticas (las que
# mueven la bola) y la imaginación divergía. En imaginación los ladrillos se mantienen
# fijos (cambian poco en pocos pasos). Así el modelo se centra en la física que importa.
class Dyn(nn.Module):
    def __init__(self):
        super().__init__(); self.f = nn.Sequential(nn.Linear(DIM + 3, 200), nn.ReLU(), nn.Linear(200, 200), nn.ReLU(), nn.Linear(200, 6 + 2))
    def forward(self, s, a1h): return self.f(torch.cat([s, a1h], 1))

class WorldModel:
    name = "worldModel"; fam = "model-based · Dyna-Q"; envs = 128; plan = 1; warmup = 150_000
    def __init__(self):
        self.q = Head(3).to(DEV); self.tgt = Head(3).to(DEV); self.tgt.load_state_dict(self.q.state_dict())
        self.dyn = Dyn().to(DEV)
        self.oq = torch.optim.Adam(self.q.parameters(), 8e-4); self.od = torch.optim.Adam(self.dyn.parameters(), 1e-3)
        self.buf = Replay()
    def act(self, s, train=False, frac=0):
        with torch.no_grad(): g = self.q(tens(s)).argmax(1).cpu().numpy()
        if not train: return g
        eps = max(0.05, 1 + (0.05 - 1) * min(1, frac / 8000))
        return np.where(np.random.random(len(g)) < eps, np.random.randint(0, 3, len(g)), g).astype(np.int64)
    def _qupdate(self, s, a, r, s2, d, peso=1.0):
        with torch.no_grad():
            astar = self.q(s2).argmax(1, keepdim=True)
            y = r + 0.99 * (1 - d) * self.tgt(s2).gather(1, astar).squeeze(1)
        qa = self.q(s).gather(1, a.unsqueeze(1)).squeeze(1)
        loss = peso * F.smooth_l1_loss(qa, y); self.oq.zero_grad(); loss.backward(); self.oq.step()
        with torch.no_grad():
            for tp, p in zip(self.tgt.parameters(), self.q.parameters()): tp.mul_(0.99).add_(0.01 * p)
    def learn(self, steps):
        if self.buf.size() < 2000: return
        s, a, r, s2, d = self.buf.sample(256)
        a1h = F.one_hot(a, 3).float()
        pred = self.dyn(s, a1h); dk, rp, dl = pred[:, :6], pred[:, 6], pred[:, 7]
        ld = F.mse_loss(dk, (s2 - s)[:, :6]) + F.mse_loss(rp, r) + 0.5 * F.binary_cross_entropy_with_logits(dl, d)
        self.od.zero_grad(); ld.backward(); self.od.step()
        self._qupdate(s, a, r, s2, d)  # Q con datos REALES (esto ya resuelve, ~66%)
        if steps < self.warmup: return  # no imaginar con el modelo aún malo
        si = self.buf.sample(256)[0]  # imaginación: cinemática del modelo, ladrillos fijos
        for _ in range(self.plan):
            with torch.no_grad():
                ai = self.q(si).argmax(1)
                p = self.dyn(si, F.one_hot(ai, 3).float())
                kin2 = (si[:, :6] + p[:, :6]).clamp(-1, 1)
                s2i = torch.cat([kin2, si[:, 6:]], 1); z = torch.zeros(si.shape[0], device=DEV)
            self._qupdate(si, ai, z, s2i, z, 0.3); si = s2i  # peso bajo: el Q real domina
    def eval_act(self, s):
        with torch.no_grad(): return self.q(tens(s)).argmax(1).cpu().numpy()

# ============================ World Model RNN (LSTM) ========================
class DynRNN(nn.Module):  # LSTM: secuencia (s,onehot(a)) -> (Δcinemática[6], r, doneLogit)
    def __init__(self):
        super().__init__(); self.lstm = nn.LSTM(DIM + 3, 128, batch_first=True); self.o = nn.Linear(128, 6 + 2)
    def forward(self, x, h=None):
        y, h = self.lstm(x, h); return self.o(y), h

class WorldModelRNN(WorldModel):
    name = "worldModelRecurrente"; fam = "model-based · LSTM"; envs = 128; plan = 1
    def __init__(self):
        super().__init__(); self.dyn = DynRNN().to(DEV); self.od = torch.optim.Adam(self.dyn.parameters(), 1e-3)
    def learn(self, steps):
        if self.buf.size() < 2000: return
        s, a, r, s2, d = self.buf.sample(256)
        x = torch.cat([s, F.one_hot(a, 3).float()], 1).unsqueeze(1)  # [B,1,DIM+3]
        out, _ = self.dyn(x); out = out[:, 0]
        dk, rp, dl = out[:, :6], out[:, 6], out[:, 7]
        ld = F.mse_loss(dk, (s2 - s)[:, :6]) + F.mse_loss(rp, r) + 0.5 * F.binary_cross_entropy_with_logits(dl, d)
        self.od.zero_grad(); ld.backward(); self.od.step()
        self._qupdate(s, a, r, s2, d)
        if steps < self.warmup: return
        si = self.buf.sample(256)[0]; h = None
        for _ in range(self.plan):
            with torch.no_grad():
                ai = self.q(si).argmax(1)
                x = torch.cat([si, F.one_hot(ai, 3).float()], 1).unsqueeze(1)
                out, h = self.dyn(x, h); o = out[:, 0]
                kin2 = (si[:, :6] + o[:, :6]).clamp(-1, 1)
                s2i = torch.cat([kin2, si[:, 6:]], 1); z = torch.zeros(si.shape[0], device=DEV)
            self._qupdate(si, ai, z, s2i, z, 0.3); si = s2i  # peso bajo

# ============================ PPO (on-policy) ===============================
class PPO:
    name = "ppo"; fam = "model-free · actor-crítico"; envs = 64; L = 256
    def __init__(self):
        self.actor = Head(3).to(DEV); self.critic = Head(1).to(DEV)
        self.opt = torch.optim.Adam(list(self.actor.parameters()) + list(self.critic.parameters()), 6e-4)
    def eval_act(self, s):
        with torch.no_grad(): return F.softmax(self.actor(tens(s)), 1).argmax(1).cpu().numpy()
    def run(self, train, pasos):
        cap = TIERS[0]; env = VecArkanoid(self.envs, subset(train, cap), seed=1)
        N = self.envs; succ = []; t0 = time.time(); steps = 0; tier = 0; tsteps = 0
        while steps < pasos:
            S, A, LP, R, D, V = [], [], [], [], [], []
            for _ in range(self.L):
                s = env.state(1.0); st = tens(s)
                with torch.no_grad():
                    logits = self.actor(st); p = F.softmax(logits, 1)
                    a = torch.multinomial(p, 1).squeeze(1)
                    lp = F.log_softmax(logits, 1).gather(1, a.unsqueeze(1)).squeeze(1)
                    v = self.critic(st).squeeze(1)
                an = a.cpu().numpy().astype(np.int64)
                s2, r, done, info = env.step(an)
                S.append(s); A.append(an); LP.append(lp.cpu().numpy()); R.append(r); D.append(done.astype(np.float32)); V.append(v.cpu().numpy())
                steps += N
                for w, *_ in info: succ.append(1 if w else 0)
            if len(succ) > 400: succ = succ[-400:]
            with torch.no_grad(): lastv = self.critic(tens(env.state(1.0))).squeeze(1).cpu().numpy()
            # GAE
            S = np.array(S); A = np.array(A); LP = np.array(LP); R = np.array(R); D = np.array(D); V = np.array(V)
            adv = np.zeros_like(R); gae = np.zeros(N, np.float32)
            for t in range(self.L - 1, -1, -1):
                nextv = lastv if t == self.L - 1 else V[t + 1]
                delta = R[t] + 0.99 * nextv * (1 - D[t]) - V[t]
                gae = delta + 0.99 * 0.95 * (1 - D[t]) * gae; adv[t] = gae
            ret = adv + V
            bs = tens(S.reshape(-1, DIM)); ba = tens(A.reshape(-1)); blp = tens(LP.reshape(-1))
            badv = tens(adv.reshape(-1)); bret = tens(ret.reshape(-1))
            badv = (badv - badv.mean()) / (badv.std() + 1e-8)
            M = bs.shape[0]
            for _ in range(4):
                idx = torch.randperm(M, device=DEV)
                for j in range(0, M, 1024):
                    k = idx[j:j + 1024]
                    logits = self.actor(bs[k]); lp = F.log_softmax(logits, 1).gather(1, ba[k].unsqueeze(1)).squeeze(1)
                    ratio = (lp - blp[k]).exp()
                    s1 = ratio * badv[k]; s2c = ratio.clamp(0.8, 1.2) * badv[k]
                    lpol = -torch.min(s1, s2c).mean()
                    ent = -(F.softmax(logits, 1) * F.log_softmax(logits, 1)).sum(1).mean()
                    v = self.critic(bs[k]).squeeze(1); lval = F.mse_loss(v, bret[k])
                    loss = lpol + 0.5 * lval - 0.003 * ent
                    self.opt.zero_grad(); loss.backward(); self.opt.step()
            sr = np.mean(succ) if succ else 0
            tsteps += self.L * N
            if tier < len(TIERS) - 1 and ((sr >= 0.7 and len(succ) >= 100) or tsteps >= 500_000):
                tier += 1; cap = TIERS[tier]; tsteps = 0; env.set_masks(subset(train, cap))
        return time.time() - t0

# ============================ runner ========================================
def main():
    pool = gen_pool(400); train, val, test = split_pool(pool)
    print(f"\n====== FASE 3 GPU · comparativa con VISION (8x10 conv) · device={DEV} · {PASOS} pasos/algo ======")
    print(f"torch {torch.__version__} · pool {len(pool)} · train {len(train)}/test {len(test)} · TODOS en GPU (MPS)")
    print(f"{'algoritmo':<22}| {'familia':<28}| TEST exito · %ladr · tiempo")
    print("-" * 84)
    rows = []
    for Cls in [DQN, SAC, WorldModel, WorldModelRNN, PPO]:
        try:
            algo = Cls()
            if hasattr(algo, "run"):
                dt = algo.run(train, PASOS)
            else:
                dt = run_offpolicy(algo, train, PASOS, algo.envs)
            s, p = evaluate(algo.eval_act, test)
            rows.append((algo.name, algo.fam, s, p, dt))
            print(f"{algo.name:<22}| {algo.fam:<28}| {s*100:3.0f}% · {p*100:3.0f}% · {dt:.0f}s", flush=True)
        except Exception as e:
            print(f"{Cls.name:<22}| ERROR: {str(e)[:50]}", flush=True)
    print("-" * 84)
    rows.sort(key=lambda r: -r[2])
    print("RANKING (success_rate en test, niveles no vistos · TODOS en GPU):")
    for i, (n, f, s, p, dt) in enumerate(rows):
        print(f"  {i+1}. {n:<22} {s*100:3.0f}% · {f}")

if __name__ == "__main__":
    main()
