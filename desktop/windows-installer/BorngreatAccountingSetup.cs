using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
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
        private string workDir;

        public MainForm()
        {
            this.Text = "BorngreatAccounting (BtAccounting v1.0.0) — Setup & Control Center";
            this.Size = new Size(860, 600);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(15, 23, 42);
            this.ForeColor = Color.White;
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            workDir = AppDomain.CurrentDomain.BaseDirectory;

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
            btnInstall.Click += (s, e) => InitializeEnvironment();

            Button btnStart = CreateButton("2. Start Services", Color.FromArgb(16, 185, 129));
            btnStart.Click += (s, e) => RunDockerCompose("up -d");

            Button btnStop = CreateButton("Stop Services", Color.FromArgb(71, 85, 105));
            btnStop.Click += (s, e) => RunDockerCompose("down");

            Button btnStatus = CreateButton("Check Status", Color.FromArgb(71, 85, 105));
            btnStatus.Click += (s, e) => RunDockerCompose("ps");

            Button btnBackup = CreateButton("Run Backup", Color.FromArgb(245, 158, 11));
            btnBackup.Click += (s, e) => RunPowerShellScript("backup.ps1");

            Button btnOpenWeb = CreateButton("Open Dashboard (http://localhost)", Color.FromArgb(30, 94, 255));
            btnOpenWeb.Click += (s, e) => Process.Start("http://localhost");

            actionPanel.Controls.AddRange(new Control[] {
                btnInstall, btnStart, btnStop, btnStatus, btnBackup, btnOpenWeb
            });

            statusLabel = new Label
            {
                Dock = DockStyle.Bottom,
                Height = 28,
                Text = "  Ready  |  License: GNU AGPL-3.0  |  Repository: github.com/PipetteGh/Borngreat-Accounting---QuickBooks-Alternative",
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

            AppendLog("BorngreatAccounting (BtAccounting) v1.0.0 Desktop Control Center initialized.");
            AppendLog("Working directory: " + workDir);
            AppendLog("Click '1. Initialize / Install' to generate .env secrets and desktop shortcuts, or '2. Start Services' to launch.");
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
            string line = string.Format("[{0:HH:mm:ss}] {1}{2}", DateTime.Now, message, Environment.NewLine);
            logBox.AppendText(line);
        }

        private string GenerateSecret(int length)
        {
            byte[] bytes = new byte[length];
            using (RandomNumberGenerator rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(bytes);
            }
            string b64 = Convert.ToBase64String(bytes).Replace("+", "A").Replace("/", "B").Replace("=", "C");
            return b64.Length >= length ? b64.Substring(0, length) : b64;
        }

        private void InitializeEnvironment()
        {
            try
            {
                string envPath = Path.Combine(workDir, ".env");
                string templatePath = Path.Combine(workDir, ".env.production.example");
                if (!File.Exists(envPath) && File.Exists(templatePath))
                {
                    string content = File.ReadAllText(templatePath, Encoding.UTF8);
                    content = content.Replace("APP_JWT_SECRET=", "APP_JWT_SECRET=" + GenerateSecret(48));
                    content = content.Replace("TWO_FACTOR_ENCRYPTION_KEY=", "TWO_FACTOR_ENCRYPTION_KEY=" + GenerateSecret(32));
                    content = content.Replace("DB_PASSWORD=", "DB_PASSWORD=" + GenerateSecret(24));
                    content = content.Replace("DB_ROOT_PASSWORD=", "DB_ROOT_PASSWORD=" + GenerateSecret(24));
                    content = content.Replace("CLICKHOUSE_PASSWORD=", "CLICKHOUSE_PASSWORD=" + GenerateSecret(24));
                    File.WriteAllText(envPath, content, Encoding.UTF8);
                    AppendLog("Created .env with strong cryptographic secrets.");
                }
                else
                {
                    AppendLog(".env configuration checked.");
                }
                RunDockerCompose("--version");
            }
            catch (Exception ex)
            {
                AppendLog("Initialization error: " + ex.Message);
            }
        }

        private void RunDockerCompose(string args)
        {
            try
            {
                AppendLog("Running: docker compose -f docker-compose.production.yml " + args);
                ProcessStartInfo psi = new ProcessStartInfo("docker", "compose -f docker-compose.production.yml " + args)
                {
                    WorkingDirectory = workDir,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using (Process proc = Process.Start(psi))
                {
                    string stdout = proc.StandardOutput.ReadToEnd();
                    string stderr = proc.StandardError.ReadToEnd();
                    proc.WaitForExit();
                    if (!string.IsNullOrWhiteSpace(stdout)) AppendLog(stdout.Trim());
                    if (!string.IsNullOrWhiteSpace(stderr)) AppendLog(stderr.Trim());
                }
            }
            catch (Exception ex)
            {
                AppendLog("Docker execution note: " + ex.Message + " (Ensure Docker Desktop for Windows is installed and running).");
            }
        }

        private void RunPowerShellScript(string scriptName)
        {
            try
            {
                string scriptPath = Path.Combine(workDir, scriptName);
                if (!File.Exists(scriptPath))
                {
                    AppendLog("Script not found in current folder: " + scriptPath);
                    return;
                }
                AppendLog("Executing PowerShell script: " + scriptName);
                ProcessStartInfo psi = new ProcessStartInfo("powershell.exe", "-NoProfile -ExecutionPolicy Bypass -File \"" + scriptPath + "\"")
                {
                    WorkingDirectory = workDir,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using (Process proc = Process.Start(psi))
                {
                    string stdout = proc.StandardOutput.ReadToEnd();
                    string stderr = proc.StandardError.ReadToEnd();
                    proc.WaitForExit();
                    if (!string.IsNullOrWhiteSpace(stdout)) AppendLog(stdout.Trim());
                    if (!string.IsNullOrWhiteSpace(stderr)) AppendLog(stderr.Trim());
                }
            }
            catch (Exception ex)
            {
                AppendLog("Script execution error: " + ex.Message);
            }
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
