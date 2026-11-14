# ==============================================================================
# BorngreatAccounting (BtAccounting) -- Windows PowerShell Restore Utility
# Restores MariaDB (system + all tenant DBs) from a backup .zip archive
# ==============================================================================
param(
    [Parameter(Mandatory=$true)][string]$ArchiveFile,
    [string]$EnvFile = ".env",
    [string]$MysqlContainer = "borngreataccounting-mysql"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $ArchiveFile)) {
    Write-Error "Backup archive not found: $ArchiveFile"
    exit 1
}

if (Test-Path "$ArchiveFile.sha256") {
    Write-Host "[1/3] Verifying SHA-256 checksum..." -ForegroundColor Yellow
    $expected = ((Get-Content "$ArchiveFile.sha256" -Raw).Trim() -split '\s+')[0]
    $actual = (Get-FileHash -Path $ArchiveFile -Algorithm SHA256).Hash
    if ($expected.ToUpperInvariant() -ne $actual.ToUpperInvariant()) {
        Write-Error "SHA-256 checksum mismatch! Expected $expected, got $actual."
        exit 1
    }
    Write-Host "      Checksum verified." -ForegroundColor Green
}

$TempDir = Join-Path $env:TEMP ("borngreat_restore_" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $TempDir | Out-Null

try {
    Write-Host "[2/3] Extracting backup archive..." -ForegroundColor Yellow
    Expand-Archive -Path $ArchiveFile -DestinationPath $TempDir -Force

    $DbRootPassword = "root"
    if (Test-Path $EnvFile) {
        foreach ($line in (Get-Content $EnvFile)) {
            if ($line -match '^DB_ROOT_PASSWORD=(.+)$') {
                $DbRootPassword = $Matches[1].Trim()
            }
        }
    }

    $sqlFile = Join-Path $TempDir "databases\all_databases.sql"
    if (Test-Path $sqlFile) {
        Write-Host "[3/3] Restoring MariaDB system and tenant databases..." -ForegroundColor Yellow
        Get-Content $sqlFile -Raw | docker exec -i $MysqlContainer sh -c "mysql -uroot -p`"$DbRootPassword`""
        Write-Host "      Database restore completed successfully." -ForegroundColor Green
    }
} finally {
    Remove-Item -Recurse -Force $TempDir -ErrorAction SilentlyContinue
}
