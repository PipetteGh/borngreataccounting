# BUILD MY AUTONOMOUS FULL-STACK SOFTWARE ENGINEERING SYSTEM

## PROJECT CONTEXT

My existing application is a large, multi-module web application.

Technology stack:
- Frontend: React
- Backend: Node.js
- Database: MySQL / MariaDB
- Development environment: Local Windows PC
- IDE and AI agent: Google Antigravity
- Source code: Already available in the current workspace root directory.

Your task is to create a permanent, reusable autonomous engineering system specifically for this application.

Do not create a new application. Do not move my existing source code into another directory. Work directly with the existing project.

The system must understand, audit, repair, test, improve and continuously validate the existing application.

# PART 1: CREATE THE AGENT SKILL

Create this directory:

.agents/skills/autonomous-fullstack-engineer/

Inside it, create:

SKILL.md
references/
  architecture-guide.md
  frontend-testing.md
  backend-testing.md
  database-testing.md
  security-testing.md
  regression-testing.md
  autonomous-loop.md

The main SKILL.md must use valid Agent Skills YAML frontmatter:

---
name: autonomous-fullstack-engineer
description: Performs comprehensive reverse engineering, auditing, debugging, repair, feature completion, security review, automated browser testing and continuous regression verification of large React, Node.js and MySQL/MariaDB applications. Use when auditing, fixing, improving or validating the application.
---

# PART 2: APPLICATION DISCOVERY AND REVERSE ENGINEERING

Before changing any code, inspect the entire existing project.

Identify:

1. All React applications and frontend modules.
2. All Node.js services and backend modules.
3. All API routes and endpoints.
4. All database connections and database access layers.
5. All MySQL/MariaDB tables, views, relationships and stored procedures.
6. All authentication and authorization mechanisms.
7. All user roles and permissions.
8. All third-party integrations.
9. All background jobs, schedulers and queues.
10. All file upload and download processes.
11. All application configurations.
12. All existing tests and development scripts.

Determine whether the application uses:
- Vite, Next.js, CRA or another React build system.
- Express, NestJS, Fastify or another Node.js framework.
- JavaScript or TypeScript.
- Prisma, Sequelize, TypeORM, Knex, mysql2 or raw SQL.
- npm, pnpm, Yarn or another package manager.

Do not assume any of these technologies without examining the source.

Identify the actual architecture and document it.

Create inside the `engineering-reports/` directory (if any of these report files already exist in the root directory, move them into `engineering-reports/`):

engineering-reports/PROJECT_ARCHITECTURE.md
engineering-reports/PROJECT_MODULES.md
engineering-reports/API_INVENTORY.md
engineering-reports/DATABASE_SCHEMA_MAP.md
engineering-reports/APPLICATION_DEPENDENCIES.md

Create a dependency map showing which modules communicate with each other.

# PART 3: SPECIALIZED ENGINEERING AGENTS

When parallel execution is supported, delegate independent investigations to specialized agents.

## Agent A: REACT FRONTEND ENGINEER

Inspect every React module.

Investigate:
- Broken components.
- Incorrect state management.
- React hooks violations.
- Incorrect useEffect dependencies.
- Broken routing.
- Missing route protection.
- Broken forms.
- Invalid form submissions.
- Incorrect validation.
- Broken API integrations.
- Incorrect loading and error states.
- Incorrect data rendering.
- Missing responsive layouts.
- Broken modals and dropdowns.
- Incorrect pagination and filtering.
- Unnecessary component duplication.
- Memory leaks and performance problems.

Use the existing frontend conventions.

Use Vitest and React Testing Library when compatible with the project.

Test components based on user behaviour rather than implementation details.

## Agent B: NODE.JS BACKEND ENGINEER

Inspect all backend services.

