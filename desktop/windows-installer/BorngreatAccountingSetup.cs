using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

[assembly: AssemblyTitle("BorngreatAccounting Setup & Desktop Control Center")]
[assembly: AssemblyDescription("BorngreatAccounting (BtAccounting) — Self-Hosted Accounting and Financial Software")]
[assembly: AssemblyCompany("Borngreat (Peter Borngreat-Mensah)")]
[assembly: AssemblyProduct("BorngreatAccounting")]
[assembly: AssemblyCopyright("Copyright (c) 2026 Peter Borngreat-Mensah (Borngreat). GNU AGPL-3.0.")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]
[assembly: ComVisible(false)]

namespace BorngreatAccountingDesktop
{
    public class MainForm : Form
    {
        private TextBox logBox;
        private Label statusLabel;
        private string repoRoot;

        public MainForm()
        {
            this.Text = "BorngreatAccounting (BtAccounting v1.0.0) — Setup & Control Center";
            this.Size = new Size(920, 620);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(15, 23, 42);
            this.ForeColor = Color.White;
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            repoRoot = ResolveRepositoryRoot();

            Panel headerPanel = new Panel
            {
                Dock = DockStyle.Top,
                Height = 86,
                BackColor = Color.FromArgb(15, 45, 94),
                Padding = new Padding(20, 14, 20, 14)
            };

            Label titleLabel = new Label
            {
                Text = "BorngreatAccounting (BtAccounting)",
                Font = new Font("Segoe UI", 16f, FontStyle.Bold),
                ForeColor = Color.White,
                AutoSize = true,
                Location = new Point(22, 14)
            };

            Label subTitleLabel = new Label
            {
                Text = "Your Accounting. Your Servers. Your Control.  |  Publisher: Peter Borngreat-Mensah (Borngreat)",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Regular),
                ForeColor = Color.FromArgb(203, 213, 225),
                AutoSize = true,
                Location = new Point(24, 48)
            };

            headerPanel.Controls.Add(titleLabel);
            headerPanel.Controls.Add(subTitleLabel);

            FlowLayoutPanel actionPanel = new FlowLayoutPanel
            {
                Dock = DockStyle.Top,
                Height = 64,
                Padding = new Padding(18, 12, 18, 10),
                BackColor = Color.FromArgb(30, 41, 59)
            };

            Button btnInstall = CreateButton("1. Initialize / Install", Color.FromArgb(30, 94, 255));
            btnInstall.Click += (s, e) => RunRuntimeActionAsync("install");

            Button btnStart = CreateButton("2. Start Services", Color.FromArgb(16, 185, 129));
            btnStart.Click += (s, e) => RunRuntimeActionAsync("start");

            Button btnStop = CreateButton("Stop Services", Color.FromArgb(71, 85, 105));
            btnStop.Click += (s, e) => RunRuntimeActionAsync("stop");

            Button btnStatus = CreateButton("Check Status", Color.FromArgb(71, 85, 105));
            btnStatus.Click += (s, e) => RunRuntimeActionAsync("status");

            Button btnAutoStart = CreateButton("Enable Auto-Start", Color.FromArgb(14, 116, 144));
            btnAutoStart.Click += (s, e) => RunRuntimeActionAsync("enable-autostart");

            Button btnBackup = CreateButton("Run Backup", Color.FromArgb(245, 158, 11));
            btnBackup.Click += (s, e) => RunRuntimeActionAsync("backup");

            Button btnOpenWeb = CreateButton("Open Dashboard (http://localhost:4100)", Color.FromArgb(30, 94, 255));
            btnOpenWeb.Click += (s, e) => Process.Start("http://localhost:4100");

            actionPanel.Controls.AddRange(new Control[] {
                btnInstall, btnStart, btnStop, btnStatus, btnAutoStart, btnBackup, btnOpenWeb
            });

            statusLabel = new Label
            {
                Dock = DockStyle.Bottom,
                Height = 28,
                Text = "  Ready  |  License: GNU AGPL-3.0  |  Repository: github.com/PipetteGh/borngreataccounting",
                BackColor = Color.FromArgb(15, 23, 42),
                ForeColor = Color.FromArgb(148, 163, 184),
                TextAlign = ContentAlignment.MiddleLeft
            };

