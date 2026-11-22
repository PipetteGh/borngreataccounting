---
name: autonomous-software-engineer
description: Principal autonomous software engineering skill for full-stack application auditing, reverse engineering, root-cause bug fixing, database consistency checks, API/webhook testing, security hardening, Playwright browser testing, and continuous regression verification with Git synchronization.
---

# Autonomous Software Engineer Skill (`BorngreatAccounting`)

## Overview
This skill implements the 9-Phase Autonomous Software Engineering lifecycle defined in `improve.md` and `improve-selflearning.md` for **BorngreatAccounting (`BtAccounting`)**.

## Continuous Self-Improvement Loop
`DISCOVER → AUDIT → IDENTIFY → INVESTIGATE → FIX → TEST → VERIFY → COMMIT → PUSH → DOCUMENT → REPEAT`

## Core Capabilities & Responsibilities
1. **Full-Stack Application Auditing & Reverse Engineering**:
   - Trace every workflow end-to-end: `React UI → SDK/Axios → NestJS Controller/Service → Objection.js/Knex → MariaDB → Response → UI`.
   - Maintain architecture and module maps in `engineering-reports/` (`PROJECT_ARCHITECTURE.md`, `PROJECT_MODULES.md`, `API_INVENTORY.md`, `DATABASE_SCHEMA_MAP.md`, `APPLICATION_DEPENDENCIES.md`).
2. **Bug Identification, Root-Cause Analysis & Repair**:
   - Assign every defect a unique ID (`BUG-001`, `BUG-002`, ...) in `engineering-reports/BUG_TRACKER.md`.
   - Fix root causes across frontend (`packages/webapp`), backend (`packages/server`), shared packages (`shared/*`), and migrations (`packages/server/src/database/{system,tenant}`).
3. **Automated Testing & Regression Verification**:
   - Run Jest unit & integration tests (`cd packages/server; pnpm exec jest <spec>`), production builds (`pnpm run build:server`, `pnpm --filter @borngreataccounting/webapp build`), and Playwright browser tests (`playwright.config.ts`, `playwright.demo.config.ts`).
   - Never claim a fix works without executing its verification test.
4. **Centralized Engineering Reports (`engineering-reports/`)**:
   - Keep the workspace root clean by storing all reports inside `engineering-reports/`:
     - `PROJECT_ARCHITECTURE.md`, `PROJECT_MODULES.md`, `API_INVENTORY.md`, `DATABASE_SCHEMA_MAP.md`, `APPLICATION_DEPENDENCIES.md`
     - `APPLICATION_AUDIT.md`, `BUG_TRACKER.md`, `FEATURE_COMPLETION_MATRIX.md`, `TEST_PLAN.md`, `TEST_RESULTS.md`, `REGRESSION_HISTORY.md`, `SECURITY_AUDIT.md`, `PERFORMANCE_AUDIT.md`, `IMPROVEMENT_LOG.md`, `AUTONOMOUS_PROGRESS.md`, `GIT_CHANGELOG.md`
5. **Mandatory Git Commit & Remote Synchronization**:
   - After every verified feature or bug-fix iteration that passes its tests, commit the related files with a clear, human-readable conventional commit message and push to `origin main`, recording the commit hash in `engineering-reports/GIT_CHANGELOG.md`.

## Detailed Reference Guides
See the shared reference library in [../autonomous-fullstack-engineer/references/](../autonomous-fullstack-engineer/references/):
- [architecture-guide.md](../autonomous-fullstack-engineer/references/architecture-guide.md)
- [frontend-testing.md](../autonomous-fullstack-engineer/references/frontend-testing.md)
- [backend-testing.md](../autonomous-fullstack-engineer/references/backend-testing.md)
- [database-testing.md](../autonomous-fullstack-engineer/references/database-testing.md)
- [security-testing.md](../autonomous-fullstack-engineer/references/security-testing.md)
- [regression-testing.md](../autonomous-fullstack-engineer/references/regression-testing.md)
- [autonomous-loop.md](../autonomous-fullstack-engineer/references/autonomous-loop.md)
