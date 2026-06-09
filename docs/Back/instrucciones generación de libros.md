# Instrucciones generación de libros

Este documento define el protocolo para crear o rediseñar un manual técnico-pedagógico de un proyecto, con el mismo enfoque visual, didáctico y verificable usado en la versión Codex de `report_v3`.

La idea es que, en otro proyecto, baste con decir:

> Lee `docs/instrucciones generación de libros.md` y ejecútalo sobre la documentación de este proyecto.

## Objetivo

Crear un libro/manual que sea:

- Pedagógico para un ingeniero junior que no domina aún la disciplina.
- Visual, pero no decorativo: cada imagen debe enseñar algo.
- Homogéneo: todos los capítulos deben parecer parte del mismo sistema.
- Trazable: cada cifra, gráfico o captura debe indicar qué demuestra y qué no.
- Verificado: HTML, imágenes y PDF deben pasar QA visual antes de darse por terminados.
- Conservador con el original: nunca se destruye ni se sobrescribe la documentación base sin aprobación explícita.

## Archivos de trabajo esperados

Adaptar nombres al proyecto, pero mantener esta lógica:

- Original intocable: `docs/report.html` o equivalente.
- Versión de trabajo: `docs/report_version_codex.html`.
- Auditoría pedagógica: `docs/auditoria_pedagogica_visual_codex.md`.
- Plan visual: `docs/plan_visual_codex.md`.
- Seguimiento QA: `docs/seguimiento_visual_codex.md`.
- Assets: `docs/assets/`.
- QA visual: `docs/qa_visual_codex/`.
- PDF final: `docs/<nombre-del-manual>-version-codex.pdf`.

Regla: si el original se llama `report_v3.html`, la copia debe llamarse algo como `report_v3_version_codex.html`.

## Secuencia de trabajo

1. Auditar el documento original.
2. Crear una copia de trabajo.
3. Revisar la linealidad pedagógica de todos los capítulos.
4. Crear un plan visual por capítulo.
5. Crear un registro persistente de QA.
6. Diseñar e integrar visuales por lotes.
7. Renderizar cada visual a PNG y revisar contact sheets.
8. Comprobar rutas del HTML.
9. Generar el PDF solo cuando el lote acordado esté completo.
10. Renderizar páginas del PDF y revisar visualmente.
11. Actualizar el seguimiento.
12. Entregar enlaces a HTML, PDF, seguimiento y QA.

Si el usuario pide explícitamente no generar PDF hasta el final, trabajar solo con HTML + PNG QA y hacer una única generación final.

## Auditoría pedagógica

Antes de diseñar imágenes, leer todos los apartados de texto y evaluar:

- Si el capítulo define los términos antes de usarlos.
- Si la progresión va de intuición a mecanismo, de mecanismo a evidencia, y de evidencia a límites.
- Si un lector junior puede seguirlo sin conocimiento experto previo.
- Si hay fórmulas sin explicación previa.
- Si hay resultados sin protocolo.
- Si hay capturas sin decir qué mirar.
- Si hay gráficos sin explicar eje X, eje Y, escala, banda, colapso o interpretación.
- Si hay conceptos repetidos con nombres o colores inconsistentes.
- Si el cierre resume la idea o solo termina el texto.

El resultado debe registrarse en `auditoria_pedagogica_visual_codex.md` con una tabla:

```md
| Sección | Linealidad para junior | Ampliaciones textuales recomendadas | Visuales/infografías que encajan |
|---|---|---|---|
```

## Interfaz pedagógica común

Cada capítulo debe seguir, en lo posible, esta anatomía:

1. Pregunta inicial: qué problema va a resolver el capítulo.
2. Mapa visual de la idea si hay varias piezas.
3. Intuición o escena concreta.
4. Mecanismo: definición, flujo, fórmula o arquitectura.
5. Traducción al proyecto: cómo aparece en el sistema real.
6. Mini-ejemplo: caso numérico, evento, transición o situación concreta.
7. Evidencia: captura, gráfico, tabla o resultado.
8. Qué no demuestra: límite explícito de la afirmación.
9. Error común: confusión probable del lector.
10. Quédate con esto: síntesis breve.
11. Autocomprobación: 2-4 preguntas.
12. Ejercicio: una práctica con pista y respuesta.
13. Bloque experto: rigor formal para lectores avanzados.

