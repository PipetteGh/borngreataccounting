# Windows Installation Guide (`BorngreatAccounting-Setup.exe`)

BorngreatAccounting supports native Windows 10 and Windows 11 (64-bit) workstations and servers through both the **BorngreatAccounting Setup & Desktop Control Center (`BorngreatAccounting-Setup.exe`)** and the **PowerShell Automated Installer (`install.ps1`)**.

---

## Prerequisites on Windows

1. **Windows 10 (version 2004+) or Windows 11 (64-bit)**.
2. **WSL 2 (Windows Subsystem for Linux 2)** enabled:
   ```powershell
   wsl --install
   ```
3. **Docker Desktop for Windows**:
   - Download and install from [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/).
   - Ensure **"Use the WSL 2 based engine"** is checked in Docker Desktop Settings.
   - Start Docker Desktop and wait until the engine status shows **Running**.

---

## Option A: Using `BorngreatAccounting-Setup.exe` (GUI Control Center)

1. Locate the compiled installer in the repository or GitHub Releases:
   - `dist\installers\BorngreatAccounting-Setup.exe` (or `dist\installers\BorngreatAccounting-Setup-1.0.0.exe`)
2. Double-click **`BorngreatAccounting-Setup.exe`**.
3. In the **BorngreatAccounting Setup & Control Center** window:
   - Click **"1. Initialize / Install"** to automatically generate your `.env` production configuration with cryptographic secrets.
   - Click **"2. Start Services"** to launch MariaDB, Redis, Gotenberg, Garage, the Backend API, and Webapp containers.
   - Click **"Open Dashboard (http://localhost)"** to open BorngreatAccounting in your default browser.
   - Use **"Check Status"**, **"Run Backup"**, and **"Stop Services"** anytime to manage your local stack.

### Verifying the Executable from Command Line
```powershell
.\dist\installers\BorngreatAccounting-Setup-1.0.0.exe --verify
```

---

## Option B: Using PowerShell (`install.ps1`)

From an elevated or standard PowerShell terminal in the repository root:
```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

To build images locally from source instead of pulling from GHCR:
```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1 -BuildLocal
```

---

## Rebuilding `BorngreatAccounting-Setup.exe` from Source

No external SDK is required on Windows — `.NET Framework 4.x` (`csc.exe`) is built into Windows 10/11:
```powershell
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /nologo /target:exe /optimize+ `
  /win32icon:"assets\branding\borngreataccounting.ico" `
  /r:System.Windows.Forms.dll /r:System.Drawing.dll `
  /out:"dist\installers\BorngreatAccounting-Setup-1.0.0.exe" `
  "desktop\windows-installer\BorngreatAccountingSetup.cs"
```
For the optional Rust/Tauri native WebView2 shell under `desktop/`, see [`desktop/package.json`](../desktop/package.json).
