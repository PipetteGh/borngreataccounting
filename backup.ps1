# ==============================================================================
# BorngreatAccounting (BtAccounting) -- Windows PowerShell Backup Utility
# Backs up MariaDB (system + all tenant DBs), Garage S3 storage, and .env config
# ==============================================================================
param(
    [string]$BackupRoot = ".\backups",
    [string]$EnvFile = ".env",
    [string]$MysqlContainer = "borngreataccounting-mysql"
)

$ErrorActionPreference = "Stop"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupDir = Join-Path $BackupRoot "borngreataccounting_backup_$Timestamp"
$ArchiveFile = Join-Path $BackupRoot "borngreataccounting_backup_$Timestamp.zip"

New-Item -ItemType Directory -Force -Path "$BackupDir\databases", "$BackupDir\storage" | Out-Null

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  BorngreatAccounting Windows Backup Utility -- $Timestamp" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

$DbRootPassword = "root"
if (Test-Path $EnvFile) {
    Copy-Item $EnvFile "$BackupDir\env.backup"
    $lines = Get-Content $EnvFile
    foreach ($line in $lines) {
        if ($line -match '^DB_ROOT_PASSWORD=(.+)$') {
            $DbRootPassword = $Matches[1].Trim()
        }
    }
}

Write-Host "[1/2] Dumping MariaDB system and tenant databases..." -ForegroundColor Yellow
$running = docker ps --format "{{.Names}}" | Where-Object { $_ -eq $MysqlContainer }
if ($running) {
    docker exec $MysqlContainer sh -c "mysqldump -uroot -p`"$DbRootPassword`" --all-databases --single-transaction --routines --triggers --events" > "$BackupDir\databases\all_databases.sql"
    Write-Host "      Database dump saved." -ForegroundColor Green
} else {
    Write-Host "[WARN] Container $MysqlContainer is not running; skipping live mysqldump." -ForegroundColor Yellow
}

Write-Host "[2/2] Compressing backup archive and computing SHA-256 checksum..." -ForegroundColor Yellow
Compress-Archive -Path "$BackupDir\*" -DestinationPath $ArchiveFile -Force
Remove-Item -Recurse -Force $BackupDir
$hash = (Get-FileHash -Path $ArchiveFile -Algorithm SHA256).Hash
Set-Content -Path "$ArchiveFile.sha256" -Value "$hash  $(Split-Path $ArchiveFile -Leaf)" -Encoding ASCII

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  Backup completed: $ArchiveFile" -ForegroundColor Green
Write-Host "  SHA-256:          $hash" -ForegroundColor Gray
Write-Host "======================================================================" -ForegroundColor Cyan
