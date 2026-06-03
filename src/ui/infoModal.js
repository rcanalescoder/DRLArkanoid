// ============================================================================
//  Pop-up de información rica.
//  Al pulsar cualquier icono ℹ con [data-info="id"] se abre un modal con
//  cabecera de color por categoría, secciones, fórmula, ejemplo y datos reales.
//  Cierra con la X, clic fuera o Escape.
// ============================================================================

import { INFO, colorCategoria, colorSoftCategoria } from "../datos/infoContenido.js";

export function inicializarInfoModal() {
  const overlay = document.createElement("div");
  overlay.className = "info-overlay";
  overlay.innerHTML = `
    <div class="info-modal" role="dialog" aria-modal="true">
      <button class="info-cerrar" aria-label="Cerrar">✕</button>
      <div class="info-cuerpo"></div>
    </div>`;
  document.body.appendChild(overlay);

  const modal = overlay.querySelector(".info-modal");
  const cuerpo = overlay.querySelector(".info-cuerpo");
  const cerrar = () => overlay.classList.remove("abierto");

  function abrir(id) {
    const d = INFO[id];
    if (!d) return false;
    modal.style.setProperty("--c", colorCategoria(d.categoria));
    modal.style.setProperty("--cs", colorSoftCategoria(d.categoria));
    cuerpo.innerHTML = render(d);
    overlay.classList.add("abierto");
    modal.scrollTop = 0;
    return true;
  }

  overlay.addEventListener("click", (e) => { if (e.target === overlay) cerrar(); });
  overlay.querySelector(".info-cerrar").addEventListener("click", cerrar);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrar(); });

  // Delegación global: clic en cualquier icono de info con data-info.
  document.addEventListener(
    "click",
    (e) => {
      const icono = e.target.closest && e.target.closest(".info[data-info]");
      if (icono) {
        e.preventDefault();
        e.stopPropagation();
        abrir(icono.getAttribute("data-info"));
      }
    },
    true // captura: gana a otros handlers (p.ej. el clic de la tarjeta de algoritmo)
  );

  return { abrir, cerrar };
}

function render(d) {
  const secs = (d.secciones || [])
    .map((s) => `<h3 class="im-h">${s.h}</h3><p class="im-p">${s.cuerpo}</p>`)
    .join("");
  const formula = d.formula ? `<div class="im-formula">${d.formula}</div>` : "";
  const ejemplo = d.ejemplo ? `<div class="im-ejemplo"><b>Ejemplo.</b> ${d.ejemplo}</div>` : "";
  const dato = d.dato ? `<div class="im-dato">📊 &nbsp;${d.dato}</div>` : "";
  return `
    <div class="im-cab">
      <span class="im-emoji">${d.emoji || "ℹ️"}</span>
      <div class="im-tit">
        <span class="im-chip">${d.categoria}</span>
        <h2 class="im-titulo">${d.titulo}</h2>
      </div>
    </div>
    <div class="im-inner">
      ${d.resumen ? `<p class="im-resumen">${d.resumen}</p>` : ""}
      ${secs}${formula}${ejemplo}${dato}
    </div>`;
}
