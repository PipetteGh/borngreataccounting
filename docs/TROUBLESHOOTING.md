# Troubleshooting Guide

Common deployment, database, PDF, and runtime issues and how to resolve them rapidly.

---

## 1. Server Container Exits Immediately on Startup

**Symptom**: `borngreataccounting-api` restarts or exits with `APP_JWT_SECRET is required`.
**Resolution**:
Ensure `.env` exists in the project root and contains a non-empty `APP_JWT_SECRET` and `CLICKHOUSE_PASSWORD`. Run `./install.sh` or `.\install.ps1` to auto-populate missing secrets.

---

## 2. Database Migration Fails (`Access denied` for Tenant Creation)

**Symptom**: System migrations succeed, but creating a new organization fails when provisioning `borngreat_tenant_<id>`.
**Resolution**:
Each organization in BorngreatAccounting gets its own MariaDB database. Ensure `DB_USER` has `ALL PRIVILEGES ON *.*`:
```bash
docker exec borngreataccounting-mysql mysql -uroot -p"$DB_ROOT_PASSWORD" \
  -e "GRANT ALL PRIVILEGES ON *.* TO '${DB_USER}'@'%' WITH GRANT OPTION; FLUSH PRIVILEGES;"
```
Note: `docker/mariadb/docker-entrypoint-initdb.d` configures this automatically on initial volume creation.

---

## 3. PDF Invoices Fail to Download or Timeout

**Symptom**: Clicking "Download PDF" on an invoice returns a 500 error.
**Resolution**:
1. Verify the `borngreataccounting-gotenberg` container is running:
   ```bash
   docker compose -f docker-compose.production.yml ps gotenberg
   ```
2. Verify `GOTENBERG_URL=http://gotenberg:3000` and `GOTENBERG_DOCS_URL=http://server:3000/public/` in `.env` when running inside Docker Compose.

---

## 4. Windows PowerShell Blocks `npm` or `.ps1` Scripts (`PSSecurityException`)

**Symptom**: `File ...\npm.ps1 cannot be loaded because running scripts is disabled on this system.`
**Resolution**:
Run PowerShell scripts with `-ExecutionPolicy Bypass`:
```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```
Or enable `RemoteSigned` for your current Windows user:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
