using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Security.Principal;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Win32;

namespace BorngreatAccounting.Setup
{
    public enum InstallMode
    {
        Single,
        Server,
        Client
    }

    internal static class AppHelper
    {
        public const string AppName = "BorngreatAccounting";
        public const string AppVersion = "1.0.5";
        public const string Publisher = "Borngreat (Peter Borngreat-Mensah)";
        public const string UninstallRegKey = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\BorngreatAccounting";
        public const string LatestReleaseUrl = "https://github.com/PipetteGh/borngreataccounting/releases/latest";
        public const string LatestInstallerUrl = "https://github.com/PipetteGh/borngreataccounting/releases/latest/download/BorngreatAccounting-Setup.exe";

        public static int CompareVersions(string a, string b)
        {
            string[] pa = (a ?? "0").Trim().TrimStart('v', 'V').Split('.');
            string[] pb = (b ?? "0").Trim().TrimStart('v', 'V').Split('.');
            int len = Math.Max(pa.Length, pb.Length);
            for (int i = 0; i < len; i++)
            {
                int va = 0, vb = 0;
                if (i < pa.Length) int.TryParse(pa[i], out va);
                if (i < pb.Length) int.TryParse(pb[i], out vb);
                if (va > vb) return 1;
                if (va < vb) return -1;
            }
            return 0;
        }

        public static string FetchLatestReleaseVersion()
        {
            try
            {
                ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(LatestReleaseUrl);
                req.AllowAutoRedirect = false;
                req.Timeout = 4500;
                req.UserAgent = "BorngreatAccounting-Updater/1.0";
                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                {
                    string loc = resp.Headers["Location"];
                    if (!string.IsNullOrEmpty(loc))
                    {
                        int idx = loc.LastIndexOf("/tag/");
                        if (idx >= 0)
                        {
                            return loc.Substring(idx + 5).Trim().TrimStart('v', 'V');
                        }
                    }
                }
            }
            catch { }
            return null;
        }

