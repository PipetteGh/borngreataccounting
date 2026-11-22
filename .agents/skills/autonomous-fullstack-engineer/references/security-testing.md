# Security Testing & Auditing Guide (Agent D)

## Scope
End-to-end security review of `BorngreatAccounting` across authentication, multi-tenant isolation, payment webhooks, file uploads, and secret management.

## OWASP Audit Checklist
1. **Authentication & Password Hashing**:
   - Pure-JS `bcryptjs` hashing (`Auth.utils.ts`, `SystemUser.ts`) for cross-platform compatibility without native binary crashes.
   - TOTP Two-Factor Authentication (2FA) and hashed recovery codes.
2. **Multi-Tenant Isolation**:
   - Verify `organization-id` header is validated against the authenticated user's organization membership before switching tenant DB pools.
3. **Payment Webhook Verification**:
   - Verify cryptographic signatures on all incoming payment webhooks (`stripe-signature`, `x-paystack-signature`, `verif-hash` for Flutterwave, Hubtel callbacks).
4. **Input Validation & Injection Prevention**:
   - Ensure all controller payloads pass through `ValidationPipe` and Objection.js/Knex parameterized queries.
   - Escape HTML in dynamic print/receipt templates (`escapeHtml` in `POSPage.tsx`).
5. **Secrets & Environment**:
   - Never commit `.env` files, private API keys, or SMTP/SMS secrets.
   - Store per-tenant gateway credentials in the tenant's isolated `settings` / `organization_settings` table.
