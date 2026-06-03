#!/usr/bin/env bash
# ============================================================================
#  arrancar.sh — arranca el Arkanoid DRL Learning Lab (servidor Vite).
#  Si el puerto ya está ocupado (ya estaba arrancado), lo REARRANCA:
#  mata el proceso que escucha en el puerto y vuelve a lanzar.
#
#  Uso:   ./arrancar.sh            (puerto 5173 por defecto)
#         PUERTO=8080 ./arrancar.sh
# ============================================================================

set -euo pipefail

PUERTO="${PUERTO:-5173}"

# Trabajar siempre desde la carpeta del proyecto (la del propio script),
# sin importar desde dónde se invoque.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

azul()  { printf "\033[1;34m%s\033[0m\n" "$*"; }
verde() { printf "\033[1;32m%s\033[0m\n" "$*"; }
ambar() { printf "\033[1;33m%s\033[0m\n" "$*"; }

# 1) Dependencias: instalar si no están.
if [ ! -d node_modules ]; then
  azul "📦 node_modules no encontrado — instalando dependencias (npm install)…"
  npm install
fi

# 2) ¿Hay algo escuchando en el puerto? → rearrancar (matar y relanzar).
pids_en_puerto() { lsof -ti tcp:"$PUERTO" 2>/dev/null || true; }

PIDS="$(pids_en_puerto)"
if [ -n "$PIDS" ]; then
  ambar "♻️  El puerto $PUERTO ya estaba en uso (PIDs: $(echo "$PIDS" | tr '\n' ' '))."
  ambar "    Deteniendo el servidor anterior para rearrancar…"
  # shellcheck disable=SC2086
  kill $PIDS 2>/dev/null || true

  # Esperar hasta 5 s a que se libere el puerto; si no, forzar.
  for _ in $(seq 1 10); do
    [ -z "$(pids_en_puerto)" ] && break
    sleep 0.5
  done
  RESTANTES="$(pids_en_puerto)"
  if [ -n "$RESTANTES" ]; then
    ambar "    No cedió con SIGTERM — forzando cierre (kill -9)…"
    # shellcheck disable=SC2086
    kill -9 $RESTANTES 2>/dev/null || true
    sleep 0.5
  fi
  verde "    Servidor anterior detenido."
fi

# 3) Arrancar Vite en primer plano (Ctrl+C para detener) y abrir el navegador.
verde "🧠 Arrancando Arkanoid DRL Learning Lab → http://localhost:$PUERTO"
exec npm run dev -- --port "$PUERTO" --open
