import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };

export function createGameServer(root = process.cwd()) {
  const absoluteRoot = resolve(root);
  return http.createServer(async (req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { res.writeHead(400).end('Bad request'); return; }
    const target = resolve(join(absoluteRoot, pathname === '/' ? 'index.html' : pathname.slice(1)));
    if (target !== absoluteRoot && !target.startsWith(absoluteRoot + sep)) { res.writeHead(403).end(); return; }
    try {
      if (!(await stat(target)).isFile()) throw new Error('Not a file');
      const body = await readFile(target);
      res.writeHead(200, { 'Content-Type': mime[extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }).end(body);
    } catch { res.writeHead(404).end('Not found'); }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  createGameServer().listen(port, '127.0.0.1', () => console.log(`Record Label Rivals: http://127.0.0.1:${port}`));
}
