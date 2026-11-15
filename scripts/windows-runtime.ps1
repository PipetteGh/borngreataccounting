# ==============================================================================
# BorngreatAccounting (BtAccounting) -- Self-Healing Windows Runtime Orchestrator
# Automatically installs missing dependencies (Node.js, Portable Redis, Portable
# MariaDB 10.11, or Docker Desktop) from official sources and manages the stack.
# ==============================================================================
param(
    [ValidateSet("install", "start", "stop", "restart", "status", "backup", "install-docker", "enable-autostart", "disable-autostart")]
    [string]$Action = "status"
)

$ErrorActionPreference = "Continue"

# Resolve repository root regardless of whether invoked from root or dist\installers
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $ScriptDir "..")).Path
Set-Location $RepoRoot

$RuntimeDir = Join-Path $RepoRoot ".runtime"
$RedisDir = Join-Path $RuntimeDir "redis"
$MariaDir = Join-Path $RuntimeDir "mariadb"
$MariaDataDir = Join-Path $RuntimeDir "mariadb-data"
$LogsDir = Join-Path $RuntimeDir "logs"
$EnvFile = Join-Path $RepoRoot ".env"

New-Item -ItemType Directory -Force -Path $RuntimeDir, $LogsDir | Out-Null

function Write-Step([string]$msg) {
    Write-Output "[BorngreatAccounting] $msg"
}

function New-RandomSecret([int]$Length = 32) {
    $bytes = New-Object byte[] $Length
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return ([Convert]::ToBase64String($bytes) -replace '[\+\/\=]', 'A').Substring(0, $Length)
}

function Ensure-NodeJS {
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCmd) {
        Write-Step "Node.js verified: $($nodeCmd.Source) ($(& node -v))"
        return
    }
    if (Test-Path "C:\Program Files\nodejs\node.exe") {
        $env:PATH = "C:\Program Files\nodejs;$env:PATH"
        Write-Step "Node.js verified at C:\Program Files\nodejs\node.exe ($(& node -v))"
        return
    }
    Write-Step "Node.js not found. Installing Node.js LTS from official Winget source (OpenJS.NodeJS.LTS)..."
    winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
    $env:PATH = "C:\Program Files\nodejs;$env:PATH"
}

function Ensure-PortableRedis {
    $redisExe = Join-Path $RedisDir "redis-server.exe"
    if (Test-Path $redisExe) {
        Write-Step "Portable Redis binary verified: $redisExe"
        return
    }
    Write-Step "Downloading official Portable Redis for Windows (v5.0.14.1)..."
    $redisZip = Join-Path $RuntimeDir "redis.zip"
    Invoke-WebRequest -Uri "https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.zip" -OutFile $redisZip -UseBasicParsing
    Expand-Archive -Path $redisZip -DestinationPath $RedisDir -Force
    Write-Step "Portable Redis installed successfully."
}

function Ensure-PortableMariaDB {
    $mysqldExe = Join-Path $MariaDir "bin\mysqld.exe"
    if (Test-Path $mysqldExe) {
        Write-Step "Portable MariaDB 10.11 binary verified: $mysqldExe"
        return
    }
    Write-Step "Downloading official MariaDB 10.11.10 x64 for Windows from archive.mariadb.org..."
    $mariaZip = Join-Path $RuntimeDir "mariadb.zip"
    $extractTmp = Join-Path $RuntimeDir "mariadb-extract"
    Invoke-WebRequest -Uri "https://archive.mariadb.org/mariadb-10.11.10/winx64-packages/mariadb-10.11.10-winx64.zip" -OutFile $mariaZip -UseBasicParsing
    Expand-Archive -Path $mariaZip -DestinationPath $extractTmp -Force
    Move-Item (Join-Path $extractTmp "mariadb-10.11.10-winx64") $MariaDir -Force
    Write-Step "Portable MariaDB 10.11.10 installed successfully."
}

