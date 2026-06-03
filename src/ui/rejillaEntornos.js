// ============================================================================
//  Rejilla de entornos visuales — mini-canvases que dibujan el pool visual
// ============================================================================

import { dibujarEntorno } from "./renderizador.js";

export class RejillaEntornos {
  constructor(contenedor, onSeleccionar) {
    this.contenedor = contenedor;
    this.onSeleccionar = onSeleccionar;
    this.celdas = []; // { raiz, canvas, ctx, reward }
    this.seleccionado = 0;
  }

  sincronizar(envs) {
    // Crear celdas que falten.
    while (this.celdas.length < envs.length) {
      const i = this.celdas.length;
      const raiz = document.createElement("div");
      raiz.className = "mini-env";
      const canvas = document.createElement("canvas");
      canvas.width = 90;
      canvas.height = 120;
      const etiqueta = document.createElement("span");
      etiqueta.className = "etiqueta";
      etiqueta.textContent = `env ${i}`;
      const reward = document.createElement("span");
      reward.className = "reward";
      reward.textContent = "0.00";
      raiz.append(canvas, etiqueta, reward);
      raiz.addEventListener("click", () => this._seleccionar(i));
      this.contenedor.appendChild(raiz);
      this.celdas.push({ raiz, canvas, ctx: canvas.getContext("2d"), reward });
    }
    // Eliminar celdas sobrantes.
    while (this.celdas.length > envs.length) {
      const c = this.celdas.pop();
      c.raiz.remove();
    }
    this._marcarSeleccion();
  }

  _seleccionar(i) {
    this.seleccionado = i;
    this._marcarSeleccion();
    this.onSeleccionar?.(i);
  }

  _marcarSeleccion() {
    this.celdas.forEach((c, i) =>
      c.raiz.classList.toggle("seleccionado", i === this.seleccionado)
    );
  }

  render(envs) {
    for (let i = 0; i < this.celdas.length && i < envs.length; i++) {
      dibujarEntorno(this.celdas[i].ctx, envs[i], { mini: true });
      this.celdas[i].reward.textContent = envs[i].recompensaEpisodio.toFixed(2);
    }
  }
}