No todos los capítulos necesitan todas las piezas, pero la sensación de interfaz debe ser estable.

## Plantillas por tipo de capítulo

### Capítulo conceptual

Usar esta progresión:

- Mapa de la idea.
- Analogía o escena.
- Definición formal.
- Traducción al proyecto.
- Mini-ejemplo.
- Trampa conceptual.
- Infografía de cierre tipo panel.

Visuales recomendados: 2-4 por capítulo, más 1 infografía de cierre tipo panel.

### Capítulo de algoritmo, método o arquitectura

Usar siempre las mismas ranuras visuales:

1. Ficha de identidad: familia, qué aprende, entradas, salidas, coste, resultado headline.
2. Diagrama mental: la intuición del método.
3. Pipeline de entrenamiento o ejecución.
4. Arquitectura: entradas, ramas, fusión, salidas.
5. Captura o inspector real anotado, si existe.
6. Curva o resultado anotado.
7. Infografía de cierre tipo panel: cuándo funciona, cuándo falla, qué enseña.

Visuales recomendados: 4-7 por capítulo si es un algoritmo central.

### Capítulo de datos, resultados o medición

Antes de cualquier gráfico, explicar:

- Qué mide.
- Qué no mide.
- Eje X.
- Eje Y.
- Unidad.
- Split o conjunto de evaluación.
- Número de semillas, muestras o repeticiones.
- Si hay banda, qué significa.
- Qué sería una lectura equivocada.

Visuales recomendados: 3-6 por capítulo, incluyendo al menos:

- Una guía de lectura.
- Un gráfico o tabla de resultado.
- Una advertencia sobre límites o colapsos.
- Un resumen del veredicto.

### Capítulo de producto, interfaz o demo

Conservar capturas reales cuando aporten evidencia.

Cada captura debe llevar:

- Callouts o numeración.
- Caption que diga qué mirar.
- Separación entre "esto enseña el mecanismo" y "esto no demuestra el resultado final".

Visuales recomendados: 3-6 capturas o composiciones anotadas.

### Capítulo de cierre

Debe ser más editorial y memorable.

Incluir:

- Poster final del viaje completo.
- Lecciones transferibles.
- Glosario visual o mapa mental.
- Ruta reproducible desde código/datos hasta libro.

Visuales recomendados: 3-5.

## Cantidad de imágenes

Regla práctica:

- Cada capítulo debe tener al menos 2 visuales si introduce conceptos.
- Cada capítulo denso debe tener 4-7 visuales.
- Cada 1-2 páginas debería aparecer una ayuda visual, salvo en anexos muy textuales.
- Cada capítulo/sección debe cerrar con una infografía blanca de síntesis tipo panel.
- Cada parte grande debe cerrar con una infografía blanca de síntesis.
- No añadir imágenes decorativas. Si no orienta, explica, compara, mide, advierte o resume, sobra.

Funciones válidas de una imagen:

- Orientar: mapa, ruta, índice visual.
- Explicar: mecanismo, flujo, arquitectura.
- Comparar: antes/después, A/B, familias.
- Medir: gráfico, tabla, heatmap, curva.
- Advertir: error común, qué no demuestra, límite.
- Resumir: ficha final, poster, checklist.

## Infografía de cierre tipo panel

Al final de cada capítulo/sección debe haber una infografía de síntesis con fondo blanco, estilo panel editorial. No debe ser una tarjeta simple ni una lista de bullets con decoración: debe poder leerse como una página visual autónoma.

La regla de cierre no debe producir monotonía. Mantener un sistema visual común no significa repetir una plantilla. El libro debe sentirse coherente, pero cada sección debe elegir la forma visual que mejor explique su contenido.

