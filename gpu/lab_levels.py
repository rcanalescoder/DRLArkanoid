#!/usr/bin/env python3
# ============================================================================
#  Protocolo de honestidad — CONJUNTOS DE TEST y LIMPIABILIDAD (Fase A6 / §7)
#  Define los tres bloques de test disjuntos de train y verifica que cada nivel
#  sea FÍSICAMENTE limpiable (sin ladrillos inalcanzables dado el rebote):
#    · TEST-ID            niveles nuevos del mismo generador/familias que train
#    · TEST-OOD-patrón    familias estructuralmente distintas (túnel, diagonal,
#                         anillo, hueco central, ajedrez, esquinas)
#    · TEST-OOD-dificultad densidad extrema (denso / casi-lleno / lleno)
#  La limpiabilidad se mide con un ORÁCULO de seguimiento (la pala persigue la
#  bola, con sesgo lateral variable por reinicio). Es una cota INFERIOR honesta:
#  si el oráculo lo limpia, el nivel es limpiable; los que falla se DESCARTAN
#  (preferimos descartar de más a dejar pasar un nivel imposible).
# ============================================================================
import os, sys, math, hashlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from arkanoid_mps import (FILAS, COLS, NUM, MAXP, V, VEL_PALA, gen_pool, split_pool, VecArkanoid)

# ---- pool canónico de TRAIN (idéntico al usado por la comparativa) -----------
def train_split(pool_n=400, pool_seed=12345, split_seed=999):
    pool = gen_pool(pool_n, pool_seed)
    train, val, test = split_pool(pool, split_seed)
    return pool, train, val, test

def mask_key(m): return np.asarray(m, np.float32).round().astype(np.uint8).tobytes()

def _dedup_disjoint(levels, exclude):
    seen, out = set(exclude), []
    for m, fam, v in levels:
        k = mask_key(m)
        if k in seen or float(np.sum(m)) < 1: continue
        seen.add(k); out.append((np.asarray(m, np.float32), fam, int(np.sum(m))))
    return out

# ============================================================================
#  TEST-ID — mismo generador/familias que train, disjunto de train
# ============================================================================
def gen_test_id(n, seed, exclude_keys):
    # generamos un pool grande con otra semilla y nos quedamos con los no vistos en train
    big = gen_pool(max(n * 4, 200), seed)
    cand = _dedup_disjoint(big, exclude_keys)
    return cand[:n]

# ============================================================================
#  TEST-OOD-patrón — familias estructuralmente NUEVAS
# ============================================================================
def _m(): return np.zeros(NUM, np.float32)
def _set(m, f, c):
    if 0 <= f < FILAS and 0 <= c < COLS: m[f * COLS + c] = 1.0

