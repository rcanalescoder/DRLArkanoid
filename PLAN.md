# Plan: Arkanoid DRL Learning Lab — Arquitectura real

## Contexto

El prototipo actual es una UI funcional pero sin entrenamiento real. El objetivo es reconstruir el proyecto con entrenamiento DRL real, 4 algoritmos, UI adaptativa por algoritmo, y rendimiento optimizado para Mac M4 Max (MPS, 64GB RAM).

## Modo de trabajo: agéntico end-to-end

No solo construir, sino operar. Para cada algoritmo, el ciclo es:

```
Build → Deploy → Train → Analyze traces → Tune → Repeat
```

1. **Build**: Implementar el algoritmo con TF.js
2. **Deploy**: Arrancar en el navegador
3. **Train**: Ejecutar entrenamiento real (minutos)
4. **Analyze**: Leer trazas de consola (loss, reward, epsilon, throughput)
5. **Tune**: Si reward no sube → ajustar hiperparámetros (lr, batch size, network, epsilon decay, gamma)
6. **Repeat**: Hasta que el agente mejore de forma medible
7. **Commit**: Guardar la configuración que funciona

Esto se hace para DQN, PPO, SAC y World Model. Cada uno puede necesitar distintos hiperparámetros y arquitecturas de red. Las trazas del sistema permiten diagnosticar problemas (divergencia, estancamiento, exploración insuficiente) y aplicar correcciones.

---

## Decisiones de arquitectura clave

### 1. Simulación desacoplada del render

**Problema**: Si vinculamos la simulación a la representación visual, el sistema está limitado a lo que se puede dibujar en pantalla. Para entrenar bien, necesitamos miles de partidas en paralelo.

**Solución**: Dos pools de entornos separados:

```
┌─────────────────────────────────────────────┐
│           Pool de entrenamiento             │
│  N entornos headless (ej. 200-1000)         │
│  Sin canvas, sin DOM, pura simulación       │
│  Generan experiencias para el agente        │
│  Se ejecutan en batches rápidos             │
└──────────────────┬──────────────────────────┘
                   │ experiencias
                   ▼
            ┌──────────────┐
            │    Agente     │
            │  (red neural) │
            └──────────────┘
                   │ política
                   ▼
┌─────────────────────────────────────────────┐
│           Pool visual (5-15 envs)           │
│  Con canvas, se renderizan en la rejilla    │
│  Usan la misma política del agente          │
│  Solo para observar comportamiento          │
└─────────────────────────────────────────────┘
```

Los entornos visuales son una **ventana de observación**, no el motor de entrenamiento. El agente entrena con datos de los entornos headless (que pueden ser cientos). Los visuales ejecutan la misma política para que el usuario vea cómo juega, pero no generan la mayoría de datos.

El slider de "entornos de entrenamiento" permite ir de 50 a 2000. El usuario controla cuántos entornos headless corren sin tocar el render.

### 2. Optimización para M4 Max

- **TF.js backend WebGPU**: El M4 Max tiene GPU potente. TF.js soporta WebGPU backend que usa Metal/MPS por debajo en macOS. Intentamos WebGPU primero, fallback a WebGL, fallback a CPU.
- **Batch inference**: Todas las acciones de los N entornos se predicen en una sola llamada `model.predict(tensorNx6)`. Con GPU, esto es mucho más rápido que N llamadas individuales.
- **64GB RAM**: Permite replay buffers grandes (500k+ experiencias) sin problema.

```javascript
// Inicialización con detección de backend
async function inicializarBackend() {
  try {
    await tf.setBackend('webgpu');
    await tf.ready();
  } catch {
    await tf.setBackend('webgl');
    await tf.ready();
  }
  console.log(`[DRL] Backend: ${tf.getBackend()}`);
}
```

### 3. Sistema de trazas para monitorización agéntica

El sistema deja trazas estructuradas que permiten analizar el progreso y proponer mejoras:

```javascript
// Traza cada N batches de entrenamiento
{
  timestamp: "2026-06-03T12:34:56",
  algoritmo: "dqn",
  paso: 15000,
  metricas: {
    loss: 0.0234,
    tdError: 0.15,
    rewardMedio100: 12.4,
    tasaExito100: 0.35,
    epsilon: 0.42,
    bufferSize: 28000,
    batchesEntrenados: 3750,
    ladrillosRotosMedio: 18.2
  },
  rendimiento: {
    experienciasPorSegundo: 4200,
    entornosActivos: 500,
    tiempoInferenciaMs: 2.3,
    tiempoEntrenamientoMs: 8.1,
    tensoresActivos: 142,
    backendGPU: "webgpu"
  }
}
```

Las trazas se almacenan en un buffer circular en memoria (últimas 1000 entradas). La consola del navegador las imprime cada 30 segundos. También hay un endpoint para exportar como JSON.

Esto permite:
- Ver si el reward sube o se estanca
- Detectar si el loss diverge
- Identificar cuellos de botella (inferencia vs entrenamiento)
- Verificar que no hay tensor leaks
- Ajustar hiperparámetros basándose en datos reales

