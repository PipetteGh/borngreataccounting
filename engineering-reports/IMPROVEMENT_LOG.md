# IMPROVEMENT LOG (`BorngreatAccounting`)

## Iteration 1 — Windows Onboarding, Auth Portability & SMTP Setup
- Replaced native `bcrypt` with `bcryptjs`; auto-seeded `'free'` plan; added MariaDB port `3307` fallback; fixed `/setup/smtp` redirect race and Bearer auth headers in `SmtpSettingsForm.tsx`.

## Iteration 2 — In-App Auto-Updater & POS Layout/Receipt Fixes
- Added `GET /api/system_db/update-status` and `POST /api/system_db/update-install` + live progress modal & **Check for Updates** button in `AboutPage.tsx`.
- Fixed non-fullscreen POS height clipping, fullscreen receipt `<Dialog>` portal container, and 30-second receipt auto-close countdown.
- Removed legacy attribution from `AboutPage.tsx` and `brand.ts`.

## Iteration 3 — Multi-Provider SMS, Bulk NLP Automation, Top-10 POS & Financial Charts
- Added **Hubtel SMS API** and **SMSOnlineGH API v5** alongside **Twilio** in `SmsService.ts`, `SmsIntegrationSettings.service.ts`, and `SMSIntegrationForm.tsx`.
- Upgraded `AutomationPage.tsx` to extract natural-language keywords and bulk-update all matching items (e.g. 200+ `gari` products) concurrently.
- Upgraded `POSPage.tsx` to show **Top 10 Most Purchased** items by default and auto-add scanned barcodes to cart via `O(1)` `skuMap`.
- Added zero-dependency SVG charts to Homepage (`HomepageInsights.tsx`) and Financial Reports (`ProfitLossBody.tsx`, `BalanceSheetBody.tsx`, `CashFlowStatementBody.tsx`), plus native gzip API compression and persistent React Query caching.

## Iteration 4 — Exact Report Schema Alignment & Autonomous Engineering System
- Aligned `extractReportChartData.ts` with exact server schema node IDs (`INCOME`, `COST_OF_SALES`, `GROSS_PROFIT`, `EXPENSES`, `NET_INCOME`, `ASSETS`, `LIABILITY`, `EQUITY`, `OPERATING`, `INVESTMENT`, `FINANCIAL`, `NET_CASH_INCREASE`) and `rowTypes: ['TOTAL']` + `table.columns` resolution; added entity statistics (Inventory Items, Customers, Vendors, Invoices, Bills, Accounts) to Homepage.
- Created `.agents/skills/autonomous-fullstack-engineer/` skill + 7 reference guides, 5 architecture/discovery documents, 10 persistent engineering memory files, and added automatic provider fallback detection in `SmsIntegrationSettings.service.ts` with unit test verification.

## Iteration 5 — Payment Gateways Webhook Context, `.env` Fallback & Unit Test Suite (`improve.md`)
- Created `.agents/skills/autonomous-software-engineer/SKILL.md` and updated `improve.md` to store all engineering reports in `engineering-reports/` with mandatory test-before-commit and Git synchronization.
- Fixed `BUG-010`, `BUG-011`, and `BUG-012` in `PaymentGateways.controller.ts` and `PaymentGateways.service.ts` (`:organizationId` URL param propagation into `ClsService` during external webhooks, case-insensitive/rawBody Paystack & Flutterwave webhook verification, and `.env` credential fallback for Paystack, Flutterwave, and Hubtel).
- Added 5 unit tests in `packages/server/src/modules/PaymentServices/PaymentGateways.service.spec.ts` verifying Paystack, Flutterwave, and Hubtel checkout initialization and webhook signature verification.

## Iteration 6 — Dashboard & Report Mathematical Reconciliation (`BUG-013` to `BUG-017`)
- Fixed `SalesByItems` revenue extraction (`item.soldCost` / `item.total.amount` instead of falling back to `item.quantitySold`).
- Synchronized `HomepageInsights.tsx` with `transformFilterFormToQuery(getDefaultProfitLossQuery())` and `getDefaultBalanceSheetQuery()` (`Cash Basis` default + interactive `Cash Basis` / `Accrual Basis` toggle) so Home Page figures match the Profit & Loss and Balance Sheet report pages 100%.
- Reconciled Profit & Loss KPI math (`Total Income - Total Costs & Expenses [COGS + OpEx] === Net Income`) and replaced Balance Sheet double-counted donut (`Assets + Liabilities + Equity`) with a `Balance Sheet Position` bar chart (`Assets = Liabilities + Equity`).
- Fixed `extractListFromResponse` for `/api/sale-invoices`, `/api/bills`, `/api/items`, `/api/customers`, `/api/vendors`, and `/api/accounts` (`raw.data` & top-level array handling) and added `ReportChartExtraction.spec.ts`.