        public static void CheckForUpdateAndPrompt(string installDir, bool silentWhenUpToDate)
        {
            string latest = FetchLatestReleaseVersion();
            if (string.IsNullOrEmpty(latest))
            {
                if (!silentWhenUpToDate)
                {
                    MessageBox.Show("Could not reach GitHub Releases. Please check your internet connection.", "Update Check", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                return;
            }

            if (CompareVersions(latest, AppVersion) <= 0)
            {
                if (!silentWhenUpToDate)
                {
                    MessageBox.Show("BorngreatAccounting is up to date (v" + AppVersion + ").", "No Updates Available", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                return;
            }

            string skipFile = Path.Combine(installDir, "skipped-version.txt");
            if (silentWhenUpToDate && File.Exists(skipFile))
            {
                string skipped = File.ReadAllText(skipFile).Trim().TrimStart('v', 'V');
                if (string.Equals(skipped, latest, StringComparison.OrdinalIgnoreCase)) return;
            }

            DialogResult choice = MessageBox.Show(
                "A new version of BorngreatAccounting (v" + latest + ") is available!\r\n" +
                "You are currently running v" + AppVersion + ".\r\n\r\n" +
                "Yes    = Update Now (download & run installer)\r\n" +
                "No     = Skip This Version\r\n" +
                "Cancel = Remind Me Later",
                "BorngreatAccounting Update Available",
                MessageBoxButtons.YesNoCancel,
                MessageBoxIcon.Information
            );

            if (choice == DialogResult.No)
            {
                try { File.WriteAllText(skipFile, latest, Encoding.UTF8); } catch { }
                return;
            }

            if (choice == DialogResult.Yes)
            {
                try
                {
                    string tmpInstaller = Path.Combine(Path.GetTempPath(), "BorngreatAccounting-Setup-" + latest + ".exe");
                    using (WebClient wc = new WebClient())
                    {
                        wc.Headers.Add("User-Agent", "BorngreatAccounting-Updater/1.0");
                        wc.DownloadFile(LatestInstallerUrl, tmpInstaller);
                    }
                    Process.Start(new ProcessStartInfo { FileName = tmpInstaller, UseShellExecute = true });
                }
                catch (Exception ex)
                {
                    MessageBox.Show("Failed to download update: " + ex.Message, "Update Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
        }

        public static bool IsAdministrator()
        {
            using (WindowsIdentity identity = WindowsIdentity.GetCurrent())
            {
                WindowsPrincipal principal = new WindowsPrincipal(identity);
                return principal.IsInRole(WindowsBuiltInRole.Administrator);
            }
        }

        public static bool RequiresElevation(string path)
        {
            try
            {
                string full = Path.GetFullPath(path).TrimEnd('\\', '/');
                string progFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
                string progFilesX86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
                string winDir = Environment.GetFolderPath(Environment.SpecialFolder.Windows);
                return full.StartsWith(progFiles, StringComparison.OrdinalIgnoreCase) ||
                       (!string.IsNullOrEmpty(progFilesX86) && full.StartsWith(progFilesX86, StringComparison.OrdinalIgnoreCase)) ||
                       full.StartsWith(winDir, StringComparison.OrdinalIgnoreCase);
            }
            catch
            {
                return false;
            }
        }

        public static string GetLanUrl(int port)
        {
            try
            {
                foreach (NetworkInterface ni in NetworkInterface.GetAllNetworkInterfaces())
                {
                    if (ni.OperationalStatus != OperationalStatus.Up) continue;
                    if (ni.NetworkInterfaceType == NetworkInterfaceType.Loopback) continue;
                    IPInterfaceProperties props = ni.GetIPProperties();
                    foreach (UnicastIPAddressInformation addr in props.UnicastAddresses)
                    {
                        if (addr.Address.AddressFamily == AddressFamily.InterNetwork)
                        {
                            string ip = addr.Address.ToString();
                            if (!ip.StartsWith("127.") && !ip.StartsWith("169.254."))
                            {
                                return "http://" + ip + ":" + port;
                            }
                        }
                    }
                }
            }
            catch { }
            return "http://localhost:" + port;
        }

        public static void OpenInAppWindow(string url)
        {
            string[] browserCandidates = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe")
            };

            foreach (string browser in browserCandidates)
            {
                if (File.Exists(browser))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = browser,
                        Arguments = "--app=\"" + url + "\"",
                        UseShellExecute = true
                    });
                    return;
                }
            }

            Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
        }

        public static string ReadJsonValue(string filePath, string key)
        {
            try
            {
                if (!File.Exists(filePath)) return null;
                string text = File.ReadAllText(filePath, Encoding.UTF8);
                string pattern = "\"" + key + "\"";
                int idx = text.IndexOf(pattern, StringComparison.OrdinalIgnoreCase);
                if (idx < 0) return null;
                int colon = text.IndexOf(':', idx + pattern.Length);
                if (colon < 0) return null;
                int q1 = text.IndexOf('"', colon + 1);
                if (q1 < 0) return null;
                int q2 = text.IndexOf('"', q1 + 1);
                if (q2 < 0) return null;
                return text.Substring(q1 + 1, q2 - q1 - 1);
            }
            catch
            {
                return null;
            }
        }

        public static void WriteConfigJson(string filePath, string mode, string serverUrl)
        {
            string escapedUrl = (serverUrl ?? "").Replace("\\", "\\\\").Replace("\"", "\\\"");
            string content = "{\r\n  \"mode\": \"" + mode + "\",\r\n  \"serverUrl\": \"" + escapedUrl + "\"\r\n}\r\n";
            File.WriteAllText(filePath, content, Encoding.UTF8);
        }

        public static bool IsPortListening(int port)
        {
            try
            {
                using (TcpClient client = new TcpClient())
                {
                    IAsyncResult res = client.BeginConnect("127.0.0.1", port, null, null);
                    bool ok = res.AsyncWaitHandle.WaitOne(TimeSpan.FromMilliseconds(350));
                    if (ok && client.Connected)
                    {
                        client.EndConnect(res);
                        return true;
                    }
                }
            }
            catch { }
            return false;
        }

        public static int RunPowerShell(string arguments, string workingDir, Action<string> onLog)
        {
            ProcessStartInfo psi = new ProcessStartInfo("powershell.exe", arguments)
            {
                WorkingDirectory = string.IsNullOrEmpty(workingDir) ? Environment.CurrentDirectory : workingDir,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using (Process proc = new Process())
            {
                proc.StartInfo = psi;
                proc.OutputDataReceived += (s, e) => { if (!string.IsNullOrEmpty(e.Data) && onLog != null) onLog(e.Data); };
                proc.ErrorDataReceived += (s, e) => { if (!string.IsNullOrEmpty(e.Data) && onLog != null) onLog(e.Data); };
                proc.Start();
                proc.BeginOutputReadLine();
                proc.BeginErrorReadLine();
                proc.WaitForExit();
                return proc.ExitCode;
            }
        }
    }

    public class SetupWizardForm : Form
    {
        private int currentPage = 0;
        private readonly Panel contentPanel;
        private readonly Button btnBack;
        private readonly Button btnNext;
        private readonly Button btnCancel;
        private readonly Label lblBannerTitle;
        private readonly Label lblBannerSub;

        // Page 1: License
        private CheckBox chkAgree;

        // Page 2: Mode
        private RadioButton rbSingle;
        private RadioButton rbServer;
        private RadioButton rbClient;
        private Panel pnlClientUrl;
        private TextBox txtServerUrl;
        private Button btnTestConn;
        private Label lblConnStatus;

        // Page 3: Destination
        private TextBox txtInstallDir;
        private Button btnBrowse;
        private Label lblElevationNote;

        // Page 4: Installing
        private ProgressBar progressBar;
        private Label lblInstallStatus;
        private TextBox txtDetails;
        private Button btnToggleDetails;

        // Page 5: Finish
        private Label lblFinishSummary;
        private Panel pnlLanShare;
        private TextBox txtLanShareUrl;
        private CheckBox chkLaunchNow;

        private InstallMode selectedMode = InstallMode.Single;
        private string selectedDir;
        private string selectedServerUrl = "http://192.168.1.100:4100";
        private bool installSucceeded = false;

        public SetupWizardForm(bool autoStartInstall, InstallMode initialMode, string initialDir, string initialServer)
        {
            selectedMode = initialMode;
            selectedDir = string.IsNullOrEmpty(initialDir)
                ? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), AppHelper.AppName)
                : initialDir;
            if (!string.IsNullOrEmpty(initialServer))
            {
                selectedServerUrl = initialServer;
            }

            this.Text = "BorngreatAccounting Setup Wizard (v" + AppHelper.AppVersion + ")";
            this.Size = new Size(640, 490);
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.StartPosition = FormStartPosition.CenterScreen;
            try { this.Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }

            Panel banner = new Panel
            {
                Dock = DockStyle.Top,
                Height = 68,
                BackColor = Color.FromArgb(15, 23, 42)
            };

            PictureBox iconBox = new PictureBox
            {
                Size = new Size(40, 40),
                Location = new Point(18, 14),
                SizeMode = PictureBoxSizeMode.StretchImage
            };
            try { iconBox.Image = Icon.ExtractAssociatedIcon(Application.ExecutablePath).ToBitmap(); } catch { }

            lblBannerTitle = new Label
            {
                Text = "Welcome to BorngreatAccounting Setup",
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 12, FontStyle.Bold),
                AutoSize = true,
                Location = new Point(70, 12)
            };

            lblBannerSub = new Label
            {
                Text = "Multi-Tenant Accounting, Inventory, POS & Financial Reporting Suite",
                ForeColor = Color.FromArgb(203, 213, 225),
                Font = new Font("Segoe UI", 9),
                AutoSize = true,
                Location = new Point(70, 38)
            };

            banner.Controls.Add(iconBox);
            banner.Controls.Add(lblBannerTitle);
            banner.Controls.Add(lblBannerSub);

            Panel footer = new Panel
            {
                Dock = DockStyle.Bottom,
                Height = 56,
                BackColor = Color.FromArgb(241, 245, 249)
            };
            Panel divider = new Panel { Dock = DockStyle.Top, Height = 1, BackColor = Color.FromArgb(203, 213, 225) };
            footer.Controls.Add(divider);

            btnBack = new Button { Text = "< Back", Size = new Size(88, 30), Location = new Point(332, 13) };
            btnNext = new Button { Text = "Next >", Size = new Size(92, 30), Location = new Point(426, 13), BackColor = Color.FromArgb(37, 99, 235), ForeColor = Color.White, FlatStyle = FlatStyle.Flat };
            btnCancel = new Button { Text = "Cancel", Size = new Size(88, 30), Location = new Point(526, 13) };

            btnBack.Click += (s, e) => ShowPage(currentPage - 1);
            btnNext.Click += OnNextClicked;
            btnCancel.Click += (s, e) => this.Close();

            footer.Controls.Add(btnBack);
            footer.Controls.Add(btnNext);
            footer.Controls.Add(btnCancel);

            contentPanel = new Panel
            {
                Dock = DockStyle.Fill,
                BackColor = Color.White,
                Padding = new Padding(24, 20, 24, 12)
            };

            this.Controls.Add(contentPanel);
            this.Controls.Add(footer);
            this.Controls.Add(banner);

            if (autoStartInstall)
            {
                ShowPage(4);
                StartInstallation();
            }
            else
            {
                ShowPage(0);
            }
        }

        private void ShowPage(int pageIndex)
        {
            currentPage = pageIndex;
            contentPanel.Controls.Clear();
            btnBack.Enabled = pageIndex > 0 && pageIndex < 4;
            btnNext.Enabled = true;
            btnCancel.Enabled = pageIndex < 5;

            switch (pageIndex)
            {
                case 0:
                    BuildWelcomePage();
                    break;
                case 1:
                    BuildLicensePage();
                    break;
                case 2:
                    BuildModePage();
                    break;
                case 3:
                    BuildFolderPage();
                    break;
                case 4:
                    BuildInstallPage();
                    break;
                case 5:
                    BuildFinishPage();
                    break;
            }
        }

        private void BuildWelcomePage()
        {
            lblBannerTitle.Text = "Welcome to BorngreatAccounting Setup";
            lblBannerSub.Text = "Version " + AppHelper.AppVersion + " — Windows Desktop Installer";
            btnNext.Text = "Next >";

            Label title = new Label
            {
                Text = "Welcome to the BorngreatAccounting Setup Wizard",
                Font = new Font("Segoe UI", 12, FontStyle.Bold),
                AutoSize = true,
                Location = new Point(24, 22)
            };

            Label body = new Label
            {
                Text = "This wizard will install BorngreatAccounting (BtAccounting) on your computer.\r\n\r\n" +
                       "You can choose how to set up this computer:\r\n" +
                       "  • Single User (Standalone): Run everything privately on this PC.\r\n" +
                       "  • Multi-User Server: Host BorngreatAccounting and its database on your local network so other PCs can connect.\r\n" +
                       "  • Client Workstation: Connect directly to an existing BorngreatAccounting Server on your network.\r\n\r\n" +
                       "Click Next to continue.",
                Font = new Font("Segoe UI", 9.5f),
                Size = new Size(570, 240),
                Location = new Point(24, 62)
            };

            contentPanel.Controls.Add(title);
            contentPanel.Controls.Add(body);
        }

        private void BuildLicensePage()
        {
            lblBannerTitle.Text = "License Agreement";
            lblBannerSub.Text = "Please review the license terms before installing BorngreatAccounting.";
            btnNext.Text = "Next >";

            TextBox txtLicense = new TextBox
            {
                Multiline = true,
                ReadOnly = true,
                ScrollBars = ScrollBars.Vertical,
                Font = new Font("Consolas", 8.5f),
                Location = new Point(24, 18),
                Size = new Size(572, 235),
                Text = "GNU AFFERO GENERAL PUBLIC LICENSE (AGPL-3.0)\r\n" +
                       "BorngreatAccounting (BtAccounting)\r\n" +
                       "Copyright (c) Peter Borngreat-Mensah\r\n\r\n" +
                       "This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.\r\n\r\n" +
                       "This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.\r\n\r\n" +
                       "Full license text is included in the LICENSE file of the installation directory."
            };

            chkAgree = new CheckBox
            {
                Text = "I Agree — I accept the terms of the GNU AGPL-3.0 License Agreement",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                AutoSize = true,
                Location = new Point(24, 268)
            };
            chkAgree.CheckedChanged += (s, e) => { btnNext.Enabled = chkAgree.Checked; };
            btnNext.Enabled = false;

            contentPanel.Controls.Add(txtLicense);
            contentPanel.Controls.Add(chkAgree);
        }

        private void BuildModePage()
        {
            lblBannerTitle.Text = "Select Installation Type";
            lblBannerSub.Text = "Choose Single User, Multi-User Server, or Client Workstation.";
            btnNext.Text = "Next >";

            rbSingle = new RadioButton
            {
                Text = "Single User (Standalone)",
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                AutoSize = true,
                Location = new Point(24, 18),
                Checked = selectedMode == InstallMode.Single
            };
            Label lblSingleDesc = new Label
            {
                Text = "Installs the full database and application on this computer only (http://localhost:4100).",
                Font = new Font("Segoe UI", 8.8f),
                ForeColor = Color.FromArgb(71, 85, 105),
                AutoSize = true,
                Location = new Point(44, 42)
            };

            rbServer = new RadioButton
            {
                Text = "Multi-User Server (Host on Local Network)",
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                AutoSize = true,
                Location = new Point(24, 74),
                Checked = selectedMode == InstallMode.Server
            };
            Label lblServerDesc = new Label
            {
                Text = "Installs the full stack and opens LAN access + Firewall port 4100 so other PCs share this database.",
                Font = new Font("Segoe UI", 8.8f),
                ForeColor = Color.FromArgb(71, 85, 105),
                AutoSize = true,
                Location = new Point(44, 98)
            };

            rbClient = new RadioButton
            {
                Text = "Client Workstation (Join Existing Server)",
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                AutoSize = true,
                Location = new Point(24, 130),
                Checked = selectedMode == InstallMode.Client
            };
            Label lblClientDesc = new Label
            {
                Text = "Lightweight client only. Connects to a Multi-User Server on your network without a local database.",
                Font = new Font("Segoe UI", 8.8f),
                ForeColor = Color.FromArgb(71, 85, 105),
                AutoSize = true,
                Location = new Point(44, 154)
            };

            pnlClientUrl = new Panel
            {
                Location = new Point(44, 184),
                Size = new Size(540, 88),
                BackColor = Color.FromArgb(248, 250, 252),
                BorderStyle = BorderStyle.FixedSingle,
                Enabled = selectedMode == InstallMode.Client
            };

            Label lblUrl = new Label
            {
                Text = "Server URL (from the Multi-User Server PC):",
                Font = new Font("Segoe UI", 9, FontStyle.Bold),
                AutoSize = true,
                Location = new Point(12, 10)
            };

            txtServerUrl = new TextBox
            {
                Text = selectedServerUrl,
                Font = new Font("Segoe UI", 9.5f),
                Location = new Point(12, 34),
                Size = new Size(370, 25)
            };

            btnTestConn = new Button
            {
                Text = "Test Connection",
                Size = new Size(125, 27),
                Location = new Point(394, 33)
            };
            btnTestConn.Click += OnTestConnection;

            lblConnStatus = new Label
            {
                Text = "Example: http://192.168.1.50:4100",
                Font = new Font("Segoe UI", 8.5f),
                ForeColor = Color.FromArgb(100, 116, 139),
                AutoSize = true,
                Location = new Point(12, 64)
            };

            pnlClientUrl.Controls.Add(lblUrl);
            pnlClientUrl.Controls.Add(txtServerUrl);
            pnlClientUrl.Controls.Add(btnTestConn);
            pnlClientUrl.Controls.Add(lblConnStatus);

            EventHandler modeChanged = (s, e) =>
            {
                if (rbSingle.Checked) selectedMode = InstallMode.Single;
                else if (rbServer.Checked) selectedMode = InstallMode.Server;
                else if (rbClient.Checked) selectedMode = InstallMode.Client;
                pnlClientUrl.Enabled = (selectedMode == InstallMode.Client);
            };
            rbSingle.CheckedChanged += modeChanged;
            rbServer.CheckedChanged += modeChanged;
            rbClient.CheckedChanged += modeChanged;

            contentPanel.Controls.Add(rbSingle);
            contentPanel.Controls.Add(lblSingleDesc);
            contentPanel.Controls.Add(rbServer);
            contentPanel.Controls.Add(lblServerDesc);
            contentPanel.Controls.Add(rbClient);
            contentPanel.Controls.Add(lblClientDesc);
            contentPanel.Controls.Add(pnlClientUrl);
        }

        private void OnTestConnection(object sender, EventArgs e)
        {
            string url = txtServerUrl.Text.Trim().TrimEnd('/');
            lblConnStatus.ForeColor = Color.FromArgb(37, 99, 235);
            lblConnStatus.Text = "Testing connection to " + url + "...";
            btnTestConn.Enabled = false;

            Task.Run(() =>
            {
                string msg;
                Color color;
                try
                {
                    ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
                    HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url + "/api/system_db");
                    req.Timeout = 4000;
                    using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                    {
                        msg = "Connected! Server responded (" + (int)resp.StatusCode + ").";
                        color = Color.FromArgb(22, 163, 74);
                    }
                }
                catch (Exception ex)
                {
                    msg = "Could not reach server: " + ex.Message;
                    color = Color.FromArgb(220, 38, 38);
                }

                this.BeginInvoke((Action)(() =>
                {
                    lblConnStatus.ForeColor = color;
                    lblConnStatus.Text = msg;
                    btnTestConn.Enabled = true;
                }));
            });
        }

