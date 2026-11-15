<p align="center">
  <img src="assets/branding/borngreataccounting-logo.svg" alt="BorngreatAccounting Logo" width="420" />
</p>

<h1 align="center">BorngreatAccounting (BtAccounting)</h1>
<p align="center"><strong>Your Accounting. Your Servers. Your Control. (Quickbooks Alternative)</strong></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-AGPL--3.0-blue.svg" alt="License: AGPL-3.0" /></a>
  <a href="https://github.com/PipetteGh/borngreataccounting/actions"><img src="https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-1E5EFF.svg" alt="CI/CD" /></a>
  <a href="docs/DOCKER-DEPLOYMENT.md"><img src="https://img.shields.io/badge/Docker-Self--Hosted%20Ready-0db7ed.svg" alt="Docker Ready" /></a>
  <a href="docs/WINDOWS-INSTALLATION.md"><img src="https://img.shields.io/badge/Windows-Desktop%20EXE-0078D6.svg" alt="Windows Desktop EXE" /></a>
  <a href="https://github.com/sponsors/PipetteGh"><img src="https://img.shields.io/badge/Sponsor-%E2%9D%A4%20Donate-ea4aaa.svg" alt="Donate / Sponsor" /></a>
  <!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
  <a href="#contributors"><img src="https://img.shields.io/badge/all_contributors-1-orange.svg" alt="All Contributors" /></a>
  <!-- ALL-CONTRIBUTORS-BADGE:END -->
</p>

**BorngreatAccounting** (`BtAccounting`) is a full-featured, self-hosted, multi-tenant, double-entry accounting and financial management platform designed for small, medium, and enterprise businesses. Run it on your own Linux servers, Docker/Kubernetes infrastructure, cloud VMs, or Windows workstations with complete data sovereignty.

---

## Key Capabilities

- **True Double-Entry Accounting Engine**: Full Chart of Accounts, manual & recurring Journal Entries, General Ledger, Trial Balance, Balance Sheet, Profit & Loss (Income Statement), and Cash Flow Statement.
- **Receivables & Sales**: Customer management, Estimates/Quotes, Sale Invoices, Recurring Invoices, Sale Receipts, Credit Notes, Payment Received, Online Payment Portals, and PDF/Email invoicing.
- **Point of Sale (POS) & Inventory Register**: Dedicated touch-friendly POS register (`/pos`) with barcode/SKU search, category filtering, live inventory stock validation, automatic stock deduction & double-entry receipt posting, cash change calculation, receipt printing, and distraction-free **Full-Screen Mode**.
- **Payment Gateways & Mobile Money**: Built-in per-tenant integrations for **Stripe**, **Paystack** (Cards, MTN/Telecel/AT Mobile Money, Bank Transfers across GHS, NGN, USD, ZAR, KES), **Flutterwave** (Cards, Mobile Money, USSD across Africa, UK, EU & US), and **Hubtel** (Ghana Mobile Money, GhQR & Visa/Mastercard) with webhook signature verification.
- **Themes & White-Label Branding**: Choose from **12 built-in Light & Dark themes** with live preview, plus custom company logo upload and primary brand color configuration for PDFs and emails.
- **Payables & Purchases**: Vendor management, Purchase Bills, Expenses, Vendor Credit Notes, Payment Made, and AP Aging reports.
- **Inventory & Warehouses**: Multi-warehouse inventory tracking, inventory adjustments, warehouse transfers, low-stock reorder point alerts, and inventory valuation reports.
- **Banking & Cash Flow**: Bank & cash accounts, Plaid bank feeds, uncategorized transaction rules, and account reconciliation.
- **Global Multi-Currency & Tax Presets**: Supports 150+ ISO currencies (`USD`, `EUR`, `GBP`, `GHS`, `TRY`, `CAD`, `AUD`, `NGN`, `KES`, `ZAR`, etc.) with live exchange rate syncing and optional country tax localization presets (including Ghana GRA VAT/NHIL/GETFund/CHRL, UK HMRC VAT, EU VAT, Türkiye KDV, and US Sales Tax).
- **Enterprise Multi-Tenancy & Security**: Per-organization isolated MariaDB tenant databases, Role-Based Access Control (RBAC), TOTP Two-Factor Authentication (2FA) with recovery codes, API Keys, and Audit Trails.

---

## Application Overview

![BorngreatAccounting Overview Tour](assets/screenshots/overview.gif)

---

## Screenshots

### Workspace Dashboard
![BorngreatAccounting Dashboard](assets/screenshots/dashboard.png)

### Products & Inventory
![BorngreatAccounting Products](assets/screenshots/products.png)