## Iteration 7 — POS `F9` Complete Sale Fix (`BUG-018`)
- Fixed `ReferenceError: cartSnapshot is not defined` inside `completeSale()` in `POSPage.tsx` which caused `F9` / `Complete Sale` to show `'Failed to complete POS sale.'` after posting the receipt.
- Added automatic `'Walk-in Customer'` fallback/creation and deposit account fallback when `F9` is pressed, capture-phase `F9` / `Ctrl+Enter` keyboard handling, and silent background `loadPosData(true)` refresh.

## Iteration 8 — Real Chromium Browser E2E Verification & Walk-in Customer `currency_code` Fix (`BUG-019`)
- Ran full Playwright Chromium E2E verification against live NestJS + production Webapp (`http://127.0.0.1:4100`) on a freshly provisioned tenant (`global-setup.ts`).
- Caught and fixed `BUG-019` in `POSPage.tsx`: `completeSale()` was omitting `currency_code` when auto-creating `'Walk-in Customer'` (`POST /api/customers` returned HTTP 400 on tenants without prior customers). Extracted shared `createDefaultWalkInCustomer()` passing `currency_code: baseCurrency || 'GHS'`.
- Expanded `e2e/record-features-demo.spec.ts` to assert zero error boundaries, Homepage KPIs & entity counts (`Total Income`, `Total Costs & Expenses`, `Net Income (Profit)`, `Total Assets`, `Inventory Items`, `Customers`, `Vendors`), `Accrual Basis` / `Cash Basis` switching, P&L & Balance Sheet charts, and POS `F9` -> `[data-testid="thermal-receipt-preview"]` (`1 passed` in `40.4s`).

## Iteration 9 — Zero-Liability Balance Sheet Fix, Bar Chart Spacing & Updated README Showcase + 17-Frame Overview GIF (`BUG-020`)
- Fixed `BUG-020` in `extractReportChartData.ts` (`excludePatterns: ['equity']` on `liabilitiesRow` lookup) and `FinancialCharts.tsx` (wider bar spacing, zero-height rendering for zero values), verified with a new unit test in `ReportChartExtraction.spec.ts` (`4/4` suites, `14/14` tests passing).
- Updated `e2e/record-features-demo.spec.ts` to seed rich transactions, capture `13` fresh high-res screenshots in `assets/screenshots/`, and assemble a new 17-frame `1200×750` animated navigation & feature tour GIF (`assets/screenshots/overview.gif`, `1,642,077` bytes).
- Updated `README.md` `## Screenshots` gallery to reflect the reconciled Workspace Dashboard, POS `F9` Thermal Receipt, BorngreatAutomation, Financial Reports, SMS Integration, Payment Gateways, Themes, Branding, and Settings.

## Iteration 10 — Full-Stack Performance Engineering & Before/After Speed Benchmark
- Eliminated per-request Objection model initialization in `TenantModelsInitialize.module.ts` via `WeakSet<Knex>` + `inFlightInitializations`, and added CLS + 15s memory caching for verified users, initialized tenants, and memberships across `AuthSignin.service.ts`, `TenancyContext.service.ts`, and `TenancyGlobal.guard.ts`.
- Replaced `deepdash` in `serialize.interceptor.ts` and `to-json.interceptor.ts` with fast WeakMap-protected traversal + memoized key-case caches (`54.0x` speedup: `265.75 ms` → `4.92 ms` per 500-row payload) and switched API gzip to `Z_BEST_SPEED`.
- Upgraded `scripts/windows-gateway.js` with persistent backend HTTP keep-alive sockets and an in-memory pre-gzipped static asset cache (`ETag`/`304`/`immutable`, `1.50 ms` warm delivery).
- Removed `@vitejs/plugin-legacy`, split vendor chunks (`vendor-react`, `vendor-blueprint`, `vendor-utils`) in `vite.config.ts`, memoized client key-case conversion in `utils/index.tsx`, and added stale-while-revalidate caching to `HomepageInsights.tsx` and `POSPage.tsx`.
- Verified Before vs. After benchmark (`1.87x` faster 9-endpoint Dashboard burst, `6.37x` smaller JS entry bundle, `2.62x` faster Vite build, `2.88x` faster Chromium dashboard load) alongside `5/5` Jest suites (`19/19` tests) and full Chromium Playwright E2E pass.
