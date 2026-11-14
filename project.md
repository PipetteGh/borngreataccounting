# MASTER SOFTWARE ENGINEERING PROMPT
# PROJECT: BORNGREATACCOUNTING
## Complete Fork, Rebranding, Customization, Self-Hosting, Dockerization and Windows Desktop Distribution of Bigcapital

You are acting as a Principal Software Architect, Senior Full-Stack Engineer, DevOps Engineer, Database Engineer, Desktop Application Engineer, QA Automation Engineer and Open-Source Compliance Specialist.

Your assignment is to transform the open-source Bigcapital accounting application into a professionally branded, independently deployable product called **BorngreatAccounting**.

This is a complete software engineering project, not a UI mockup or a simple branding exercise.

You must inspect, understand, fork, customize, test, package, document and prepare the application for production deployment.

The final result must be a functional, maintainable and portable accounting application that can be deployed anywhere in the world using the same underlying source code.

---

# PART 1: SOURCE REPOSITORIES

## Original upstream project

Use the following project as the source:

https://github.com/bigcapitalhq/bigcapital

Study its architecture, codebase, documentation, dependencies, Docker configuration, database structure, API, frontend and existing functionality.

Do not blindly copy files without understanding their purpose.

## My official project repository

All customized source code must be maintained in this repository:

https://github.com/PipetteGh/Borngreat-Accounting---QuickBooks-Alternative.git

This is the primary repository for the entire BorngreatAccounting project.

IMPORTANT:

1. Clone the original Bigcapital repository into a temporary working directory.
2. Clone my BorngreatAccounting repository separately.
3. Inspect both repositories.
4. Preserve the original project's functional architecture and useful capabilities.
5. Migrate the necessary source code and project history or attribution information appropriately.
6. Perform all actual development inside my BorngreatAccounting repository.
7. Do not create another GitHub repository.
8. Do not push customized code into the original Bigcapital repository.
9. Do not overwrite unrelated existing files in my repository without inspecting them first.
10. Preserve the upstream license, copyright notices and required third-party notices.

My repository is the single source of truth for all future development.

---

# PART 2: PRODUCT IDENTITY AND BRANDING

Replace the user-facing Bigcapital identity with:

Product name: BorngreatAccounting

Short name: BtAccounting

Product category: Accounting and Financial Software

Tagline: Your Accounting. Your Servers. Your Control.

Developer/Publisher: Peter Borngreat-Mensah

GitHub organization/account: soluotech

Official source repository:
https://github.com/PipetteGh/Borngreat-Accounting---QuickBooks-Alternative

The application must have a consistent brand identity throughout.

## Branding requirements

Replace the original branding wherever legally and technically appropriate:

- Application logo.
- Login and registration screens.
- Dashboard.
- Navigation.
- Sidebar.
- Header.
- Browser title.
- Favicon.
- Loading screens.
- Email templates.
- PDF documents.
- Invoice templates.
- Estimate templates.
- Reports.
- Error pages.
- Notifications.
- System settings.
- About page.
- Desktop application.
- Docker image descriptions.
- Installer.
- Documentation.
- README.
- Release notes.

Remove outdated user-facing references to Bigcapital where they are product branding.

Do not remove legally required copyright, attribution, license notices or upstream acknowledgements.

Create a centralized branding configuration so that the product identity can be maintained without manually modifying dozens of unrelated files.

The default brand must be BorngreatAccounting.

Create a professional, modern accounting software visual identity.

Design direction:

- Clean enterprise accounting dashboard.
- Professional financial software.
- Modern typography.
- Clear navigation.
- Consistent spacing.
- Accessible contrast.
- Responsive layout.
- Professional tables and financial reports.
- Light and dark modes.

Do not redesign the entire application unnecessarily. Preserve existing functional workflows while improving consistency.

Create a logo and icon set for BorngreatAccounting and store the original editable assets in the repository.

---

# PART 3: PRESERVE AND VERIFY THE ACCOUNTING FUNCTIONALITY

