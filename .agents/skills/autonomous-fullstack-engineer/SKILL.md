---
name: autonomous-fullstack-engineer
description: Performs comprehensive reverse engineering, auditing, debugging, repair, feature completion, security review, automated browser testing and continuous regression verification of large React, Node.js and MySQL/MariaDB applications. Use when auditing, fixing, improving or validating the application.
---

# Autonomous Full-Stack Software Engineering Skill (`BorngreatAccounting`)

## Purpose
This skill governs autonomous discovery, auditing, debugging, repair, feature completion, security hardening, performance optimization, and continuous regression verification for **BorngreatAccounting (`BtAccounting`)** — a pnpm + Lerna monorepo housing a React 18 / Vite frontend (`packages/webapp`), a NestJS / Objection.js / Knex backend (`packages/server`), shared TypeScript packages (`shared/*`), and dual MariaDB databases (System DB + Per-Tenant DBs).

## Core Workflow

Always execute the autonomous engineering loop with Git synchronization:

`DISCOVER → AUDIT → IDENTIFY → INVESTIGATE → FIX → TEST → REGRESSION VERIFY → COMMIT → PUSH → DOCUMENT → REPEAT`

### 1. Safety & Change Control (Pre-Flight)
1. Inspect `git status --short`, current branch (`git branch --show-current`), and remotes (`git remote -v`) before making changes; never overwrite uncommitted user work or `.env` secrets.
2. Never run destructive migrations, `git reset --hard`, `git clean -fd`, or `git push --force`.
3. Never replace business logic with mock stubs or weaken tests to pass builds.
4. Consult persistent engineering memory in `engineering-reports/` (`PROJECT_ARCHITECTURE.md`, `PROJECT_MODULES.md`, `API_INVENTORY.md`, `DATABASE_SCHEMA_MAP.md`, `APPLICATION_DEPENDENCIES.md`, `APPLICATION_AUDIT.md`, `BUG_TRACKER.md`, `FEATURE_COMPLETION_MATRIX.md`, `TEST_PLAN.md`, `TEST_RESULTS.md`, `REGRESSION_HISTORY.md`, `SECURITY_AUDIT.md`, `PERFORMANCE_AUDIT.md`, `IMPROVEMENT_LOG.md`, `AUTONOMOUS_PROGRESS.md`, `GIT_CHANGELOG.md`). If any of these report files exist in the workspace root, move them into `engineering-reports/`.

### 2. Specialized Engineering Roles
When parallel execution or subagents are used, partition work across five specialized roles:
- **Agent A — React Frontend Engineer**: Audits `packages/webapp/src` (routes, hooks, Formik forms, React Query cache, BlueprintJS modals/portals, responsive layouts). See [references/frontend-testing.md](references/frontend-testing.md).
- **Agent B — Node.js Backend Engineer**: Audits `packages/server/src` (NestJS controllers, services, DTO validation, `SerializeInterceptor` snake_case/camelCase conversion, BullMQ processors, JWT/RBAC guards). See [references/backend-testing.md](references/backend-testing.md).
- **Agent C — MySQL/MariaDB Database Engineer**: Audits `packages/server/src/database/{system,tenant}` and `packages/server/src/models` (Knex migrations, Objection.js models, double-entry ledger integrity, indexes, transaction boundaries). See [references/database-testing.md](references/database-testing.md).
- **Agent D — Security Engineer**: Audits OWASP Top 10 controls (auth/JWT, 2FA, tenant isolation via `nestjs-cls`, webhook signatures, SQL parameterization, XSS, file upload validation, rate limiting). See [references/security-testing.md](references/security-testing.md).
- **Agent E — QA Automation Engineer**: Independently verifies fixes end-to-end (`USER ACTION → REACT → API → NESTJS → OBJECTION/KNEX → MARIADB → RESPONSE → UI`) via Jest, Supertest, and Playwright. See [references/regression-testing.md](references/regression-testing.md).

### 3. Reference Guides
- [Architecture Guide](references/architecture-guide.md)
- [Frontend Testing Guide](references/frontend-testing.md)
- [Backend Testing Guide](references/backend-testing.md)
- [Database Testing Guide](references/database-testing.md)
- [Security Testing Guide](references/security-testing.md)
- [Regression Testing Guide](references/regression-testing.md)
- [Autonomous Self-Healing Loop](references/autonomous-loop.md)

### 4. Verification & Git Synchronization Mandate
A fix or feature is **never** complete until:
1. The root cause is identified and repaired without breaking dependent modules.
2. Relevant unit/integration/e2e tests and production builds (`pnpm run build:server`, `pnpm --filter @borngreataccounting/webapp build`) execute and pass.
3. Persistent memory documents in `engineering-reports/` (`BUG_TRACKER.md`, `TEST_RESULTS.md`, `REGRESSION_HISTORY.md`, `IMPROVEMENT_LOG.md`, `AUTONOMOUS_PROGRESS.md`, `GIT_CHANGELOG.md`) are updated with empirical results.
4. Verified changes are committed with a clear, human-readable conventional commit message (excluding secrets and local build artifacts) and pushed to the configured remote branch (`git push origin main`).
