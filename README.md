<p align="center">
  <img src="assets/branding/borngreataccounting-logo.svg" alt="BorngreatAccounting Logo" width="420" />
</p>

<h1 align="center">BorngreatAccounting (BtAccounting)</h1>
<p align="center"><strong>Your Accounting. Your Servers. Your Control.</strong></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-blue.svg" alt="License: AGPL-3.0" /></a>
  <a href="https://github.com/PipetteGh/Borngreat-Accounting---QuickBooks-Alternative/actions"><img src="https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-1E5EFF.svg" alt="CI/CD" /></a>
  <a href="docs/DOCKER-DEPLOYMENT.md"><img src="https://img.shields.io/badge/Docker-Self--Hosted%20Ready-0db7ed.svg" alt="Docker Ready" /></a>
  <a href="docs/WINDOWS-INSTALLATION.md"><img src="https://img.shields.io/badge/Windows-Desktop%20EXE-0078D6.svg" alt="Windows Desktop EXE" /></a>
</p>

**BorngreatAccounting** (`BtAccounting`) is a full-featured, self-hosted, multi-tenant, double-entry accounting and financial management platform designed for small, medium, and enterprise businesses. Run it on your own Linux servers, Docker/Kubernetes infrastructure, cloud VMs, or Windows workstations with complete data sovereignty.

---

## Key Capabilities

- **True Double-Entry Accounting Engine**: Full Chart of Accounts, manual & recurring Journal Entries, General Ledger, Trial Balance, Balance Sheet, Profit & Loss (Income Statement), and Cash Flow Statement.
- **Receivables & Sales**: Customer management, Estimates/Quotes, Sale Invoices, Recurring Invoices, Sale Receipts, Credit Notes, Payment Received, Stripe Online Payment Portal, and PDF/Email invoicing.
- **Payables & Purchases**: Vendor management, Purchase Bills, Expenses, Vendor Credit Notes, Payment Made, and AP Aging reports.
- **Inventory & Warehouses**: Multi-warehouse inventory tracking, inventory adjustments, warehouse transfers, low-stock reorder point alerts, and inventory valuation reports.
- **Banking & Cash Flow**: Bank & cash accounts, Plaid bank feeds, uncategorized transaction rules, and account reconciliation.
- **Global Multi-Currency & Tax Presets**: Supports 150+ ISO currencies (`USD`, `EUR`, `GBP`, `GHS`, `TRY`, `CAD`, `AUD`, `NGN`, `KES`, `ZAR`, etc.) with live exchange rate syncing and optional country tax localization presets (including Ghana GRA VAT/NHIL/GETFund/CHRL, UK HMRC VAT, EU VAT, Türkiye KDV, and US Sales Tax).
- **Enterprise Multi-Tenancy & Security**: Per-organization isolated MariaDB tenant databases, Role-Based Access Control (RBAC), TOTP Two-Factor Authentication (2FA) with recovery codes, API Keys, and Audit Trails.

---

## Quick Start (One-Command Self-Hosted Deployment)

### Linux / macOS
```bash
git clone https://github.com/PipetteGh/Borngreat-Accounting---QuickBooks-Alternative.git
cd Borngreat-Accounting---QuickBooks-Alternative
chmod +x install.sh
./install.sh
```

### Windows (PowerShell or Setup EXE)
```powershell
git clone https://github.com/PipetteGh/Borngreat-Accounting---QuickBooks-Alternative.git
cd Borngreat-Accounting---QuickBooks-Alternative
.\install.ps1
```
Or launch the prebuilt Windows Desktop Setup & Control Center executable:
- `dist/installers/BorngreatAccounting-Setup.exe` (`BorngreatAccounting-Setup-1.0.0.exe`)

---

## Prebuilt Container Images (GHCR)

| Service | Image |
|---|---|
| Web Frontend (SPA + Nginx) | `ghcr.io/pipettegh/borngreataccounting-web:latest` |
| Backend API & Migrator | `ghcr.io/pipettegh/borngreataccounting-api:latest` |
| Background Queue Worker | `ghcr.io/pipettegh/borngreataccounting-worker:latest` |

---

## Documentation Index

| Guide | Description |
|---|---|
| [Installation Overview](docs/INSTALLATION.md) | System requirements and deployment choices |
| [Docker Deployment Guide](docs/DOCKER-DEPLOYMENT.md) | Production Docker Compose & GHCR setup |
| [Windows Installation Guide](docs/WINDOWS-INSTALLATION.md) | Windows `.exe` Desktop Control Center & Docker Desktop setup |
| [Linux Server Deployment](docs/LINUX-DEPLOYMENT.md) | Ubuntu/Debian production server setup with TLS reverse proxy |
| [Configuration Reference](docs/CONFIGURATION.md) | Complete `.env` environment variable reference |
| [Backup & Restore Guide](docs/BACKUP-AND-RESTORE.md) | Automated backups, checksum verification, and disaster recovery |
| [Upgrade Guide](docs/UPGRADE-GUIDE.md) | Zero-data-loss upgrades and schema migration workflow |
| [Security Guide](docs/SECURITY.md) | Secrets management, 2FA, RBAC, and hardening |
| [Troubleshooting Guide](docs/TROUBLESHOOTING.md) | Diagnostics and solutions for common issues |
| [System Architecture](docs/ARCHITECTURE.md) | Multi-tenant architecture, data flow, and tech stack |
| [Developer Guide](docs/DEVELOPMENT.md) | Local monorepo setup, building, testing, and contributing |
| [Licensing & Attribution](docs/LICENSING-AND-ATTRIBUTION.md) | GNU AGPL-3.0 compliance and open-source attribution |
| [Release Process](docs/RELEASE-PROCESS.md) | Tagging, CI/CD pipelines, GHCR, and Windows EXE releases |

---

## Product Metadata & Attribution

- **Product Name**: BorngreatAccounting (`BtAccounting`)
- **Product Category**: Accounting and Financial Software
- **Developer & Publisher**: Peter Borngreat-Mensah (`Borngreat`)
- **GitHub Organization / Account**: `soluotech`
- **Official Source Repository**: [https://github.com/PipetteGh/Borngreat-Accounting---QuickBooks-Alternative](https://github.com/PipetteGh/Borngreat-Accounting---QuickBooks-Alternative)
- **License**: [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE)
- **Upstream Attribution**: Derived from the open-source [Bigcapital](https://github.com/bigcapitalhq/bigcapital) project. See [NOTICE](NOTICE) and [docs/LICENSING-AND-ATTRIBUTION.md](docs/LICENSING-AND-ATTRIBUTION.md) for full details.