        private void BuildFolderPage()
        {
            lblBannerTitle.Text = "Choose Install Location";
            lblBannerSub.Text = "Choose the folder in which to install BorngreatAccounting.";
            btnNext.Text = "Install";

            Label lblIntro = new Label
            {
                Text = "Setup will install BorngreatAccounting in the following folder.\r\n" +
                       "To install in a different folder, click Browse and select another folder.",
                Font = new Font("Segoe UI", 9.5f),
                AutoSize = true,
                Location = new Point(24, 24)
            };

            Label lblDest = new Label
            {
                Text = "Destination Folder:",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                AutoSize = true,
                Location = new Point(24, 82)
            };

            txtInstallDir = new TextBox
            {
                Text = selectedDir,
                Font = new Font("Segoe UI", 9.5f),
                Location = new Point(24, 108),
                Size = new Size(468, 26)
            };

            btnBrowse = new Button
            {
                Text = "Browse...",
                Size = new Size(92, 28),
                Location = new Point(502, 107)
            };
            btnBrowse.Click += (s, e) =>
            {
                using (FolderBrowserDialog fbd = new FolderBrowserDialog())
                {
                    fbd.SelectedPath = txtInstallDir.Text;
                    if (fbd.ShowDialog() == DialogResult.OK)
                    {
                        txtInstallDir.Text = Path.Combine(fbd.SelectedPath, AppHelper.AppName);
                    }
                }
            };

            lblElevationNote = new Label
            {
                Text = "Note: Installing into Program Files will prompt for Windows Administrator permission.\r\n" +
                       "Desktop and Start Menu shortcuts will be created automatically.",
                Font = new Font("Segoe UI", 8.8f),
                ForeColor = Color.FromArgb(71, 85, 105),
                AutoSize = true,
                Location = new Point(24, 160)
            };

            contentPanel.Controls.Add(lblIntro);
            contentPanel.Controls.Add(lblDest);
            contentPanel.Controls.Add(txtInstallDir);
            contentPanel.Controls.Add(btnBrowse);
            contentPanel.Controls.Add(lblElevationNote);
        }

