import { Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as os from 'os';
import * as path from 'path';
import { PublicRoute } from '@/modules/Auth/guards/jwt.guard';

const REPO_SLUG = 'PipetteGh/borngreataccounting';
const CACHE_TTL_MS = 30 * 60 * 1000;

interface UpdateCheckResult {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  releaseUrl: string;
  releaseNotes: string;
  publishedAt: string | null;
  downloads: {
    windowsInstaller: string;
    linuxUpgradeCommand: string;
    macUpgradeCommand: string;
    dockerUpgradeCommand: string;
  };
}

let cachedUpdateCheck: { data: UpdateCheckResult; fetchedAt: number } | null = null;

interface UpdateInstallStatus {
  state: 'idle' | 'downloading' | 'installing' | 'restarting' | 'error' | 'manual';
  progress: number;
  message: string;
}

let updateInstallStatus: UpdateInstallStatus = {
  state: 'idle',
  progress: 0,
  message: '',
};

function findRepoRoot(): string {
  const candidates = [
    process.cwd(),
    path.resolve(process.cwd(), '../..'),
    path.resolve(__dirname, '../../../../../../'),
  ];
  for (const dir of candidates) {
    try {
      if (fs.existsSync(path.join(dir, 'package.json'))) {
        const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
        if (pkg?.name === 'borngreataccounting-monorepo') {
          return dir;
        }
      }
    } catch {}
  }
  return process.cwd();
}

function downloadFileWithProgress(
  url: string,
  destPath: string,
  onProgress: (pct: number) => void,
  redirectsLeft = 5,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http;
    const req = client.get(
      url,
      { headers: { 'User-Agent': 'BorngreatAccounting-Updater/1.0' } },
      (res) => {
        const code = res.statusCode || 0;
        if (code >= 300 && code < 400 && res.headers.location && redirectsLeft > 0) {
          res.resume();
          const nextUrl = new URL(res.headers.location, url).toString();
          downloadFileWithProgress(nextUrl, destPath, onProgress, redirectsLeft - 1)
            .then(resolve)
            .catch(reject);
          return;
        }
        if (code !== 200) {
          res.resume();
          reject(new Error(`Download failed with HTTP ${code}`));
          return;
        }
        const total = Number(res.headers['content-length'] || 0);
        let received = 0;
        const file = fs.createWriteStream(destPath);
        res.on('data', (chunk: Buffer) => {
          received += chunk.length;
          if (total > 0) {
            onProgress(Math.min(99, Math.round((received / total) * 100)));
          }
        });
        res.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            onProgress(100);
            resolve();
          });
        });
        file.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      },
    );
    req.on('error', reject);
  });
}

function readCurrentVersion(): string {
  if (process.env.APP_VERSION) {
    return process.env.APP_VERSION.replace(/^v/i, '').trim();
  }
  const candidates = [
    path.resolve(process.cwd(), 'package.json'),
    path.resolve(process.cwd(), '../../package.json'),
    path.resolve(__dirname, '../../../../../../package.json'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (pkg && pkg.name === 'borngreataccounting-monorepo' && pkg.version) {
          return String(pkg.version).replace(/^v/i, '').trim();
        }
      }
    } catch {}
  }
  return '1.0.5';
}

function compareSemver(a: string, b: string): number {
  const pa = a.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length, 3);
  for (let i = 0; i < len; i++) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}

function httpsGetJson(url: string): Promise<{ status: number; body: string; location?: string }> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'BorngreatAccounting-Updater/1.0',
          Accept: 'application/vnd.github+json',
        },
        timeout: 5000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode || 0,
            body: data,
            location: res.headers.location,
          });
        });
      },
    );
    req.on('timeout', () => {
      req.destroy(new Error('Request timed out'));
    });
    req.on('error', reject);
  });
}

@Controller('system_db')
@PublicRoute()
export class SystemDatabaseController {
  constructor() {}

  @Get()
  @HttpCode(200)
  ping() {
    return { status: 'ok' };
  }

