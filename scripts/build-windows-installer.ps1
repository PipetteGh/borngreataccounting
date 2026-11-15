param(
    [string]$Version = "1.0.4",
    [switch]$ForceBuild
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $ScriptDir "..")).Path
Set-Location $RepoRoot

$StagingDir = Join-Path $RepoRoot "dist\staging"
$AppStage = Join-Path $StagingDir "app"
$OutDir = Join-Path $RepoRoot "dist\installers"

Write-Output "[Build] Cleaning staging directory..."
if (Test-Path $StagingDir) { Remove-Item -Path $StagingDir -Recurse -Force }
New-Item -ItemType Directory -Force -Path $AppStage, $OutDir | Out-Null

# 1. Ensure server & webapp dist are built
$needBuild = $ForceBuild -or
    (-not (Test-Path "packages\server\dist\main.js")) -or
    (-not (Test-Path "packages\server\dist\cli.js")) -or
    (-not (Test-Path "packages\webapp\dist\index.html"))

if ($needBuild) {
    Write-Output "[Build] Building shared packages, server, and webapp..."
    & pnpm run build:shared
    if ($LASTEXITCODE -ne 0) { throw "build:shared failed" }
    & pnpm run build:server
    if ($LASTEXITCODE -ne 0) { throw "build:server failed" }
    & pnpm run build:webapp
    if ($LASTEXITCODE -ne 0) { throw "build:webapp failed" }
}

# 2. Compile Control Center & Launcher executable
Write-Output "[Build] Compiling BorngreatAccounting.exe..."
$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path $csc)) { throw "csc.exe not found at $csc" }
& $csc /nologo /target:winexe /optimize+ /win32icon:"assets\branding\borngreataccounting.ico" /r:System.Windows.Forms.dll /r:System.Drawing.dll /out:"$StagingDir\BorngreatAccounting.exe" "desktop\windows-installer\BorngreatAccountingSetup.cs"
if ($LASTEXITCODE -ne 0) { throw "csc.exe compilation failed" }

# 3. Stage pre-built app payload
Write-Output "[Build] Staging application payload..."
foreach ($f in @("package.json", "pnpm-workspace.yaml", "pnpm-lock.yaml", "lerna.json", "LICENSE", "NOTICE")) {
    if (Test-Path $f) { Copy-Item $f $AppStage -Force }
}

New-Item -ItemType Directory -Force -Path (Join-Path $AppStage "scripts") | Out-Null
Copy-Item "scripts\windows-runtime.ps1", "scripts\windows-gateway.js" (Join-Path $AppStage "scripts") -Force

# Server
$srvStage = Join-Path $AppStage "packages\server"
New-Item -ItemType Directory -Force -Path $srvStage | Out-Null
Copy-Item "packages\server\package.json" $srvStage -Force
Copy-Item "packages\server\dist" (Join-Path $srvStage "dist") -Recurse -Force

# Webapp
$webStage = Join-Path $AppStage "packages\webapp"
New-Item -ItemType Directory -Force -Path $webStage | Out-Null
Copy-Item "packages\webapp\package.json" $webStage -Force
Copy-Item "packages\webapp\dist" (Join-Path $webStage "dist") -Recurse -Force

# Shared workspace packages
$sharedStage = Join-Path $AppStage "shared"
New-Item -ItemType Directory -Force -Path $sharedStage | Out-Null
Get-ChildItem "shared" -Directory | ForEach-Object {
    $pkgDst = Join-Path $sharedStage $_.Name
    New-Item -ItemType Directory -Force -Path $pkgDst | Out-Null
    $pkgJson = Join-Path $_.FullName "package.json"
    if (Test-Path $pkgJson) { Copy-Item $pkgJson $pkgDst -Force }
    $pkgDist = Join-Path $_.FullName "dist"
    if (Test-Path $pkgDist) { Copy-Item $pkgDist (Join-Path $pkgDst "dist") -Recurse -Force }
}

# 4. Locate Inno Setup 6 ISCC.exe and compile installer
$isccCandidates = @(
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    "C:\Program Files\Inno Setup 6\ISCC.exe",
    (Join-Path $env:LOCALAPPDATA "Programs\Inno Setup 6\ISCC.exe")
)
$iscc = $isccCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $iscc) {
    $cmd = Get-Command iscc -ErrorAction SilentlyContinue
    if ($cmd) { $iscc = $cmd.Source }
}
if (-not $iscc) { throw "Inno Setup 6 (ISCC.exe) not found." }

Write-Output "[Build] Compiling Inno Setup installer with $iscc (v$Version)..."
& $iscc "/DAppVersion=$Version" "desktop\windows-installer\BorngreatAccounting.iss"
if ($LASTEXITCODE -ne 0) { throw "ISCC.exe failed with exit code $LASTEXITCODE" }

$versionedExe = Join-Path $OutDir "BorngreatAccounting-Setup-$Version.exe"
$latestExe = Join-Path $OutDir "BorngreatAccounting-Setup.exe"
Copy-Item $versionedExe $latestExe -Force

$h1 = (Get-FileHash $versionedExe -Algorithm SHA256).Hash
$h2 = (Get-FileHash $latestExe -Algorithm SHA256).Hash
Set-Content -Path (Join-Path $OutDir "SHA256SUMS.txt") -Value "$h1  BorngreatAccounting-Setup-$Version.exe`r`n$h2  BorngreatAccounting-Setup.exe" -Encoding ASCII

Write-Output "[Build] Success! Generated:"
Write-Output "  - $versionedExe"
Write-Output "  - $latestExe"