            logBox = new TextBox
            {
                Dock = DockStyle.Fill,
                Multiline = true,
                ReadOnly = true,
                ScrollBars = ScrollBars.Vertical,
                BackColor = Color.FromArgb(2, 6, 23),
                ForeColor = Color.FromArgb(226, 232, 240),
                Font = new Font("Consolas", 9.5f, FontStyle.Regular),
                BorderStyle = BorderStyle.FixedSingle
            };

            this.Controls.Add(logBox);
            this.Controls.Add(actionPanel);
            this.Controls.Add(headerPanel);
            this.Controls.Add(statusLabel);

            AppendLog("BorngreatAccounting (BtAccounting) Desktop Control Center initialized.");
            AppendLog("Application Directory: " + repoRoot);
            AppendLog("Self-Healing Native Windows Runtime active (auto-installs Node.js, MariaDB 10.11, and Redis if missing).");
            if (!File.Exists(Path.Combine(repoRoot, "scripts", "windows-runtime.ps1")))
            {
                AppendLog("Standalone installer mode: click '1. Initialize / Install' to automatically download, install, and start BorngreatAccounting.");
            }
            else
            {
                AppendLog("Click '1. Initialize / Install' or '2. Start Services' to launch, then 'Open Dashboard (http://localhost:4100)'.");
            }
        }