### 4. Layout de la UI recompuesto

**Principio**: Lo que se mueve y es valioso arriba. Lo informativo/pedagógico abajo. Las capturas de pantalla deben mostrar lo interesante sin scroll.

```
┌──────────────────────────────────────────────────────────────┐
│  🧠 Arkanoid DRL Learning Lab     [▶ Entrenar] [Paso] [↻]  │
├────────────────────────┬─────────────────────────────────────┤
│                        │  MÉTRICAS CLAVE          INSPECTOR  │
│   Partida              │  ┌──────┬──────┐    ┌────────────┐ │
│   seleccionada         │  │Reward│ Loss │    │ Q-values / │ │
│                        │  │ +12  │0.023 │    │ Probs /    │ │
│   [Canvas 380×520]     │  ├──────┼──────┤    │ según algo │ │
│                        │  │ε/ent │TD err│    │            │ │
│                        │  │ 0.42 │ 0.15 │    │ ← [█▓] 1.2│ │
│                        │  ├──────┼──────┤    │ · [██] 0.8 │ │
│                        │  │Buffer│Éxito │    │ → [███] 2.6│ │
│                        │  │ 28k  │ 35%  │    └────────────┘ │
│                        │  └──────┴──────┘                   │
│                        │                                     │
│                        │  CURVAS DE ENTRENAMIENTO            │
│                        │  ┌─────────────┬─────────────┐     │
│                        │  │Reward/Éxito │ Loss/TD     │     │
│                        │  │ ╱‾‾         │      ‾‾╲    │     │
│                        │  │╱            │         ╲   │     │
│                        │  └─────────────┴─────────────┘     │
│                        │  ┌─────────────┬─────────────┐     │
│                        │  │ Buffer      │ Exploración │     │
│                        │  └─────────────┴─────────────┘     │
├────────────────────────┴─────────────────────────────────────┤
│  Transición actual: [s] → [a] → [r] → [s'] → [done]       │
├──────────────────────────────────────────────────────────────┤
│  Selector algoritmo   │  Control ejecución                   │
│  [DQN✓] [PPO] [SAC]  │  Velocidad ═══●═══ 3.0×             │
│  [World Model]        │  Entornos training: 500  Headless: ✓│
├──────────────────────────────────────────────────────────────┤
│  Vista entornos (5-15 mini-partidas visuales)               │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                  │
│  │Env01│ │Env02│ │Env03│ │Env04│ │Env05│  ...               │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                  │
├──────────────────────────────────────────────────────────────┤
│  Resumen conceptual          │  Flujo de datos              │
│  Model-free  [Usado]         │  Entornos → Exp → Buffer →  │
│  Replay buf  [Usado]         │  Modelo → Política mejorada  │
│  ...                         │                              │
├──────────────────────────────────────────────────────────────┤
│  Versiones pedagógicas (DQN básico, PPO, SAC, World Model) │
└──────────────────────────────────────────────────────────────┘
```

**Cambios respecto al layout actual**:
- Métricas clave + inspector del algoritmo → arriba a la derecha (zona caliente)
- Curvas de entrenamiento → zona central-derecha (visibles sin scroll)
- Selector de algoritmo + controles → zona media (se usan pero no se miran constantemente)
- Rejilla de entornos visuales → debajo de los controles
- Conceptos + pipeline + pedagógico → parte inferior (referencia, no cambia)

---

## Estructura de archivos

```
DRLArkanoid/
├── index.html
├── package.json              (vite + @tensorflow/tfjs)
├── vite.config.js
├── src/
│   ├── main.js               # Bootstrap + detección backend GPU
│   ├── nucleo/
│   │   ├── busEventos.js     # Pub/sub centralizado
│   │   ├── constantes.js     # Configuración global
│   │   ├── registroAlgoritmos.js  # Factory pattern
│   │   ├── gestorTensores.js # tf.tidy wrappers, leak detection
│   │   └── trazas.js         # Sistema de logging estructurado
│   ├── entorno/
│   │   ├── entornoArkanoid.js
│   │   └── gestorEntornos.js # Pool visual + pool headless
│   ├── agentes/
│   │   ├── agenteBase.js     # Interfaz abstracta
│   │   ├── agenteDQN.js      # Policy net + target net + replay
│   │   ├── agentePPO.js      # Actor + critic + GAE + clipped surrogate
│   │   ├── agenteSAC.js      # Actor + 2 critics + entropy + alpha
│   │   ├── agenteWorldModel.js  # Dynamics + reward + Dyna-Q
│   │   └── redes/
│   │       └── constructorRedes.js  # Factory para crear MLPs
│   ├── datos/
│   │   ├── replayBuffer.js        # Off-policy (DQN, SAC)
│   │   ├── replayPrioritario.js   # Con prioridad TD
│   │   ├── rolloutBuffer.js       # On-policy (PPO)
│   │   └── conceptos.js           # Tabla pedagógica
│   ├── entrenamiento/
│   │   ├── orquestador.js    # Training loop async, sin DOM
│   │   └── metricas.js       # Recolector de métricas reales
│   ├── ui/
│   │   ├── aplicacion.js     # Controlador UI (wiring con bus)
│   │   ├── renderizador.js   # Canvas del juego
│   │   ├── rejillaEntornos.js
│   │   ├── panelMetricas.js  # Adapta labels por algoritmo
│   │   ├── panelControl.js   # Velocidad, headless, entornos
│   │   ├── curvasEntrenamiento.js
│   │   ├── resumenConceptual.js
│   │   ├── panelTransicion.js
│   │   ├── flujoDatos.js
│   │   └── inspectores/
│   │       ├── baseInspector.js
│   │       ├── gestorInspectores.js
│   │       ├── inspectorDQN.js
│   │       ├── inspectorPPO.js
│   │       ├── inspectorSAC.js
│   │       └── inspectorWorldModel.js
│   └── css/
│       ├── base.css
│       ├── layout.css         # Nuevo layout recompuesto
│       ├── componentes.css
│       ├── juego.css
│       ├── metricas.css
│       └── inspectores.css
```

