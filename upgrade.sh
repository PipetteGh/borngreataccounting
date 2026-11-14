#!/usr/bin/env bash
# ==============================================================================
# BorngreatAccounting (BtAccounting) — Automated Safe Upgrade Script (Linux/macOS)
# Performs pre-upgrade backup, pulls latest images, runs migrations, and restarts
# ==============================================================================
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
ENV_FILE="${ENV_FILE:-.env}"

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
else
  COMPOSE_CMD="docker-compose"
fi

echo "======================================================================"
echo "  BorngreatAccounting — Automated Safe Upgrade"
echo "======================================================================"

echo "[1/4] Running pre-upgrade full backup..."
./backup.sh

echo "[2/4] Pulling latest BorngreatAccounting images..."
${COMPOSE_CMD} -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" pull

echo "[3/4] Running system and tenant database migrations..."
${COMPOSE_CMD} -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" run --rm database_migration

echo "[4/4] Recreating updated application containers..."
${COMPOSE_CMD} -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d --remove-orphans

echo "======================================================================"
echo "  Upgrade completed successfully!"
echo "======================================================================"
