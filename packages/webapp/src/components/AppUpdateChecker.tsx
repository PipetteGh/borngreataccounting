import React, { useEffect, useState } from 'react';
import { Button, Callout, Classes, Dialog, Intent, Tag } from '@blueprintjs/core';

interface UpdateCheckResponse {
  current_version: string;
  latest_version: string;
  update_available: boolean;
  release_url: string;
  release_notes?: string;
  published_at?: string | null;
  downloads?: {
    windows_installer?: string;
    linux_upgrade_command?: string;
    mac_upgrade_command?: string;
    docker_upgrade_command?: string;
  };
}

const SKIPPED_VERSION_KEY = 'bga_skipped_update_version';
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

function detectPlatform(): 'windows' | 'mac' | 'linux' {
  const ua = (navigator.userAgent || '').toLowerCase();
  if (ua.includes('win')) return 'windows';
  if (ua.includes('mac')) return 'mac';
  return 'linux';
}

export function AppUpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    const checkUpdates = async () => {
      try {
        const res = await fetch('/api/system_db/update-check');
        if (!res.ok) return;
        const json = await res.json();
        const data: UpdateCheckResponse = json?.data ?? json;
        if (!active || !data?.update_available || !data?.latest_version) return;

        const skipped = localStorage.getItem(SKIPPED_VERSION_KEY);
        if (skipped === data.latest_version) return;

        setUpdateInfo(data);
        setIsOpen(true);
      } catch {
        // Ignore offline/network errors during background update check
      }
    };

    checkUpdates();
    const timer = window.setInterval(checkUpdates, CHECK_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  if (!updateInfo) return null;

  const platform = detectPlatform();
  const windowsUrl =
    updateInfo.downloads?.windows_installer ||
    'https://github.com/PipetteGh/borngreataccounting/releases/latest/download/BorngreatAccounting-Setup.exe';
  const unixCmd =
    platform === 'mac'
      ? updateInfo.downloads?.mac_upgrade_command || './upgrade.sh'
      : updateInfo.downloads?.linux_upgrade_command || './upgrade.sh';
  const dockerCmd =
    updateInfo.downloads?.docker_upgrade_command || 'git pull && docker compose up -d --build';

  const handleSkip = () => {
    localStorage.setItem(SKIPPED_VERSION_KEY, updateInfo.latest_version);
    setIsOpen(false);
  };

  const handleUpdateNow = () => {
    if (platform === 'windows') {
      window.open(windowsUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.open(updateInfo.release_url, '_blank', 'noopener,noreferrer');
    }
    setIsOpen(false);
  };

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard?.writeText(cmd);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title={`Update Available — v${updateInfo.latest_version}`}
      icon="cloud-download"
      style={{ width: 520, maxWidth: '94vw' }}
    >
      <div className={Classes.DIALOG_BODY}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span>Installed:</span>
          <Tag minimal>v{updateInfo.current_version}</Tag>
          <span>→ Latest:</span>
          <Tag intent={Intent.SUCCESS}>v{updateInfo.latest_version}</Tag>
        </div>

        <Callout intent={Intent.PRIMARY} title="A new release of BorngreatAccounting is ready">
          {platform === 'windows' ? (
            <p style={{ marginBottom: 6 }}>
              Click <strong>Update Now</strong> to download the latest Windows Setup Wizard (
              <code>BorngreatAccounting-Setup.exe</code>) and install it over your existing setup.
            </p>
          ) : (
            <div>
              <p style={{ marginBottom: 6 }}>
                Run the upgrade script on your <strong>{platform === 'mac' ? 'macOS' : 'Linux'}</strong>{' '}
                server or Docker host:
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <code style={{ flex: 1, padding: '4px 8px', background: '#f1f5f9', borderRadius: 4 }}>
                  {unixCmd}
                </code>
                <Button small onClick={() => handleCopyCommand(unixCmd)}>
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                Docker Compose: <code>{dockerCmd}</code>
              </p>
            </div>
          )}
        </Callout>

        {updateInfo.release_notes ? (
          <div
            style={{
              marginTop: 12,
              maxHeight: 140,
              overflowY: 'auto',
              padding: 10,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 4,
              fontSize: 12,
              whiteSpace: 'pre-wrap',
            }}
          >
            {updateInfo.release_notes}
          </div>
        ) : null}
      </div>

      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button minimal onClick={handleSkip}>
            Skip This Version
          </Button>
          <Button onClick={() => setIsOpen(false)}>Remind Me Later</Button>
          <Button intent={Intent.PRIMARY} icon="download" onClick={handleUpdateNow}>
            {platform === 'windows' ? 'Update Now (.exe)' : 'View Release & Update'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
