# PROJECT MODULES (`BorngreatAccounting`)

## 1. Workspace Packages
| Package | Path | Role |
|---|---|---|
| `@borngreataccounting/server` | `packages/server` | NestJS 10 API server, CLI (`src/cli.ts`), multi-tenant DB manager, background processors |
| `@borngreataccounting/webapp` | `packages/webapp` | React 18 SPA frontend across Accounting, Sales, Purchases, Inventory, POS, Automation, Reports, and Preferences |
| `@borngreataccounting/utils` | `shared/borngreataccounting-utils` | Shared case-conversion, number/currency formatting, and helper utilities |
| `@borngreataccounting/pdf-templates` | `shared/pdf-templates` | Server-side rendered PDF templates for invoices, receipts, estimates, credit notes, and financial statements |
| `@borngreataccounting/email-components` | `shared/email-components` | Transactional email templates built with `react-email` |
| `@borngreataccounting/sdk-ts` | `shared/sdk-ts` | OpenAPI-generated TypeScript SDK client and case-conversion middleware |

## 2. Backend Feature Modules (`packages/server/src/modules/`)
| Domain | Modules |
|---|---|
| **Core & Tenancy** | `App`, `System`, `Tenancy`, `TenantDBManager`, `Organization`, `Subscription`, `CLI`, `Features`, `Metable`, `Resource`, `Transformer`, `DynamicListing`, `CustomViews`, `Views`, `Search` |
| **Auth, Users & Security** | `Auth`, `UsersModule`, `Roles`, `AuditLogs`, `EE/AuditLogs` |
| **Double-Entry Accounting** | `Accounts`, `ManualJournals`, `EE/RecurringJournals`, `Ledger`, `TransactionsLocking`, `AutoIncrementOrders`, `Branches`, `TrackingCategories`, `Currencies`, `ExchangeRates`, `TaxRates` |
| **Sales & Receivables** | `Customers`, `Contacts`, `SaleEstimates`, `SaleInvoices`, `RecurringInvoices`, `SaleReceipts`, `PaymentReceived`, `CreditNotes`, `CreditNoteRefunds`, `CreditNotesApplyInvoice`, `PaymentLinks`, `PaymentServices`, `StripePayment`, `Webhooks` |
| **Purchases & Payables** | `Vendors`, `Bills`, `BillPayments`, `Expenses`, `VendorCredit`, `VendorCreditsApplyBills`, `VendorCreditsRefund` |
| **Inventory & Warehouses** | `Items`, `ItemCategories`, `TransactionItemEntry`, `InventoryAdjutments`, `InventoryCost`, `ItemReorderPoints`, `Warehouses`, `WarehousesTransfers`, `EE/Batches` |
| **Banking & Cash Flow** | `BankingAccounts`, `BankingTransactions`, `BankingCategorize`, `BankingMatching`, `BankingTransactionsExclude`, `BankingTranasctionsRegonize`, `BankRules`, `BankingPlaid`, `Plaid` |
| **Reports & Analytics** | `FinancialStatements` (Balance Sheet, Profit & Loss, Cash Flow, Trial Balance, General Ledger, Journal, AR/AP Aging, Sales/Purchases by Item, Inventory Valuation, Tax Summary), `Dashboard`, `Analytics` |
| **Communications & I/O** | `Mail`, `MailNotification`, `MailTenancy`, `SMS` (Twilio, Hubtel, SMSOnlineGH), `Notifications`, `Socket`, `Attachments`, `S3`, `Export`, `Import`, `PdfTemplate`, `ChromiumlyTenancy`, `TemplateInjectable`, `Loops` |

## 3. Frontend Containers (`packages/webapp/src/containers/`)
| Area | Containers |
|---|---|
| **Core & Shell** | `Authentication`, `Setup`, `Organization`, `Dashboard`, `Homepage` (`HomepageContent`, `HomepageInsights`), `Router`, `GlobalErrors`, `KeyboardShortcuts`, `UniversalSearch`, `QuickNewDropdown` |
| **Point of Sale & Automation** | `POS` (`POSPage.tsx` — Top 10 Most Purchased, O(1) SKU/Barcode Auto-Add, Thermal Receipt Print & 30s Auto-Close), `Automation` (`AutomationPage.tsx` — 19 Presets & Bulk Multi-Item NLP Execution) |
| **Sales & Receivables** | `Customers`, `Sales` (Estimates, Invoices, Recurring Invoices, Receipts, Credit Notes, Payment Received), `PaymentLink`, `PaymentPortal`, `SendMailNotification`, `NotifyViaSMS` |
| **Purchases & Payables** | `Vendors`, `Purchases` (Bills, Payment Made, Vendor Credits), `Expenses` |
| **Inventory & Warehouses** | `Items`, `ItemsCategories`, `InventoryAdjustments`, `WarehouseTransfers` |
| **Accounting & Banking** | `Accounting` (Manual Journals, Recurring Journals), `Accounts` (Chart of Accounts), `JournalEntriesTable`, `JournalNumber`, `Banking`, `CashFlow`, `TransactionsLocking` |
| **Financial Reports** | `FinancialStatements` (`BalanceSheet`, `ProfitLossSheet`, `CashFlowStatement`, `TrialBalanceSheet`, `GeneralLedger`, `JournalSheet`, `ARAgingSummary`, `APAgingSummary`, `SalesByItems`, `PurchasesByItems`, `InventoryValuation`, etc.) |
| **Preferences & Settings** | `Preferences` (General, Branding, Themes, Users, Roles, Security, Payment Methods, SMTP Settings, SMS Integration, Currencies, Branches, Warehouses, Tax Rates, About & In-App Auto-Updater), `TwoFactor`, `Subscriptions`, `Users` |
