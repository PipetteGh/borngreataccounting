# Release Process

BorngreatAccounting uses semantic versioning (`vMAJOR.MINOR.PATCH`, e.g., `v1.0.0`) and automated GitHub Actions pipelines to build, test, scan, and publish releases.

---

## Automated Release Workflows

| Workflow File | Trigger | Outputs |
|---|---|---|
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | Every push & PR to `main` / `develop` | Shared build, server build, Jest unit tests, webapp build, docs & license check |
| [`.github/workflows/docker-publish.yml`](../.github/workflows/docker-publish.yml) | Push to `main` or `v*` tag | Multi-arch (`linux/amd64`, `linux/arm64`) GHCR images + CycloneDX SBOM |
| [`.github/workflows/windows-desktop.yml`](../.github/workflows/windows-desktop.yml) | Push to `main` or `v*` tag | `BorngreatAccounting-Setup.exe`, `BorngreatAccounting-Setup-1.0.0.exe`, `SHA256SUMS.txt` |
| [`.github/workflows/release.yml`](../.github/workflows/release.yml) | Push of `v*.*.*` tag | Publishes GitHub Release with Windows `.exe` installer, Docker deployment bundle `.zip`, and `SHA256SUMS.txt` |

---

## Cutting a New Release

1. Ensure all local builds and unit tests pass:
   ```bash
   pnpm run build:shared
   pnpm --filter "@borngreataccounting/server" run build
   pnpm --filter "@borngreataccounting/server" test
   pnpm --filter "@borngreataccounting/webapp" run build
   ```
2. Update the version in `shared/borngreataccounting-utils/src/branding.ts`, `packages/webapp/src/constants/brand.ts`, `packages/server/src/common/config/brand.ts`, and `desktop/src-tauri/tauri.conf.json`.
3. Commit using Conventional Commits format:
   ```bash
   git commit -m "chore: release BorngreatAccounting v1.0.0"
   ```
4. Create and push the annotated Git tag:
   ```bash
   git tag -a v1.0.0 -m "BorngreatAccounting v1.0.0"
   git push origin main --tags
   ```
5. GitHub Actions automatically builds and publishes:
   - `ghcr.io/pipettegh/borngreataccounting-web:1.0.0` & `:latest`
   - `ghcr.io/pipettegh/borngreataccounting-api:1.0.0` & `:latest`
   - `ghcr.io/pipettegh/borngreataccounting-worker:1.0.0` & `:latest`
   - `BorngreatAccounting-Setup-1.0.0.exe` & `BorngreatAccounting-Setup.exe`
   - `BorngreatAccounting-Docker-Deploy-1.0.0.zip`
   - `SHA256SUMS.txt` and `borngreataccounting-sbom.cdx.json`