  @Get('update-check')
  @HttpCode(200)
  async checkForUpdates(@Query('force') force?: string): Promise<UpdateCheckResult> {
    const currentVersion = readCurrentVersion();
    const now = Date.now();
    if (!force && cachedUpdateCheck && now - cachedUpdateCheck.fetchedAt < CACHE_TTL_MS) {
      return cachedUpdateCheck.data;
    }

    let latestVersion = currentVersion;
    let releaseUrl = `https://github.com/${REPO_SLUG}/releases/latest`;
    let releaseNotes = '';
    let publishedAt: string | null = null;

    try {
      const apiRes = await httpsGetJson(
        `https://api.github.com/repos/${REPO_SLUG}/releases/latest`,
      );
      if (apiRes.status === 200) {
        const parsed = JSON.parse(apiRes.body);
        if (parsed.tag_name) {
          latestVersion = String(parsed.tag_name).replace(/^v/i, '').trim();
        }
        if (parsed.html_url) releaseUrl = parsed.html_url;
        if (parsed.body) releaseNotes = String(parsed.body).slice(0, 1200);
        if (parsed.published_at) publishedAt = parsed.published_at;
      } else {
        // Fallback when GitHub API is rate-limited: inspect redirect Location header
        const webRes = await httpsGetJson(
          `https://github.com/${REPO_SLUG}/releases/latest`,
        );
        if (webRes.location) {
          const match = webRes.location.match(/\/releases\/tag\/v?([0-9]+\.[0-9]+\.[0-9]+[^\s/]*)/i);
          if (match) {
            latestVersion = match[1];
            releaseUrl = webRes.location;
          }
        }
      }
    } catch {
      // Offline or unreachable: return currentVersion cleanly with updateAvailable: false
    }

    const result: UpdateCheckResult = {
      currentVersion,
      latestVersion,
      updateAvailable: compareSemver(latestVersion, currentVersion) > 0,
      releaseUrl,
      releaseNotes,
      publishedAt,
      downloads: {
        windowsInstaller: `https://github.com/${REPO_SLUG}/releases/latest/download/BorngreatAccounting-Setup.exe`,
        linuxUpgradeCommand: './upgrade.sh',
        macUpgradeCommand: './upgrade.sh',
        dockerUpgradeCommand: 'git pull && docker compose up -d --build',
      },
    };

    cachedUpdateCheck = { data: result, fetchedAt: now };
    return result;
  }

  @Get('update-status')
  @HttpCode(200)
  getUpdateStatus(): UpdateInstallStatus {
    return updateInstallStatus;
  }

  @Post('update-install')
  @HttpCode(200)
  async installUpdate(): Promise<UpdateInstallStatus> {
    if (
      updateInstallStatus.state === 'downloading' ||
      updateInstallStatus.state === 'installing' ||
      updateInstallStatus.state === 'restarting'
    ) {
      return updateInstallStatus;
    }

    const repoRoot = findRepoRoot();

    if (process.platform === 'win32') {
      const installerUrl = `https://github.com/${REPO_SLUG}/releases/latest/download/BorngreatAccounting-Setup.exe`;
      const tempInstaller = path.join(os.tmpdir(), 'BorngreatAccounting-Setup-Update.exe');
      updateInstallStatus = {
        state: 'downloading',
        progress: 0,
        message: 'Downloading latest BorngreatAccounting installer...',
      };

      void (async () => {
        try {
          await downloadFileWithProgress(installerUrl, tempInstaller, (pct) => {
            updateInstallStatus = {
              state: 'downloading',
              progress: pct,
              message: `Downloading update... ${pct}%`,
            };
          });

          updateInstallStatus = {
            state: 'installing',
            progress: 100,
            message: 'Installing update silently and preserving all data. App will restart automatically...',
          };

          const installDir = path.resolve(repoRoot, '..');
          const launcherExe = path.join(installDir, 'BorngreatAccounting.exe');
          const runtimeScript = path.join(repoRoot, 'scripts', 'windows-runtime.ps1');
          const psScript = [
            'Start-Sleep -Seconds 2',
            `Start-Process -FilePath '${tempInstaller.replace(/'/g, "''")}' -ArgumentList '/VERYSILENT','/SUPPRESSMSGBOXES','/NORESTART','/CLOSEAPPLICATIONS' -Wait`,
            `if (Test-Path '${runtimeScript.replace(/'/g, "''")}') { & powershell.exe -NoProfile -ExecutionPolicy Bypass -File '${runtimeScript.replace(/'/g, "''")}' -Action start }`,
            `if (Test-Path '${launcherExe.replace(/'/g, "''")}') { Start-Process -FilePath '${launcherExe.replace(/'/g, "''")}' -ArgumentList '--launch' }`,
          ].join('; ');

          const child = spawn(
            'powershell.exe',
            ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-Command', psScript],
            { detached: true, stdio: 'ignore', windowsHide: true },
          );
          child.unref();
        } catch (err: any) {
          updateInstallStatus = {
            state: 'error',
            progress: 0,
            message: err?.message || 'Failed to download or launch update.',
          };
        }
      })();

      return updateInstallStatus;
    }

    if (fs.existsSync('/.dockerenv')) {
      updateInstallStatus = {
        state: 'manual',
        progress: 0,
        message: 'Docker container detected. Run on host: git pull && docker compose up -d --build',
      };
      return updateInstallStatus;
    }

    const upgradeScript = path.join(repoRoot, 'upgrade.sh');
    if (fs.existsSync(upgradeScript)) {
      updateInstallStatus = {
        state: 'installing',
        progress: 100,
        message: 'Running upgrade.sh and restarting services (database & .env preserved)...',
      };
      const child = spawn('bash', [upgradeScript], {
        cwd: repoRoot,
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      return updateInstallStatus;
    }

    updateInstallStatus = {
      state: 'manual',
      progress: 0,
      message: 'Run git pull && docker compose up -d --build (or ./upgrade.sh) to update.',
    };
    return updateInstallStatus;
  }
}