        private void BuildInstallPage()
        {
            lblBannerTitle.Text = "Installing BorngreatAccounting";
            lblBannerSub.Text = "Please wait while BorngreatAccounting is being installed...";
            btnBack.Enabled = false;
            btnNext.Enabled = false;
            btnCancel.Enabled = false;
            btnNext.Text = "Next >";

            lblInstallStatus = new Label
            {
                Text = "Preparing installation...",
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold),
                AutoSize = true,
                Location = new Point(24, 24)
            };

            progressBar = new ProgressBar
            {
                Location = new Point(24, 54),
                Size = new Size(572, 24),
                Minimum = 0,
                Maximum = 100,
                Value = 5
            };

            btnToggleDetails = new Button
            {
                Text = "Hide details",
                Size = new Size(100, 26),
                Location = new Point(24, 90)
            };

            txtDetails = new TextBox
            {
                Multiline = true,
                ReadOnly = true,
                ScrollBars = ScrollBars.Vertical,
                BackColor = Color.FromArgb(15, 23, 42),
                ForeColor = Color.FromArgb(226, 232, 240),
                Font = new Font("Consolas", 8.5f),
                Location = new Point(24, 124),
                Size = new Size(572, 175)
            };

            btnToggleDetails.Click += (s, e) =>
            {
                txtDetails.Visible = !txtDetails.Visible;
                btnToggleDetails.Text = txtDetails.Visible ? "Hide details" : "Show details";
            };

