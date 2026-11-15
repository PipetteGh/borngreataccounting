import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Callout,
  Classes,
  Dialog,
  Intent,
  ProgressBar,
  Tag,
} from '@blueprintjs/core';

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

interface UpdateInstallStatus {
  state: 'idle' | 'downloading' | 'installing' | 'restarting' | 'error' | 'manual';
  progress: number;
  message: string;
}

const SKIPPED_VERSION_KEY = 'bga_skipped_update_version';
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

function detectPlatform(): 'windows' | 'mac' | 'linux' {
  const ua = (navigator.userAgent || '').toLowerCase();
  if (ua.includes('win')) return 'windows';
  if (ua.includes('mac')) return 'mac';
  return 'linux';
}

export function triggerAppUpdateCheck() {
  window.dispatchEvent(new CustomEvent('bga:check-updates'));
}

export function AppUpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [installStatus, setInstallStatus] = useState<UpdateInstallStatus>({
    state: 'idle',
    progress: 0,
    message: '',
  });

  const runCheck = useCallback(async (manual: boolean) => {
    if (manual) setChecking(true);
    try {
      const url = manual
        ? '/api/system_db/update-check?force=1'
        : '/api/system_db/update-check';
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      const data: UpdateCheckResponse = json?.data ?? json;
      if (!data?.latest_version) return;

      if (manual) {
        setUpdateInfo(data);
        setIsOpen(true);
        return;
      }

      if (!data.update_available) return;
      const skipped = localStorage.getItem(SKIPPED_VERSION_KEY);
      if (skipped === data.latest_version) return;

      setUpdateInfo(data);
      setIsOpen(true);
    } catch {
      // Ignore offline/network errors during background update check
    } finally {
      if (manual) setChecking(false);
    }
  }, []);

  useEffect(() => {
    runCheck(false);
    const timer = window.setInterval(() => runCheck(false), CHECK_INTERVAL_MS);
    const onManual = () => {
      runCheck(true);
    };
    window.addEventListener('bga:check-updates', onManual);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('bga:check-updates', onManual);
    };
  }, [runCheck]);

  // Poll install progress & auto-reload when restarted server comes back online
  useEffect(() => {
    if (
      installStatus.state !== 'downloading' &&
      installStatus.state !== 'installing' &&
      installStatus.state !== 'restarting'
    ) {
      return;
    }

    let cancelled = false;
    let sawRestartPhase = installStatus.state === 'installing' || installStatus.state === 'restarting';
    let downOnce = false;

    const poll = window.setInterval(async () => {
      if (cancelled) return;
      try {
        const res = await fetch('/api/system_db/update-status');
        if (!res.ok) {
          downOnce = true;
          return;
        }
        const json = await res.json();
        const st: UpdateInstallStatus = json?.data ?? json;

        if (sawRestartPhase && downOnce) {
          window.clearInterval(poll);
          window.location.reload();
          return;
        }

        if (st.state === 'installing' || st.state === 'restarting') {
          sawRestartPhase = true;
        }
        setInstallStatus(st);
      } catch {
        // Server is restarting during upgrade
        downOnce = true;
        if (sawRestartPhase) {
          setInstallStatus({
            state: 'restarting',
            progress: 100,
            message: 'Restarting BorngreatAccounting... Reloading automatically when ready.',
          });
        }
      }
    }, 1200);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [installStatus.state]);

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

  const isBusy =
    installStatus.state === 'downloading' ||
    installStatus.state === 'installing' ||
    installStatus.state === 'restarting';

  const handleSkip = () => {
    localStorage.setItem(SKIPPED_VERSION_KEY, updateInfo.latest_version);
    setIsOpen(false);
  };

  const handleDownloadAndInstall = async () => {
    try {
      setInstallStatus({
        state: 'downloading',
        progress: 0,
        message: 'Starting update download...',
      });
      const res = await fetch('/api/system_db/update-install', { method: 'POST' });
      const json = await res.json();
      const st: UpdateInstallStatus = json?.data ?? json;
      setInstallStatus(st);
    } catch (err: any) {
      setInstallStatus({
        state: 'error',
        progress: 0,
        message: err?.message || 'Failed to start update installation.',
      });
    }
  };

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard?.writeText(cmd);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        if (!isBusy) setIsOpen(false);
      }}
      title={
        updateInfo.update_available
          ? `Update Available — v${updateInfo.latest_version}`
          : `Software Up to Date — v${updateInfo.current_version}`
      }
      icon="cloud-download"
      style={{ width: 540, maxWidth: '94vw' }}
    >
      <div className={Classes.DIALOG_BODY}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span>Installed:</span>
          <Tag minimal>v{updateInfo.current_version}</Tag>
          <span>→ Latest:</span>
          <Tag intent={updateInfo.update_available ? Intent.SUCCESS : Intent.PRIMARY}>
            v{updateInfo.latest_version}
          </Tag>
        </div>

        {!updateInfo.update_available ? (
          <Callout intent={Intent.SUCCESS} title="You are running the latest version">
            BorngreatAccounting v{updateInfo.current_version} is up to date.
          </Callout>
        ) : (
          <Callout
            intent={Intent.PRIMARY}
            title="A new release of BorngreatAccounting is ready"
          >
            <p style={{ marginBottom: 6 }}>
              Click <strong>Download &amp; Install Update</strong> to upgrade
              automatically. Your database, accounts, and <code>.env</code>{' '}
              settings are preserved, and the app will restart automatically when
              finished.
            </p>
            {platform !== 'windows' && (
              <div style={{ marginTop: 8 }}>
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
        )}

        {installStatus.state !== 'idle' && (
          <div style={{ marginTop: 14 }}>
            <Callout
              intent={
                installStatus.state === 'error'
                  ? Intent.DANGER
                  : installStatus.state === 'manual'
                    ? Intent.WARNING
                    : Intent.PRIMARY
              }
            >
              <div style={{ marginBottom: isBusy ? 8 : 0 }}>{installStatus.message}</div>
              {isBusy && (
                <ProgressBar
                  intent={Intent.PRIMARY}
                  value={
                    installStatus.state === 'downloading'
                      ? Math.max(0.05, installStatus.progress / 100)
                      : undefined
                  }
                  animate
                  stripes
                />
              )}
            </Callout>
          </div>
        )}

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
          {updateInfo.update_available && !isBusy && (
            <Button minimal onClick={handleSkip}>
              Skip This Version
            </Button>
          )}
          {!isBusy && (
            <Button onClick={() => setIsOpen(false)}>
              {updateInfo.update_available ? 'Remind Me Later' : 'Close'}
            </Button>
          )}
          <Button
            icon="refresh"
            loading={checking}
            disabled={isBusy}
            onClick={() => runCheck(true)}
          >
            Check Again
          </Button>
          {updateInfo.update_available && (
            <>
              <Button
                intent={Intent.PRIMARY}
                icon="cloud-download"
                loading={isBusy}
                onClick={handleDownloadAndInstall}
              >
                Download &amp; Install Update
              </Button>
              {platform === 'windows' && !isBusy && (
                <Button
                  minimal
                  icon="share"
                  onClick={() => window.open(windowsUrl, '_blank', 'noopener,noreferrer')}
                >
                  Manual Download
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
}
