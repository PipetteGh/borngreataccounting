# Database Testing & Auditing Guide (Agent C)

## Scope
- System DB Migrations & Seeds: `packages/server/src/database/system/{migrations,seeds}` (39 migrations)
- Tenant DB Migrations & Seeds: `packages/server/src/database/tenant/{migrations,seeds}` (123 migrations)
- Models: `packages/server/src/models` and `packages/server/src/modules/**/models`

## Audit Checklist
1. **Dual Migration Discipline**:
   - Always run `pnpm run build:server` before running `pnpm run system:migrate:latest` or `pnpm run tenants:migrate:latest`.
   - Use `snake_case` for all MariaDB table and column names.
2. **Double-Entry Ledger Integrity**:
   - Every posted financial transaction (`accounts_transactions`) must balance (`SUM(debit) == SUM(credit)`).
   - Inventory cost and quantity adjustments must reconcile with `items_entries` and `inventory_cost_lot_tracker`.
3. **Safety Rules**:
   - Never run destructive commands (`DROP DATABASE`, `migrate:rollback` on production data).
   - Ensure system seed data (`plans` table `'free'` plan) is idempotently present during tenant onboarding.
4. **Query Performance & Safety**:
   - Verify foreign keys and composite indexes on high-cardinality tenant tables (`accounts_transactions(account_id, date)`, `items_entries(item_id)`, `sales_invoices(customer_id, invoice_date)`).
   - Parameterize all raw Knex queries (`knex.raw('... ?', [val])`).
