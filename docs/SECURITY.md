# Security Guide

BorngreatAccounting handles sensitive financial ledgers, tax records, and customer/vendor data. Follow these production security practices.

---

## 1. Cryptographic Secrets

- **`APP_JWT_SECRET`**: Must be a cryptographically random string of at least 48 bytes (`openssl rand -base64 48`). Never reuse development secrets in production.
- **`TWO_FACTOR_ENCRYPTION_KEY`**: Dedicated 32-byte key used to encrypt TOTP secrets at rest using AES-GCM. Setting this explicitly allows rotating `APP_JWT_SECRET` without invalidating user 2FA enrollments.
- **File Permissions**: Ensure `.env` has mode `0600` (`chmod 600 .env`) on Linux/macOS so only the deployment owner can read credentials.

---

## 2. Network & Port Isolation

In [`docker-compose.production.yml`](../docker-compose.production.yml):
- Only the **Envoy proxy** (`ports: 80, 443`) is exposed to the host network.
- **MariaDB (`3306`)**, **Redis (`6379`)**, **Gotenberg (`3000`)**, **Garage (`3900`)**, and the **NestJS API (`3000`)** communicate exclusively over the internal `borngreat_network` bridge and are not exposed publicly.

---

## 3. Authentication & Access Control

- **Two-Factor Authentication (2FA)**: Users can enable TOTP 2FA under **Preferences → Security** and download backup recovery codes (`borngreataccounting-recovery-codes.txt`).
- **Role-Based Access Control (RBAC)**: Create granular roles under **Preferences → Users & Roles** restricting permissions per accounting module (Invoices, Bills, Journal Entries, Financial Reports, Settings).
- **Disable Open Registration**: Once your organization is created on a private server, set `SIGNUP_DISABLED=true` in `.env` and restart the `server` container so only invited users can join.
- **API Rate Limiting**: Controlled via `THROTTLE_GLOBAL_LIMIT` (default `300` req/min) and `THROTTLE_AUTH_LIMIT` (default `30` req/min).