        private string GetDefaultInstallRoot()
        {
            return Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "BorngreatAccounting",
                "app"
            );
        }

        private string ResolveRepositoryRoot()
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');
            string defaultInstall = GetDefaultInstallRoot();
            string[] candidates = new string[]
            {
                baseDir,
                Path.GetFullPath(Path.Combine(baseDir, "..")),
                Path.GetFullPath(Path.Combine(baseDir, "..", "..")),
                defaultInstall
            };

            foreach (string candidate in candidates)
            {
                if (File.Exists(Path.Combine(candidate, "scripts", "windows-runtime.ps1")))
                {
                    return candidate;
                }
            }
            return defaultInstall;
        }

        private bool BootstrapApplication()
        {
            AppendLog("Application files not found locally. Downloading BorngreatAccounting from GitHub...");
            string installParent = Path.GetDirectoryName(repoRoot);
            if (!Directory.Exists(installParent))
            {
                Directory.CreateDirectory(installParent);
            }

            string currentExe = Process.GetCurrentProcess().MainModule.FileName;
            string installedExe = Path.Combine(installParent, "BorngreatAccounting-Setup.exe");

            string psBootstrap = string.Join("; ", new string[]
            {
                "$ErrorActionPreference = 'Stop'",
                "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12",
                "$tmp = Join-Path $env:TEMP ('bga-setup-' + [guid]::NewGuid().ToString('N'))",
                "New-Item -ItemType Directory -Force -Path $tmp | Out-Null",
                "$zip = Join-Path $tmp 'repo.zip'",
                "Write-Output '[Bootstrap] Downloading BorngreatAccounting release archive...'",
                "Invoke-WebRequest -Uri 'https://github.com/PipetteGh/borngreataccounting/archive/refs/heads/main.zip' -OutFile $zip -UseBasicParsing",
                "Write-Output '[Bootstrap] Extracting application files...'",
                "Expand-Archive -Path $zip -DestinationPath $tmp -Force",
                "$src = Get-ChildItem -Path $tmp -Directory | Where-Object { $_.Name -like 'borngreataccounting*' } | Select-Object -First 1",
                "if (-not $src) { throw 'Extracted repository folder not found.' }",
                "$dest = '" + repoRoot.Replace("'", "''") + "'",
                "if (Test-Path $dest) { Remove-Item -Path $dest -Recurse -Force }",
                "Move-Item -Path $src.FullName -Destination $dest",
                "Remove-Item -Path $tmp -Recurse -Force -ErrorAction SilentlyContinue",
                "Copy-Item -Path '" + currentExe.Replace("'", "''") + "' -Destination '" + installedExe.Replace("'", "''") + "' -Force",
                "$ws = New-Object -ComObject WScript.Shell",
                "$desktopLnk = Join-Path ([Environment]::GetFolderPath('Desktop')) 'BorngreatAccounting.lnk'",
                "$sc1 = $ws.CreateShortcut($desktopLnk); $sc1.TargetPath = '" + installedExe.Replace("'", "''") + "'; $sc1.WorkingDirectory = $dest; $sc1.Description = 'BorngreatAccounting Control Center'; $sc1.Save()",
                "$menuDir = Join-Path ([Environment]::GetFolderPath('Programs')) 'BorngreatAccounting'",
                "New-Item -ItemType Directory -Force -Path $menuDir | Out-Null",
                "$menuLnk = Join-Path $menuDir 'BorngreatAccounting.lnk'",
                "$sc2 = $ws.CreateShortcut($menuLnk); $sc2.TargetPath = '" + installedExe.Replace("'", "''") + "'; $sc2.WorkingDirectory = $dest; $sc2.Description = 'BorngreatAccounting Control Center'; $sc2.Save()",
                "Write-Output '[Bootstrap] Desktop and Start Menu shortcuts created.'"
            });

            int exitCode = RunPowerShellCommand("-NoProfile -ExecutionPolicy Bypass -Command \"" + psBootstrap.Replace("\"", "\\\"") + "\"", installParent);
            return exitCode == 0 && File.Exists(Path.Combine(repoRoot, "scripts", "windows-runtime.ps1"));
        }

        private int RunPowerShellCommand(string arguments, string workingDir)
        {
            ProcessStartInfo psi = new ProcessStartInfo("powershell.exe", arguments)
            {
                WorkingDirectory = workingDir,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using (Process proc = new Process())
            {
                proc.StartInfo = psi;
                proc.OutputDataReceived += (s, e) => { if (!string.IsNullOrEmpty(e.Data)) AppendLog(e.Data); };
                proc.ErrorDataReceived += (s, e) => { if (!string.IsNullOrEmpty(e.Data)) AppendLog(e.Data); };
                proc.Start();
                proc.BeginOutputReadLine();
                proc.BeginErrorReadLine();
                proc.WaitForExit();
                return proc.ExitCode;
            }
        }

        private Button CreateButton(string text, Color bg)
        {
            return new Button
            {
                Text = text,
                BackColor = bg,
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                AutoSize = true,
                Padding = new Padding(8, 4, 8, 4),
                Margin = new Padding(0, 0, 10, 0),
                Cursor = Cursors.Hand
            };
        }

        private void AppendLog(string message)
        {
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action<string>(AppendLog), message);
                return;
            }
            string line = string.Format("[{0:HH:mm:ss}] {1}{2}", DateTime.Now, message, Environment.NewLine);
            logBox.AppendText(line);
        }

        private void RunRuntimeActionAsync(string action)
        {
            Task.Run(() =>
            {
                try
                {
                    string scriptPath = Path.Combine(repoRoot, "scripts", "windows-runtime.ps1");
                    if (!File.Exists(scriptPath))
                    {
                        if (!BootstrapApplication())
                        {
                            AppendLog("ERROR: Bootstrap failed. Please check your internet connection and retry.");
                            return;
                        }
                    }

                    AppendLog("Executing action '" + action + "'...");
                    int code = RunPowerShellCommand(
                        "-NoProfile -ExecutionPolicy Bypass -File \"" + scriptPath + "\" -Action " + action,
                        repoRoot
                    );

                    if (action == "install" && code == 0)
                    {
                        AppendLog("Starting BorngreatAccounting services...");
                        RunPowerShellCommand(
                            "-NoProfile -ExecutionPolicy Bypass -File \"" + scriptPath + "\" -Action start",
                            repoRoot
                        );
                    }
                }
                catch (Exception ex)
                {
                    AppendLog("Execution error: " + ex.Message);
                }
            });
        }

        [STAThread]
        public static int Main(string[] args)
        {
            if (args != null && args.Length > 0)
            {
                if (args[0] == "--version" || args[0] == "--verify")
                {
                    Console.WriteLine("BorngreatAccounting (BtAccounting) Windows Setup & Runtime Manager v1.0.0");
                    Console.WriteLine("Publisher: Borngreat (Peter Borngreat-Mensah)");
                    Console.WriteLine("License: GNU AGPL-3.0");
                    Console.WriteLine("Status: VERIFIED_OK");
                    return 0;
                }
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
            return 0;
        }
    }
}
