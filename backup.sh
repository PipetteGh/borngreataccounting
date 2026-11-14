#!/usr/bin/env bash
# ==============================================================================
# BorngreatAccounting (BtAccounting) — Full System & Tenant Backup Utility
# Backs up MariaDB (system + all tenant DBs), Garage S3 storage, and .env config
# ==============================================================================
set -euo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-./backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="${BACKUP_ROOT}/borngreataccounting_backup_${TIMESTAMP}"
ARCHIVE_FILE="${BACKUP_ROOT}/borngreataccounting_backup_${TIMESTAMP}.tar.gz"
ENV_FILE="${ENV_FILE:-.env}"
MYSQL_CONTAINER="${MYSQL_CONTAINER:-borngreataccounting-mysql}"

mkdir -p "${BACKUP_DIR}/databases" "${BACKUP_DIR}/storage"

echo "======================================================================"
echo "  BorngreatAccounting Backup Utility — ${TIMESTAMP}"
echo "======================================================================"

if [ -f "${ENV_FILE}" ]; then
  # shellcheck disable=SC1090
  source <(grep -E '^[A-Z0-9_]+=' "${ENV_FILE}" | sed 's/\r$//')
  cp "${ENV_FILE}" "${BACKUP_DIR}/env.backup"
fi

DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:-root}"

echo "[1/3] Dumping all MariaDB databases (system + tenant databases)..."
if docker ps --format '{{.Names}}' | grep -q "^${MYSQL_CONTAINER}$"; then
  docker exec "${MYSQL_CONTAINER}" sh -c \
    "mysqldump -uroot -p\"${DB_ROOT_PASSWORD}\" --all-databases --single-transaction --routines --triggers --events" \
    | gzip -9 > "${BACKUP_DIR}/databases/all_databases.sql.gz"
  echo "      Database dump saved to ${BACKUP_DIR}/databases/all_databases.sql.gz"
else
  echo "[WARN] Container ${MYSQL_CONTAINER} is not running; skipping live mysqldump."
fi

echo "[2/3] Archiving Garage S3 object storage volume (borngreat_prod_garage)..."
if docker volume inspect borngreat_prod_garage >/dev/null 2>&1; then
  docker run --rm \
    -v borngreat_prod_garage:/source:ro \
    -v "$(cd "${BACKUP_DIR}/storage" && pwd)":/backup \
    alpine:3.20 tar -czf /backup/garage_data.tar.gz -C /source .
  echo "      Object storage archived."
fi

echo "[3/3] Creating compressed backup bundle and SHA-256 manifest..."
tar -czf "${ARCHIVE_FILE}" -C "${BACKUP_ROOT}" "borngreataccounting_backup_${TIMESTAMP}"
rm -rf "${BACKUP_DIR}"

if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "${ARCHIVE_FILE}" > "${ARCHIVE_FILE}.sha256"
elif command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "${ARCHIVE_FILE}" > "${ARCHIVE_FILE}.sha256"
fi

echo "======================================================================"
echo "  Backup completed successfully!"
echo "  Archive:  ${ARCHIVE_FILE}"
echo "  Checksum: ${ARCHIVE_FILE}.sha256"
echo "======================================================================"