The primary objective is to retain the actual Bigcapital accounting engine.

Do not destroy or replace working accounting functionality simply to make the application look different.

First, create a complete inventory of all existing features.

Inspect and test the following modules:

## Financial accounting

- Chart of Accounts.
- Double-entry bookkeeping.
- General Ledger.
- Journal Entries.
- Trial Balance.
- Balance Sheet.
- Profit and Loss Statement.
- Cash Flow Statement.
- Accounting Periods.
- Opening Balances.
- Account Reconciliation.
- Financial Transactions.

## Sales management

- Customers.
- Customer Contacts.
- Invoices.
- Recurring Invoices.
- Estimates.
- Sales Receipts.
- Credit Notes.
- Customer Payments.
- Customer Statements.
- Sales Reports.

## Purchase management

- Vendors.
- Vendor Bills.
- Expenses.
- Purchase Orders, if supported.
- Vendor Payments.
- Supplier Statements.
- Purchase Reports.

## Inventory

- Products.
- Services.
- Product Categories.
- Warehouses.
- Inventory Adjustments.
- Stock Transfers, if supported.
- Inventory Valuation.
- Stock Reports.

## Banking and payments

- Bank Accounts.
- Cash Accounts.
- Bank Transactions.
- Transfers.
- Payment Methods.
- Reconciliation.
- Payment Records.

## Business management

- Organizations.
- Multiple Companies.
- Branches, if supported.
- Users.
- Roles.
- Permissions.
- Multi-currency.
- Tax Configuration.
- Financial Reports.
- Attachments.
- Notifications.
- Audit Logs.

Preserve existing features and identify missing or incomplete functionality.

Do not claim that a feature works until it has been tested.

Create an automated regression test suite covering critical accounting operations.

---

# PART 4: GLOBAL ACCOUNTING SUPPORT

BorngreatAccounting must be suitable for businesses operating in different countries.

Implement or preserve configurable support for:

1. Multiple currencies.
2. Multiple languages where supported.
3. Different time zones.
4. Different date formats.
5. Different number formats.
6. Configurable tax rates.
7. Configurable financial years.
8. Configurable invoice numbering.
9. Configurable company information.
10. Configurable currency precision.

The system must not hardcode Ghana, Ghanaian Cedis or any single country's tax rules as universal defaults.

Provide GHS as a supported currency alongside USD, EUR, GBP, TRY and other supported currencies.

Allow administrators to choose the default currency, locale, timezone and financial year.

Keep tax rules configurable and ensure calculations are performed accurately.

Investigate the possibility of adding Ghana-specific tax configuration as an optional localization module without affecting other countries.

---

# PART 5: CENTRALIZED CONFIGURATION

Create a clean and documented environment configuration.

Provide:

- .env.example
- .env.production.example
- .env.development.example
- Docker environment configuration.
- Database configuration.
- Redis configuration.
- Storage configuration.
- SMTP configuration.
- Domain and URL configuration.
- Security configuration.
- Backup configuration.

Do not commit passwords, tokens, private keys, production secrets or database credentials.

All secrets must be injected through environment variables or a suitable secret management mechanism.

The application must support deployment behind:

- Nginx.
- Traefik.
- Caddy.
- Cloudflare Tunnel.
- Standard reverse proxies.
- HTTPS-enabled hosting environments.

Do not require a specific domain provider or cloud provider.

The system should support IP-based local access during initial installation.

---

# PART 6: DOCKER AND SELF-HOSTING

This is one of the most important requirements.

BorngreatAccounting must be fully self-hostable.

A user must be able to download the Docker Compose files, configure their environment and deploy the entire application on their own server.

The deployment must not depend on Borngreat-operated cloud infrastructure.

## Supported environments

- Ubuntu.
- Debian.
- Rocky Linux.
- AlmaLinux.
- Other compatible Linux distributions.
- Windows Server with Docker-compatible infrastructure.
- Windows 10/11 with Docker Desktop.
- Proxmox virtual machines.
- Dedicated servers.
- VPS providers.
- On-premises servers.
- Private cloud infrastructure.

