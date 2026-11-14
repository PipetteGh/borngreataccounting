# Upgrade Guide

BorngreatAccounting is designed for zero-data-loss upgrades across releases. All persistent financial records live inside Docker volumes (`borngreat_prod_mysql`, `borngreat_prod_redis`, `borngreat_prod_garage`, `borngreat_prod_clickhouse`) and are preserved during container recreation.

---

## One-Command Safe Upgrade

### Linux / macOS
```bash
./upgrade.sh
```

### Windows PowerShell
```powershell
.\upgrade.ps1
```

---

## What the Upgrade Script Does

1. **Pre-Upgrade Backup (`Step 1/4`)**: Runs `backup.sh` / `backup.ps1` to snapshot all system & tenant MariaDB databases, S3 attachments, and `.env` with SHA-256 verification.
2. **Pull Latest Container Images (`Step 2/4`)**: Pulls the latest `ghcr.io/pipettegh/borngreataccounting-web`, `borngreataccounting-api`, and `borngreataccounting-worker` images.
3. **Database Migrations (`Step 3/4`)**: Executes both:
   - `node dist/cli.js system:migrate:latest` (System DB migrations)
   - `node dist/cli.js tenants:migrate:latest` (Every tenant database's migrations)
4. **Rolling Container Recreation (`Step 4/4`)**: Recreates the stateless application containers while keeping MariaDB, Redis, and Garage volumes intact.

---

## Rollback Procedure

If you ever need to roll back to a previous version:
1. Pin the previous version tag in `docker-compose.production.yml` (e.g., `ghcr.io/pipettegh/borngreataccounting-api:1.0.0`).
2. Restore the pre-upgrade database snapshot using `./restore.sh <backup-archive>` (or `.\restore.ps1`).
3. Run `docker compose -f docker-compose.production.yml up -d`.
