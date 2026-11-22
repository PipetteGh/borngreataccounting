# APPLICATION AUDIT (`BorngreatAccounting`)

## 1. Executive Summary
- **Application**: BorngreatAccounting (`BtAccounting`) — Multi-tenant double-entry accounting, POS, automation, and financial reporting platform.
- **Packages Audited**: `@borngreataccounting/server`, `@borngreataccounting/webapp`, `@borngreataccounting/utils`, `@borngreataccounting/pdf-templates`, `@borngreataccounting/email-components`, `@borngreataccounting/sdk-ts`.
- **Database Schemas Audited**: System DB (`39` migrations) and Tenant DB (`123` migrations).

## 2. Multi-Layer Audit Findings & Status
| Area | Finding | Status |
|---|---|---|
| **Auth & Native Binary Portability** | Native `bcrypt` binary caused `502 Bad Gateway` crashes on Windows machines without Visual C++ Build Tools. Replaced with pure-JS `bcryptjs` across `Auth.utils.ts` and `SystemUser.ts`. | **Resolved** |
| **System DB Seed & Onboarding** | Fresh Windows installations lacked the `'free'` plan row in `plans`, causing `PLAN_NOT_FOUND` on registration, and skipped the SMTP setup page due to a `setOrganizationSetupCompleted(true)` race condition in `SetupInitializingForm.tsx`. | **Resolved** |
| **Per-Tenant SMTP Authorization** | `SmtpSettingsForm.tsx` omitted `Authorization: Bearer <token>` and `organization-id` headers when calling `/api/smtp-settings`. | **Resolved** |
| **MariaDB Port Conflict Fallback** | Local installations with XAMPP/MySQL on port `3306` failed to start portable MariaDB. Added automatic fallback to port `3307` in `scripts/windows-runtime.ps1`. | **Resolved** |
| **POS Layout, Fullscreen Modal & Speed** | Non-fullscreen POS clipped the `Complete Sale` button; fullscreen mode hid the receipt `<Dialog>` behind the browser fullscreen top layer; receipt lacked 30s auto-close; initial view rendered all 250+ items instead of Top 10 Most Purchased. | **Resolved** |
| **Automation NLP & Bulk Execution** | `AutomationPage.tsx` used `.find()` (updating only 1 item) and required exact full-name matches. Upgraded to token-based multi-item matching and concurrent batch execution across all matching items (e.g., 200+ `gari` products). | **Resolved** |
| **Financial Report & Homepage Charts** | Initial chart extractor matched `AGGREGATE` section headers instead of `TOTAL` rows (`INCOME`, `COST_OF_SALES`, `EXPENSES`, `NET_INCOME`, `ASSETS`, `LIABILITY`, `EQUITY`) and crashed if `salesByItems` returned a non-array object. | **Resolved** |
| **SMS Provider Fallback** | `SmsIntegrationSettingsService` defaulted strictly to `'twilio'` when `sms_provider` was unset, ignoring configured Hubtel or SMSOnlineGH credentials. Added automatic provider fallback detection. | **Resolved** |
