; BorngreatAccounting (BtAccounting) Inno Setup 6 Script
; Builds a standalone Windows Installer (.exe) supporting:
;   - Single User (Standalone)
;   - Multi-User Server (LAN Host)
;   - Client Workstation (Join Existing Server)

#ifndef AppVersion
  #define AppVersion "1.0.4"
#endif

#define AppName "BorngreatAccounting"
#define AppPublisher "Borngreat (Peter Borngreat-Mensah)"
#define AppURL "https://github.com/PipetteGh/borngreataccounting"
#define AppExeName "BorngreatAccounting.exe"

[Setup]
AppId={{8D6B4F7A-9C2E-4A51-B3F4-7E91D2A4C001}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
AppSupportURL={#AppURL}
AppUpdatesURL={#AppURL}/releases
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
AllowNoIcons=yes
LicenseFile=..\..\LICENSE
OutputDir=..\..\dist\installers
OutputBaseFilename=BorngreatAccounting-Setup-{#AppVersion}
SetupIconFile=..\..\assets\branding\borngreataccounting.ico
UninstallDisplayIcon={app}\{#AppExeName}
Compression=lzma2/normal
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=dialog
DisableProgramGroupPage=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
; Always install the launcher / control center executable
Source: "..\..\dist\staging\BorngreatAccounting.exe"; DestDir: "{app}"; Flags: ignoreversion

; Only install server/app payload for Single User or Multi-User Server modes
Source: "..\..\dist\staging\app\*"; DestDir: "{app}\app"; Flags: ignoreversion recursesubdirs createallsubdirs; Check: IsServerOrSingleMode

[Icons]
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; Parameters: "--launch"; WorkingDir: "{app}"; Tasks: desktopicon
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExeName}"; Parameters: "--launch"; WorkingDir: "{app}"
Name: "{group}\{#AppName} Control Center"; Filename: "{app}\{#AppExeName}"; Parameters: "--control-center"; WorkingDir: "{app}"
Name: "{group}\Uninstall {#AppName}"; Filename: "{uninstallexe}"

[Run]
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\app\scripts\windows-runtime.ps1"" -Action install -Mode {code:GetInstallModeString}"; WorkingDir: "{app}\app"; StatusMsg: "Installing runtime dependencies (Node.js, MariaDB, Redis) and initializing database..."; Flags: runhidden waituntilterminated; Check: IsServerOrSingleMode
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\app\scripts\windows-runtime.ps1"" -Action start -Mode {code:GetInstallModeString}"; WorkingDir: "{app}\app"; StatusMsg: "Starting BorngreatAccounting services..."; Flags: runhidden waituntilterminated; Check: IsServerOrSingleMode
Filename: "{app}\{#AppExeName}"; Parameters: "--launch"; Description: "{cm:LaunchProgram,{#AppName}}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\app\scripts\windows-runtime.ps1"" -Action stop"; Flags: runhidden waituntilterminated; RunOnceId: "StopBGA"; Check: FileExists(ExpandConstant('{app}\app\scripts\windows-runtime.ps1'))
Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\app\scripts\windows-runtime.ps1"" -Action disable-autostart"; Flags: runhidden waituntilterminated; RunOnceId: "DisableAutostartBGA"; Check: FileExists(ExpandConstant('{app}\app\scripts\windows-runtime.ps1'))
Filename: "netsh.exe"; Parameters: "advfirewall firewall delete rule name=""BorngreatAccounting Server (Port 4100)"""; Flags: runhidden waituntilterminated; RunOnceId: "RemoveFirewallBGA"

[Code]
var
  ModePage: TWizardPage;
  rbSingle: TNewRadioButton;
  rbServer: TNewRadioButton;
  rbClient: TNewRadioButton;
  lblSingleDesc: TNewStaticText;
  lblServerDesc: TNewStaticText;
  lblClientDesc: TNewStaticText;
  lblServerUrl: TNewStaticText;
  edtServerUrl: TNewEdit;
  btnTestConn: TNewButton;
  lblConnResult: TNewStaticText;

function IsServerOrSingleMode(): Boolean;
begin
  Result := not rbClient.Checked;
end;

function GetInstallModeString(Param: String): String;
begin
  if rbServer.Checked then
    Result := 'server'
  else if rbClient.Checked then
    Result := 'client'
  else
    Result := 'single';
end;

procedure UpdateModeControls(Sender: TObject);
var
  isClient: Boolean;
begin
  isClient := rbClient.Checked;
  lblServerUrl.Enabled := isClient;
  edtServerUrl.Enabled := isClient;
  btnTestConn.Enabled := isClient;
  lblConnResult.Enabled := isClient;
end;

procedure OnTestConnectionClick(Sender: TObject);
var
  WinHttpReq: Variant;
  Url: String;
begin
  Url := Trim(edtServerUrl.Text);
  if Url = '' then
  begin
    lblConnResult.Caption := 'Please enter a Server URL (e.g. http://192.168.1.50:4100).';
    exit;
  end;
  if Url[Length(Url)] = '/' then
    Delete(Url, Length(Url), 1);

  lblConnResult.Caption := 'Testing connection...';
  try
    WinHttpReq := CreateOleObject('WinHttp.WinHttpRequest.5.1');
    WinHttpReq.SetTimeouts(3000, 3000, 3000, 3000);
    WinHttpReq.Open('GET', Url + '/api/system_db', False);
    WinHttpReq.Send('');
    lblConnResult.Caption := 'Connected! Server responded (HTTP ' + IntToStr(WinHttpReq.Status) + ').';
  except
    lblConnResult.Caption := 'Could not reach server. Verify the host PC is running in Multi-User Server mode.';
  end;
end;

procedure InitializeWizard();
begin
  ModePage := CreateCustomPage(
    wpLicense,
    'Select Installation Type',
    'Choose how you want to use BorngreatAccounting on this computer.'
  );

  rbSingle := TNewRadioButton.Create(ModePage);
  rbSingle.Parent := ModePage.Surface;
  rbSingle.Left := ScaleX(0);
  rbSingle.Top := ScaleY(8);
  rbSingle.Width := ModePage.SurfaceWidth;
  rbSingle.Caption := 'Single User (Standalone)';
  rbSingle.Font.Style := [fsBold];
  rbSingle.Checked := True;
  rbSingle.OnClick := @UpdateModeControls;

  lblSingleDesc := TNewStaticText.Create(ModePage);
  lblSingleDesc.Parent := ModePage.Surface;
  lblSingleDesc.Left := ScaleX(20);
  lblSingleDesc.Top := ScaleY(30);
  lblSingleDesc.Width := ModePage.SurfaceWidth - ScaleX(20);
  lblSingleDesc.Caption := 'Installs the full application and database privately on this PC (http://localhost:4100).';

  rbServer := TNewRadioButton.Create(ModePage);
  rbServer.Parent := ModePage.Surface;
  rbServer.Left := ScaleX(0);
  rbServer.Top := ScaleY(60);
  rbServer.Width := ModePage.SurfaceWidth;
  rbServer.Caption := 'Multi-User Server (Host on Local Network)';
  rbServer.Font.Style := [fsBold];
  rbServer.OnClick := @UpdateModeControls;

  lblServerDesc := TNewStaticText.Create(ModePage);
  lblServerDesc.Parent := ModePage.Surface;
  lblServerDesc.Left := ScaleX(20);
  lblServerDesc.Top := ScaleY(82);
  lblServerDesc.Width := ModePage.SurfaceWidth - ScaleX(20);
  lblServerDesc.Caption := 'Hosts the shared database and opens LAN access + Firewall port 4100 for client PCs.';

  rbClient := TNewRadioButton.Create(ModePage);
  rbClient.Parent := ModePage.Surface;
  rbClient.Left := ScaleX(0);
  rbClient.Top := ScaleY(112);
  rbClient.Width := ModePage.SurfaceWidth;
  rbClient.Caption := 'Client Workstation (Join Existing Server)';
  rbClient.Font.Style := [fsBold];
  rbClient.OnClick := @UpdateModeControls;

  lblClientDesc := TNewStaticText.Create(ModePage);
  lblClientDesc.Parent := ModePage.Surface;
  lblClientDesc.Left := ScaleX(20);
  lblClientDesc.Top := ScaleY(134);
  lblClientDesc.Width := ModePage.SurfaceWidth - ScaleX(20);
  lblClientDesc.Caption := 'Lightweight client only. Connects to an existing Multi-User Server on your network.';

  lblServerUrl := TNewStaticText.Create(ModePage);
  lblServerUrl.Parent := ModePage.Surface;
  lblServerUrl.Left := ScaleX(20);
  lblServerUrl.Top := ScaleY(164);
  lblServerUrl.Caption := 'Server URL (e.g. http://192.168.1.50:4100):';

  edtServerUrl := TNewEdit.Create(ModePage);
  edtServerUrl.Parent := ModePage.Surface;
  edtServerUrl.Left := ScaleX(20);
  edtServerUrl.Top := ScaleY(184);
  edtServerUrl.Width := ScaleX(280);
  edtServerUrl.Text := 'http://192.168.1.100:4100';

  btnTestConn := TNewButton.Create(ModePage);
  btnTestConn.Parent := ModePage.Surface;
  btnTestConn.Left := ScaleX(308);
  btnTestConn.Top := ScaleY(183);
  btnTestConn.Width := ScaleX(110);
  btnTestConn.Caption := 'Test Connection';
  btnTestConn.OnClick := @OnTestConnectionClick;

  lblConnResult := TNewStaticText.Create(ModePage);
  lblConnResult.Parent := ModePage.Surface;
  lblConnResult.Left := ScaleX(20);
  lblConnResult.Top := ScaleY(214);
  lblConnResult.Width := ModePage.SurfaceWidth - ScaleX(20);
  lblConnResult.Caption := '';

  UpdateModeControls(nil);
end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
  Url: String;
begin
  Result := True;
  if CurPageID = ModePage.ID then
  begin
    if rbClient.Checked then
    begin
      Url := Trim(edtServerUrl.Text);
      if (Pos('http://', LowerCase(Url)) <> 1) and (Pos('https://', LowerCase(Url)) <> 1) then
      begin
        MsgBox('Please enter a valid Server URL starting with http:// or https://', mbError, MB_OK);
        Result := False;
      end;
    end;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  ConfigPath: String;
  Url: String;
  Json: String;
begin
  if CurStep = ssPostInstall then
  begin
    if rbClient.Checked then
    begin
      Url := Trim(edtServerUrl.Text);
      if Url[Length(Url)] = '/' then
        Delete(Url, Length(Url), 1);
      ConfigPath := ExpandConstant('{app}\client-config.json');
      Json := '{' + #13#10 + '  "mode": "client",' + #13#10 + '  "serverUrl": "' + Url + '"' + #13#10 + '}' + #13#10;
      SaveStringToFile(ConfigPath, Json, False);
    end
    else
    begin
      ConfigPath := ExpandConstant('{app}\install-config.json');
      Json := '{' + #13#10 + '  "mode": "' + GetInstallModeString('') + '",' + #13#10 + '  "serverUrl": "http://localhost:4100"' + #13#10 + '}' + #13#10;
      SaveStringToFile(ConfigPath, Json, False);
    end;
  end;
end;