            contentPanel.Controls.Add(lblInstallStatus);
            contentPanel.Controls.Add(progressBar);
            contentPanel.Controls.Add(btnToggleDetails);
            contentPanel.Controls.Add(txtDetails);
        }

        private void BuildFinishPage()
        {
            lblBannerTitle.Text = installSucceeded ? "Completing BorngreatAccounting Setup" : "Installation Incomplete";
            lblBannerSub.Text = installSucceeded
                ? "BorngreatAccounting has been installed on your computer."
                : "Please review the installation log for details.";
            btnBack.Enabled = false;
            btnCancel.Enabled = false;
            btnNext.Enabled = true;
            btnNext.Text = "Finish";

            lblFinishSummary = new Label
            {
                Font = new Font("Segoe UI", 9.5f),
                Size = new Size(572, 110),
                Location = new Point(24, 22),
                Text = installSucceeded
                    ? "BorngreatAccounting has been installed to:\r\n" + selectedDir + "\r\n\r\n" +
                      "Shortcuts have been added to your Desktop and Start Menu."
                    : "The installation encountered an error. You can retry from the Control Center or check logs."
            };
            contentPanel.Controls.Add(lblFinishSummary);

            int nextY = 140;
            if (installSucceeded && selectedMode == InstallMode.Server)
            {
                string lanUrl = AppHelper.GetLanUrl(4100);
                pnlLanShare = new Panel
                {
                    Location = new Point(24, nextY),
                    Size = new Size(572, 76),
                    BackColor = Color.FromArgb(239, 246, 255),
                    BorderStyle = BorderStyle.FixedSingle
                };
                Label lblShare = new Label
                {
                    Text = "Share this Server URL with Client PCs on the same network:",
                    Font = new Font("Segoe UI", 9, FontStyle.Bold),
                    AutoSize = true,
                    Location = new Point(10, 10)
                };
                txtLanShareUrl = new TextBox
                {
                    Text = lanUrl,
                    ReadOnly = true,
                    Font = new Font("Consolas", 10, FontStyle.Bold),
                    Location = new Point(10, 36),
                    Size = new Size(440, 26)
                };
                Button btnCopy = new Button
                {
                    Text = "Copy URL",
                    Size = new Size(96, 27),
                    Location = new Point(460, 35)
                };
                btnCopy.Click += (s, e) =>
                {
                    Clipboard.SetText(txtLanShareUrl.Text);
                    btnCopy.Text = "Copied!";
                };
                pnlLanShare.Controls.Add(lblShare);
                pnlLanShare.Controls.Add(txtLanShareUrl);
                pnlLanShare.Controls.Add(btnCopy);
                contentPanel.Controls.Add(pnlLanShare);
                nextY += 90;
            }

            chkLaunchNow = new CheckBox
            {
                Text = "Launch BorngreatAccounting now",
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                AutoSize = true,
                Checked = installSucceeded,
                Visible = installSucceeded,
                Location = new Point(24, nextY)
            };
            contentPanel.Controls.Add(chkLaunchNow);
        }

