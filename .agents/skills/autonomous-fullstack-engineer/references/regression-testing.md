# Regression Testing Guide (Agent E)

## Full-Chain Verification
Every critical workflow must be verified across the full stack:
`USER ACTION → REACT COMPONENT → API REQUEST → NESTJS CONTROLLER/SERVICE → OBJECTION/KNEX → MARIADB → API RESPONSE → REACT STATE → UI RESULT`

## Verification Tiers
1. **Tier 1 — Static & Build Verification**:
   - `pnpm run build:server` (builds `@borngreataccounting/utils`, `pdf-templates`, `email-components`, and `server`)
   - `pnpm --filter @borngreataccounting/webapp build` (TypeScript + Vite production bundle)
2. **Tier 2 — Backend Unit & Integration Tests (Jest + Supertest)**:
   - `cd packages/server; pnpm exec jest <spec-path>`
   - Verify services, transformers, ledger analytics, SMS providers, and brand configuration.
3. **Tier 3 — End-to-End Browser Automation (Playwright)**:
   - Configs: `playwright.config.ts`, `playwright.screenshots.config.ts`, `playwright.demo.config.ts`
   - Global setup (`e2e/global-setup.ts`): Registers a user, signs in, builds a tenant organization database, waits for the BullMQ build job, and persists auth cookies to `e2e/.auth/user.json`.
   - Use `http://127.0.0.1:4100` (or `:4000` in Vite dev) on Windows to avoid IPv6 `::1` resolution mismatches.
