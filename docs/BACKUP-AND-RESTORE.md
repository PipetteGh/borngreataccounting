# Backup and Restore Guide

Because BorngreatAccounting uses a multi-tenant architecture (one system database `borngreat_system` plus one database per organization `borngreat_tenant_<id>`) alongside S3/Garage attachment storage, a complete backup must include:
1. **All MariaDB databases** (`--all-databases --single-transaction --routines --triggers`)
2. **Garage S3 object storage volume** (`borngreat_prod_garage`)
3. **Environment configuration** (`.env`, specifically `APP_JWT_SECRET` and `TWO_FACTOR_ENCRYPTION_KEY`)

---

## Automated Backup

### Linux / macOS
```bash
chmod +x backup.sh
./backup.sh
```
This creates:
- `backups/borngreataccounting_backup_<YYYYMMDD_HHMMSS>.tar.gz`
- `backups/borngreataccounting_backup_<YYYYMMDD_HHMMSS>.tar.gz.sha256`

### Windows PowerShell
```powershell
.\backup.ps1
```
This creates:
- `backups\borngreataccounting_backup_<YYYYMMDD_HHMMSS>.zip`
- `backups\borngreataccounting_backup_<YYYYMMDD_HHMMSS>.zip.sha256`

---

## Automated Restore

### Linux / macOS
```bash
chmod +x restore.sh
./restore.sh backups/borngreataccounting_backup_20261114_120000.tar.gz
```

### Windows PowerShell
```powershell
.\restore.ps1 -ArchiveFile .\backups\borngreataccounting_backup_20261114_120000.zip
```

Both scripts automatically verify the `.sha256` integrity checksum before restoring any database or storage volume.

---

## Scheduling Nightly Automated Backups (Cron / Task Scheduler)

### Linux Cron (Every night at 02:00 AM)
```cron
0 2 * * * cd /opt/borngreataccounting && ./backup.sh >> /var/log/borngreat-backup.log 2>&1
```

### Windows Task Scheduler
```powershell
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"C:\BorngreatAccounting\backup.ps1`"" -WorkingDirectory "C:\BorngreatAccounting"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "BorngreatAccounting-NightlyBackup" -Action $action -Trigger $trigger
```
