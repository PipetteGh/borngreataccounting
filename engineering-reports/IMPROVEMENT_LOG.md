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
