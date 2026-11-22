# Backend Testing & Auditing Guide (Agent B)

## Scope
`packages/server/src` — NestJS 10, TypeScript, Objection.js, Knex, Bull/BullMQ, Passport JWT, `class-validator`.

## Audit Checklist
1. **Controllers & DTOs**:
   - Define DTO properties in `camelCase` with `@ApiProperty` and `class-validator` decorators; `SerializeInterceptor` handles wire `snake_case` conversion automatically.
   - Ensure public endpoints explicitly carry `@PublicRoute()`; all tenant endpoints must validate `JWTAuthGuard` and tenant readiness.
2. **Services & Business Logic**:
   - Use `ServiceError(code, message)` for domain errors caught by exception filters.
   - Ensure multi-step ledger, invoice, receipt, bill, and inventory mutations execute inside Knex/Objection transactions (`UnitOfWork`).
3. **Background Jobs (BullMQ / Bull)**:
   - Always set `clsService.set('organizationId', organizationId)` and `clsService.set('userId', userId)` inside `@UseCls()` processors before invoking tenant-scoped services.
4. **External Gateways**:
   - Mail (`SmtpSettingsService` / `MailTransporterService`): DB settings in `organization_settings` override `.env` fallback.
   - SMS (`SmsService`): Supports `twilio`, `hubtel`, and `smsonlinegh` with E.164 phone parsing (including Ghana `'GH'` local number fallback).
   - Payments (`PaymentServices`): Stripe, Paystack, Flutterwave, and Hubtel with webhook signature verification.
5. **Build & Test Commands**:
   - Build server & shared packages: `pnpm run build:server`
   - Run unit tests: `cd packages/server; pnpm exec jest <path>`
   - Run E2E tests: `cd packages/server; pnpm run test:e2e`
