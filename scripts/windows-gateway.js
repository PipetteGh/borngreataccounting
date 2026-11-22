/**
 * BorngreatAccounting (BtAccounting) — Native Windows Web & API Gateway Server
 * Serves packages/webapp/dist SPA and proxies /api, /public, /socket.io to 127.0.0.1:3000
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const backendAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 128,
  keepAliveMsecs: 30000,
});

const MAX_CACHE_FILE_BYTES = 5 * 1024 * 1024;
const COMPRESSIBLE_EXTS = new Set([
  '.html',
  '.js',
  '.mjs',
  '.css',
  '.json',
  '.svg',
]);
const staticAssetCache = new Map();

function readEnvValue(key) {
  try {
    const envPath = path.resolve(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) return undefined;
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      if (trimmed.slice(0, idx).trim() === key) {
        return trimmed.slice(idx + 1).trim();
      }
    }
  } catch {}
  return undefined;
}

const WEB_PORT = Number(process.env.WEB_PORT || readEnvValue('WEB_PORT') || 4100);
const WEB_HOST = process.env.WEB_HOST || readEnvValue('WEB_HOST') || '0.0.0.0';
const API_HOST = process.env.API_HOST || '127.0.0.1';
const API_PORT = Number(process.env.PORT || readEnvValue('PORT') || 3000);
const DIST_DIR = path.resolve(__dirname, '..', 'packages', 'webapp', 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json',
};

function proxyToBackend(req, res) {
  const options = {
    hostname: API_HOST,
    port: API_PORT,
    path: req.url,
    method: req.method,
    agent: backendAgent,
    headers: {
      ...req.headers,
      host: `${API_HOST}:${API_PORT}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Bad Gateway',
          message: `BorngreatAccounting API server (${API_HOST}:${API_PORT}) is starting or unreachable: ${err.message}`,
        }),
      );
    } else {
      res.destroy();
    }
  });

  req.on('error', () => proxyReq.destroy());
  res.on('error', () => proxyReq.destroy());
  req.pipe(proxyReq, { end: true });
}

function sendCachedFile(req, res, targetFile, stats, isImmutableAsset) {
  const ext = path.extname(targetFile).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const cacheControl = isImmutableAsset
    ? 'public, max-age=31536000, immutable'
    : 'no-cache';

  const existing = staticAssetCache.get(targetFile);
  if (existing && existing.mtimeMs === stats.mtimeMs) {
    if (req.headers['if-none-match'] === existing.etag) {
      res.writeHead(304, {
        ETag: existing.etag,
        'Cache-Control': cacheControl,
      });
      return res.end();
    }
    const acceptGzip = /\bgzip\b/i.test(String(req.headers['accept-encoding'] || ''));
    const body = acceptGzip && existing.gzip ? existing.gzip : existing.raw;
    const headers = {
      'Content-Type': existing.contentType,
      'Cache-Control': cacheControl,
      ETag: existing.etag,
      Vary: 'Accept-Encoding',
      'Content-Length': body.length,
    };
    if (acceptGzip && existing.gzip) {
      headers['Content-Encoding'] = 'gzip';
    }
    res.writeHead(200, headers);
    return res.end(body);
  }

  fs.readFile(targetFile, (readErr, raw) => {
    if (readErr) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end('Failed to read static asset.');
    }
    const etag = `"${stats.size}-${Math.floor(stats.mtimeMs)}"`;
    const gzip = COMPRESSIBLE_EXTS.has(ext)
      ? zlib.gzipSync(raw, { level: 6 })
      : null;
    if (staticAssetCache.size > 500) {
      staticAssetCache.clear();
    }
    staticAssetCache.set(targetFile, {
      raw,
      gzip,
      etag,
      mtimeMs: stats.mtimeMs,
      contentType,
      isImmutable: isImmutableAsset,
    });

    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, {
        ETag: etag,
        'Cache-Control': cacheControl,
      });
      return res.end();
    }
    const acceptGzip = /\bgzip\b/i.test(String(req.headers['accept-encoding'] || ''));
    const body = acceptGzip && gzip ? gzip : raw;
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      ETag: etag,
      Vary: 'Accept-Encoding',
      'Content-Length': body.length,
    };
    if (acceptGzip && gzip) {
      headers['Content-Encoding'] = 'gzip';
    }
    res.writeHead(200, headers);
    return res.end(body);
  });
}

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];

  if (
    urlPath.startsWith('/api') ||
    urlPath.startsWith('/socket') ||
    urlPath.startsWith('/public')
  ) {
    return proxyToBackend(req, res);
  }

  let filePath = path.join(DIST_DIR, decodeURIComponent(urlPath));
  if (filePath.endsWith(path.sep)) {
    filePath = path.join(filePath, 'index.html');
  }

  // Prevent directory traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const isImmutable = urlPath.startsWith('/assets/');
      if (stats.size <= MAX_CACHE_FILE_BYTES) {
        return sendCachedFile(req, res, filePath, stats, isImmutable);
      }
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': isImmutable
          ? 'public, max-age=31536000, immutable'
          : 'no-cache',
      });
      return fs.createReadStream(filePath).pipe(res);
    }

    // SPA fallback to index.html
    const indexFile = path.join(DIST_DIR, 'index.html');
    fs.stat(indexFile, (idxErr, idxStats) => {
      if (idxErr || !idxStats.isFile()) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('BorngreatAccounting Webapp dist/index.html not found.');
      }
      return sendCachedFile(req, res, indexFile, idxStats, false);
    });
  });
});

server.on('clientError', (_err, socket) => {
  if (socket.writable) {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  } else {
    socket.destroy();
  }
});

server.on('upgrade', (req, socket, head) => {
  socket.on('error', () => {});
  const proxyReq = http.request({
    hostname: API_HOST,
    port: API_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  });
  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    proxySocket.on('error', () => socket.destroy());
    socket.on('error', () => proxySocket.destroy());
    socket.write('HTTP/1.1 101 Switching Protocols\r\n');
    Object.keys(proxyRes.headers).forEach((k) => {
      socket.write(`${k}: ${proxyRes.headers[k]}\r\n`);
    });
    socket.write('\r\n');
    if (proxyHead && proxyHead.length) socket.write(proxyHead);
    proxySocket.pipe(socket).pipe(proxySocket);
  });
  proxyReq.on('error', () => socket.destroy());
  proxyReq.end();
});

process.on('uncaughtException', (err) => {
  console.error('[BorngreatAccounting Web Gateway] uncaughtException:', err?.message || err);
});

server.listen(WEB_PORT, WEB_HOST, () => {
  console.log(
    `[BorngreatAccounting Web Gateway] Listening on http://${WEB_HOST}:${WEB_PORT} -> proxying /api to http://${API_HOST}:${API_PORT}`,
  );
});