Estructura recomendada:

1. Título grande: expresa la conclusión pedagógica.
2. Subtítulo breve: conecta la conclusión con el proyecto.
3. Dos bloques superiores: idea central y mecanismo principal.
4. Tres o cuatro tarjetas intermedias: conceptos, métricas, pasos, errores o variantes.
5. Mini-flujo, mini-ejemplo o mini-gráfico: algo que explique una relación.
6. Franja inferior: conclusión fuerte en una o dos frases.

El estilo debe recordar a una infografía docente completa:

- Jerarquía clara de lectura.
- Iconos grandes y funcionales.
- Bloques con bordes finos por color funcional.
- Mucho aire blanco.
- Paleta consistente.
- Textos breves dentro de cajas.
- Conclusión visible sin leer todo el capítulo.

Regla editorial añadida tras la revisión visual de Codex v4:

- Preferir fondo blanco real, no fondos pastel extensos. En particular, evitar que una infografía quede dominada por verde claro, beige, morado pálido o cualquier tinte de bloque que haga parecer la página una sucesión de tarjetas.
- Usar azul editorial como columna vertebral: números de sección, bordes principales, títulos y flechas estructurales. Los colores secundarios deben destacar funciones concretas: valor, política, recompensa, riesgo, evidencia, etc.
- Estructurar muchas infografías en secciones numeradas claras (`1`, `2`, `3`, opcionalmente `4`), como una página docente autónoma: definición, arquitectura/flujo, funcionamiento/principios y ejemplos o checklist.
- Cada infografía debe tener una pieza central con peso visual: arquitectura, red, flujo, mapa, tablero, gráfica, matriz, dashboard, ejemplo antes/después o mini-experimento. No basta con cuatro cajas de texto.
- Los iconos y mini-diagramas deben explicar, no decorar. Si un icono no ayuda a recordar el mecanismo, sustituirlo por una micrográfica, una red, un tablero, una fórmula o una comparación.
- Para documentación técnica con mucho texto en español, generar la composición de forma controlada (HTML/SVG/canvas renderizado a PNG) cuando haga falta precisión tipográfica. Aunque el HTML use PNG, conservar una fuente editable para iterar.
- Revisar siempre a tamaño completo y en hoja de contacto. No aceptar imágenes donde los títulos pisen iconos, fórmulas rocen bordes, o textos queden por debajo de cajas.

Plantilla de contenido:

```md
Título: <qué debe recordar el lector>
Subtítulo: <por qué importa en este proyecto>
Bloque A: objetivo o problema
Bloque B: mecanismo o solución
Tarjetas: 3-4 piezas clave
Mini-flujo: entrada -> proceso -> salida
Franja final: conclusión práctica
```

Regla de calidad: si la infografía no funciona al recortarla y verla fuera del libro, todavía no está suficientemente clara.

## Variedad visual sin perder coherencia

La coherencia del libro viene de:

- Fondo blanco.
- Tipografía común.
- Paleta funcional.
- Iconografía limpia.
- Espaciado y bordes consistentes.
- Misma forma de nombrar variables, métricas y partes del sistema.
- Misma disciplina de QA visual.

La variedad viene de elegir modelos visuales distintos según la función pedagógica:

| Arquetipo | Sirve para | Ejemplos |
|---|---|---|
| Mapa de sistema | Relacionar piezas. | Arquitectura del proyecto, protocolo, familias de algoritmos. |
| Radiografía/anatomía | Abrir una caja negra. | Red neuronal, actor-crítico, SAC, World Model. |
| Flujo secuencial | Explicar pasos. | Transición, replay, rollout, pipeline de datos. |
| Storyboard | Mostrar una historia. | Episodio, exploración, error acumulado, decisión de la pala. |
| Antes/después | Enseñar desbloqueo. | Formulación mala vs buena, ciego vs estado completo. |
| Matriz comparativa | Comparar variantes. | Algoritmos, métricas, splits, tradeoffs. |
| Dashboard anotado | Guiar una interfaz real. | App, inspector, curvas en vivo. |
| Gráfica explicada | Leer evidencia. | Curvas, barras, heatmaps, semillas, colapsos. |
| Microscopio de fórmula | Hacer legible una ecuación. | Bellman, retorno, TD-error, PPO clip. |
| Diagnóstico | Pasar de síntoma a causa. | Tres muros, colapso, reward hacking. |
| Ruta reproducible | Mostrar trazabilidad. | Código -> entrenamiento -> ledger -> figura -> libro. |
| Postal de cierre | Fijar una idea memorable. | Final de parte, glosario, lecciones transferibles. |

