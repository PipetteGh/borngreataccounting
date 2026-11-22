# TEST PLAN (`BorngreatAccounting`)

## 1. Static & Build Verification
- **Server & Shared Packages**: `pnpm run build:server` (compiles `@borngreataccounting/utils`, `@borngreataccounting/pdf-templates`, `@borngreataccounting/email-components`, and `@borngreataccounting/server`).
- **Frontend SPA**: `pnpm --filter @borngreataccounting/webapp build` (validates TypeScript imports and bundles production Vite assets).

## 2. Backend Unit & Integration Tests (Jest)
- **Command**: `cd packages/server; pnpm exec jest <spec>`
- **Key Suites**:
  - `src/common/config/brand.spec.ts` — Verifies centralized branding metadata and absence of legacy attribution.
  - `src/modules/SMS/SmsService.spec.ts` — Verifies Hubtel SMS Basic Auth + E.164 Ghana phone formatting, SMSOnlineGH `key` header + `destinations` payload, and `SmsIntegrationSettingsService` automatic provider fallback.
  - `src/modules/Analytics/services/LedgerAnalyticsAggregation.spec.ts` — Verifies ledger aggregation accuracy.
  - `src/modules/FinancialStatements/common/TableSheetPdf.spec.ts` — Verifies financial report table row structure (`AGGREGATE`, `ACCOUNT`, `TOTAL`).

## 3. End-to-End Browser & Workflow Verification (Playwright)
- **Configs**: `playwright.config.ts`, `playwright.screenshots.config.ts`, `playwright.demo.config.ts`.
- **Full-Chain Walkthrough (`e2e/record-features-demo.spec.ts`)**:
  1. `global-setup.ts`: Registers new user (`POST /api/auth/signup`), signs in (`POST /api/auth/signin`), builds tenant database (`POST /api/organization/build`), waits for BullMQ job completion, and saves authenticated storage state (`e2e/.auth/user.json`).
  2. Navigates and interacts across Homepage KPIs & Charts, Profit & Loss Report Charts, Balance Sheet Report Charts, POS Top 10 & Cart, Bulk Automation NLP, SMS Integration (Twilio / Hubtel / SMSOnlineGH), and About Page Check for Updates.