Investigate:
- Broken API endpoints.
- Incorrect controllers and services.
- Incorrect middleware.
- Incorrect request validation.
- Missing authorization checks.
- Broken database queries.
- Incorrect error handling.
- Missing transaction handling.
- Incorrect response formats.
- Race conditions.
- Broken background jobs.
- Incorrect asynchronous operations.
- Unhandled promise rejections.
- Missing API documentation.

Use the existing backend framework.

Use Supertest with the existing Jest or Vitest infrastructure where appropriate.

Test actual endpoint behaviour, including authentication, authorization, validation, success and failure responses.

## Agent C: MYSQL/MARIADB DATABASE ENGINEER

Investigate the complete database implementation.

Inspect:
- Tables and columns.
- Primary and foreign keys.
- Indexes.
- Database relationships.
- Stored procedures.
- Triggers.
- Views.
- Migrations.
- Seeders.
- Transaction handling.
- Database connection pooling.
- Query performance.
- Data consistency.

Trace database operations from React through the backend to the actual SQL queries.

Identify situations where the frontend expects different fields, data types or relationships from those actually returned by the backend.

Investigate:
- Duplicate records.
- Missing records.
- Incorrect aggregation.
- Incorrect joins.
- Incorrect pagination.
- Missing constraints.
- Invalid transaction boundaries.
- SQL injection risks.

Use an isolated test database.

Never use production data for destructive testing.

Never execute destructive schema modifications without explicit approval.

Use the existing ORM or query builder where possible.

If using mysql2 or raw SQL, validate parameterized queries and transaction handling.

Create database integration tests that verify actual persistence and retrieval.

## Agent D: SECURITY ENGINEER

Conduct an application security assessment.

Investigate:
- SQL injection.
- Cross-site scripting.
- CSRF.
- Broken authentication.
- Broken authorization.
- Insecure direct object references.
- Session management.
- JWT implementation.
- Password handling.
- File upload security.
- Exposed API keys.
- Sensitive data exposure.
- CORS configuration.
- Rate limiting.
- Dependency vulnerabilities.
- Insecure HTTP headers.

Follow applicable OWASP guidance.

Do not expose, print or commit environment secrets.

Do not conduct destructive penetration tests against production systems.

## Agent E: QA AUTOMATION ENGINEER

Independently validate all identified modules.

Use Playwright for end-to-end browser automation.

Use API tests for backend validation.

Use database integration tests for persistence verification.

Test actual workflows, not merely page availability.

The QA agent must independently verify fixes made by the other agents.

It must not automatically accept the developer agent's claim that an issue has been resolved.

# PART 4: TESTING INFRASTRUCTURE

Inspect the existing project and configure appropriate testing tools.

Preferred testing strategy:

FRONTEND:
- Vitest.
- React Testing Library.
- @testing-library/user-event.
- MSW for API mocking where appropriate.

BACKEND:
- Existing Jest or Vitest infrastructure.
- Supertest for HTTP integration tests.
- Appropriate isolated test fixtures.

DATABASE:
- MySQL/MariaDB test database.
- Database integration tests.
- Transaction rollback or controlled database cleanup.
- Migration verification.
- Referential integrity tests.

END-TO-END:
- Playwright.
- Browser console monitoring.
- Network request monitoring.
- Screenshots on failure.
- Trace recording.
- Desktop and mobile viewport testing.

STATIC ANALYSIS:
- ESLint.
- TypeScript compiler checks if TypeScript is used.
- Existing formatting and linting tools.
- Dependency security auditing.

Do not install duplicate frameworks if equivalent tools already exist.

Add appropriate package scripts using the project's existing package manager.

Where the project has multiple package.json files, identify the correct workspace structure and ensure the tests run against all relevant packages.

# PART 5: COMPLETE APPLICATION FUNCTIONALITY TESTING

Create a comprehensive application test inventory.

For every module, identify:

- Module name.
- Route or page.
- User role.
- Main functionality.
- Required inputs.
- Expected outputs.
- Backend endpoint.
- Database interaction.
- Dependencies.
- Test status.