### Point of Sale (POS) & Full-Screen Register
![BorngreatAccounting POS](assets/screenshots/pos.png)

### Sales & Invoices
![BorngreatAccounting Sales Invoices](assets/screenshots/sales-invoices.png)

### Financial Reports (Profit & Loss)
![BorngreatAccounting Reports](assets/screenshots/reports.png)

### Payment Gateways (Stripe, Paystack, Flutterwave & Hubtel)
![BorngreatAccounting Payment Gateways](assets/screenshots/payment-methods.png)

### Themes & Appearance (12 Light & Dark Themes)
![BorngreatAccounting Themes Gallery](assets/screenshots/themes.png)

### Company Branding & Logo Upload
![BorngreatAccounting Branding](assets/screenshots/branding.png)

### Organization Settings
![BorngreatAccounting Settings](assets/screenshots/settings.png)

---

## System & Platform Requirements

| Platform | OS / Environment | Required Software & Runtime | Hardware Minimum |
|---|---|---|---|
| **Windows** | Windows 10 / 11 (64-bit), Windows Server 2019/2022 | **Desktop EXE / Native**: PowerShell 5.1+, `curl.exe`, .NET Framework 4.x+ (built into Windows). The self-healing runtime auto-installs **Node.js**, **MariaDB 10.11**, and **Redis** if missing.<br>**Container Mode**: Docker Desktop `4.25+` (WSL2 backend) | 2 vCPU, 4 GB RAM (8 GB recommended), 20 GB SSD |
| **Linux** | Ubuntu 22.04 / 24.04 LTS, Debian 12+, RHEL / Rocky / AlmaLinux 9+ | `bash`, `curl`, `openssl`, `git`, `tar`, Docker Engine `24.0+`, Docker Compose `v2.20+` (`install.sh` auto-installs missing Docker/CLI prerequisites) | 2+ vCPU, 4 GB RAM (8–16 GB recommended), 20–60+ GB SSD |
| **macOS** | macOS 13 (Ventura) or newer (Apple Silicon & Intel) | Docker Desktop `4.25+` (for containers), or **Node.js 18.x+**, `pnpm 9.x`, **MariaDB 10.11**, **Redis** (for source dev) | 2+ vCPU, 8 GB RAM, 20 GB SSD |
| **Web Browser** | Desktop & Tablet | Google Chrome `100+`, Microsoft Edge `100+`, Mozilla Firefox `100+`, or Apple Safari `16+` with JavaScript & `localStorage` enabled | 1280×720+ display recommended |
| **Source / Dev** | Windows, Linux, or macOS | **Node.js `18.x LTS+`**, **`pnpm 9.0.5`**, **MariaDB `10.11`**, **Redis**, **Gotenberg** (optional, for PDF rendering), **S3 / Garage** (optional; falls back to local disk storage) | 4 GB RAM, 20 GB free disk |

---

## Quick Start (One-Command Self-Hosted Deployment)

### Linux / macOS
```bash
# Option A: Clone repository
git clone https://github.com/PipetteGh/borngreataccounting.git
cd borngreataccounting
chmod +x install.sh
./install.sh

# Option B: Download release archive via curl (v1.0.1)
curl -fsSL -L https://github.com/PipetteGh/borngreataccounting/archive/refs/tags/v1.0.1.tar.gz -o borngreataccounting-1.0.1.tar.gz
tar -xzf borngreataccounting-1.0.1.tar.gz
cd borngreataccounting-1.0.1
chmod +x install.sh
./install.sh
```

### Windows (One-Click `.exe` Setup Wizard or PowerShell)

