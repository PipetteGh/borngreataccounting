# FEATURE COMPLETION MATRIX (`BorngreatAccounting`)

| Module / Feature | Route / Page | User Role | Backend Endpoint | Database Tables | Test Status |
|---|---|---|---|---|---|
| **User Registration & Login** | `/auth/register`, `/auth/login` | Public / All | `POST /api/auth/signup`, `POST /api/auth/signin` | `system_users`, `subscriptions`, `plans` | **Verified (E2E & Live)** |
| **Organization & SMTP Setup** | `/setup/organization`, `/setup/smtp` | Admin / Owner | `POST /api/organization/build`, `PUT /api/smtp-settings` | `organizations`, `settings` | **Verified (E2E & Build)** |
| **Homepage Analytics & KPIs** | `/` (`HomepageInsights.tsx`) | Authenticated | `/api/financial_statements/*`, `/api/items`, `/api/customers`, `/api/vendors`, `/api/sale-invoices`, `/api/bills` | `accounts_transactions`, `items`, `contacts`, `sales_invoices`, `bills` | **Verified (Playwright & Build)** |
| **Point of Sale (POS)** | `/pos` (`POSPage.tsx`) | Cashier / Admin | `GET /api/items`, `POST /api/sale-receipts` | `items`, `sales_receipts`, `items_entries`, `accounts_transactions` | **Verified (Playwright & Build)** |
| **BorngreatAutomation (NLP & Bulk)** | `/automation` (`AutomationPage.tsx`) | Admin / Staff | `POST /api/inventory-adjustments/quick`, `/api/sale-invoices`, `/api/sale-receipts`, `/api/expenses`, etc. | `inventory_adjustments`, `items`, `sales_invoices`, `sales_receipts`, `expenses_transactions` | **Verified (Playwright & Build)** |
| **Financial Reports & Charts** | `/financial-reports/profit-loss`, `/balance-sheet`, `/cash-flow` | Accountant / Admin | `GET /api/financial_statements/profit_loss`, `/balance_sheet`, `/cash_flow` | `accounts`, `accounts_transactions` | **Verified (Playwright & Build)** |
| **Multi-Provider SMS** | `/preferences/sms-integration` | Admin | `PUT /api/settings`, `SmsService` (Twilio, Hubtel, SMSOnlineGH) | `settings` (`sms-integration`) | **Verified (Jest Unit Tests & Playwright)** |
| **Online Payment Gateways** | `/preferences/payment-methods`, `/payment/:linkId` | Admin / Customer | `/api/payment-services/*`, `/api/payment-links/*`, `/api/webhooks/*` | `settings`, `payment_links`, `payment_gateway_transactions` | **Verified (Build & Schema)** |
| **In-App Auto-Updater** | `/preferences/about` (`AboutPage.tsx`, `AppUpdateChecker.tsx`) | Admin / All | `GET /api/system_db/update-check`, `GET /update-status`, `POST /update-install` | N/A (System release & installer manager) | **Verified (Playwright & Build)** |
