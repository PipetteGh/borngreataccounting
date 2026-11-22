# SECURITY AUDIT (`BorngreatAccounting`)

## 1. Authentication & Session Security
- **Password Hashing**: Uses `bcryptjs` (10 salt rounds) across `Auth.utils.ts` and `SystemUser.ts`.
- **JWT & Multi-Tenancy**: Passport JWT strategy validates Bearer tokens; `nestjs-cls` isolates per-request `organizationId` and `userId`; `TenantDBManager` routes queries strictly to `borngreat_tenant_<organizationId>`.
- **Two-Factor Authentication (2FA)**: TOTP (`otplib`) with hashed recovery codes (`TwoFactorRecoveryCodes`).

## 2. External Gateway & Webhook Security
- **SMTP Settings**: Per-tenant SMTP credentials stored in tenant DB (`settings` group `smtp`); endpoints require `JWTAuthGuard` + `organization-id` header; password masked in GET responses.
- **SMS Providers (Twilio, Hubtel, SMSOnlineGH)**: Credentials stored in tenant `settings` (`sms-integration`) with `.env` fallback; never exposed to unauthenticated routes.
- **Payment Webhooks**: Signature validation enforced on Stripe (`stripe-signature`), Paystack (`x-paystack-signature` HMAC-SHA512), Flutterwave (`verif-hash`), and Hubtel callbacks.

## 3. Injection & XSS Controls
- **Database Queries**: All Objection.js and Knex queries use parameterized bindings.
- **Receipt & Print Rendering**: Dynamic fields in `POSPage.tsx` thermal receipt HTML are escaped via `escapeHtml(...)`.
- **In-App Auto-Updater**: Downloads official release installer over HTTPS from `github.com/PipetteGh/borngreataccounting/releases` and executes silent upgrade without exposing shell interpolation to user input.
