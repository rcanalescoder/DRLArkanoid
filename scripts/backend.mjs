// Selector de backend para los harness de Node. Intenta el backend NATIVO
// 'tensorflow' (@tensorflow/tfjs-node, libtensorflow C++ multihilo → mucho más
// rápido que el JS puro, sobre todo en conv) y cae a 'cpu' (JS) si no está
// disponible/usable. Importa el shim de compat (Node nuevo) antes que tfjs-node.
//
// Nota GPU: en Mac (Apple Silicon) NO hay backend GPU para TF.js en Node
// (tfjs-node-gpu es solo CUDA). La GPU Metal solo se alcanza vía WebGPU en el
// NAVEGADOR (la app la usa). Esto acelera la CPU, no usa la GPU.
import "./_compat_node.mjs";
import * as tf from "@tensorflow/tfjs";

export async function backendRapido() {
  try {
    await import("@tensorflow/tfjs-node"); // registra 'tensorflow' en el core compartido
    await tf.setBackend("tensorflow");
    await tf.ready();
    // Sonda: ejecuta una op real; si peta (p. ej. Node demasiado nuevo) caemos a cpu.
    tf.tidy(() => tf.matMul(tf.ones([2, 2]), tf.ones([2, 2])).dataSync());
    if (tf.getBackend() === "tensorflow") return "tensorflow (nativo · multihilo)";
  } catch (e) {
    console.error("[backend] tfjs-node no usable → cpu:", (e.message || "").split("\n")[0]);
  }
  await tf.setBackend("cpu");
  await tf.ready();
  return "cpu (JS puro)";
}
