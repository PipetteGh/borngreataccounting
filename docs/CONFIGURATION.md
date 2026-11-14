# Configuration Reference

BorngreatAccounting uses a single root `.env` file for both Docker deployments and local development. Templates are provided in:
- [`.env.example`](../.env.example) — General template
- [`.env.production.example`](../.env.production.example) — Production Docker template
- [`.env.development.example`](../.env.development.example) — Local development template

---

## Core Environment Variables

| Variable | Default | Required | Description |
|---|---|---|---|
| `APP_NAME` | `BorngreatAccounting` | No | Full application brand name |
| `APP_SHORT_NAME` | `BtAccounting` | No | Short brand identifier |
| `NODE_ENV` | `production` | Yes | Runtime environment (`development`, `production`, `test`) |
| `BASE_URL` | `http://localhost` | Yes | Public URL used in email links, OAuth callbacks, and portals |
| `PUBLIC_PROXY_PORT` | `80` | No | Host HTTP port mapped to Envoy proxy |
| `PUBLIC_PROXY_SSL_PORT` | `443` | No | Host HTTPS port mapped to Envoy proxy |
| `APP_JWT_SECRET` | *(generated)* | **Yes** | 48+ byte secret signing JWT tokens (`openssl rand -base64 48`) |
| `TWO_FACTOR_ENCRYPTION_KEY` | *(generated)* | Recommended | 32+ byte key encrypting TOTP secrets at rest |
| `TWO_FACTOR_ISSUER` | `BorngreatAccounting` | No | Issuer label displayed in authenticator apps |

---

## Database & Multi-Tenancy Variables

| Variable | Default | Required | Description |
|---|---|---|---|
| `DB_HOST` | `mysql` (prod) / `localhost` (dev) | Yes | MariaDB hostname |
| `DB_PORT` | `3306` | No | MariaDB TCP port |
| `DB_USER` | `borngreat` | Yes | Database user with tenant creation privileges |
| `DB_PASSWORD` | *(generated)* | **Yes** | Database user password |
| `DB_ROOT_PASSWORD` | *(generated)* | **Yes** | MariaDB root password |
| `SYSTEM_DB_NAME` | `borngreat_system` | Yes | System registry database name |
| `TENANT_DB_NAME_PERFIX` | `borngreat_tenant_` | Yes | Prefix for per-organization tenant databases |

---

## Cache, Queue, PDF & Object Storage Variables

| Variable | Default | Description |
|---|---|---|
| `REDIS_HOST` / `QUEUE_HOST` | `redis` | Redis server hostname for caching and Bull queues |
| `REDIS_PORT` / `QUEUE_PORT` | `6379` | Redis TCP port |
| `GOTENBERG_URL` | `http://gotenberg:3000` | Gotenberg service endpoint for PDF invoice rendering |
| `GOTENBERG_DOCS_URL` | `http://server:3000/public/` | Internal server static asset URL accessed by Gotenberg |
| `S3_ENDPOINT` | `http://garage:3900` | S3-compatible object storage URL (Garage or AWS S3/MinIO) |
| `S3_BUCKET` | `borngreataccounting` | Bucket name for document attachments |
| `S3_FORCE_PATH_STYLE` | `true` | Required `true` for Garage/MinIO self-hosted S3 |

---

## Email (SMTP) & Access Restrictions

| Variable | Default | Description |
|---|---|---|
| `MAIL_HOST` | *(empty)* | SMTP server hostname |
| `MAIL_PORT` | `587` | SMTP port (`587` STARTTLS or `465` TLS) |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | *(empty)* | SMTP credentials |
| `MAIL_FROM_NAME` | `BorngreatAccounting` | Sender display name |
| `MAIL_FROM_ADDRESS` | `noreply@example.com` | Sender email address |
| `SIGNUP_DISABLED` | `false` | Set `true` to disable public registration after creating your admin account |
| `SIGNUP_ALLOWED_DOMAINS` | *(empty)* | Comma-separated allowed email domains for sign-up |
