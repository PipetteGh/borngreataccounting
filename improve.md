# MISSION: AUTONOMOUS SOFTWARE ENGINEERING, COMPLETE APPLICATION AUDIT, SELF-HEALING AND CONTINUOUS IMPROVEMENT

You are hereby appointed as the Principal Software Architect, Senior Full-Stack Developer, Software Reverse Engineer, QA Automation Engineer, Application Security Engineer and Autonomous Software Maintenance Engineer for this project.

Your responsibility is to take ownership of understanding, auditing, repairing, improving and validating this entire application.

The complete source code already exists in the root directory of this workspace.

I do not want a superficial code review. I want you to understand how this application works, investigate every module, identify inconsistencies, fix broken implementations, complete missing functionality and continuously test your improvements.

Your objective is to bring the application to a stable, consistent, secure and production-ready state.

## PHASE 1: DISCOVER AND UNDERSTAND THE ENTIRE APPLICATION

Before modifying anything:

1. Inspect the entire project from its root directory.
2. Identify every programming language, framework, library, package and dependency.
3. Identify the frontend, backend, API layer, database, authentication system and integrations.
4. Identify all application modules, pages, routes, components, controllers, services and models.
5. Inspect database schemas, relationships, migrations, stored procedures and queries.
6. Identify existing functionality, partially implemented functionality and missing functionality.
7. Identify duplicated code, unused components, dead code and inconsistent implementations.
8. Identify broken imports, unresolved dependencies, incorrect configurations and outdated packages.
9. Understand how information moves between the frontend, backend and database.
10. Identify all user roles and their associated permissions.

Do not assume that a function is working simply because its source code exists.

Trace important functionality from the user interface through the backend and database.

Create a comprehensive `engineering-reports/PROJECT_ARCHITECTURE.md` document explaining the actual application architecture (store all engineering reports inside `engineering-reports/` so the root directory stays clean; if any report files exist in the root directory, move them into `engineering-reports/`).

## PHASE 2: CREATE AN AUTONOMOUS ENGINEERING SKILL

Create a reusable Antigravity Agent Skill at:

.agents/skills/autonomous-software-engineer/SKILL.md

The skill must contain instructions for:

- Full-stack application auditing.
- Codebase reverse engineering.
- Bug identification and root-cause analysis.
- Frontend and backend debugging.
- Database consistency checks.
- API integration testing.
- Authentication and authorization testing.
- Security auditing.
- Automated browser testing.
- Regression testing.
- Feature completion.
- Performance optimization.
- Continuous improvement and verification.

Also create supporting documentation for the skill.

Ensure the skill can be reused in future conversations and automatically applied when relevant.

## PHASE 3: COMPREHENSIVE APPLICATION AUDIT

Perform a systematic audit of every application module.

Investigate:

FRONTEND:
- Broken buttons and links.
- Forms that do not submit.
- Incorrect form validation.
- Pages that do not load.
- Missing loading indicators.
- Incorrect error handling.
- Inconsistent navigation.
- Responsive design problems.
- Incorrect data rendering.
- Components that do not communicate correctly.

BACKEND:
- Broken endpoints.
- Incorrect business logic.
- Missing validation.
- Incorrect database queries.
- Broken CRUD operations.
- Incorrect exception handling.
- Missing transactions.
- Inconsistent API responses.
- Incorrect authentication and authorization.

DATABASE:
- Missing tables or columns required by existing functionality.
- Incorrect relationships.
- Duplicate records.
- Incorrect foreign keys.
- Broken migrations.
- Inconsistent data types.
- Incorrect transaction handling.
- Missing indexes where necessary.

INTEGRATIONS:
- External API failures.
- Incorrect API authentication.
- Broken webhooks.
- Email and notification failures.
- Payment integration problems.
- File upload and download problems.
- Incorrect third-party service configurations.

SECURITY:
- SQL injection.
- Cross-site scripting.
- CSRF vulnerabilities.
- Broken access control.
- Insecure authentication.
- Exposed credentials.
- Insecure file uploads.
- Insecure API endpoints.
- Sensitive information exposure.