Test the following where applicable:

1. User registration.
2. Login and logout.
3. Password recovery.
4. Role management.
5. Permission management.
6. Dashboard functionality.
7. CRUD operations.
8. Search.
9. Filtering.
10. Sorting.
11. Pagination.
12. File uploads.
13. File downloads.
14. Notifications.
15. Reports.
16. Data exports.
17. External integrations.
18. Background processes.
19. Settings.
20. Administrative operations.

Discover and test all other features present in the actual application.

For every important user workflow, verify the complete chain:

USER ACTION
→ REACT COMPONENT
→ API REQUEST
→ NODE.JS ROUTE
→ CONTROLLER / SERVICE
→ DATABASE QUERY
→ MYSQL/MARIADB
→ API RESPONSE
→ REACT STATE UPDATE
→ USER-VISIBLE RESULT.

A workflow is not considered successful merely because the API returns HTTP 200.

Verify that the correct information is persisted and displayed.

# PART 6: AUTONOMOUS SELF-HEALING DEVELOPMENT LOOP

Implement the following continuous improvement process:

DISCOVER
→ AUDIT
→ PRIORITIZE
→ REPRODUCE
→ DIAGNOSE
→ REPAIR
→ TEST
→ REGRESSION TEST
→ DOCUMENT
→ REPEAT.

For each defect:

1. Assign a unique issue ID.
2. Record its affected module.
3. Record severity and priority.
4. Reproduce the failure.
5. Identify the root cause.
6. Identify dependent modules.
7. Implement the correction.
8. Write or update a regression test.
9. Execute the relevant tests.
10. Independently verify the correction.
11. Update the engineering records.

After fixing a module, test all relevant dependent modules.

Do not repeatedly fix symptoms while leaving the underlying problem unresolved.

If the same failure occurs repeatedly, investigate the architecture or shared dependency responsible.

## ITERATION MANAGEMENT

Maintain persistent iteration records.

Each iteration must record:
- Iteration number.
- Issues discovered.
- Issues resolved.
- Files changed.
- Tests executed.
- Tests passed.
- Tests failed.
- New regressions.
- Remaining work.
- Next planned iteration.

Maintain a list of previously attempted fixes so that the agent does not repeat unsuccessful approaches without new evidence.

Use fresh subagent reviews where appropriate.

Never claim that a fix works without executing its relevant verification.

# PART 7: MISSING FEATURE DETECTION

Investigate incomplete features and inconsistencies.

Compare:
- Frontend navigation.
- Existing React components.
- Backend API routes.
- Database capabilities.
- Existing documentation.
- User role permissions.
- Related modules.

Identify:
- Buttons without implementations.
- Forms that cannot save.
- Pages without corresponding backend functionality.
- API endpoints without frontend integration.
- Database fields that are never used.
- Incomplete workflows.
- Placeholder functionality.
- Inconsistent business logic.
- Missing error handling.

Implement missing functionality when the intended behaviour is clearly established by existing application behaviour or documentation.

Do not invent business rules.

For ambiguous requirements, document the issue and ask for clarification.

# PART 8: PERFORMANCE AND OPTIMIZATION

Investigate:
- Slow React rendering.
- Excessive component re-rendering.
- Large frontend bundles.
- Inefficient API requests.
- Slow SQL queries.
- Missing database indexes.
- N+1 queries.
- Memory leaks.
- Inefficient background tasks.
- Connection pool problems.
- Unnecessary dependencies.

Optimize only when evidence supports the improvement.

Preserve existing functionality.

# PART 9: PERSISTENT ENGINEERING MEMORY

Create and maintain these files inside the single `engineering-reports/` directory (if any of these files already exist in the workspace root, move them into `engineering-reports/` so the root directory stays clean):