Reglas anti-monotonía:

- No usar el mismo arquetipo en más de dos cierres consecutivos.
- Si una figura solo enumera, añadir una relación visual: eje, flecha, matriz, comparación o mini-ejemplo.
- Si el capítulo explica un mecanismo interno, priorizar radiografía, flujo o microscopio.
- Si el capítulo explica resultados, priorizar gráfica explicada, matriz o dashboard anotado.
- Si el capítulo explica una historia causal, priorizar antes/después, diagnóstico o storyboard.
- Si el capítulo cierra una parte, usar una postal editorial o mapa de sistema más ambicioso.
- Antes de crear un lote, hacer un inventario de arquetipos para comprobar que no todo son tarjetas.

El objetivo no es "rellenar de imágenes", sino construir un sistema explicativo sorprendente: cada visual debe aportar una lectura que el texto por sí solo no daba.

## Estilo visual

Todas las infografías nuevas deben cumplir:

- Fondo blanco.
- Titular interpretativo.
- Subtítulo breve que diga la idea.
- Tarjetas simples.
- Bordes suaves.
- Sombras sutiles.
- Texto corto, partido manualmente si hace falta.
- Una función pedagógica clara.
- Misma tipografía del informe.
- Sin textos fuera de cajas.
- Sin solapes entre texto, iconos, flechas, ejes o captions.
- Sin fondos oscuros salvo franjas de cierre muy controladas.
- Sin gradientes decorativos ni ruido visual.

Paleta funcional recomendada:

- Azul: intuición, ruta, idea base.
- Cian: traducción al proyecto, sistema, juego, flujo real.
- Violeta: mecanismo técnico, fórmula, red, algoritmo.
- Verde: evidencia, resultado, test, reproducibilidad.
- Ámbar/naranja: qué mirar, advertencia suave, lectura de gráfico.
- Rojo/rosa: error común, colapso, trampa conceptual, resultado negativo.
- Gris/pizarra: límite, experto, formalización, reproducibilidad.

No usar colores como decoración libre. Cada color debe significar algo.

## Reglas para texto dentro de imágenes

Esta es una de las reglas más importantes.

- No meter párrafos largos en tarjetas.
- Usar frases de 3-8 palabras cuando sea posible.
- Si una línea supera el ancho de la tarjeta, partirla manualmente.
- Validar siempre en PNG y en PDF, no solo mirando el SVG.
- Los títulos largos deben dividirse en dos líneas.
- Las etiquetas de ejes deben tener posición fija y no depender de la altura de barras.
- No colocar texto dentro de botones, badges o cápsulas si no hay aire suficiente.
- El caption puede llevar la explicación larga; la figura debe llevar la idea visual.

Ejemplo de criterio:

Mal:

```text
La formulación puso el techo; el algoritmo solo pudo subir cuando el techo dejó de estar cerrado.
```

Mejor:

```text
La formulación puso el techo.
El algoritmo solo pudo subir cuando el techo dejó de estar cerrado.
```

## Tipos de assets aceptados

No limitarse a SVG.

Se puede usar:

- SVG para diagramas, fichas y flujos.
- PNG para composiciones rasterizadas.
- Gráficos replotteados desde datos.
- Capturas reales anotadas.
- Infografías generadas como imagen si aportan más calidad que un SVG.
- Tablas visuales.
- Contact sheets de QA.

Elegir el formato por resultado, no por comodidad.

## Capturas reales

Conservar capturas reales cuando:

