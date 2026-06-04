Pégale el protocolo como instrucción vinculante (está en docs/PROTOCOLO-ejecucion-honesta.md, o re-pega el original).
Dile que lea ESTADO-PROTOCOLO.md primero — es el punto exacto de continuación.
Avisos que ya están escritos ahí, pero por si acaso:
No re-ejecutar freeze (cambiaría el frozen_hash). El protocolo ya está congelado.
Tras clonar, que verifique frozen_hash=a1ab7ce18d7bad6b con status.
MPS↔CUDA dan números distintos por semilla: es esperado y honesto (se reporta distribución; el ledger registra el framework/device real de cada run).
Resumen de dónde quedamos
Fase A (infra de honestidad) ✅ y Fase B (congelado) ✅ — commiteadas y en protocolo-v1.
Fase C: lista para arrancar. C6 (comparativa de los 5 modelos × 5 semillas × 3 presupuestos) es turnkey con tanda. C1–C5 (análisis de fallos PPO, variantes de representación DQN, ablación, SAC-pure vs hybrid, caracterización WM) están por implementar — descritos en ESTADO-PROTOCOLO.md con sus artefactos de salida.
Decisiones congeladas: timeout base constante 7200 · semillas [0–4] · presupuestos 700k/1.5M/3M · eval greedy · colapso <10%.
Lo único pendiente cuando retomes (aquí o allí) es lo que rechazaste hace un momento: la calibración para medir el coste real antes de soltar la tanda completa. En la otra máquina, más potente, puedes saltártela y lanzar tanda directamente, o medir una run con multiseed dqn 1500000 0 primero.