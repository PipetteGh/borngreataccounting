# API INVENTORY (`BorngreatAccounting`)

All backend routes are mounted under global prefix `/api` (`packages/server/src/main.ts`) and pass through `SerializeInterceptor` (wire format: `snake_case`).

## 1. System, Auth & Onboarding Endpoints
| Endpoint Prefix | Controller / Module | Key Operations |
|---|---|---|
| `/api/system_db` | `SystemDBController` | `GET /` (health ping), `GET /update-check` (GitHub Release version check), `GET /update-status` (live installer progress), `POST /update-install` (in-app download, silent upgrade & auto-restart) |
| `/api/auth` | `AuthController` | `POST /signup`, `POST /signin`, `POST /logout`, `POST /send_reset_password`, `POST /reset_password`, `POST /2fa/setup`, `POST /2fa/verify`, `POST /2fa/recovery` |
| `/api/organization` | `OrganizationController` | `GET /current`, `POST /build` (creates & migrates tenant DB), `GET /build/:jobId`, `PUT /` |
| `/api/dashboard` | `DashboardController` | `GET /boot` (authenticated user, organization metadata, subscription, features, settings) |

## 2. Core Accounting, Banking & Tax Endpoints
| Endpoint Prefix | Controller / Module | Key Operations |
|---|---|---|
| `/api/accounts` | `AccountsController` | CRUD Chart of Accounts, activate/deactivate, account transactions |
| `/api/manual-journals` | `ManualJournalsController` | CRUD & publish balanced multi-line manual journal entries |
| `/api/recurring-journals` | `RecurringJournalsController` | CRUD, pause/resume, and schedule recurring journal entries |
| `/api/currencies`, `/api/exchange_rates` | `CurrenciesController`, `ExchangeRatesController` | Manage foreign currencies and exchange rates |
| `/api/tax_rates` | `TaxRatesController` | CRUD sales/purchase tax rates and country tax presets |
| `/api/branches`, `/api/tracking-categories` | `BranchesController`, `TrackingCategoriesController` | Multi-branch and dimension tracking CRUD |
| `/api/cashflow` / `/api/banking/*` | `BankingAccountsController`, `BankingTransactionsController`, `BankRulesController` | Bank accounts, feeds, categorize, match, exclude, and bank rules |

## 3. Sales, POS & Receivables Endpoints
| Endpoint Prefix | Controller / Module | Key Operations |
|---|---|---|
| `/api/customers` | `CustomersController` | CRUD customers, opening balance, activation |
| `/api/sale-estimates` | `SaleEstimatesController` | CRUD quotes/estimates, deliver, approve/reject, convert to invoice, PDF/Email/SMS |
| `/api/sale-invoices` | `SaleInvoicesController` | CRUD invoices, deliver, write-off, payment links, PDF/Email/SMS |
| `/api/recurring-invoices` | `RecurringInvoicesController` | CRUD recurring invoice schedules |
| `/api/sale-receipts` | `SaleReceiptsController` | CRUD instant sale receipts (used by POS & Automation), PDF/Email/SMS |
| `/api/payment_receives` | `PaymentReceivedController` | Record customer invoice payments, PDF/Email/SMS |
| `/api/credit-notes` | `CreditNotesController` | CRUD customer credit notes, refunds, apply to invoices |
| `/api/payment-services`, `/api/payment-links`, `/api/webhooks` | `PaymentServicesController`, `PaymentLinksController`, `WebhooksController` | Configure & process Stripe, Paystack, Flutterwave, and Hubtel online payments |

## 4. Purchases, Expenses & Inventory Endpoints
| Endpoint Prefix | Controller / Module | Key Operations |
|---|---|---|
| `/api/vendors` | `VendorsController` | CRUD suppliers/vendors |
| `/api/bills`, `/api/bill_payments` | `BillsController`, `BillPaymentsController` | CRUD vendor purchase bills, landed costs, and bill payments |
| `/api/vendor-credits` | `VendorCreditController` | CRUD vendor credits, refunds, apply to bills |
| `/api/expenses` | `ExpensesController` | CRUD multi-category business expenses |
| `/api/items`, `/api/item_categories` | `ItemsController`, `ItemCategoryController` | CRUD inventory/service items and categories |
| `/api/inventory-adjustments` | `InventoryAdjustmentsController` | `POST /quick` & CRUD inventory quantity/value adjustments |
| `/api/warehouses`, `/api/warehouse-transfers` | `WarehousesController`, `WarehouseTransfersController` | Multi-warehouse locations and stock transfers |

## 5. Financial Statements, Communications & Settings Endpoints
| Endpoint Prefix | Controller / Module | Key Operations |
|---|---|---|
| `/api/financial_statements/*` | `FinancialStatements` controllers | Balance Sheet, Profit & Loss, Cash Flow Statement, Trial Balance, General Ledger, Journal, AR/AP Aging, Sales/Purchases by Item, Inventory Valuation (JSON, Table, PDF, CSV, XLSX) |
| `/api/settings`, `/api/smtp-settings` | `SettingsController`, `SmtpSettingsController` | Organization preferences, receipt display settings, SMS integration (`twilio`, `hubtel`, `smsonlinegh`), per-tenant SMTP configuration & test email |
| `/api/users`, `/api/roles`, `/api/audit-logs` | `UsersController`, `RolesController`, `AuditLogsController` | Team invites, RBAC permissions, financial audit trail |
| `/api/attachments`, `/api/import`, `/api/export` | `AttachmentsController`, `ImportController`, `ExportController` | S3 document attachments, CSV/XLSX bulk import & export |
