# Developer Guide

This guide explains how to set up a local development environment for **BorngreatAccounting (`BtAccounting`)**, build all packages, run tests, and create database migrations.

---

## 1. Local Development Setup

### Prerequisites
- **Node.js**: `18.x LTS` (or `>=18.0.0`)
- **pnpm**: `9.0.5` (via `corepack enable`)
- **Docker**: Docker Desktop or Docker Engine (for local MariaDB, Redis, Gotenberg, and Garage)

### Bootstrap Steps
```bash
# 1. Copy local development environment variables
cp .env.development.example .env

# 2. Start local backing services (MariaDB 3306, Redis 6379, Gotenberg 9000, Garage 3900)
docker compose up -d

# 3. Install dependencies across the monorepo
pnpm install

# 4. Build shared packages and server (required before running CLI migrations)
pnpm run build:shared
pnpm run build:server

# 5. Run system database migrations
pnpm run system:migrate:latest

# 6. Start backend API (port 3000) and frontend Vite dev server (port 4000)
pnpm run dev:server
pnpm run dev:webapp
```

---

## 2. Common Monorepo Commands

| Task | Command |
|---|---|
| Build all shared packages | `pnpm run build:shared` |
| Build backend server | `pnpm --filter "@borngreataccounting/server" run build` |
| Build frontend webapp | `pnpm --filter "@borngreataccounting/webapp" run build` |
| Run backend Jest unit tests | `pnpm --filter "@borngreataccounting/server" test` |
| Run backend E2E tests | `pnpm run test:e2e` |
| Run Playwright browser E2E tests | `pnpm run e2e:webapp` |
| Typecheck all packages | `pnpm run typecheck` |
| Lint all packages | `pnpm run lint:check` |
| Regenerate OpenAPI TypeScript SDK | `pnpm run generate:sdk-types` |

---

## 3. Centralized Branding System

All product identity strings and URLs are centralized so rebranding and white-labeling never require scattered edits:
- **Shared Package**: [`shared/borngreataccounting-utils/src/branding.ts`](../shared/borngreataccounting-utils/src/branding.ts)
- **Webapp Frontend**: [`packages/webapp/src/constants/brand.ts`](../packages/webapp/src/constants/brand.ts)
- **Backend Server**: [`packages/server/src/common/config/brand.ts`](../packages/server/src/common/config/brand.ts)
- **Editable Vector & Raster Assets**: [`assets/branding/`](../assets/branding/)
