// server.mjs — local card editor helper. `npm run card-editor` then open
// http://localhost:5600/card-editor.html . Serves the project files and saves rarity / art position
// straight into src/data/*.js. Listens on 127.0.0.1 only.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { patchCardSource } from './patchCardSource.mjs';
import { validateEdit } from './validateEdit.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORT = Number(process.env.CARD_EDITOR_PORT || 5600);
const DATA_FILES = ['mosjes', 'piecies', 'places', 'snellePiecies', 'quests'].map((f) => path.join(ROOT, 'src', 'data', `${f}.js`));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.JPG': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };

function saveEdit(edit) {
  const problem = validateEdit(edit);
  if (problem) return { status: 400, body: { ok: false, error: problem } };
  const { id, rarity, artFocus } = edit;
  for (const file of DATA_FILES) {
    const source = fs.readFileSync(file, 'utf8');
    const next = patchCardSource(source, id, { rarity, artFocus });
    if (next === null) continue;
    if (next !== source) fs.writeFileSync(file, next);
    return { status: 200, body: { ok: true, file: path.basename(file) } };
  }
  return { status: 404, body: { ok: false, error: `card ${id} not found` } };
}

function serveStatic(req, res) {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
  const file = path.resolve(ROOT, rel);
  const blocked = /(^|[\\/])(\.|node_modules|_archive)/.test(path.relative(ROOT, file));
  if (!file.startsWith(ROOT) || blocked || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/save') {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 5000) req.destroy(); });
    req.on('end', () => {
      let out;
      try { out = saveEdit(JSON.parse(raw)); } catch { out = { status: 400, body: { ok: false, error: 'bad request' } }; }
      res.writeHead(out.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(out.body));
    });
    return;
  }
  serveStatic(req, res);
}).listen(PORT, '127.0.0.1', () => {
  console.log(`\nCard editor ready: http://localhost:${PORT}/card-editor.html\n(changes are saved straight into src/data/*.js - leave this window open, Ctrl+C to stop)\n`);
});
