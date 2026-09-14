#!/bin/bash
# Prepara el contenedor de Claude Code on the web: sin esto la sesión arranca
# con el repo clonado pero sin node_modules, y no se puede correr ni
# `npm test` ni `npm run check`.
set -euo pipefail

# Sólo en el entorno remoto; en tu máquina ya tenés las dependencias.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# `npm install` (y no `npm ci`) para aprovechar el cacheo del contenedor.
# Es idempotente: si ya está todo instalado, no hace nada.
npm install --no-audit --no-fund

echo "Dependencias listas. Comandos disponibles: npm test | npm run check | npm run build"
