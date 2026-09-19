import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve, sep } from 'node:path';

const root = process.cwd();
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
const port = Number(process.env.PORT || 4173);

http.createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const target = resolve(join(root, pathname === '/' ? 'index.html' : pathname.slice(1)));
  if (target !== root && !target.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  try {
    if (!(await stat(target)).isFile()) throw new Error('Not a file');
    const body = await readFile(target);
    res.writeHead(200, { 'Content-Type': mime[extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }).end(body);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, () => console.log(`Record Label Rivals: http://localhost:${port}`));