- Enseñan el producto o laboratorio real.
- Muestran UI, inspector, dashboard, modelo en acción o resultado observable.
- Sirven como evidencia de que el sistema existe.

Pero deben estar anotadas o acompañadas por captions claros:

- Qué mirar.
- Qué parte de la UI corresponde a qué concepto.
- Qué no se puede concluir de una captura aislada.
- Dónde está el resultado protocolizado.

## Gráficos de datos

Siempre que sea posible, replottear gráficos desde datos fuente.

Un gráfico aceptable debe incluir:

- Título interpretativo.
- Unidad.
- Contexto experimental.
- Semillas o tamaño de muestra.
- Split o conjunto de evaluación.
- Bandas o dispersión si existen.
- Etiquetas legibles en PDF.
- Caption con lectura y límite.

No aceptar un gráfico solo porque "se ve bonito".

Preguntas obligatorias:

- ¿Qué demuestra?
- ¿Qué no demuestra?
- ¿Cuál es la métrica?
- ¿Cuál es el protocolo?
- ¿Hay varianza, colapsos o incertidumbre?
- ¿Qué lectura equivocada evitaría?

## QA visual obligatorio

Una imagen no está terminada hasta pasar QA.

Rutina para cada lote:

1. Renderizar SVG/HTML/figura a PNG.
2. Crear contact sheet.
3. Revisar visualmente.
4. Corregir overflow, solapes, cortes, escalas, captions o mala jerarquía.
5. Re-renderizar.
6. Integrar en HTML.
7. Comprobar rutas.
8. Generar PDF cuando toque.
9. Renderizar páginas PDF.
10. Revisar páginas PDF.
11. Registrar en `seguimiento_visual_codex.md`.

Comandos orientativos:

```bash
mkdir -p docs/qa_visual_codex/<capitulo>

for f in docs/assets/codex_<capitulo>_*.svg; do
  base=$(basename "$f" .svg)
  rsvg-convert -w 1600 "$f" -o "docs/qa_visual_codex/<capitulo>/${base}.png"
done
```

Para generar contact sheets, usar un script con PIL o herramienta equivalente.

Para renderizar páginas de PDF:

```bash
gs -q -dNOPAUSE -dBATCH -sDEVICE=png16m -r120 \
  -dFirstPage=<inicio> -dLastPage=<fin> \
  -sOutputFile='docs/qa_visual_codex/<capitulo>/pdf_pages/page-%03d.png' \
  docs/<manual>-version-codex.pdf
```

## Comprobaciones HTML

Antes del PDF, ejecutar una comprobación de rutas:

```bash
node - <<'NODE'
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync('docs/report_version_codex.html', 'utf8');
const imgs = [...html.matchAll(/<img\s+[^>]*src="([^"]+)"/g)].map(m => m[1]);
const missing = imgs.filter(src => !fs.existsSync(path.join('docs', src)));
console.log(JSON.stringify({
  sections: (html.match(/<section class="section">/g) || []).length,
  total_images: imgs.length,
  missing_count: missing.length,
  missing
}, null, 2));
NODE
```

Aceptar solo si `missing_count` es 0.

También buscar restos antiguos que se debían sustituir:

```bash
rg -n 'assets/(vis_|dg_|gridcard_)|figura_antigua|imagen_obsoleta' docs/report_version_codex.html
```

Si aparecen, decidir si se conservan por evidencia o si deben retirarse.

## PDF

Reglas:

- No generar PDF hasta terminar el lote acordado.
- Si el usuario pide "solo al final", no generar PDFs intermedios.
- Al generar, usar siempre la versión Codex del HTML, no el original.
- Tras generar, renderizar páginas afectadas y revisar visualmente.
- Si se detecta un fallo real en PDF, corregir HTML/SVG, regenerar PDF y repetir QA.

Ejemplo:

```bash
node scripts/generarPDF.mjs \
  docs/report_version_codex.html \
  docs/<manual>-version-codex.pdf
```

## Registro persistente

