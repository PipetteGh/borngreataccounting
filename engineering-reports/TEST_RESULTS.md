# TEST RESULTS (`BorngreatAccounting`)

## Latest Execution Summary (2026-11-22)

### 1. Backend, Auth & Report Reconciliation Unit Tests (Jest)
- **Command**: `cd packages/server; pnpm exec jest src/modules/FinancialStatements/common/ReportChartExtraction.spec.ts src/modules/PaymentServices/PaymentGateways.service.spec.ts src/modules/SMS/SmsService.spec.ts src/common/config/brand.spec.ts src/modules/Auth/commands/AuthSignin.service.spec.ts`
- **Status**: **PASSED** (`5/5` suites, `19/19` tests passing — covering Profit & Loss / Balance Sheet (including zero-liability `'Total Liabilities and Equity'` guard) / Cash Flow reconciliation, Auth JWT payload verification & caching, Paystack/Flutterwave/Hubtel checkout & webhooks, Twilio/Hubtel/SMSOnlineGH SMS & auto-fallback, and Brand config)

### 2. Full-Stack Production Builds
- **Server & Shared Packages (`pnpm run build:server` + `@borngreataccounting/server build`)**: **PASSED** (`exit code 0` across `@borngreataccounting/utils`, `@borngreataccounting/pdf-templates`, `@borngreataccounting/email-components`, `@borngreataccounting/server`)
- **Webapp Production Bundle (`pnpm --filter @borngreataccounting/webapp build`)**: **PASSED** (`exit code 0`, `6600 modules transformed` in **`1m 11s`** vs `3m 6s` baseline, main entry chunk reduced to `1,495.56 kB` / `409.95 kB` gzip)

### 3. Before vs. After Performance Benchmark & Real Browser E2E Verification
- **Live Server Benchmark (`benchmark_perf.js` vs `http://127.0.0.1:4100`)**: **PASSED**
  - `SerializeInterceptor` 500-row roundtrip: `265.75 ms` → **`4.92 ms`** (`54.0x` faster)
  - Main JS bundle transfer: `2,611,997 B` → **`409,947 B`** (`gzip`, `1.50 ms` warm / `1.07 ms` `304`)
  - Dashboard 9-endpoint parallel burst: `319.84 ms` → **`170.65 ms`** (`min 126.74 ms`, `1.87x` faster)
- **Playwright Chromium Walkthrough (`e2e/record-features-demo.spec.ts`)**: **PASSED** (`1 passed`, `1.6m` test / `2.2m` total; Chromium `load dashboard` dropped from `14,917ms` to **`5,175ms`**)
  - Verified Homepage (`/`), `/items`, `/pos` + `F9` thermal receipt, `/automation`, `/invoices`, `/financial-reports/profit-loss-sheet`, `/financial-reports/balance-sheet`, `/preferences/payment-methods`, `/preferences/sms-message?tab=overview`, `/preferences/themes`, `/preferences/branding`, `/preferences/general`, and `/preferences/about`.
- **Artifacts**:
  - Updated `13` live screenshots in `assets/screenshots/*.png` + `assets/screenshots/overview.gif` (`1,643,162` bytes across `17` frames)