## Required Docker services

Inspect the original project and retain all necessary services.

Depending on actual application requirements, include:

- BorngreatAccounting frontend.
- BorngreatAccounting backend/API.
- MariaDB.
- Redis.
- ClickHouse, if required.
- Object storage service.
- PDF rendering service.
- Reverse proxy where appropriate.

Do not introduce unnecessary services.

## Docker deliverables

Create a production-ready Docker deployment structure:

docker/
    frontend/
    backend/
    database/
    scripts/
    healthchecks/

docker-compose.yml
docker-compose.production.yml
docker-compose.development.yml
.env.example

The actual layout may be adjusted to fit the existing architecture.

Requirements:

1. Multi-stage Docker builds.
2. Small production images.
3. Non-root containers wherever possible.
4. Health checks.
5. Restart policies.
6. Persistent volumes.
7. Network isolation.
8. Secure environment variables.
9. Database readiness checks.
10. Automatic migration handling.
11. Graceful shutdown.
12. Logging.
13. Backup and restore support.
14. Container versioning.
15. CPU and memory configuration guidance.

All important application data must persist after container restarts and upgrades.

Never store critical business data exclusively inside disposable container filesystems.

## Docker installation experience

A new user should be able to deploy using:

git clone https://github.com/PipetteGh/Borngreat-Accounting---QuickBooks-Alternative.git

cd Borngreat-Accounting---QuickBooks-Alternative

cp .env.example .env

docker compose up -d --build

Adapt the exact commands to the final deployment architecture.

Provide an installation script:

install.sh

Also provide:

install.ps1

The scripts must validate prerequisites, create required directories, initialize configuration, start services and report deployment status.

Provide a secure way to generate initial administrator credentials.

Do not use predictable default production passwords.

---

# PART 7: PRIVATE AND PUBLIC DOCKER IMAGE DISTRIBUTION

I want to distribute BorngreatAccounting through Docker images.

Use GitHub Container Registry (GHCR) as the initial image registry.

Proposed image names:

ghcr.io/pipettegh/borngreataccounting-web:latest

ghcr.io/pipettegh/borngreataccounting-api:latest

ghcr.io/pipettegh/borngreataccounting-worker:latest

Only create separate images for services that genuinely require separate containers.

Requirements:

- Automated image builds.
- Version tags.
- Latest tags.
- Semantic versioning.
- Multi-architecture builds where supported.
- Linux AMD64.
- Linux ARM64 where dependencies permit.
- Container vulnerability scanning.
- SBOM generation.
- Image provenance where practical.
- Automated publishing through GitHub Actions.

A customer should be able to deploy using published images without compiling the entire source code.

Also provide instructions for building images locally.

Do not make the application dependent on a single image registry.

The Docker Compose deployment must allow users to choose between prebuilt images and local builds.

---

# PART 8: WINDOWS DESKTOP APPLICATION AND EXE INSTALLER

I specifically require a Windows downloadable installer.

Do not confuse the existing web application with a desktop installer.

Investigate the most appropriate architecture for a Windows desktop edition.

Recommended starting approach:

- Tauri desktop shell.
- Existing React frontend.
- Existing accounting backend.
- Existing database and supporting services.
- Local Docker-based runtime management.

The desktop application must use the same business logic and APIs as the web version.

Do not duplicate the accounting engine.

## Windows desktop features

Create:

BorngreatAccounting-Setup.exe

The installer should:

1. Install the BorngreatAccounting desktop application.
2. Display Borngreat branding.
3. Check required Windows prerequisites.
4. Detect whether Docker Desktop is installed and running.
5. Explain how to install or enable missing prerequisites.
6. Initialize the local deployment.
7. Start the required application services.
8. Provide a local application URL or embedded desktop interface.
9. Allow the user to stop services.
10. Allow the user to restart services.
11. Allow the user to check service health.
12. Provide access to application logs.
13. Provide data backup and restore functionality.
14. Provide an uninstall option without silently deleting business data.