        private void OnNextClicked(object sender, EventArgs e)
        {
            if (currentPage == 2)
            {
                if (selectedMode == InstallMode.Client)
                {
                    string url = txtServerUrl.Text.Trim().TrimEnd('/');
                    if (string.IsNullOrEmpty(url) || (!url.StartsWith("http://") && !url.StartsWith("https://")))
                    {
                        MessageBox.Show("Please enter a valid Server URL starting with http:// or https://", "Invalid Server URL", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                        return;
                    }
                    selectedServerUrl = url;
                }
                ShowPage(3);
                return;
            }

            if (currentPage == 3)
            {
                selectedDir = txtInstallDir.Text.Trim();
                if (string.IsNullOrEmpty(selectedDir))
                {
                    MessageBox.Show("Please select a destination folder.", "Destination Required", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }

                if (AppHelper.RequiresElevation(selectedDir) && !AppHelper.IsAdministrator())
                {
                    try
                    {
                        string modeArg = selectedMode.ToString().ToLowerInvariant();
                        string args = "--install --mode " + modeArg + " --dir \"" + selectedDir + "\" --server \"" + selectedServerUrl + "\"";
                        Process.Start(new ProcessStartInfo
                        {
                            FileName = Application.ExecutablePath,
                            Arguments = args,
                            Verb = "runas",
                            UseShellExecute = true
                        });
                        Application.Exit();
                        return;
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show("Administrator permission was cancelled or failed: " + ex.Message, "Elevation Required", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                        return;
                    }
                }

                ShowPage(4);
                StartInstallation();
                return;
            }

            if (currentPage == 5)
            {
                if (installSucceeded && chkLaunchNow != null && chkLaunchNow.Checked)
                {
                    string installedExe = Path.Combine(selectedDir, "BorngreatAccounting-Setup.exe");
                    if (File.Exists(installedExe))
                    {
                        Process.Start(new ProcessStartInfo
                        {
                            FileName = installedExe,
                            Arguments = "--launch",
                            UseShellExecute = true
                        });
                    }
                }
                Application.Exit();
                return;
            }

            ShowPage(currentPage + 1);
        }

        private void UpdateInstallUI(int percent, string status, string logLine)
        {
            if (this.InvokeRequired)
            {
                this.BeginInvoke((Action)(() => UpdateInstallUI(percent, status, logLine)));
                return;
            }
            if (percent >= 0 && percent <= 100 && progressBar != null) progressBar.Value = percent;
            if (!string.IsNullOrEmpty(status) && lblInstallStatus != null) lblInstallStatus.Text = status;
            if (!string.IsNullOrEmpty(logLine) && txtDetails != null)
            {
                txtDetails.AppendText(logLine + Environment.NewLine);
            }
        }

        private void StartInstallation()
        {
            Task.Run(() =>
            {
                try
                {
                    Directory.CreateDirectory(selectedDir);
                    string installedExe = Path.Combine(selectedDir, "BorngreatAccounting-Setup.exe");
                    if (!string.Equals(Path.GetFullPath(Application.ExecutablePath), Path.GetFullPath(installedExe), StringComparison.OrdinalIgnoreCase))
                    {
                        File.Copy(Application.ExecutablePath, installedExe, true);
                    }

                    if (selectedMode == InstallMode.Client)
                    {
                        UpdateInstallUI(35, "Saving Client Workstation configuration...", "Mode: Client Workstation -> " + selectedServerUrl);
                        AppHelper.WriteConfigJson(Path.Combine(selectedDir, "client-config.json"), "client", selectedServerUrl);

                        UpdateInstallUI(75, "Creating Desktop & Start Menu shortcuts...", "Registering shortcuts and Windows Uninstall entry...");
                        CreateShortcutsAndUninstall(installedExe, "client");

                        UpdateInstallUI(100, "Client installation complete!", "Ready to connect to " + selectedServerUrl);
                        installSucceeded = true;
                    }
                    else
                    {
                        string appDir = Path.Combine(selectedDir, "app");
                        string modeStr = selectedMode == InstallMode.Server ? "server" : "single";
                        AppHelper.WriteConfigJson(Path.Combine(selectedDir, "install-config.json"), modeStr, "http://localhost:4100");

                        string scriptPath = Path.Combine(appDir, "scripts", "windows-runtime.ps1");
                        if (!File.Exists(scriptPath))
                        {
                            UpdateInstallUI(15, "Downloading BorngreatAccounting from GitHub...", "Downloading release archive to " + appDir);
                            string psDownload = string.Join("; ", new string[]
                            {
                                "$ErrorActionPreference = 'Stop'",
                                "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12",
                                "$tmp = Join-Path $env:TEMP ('bga-setup-' + [guid]::NewGuid().ToString('N'))",
                                "New-Item -ItemType Directory -Force -Path $tmp | Out-Null",
                                "$zip = Join-Path $tmp 'repo.zip'",
                                "Invoke-WebRequest -Uri 'https://github.com/PipetteGh/borngreataccounting/archive/refs/heads/main.zip' -OutFile $zip -UseBasicParsing",
                                "Expand-Archive -Path $zip -DestinationPath $tmp -Force",
                                "$src = Get-ChildItem -Path $tmp -Directory | Where-Object { $_.Name -like 'borngreataccounting*' } | Select-Object -First 1",
                                "if (-not $src) { throw 'Extracted archive folder not found.' }",
                                "$dest = '" + appDir.Replace("'", "''") + "'",
                                "if (Test-Path $dest) { Remove-Item -Path $dest -Recurse -Force }",
                                "Move-Item -Path $src.FullName -Destination $dest",
                                "Remove-Item -Path $tmp -Recurse -Force -ErrorAction SilentlyContinue"
                            });
                            int dlCode = AppHelper.RunPowerShell("-NoProfile -ExecutionPolicy Bypass -Command \"" + psDownload.Replace("\"", "\\\"") + "\"", selectedDir, line => UpdateInstallUI(-1, null, line));
                            if (dlCode != 0 || !File.Exists(scriptPath))
                            {
                                throw new Exception("Failed to download or extract BorngreatAccounting archive.");
                            }
                        }

                        UpdateInstallUI(45, "Installing Node.js, MariaDB, Redis & building app (first run may take a few minutes)...", "Running windows-runtime.ps1 -Action install -Mode " + modeStr);
                        int instCode = AppHelper.RunPowerShell(
                            "-NoProfile -ExecutionPolicy Bypass -File \"" + scriptPath + "\" -Action install -Mode " + modeStr,
                            appDir,
                            line => UpdateInstallUI(-1, null, line)
                        );
                        if (instCode != 0)
                        {
                            throw new Exception("Runtime installation returned exit code " + instCode);
                        }

                        UpdateInstallUI(82, "Starting BorngreatAccounting services...", "Starting MariaDB, Redis, API Server (:3000), and Web Gateway (:4100)...");
                        AppHelper.RunPowerShell(
                            "-NoProfile -ExecutionPolicy Bypass -File \"" + scriptPath + "\" -Action start -Mode " + modeStr,
                            appDir,
                            line => UpdateInstallUI(-1, null, line)
                        );

                        UpdateInstallUI(95, "Creating Desktop & Start Menu shortcuts...", "Registering shortcuts and Windows Uninstall entry...");
                        CreateShortcutsAndUninstall(installedExe, modeStr);

                        UpdateInstallUI(100, "Installation complete!", "BorngreatAccounting is ready.");
                        installSucceeded = true;
                    }
                }
                catch (Exception ex)
                {
                    installSucceeded = false;
                    UpdateInstallUI(100, "Installation failed.", "ERROR: " + ex.Message);
                }

                this.BeginInvoke((Action)(() => ShowPage(5)));
            });
        }

        private void CreateShortcutsAndUninstall(string installedExe, string modeStr)
        {
            string psShortcuts = string.Join("; ", new string[]
            {
                "$ws = New-Object -ComObject WScript.Shell",
                "$desktop = [Environment]::GetFolderPath('Desktop')",
                "$sc1 = $ws.CreateShortcut((Join-Path $desktop 'BorngreatAccounting.lnk'))",
                "$sc1.TargetPath = '" + installedExe.Replace("'", "''") + "'",
                "$sc1.Arguments = '--launch'",
                "$sc1.WorkingDirectory = '" + selectedDir.Replace("'", "''") + "'",
                "$sc1.Description = 'Launch BorngreatAccounting'",
                "$sc1.Save()",
                "$menuDir = Join-Path ([Environment]::GetFolderPath('Programs')) 'BorngreatAccounting'",
                "New-Item -ItemType Directory -Force -Path $menuDir | Out-Null",
                "$sc2 = $ws.CreateShortcut((Join-Path $menuDir 'BorngreatAccounting.lnk'))",
                "$sc2.TargetPath = '" + installedExe.Replace("'", "''") + "'",
                "$sc2.Arguments = '--launch'",
                "$sc2.WorkingDirectory = '" + selectedDir.Replace("'", "''") + "'",
                "$sc2.Save()",
                "$sc3 = $ws.CreateShortcut((Join-Path $menuDir 'BorngreatAccounting Control Center.lnk'))",
                "$sc3.TargetPath = '" + installedExe.Replace("'", "''") + "'",
                "$sc3.Arguments = '--control-center'",
                "$sc3.WorkingDirectory = '" + selectedDir.Replace("'", "''") + "'",
                "$sc3.Save()",
                "$sc4 = $ws.CreateShortcut((Join-Path $menuDir 'Uninstall BorngreatAccounting.lnk'))",
                "$sc4.TargetPath = '" + installedExe.Replace("'", "''") + "'",
                "$sc4.Arguments = '--uninstall'",
                "$sc4.WorkingDirectory = '" + selectedDir.Replace("'", "''") + "'",
                "$sc4.Save()"
            });
            AppHelper.RunPowerShell("-NoProfile -ExecutionPolicy Bypass -Command \"" + psShortcuts.Replace("\"", "\\\"") + "\"", selectedDir, null);

            try
            {
                RegistryKey rootKey = AppHelper.IsAdministrator() ? Registry.LocalMachine : Registry.CurrentUser;
                using (RegistryKey key = rootKey.CreateSubKey(AppHelper.UninstallRegKey))
                {
                    key.SetValue("DisplayName", "BorngreatAccounting (" + modeStr + ")");
                    key.SetValue("DisplayVersion", AppHelper.AppVersion);
                    key.SetValue("Publisher", AppHelper.Publisher);
                    key.SetValue("InstallLocation", selectedDir);
                    key.SetValue("DisplayIcon", installedExe);
                    key.SetValue("UninstallString", "\"" + installedExe + "\" --uninstall");
                    key.SetValue("NoModify", 1, RegistryValueKind.DWord);
                    key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
                }
            }
            catch { }
        }
    }

    public class ControlCenterForm : Form
    {
        private readonly string installDir;
        private readonly string appDir;
        private readonly string mode;
        private readonly string serverUrl;
        private readonly TextBox logBox;

        public ControlCenterForm(string installDirectory)
        {
            installDir = installDirectory;
            appDir = Directory.Exists(Path.Combine(installDir, "app")) ? Path.Combine(installDir, "app") : installDir;

            string clientCfg = Path.Combine(installDir, "client-config.json");
            string serverCfg = Path.Combine(installDir, "install-config.json");
            if (File.Exists(clientCfg))
            {
                mode = "client";
                serverUrl = AppHelper.ReadJsonValue(clientCfg, "serverUrl") ?? "http://localhost:4100";
            }
            else if (File.Exists(serverCfg))
            {
                mode = AppHelper.ReadJsonValue(serverCfg, "mode") ?? "single";
                serverUrl = "http://localhost:4100";
            }
            else
            {
                mode = "single";
                serverUrl = "http://localhost:4100";
            }

            this.Text = "BorngreatAccounting Control Center (v" + AppHelper.AppVersion + ")";
            this.Size = new Size(760, 500);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(245, 247, 250);
            try { this.Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }

            Panel header = new Panel { Dock = DockStyle.Top, Height = 72, BackColor = Color.FromArgb(15, 23, 42), Padding = new Padding(16, 12, 16, 12) };
            Label title = new Label
            {
                Text = "BorngreatAccounting Control Center  [" + mode.ToUpperInvariant() + " MODE]",
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 13, FontStyle.Bold),
                AutoSize = true,
                Location = new Point(16, 12)
            };
            string subText = mode == "client"
                ? "Connected Server: " + serverUrl
                : (mode == "server" ? "Local: http://localhost:4100  |  Network LAN: " + AppHelper.GetLanUrl(4100) : "Local Standalone: http://localhost:4100");
            Label subtitle = new Label
            {
                Text = subText,
                ForeColor = Color.FromArgb(148, 163, 184),
                Font = new Font("Segoe UI", 9.5f),
                AutoSize = true,
                Location = new Point(16, 40)
            };
            header.Controls.Add(title);
            header.Controls.Add(subtitle);

            FlowLayoutPanel buttons = new FlowLayoutPanel
            {
                Dock = DockStyle.Top,
                Height = 52,
                Padding = new Padding(16, 10, 16, 8),
                BackColor = Color.White
            };

            Button btnOpen = CreateBtn("Open BorngreatAccounting", Color.FromArgb(15, 118, 110));
            btnOpen.Click += (s, e) => AppHelper.OpenInAppWindow(serverUrl);
            buttons.Controls.Add(btnOpen);

            Button btnUpdate = CreateBtn("Check Updates", Color.FromArgb(37, 99, 235));
            btnUpdate.Click += (s, e) => AppHelper.CheckForUpdateAndPrompt(installDir, false);
            buttons.Controls.Add(btnUpdate);

            if (mode != "client")
            {
                Button btnStart = CreateBtn("Start Services", Color.FromArgb(22, 163, 74));
                Button btnStop = CreateBtn("Stop Services", Color.FromArgb(220, 38, 38));
                Button btnRestart = CreateBtn("Restart", Color.FromArgb(217, 119, 6));
                Button btnStatus = CreateBtn("Status", Color.FromArgb(71, 85, 105));
                Button btnBackup = CreateBtn("Backup DB", Color.FromArgb(124, 58, 237));

                btnStart.Click += (s, e) => RunAction("start");
                btnStop.Click += (s, e) => RunAction("stop");
                btnRestart.Click += (s, e) => RunAction("restart");
                btnStatus.Click += (s, e) => RunAction("status");
                btnBackup.Click += (s, e) => RunAction("backup");

                buttons.Controls.Add(btnStart);
                buttons.Controls.Add(btnStop);
                buttons.Controls.Add(btnRestart);
                buttons.Controls.Add(btnStatus);
                buttons.Controls.Add(btnBackup);
            }

            logBox = new TextBox
            {
                Multiline = true,
                ReadOnly = true,
                ScrollBars = ScrollBars.Vertical,
                Dock = DockStyle.Fill,
                BackColor = Color.FromArgb(15, 23, 42),
                ForeColor = Color.FromArgb(226, 232, 240),
                Font = new Font("Consolas", 9.5f)
            };

            this.Controls.Add(logBox);
            this.Controls.Add(buttons);
            this.Controls.Add(header);

            AppendLog("Control Center ready (" + mode.ToUpperInvariant() + " mode).");
            AppendLog("Install Directory: " + installDir);
            if (mode == "server")
            {
                AppendLog("Clients on your network can connect to: " + AppHelper.GetLanUrl(4100));
            }
            else if (mode == "client")
            {
                AppendLog("Server URL: " + serverUrl);
            }
            this.Shown += (s, e) => Task.Run(() => AppHelper.CheckForUpdateAndPrompt(installDir, true));
        }

        private Button CreateBtn(string text, Color bg)
        {
            return new Button
            {
                Text = text,
                BackColor = bg,
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                AutoSize = true,
                Padding = new Padding(8, 4, 8, 4),
                Margin = new Padding(0, 0, 8, 0),
                Cursor = Cursors.Hand
            };
        }

        private void AppendLog(string msg)
        {
            if (this.InvokeRequired)
            {
                this.BeginInvoke((Action)(() => AppendLog(msg)));
                return;
            }
            logBox.AppendText(string.Format("[{0:HH:mm:ss}] {1}{2}", DateTime.Now, msg, Environment.NewLine));
        }

        private void RunAction(string action)
        {
            Task.Run(() =>
            {
                string scriptPath = Path.Combine(appDir, "scripts", "windows-runtime.ps1");
                if (!File.Exists(scriptPath))
                {
                    AppendLog("ERROR: windows-runtime.ps1 not found at " + scriptPath);
                    return;
                }
                AppendLog("Running '" + action + "'...");
                AppHelper.RunPowerShell("-NoProfile -ExecutionPolicy Bypass -File \"" + scriptPath + "\" -Action " + action + " -Mode " + mode, appDir, AppendLog);
            });
        }
    }

    public static class Program
    {
        [STAThread]
        public static int Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            List<string> argList = new List<string>(args ?? new string[0]);

            if (argList.Contains("--verify"))
            {
                Console.WriteLine("BorngreatAccounting (BtAccounting) Windows Setup & Control Center v" + AppHelper.AppVersion);
                Console.WriteLine("Publisher: " + AppHelper.Publisher);
                Console.WriteLine("License: GNU AGPL-3.0");
                Console.WriteLine("Status: VERIFIED_OK");
                return 0;
            }

            string baseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');

            if (argList.Contains("--launch"))
            {
                Task.Run(() => AppHelper.CheckForUpdateAndPrompt(baseDir, true));
                string clientCfg = Path.Combine(baseDir, "client-config.json");
                if (File.Exists(clientCfg))
                {
                    string url = AppHelper.ReadJsonValue(clientCfg, "serverUrl") ?? "http://localhost:4100";
                    AppHelper.OpenInAppWindow(url);
                    return 0;
                }

                string appDir = Directory.Exists(Path.Combine(baseDir, "app")) ? Path.Combine(baseDir, "app") : baseDir;
                string scriptPath = Path.Combine(appDir, "scripts", "windows-runtime.ps1");
                if (!AppHelper.IsPortListening(4100) && File.Exists(scriptPath))
                {
                    AppHelper.RunPowerShell("-NoProfile -ExecutionPolicy Bypass -File \"" + scriptPath + "\" -Action start", appDir, null);
                }
                AppHelper.OpenInAppWindow("http://localhost:4100");
                return 0;
            }

            if (argList.Contains("--uninstall"))
            {
                DialogResult res = MessageBox.Show(
                    "Are you sure you want to uninstall BorngreatAccounting from:\r\n" + baseDir + "?",
                    "Uninstall BorngreatAccounting",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Question
                );
                if (res != DialogResult.Yes) return 0;

                string appDir = Directory.Exists(Path.Combine(baseDir, "app")) ? Path.Combine(baseDir, "app") : baseDir;
                string scriptPath = Path.Combine(appDir, "scripts", "windows-runtime.ps1");
                if (File.Exists(scriptPath))
                {
                    AppHelper.RunPowerShell("-NoProfile -ExecutionPolicy Bypass -File \"" + scriptPath + "\" -Action stop", appDir, null);
                    AppHelper.RunPowerShell("-NoProfile -ExecutionPolicy Bypass -File \"" + scriptPath + "\" -Action disable-autostart", appDir, null);
                }

                string psCleanup = string.Join("; ", new string[]
                {
                    "try { netsh advfirewall firewall delete rule name='BorngreatAccounting Server (Port 4100)' | Out-Null } catch {}",
                    "$d = Join-Path ([Environment]::GetFolderPath('Desktop')) 'BorngreatAccounting.lnk'; if (Test-Path $d) { Remove-Item $d -Force }",
                    "$m = Join-Path ([Environment]::GetFolderPath('Programs')) 'BorngreatAccounting'; if (Test-Path $m) { Remove-Item $m -Recurse -Force }"
                });
                AppHelper.RunPowerShell("-NoProfile -ExecutionPolicy Bypass -Command \"" + psCleanup.Replace("\"", "\\\"") + "\"", baseDir, null);

                try { Registry.CurrentUser.DeleteSubKeyTree(AppHelper.UninstallRegKey, false); } catch { }
                try { Registry.LocalMachine.DeleteSubKeyTree(AppHelper.UninstallRegKey, false); } catch { }

                MessageBox.Show("BorngreatAccounting has been uninstalled.", "Uninstall Complete", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return 0;
            }

            if (argList.Contains("--control-center"))
            {
                Application.Run(new ControlCenterForm(baseDir));
                return 0;
            }

            bool autoInstall = argList.Contains("--install");
            if (!autoInstall && (File.Exists(Path.Combine(baseDir, "install-config.json")) || File.Exists(Path.Combine(baseDir, "client-config.json"))))
            {
                Application.Run(new ControlCenterForm(baseDir));
                return 0;
            }

            InstallMode mode = InstallMode.Single;
            string dir = null;
            string srv = null;
            for (int i = 0; i < argList.Count - 1; i++)
            {
                if (argList[i] == "--mode")
                {
                    string m = argList[i + 1].ToLowerInvariant();
                    if (m == "server") mode = InstallMode.Server;
                    else if (m == "client") mode = InstallMode.Client;
                    else mode = InstallMode.Single;
                }
                else if (argList[i] == "--dir") dir = argList[i + 1];
                else if (argList[i] == "--server") srv = argList[i + 1];
            }

            Application.Run(new SetupWizardForm(autoInstall, mode, dir, srv));
            return 0;
        }
    }
}