function Ensure-EnvFile {
    if (-not (Test-Path $EnvFile)) {
        Write-Step "Generating .env configuration with cryptographic secrets..."
        $jwt = New-RandomSecret 48
        $totp = New-RandomSecret 32
        $envContent = @"
APP_NAME=BorngreatAccounting
APP_SHORT_NAME=BtAccounting
NODE_ENV=development
BASE_URL=http://localhost:4100
PORT=3000
WEB_PORT=4100

APP_JWT_SECRET=$jwt
TWO_FACTOR_ENCRYPTION_KEY=$totp
TWO_FACTOR_ISSUER=BorngreatAccounting

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=borngreat
DB_PASSWORD=borngreat
DB_ROOT_PASSWORD=root
DB_CHARSET=utf8
SYSTEM_DB_NAME=borngreat_system
TENANT_DB_NAME_PERFIX=borngreat_tenant_

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
QUEUE_HOST=127.0.0.1
QUEUE_PORT=6379

GOTENBERG_URL=http://127.0.0.1:9000
GOTENBERG_DOCS_URL=http://127.0.0.1:3000/public/

S3_REGION=garage
S3_ACCESS_KEY_ID=test-access-key
S3_SECRET_ACCESS_KEY=test-secret-key
S3_ENDPOINT=http://127.0.0.1:3900
S3_BUCKET=borngreataccounting
S3_FORCE_PATH_STYLE=true

CLICKHOUSE_ENABLED=false
CLICKHOUSE_HOST=127.0.0.1
CLICKHOUSE_PORT=8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=borngreat_ch_pass
CLICKHOUSE_DATABASE=borngreat_analytics

SIGNUP_DISABLED=false
SIGNUP_EMAIL_CONFIRMATION=false
FREE_TRIAL_DAYS=15
THROTTLE_GLOBAL_TTL=60000
THROTTLE_GLOBAL_LIMIT=600
THROTTLE_AUTH_TTL=60000
THROTTLE_AUTH_LIMIT=60
"@
        Set-Content -Path $EnvFile -Value $envContent -Encoding UTF8
        Write-Step ".env created at $EnvFile"
    } else {
        Write-Step ".env configuration verified at $EnvFile"
    }
}

