// Shim de compatibilidad: Node ≥23 eliminó las util.is* (deprecadas desde Node 4),
// pero @tensorflow/tfjs-node@4.22 las sigue usando en su backend nativo y peta
// (util.isNullOrUndefined is not a function). Reponemos las que usa, sin efectos
// colaterales (solo se añaden si faltan). Importar ANTES que @tensorflow/tfjs-node.
import util from "node:util";

const S = {
  isNullOrUndefined: (v) => v === null || v === undefined,
  isNull: (v) => v === null,
  isUndefined: (v) => v === undefined,
  isArray: Array.isArray,
  isBoolean: (v) => typeof v === "boolean",
  isNumber: (v) => typeof v === "number",
  isString: (v) => typeof v === "string",
  isSymbol: (v) => typeof v === "symbol",
  isObject: (v) => v !== null && typeof v === "object",
  isFunction: (v) => typeof v === "function",
  isPrimitive: (v) => v === null || (typeof v !== "object" && typeof v !== "function"),
  isBuffer: (v) => Buffer.isBuffer(v),
  isRegExp: (v) => v instanceof RegExp,
  isDate: (v) => v instanceof Date,
  isError: (v) => v instanceof Error,
};
for (const k of Object.keys(S)) if (typeof util[k] !== "function") util[k] = S[k];
