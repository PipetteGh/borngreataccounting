#!/usr/bin/env sh
set -e

if [ -n "${DB_HOST}" ]; then
  echo "[BorngreatAccounting] Checking database connectivity (${DB_HOST}:${DB_PORT:-3306})..."
  MAX_RETRIES=60
  COUNT=0
  until nc -z "${DB_HOST}" "${DB_PORT:-3306}" >/dev/null 2>&1; do
    COUNT=$((COUNT + 1))
    if [ "${COUNT}" -ge "${MAX_RETRIES}" ]; then
      echo "[BorngreatAccounting] ERROR: Timed out waiting for database at ${DB_HOST}:${DB_PORT:-3306}"
      exit 1
    fi
    sleep 1
  done
  echo "[BorngreatAccounting] Database port is reachable."
fi

if [ "${RUN_MIGRATIONS_ON_BOOT}" = "true" ]; then
  echo "[BorngreatAccounting] Running system & tenant database migrations..."
  (cd /app/packages/server && node dist/cli.js system:migrate:latest && node dist/cli.js tenants:migrate:latest)
  echo "[BorngreatAccounting] Migrations completed."
fi

exec "$@"