function Start-BackingServices {
    Ensure-PortableRedis
    Ensure-PortableMariaDB

    # 1. Start Redis if not listening on 6379
    $redisListening = Get-NetTCPConnection -LocalPort 6379 -State Listen -ErrorAction SilentlyContinue
    if (-not $redisListening) {
        Write-Step "Starting Redis server on 127.0.0.1:6379..."
        Start-Process -FilePath (Join-Path $RedisDir "redis-server.exe") -WorkingDirectory $RedisDir -WindowStyle Hidden
        Start-Sleep -Seconds 2
    } else {
        Write-Step "Redis is already running on port 6379."
    }

    # 2. Initialize MariaDB data directory if needed
    if (-not (Test-Path (Join-Path $MariaDataDir "mysql"))) {
        Write-Step "Initializing MariaDB system tables in $MariaDataDir..."
        & (Join-Path $MariaDir "bin\mysql_install_db.exe") --datadir="$MariaDataDir" --default-user | Out-Null
    }

    # 3. Start MariaDB if not listening on 3306
    $mariaListening = Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue
    if (-not $mariaListening) {
        Write-Step "Starting MariaDB 10.11 server on 127.0.0.1:3306..."
        Start-Process -FilePath (Join-Path $MariaDir "bin\mysqld.exe") -ArgumentList "--datadir=`"$MariaDataDir`"", "--port=3306", "--bind-address=127.0.0.1", "--lower-case-table-names=1" -WindowStyle Hidden
        for ($i = 0; $i -lt 20; $i++) {
            Start-Sleep -Seconds 1
            & (Join-Path $MariaDir "bin\mysqladmin.exe") -h 127.0.0.1 -u root ping 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) { break }
        }
    } else {
        Write-Step "MariaDB is already running on port 3306."
    }

    # 4. Ensure borngreat_system database and user privileges exist
    & (Join-Path $MariaDir "bin\mysql.exe") -h 127.0.0.1 -u root -e "CREATE DATABASE IF NOT EXISTS borngreat_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE USER IF NOT EXISTS 'borngreat'@'%' IDENTIFIED BY 'borngreat'; CREATE USER IF NOT EXISTS 'borngreat'@'localhost' IDENTIFIED BY 'borngreat'; CREATE USER IF NOT EXISTS 'borngreat'@'127.0.0.1' IDENTIFIED BY 'borngreat'; GRANT ALL PRIVILEGES ON *.* TO 'borngreat'@'%' WITH GRANT OPTION; GRANT ALL PRIVILEGES ON *.* TO 'borngreat'@'localhost' WITH GRANT OPTION; GRANT ALL PRIVILEGES ON *.* TO 'borngreat'@'127.0.0.1' WITH GRANT OPTION; FLUSH PRIVILEGES;" 2>&1 | Out-Null
    Write-Step "MariaDB database 'borngreat_system' and tenant privileges verified."
}

function Ensure-Pnpm {
    $pnpmCmd = Get-Command pnpm -ErrorAction SilentlyContinue
    if ($pnpmCmd) {
        Write-Step "pnpm verified: $($pnpmCmd.Source)"
        return
    }
    Write-Step "pnpm not found. Enabling Corepack / installing pnpm..."
    try {
        & corepack enable 2>&1 | Out-Null
    } catch {}
    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        & npm install -g pnpm@9 2>&1 | Out-Null
    }
    Write-Step "pnpm ready."
}

function Ensure-AppBuilt {
    $serverMain = Join-Path $RepoRoot "packages\server\dist\main.js"
    $serverCli = Join-Path $RepoRoot "packages\server\dist\cli.js"
    $webappIndex = Join-Path $RepoRoot "packages\webapp\dist\index.html"
    if ((Test-Path $serverMain) -and (Test-Path $serverCli) -and (Test-Path $webappIndex)) {
        Write-Step "Application build artifacts verified."
        return
    }
    Ensure-Pnpm
    Push-Location $RepoRoot
    try {
        if (-not (Test-Path (Join-Path $RepoRoot "node_modules"))) {
            Write-Step "Installing monorepo dependencies (pnpm install --ignore-scripts)..."
            & pnpm install --ignore-scripts
        }
        Write-Step "Building shared packages, API server, and Webapp..."
        & pnpm run build:shared
        & pnpm run build:server
        & pnpm run build:webapp
    } finally {
        Pop-Location
    }
    Write-Step "Application build complete."
}

function Run-Migrations {
    Ensure-AppBuilt
    Write-Step "Running system & tenant database migrations..."
    Push-Location (Join-Path $RepoRoot "packages\server")
    try {
        & node dist/cli.js system:migrate:latest
        & node dist/cli.js tenants:migrate:latest
    } finally {
        Pop-Location
    }
    Write-Step "Database migrations up to date."
}

function Start-AllServices {
    Ensure-NodeJS
    Ensure-EnvFile
    Start-BackingServices
    Run-Migrations

    # Start Backend API Server (:3000)
    $apiListening = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
    if (-not $apiListening) {
        Write-Step "Starting BorngreatAccounting API Server on http://127.0.0.1:3000..."
        $apiOut = Join-Path $LogsDir "api-stdout.log"
        $apiErr = Join-Path $LogsDir "api-stderr.log"
        Start-Process -FilePath "node" -ArgumentList "dist/main.js" -WorkingDirectory (Join-Path $RepoRoot "packages\server") -RedirectStandardOutput $apiOut -RedirectStandardError $apiErr -WindowStyle Hidden
    } else {
        Write-Step "BorngreatAccounting API Server is already listening on port 3000."
    }

    # Start Web Gateway Server (:4100)
    $webListening = Get-NetTCPConnection -LocalPort 4100 -State Listen -ErrorAction SilentlyContinue
    if (-not $webListening) {
        Write-Step "Starting BorngreatAccounting Web Gateway on http://localhost:4100..."
        $webOut = Join-Path $LogsDir "web-stdout.log"
        $webErr = Join-Path $LogsDir "web-stderr.log"
        Start-Process -FilePath "node" -ArgumentList "scripts/windows-gateway.js" -WorkingDirectory $RepoRoot -RedirectStandardOutput $webOut -RedirectStandardError $webErr -WindowStyle Hidden
    } else {
        Write-Step "BorngreatAccounting Web Gateway is already listening on port 4100."
    }

    # Wait for API readiness
    for ($i = 0; $i -lt 25; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/system_db" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) {
                break
            }
        } catch {
            Start-Sleep -Seconds 1
        }
    }

    Show-Status
}

function Stop-AllServices {
    Write-Step "Stopping BorngreatAccounting services..."
    foreach ($port in @(4100, 3000)) {
        $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        foreach ($c in $conns) {
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
    Get-Process mysqld, redis-server -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Step "All BorngreatAccounting services stopped."
}

$AutoStartTaskName = "BorngreatAccounting-AutoStart"
$StartupVbsPath = Join-Path ([Environment]::GetFolderPath("Startup")) "BorngreatAccounting-AutoStart.vbs"

function Test-AutoStartEnabled {
    $taskExists = $false
    try {
        $t = Get-ScheduledTask -TaskName $AutoStartTaskName -ErrorAction SilentlyContinue
        if ($t -and $t.State -ne "Disabled") { $taskExists = $true }
    } catch {}
    return ($taskExists -or (Test-Path $StartupVbsPath))
}

function Enable-AutoStart {
    $scriptPath = Join-Path $RepoRoot "scripts\windows-runtime.ps1"
    $psArgs = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`" -Action start"
    $taskRegistered = $false

    try {
        $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $psArgs -WorkingDirectory $RepoRoot
        $triggers = @((New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME))
        $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
        if ($isAdmin) {
            $triggers += (New-ScheduledTaskTrigger -AtStartup)
        }
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 0)
        Register-ScheduledTask -TaskName $AutoStartTaskName -Action $action -Trigger $triggers -Settings $settings -Description "Auto-starts BorngreatAccounting services (MariaDB, Redis, API Server, Web Gateway) on boot/logon." -Force | Out-Null
        $taskRegistered = $true
        # Remove Startup VBS if Scheduled Task succeeded to avoid duplicate triggers
        if (Test-Path $StartupVbsPath) {
            Remove-Item $StartupVbsPath -Force -ErrorAction SilentlyContinue
        }
        Write-Step "Windows Auto-Start enabled via Scheduled Task '$AutoStartTaskName'."
    } catch {
        Write-Step "Scheduled Task registration unavailable ($($_.Exception.Message)); falling back to Windows Startup folder launcher..."
    }

    if (-not $taskRegistered) {
        $vbsDir = Split-Path -Parent $StartupVbsPath
        if (-not (Test-Path $vbsDir)) {
            New-Item -ItemType Directory -Force -Path $vbsDir | Out-Null
        }
        $escapedCmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`" -Action start".Replace('"', '""')
        $vbsContent = "Set WshShell = CreateObject(`"WScript.Shell`")`r`nWshShell.Run `"$escapedCmd`", 0, False`r`n"
        Set-Content -Path $StartupVbsPath -Value $vbsContent -Encoding ASCII
        Write-Step "Windows Auto-Start enabled via Startup folder: $StartupVbsPath"
    }
}