Do not limit your investigation to these examples. Identify other issues relevant to the actual technology stack.

Create inside `engineering-reports/` (if any of these files already exist in the workspace root, move them into `engineering-reports/`):
- `engineering-reports/APPLICATION_AUDIT.md`
- `engineering-reports/BUG_TRACKER.md`
- `engineering-reports/SECURITY_AUDIT.md`
- `engineering-reports/TEST_RESULTS.md`
- `engineering-reports/GIT_CHANGELOG.md`

Record each discovered issue, its severity, root cause, affected files and proposed resolution.

## PHASE 4: REPAIR AND IMPLEMENTATION

After understanding the application, begin repairing it.

For every identified problem:

1. Investigate the actual root cause.
2. Trace the problem across all dependent components.
3. Check whether another module is affected.
4. Implement the appropriate correction.
5. Avoid introducing unnecessary architectural changes.
6. Preserve existing business logic unless it is demonstrably incorrect.
7. Ensure frontend and backend implementations agree.
8. Ensure database operations remain consistent.
9. Add missing functionality where requirements can be established from the application, existing documentation or related implementations.
10. Add appropriate automated tests for every correction.

Do not create fake functionality simply to make a test pass.

Do not replace real implementations with mock responses, hardcoded values or placeholder data.

Do not silently remove existing features because they are difficult to repair.

Where expected behaviour cannot be established, document the uncertainty instead of inventing business requirements.

## PHASE 5: AUTOMATED TESTING

Use the existing testing framework where possible.

If the application lacks adequate testing infrastructure, identify and install appropriate tools compatible with its existing technology stack.

Consider:

- Playwright for browser-based end-to-end testing.
- Vitest or Jest for JavaScript and TypeScript unit testing.
- PHPUnit for PHP applications.
- Appropriate backend integration testing tools.
- API testing.
- Database integrity testing.
- Static analysis and linting.
- Type checking.
- Security scanning.

Test actual functionality, not merely whether the application compiles.

For browser testing:

1. Start the application using its actual development environment.
2. Open the application in a real browser.
3. Navigate through all accessible pages.
4. Test buttons, forms, links, menus and interactive components.
5. Test authentication and logout.
6. Test all user roles and permissions.
7. Test create, read, update and delete operations.
8. Test search, filtering, sorting and pagination.
9. Test file uploads and downloads.
10. Test all major business workflows.
11. Inspect browser console errors.
12. Inspect failed network requests and API responses.
13. Inspect server logs.
14. Verify that saved information persists correctly in the database.
15. Test desktop, tablet and mobile layouts.

Use screenshots, browser traces and test reports to verify actual behaviour.

Do not mark functionality as working simply because a page loads.

## PHASE 6: CONTINUOUS REPAIR AND SELF-IMPROVEMENT LOOP

This is the most important part of the assignment.

Establish a continuous engineering cycle:

AUDIT → IDENTIFY → INVESTIGATE → FIX → TEST → VERIFY → COMMIT → PUSH → DOCUMENT → REPEAT.

The process must work as follows:

ITERATION 1:
- Inspect the entire application.
- Identify and prioritize problems.
- Fix the highest-priority issues.
- Run the relevant tests.
- Record the results.

ITERATION 2:
- Reinspect the modified components.
- Identify additional problems.
- Test dependent modules.
- Fix newly discovered issues.
- Run regression tests.

ITERATION 3:
- Perform another complete review.
- Check whether previous fixes introduced new problems.
- Identify remaining incomplete functionality.
- Correct the remaining issues.

Continue this process until the established completion criteria are satisfied.

At the end of every iteration:

- Update `engineering-reports/BUG_TRACKER.md`.
- Update `engineering-reports/TEST_RESULTS.md`.
- Update `engineering-reports/IMPROVEMENT_LOG.md`.
- Update `engineering-reports/GIT_CHANGELOG.md`.
- Commit all verified changes with a clear, human-readable commit message and push to the remote Git repository (`git push origin main`).
- Record lessons learned.
- Record unresolved issues.
- Identify the next highest-priority task.