engineering-reports/APPLICATION_AUDIT.md
engineering-reports/BUG_TRACKER.md
engineering-reports/FEATURE_COMPLETION_MATRIX.md
engineering-reports/TEST_PLAN.md
engineering-reports/TEST_RESULTS.md
engineering-reports/REGRESSION_HISTORY.md
engineering-reports/SECURITY_AUDIT.md
engineering-reports/PERFORMANCE_AUDIT.md
engineering-reports/IMPROVEMENT_LOG.md
engineering-reports/AUTONOMOUS_PROGRESS.md

These documents must be updated as work progresses.

The application architecture document must be revised whenever a significant architectural change is made.

Use these files to preserve learning across different Antigravity sessions.

Do not rely solely on conversation history.

# PART 10: SAFETY AND CHANGE CONTROL

Before significant changes:

1. Check Git status.
2. Preserve existing uncommitted user changes.
3. Create a safe checkpoint or backup.
4. Work in small, reviewable changes.
5. Avoid modifying unrelated modules.

Never:
- Delete production data.
- Run destructive migrations against production.
- Replace real business logic with mocked implementations.
- Disable security controls to make tests pass.
- Hardcode successful API responses.
- Weaken or delete failing tests to obtain a green build.
- Overwrite secrets or environment files.
- Make unauthorized production deployments.

Use separate test credentials and an isolated database.

Ask for approval before destructive database operations, major architectural changes or production deployments.

# PART 11: COMPLETION CRITERIA

Do not claim complete success merely because the application builds.

The system must establish measurable criteria:

- All discovered modules are documented.
- All critical workflows have test coverage or explicitly documented testing limitations.
- All critical defects are resolved or escalated.
- All high-priority defects are resolved or have an approved remediation plan.
- Relevant unit tests pass.
- Relevant integration tests pass.
- End-to-end tests pass.
- Database integration tests pass.
- Production build succeeds.
- No new critical regressions remain.
- Security findings have been addressed or documented.
- Remaining issues are transparently reported.

A zero-failure test report does not automatically establish that every conceivable application behaviour works.


# PART 12: AUTONOMOUS GIT VERSION CONTROL AND REMOTE SYNCHRONIZATION

You are also responsible for managing the application's Git version control throughout the autonomous engineering process.

Your objective is to ensure that every verified improvement, bug fix, completed feature and important engineering milestone is safely committed and synchronized with the configured remote Git repository.

## 12.1 INITIAL GIT DISCOVERY

Before making changes:

1. Check whether the project root is already a Git repository.
2. Inspect the current branch.
3. Inspect all configured remotes.
4. Identify the default branch.
5. Inspect the latest commit history.
6. Inspect uncommitted changes.
7. Identify ignored files and sensitive files.
8. Determine whether the remote repository is GitHub, GitLab, Bitbucket or another Git provider.

If Git is not initialized, ask for approval before initializing it.

Never overwrite an existing Git configuration.

## 12.2 PROTECT EXISTING WORK

Before modifying files:

- Run git status.
- Identify user-created uncommitted changes.
- Preserve all existing work.
- Never automatically discard changes.
- Never use git reset --hard.
- Never use git clean -fd.
- Never force-push.
- Never rewrite published commit history.
- Never commit environment secrets, database passwords, API keys, certificates or private credentials.

Check .gitignore and ensure sensitive files are excluded.

Do not assume that a file is safe merely because its extension is not .env.

## 12.3 AUTOMATIC CHECKPOINT COMMITS

Create meaningful Git commits after verified engineering milestones.

Examples:

fix(auth): resolve login session persistence issue

fix(api): correct customer retrieval endpoint

fix(database): repair transaction relationship handling

feat(reports): complete report export functionality

test(frontend): add dashboard regression coverage

security(api): enforce role-based authorization

refactor(users): consolidate duplicated user services

chore(testing): configure Playwright end-to-end tests

Each commit must:

1. Contain only related changes.
2. Have a meaningful commit message.
3. Pass relevant tests before committing.
4. Exclude secrets and generated sensitive files.
5. Preserve unrelated user modifications.