function Disable-AutoStart {
    try {
        Unregister-ScheduledTask -TaskName $AutoStartTaskName -Confirm:$false -ErrorAction SilentlyContinue
    } catch {}
    if (Test-Path $StartupVbsPath) {
        Remove-Item $StartupVbsPath -Force -ErrorAction SilentlyContinue
    }
    Write-Step "Windows Auto-Start disabled."
}

function Show-Status {
    Write-Output "----------------------------------------------------------------------"
    Write-Output "  BorngreatAccounting (BtAccounting) -- Live System Status"
    Write-Output "----------------------------------------------------------------------"
    $maria = if (Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue) { "RUNNING (127.0.0.1:3306)" } else { "STOPPED" }
    $redis = if (Get-NetTCPConnection -LocalPort 6379 -State Listen -ErrorAction SilentlyContinue) { "RUNNING (127.0.0.1:6379)" } else { "STOPPED" }
    $api   = if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) { "RUNNING (http://127.0.0.1:3000)" } else { "STOPPED" }
    $web   = if (Get-NetTCPConnection -LocalPort 4100 -State Listen -ErrorAction SilentlyContinue) { "RUNNING (http://localhost:4100)" } else { "STOPPED" }
    $autoStart = if (Test-AutoStartEnabled) { "ENABLED" } else { "DISABLED" }

    Write-Output "  MariaDB 10.11 Database : $maria"
    Write-Output "  Redis Queue & Cache    : $redis"
    Write-Output "  NestJS Backend API     : $api"
    Write-Output "  Webapp SPA Dashboard   : $web"
    Write-Output "  Auto-Start on Boot     : $autoStart"
    Write-Output "----------------------------------------------------------------------"
    if ($web -like "RUNNING*") {
        Write-Output "  READY! Open http://localhost:4100 in your browser."
    }
}

switch ($Action) {
    "install" {
        Ensure-NodeJS
        Ensure-EnvFile
        Start-BackingServices
        Run-Migrations
        Enable-AutoStart
        Write-Step "Installation & initialization complete! Auto-start on boot/logon is enabled."
    }
    "start" {
        Enable-AutoStart
        Start-AllServices
    }
    "stop" {
        Stop-AllServices
    }
    "restart" {
        Stop-AllServices
        Start-Sleep -Seconds 2
        Start-AllServices
    }
    "status" {
        Show-Status
    }
    "enable-autostart" {
        Enable-AutoStart
    }
    "disable-autostart" {
        Disable-AutoStart
    }
    "backup" {
        $backupDir = Join-Path $RepoRoot "backups"
        New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
        $ts = Get-Date -Format "yyyyMMdd_HHmmss"
        $sqlOut = Join-Path $backupDir "borngreataccounting_db_$ts.sql"
        & (Join-Path $MariaDir "bin\mysqldump.exe") -h 127.0.0.1 -u root --all-databases --single-transaction > $sqlOut
        $zipOut = Join-Path $backupDir "borngreataccounting_backup_$ts.zip"
        Compress-Archive -Path $sqlOut, $EnvFile -DestinationPath $zipOut -Force
        Remove-Item $sqlOut -Force -ErrorAction SilentlyContinue
        $hash = (Get-FileHash $zipOut -Algorithm SHA256).Hash
        Set-Content -Path "$zipOut.sha256" -Value "$hash  $(Split-Path $zipOut -Leaf)" -Encoding ASCII
        Write-Step "Backup created: $zipOut (SHA-256: $hash)"
    }
    "install-docker" {
        Write-Step "Installing Docker Desktop for Windows via official Microsoft Winget source..."
        winget install -e --id Docker.DockerDesktop --accept-package-agreements --accept-source-agreements
    }
}
