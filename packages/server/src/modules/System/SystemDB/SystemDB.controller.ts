import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import * as fs from 'fs';
import * as https from 'https';
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
}
