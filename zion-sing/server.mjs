// Mini-Server ohne Abhängigkeiten: node server.mjs → http://localhost:8080
// (Mikrofon & Web-Audio brauchen http://localhost oder https://, nicht file://)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = +process.env.PORT || 8080;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = normalize(join(ROOT, p));
    if (!file.startsWith(ROOT) || /[\\/](tools|test|node_modules)[\\/]/.test(file.slice(ROOT.length))) { res.writeHead(403).end(); return; }
    const info = await stat(file);
    const type = TYPES[extname(file)] || 'application/octet-stream';
    const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
    const data = await readFile(file);
    if (range) { // Audio-Seeking
      const start = range[1] ? +range[1] : 0, end = range[2] ? +range[2] : info.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${info.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
      res.end(data.subarray(start, end + 1));
    } else {
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': info.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
      res.end(data);
    }
  } catch (_) { res.writeHead(404).end('Not found'); }
}).listen(PORT, () => console.log(`Zion Sing läuft auf http://localhost:${PORT}`));
