#!/usr/bin/env bash
# ==============================================================================
# BorngreatAccounting (BtAccounting) — Automated Linux / macOS Installer
# Your Accounting. Your Servers. Your Control.
# Developer & Publisher: Peter Borngreat-Mensah (Borngreat)
# ==============================================================================
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
ENV_FILE="${ENV_FILE:-.env}"
ENV_TEMPLATE="${ENV_TEMPLATE:-.env.production.example}"

echo "======================================================================"
echo "  BorngreatAccounting (BtAccounting) — Production Installer"
echo "  Your Accounting. Your Servers. Your Control."
echo "======================================================================"

if ! command -v docker >/dev/null 2>&1; then
  echo "[ERROR] Docker is not installed. Please install Docker Engine 24+ first."
  echo "        See docs/DOCKER-DEPLOYMENT.md for instructions."
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "[ERROR] Docker Compose v2 is required."
  exit 1
fi

generate_secret() {
  local bytes="${1:-32}"
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -base64 "${bytes}" | tr -d '\n\r/+=' | cut -c1-"${bytes}"
  else
    head -c "${bytes}" /dev/urandom | base64 | tr -d '\n\r/+=' | cut -c1-"${bytes}"
  fi
}

generate_hex() {
  local bytes="${1:-32}"
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex "${bytes}" | tr -d '\n\r'
  else
    od -An -tx1 -N "${bytes}" /dev/urandom | tr -d ' \n\r'
  fi
}

if [ ! -f "${ENV_FILE}" ]; then
  echo "[1/4] Creating ${ENV_FILE} from ${ENV_TEMPLATE} and generating cryptographic secrets..."
  cp "${ENV_TEMPLATE}" "${ENV_FILE}"

  JWT_SECRET="$(generate_secret 48)"
  TOTP_KEY="$(generate_secret 32)"
  DB_PASS="$(generate_secret 24)"
  DB_ROOT_PASS="$(generate_secret 24)"
  CH_PASS="$(generate_secret 24)"
  GARAGE_RPC="$(generate_hex 32)"
  GARAGE_ADMIN="$(generate_secret 32)"

  sed -i.bak \
    -e "s|^APP_JWT_SECRET=.*|APP_JWT_SECRET=${JWT_SECRET}|" \
    -e "s|^TWO_FACTOR_ENCRYPTION_KEY=.*|TWO_FACTOR_ENCRYPTION_KEY=${TOTP_KEY}|" \
    -e "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PASS}|" \
    -e "s|^DB_ROOT_PASSWORD=.*|DB_ROOT_PASSWORD=${DB_ROOT_PASS}|" \
    -e "s|^CLICKHOUSE_PASSWORD=.*|CLICKHOUSE_PASSWORD=${CH_PASS}|" \
    -e "s|^GARAGE_RPC_SECRET=.*|GARAGE_RPC_SECRET=${GARAGE_RPC}|" \
    -e "s|^GARAGE_ADMIN_TOKEN=.*|GARAGE_ADMIN_TOKEN=${GARAGE_ADMIN}|" \
    "${ENV_FILE}"
  rm -f "${ENV_FILE}.bak"
  chmod 600 "${ENV_FILE}" || true
  echo "      Generated secure credentials in ${ENV_FILE}."
else
  echo "[1/4] Existing ${ENV_FILE} detected — preserving existing configuration."
fi

echo "[2/4] Pulling or building BorngreatAccounting container images..."
${COMPOSE_CMD} -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" pull || \
  ${COMPOSE_CMD} -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" build

echo "[3/4] Starting BorngreatAccounting services and running database migrations..."
${COMPOSE_CMD} -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d

echo "[4/4] Verifying service readiness..."
PORT_VAL="$(grep -E '^PUBLIC_PROXY_PORT=' "${ENV_FILE}" | cut -d= -f2 || echo 80)"
PORT_VAL="${PORT_VAL:-80}"

echo "======================================================================"
echo "  BorngreatAccounting is starting up!"
echo "  Dashboard URL: http://localhost:${PORT_VAL}"
echo "  Check status:  ${COMPOSE_CMD} -f ${COMPOSE_FILE} ps"
echo "  View logs:     ${COMPOSE_CMD} -f ${COMPOSE_FILE} logs -f"
echo "======================================================================"
