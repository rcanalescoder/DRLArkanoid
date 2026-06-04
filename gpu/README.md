# Arkanoid DRL en la GPU (Apple Metal / MPS)

## Por qué este directorio
El lab principal está en **JavaScript + TensorFlow.js**. La GPU del Mac (Metal) **solo se
alcanza con TF.js dentro del navegador** (WebGPU). En **Node**, TF.js solo tiene backend CPU
(`@tensorflow/tfjs-node` acelera mucho la CPU con libtensorflow, pero **no usa la GPU**;
`tfjs-node-gpu` es solo CUDA/NVIDIA). WebGPU en Node vía Dawn se probó y **se cuelga** en la
lectura (`dataSync`): no es viable.

Para **usar la GPU de verdad** en los entrenamientos pesados, este directorio porta la **misma
tarea** a **PyTorch sobre MPS** (Metal Performance Shaders), que en este Mac funciona
(`torch.backends.mps.is_available() == True`).

## Qué hace `arkanoid_mps.py`
Reproduce la **Fase 2b** del lab en la GPU:
- Entorno **Arkanoid 8×10 vectorizado en numpy** (N entornos en paralelo, misma física que el
  entorno JS: misma velocidad de bola, rebote por punto de impacto, combos, recompensas).
- **DQN con encoder convolucional + rama cinemática** en PyTorch (`device='mps'`): la matriz de
  ocupación 8×10 entra por conv (16→32, 3×3), la cinemática (6) por una rama densa, se concatenan
  → 128→128→3. **351.667 parámetros**, idénticos al modelo de TF.js.
- **Generador de niveles** (familias: dispersión, filas, columnas, bloque, simétrico) con **splits
  train/test disjuntos** y **currículo** fácil→difícil (tiers por nº de ladrillos).
- Double DQN + Huber + soft target update + ε-decay=8000. Mide `success_rate` en **test**
  (niveles no vistos) = generalización.

## Uso
```bash
python3 gpu/arkanoid_mps.py [pasos=1500000] [envs=256]
```
Requiere `torch` con soporte MPS (ya instalado). Mira la GPU con `sudo powermetrics --samplers gpu_power`.

## Resultado
La GPU (MPS) entrena la conv-DQN **más rápido que el CPU nativo** y reproduce la generalización del
lab (limpia niveles 8×10 no vistos apuntando). Es la vía recomendada para escalar entrenamientos
en Apple Silicon manteniendo la **misma arquitectura** que el lab JS.