Preserve progress between iterations so that you do not repeatedly investigate and fix the same problems.

Use independent subagents where appropriate. For example:

Agent 1: Frontend auditing and testing.
Agent 2: Backend and API auditing.
Agent 3: Database and data integrity.
Agent 4: Security auditing.
Agent 5: Automated testing and regression verification.

Have the main engineering agent consolidate findings and resolve conflicts before applying changes.

If Antigravity supports /run-workflow, use it to coordinate complex parallel and sequential engineering tasks.

Do not run an uncontrolled infinite loop. Use measurable completion criteria, maintain a progress record and stop when no further actionable issue can be resolved safely.

## PHASE 7: REGRESSION TESTING

Every time you modify a component, investigate whether other parts of the application depend on it.

Run the relevant tests again.

Do not fix one module while breaking another.

Maintain a regression test suite covering all previously verified functionality.

When a regression is detected:
- Identify the change responsible.
- Investigate its root cause.
- Correct the implementation.
- Rerun the failed test.
- Rerun the relevant regression suite.

A previously passing test must not be silently removed or weakened to obtain a successful result.

## PHASE 8: SECURITY, PERFORMANCE AND QUALITY OPTIMIZATION

After functional repairs, conduct another engineering review.

Investigate:
- Slow database queries.
- Unnecessary API requests.
- Memory leaks.
- Inefficient frontend rendering.
- Excessive dependencies.
- Poor error handling.
- Security vulnerabilities.
- Unnecessary code duplication.
- Inefficient background processes.
- Missing indexes.
- Inadequate input validation.

Improve the application without compromising existing functionality.

Do not upgrade major dependencies or change production configurations without assessing compatibility and obtaining approval where necessary.

## PHASE 9: FINAL VALIDATION

The application must undergo a final comprehensive test.

Verify:

1. The application starts successfully.
2. The frontend loads correctly.
3. The backend operates correctly.
4. Database connections work.
5. Authentication works.
6. User permissions are enforced.
7. All major application modules work.
8. All critical business workflows work.
9. API integrations behave correctly.
10. Data is saved and retrieved correctly.
11. Browser console errors have been investigated.
12. Critical server errors have been resolved.
13. Security findings have been addressed or documented.
14. Regression tests pass.
15. The application behaves correctly across supported screen sizes.

Produce a final report containing:

- Total files inspected.
- Modules audited.
- Bugs identified.
- Bugs resolved.
- Features completed.
- Tests created.
- Tests executed.
- Tests passed.
- Tests failed.
- Security findings.
- Performance improvements.
- Remaining limitations.
- Outstanding issues requiring human intervention.

## STRICT ENGINEERING RULES

1. The root directory is the source of truth.
2. Do not unnecessarily rewrite the entire application.
3. Do not delete existing functionality.
4. Do not overwrite environment files, secrets or credentials.
5. Do not expose sensitive information.
6. Do not execute destructive database operations without approval.
7. Do not modify production systems without authorization.
8. Do not use fake data to simulate successful production functionality.
9. Do not report tests as passed unless they were actually executed.
10. Do not claim that the application is 100% functional without evidence.
11. Preserve the existing application architecture unless a change is justified.
12. Use Git checkpoints before significant changes. If the project is not under Git, initialize version control after preserving a safe backup.
13. Never overwrite or discard my existing uncommitted work.
14. Ask for clarification when a business requirement cannot be established reliably.

## FINAL INSTRUCTION

I am not asking you to simply inspect the source code and give me a report.

I am authorizing you to perform the engineering work necessary to repair and improve this application.

Start by understanding the entire codebase.

Then build the reusable autonomous engineering skill, conduct the audit, establish a testing baseline and begin fixing the identified problems.

Continue iterating through the audit, repair, testing and verification process until all established completion criteria are satisfied.

Prioritize correctness, stability, security and maintainability over speed.

Work systematically, preserve your learnings and provide evidence for every completed task.

Do not stop after identifying problems. Fix what you can, test it, learn from the results and continue.