def gen_test_ood_pattern(n, seed, exclude_keys):
    rng = np.random.default_rng(seed); out = []
    fams = ["tunel", "tunel_h", "diagonal", "x_shape", "anillo", "hueco_central",
            "ajedrez", "esquinas", "cruz", "bordes_laterales"]
    tries = 0
    while len(out) < n * 6 and tries < n * 120:
        tries += 1; fam = fams[rng.integers(len(fams))]; m = _m()
        if fam == "tunel":  # bloque lleno con un canal VERTICAL vacío
            f0 = int(rng.integers(2)); h = f0 + 3 + int(rng.integers(FILAS - f0 - 2))
            w = 1 + int(rng.integers(2)); c0 = int(rng.integers(COLS - w))
            for f in range(f0, h):
                for c in range(COLS):
                    if not (c0 <= c < c0 + w): _set(m, f, c)
        elif fam == "tunel_h":  # bloque lleno con una FRANJA horizontal vacía
            c0 = int(rng.integers(3)); cw = c0 + 4 + int(rng.integers(COLS - c0 - 3))
            wh = 1 + int(rng.integers(2)); f0 = 1 + int(rng.integers(FILAS - wh - 1))
            for f in range(FILAS):
                for c in range(c0, cw):
                    if not (f0 <= f < f0 + wh): _set(m, f, c)
        elif fam == "diagonal":  # banda diagonal, grosor/sentido/desfase variables
            anti = bool(rng.integers(2)); thick = 1 + int(rng.integers(2)); off = int(rng.integers(-2, 3))
            for f in range(FILAS):
                base = int(round((f / max(1, FILAS - 1)) * (COLS - 1))) + off
                if anti: base = COLS - 1 - base
                for d in range(-thick, thick + 1): _set(m, f, base + d)
        elif fam == "x_shape":  # las DOS diagonales (una X)
            thick = int(rng.integers(0, 2))
            for f in range(FILAS):
                b = int(round((f / max(1, FILAS - 1)) * (COLS - 1)))
                for d in range(-thick, thick + 1): _set(m, f, b + d); _set(m, f, COLS - 1 - b + d)
        elif fam == "anillo":  # marco RECTANGULAR (posible interior/offset), no siempre perímetro
            t = 1 + int(rng.integers(2)); f0 = int(rng.integers(2)); c0 = int(rng.integers(3))
            f1 = FILAS - int(rng.integers(2)); c1 = COLS - int(rng.integers(3))
            for f in range(f0, f1):
                for c in range(c0, c1):
                    if f < f0 + t or f >= f1 - t or c < c0 + t or c >= c1 - t: _set(m, f, c)
        elif fam == "hueco_central":  # rectángulo lleno con hueco interior vacío
            of0 = int(rng.integers(2)); oc0 = int(rng.integers(3))
            of1 = FILAS - int(rng.integers(2)); oc1 = COLS - int(rng.integers(3))
            for f in range(of0, of1):
                for c in range(oc0, oc1): _set(m, f, c)
            hf = 2 + int(rng.integers(3)); hc = 2 + int(rng.integers(4))
            f0 = of0 + max(1, (of1 - of0 - hf) // 2); c0 = oc0 + max(1, (oc1 - oc0 - hc) // 2)
            for f in range(f0, min(of1 - 1, f0 + hf)):
                for c in range(c0, min(oc1 - 1, c0 + hc)): m[f * COLS + c] = 0.0
        elif fam == "ajedrez":  # ajedrez con bloque 1x1 o 2x2, paridad y filas variables
            par = int(rng.integers(2)); rows = 3 + int(rng.integers(FILAS - 2)); bs = 1 + int(rng.integers(2))
            for f in range(rows):
                for c in range(COLS):
                    if ((f // bs) + (c // bs)) % 2 == par: _set(m, f, c)
        elif fam == "esquinas":  # bloques de esquina, tamaños/selección variables
            sizes = [(2 + int(rng.integers(2)), 2 + int(rng.integers(2))) for _ in range(4)]
            corners = [(0, 0, 1, 1), (0, COLS - 1, 1, -1), (FILAS - 1, 0, -1, 1), (FILAS - 1, COLS - 1, -1, -1)]
            for (bf, bc), (rf, cf, sf, sc) in zip(sizes, corners):
                if rng.random() < 0.85:
                    for f in range(bf):
                        for c in range(bc): _set(m, rf + sf * f, cf + sc * c)
        elif fam == "cruz":  # una banda de filas + una banda de columnas (un +)
            fh = 1 + int(rng.integers(2)); cw = 1 + int(rng.integers(2))
            fr = int(rng.integers(FILAS - fh + 1)); cc = int(rng.integers(COLS - cw + 1))
            for f in range(FILAS):
                for c in range(cc, cc + cw): _set(m, f, c)
            for f in range(fr, fr + fh):
                for c in range(COLS): _set(m, f, c)
        else:  # bordes_laterales: muros laterales (cols extremas), grosor variable
            w = 1 + int(rng.integers(2)); h = 3 + int(rng.integers(FILAS - 2))
            both = rng.random() < 0.7
            for f in range(h):
                for c in range(w):
                    _set(m, f, c)
                    if both: _set(m, f, COLS - 1 - c)
        if m.sum() >= 1: out.append((m, fam, int(m.sum())))
    return _dedup_disjoint(out, exclude_keys)[:n]

# ============================================================================
#  TEST-OOD-dificultad — densidad extrema (cola dura del espacio de niveles)
# ============================================================================
def gen_test_ood_diff(n, seed, exclude_keys):
    rng = np.random.default_rng(seed); out = []; tries = 0
    while len(out) < n * 6 and tries < n * 120:
        tries += 1; fam = ["denso", "casi_lleno", "lleno", "denso_bajo"][rng.integers(4)]; m = _m()
        if fam == "denso":  # dispersión de densidad extrema (cola dura, fuera de train)
            p = 0.82 + rng.random() * 0.18; m = (rng.random(NUM) < p).astype(np.float32)
        elif fam == "casi_lleno":  # lleno menos unos pocos
            m = np.ones(NUM, np.float32); k = 1 + int(rng.integers(12))
            for idx in rng.permutation(NUM)[:k]: m[idx] = 0.0
        elif fam == "denso_bajo":  # muy denso pero concentrado en la mitad inferior (más cerca de la pala)
            p = 0.85 + rng.random() * 0.15
            for f in range(FILAS):
                dens = p if f >= FILAS // 2 else p * 0.4
                for c in range(COLS):
                    if rng.random() < dens: _set(m, f, c)
        else:  # lleno
            m = np.ones(NUM, np.float32)
        if m.sum() >= 1: out.append((m, fam, int(m.sum())))
    return _dedup_disjoint(out, exclude_keys)[:n]

# ============================================================================
#  LIMPIABILIDAD — oráculo de seguimiento (cota inferior honesta)
# ============================================================================
def _level_seed(mask, salt):
    # semilla DETERMINISTA y dependiente SOLO del contenido del nivel (no del índice
    # en la lista ni de PYTHONHASHSEED) -> la limpiabilidad es función pura del nivel,
    # reproducible aunque cambie la composición del conjunto.
    h = hashlib.sha256(mask_key(mask) + bytes([salt & 0xFF])).digest()
    return int.from_bytes(h[:4], "little")

def clearability(levels, restarts=6, timeout=MAXP):
    """Devuelve por nivel: clearable(bool), best_broken_frac, min_steps_to_clear.
    Oráculo: la pala persigue la bola; cada reinicio usa unas condiciones iniciales
    DETERMINISTAS derivadas del propio nivel (independientes del índice) y un sesgo
    lateral distinto para variar ángulos de rebote. clearable = limpiado en >=1 reinicio.
    Solo cuenta el PRIMER episodio de cada entorno (las condiciones se inyectan a mano)."""
    n = len(levels)
    if n == 0: return []
    masks = [np.asarray(m, np.float32) for m, _, _ in levels]
    clr = np.zeros(n, bool); best_frac = np.zeros(n, np.float32); min_steps = np.full(n, -1, np.int64)
    biases = np.linspace(-0.10, 0.10, restarts)
    for ri in range(restarts):
        env = VecArkanoid(n, levels, seed=0, fixed=True, timeout_mode=int(timeout))
        for i in range(n):  # inyectar condiciones iniciales deterministas por nivel
            rng = np.random.default_rng(_level_seed(masks[i], ri))
            ang = rng.uniform(-0.9, 0.9)
            env.alive[i] = masks[i]; env.imask[i] = masks[i]
            env.bx[i] = rng.uniform(0.3, 0.7); env.by[i] = rng.uniform(0.55, 0.68)
            env.bvx[i] = math.sin(ang) * V; env.bvy[i] = -math.cos(ang) * V
            env.pax[i] = rng.uniform(0.35, 0.65)
            env.steps[i] = 0; env.broken[i] = 0; env.combo[i] = 0
            env.ini[i] = int(masks[i].sum()); env.rfull[i] = 0.0; env.rtask[i] = 0.0
        done_once = np.zeros(n, bool); bias = biases[ri]
        guard = 0; cap = int(timeout) + 50
        tol = VEL_PALA * 0.5
        while not done_once.all() and guard < cap:
            guard += 1
            target = np.clip(env.bx + bias, 0.0, 1.0)
            a = np.where(env.pax < target - tol, 2, np.where(env.pax > target + tol, 0, 1)).astype(np.int64)
            env.step(a)
            for e in env.last_eps:
                i = e["env"]
                if done_once[i]: continue
                done_once[i] = True
                frac = e["broken"] / max(1, e["ini"])
                best_frac[i] = max(best_frac[i], frac)
                if e["won"]:
                    clr[i] = True
                    if min_steps[i] < 0 or e["steps"] < min_steps[i]: min_steps[i] = e["steps"]
    return [{"clearable": bool(clr[i]), "best_broken_frac": float(best_frac[i]),
             "min_steps_to_clear": int(min_steps[i])} for i in range(n)]


if __name__ == "__main__":
    # prueba rápida de los generadores + limpiabilidad
    pool, train, val, test = train_split()
    excl = {mask_key(m) for m, _, _ in train} | {mask_key(m) for m, _, _ in val}
    for name, gen in [("ID", gen_test_id(40, 7, excl)),
                      ("OOD-pat", gen_test_ood_pattern(40, 7, excl)),
                      ("OOD-dif", gen_test_ood_diff(40, 7, excl))]:
        rep = clearability(gen, restarts=4)
        ok = sum(r["clearable"] for r in rep)
        fams = sorted(set(f for _, f, _ in gen))
        print(f"{name:<8} {len(gen):3d} niveles · limpiables {ok}/{len(gen)} · familias {fams}")