The desktop application should provide a professional local application experience.

IMPORTANT:

Do not falsely advertise the EXE as a completely standalone application if it relies on Docker Desktop.

Provide two separate Windows deployment options:

A. Windows desktop installer using a desktop shell and managed local Docker runtime.

B. Windows server deployment using Docker Compose or another supported server architecture.

Investigate a future native Windows runtime without Docker, but do not compromise the reliability of the first release to achieve this.

## Windows build requirements

Use GitHub Actions to build the Windows installer.

Publish the installer under GitHub Releases.

Provide versioned files such as:

BorngreatAccounting-Setup-1.0.0.exe

Also investigate code signing and document the requirements for signing certificates.

Do not distribute unsigned installers while claiming that they are digitally signed.

---

# PART 9: LINUX AND OTHER DISTRIBUTION OPTIONS

Prepare the application for additional distribution formats.

Where technically practical, support:

- Docker Compose.
- Linux AMD64.
- Linux ARM64.
- Windows EXE.
- Linux desktop AppImage or DEB, if the desktop shell supports them reliably.

The main supported deployment method must remain Docker.

Do not introduce separate codebases for different operating systems.

---

# PART 10: AUTOMATED CI/CD

Create a comprehensive GitHub Actions pipeline.

All CI/CD workflows must reside in:

.github/workflows/

Create workflows for:

1. Backend testing.
2. Frontend testing.
3. Linting.
4. Type checking.
5. Database migration validation.
6. Docker image building.
7. Docker image publishing.
8. Windows EXE building.
9. Linux packaging where supported.
10. Security scanning.
11. Release creation.
12. Documentation validation.

Use appropriate build matrices.

Build the Windows installer on Windows runners.

Build Linux containers for AMD64 and ARM64 using appropriate runners or cross-platform build infrastructure.

Use GitHub repository secrets for credentials.

Do not expose credentials in logs.

## Release process

When a version tag is pushed:

v1.0.0

The pipeline should:

- Run automated tests.
- Build production images.
- Publish images to GHCR.
- Build the Windows EXE.
- Generate release notes.
- Generate checksums.
- Generate an SBOM.
- Attach supported installers and documentation to GitHub Releases.

Do not publish a release if critical tests fail.

---

# PART 11: DATA SECURITY AND BACKUP

Accounting data is sensitive.

Implement appropriate security controls.

Review:

- Authentication.
- Authorization.
- Role-based access.
- Password hashing.
- Session security.
- API security.
- CSRF protection where applicable.
- Input validation.
- SQL injection prevention.
- XSS prevention.
- File upload validation.
- Rate limiting.
- Audit logging.
- Secure cookies.
- HTTPS configuration.
- Dependency vulnerabilities.

Do not introduce custom cryptography.

## Backup system

Provide a backup and restoration strategy for:

- MariaDB.
- Uploaded documents.
- Object storage.
- Application configuration.
- Other persistent application data.

Create scripts:

backup.sh
restore.sh
backup.ps1
restore.ps1

Backups must be consistent and restoration must be tested.

Support configurable backup locations.

Do not delete existing backups during upgrades.

Document how users can migrate an installation from one server to another.

---

# PART 12: UPDATES AND PORTABILITY

The product must be portable.

A user should be able to install BorngreatAccounting on one server, back it up, transfer the backup to another country or hosting provider and restore it.

Implement a safe upgrade process.

Requirements:

1. Versioned database migrations.
2. Backup before upgrades.
3. Health checks after upgrades.
4. Rollback instructions.
5. Persistent data protection.
6. Application version reporting.
7. Configuration compatibility checks.

Do not automatically pull unverified latest images in production.

Use version-pinned images for production installations.

Create an upgrade command or documented process.

Example:

docker compose pull

docker compose up -d

Adapt this to ensure that database backups and migrations are handled safely.

---

# PART 13: USER EXPERIENCE AND ADMINISTRATION

Create a professional first-run experience.

When a new user opens BorngreatAccounting:

1. Display the BorngreatAccounting welcome page.
2. Guide the user through initial setup.
3. Request company information.
4. Request country.
5. Request default currency.
6. Request timezone.
7. Request financial year.
8. Create the first administrator.
9. Configure the organization.
10. Redirect to the dashboard.

Do not leave the user with a default Bigcapital configuration.

Create an About section containing:

Product: BorngreatAccounting

Publisher: Borngreat

Version: Dynamically displayed application version.

Source repository:
https://github.com/PipetteGh/Borngreat-Accounting---QuickBooks-Alternative

License and third-party attribution information.

---

# PART 14: DOCUMENTATION

Create complete documentation inside the repository.

Required documentation:

README.md

docs/INSTALLATION.md

docs/DOCKER-DEPLOYMENT.md

docs/WINDOWS-INSTALLATION.md

docs/LINUX-DEPLOYMENT.md

docs/CONFIGURATION.md

docs/BACKUP-AND-RESTORE.md

docs/UPGRADE-GUIDE.md

docs/SECURITY.md

docs/TROUBLESHOOTING.md

docs/ARCHITECTURE.md

docs/DEVELOPMENT.md

docs/LICENSING-AND-ATTRIBUTION.md

docs/RELEASE-PROCESS.md

The README must explain:

- What BorngreatAccounting is.
- Main accounting features.
- Screenshots.
- System requirements.
- Docker installation.
- Windows installation.
- Linux installation.
- Configuration.
- Backup and restoration.
- Updating.
- Troubleshooting.
- Contribution guidelines.
- Licensing.

Write documentation for someone who is not a software developer.

---

# PART 15: TESTING AND QUALITY ASSURANCE

Do not stop after modifying the branding.

You must actually run the application and test it.

Create and execute tests for:

- Application startup.
- Database connections.
- User registration.
- Login.
- Logout.
- Organization creation.
- User permissions.
- Customer creation.
- Vendor creation.
- Invoice creation.
- Invoice calculations.
- Payment recording.
- Expense recording.
- Journal entries.
- Double-entry balancing.
- Financial statements.
- Inventory operations.
- PDF generation.
- File uploads.
- Email configuration.
- Currency configuration.
- Backup.
- Restoration.
- Application upgrades.

Verify that a complete accounting workflow works.

Example:

1. Create a company.
2. Create a customer.
3. Create a product.
4. Create an invoice.
5. Record a customer payment.
6. Confirm the ledger entries.
7. Confirm the trial balance.
8. Confirm the profit and loss report.
9. Confirm the balance sheet.
10. Verify that debits and credits balance.

Test the Docker installation on a clean environment.

Test the Windows installer on a clean Windows environment if a Windows runner or test machine is available.

Do not mark any test as successful unless it actually passes.

---

# PART 16: SOFTWARE ENGINEERING RULES

Follow these rules throughout development:

1. Never destroy working accounting functionality.
2. Never replace real application logic with mock data.
3. Never hardcode credentials.
4. Never commit secrets.
5. Never remove database migrations without understanding their consequences.
6. Never delete persistent Docker volumes during routine upgrades.
7. Never claim a Windows installer is ready without successfully building it.
8. Never claim Docker deployment works without testing it.
9. Never silently ignore failing tests.
10. Never create duplicate accounting logic for desktop and web.
11. Keep the application modular.
12. Keep the application maintainable.
13. Follow existing coding conventions where reasonable.
14. Use meaningful Git commits.
15. Document architectural decisions.
16. Preserve applicable AGPL-3.0 and third-party license obligations.
17. Audit enterprise-specific source files before redistribution.
18. Avoid unnecessary dependency changes.
19. Use supported versions of dependencies.
20. Do not leave incomplete placeholder functionality in production releases.

If something cannot be completed because of missing credentials, unavailable infrastructure or a technical limitation, document the exact limitation and provide the required next step.

---

# PART 17: IMPLEMENTATION PHASES

Work through the following phases in order.

PHASE 1: Repository inspection.

