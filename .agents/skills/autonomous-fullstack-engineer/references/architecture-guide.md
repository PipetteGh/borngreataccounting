# Architecture Guide (`BorngreatAccounting`)

## Monorepo Layout
- `packages/server` (`@borngreataccounting/server`): NestJS 10 API & CLI (`src/main.ts`, `src/cli.ts`), Objection.js + Knex ORM, Bull/BullMQ Redis queues, Passport JWT auth, `nestjs-cls` tenant context.
- `packages/webapp` (`@borngreataccounting/webapp`): React 18 SPA built with Vite 5, BlueprintJS, Redux, `@tanstack/react-query`, Formik + Yup, React Router v5.
- `shared/borngreataccounting-utils`: Shared formatting, case-conversion, and utility helpers (`tsup` CJS + ESM).
- `shared/pdf-templates`: SSR React PDF templates for invoices, receipts, estimates, credit notes, and financial statements.
- `shared/email-components`: `react-email` transactional email templates.
- `shared/sdk-ts`: OpenAPI-generated TypeScript client (`openapi-typescript` + `openapi-fetch`) with snake_case request and optional camelCase response middleware.

## Request/Response Data Flow & Case Conversion
```text
Webapp (camelCase)
  -> SDK snakeCaseRequestMiddleware / Legacy axios transfromToSnakeCase
  -> Wire Format (snake_case)
  -> Server SerializeInterceptor (inbound: snake_case -> camelCase)
  -> NestJS Controller & class-validator DTOs (camelCase)
  -> Service & Objection.js Models (camelCase properties -> snake_case DB columns)
  -> Server SerializeInterceptor (outbound: camelCase -> snake_case)
  -> Wire Format (snake_case)
  -> SDK camelCaseResponseMiddleware (when enableCamelCaseTransform: true) / Legacy transformToCamelCase
  -> Webapp (camelCase)
```

## Multi-Tenancy Architecture
- **System DB (`borngreat_system`)**: Stores `system_users`, `organizations`, `subscriptions`, `plans`, `oneclick_demos`, and global settings (39 migrations).
- **Tenant DBs (`borngreat_tenant_<organizationId>`)**: Isolated database per organization managed by `TenantDBManager` and `KnexTenantRepository` (123 migrations).
- **Context Propagation**: `nestjs-cls` stores `organizationId` and `userId` per HTTP request or BullMQ job.
