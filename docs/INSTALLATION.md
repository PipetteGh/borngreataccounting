# BorngreatAccounting — Installation Overview

**BorngreatAccounting (`BtAccounting`)** can be deployed in three primary ways depending on your infrastructure:

1. **Docker Compose Production Deployment (Recommended for Servers & Cloud VMs)**
   - Uses [`docker-compose.production.yml`](../docker-compose.production.yml) and [`install.sh`](../install.sh) / [`install.ps1`](../install.ps1).
   - Full guide: [docs/DOCKER-DEPLOYMENT.md](DOCKER-DEPLOYMENT.md)

2. **Windows Desktop Setup & Local Runtime Manager (`BorngreatAccounting-Setup.exe`)**
   - Uses [`dist/installers/BorngreatAccounting-Setup.exe`](../dist/installers/BorngreatAccounting-Setup.exe) (or Tauri desktop shell under [`desktop/`](../desktop/)).
   - Full guide: [docs/WINDOWS-INSTALLATION.md](WINDOWS-INSTALLATION.md)

3. **Source / Developer Installation (Node.js 18+ & pnpm Monorepo)**
   - Ideal for customizing code, running unit/E2E tests, or integrating with external services.
   - Full guide: [docs/DEVELOPMENT.md](DEVELOPMENT.md)

---

## Minimum Hardware & Software Requirements

| Tier | CPU | RAM | Disk Storage | OS |
|---|---|---|---|---|
| **Small Business / Workstation** | 2 vCPU | 4 GB RAM | 20 GB SSD | Windows 10/11 (64-bit), Ubuntu 22.04+, Debian 12+, macOS 13+ |
| **Medium / Enterprise Server** | 4+ vCPU | 8–16 GB RAM | 60+ GB NVMe SSD | Ubuntu 22.04/24.04 LTS, Debian 12, RHEL 9 |

### Software Prerequisites
- **Docker Deployment**: Docker Engine `24.0+` and Docker Compose `v2.20+` (or Docker Desktop `4.25+` on Windows/macOS).
- **Source Build**: Node.js `18.x LTS` (or `>=18.0.0`), `pnpm 9.0.5` (via Corepack), and Git.

---

## First-Time Onboarding Wizard

Once BorngreatAccounting is running and you open `http://localhost` (or your configured `BASE_URL`):

1. **Create Owner Account**: Register your administrator name, email address, and password at `/auth/register`.
2. **Organization Setup Wizard**:
   - Enter your **Organization Name** and **Industry**.
   - Select your **Location / Jurisdiction** and **Base Currency** (supports 150+ currencies including `USD`, `EUR`, `GBP`, `GHS`, `TRY`, `CAD`, `AUD`, `NGN`, `KES`, `ZAR`).
   - Choose your **Fiscal Year Start Month** and **Time Zone**.
3. **Automatic Tenant Provisioning**: BorngreatAccounting automatically creates an isolated MariaDB database (`borngreat_tenant_<organization_id>`), runs all tenant schema migrations, seeds the standard double-entry Chart of Accounts, and redirects you to the main accounting dashboard.
