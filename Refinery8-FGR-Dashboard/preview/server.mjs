// Minimal static file server for the dashboard preview (no dependencies).
// Serves Refinery8-FGR-Dashboard/ at http://127.0.0.1:8642/ so the page can
// fetch data/tasks.csv and data/project-info.csv straight from the sync engine,
// and exposes the same small API as the offline launcher (/api/health, /api/ping, /api/sync).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, normalize, extname } from 'node:path';
import { execFile } from 'node:child_process';

const root = fileURLToPath(new URL('..', import.meta.url));
const port = Number(process.env.PORT) || 8642;
const syncScript = join(root, 'Scripts', 'export-msp-data.ps1');
const logFile = join(root, 'logs', 'export-msp-data.log');
let syncing = false;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

async function logTail(n = 4) {
  try {
    const text = await readFile(logFile, 'utf8');
    return text.trim().split(/\r?\n/).slice(-n).join(' | ');
  } catch { return ''; }
}

function runSync() {
  return new Promise((resolve) => {
    if (syncing) return resolve({ ok: false, message: 'sync already running' });
    syncing = true;
    execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', syncScript],
      { windowsHide: true, timeout: 300000, maxBuffer: 4 * 1024 * 1024 },
      async (err, stdout, stderr) => {
        syncing = false;
        const tail = await logTail();
        const ok = !err && /SYNC OK/.test(tail);
        resolve({
          ok,
          message: ok ? '' : ((err && err.message) || String(stderr || '').trim().slice(0, 200) || 'see log'),
          tail,
        });
      });
  });
}

function json(res, obj, code = 200) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);

    if (path === '/api/health') return json(res, { ok: true, app: 'fgr-dashboard' });
    if (path === '/api/ping') return json(res, { ok: true });
    if (path === '/api/sync') return json(res, await runSync());

    let rel = path === '/' ? '/preview/index.html' : path;
    const file = normalize(join(root, rel));
    if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`dashboard preview on http://127.0.0.1:${port}/`));
