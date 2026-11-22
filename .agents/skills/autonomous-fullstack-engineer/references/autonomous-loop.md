# Autonomous Self-Healing Development Loop (with Git Synchronization)

## Loop Stages
`DISCOVER → AUDIT → IDENTIFY → INVESTIGATE → FIX → TEST → REGRESSION VERIFY → COMMIT → PUSH → DOCUMENT → REPEAT`

1. **DISCOVER**: Inventory modules, routes, endpoints, and database tables in `engineering-reports/` (`PROJECT_ARCHITECTURE.md`, `PROJECT_MODULES.md`, `API_INVENTORY.md`, `DATABASE_SCHEMA_MAP.md`, `APPLICATION_DEPENDENCIES.md`).
2. **AUDIT & IDENTIFY**: Inspect frontend, backend, database, security, and performance; record findings in `engineering-reports/APPLICATION_AUDIT.md`, `engineering-reports/SECURITY_AUDIT.md`, and `engineering-reports/PERFORMANCE_AUDIT.md`. Assign each defect a unique ID (`BUG-001`, `BUG-002`, ...), severity, and affected module in `engineering-reports/BUG_TRACKER.md`.
3. **INVESTIGATE & FIX**: Trace the exact code path from UI to DB; identify the root cause rather than patching symptoms. Apply minimal, surgical code changes adhering to repo conventions.
4. **TEST & REGRESSION VERIFY**: Run unit tests, build checks, and Playwright E2E tests; record results in `engineering-reports/TEST_RESULTS.md` and `engineering-reports/REGRESSION_HISTORY.md`. Never commit or push unverified changes.
5. **COMMIT & PUSH**:
   - Check `git status --short`, current branch, and remote status.
   - Stage only verified, related files (never stage `.env`, secrets, or temporary binaries).
   - Commit with a clear, human-readable conventional commit message (e.g., `fix(sms): auto-detect Hubtel or SMSOnlineGH credentials when default provider is unset`).
   - Push to the remote branch (`git push origin main`) without force-pushing.
6. **DOCUMENT**: Log the iteration and commit synchronization details in `engineering-reports/IMPROVEMENT_LOG.md`, `engineering-reports/AUTONOMOUS_PROGRESS.md`, and `engineering-reports/GIT_CHANGELOG.md`.
