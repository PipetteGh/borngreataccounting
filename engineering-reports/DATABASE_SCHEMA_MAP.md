# DATABASE SCHEMA MAP (`BorngreatAccounting`)

BorngreatAccounting uses a **Dual MariaDB Schema Architecture**:
1. **System Database (`borngreat_system`)** — 39 Knex migrations (`packages/server/src/database/system/migrations/`).
2. **Tenant Databases (`borngreat_tenant_<organizationId>`)** — 123 Knex migrations (`packages/server/src/database/tenant/migrations/`).

## 1. System Database (`borngreat_system`) Core Tables
| Table | Primary Key | Purpose & Relationships |
|---|---|---|
| `system_users` | `id` | Global user accounts (`email`, `password` hashed via `bcryptjs`, `first_name`, `last_name`, `active`, `two_factor_secret`, `two_factor_enabled`, `recovery_codes`) |
| `organizations` | `id` | Tenant registry (`organization_id` slug, `name`, `base_currency`, `fiscal_year`, `country`, `initialized_at`, `seeded_at`) |
| `system_users_organizations` | `id` | Many-to-many join linking `system_users` to `organizations` |
| `plans` | `id` | Subscription plans (`slug` e.g. `'free'`, `'basic'`, `'standard'`, `price`, `invoice_volume`, `seats`) |
| `subscriptions` | `id` | Active tenant subscriptions (`organization_id` → `organizations`, `plan_id` → `plans`, `status`, Stripe metadata) |
| `password_resets`, `invites` | `id` | Password reset tokens and organization user invitation tokens |
| `oneclick_demos` | `id` | Ephemeral demo tenant tracking |

## 2. Per-Tenant Database (`borngreat_tenant_<orgId>`) Core Tables
| Domain | Tables | Key Relationships & Ledger Links |
|---|---|---|
| **Users, Roles & Settings** | `users`, `roles`, `role_permissions`, `settings`, `metable_metadata`, `views`, `view_columns`, `view_roles`, `api_keys`, `audit_logs` | `users.role_id → roles.id`; `settings` stores `group`/`key`/`value` (including `sms-integration`, `smtp`, `receipts`, `organization`) |
| **Chart of Accounts & General Ledger** | `accounts`, `accounts_transactions`, `manual_journals`, `manual_journals_entries`, `recurring_journals`, `recurring_journal_entries`, `currencies`, `exchange_rates`, `tax_rates`, `tax_rate_transactions`, `branches`, `tracking_categories`, `tracking_category_options`, `transactions_locking` | `accounts_transactions.account_id → accounts.id` is the single source of truth for double-entry accounting (`credit`, `debit`, `reference_type`, `reference_id`, `date`, `branch_id`) |
| **Contacts (AR & AP)** | `contacts` | Unified table differentiated by `contact_service` (`customer` vs `vendor`), storing `display_name`, `email`, `phone`, `opening_balance`, `currency_code`, `active` |
| **Sales & Receivables** | `sales_estimates`, `sales_invoices`, `recurring_invoices`, `sales_receipts`, `payment_receives`, `payment_receives_entries`, `credit_notes`, `credit_note_refund_transactions`, `credit_note_applied_invoices`, `payment_links`, `payment_gateway_transactions` | Line items stored in `items_entries` (`reference_type` + `reference_id`); posting generates balanced `accounts_transactions` entries |
| **Purchases & Payables** | `bills`, `bills_payments`, `bills_payments_entries`, `bill_located_costs`, `expenses_transactions`, `expense_transaction_categories`, `vendor_credits`, `vendor_credit_refund_transactions`, `vendor_credit_applied_bills` | Links to `contacts` (`vendor_id`), `items_entries`, and `accounts_transactions` |
| **Inventory & Warehouses** | `items`, `item_categories`, `items_entries`, `inventory_adjustments`, `inventory_adjustments_entries`, `inventory_cost_lot_tracker`, `warehouses`, `items_warehouses_quantity`, `warehouse_transfers`, `warehouse_transfers_entries`, `item_reorder_points`, `batches` | `items.category_id → item_categories.id`; `items_warehouses_quantity` tracks per-warehouse stock; `inventory_cost_lot_tracker` tracks FIFO/average cost lots |
| **Banking & Cash Flow** | `bank_accounts`, `uncategorized_cashflow_transactions`, `matched_bank_transactions`, `recognized_bank_transactions`, `bank_rules`, `bank_rule_conditions`, `plaid_items` | Reconciles imported/Plaid bank transactions against `accounts_transactions` |
| **Attachments** | `documents`, `document_links` | Polymorphic link between S3 objects (`documents`) and financial transactions (`model_ref`, `model_id`) |
