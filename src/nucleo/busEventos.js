// ============================================================================
//  Bus de eventos centralizado (pub/sub)
//  Desacopla el motor de entrenamiento de la interfaz: el orquestador emite
//  eventos y la UI se suscribe, sin que ninguno conozca al otro directamente.
// ============================================================================

export const EVENTOS = Object.freeze({
  // Ciclo de vida del entrenamiento
  ENTRENAMIENTO_INICIADO: "entrenamiento:iniciado",
  ENTRENAMIENTO_PAUSADO: "entrenamiento:pausado",
  ENTRENAMIENTO_REINICIADO: "entrenamiento:reiniciado",
  PASO_COMPLETADO: "entrenamiento:paso",
  LOTE_COMPLETADO: "entrenamiento:lote",
  // Datos
  METRICAS_ACTUALIZADAS: "metricas:actualizadas",
  TRAZA_REGISTRADA: "traza:registrada",
  TRANSICION_MUESTRA: "transicion:muestra",
  INSPECCION_ACTUALIZADA: "inspeccion:actualizada",
  // Configuración
  ALGORITMO_CAMBIADO: "config:algoritmo",
  VELOCIDAD_CAMBIADA: "config:velocidad",
  ENTORNOS_CAMBIADOS: "config:entornos",
  HIPERPARAMETRO_CAMBIADO: "config:hiperparametro",
  // Sistema
  BACKEND_LISTO: "sistema:backend",
  ERROR: "sistema:error",
});

export class BusEventos {
  constructor() {
    this._manejadores = new Map();
  }

  /**
   * Suscribe un manejador a un evento. Devuelve una función para desuscribir.
   */
  suscribir(evento, manejador) {
    if (!this._manejadores.has(evento)) {
      this._manejadores.set(evento, new Set());
    }
    this._manejadores.get(evento).add(manejador);
    return () => this.desuscribir(evento, manejador);
  }

  desuscribir(evento, manejador) {
    const conjunto = this._manejadores.get(evento);
    if (conjunto) conjunto.delete(manejador);
  }

  /**
   * Emite un evento con datos. Los errores en un manejador no detienen al resto.
   */
  emitir(evento, datos) {
    const conjunto = this._manejadores.get(evento);
    if (!conjunto) return;
    for (const manejador of conjunto) {
      try {
        manejador(datos);
      } catch (err) {
        // Evitamos recursión infinita si el propio manejador de ERROR falla.
        if (evento !== EVENTOS.ERROR) {
          console.error(`[Bus] Error en manejador de "${evento}":`, err);
        }
      }
    }
  }

  limpiar() {
    this._manejadores.clear();
  }
}

// Instancia global compartida por toda la aplicación.
export const bus = new BusEventos();
