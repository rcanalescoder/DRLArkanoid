// ============================================================================
//  Generador de niveles (Fase 2) — patrones de ladrillos procedurales
//  Produce MÁSCARAS (Uint8Array[NUM_LADRILLOS], 1=vivo, orden fila-mayor) de
//  varias FAMILIAS (dispersión, filas, columnas, bloque, simétrico), pre-genera
//  un POOL reproducible (con semilla) y lo divide en splits train/val/test
//  DISJUNTOS y deduplicados. El objetivo es entrenar la vista sobre niveles
//  variados y medir GENERALIZACIÓN a niveles no vistos (success_rate test).
// ============================================================================
import { FILAS_LADRILLOS, COLUMNAS_LADRILLOS, NUM_LADRILLOS } from "../nucleo/constantes.js";

const F = FILAS_LADRILLOS;
const C = COLUMNAS_LADRILLOS;
const N = NUM_LADRILLOS;
const idx = (f, c) => f * C + c;

// RNG congruente reproducible (xorshift32), igual estilo que el entorno.
function crearRng(semilla) {
  let s = (semilla >>> 0) || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

function barajar(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --- Familias: cada una recibe el rng y devuelve una máscara Uint8Array[N] ---
export const FAMILIAS = {
  // Salpicado: cada celda viva con probabilidad p (densidad aleatoria).
  dispersion(rng) {
    const m = new Uint8Array(N);
    const p = 0.2 + rng() * 0.5; // [0.2, 0.7]
    for (let i = 0; i < N; i++) if (rng() < p) m[i] = 1;
    return m;
  },
  // k filas completas.
  filas(rng) {
    const m = new Uint8Array(N);
    const k = 1 + ((rng() * F) | 0);
    for (const f of barajar([...Array(F).keys()], rng).slice(0, k))
      for (let c = 0; c < C; c++) m[idx(f, c)] = 1;
    return m;
  },
  // k columnas completas.
  columnas(rng) {
    const m = new Uint8Array(N);
    const k = 1 + ((rng() * C) | 0);
    for (const c of barajar([...Array(C).keys()], rng).slice(0, k))
      for (let f = 0; f < F; f++) m[idx(f, c)] = 1;
    return m;
  },
  // Bloque rectangular aleatorio.
  bloque(rng) {
    const m = new Uint8Array(N);
    const f0 = (rng() * F) | 0, f1 = f0 + 1 + ((rng() * (F - f0)) | 0);
    const c0 = (rng() * C) | 0, c1 = c0 + 1 + ((rng() * (C - c0)) | 0);
    for (let f = f0; f < f1; f++) for (let c = c0; c < c1; c++) m[idx(f, c)] = 1;
    return m;
  },
  // Simétrico horizontal: media izquierda aleatoria, espejada a la derecha.
  simetrico(rng) {
    const m = new Uint8Array(N);
    const mitad = Math.ceil(C / 2);
    for (let f = 0; f < F; f++)
      for (let c = 0; c < mitad; c++)
        if (rng() < 0.5) { m[idx(f, c)] = 1; m[idx(f, C - 1 - c)] = 1; }
    return m;
  },
};

/** Pre-genera un pool de `n` máscaras distintas (no vacías), reproducible por semilla. */
export function generarPool({ semilla = 12345, n = 400 } = {}) {
  const rng = crearRng(semilla);
  const nombres = Object.keys(FAMILIAS);
  const vistos = new Set();
  const pool = [];
  let intentos = 0;
  while (pool.length < n && intentos < n * 60) {
    intentos++;
    const familia = nombres[(rng() * nombres.length) | 0];
    const mask = FAMILIAS[familia](rng);
    let vivos = 0;
    for (let i = 0; i < N; i++) vivos += mask[i];
    if (vivos < 1) continue; // descartar niveles vacíos (se ganarían solos)
    const clave = mask.join("");
    if (vistos.has(clave)) continue; // deduplicar
    vistos.add(clave);
    pool.push({ mask, familia, vivos });
  }
  return pool;
}

/** Divide el pool en splits DISJUNTOS train/val/test (barajado reproducible). */
export function dividirSplits(pool, { train = 0.7, val = 0.15 } = {}, semilla = 999) {
  const rng = crearRng(semilla);
  const orden = barajar([...pool.keys()], rng);
  const nTr = Math.floor(pool.length * train);
  const nVal = Math.floor(pool.length * val);
  const tomar = (a, b) => orden.slice(a, b).map((i) => pool[i]);
  return {
    train: tomar(0, nTr),
    val: tomar(nTr, nTr + nVal),
    test: tomar(nTr + nVal, pool.length),
  };
}

/** Proveedor de nivel para el entorno: muestrea una máscara al azar del split dado. */
export function proveedorDe(split) {
  const masks = split.map((n) => n.mask);
  return () => masks[(Math.random() * masks.length) | 0];
}
