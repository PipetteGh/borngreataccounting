# Licensing and Open-Source Attribution

## License: GNU Affero General Public License v3.0 (AGPL-3.0)

**BorngreatAccounting (`BtAccounting`)** is free and open-source software distributed under the terms of the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

- Full license text: [`LICENSE`](../LICENSE)
- Additional disclaimer: [`DISCLAIMER`](../DISCLAIMER)
- Attribution notice: [`NOTICE`](../NOTICE)

---

## Upstream Attribution

BorngreatAccounting is a derivative work based on the open-source **Bigcapital** core accounting software:
- **Upstream Project**: Bigcapital ([https://github.com/bigcapitalhq/bigcapital](https://github.com/bigcapitalhq/bigcapital))
- **Upstream Copyright**: Copyright (c) 2022–present Bigcapital Technology, Inc. and contributors
- **Upstream License**: GNU Affero General Public License v3.0 (AGPL-3.0)

---

## BorngreatAccounting Modifications & Copyright

Copyright (c) 2026 **Peter Borngreat-Mensah** (`Borngreat`).

Substantial modifications made in this distribution include:
1. Complete rebranding and centralized brand configuration (`BorngreatAccounting` / `BtAccounting`) across shared utilities, NestJS server, React SPA, PDF templates, email templates, and i18n bundles.
2. Addition of the **About BorngreatAccounting** page (`/preferences/about`) with transparent open-source attribution.
3. Global currency pre-seeding (`GHS`, `TRY`, `GBP`, `USD`, `EUR`, `CAD`, `AUD`) and Ghanaian Cedi (`GHS.svg`) flag asset.
4. Optional multi-country **Tax Localization Presets** (`packages/server/src/modules/TaxRates/TaxLocalizationPresets.ts`), including Ghana Revenue Authority (GRA) VAT, NHIL, GETFund, and COVID-19 Health Recovery Levy presets alongside UK, EU, Türkiye, and US presets.
5. Production Docker Compose orchestration (`docker-compose.production.yml`), multi-stage Dockerfiles (`docker/frontend/Dockerfile`, `docker/backend/Dockerfile`, `docker/database/Dockerfile`), automated installers (`install.sh`, `install.ps1`), backup/restore utilities (`backup.sh`, `restore.sh`, `backup.ps1`, `restore.ps1`), and safe upgrade scripts (`upgrade.sh`, `upgrade.ps1`).
6. Windows Desktop Setup & Local Runtime Control Center (`desktop/` and `BorngreatAccounting-Setup.exe`).
7. Automated GitHub Actions CI/CD and release workflows (`.github/workflows/`).

In accordance with **Section 5** and **Section 13** of the GNU AGPL-3.0, the complete corresponding source code of BorngreatAccounting is publicly available at:
[https://github.com/PipetteGh/borngreataccounting](https://github.com/PipetteGh/borngreataccounting)