- Inspect both repositories.
- Inspect Bigcapital architecture.
- Inspect all dependencies.
- Inspect existing functionality.
- Audit licensing.
- Produce an implementation plan.

PHASE 2: Repository migration.

- Establish the customized codebase.
- Preserve required source attribution.
- Configure Git.
- Ensure the project builds before customization.

PHASE 3: Rebranding.

- Implement BorngreatAccounting identity.
- Update all user-facing references.
- Create centralized branding.
- Update PDF and email templates.

PHASE 4: Application verification.

- Start the application.
- Verify backend.
- Verify frontend.
- Verify database.
- Test accounting workflows.
- Fix discovered regressions.

PHASE 5: Production Docker architecture.

- Create production Dockerfiles.
- Create production Compose files.
- Configure volumes.
- Configure networking.
- Implement health checks.
- Implement backup and restoration.
- Test clean installation.

PHASE 6: Container registry.

- Configure GHCR.
- Build images.
- Test image deployment.
- Implement automated publishing.

PHASE 7: Windows desktop application.

- Build the Tauri shell.
- Connect the existing frontend and backend architecture.
- Implement local runtime management.
- Build the EXE installer.
- Test installation and uninstallation.

PHASE 8: CI/CD.

- Configure GitHub Actions.
- Configure release automation.
- Configure Windows builds.
- Configure container builds.
- Configure security scanning.

PHASE 9: Documentation.

- Complete installation guides.
- Complete backup guides.
- Complete deployment guides.
- Complete troubleshooting documentation.

PHASE 10: Final validation.

- Run all tests.
- Test Docker installation.
- Test Windows installer.
- Verify GitHub releases.
- Verify GHCR images.
- Verify branding.
- Verify license compliance.

---

# PART 18: FINAL DELIVERABLES

The project is not complete until the following deliverables exist or any unavailable item is explicitly documented.

| Deliverable | Expected result |
|---|---|
| Source code | BorngreatAccounting repository |
| Web application | Fully functional branded accounting system |
| Backend | Working accounting API |
| Database | Persistent and migration-ready |
| Docker | Production deployment |
| Docker images | Published to GHCR |
| Windows installer | BorngreatAccounting-Setup.exe |
| Linux deployment | Documented and tested |
| CI/CD | Automated builds and releases |
| Backup | Working backup scripts |
| Restoration | Tested recovery process |
| Documentation | Complete installation guides |
| Security | Security checks and configuration |
| Tests | Automated regression coverage |

The final GitHub repository must be:

https://github.com/PipetteGh/Borngreat-Accounting---QuickBooks-Alternative

---

# PART 19: FINAL REPORT

At the end, provide a detailed implementation report containing:

1. Original architecture discovered.
2. Changes made.
3. Files and directories created.
4. Branding changes completed.
5. Accounting features retained.
6. New functionality implemented.
7. Docker images published.
8. GHCR image names.
9. Docker installation commands.
10. Windows EXE download location.
11. GitHub Actions workflows created.
12. Tests executed and their results.
13. Security issues discovered.
14. Licensing issues requiring attention.
15. Remaining limitations.
16. Exact commands for deploying BorngreatAccounting on a fresh server.

Do not provide a report that merely describes what you intend to do.

Report what you have actually implemented, built and tested.

## FINAL OBJECTIVE

I want BorngreatAccounting to become my own professionally branded, portable accounting software distribution based on the Bigcapital open-source project.

I must be able to:

- Host it on my own VPS.
- Host it on dedicated servers.
- Host it on Proxmox.
- Deploy it using Docker.
- Run it on Linux.
- Install its Windows desktop edition using an EXE.
- Distribute versioned Docker images.
- Upgrade installations.
- Back up and restore accounting data.
- Move installations between servers and countries.
- Maintain everything from one GitHub repository.

**Do not stop at planning. Begin by inspecting both repositories, produce the technical implementation plan and then execute the project phase by phase.**

Work autonomously wherever possible, but never compromise accounting accuracy, data integrity, security or licensing compliance to rush implementation.