---

## Interfaz AgenteBase

```
seleccionarAcciones(estados[][])  → acciones[]
almacenarExperiencia(exp)         → void
entrenar()                        → Promise<{loss, ...}>
obtenerDatosInspeccion(estado[])  → Object  (distinto por algoritmo)
obtenerMetricas()                 → Object
finEpisodio(idEntorno)            → void
destruir() / reiniciar()          → void
```

Datos de inspección por algoritmo:
- **DQN**: `{qValores, tdError, bufferFill, targetSync, epsilon}`
- **PPO**: `{probabilidades, valorEstimado, ventaja, entropia, rolloutProgreso}`
- **SAC**: `{probabilidades, q1Valores, q2Valores, coefEntropia, temperatura}`
- **World Model**: `{estadoPredicho, estadoReal, errorModelo, pasosPlanning}`

---

## Fases de implementación

### Fase 1: Infraestructura + DQN real + nuevo layout
**Build:**
1. Setup Vite con TF.js y detección WebGPU/WebGL
2. Bus de eventos, constantes, registro de algoritmos, gestor de tensores, trazas
3. Entorno Arkanoid + gestor de entornos (pool visual + pool headless)
4. AgenteBase + AgenteDQN con redes reales
5. Orquestador con training loop desacoplado
6. Métricas reales
7. UI recompuesta (layout nuevo: métricas arriba-derecha, pedagógico abajo)
8. Inspector DQN
9. CSS modular

**Train + Tune (agéntico):**
10. Arrancar entrenamiento DQN con 200+ entornos headless
11. Leer trazas de consola: loss, reward medio, epsilon, throughput
12. Si reward no sube en 2 min → ajustar: lr, epsilon decay, gamma, capas de red
13. Verificar tensor leaks con tf.memory()
14. Iterar hasta que DQN aprenda (reward medio creciente, loss estable)
15. Guardar hiperparámetros que funcionan como configuración por defecto

### Fase 2: PPO real
**Build:** RolloutBuffer + AgentePPO + InspectorPPO + registrar

**Train + Tune:**
- Entrenar PPO, leer trazas
- Ajustar: rollout length, número de épocas, clip epsilon, coef entropía, lr
- PPO es on-policy: puede necesitar más pasos para converger
- Verificar que rollout se llena y vacía correctamente

### Fase 3: SAC Discreto real
**Build:** AgenteSAC + InspectorSAC + registrar

**Train + Tune:**
- Entrenar SAC, leer trazas
- Ajustar: tau (soft update), target entropy, lr del actor/critic/alpha
- Verificar que temperature α se ajusta automáticamente
- SAC discreto puede ser inestable: monitorizar divergencia de Q

### Fase 4: World Model real
**Build:** Red dinámica + AgenteWorldModel + InspectorWorldModel + registrar

**Train + Tune:**
- Entrenar modelo de dinámica primero, verificar que predice bien
- Luego entrenar policy con datos reales + imaginados
- Ajustar: horizonte de planning, ratio real/imaginado, capacidad del modelo
- Verificar model bias: ¿el modelo predice bien o falla?

### Fase 5: Pulido final
1. Labels adaptativos por algoritmo en métricas globales
2. Tooltips completos en español
3. Verificar tensor leaks en los 4 algoritmos
4. Responsive testing
5. Comparación de rendimiento entre los 4 algoritmos

---

## Verificación global

1. `npm run dev` → arranca, detecta WebGPU en M4 Max
2. **DQN**: 500 entornos headless, reward sube tras 2-5 min, trazas confirman convergencia
3. **PPO**: Reward sube, entropy baja gradualmente, rollouts se procesan correctamente
4. **SAC**: Temperature α se estabiliza, Q-values no divergen, reward sube
5. **World Model**: Modelo predice dinámica con error < 5%, policy mejora con datos imaginados
6. Cambiar entre algoritmos → inspector cambia, entrenamiento nuevo arranca limpio
7. `tf.memory().numTensors` estable tras reiniciar cualquier algoritmo
8. Captura de pantalla: juego + métricas + curvas visibles sin scroll
