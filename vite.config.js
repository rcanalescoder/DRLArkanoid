import { defineConfig } from "vite";

// Configuración mínima. WebGPU no requiere cross-origin isolation (eso es solo
// para SharedArrayBuffer / hilos), así que no añadimos cabeceras COOP/COEP.
export default defineConfig({
  base: "./",
  server: {
    host: true,
    port: 5173,
    strictPort: false,
  },
  build: {
    target: "esnext",
    chunkSizeWarningLimit: 4000,
  },
  optimizeDeps: {
    // Pre-empaquetamos tfjs y el backend WebGPU (si no, Vite sirve cientos de
    // módulos ESM sin empaquetar y la carga inicial se eterniza).
    include: ["@tensorflow/tfjs", "@tensorflow/tfjs-backend-webgpu"],
  },
});