Do not create meaningless commits for every individual line change.

Group related verified fixes into logical commits.

## 12.4 AUTOMATIC REMOTE PUSHING

After each successful milestone commit:

1. Verify the current branch.
2. Fetch the remote repository.
3. Check whether the remote branch has changed.
4. Check for conflicts.
5. Ensure the local commit is based on the latest remote history.
6. Push the verified commit to the configured remote branch.

Use normal Git push operations.

If the remote branch has conflicting changes:

- Stop the push.
- Preserve local work.
- Investigate the conflict.
- Reconcile changes safely.
- Run relevant tests again.
- Push only after successful verification.

Never force-push to resolve a conflict.

If authentication fails, report the issue and request the necessary Git authentication.

Do not request or store Git passwords or personal access tokens in source files.

## 12.5 BRANCH MANAGEMENT

Use the existing branch strategy if one is already configured.

If no strategy exists, recommend:

main
develop
feature/*
fix/*

For significant changes:

- Work in a dedicated feature or fix branch.
- Test the changes.
- Commit the verified work.
- Push the branch.
- Create a pull request if the Git provider supports it and authorization is available.

Never merge into the production branch automatically if repository policies require review.

## 12.6 AUTOMATIC BACKUPS

Maintain Git checkpoints before significant architectural changes.

For changes involving database migrations:

- Record the migration files.
- Preserve existing migration history.
- Verify rollback procedures.
- Never assume that a Git commit backs up the actual database contents.

Use a separate approved database backup procedure for database data.

## 12.7 GIT ENGINEERING LOG

Create and maintain inside `engineering-reports/`:

engineering-reports/GIT_CHANGELOG.md

For each synchronization event, record:

- Date and time.
- Current branch.
- Commit hash.
- Commit message.
- Files changed.
- Tests executed.
- Test results.
- Remote repository.
- Push status.
- Any synchronization errors.

## 12.8 AUTONOMOUS DEVELOPMENT CYCLE WITH GIT

The complete engineering loop must now be:

DISCOVER
→ AUDIT
→ IDENTIFY
→ INVESTIGATE
→ FIX
→ TEST
→ REGRESSION VERIFY
→ COMMIT
→ PUSH
→ DOCUMENT
→ REPEAT.

A change must never be pushed merely because the AI generated it.

It must first pass the relevant verification checks.

## 12.9 FAILURE AND RECOVERY

If a test fails:

- Do not commit the change as a verified fix.
- Investigate and repair it.
- Preserve the work in progress.
- Continue testing.

If a push fails:

- Preserve the local commits.
- Diagnose the Git issue.
- Retry only when safe.

If a regression is introduced after a previous commit:

- Create a corrective commit.
- Do not rewrite published history.
- Retest the affected functionality.
- Push the correction after verification.

## 12.10 FINAL REQUIREMENT

Git synchronization is a permanent part of this autonomous engineering assignment.

After every successfully verified engineering milestone, commit and push the changes to the configured remote repository, subject to repository policies and successful authentication.

Maintain a clean, understandable and traceable commit history.

Never sacrifice existing user work or repository integrity for automation.

# FINAL EXECUTION INSTRUCTION

Create the complete skill and all supporting references in the existing project root.

Do not merely describe what should be created.

Actually create the files.

After creating the skill:

1. Confirm Antigravity can discover it.
2. Read the skill and verify its instructions.
3. Perform the initial application discovery.
4. Establish the test baseline.
5. Build the module inventory.
6. Create the initial audit and bug tracker.
7. Begin repairing identified issues.
8. Run tests after each meaningful correction.
9. Continue the autonomous improvement cycle.
10. Preserve all progress for subsequent sessions.

Work on the actual application, not a demonstration or newly generated replacement.

Your priority is a fully understood, reliable, secure and maintainable application with independently verified functionality.