Crear y mantener `docs/seguimiento_visual_codex.md`.

Debe contener:

- Objetivo activo.
- Documento original.
- Documento Codex.
- Criterios de aceptación.
- Rutina de QA.
- Estado por fase/capítulo.
- Registro de assets.
- Incidencias corregidas.
- Rango de páginas revisadas en PDF.
- Log cronológico.

Tabla mínima:

```md
| Fase | Alcance | Estado | Notas |
|---|---|---|---|
| Parte I | ... | En curso | ... |
```

Tabla de assets:

```md
| Asset | Render QA | Estado | Incidencias | Acción |
|---|---|---|---|---|
```

Estados recomendados:

- Pendiente.
- En curso.
- QA PNG completado.
- Integrado.
- Validado v1.
- Requiere corrección.

No marcar `Validado v1` si no se ha revisado en PDF, salvo que el usuario haya pedido explícitamente no generar PDF todavía; en ese caso usar `QA PNG completado`.

## Criterios de aceptación final

El libro se puede entregar cuando:

- Existe versión Codex separada del original.
- El original no fue modificado sin permiso.
- Todas las imágenes nuevas tienen fondo blanco salvo excepciones justificadas.
- No hay textos fuera de cajas.
- No hay solapes incoherentes.
- Todas las rutas de imágenes existen.
- Las capturas reales tienen captions útiles o anotaciones.
- Los gráficos tienen lectura y contexto.
- Las partes/capítulos están registrados en seguimiento.
- El PDF final fue generado.
- Las páginas PDF afectadas fueron renderizadas y revisadas.
- El seguimiento indica páginas revisadas.

## Checklist final

Antes de responder al usuario:

```bash
# 1. Rutas
node <script-de-comprobacion-de-imagenes>

# 2. Restos antiguos
rg -n 'assets/(vis_|dg_|gridcard_)|imagen_antigua' docs/report_version_codex.html

# 3. PDF
ls -lh docs/*version-codex.pdf

# 4. QA
ls -lh docs/qa_visual_codex/**/contact_sheet*.png

# 5. Estado git
git status --short
```

En la respuesta final, incluir:

- HTML Codex.
- PDF Codex.
- Seguimiento QA.
- Contact sheets principales.
- Qué se validó.
- Qué quedó pendiente, si algo quedó pendiente.

## Principios de diseño pedagógico

Recordar siempre:

- Una explicación buena es lineal antes de ser completa.
- Un junior necesita saber qué mirar antes de mirar.
- Una cifra sin protocolo no es evidencia.
- Una captura sin lectura es decoración.
- Una fórmula sin intuición previa es una barrera.
- Un gráfico sin límite invita a exagerar.
- Un capítulo largo necesita checkpoints visuales.
- La homogeneidad reduce carga cognitiva.
- La imagen debe descargar memoria de trabajo, no añadir ruido.

## Prompts operativos reutilizables

### Auditoría inicial

```text
Lee el documento base y genera una auditoría pedagógica para un ingeniero junior.
Indica por capítulo si la explicación es lineal, qué habría que ampliar y qué visuales ayudarían.
No modifiques el original. Crea una versión Codex separada y un registro de seguimiento.
```

### Plan visual

```text
Crea un plan visual completo por capítulos.
Para cada capítulo indica qué imágenes conservarías, cuáles sustituirías, qué infografías faltan y qué función pedagógica tendrá cada una.
Todas las infografías nuevas deben tener fondo blanco y pasar QA visual.
```

### Ejecución

```text
Ejecuta el plan por lotes.
Por cada lote: crea imágenes, renderízalas a PNG, revisa contact sheet, corrige desbordes, integra en HTML, comprueba rutas y actualiza seguimiento.
No generes PDF hasta que termine el lote acordado.
```

### Cierre

```text
Genera el PDF final.
Renderiza las páginas afectadas, revisa visualmente que no haya textos fuera de caja, cortes, captions perdidos ni solapes.
Actualiza el seguimiento y entrégame enlaces al HTML, PDF, QA y registro.
```
