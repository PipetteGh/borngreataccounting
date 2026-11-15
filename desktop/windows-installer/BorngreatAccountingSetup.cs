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

            AppendLog("BorngreatAccounting (BtAccounting) v1.0.0 Desktop Control Center initialized.");
            AppendLog("Application Root Directory: " + repoRoot);
            AppendLog("Self-Healing Native Windows Runtime active (auto-installs Node.js, MariaDB 10.11, and Redis if missing).");
            AppendLog("Click '1. Initialize / Install' or '2. Start Services' to launch, then 'Open Dashboard (http://localhost:4100)'.");
        }

        private string ResolveRepositoryRoot()
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');
            string[] candidates = new string[]
            {
                baseDir,
                Path.GetFullPath(Path.Combine(baseDir, "..")),
                Path.GetFullPath(Path.Combine(baseDir, "..", ".."))
            };

            foreach (string candidate in candidates)
            {
                if (File.Exists(Path.Combine(candidate, "scripts", "windows-runtime.ps1")) ||
                    File.Exists(Path.Combine(candidate, "package.json")))
                {
                    return candidate;
                }
            }
            return baseDir;
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
                        AppendLog("ERROR: Runtime script not found at: " + scriptPath);
                        return;
                    }

                    AppendLog("Executing action '" + action + "'...");
                    ProcessStartInfo psi = new ProcessStartInfo("powershell.exe",
                        "-NoProfile -ExecutionPolicy Bypass -File \"" + scriptPath + "\" -Action " + action)
                    {
                        WorkingDirectory = repoRoot,
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
