# ==============================================================================
# BorngreatAccounting (BtAccounting) -- Automated Windows PowerShell Installer
# Your Accounting. Your Servers. Your Control.
# Automatically uses Docker if running, or falls back to the Self-Healing
# Native Windows Runtime (auto-installing Node.js, MariaDB 10.11, and Redis).
# ==============================================================================
param(
    [string]$ComposeFile = "docker-compose.production.yml",
    [string]$EnvFile = ".env",
    [string]$EnvTemplate = ".env.production.example",
    [switch]$BuildLocal,
    [switch]$UseNativeRuntime
)

$ErrorActionPreference = "Continue"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  BorngreatAccounting (BtAccounting) -- Windows Production Installer" -ForegroundColor Cyan
Write-Host "  Your Accounting. Your Servers. Your Control." -ForegroundColor Gray
Write-Host "======================================================================" -ForegroundColor Cyan

$dockerAvailable = $false
if (-not $UseNativeRuntime -and (Get-Command docker -ErrorAction SilentlyContinue)) {
    docker info >/dev/null 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerAvailable = $true
    }
}

if (-not $dockerAvailable) {
    Write-Host "[INFO] Docker Desktop is not running or not installed." -ForegroundColor Yellow
    Write-Host "       Activating Self-Healing Native Windows Runtime (Node.js + MariaDB 10.11 + Redis)..." -ForegroundColor Cyan
    & "$PSScriptRoot\scripts\windows-runtime.ps1" -Action install
    & "$PSScriptRoot\scripts\windows-runtime.ps1" -Action start
    exit 0
}

function New-RandomSecret([int]$Length = 32) {
    $bytes = New-Object byte[] $Length
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return ([Convert]::ToBase64String($bytes) -replace '[\+\/\=]', 'A').Substring(0, $Length)
}

function New-RandomHex([int]$ByteCount = 32) {
    $bytes = New-Object byte[] $ByteCount
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return ([BitConverter]::ToString($bytes) -replace '-', '').ToLowerInvariant()
}

if (-not (Test-Path $EnvFile)) {
    Write-Host "[1/4] Creating $EnvFile from $EnvTemplate with strong cryptographic secrets..." -ForegroundColor Yellow
    Copy-Item $EnvTemplate $EnvFile
    $content = Get-Content $EnvFile -Raw
    $content = $content -replace '(?m)^APP_JWT_SECRET=.*$', ("APP_JWT_SECRET=" + (New-RandomSecret 48))
    $content = $content -replace '(?m)^TWO_FACTOR_ENCRYPTION_KEY=.*$', ("TWO_FACTOR_ENCRYPTION_KEY=" + (New-RandomSecret 32))
    $content = $content -replace '(?m)^DB_PASSWORD=.*$', ("DB_PASSWORD=" + (New-RandomSecret 24))
    $content = $content -replace '(?m)^DB_ROOT_PASSWORD=.*$', ("DB_ROOT_PASSWORD=" + (New-RandomSecret 24))
    $content = $content -replace '(?m)^CLICKHOUSE_PASSWORD=.*$', ("CLICKHOUSE_PASSWORD=" + (New-RandomSecret 24))
    $content = $content -replace '(?m)^GARAGE_RPC_SECRET=.*$', ("GARAGE_RPC_SECRET=" + (New-RandomHex 32))
    $content = $content -replace '(?m)^GARAGE_ADMIN_TOKEN=.*$', ("GARAGE_ADMIN_TOKEN=" + (New-RandomSecret 32))
    Set-Content -Path $EnvFile -Value $content -Encoding UTF8
    Write-Host "      Generated secure secrets in $EnvFile." -ForegroundColor Green
} else {
    Write-Host "[1/4] Existing $EnvFile found -- preserving existing configuration." -ForegroundColor Green
}

Write-Host "[2/4] Pulling or building BorngreatAccounting containers..." -ForegroundColor Yellow
if ($BuildLocal) {
    docker compose -f $ComposeFile --env-file $EnvFile build
} else {
    docker compose -f $ComposeFile --env-file $EnvFile pull
    if ($LASTEXITCODE -ne 0) {
        Write-Host "      Registry pull unavailable or offline; building images locally..." -ForegroundColor Yellow
        docker compose -f $ComposeFile --env-file $EnvFile build
    }
}

Write-Host "[3/4] Starting BorngreatAccounting stack and executing database migrations..." -ForegroundColor Yellow
docker compose -f $ComposeFile --env-file $EnvFile up -d

Write-Host "[4/4] Stack launched!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  BorngreatAccounting is running at: http://localhost" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
