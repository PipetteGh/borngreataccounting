# ==============================================================================
# BorngreatAccounting (BtAccounting) -- Automated Safe Upgrade Script (Windows)
# Performs pre-upgrade backup, pulls latest images, runs migrations, and restarts
# ==============================================================================
param(
    [string]$ComposeFile = "docker-compose.production.yml",
    [string]$EnvFile = ".env"
)

$ErrorActionPreference = "Stop"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  BorngreatAccounting -- Windows Safe Upgrade" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

Write-Host "[1/4] Running pre-upgrade backup..." -ForegroundColor Yellow
& .\backup.ps1 -EnvFile $EnvFile

Write-Host "[2/4] Pulling latest BorngreatAccounting container images..." -ForegroundColor Yellow
docker compose -f $ComposeFile --env-file $EnvFile pull

Write-Host "[3/4] Running system and tenant database migrations..." -ForegroundColor Yellow
docker compose -f $ComposeFile --env-file $EnvFile run --rm database_migration

Write-Host "[4/4] Restarting updated services..." -ForegroundColor Yellow
docker compose -f $ComposeFile --env-file $EnvFile up -d --remove-orphans

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  BorngreatAccounting upgrade completed successfully!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
