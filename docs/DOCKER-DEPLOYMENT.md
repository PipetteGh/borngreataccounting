# Docker Deployment Guide

BorngreatAccounting provides a turnkey, multi-container Docker architecture in [`docker-compose.production.yml`](../docker-compose.production.yml).

---

## Architecture of the Production Docker Stack

| Container Name | Service | Role | Default Port |
|---|---|---|---|
| `borngreataccounting-proxy` | `proxy` | Envoy reverse proxy routing `/` to `webapp` and `/api`, `/socket` to `server` | `80`, `443` |
| `borngreataccounting-web` | `webapp` | React SPA served by Nginx Alpine (`ghcr.io/pipettegh/borngreataccounting-web:latest`) | Internal `80` |
| `borngreataccounting-api` | `server` | NestJS REST API & multi-tenant engine (`ghcr.io/pipettegh/borngreataccounting-api:latest`) | Internal `3000` |
| `borngreataccounting-worker` | `worker` | Background Bull queue worker (`ghcr.io/pipettegh/borngreataccounting-worker:latest`) | Internal |
| `borngreataccounting-database-migration` | `database_migration` | Runs `system:migrate:latest` and `tenants:migrate:latest` | One-shot |
| `borngreataccounting-mysql` | `mysql` | MariaDB storing `borngreat_system` + `borngreat_tenant_*` databases | Internal `3306` |
| `borngreataccounting-redis` | `redis` | Redis 7 cache, session, and queue store | Internal `6379` |
| `borngreataccounting-gotenberg` | `gotenberg` | Headless Chromium PDF rendering engine for invoices/statements | Internal `3000` |
| `borngreataccounting-garage` | `garage` | Self-hosted S3-compatible object storage for attachments | Internal `3900` |
| `borngreataccounting-clickhouse` | `clickhouse` | Optional analytical columnar store | Internal `8123` |

---

## Step-by-Step Deployment

### 1. Clone the Repository
```bash
git clone https://github.com/PipetteGh/Borngreat-Accounting---QuickBooks-Alternative.git
cd Borngreat-Accounting---QuickBooks-Alternative
```

### 2. Run the Automated Installer
The installer copies `.env.production.example` to `.env`, generates strong random secrets (`APP_JWT_SECRET`, `TWO_FACTOR_ENCRYPTION_KEY`, `DB_PASSWORD`, `DB_ROOT_PASSWORD`, `GARAGE_RPC_SECRET`), pulls or builds the containers, and starts the stack:

```bash
chmod +x install.sh
./install.sh
```

Or on Windows PowerShell:
```powershell
.\install.ps1
```

### 3. Manual Docker Compose Commands

If you prefer manual control:
```bash
cp .env.production.example .env
# Edit .env and set APP_JWT_SECRET, DB_PASSWORD, DB_ROOT_PASSWORD, BASE_URL
docker compose -f docker-compose.production.yml --env-file .env up -d
```

### 4. Verify Container Health
```bash
docker compose -f docker-compose.production.yml ps
docker compose -f docker-compose.production.yml logs -f server
```

---

## Persistent Docker Volumes

All accounting data is stored in named Docker volumes that survive container restarts and image upgrades:
- `borngreat_prod_mysql` — System database and all organization tenant databases
- `borngreat_prod_redis` — Queue and cache persistence
- `borngreat_prod_garage` — Uploaded attachments and receipts
- `borngreat_prod_clickhouse` — Analytics data