[![Download BorngreatAccounting for Windows](https://img.shields.io/badge/Download_for_Windows-BorngreatAccounting--Setup.exe-0078D6?style=for-the-badge&logo=windows)](https://github.com/PipetteGh/borngreataccounting/releases/latest/download/BorngreatAccounting-Setup.exe)

#### Step 1: Download & Launch
1. Click **[Download BorngreatAccounting-Setup.exe](https://github.com/PipetteGh/borngreataccounting/releases/latest/download/BorngreatAccounting-Setup.exe)** and save it to your computer.
2. Double-click **`BorngreatAccounting-Setup.exe`** *(if Windows SmartScreen shows **"Windows protected your PC"**, click **More info → Run anyway**)*.
3. Click **Next >**, check **I Agree** on the **GNU AGPL-3.0 License Agreement**, and click **Next >**.

#### Step 2: Choose Your Installation Mode
- **Option A — Single User (Standalone — 1 PC)**:
  1. Select **Single User (Standalone)** and click **Next >**.
  2. Choose the install location (defaults to `C:\Program Files\BorngreatAccounting`, or click **Browse...**), then click **Install** (approve the Windows UAC prompt if installing into `Program Files`).
  3. Wait for the setup to finish, keep **Launch BorngreatAccounting now** checked, and click **Finish** (`http://localhost:4100`).
- **Option B — Multi-User Server (Host for Multiple PCs on the Same Network)**:
  1. On your main/host PC, select **Multi-User Server (Host on Local Network)** and click **Next >**.
  2. Choose the install folder and click **Install**. The wizard installs the database & server, binds LAN access (`0.0.0.0:4100`), and opens **Windows Firewall port `4100`**.
  3. On the **Finish** screen, copy the **Network Share URL** (for example `http://192.168.1.50:4100`) to share with your client PCs, then click **Finish**.
- **Option C — Client Workstation (Join Existing Server)**:
  1. Run **`BorngreatAccounting-Setup.exe`** on each additional PC on the same Wi-Fi/LAN.
  2. Select **Client Workstation (Join Existing Server)**, enter the host PC's **Server URL** (e.g. `http://192.168.1.50:4100`), and click **Test Connection** to verify it shows `Connected!`.
  3. Click **Next > → Install → Finish** (takes seconds; no local database is installed on the client).

#### After Installation
- **Launch**: Double-click the **BorngreatAccounting** shortcut on your **Desktop** or **Start Menu**.
- **Server Control Center**: Open **Start Menu → BorngreatAccounting → BorngreatAccounting Control Center** to **Start**, **Stop**, **Restart**, check **Status**, view your **LAN URL**, or **Backup** the database.
- **Uninstall**: Use **Windows Settings → Apps → BorngreatAccounting → Uninstall** (or **Start Menu → BorngreatAccounting → Uninstall BorngreatAccounting**).

```powershell
# Alternative A: Download latest standalone Windows Setup EXE via curl
curl.exe -fsSL -L https://github.com/PipetteGh/borngreataccounting/releases/latest/download/BorngreatAccounting-Setup.exe -o BorngreatAccounting-Setup.exe
.\BorngreatAccounting-Setup.exe

# Alternative B: Clone repository and run PowerShell installer
git clone https://github.com/PipetteGh/borngreataccounting.git
cd borngreataccounting
.\install.ps1
```

---

## Prebuilt Container Images (GHCR)

| Service | Image | Package Page |
|---|---|---|
| Web Frontend (SPA + Nginx) | `ghcr.io/pipettegh/borngreataccounting-web:latest` | [View Package](https://github.com/PipetteGh/borngreataccounting/pkgs/container/borngreataccounting-web) |
| Backend API & Migrator | `ghcr.io/pipettegh/borngreataccounting-api:latest` | [View Package](https://github.com/PipetteGh/borngreataccounting/pkgs/container/borngreataccounting-api) |
| Background Queue Worker | `ghcr.io/pipettegh/borngreataccounting-worker:latest` | [View Package](https://github.com/PipetteGh/borngreataccounting/pkgs/container/borngreataccounting-worker) |

```bash
docker pull ghcr.io/pipettegh/borngreataccounting-web:latest
docker pull ghcr.io/pipettegh/borngreataccounting-api:latest
docker pull ghcr.io/pipettegh/borngreataccounting-worker:latest
```

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
- **Developer & Publisher**: Peter Borngreat-Mensah (`Peter Borngreat-Mensah`)
- **GitHub Organization / Account**: `soluotech`
- **Official Source Repository**: [https://github.com/PipetteGh/borngreataccounting](https://github.com/PipetteGh/borngreataccounting)
- **License**: [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE)

---

## Support & Donate

If **BorngreatAccounting** helps your business or saves you time, consider supporting ongoing development:

<p>
  <a href="https://github.com/sponsors/PipetteGh">
    <img src="https://img.shields.io/badge/Donate%20%2F%20Sponsor-GitHub%20Sponsors-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white" alt="Sponsor on GitHub" />
  </a>
</p>

---

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/PipetteGh"><img src="https://avatars.githubusercontent.com/PipetteGh?s=100" width="100px;" alt="Peter Borngreat-Mensah"/><br /><sub><b>Peter Borngreat-Mensah</b></sub></a><br /><a href="https://github.com/PipetteGh/borngreataccounting/commits?author=PipetteGh" title="Code">💻</a> <a href="#design-PipetteGh" title="Design">🎨</a> <a href="https://github.com/PipetteGh/borngreataccounting/commits?author=PipetteGh" title="Documentation">📖</a> <a href="#ideas-PipetteGh" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-PipetteGh" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-PipetteGh" title="Maintenance">🚧</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
