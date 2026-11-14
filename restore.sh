#!/usr/bin/env bash
# ==============================================================================
# BorngreatAccounting (BtAccounting) — Full System & Tenant Restore Utility
# Restores MariaDB (system + all tenant DBs) and Garage S3 storage from archive
# ==============================================================================
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: ./restore.sh <path-to-backup.tar.gz>"
  exit 1
fi

ARCHIVE_FILE="$1"
ENV_FILE="${ENV_FILE:-.env}"
MYSQL_CONTAINER="${MYSQL_CONTAINER:-borngreataccounting-mysql}"

if [ ! -f "${ARCHIVE_FILE}" ]; then
  echo "[ERROR] Backup archive not found: ${ARCHIVE_FILE}"
  exit 1
fi

if [ -f "${ARCHIVE_FILE}.sha256" ]; then
  echo "[1/4] Verifying SHA-256 integrity checksum..."
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum -c "${ARCHIVE_FILE}.sha256"
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 -c "${ARCHIVE_FILE}.sha256"
  fi
fi

TEMP_RESTORE_DIR="$(mktemp -d)"
trap 'rm -rf "${TEMP_RESTORE_DIR}"' EXIT

echo "[2/4] Extracting backup archive..."
tar -xzf "${ARCHIVE_FILE}" -C "${TEMP_RESTORE_DIR}"
EXTRACTED_ROOT="$(find "${TEMP_RESTORE_DIR}" -mindepth 1 -maxdepth 1 -type d | head -n 1)"

if [ -f "${ENV_FILE}" ]; then
  # shellcheck disable=SC1090
  source <(grep -E '^[A-Z0-9_]+=' "${ENV_FILE}" | sed 's/\r$//')
fi
DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:-root}"

if [ -f "${EXTRACTED_ROOT}/databases/all_databases.sql.gz" ]; then
  echo "[3/4] Restoring MariaDB system and tenant databases..."
  gunzip -c "${EXTRACTED_ROOT}/databases/all_databases.sql.gz" | \
    docker exec -i "${MYSQL_CONTAINER}" sh -c "mysql -uroot -p\"${DB_ROOT_PASSWORD}\""
  echo "      Database restoration complete."
fi

if [ -f "${EXTRACTED_ROOT}/storage/garage_data.tar.gz" ]; then
  echo "[4/4] Restoring Garage S3 object storage volume..."
  docker run --rm \
    -v borngreat_prod_garage:/target \
    -v "${EXTRACTED_ROOT}/storage":/backup:ro \
    alpine:3.20 sh -c "rm -rf /target/* && tar -xzf /backup/garage_data.tar.gz -C /target"
  echo "      Object storage restoration complete."
fi

echo "======================================================================"
echo "  BorngreatAccounting restore completed successfully!"
echo "======================================================================"
