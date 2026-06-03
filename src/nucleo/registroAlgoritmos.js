// ============================================================================
//  Registro de algoritmos (patrón factoría)
//  Cada algoritmo se registra con: id, nombre, descripción, factoría del agente,
//  factoría del inspector y metadatos pedagógicos. La UI y el orquestador
//  consultan el registro sin conocer las clases concretas.
// ============================================================================

const _registro = new Map();

/**
 * Registra un algoritmo.
 * @param {object} def
 * @param {string} def.id            identificador único (ver ALGORITMOS)
 * @param {string} def.nombre        nombre legible
 * @param {string} def.descripcion   descripción pedagógica corta
 * @param {string} def.familia       "model-free" | "model-based"
 * @param {string} def.politica      "off-policy" | "on-policy"
 * @param {Function} def.crearAgente (config) => AgenteBase
 * @param {Function} [def.crearInspector] (contenedor) => InspectorBase
 * @param {object} def.hiperparametros  hiperparámetros por defecto
 * @param {object} [def.etiquetasMetricas] sobreescribe labels de métricas globales
 */
export function registrarAlgoritmo(def) {
  if (!def || !def.id) throw new Error("registrarAlgoritmo: falta id");
  _registro.set(def.id, def);
}

/**
 * Asocia una factoría de inspector a un algoritmo ya registrado. Se llama solo
 * en el navegador (los inspectores tocan el DOM), manteniendo el registro de
 * agentes libre de dependencias del DOM para poder usarlo en Node.
 */
export function registrarInspector(id, crearInspector) {
  const def = _registro.get(id);
  if (def) def.crearInspector = crearInspector;
}

export function obtenerAlgoritmo(id) {
  const def = _registro.get(id);
  if (!def) throw new Error(`Algoritmo no registrado: ${id}`);
  return def;
}

export function tieneAlgoritmo(id) {
  return _registro.has(id);
}

export function listarAlgoritmos() {
  return [..._registro.values()];
}

/**
 * Crea un agente para el algoritmo indicado, mezclando los hiperparámetros por
 * defecto con los sobreescritos que se pasen.
 */
export function crearAgente(id, hiperparametrosOverride = {}) {
  const def = obtenerAlgoritmo(id);
  const hp = { ...def.hiperparametros, ...hiperparametrosOverride };
  return def.crearAgente(hp);
}
