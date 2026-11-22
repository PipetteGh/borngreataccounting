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
