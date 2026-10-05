#!/usr/bin/env node
// Local preview of dist/ that mimics the production Nginx setup:
// gzip, long cache for /assets/, short cache for HTML, 404 page, the CSP from deploy/nginx.
// Usage: node scripts/serve.mjs [port]. With API=http://127.0.0.1:8787 it also proxies /api/ to the contact service.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.argv[2] || 8080);
const types = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript',
    '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
    '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.pdf': 'application/pdf',
};

// same Content-Security-Policy as production, read from the Nginx snippet
const csp = (readFileSync(fileURLToPath(new URL('../deploy/nginx/buzumurga-security-headers.conf', import.meta.url)), 'utf8')
    .match(/Content-Security-Policy "([^"]+)"/) || [])[1];

createServer(async (req, res) => {
    if (process.env.API && req.url.startsWith('/api/')) {
        const body = await new Promise(r => { const c = []; req.on('data', d => c.push(d)); req.on('end', () => r(Buffer.concat(c))); });
        const upstream = await fetch(process.env.API + req.url, { method: req.method, headers: { 'content-type': req.headers['content-type'] || '', accept: req.headers.accept || '' }, body: req.method === 'POST' ? body : undefined });
        res.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('content-type') || 'text/plain' }).end(Buffer.from(await upstream.arrayBuffer()));
        return;
    }
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    let file = join(dist, path);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    let status = 200;
    if (!file.startsWith(dist) || !existsSync(file)) { file = join(dist, '404.html'); status = 404; }
    const type = types[extname(file)] || 'application/octet-stream';
    let body = readFileSync(file);
    const headers = {
        'Content-Type': type,
        'Cache-Control': path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
        'X-Content-Type-Options': 'nosniff',
    };
    if (csp && type.startsWith('text/html')) headers['Content-Security-Policy'] = csp;
    if (/text|javascript|json|xml|svg/.test(type) && /gzip/.test(req.headers['accept-encoding'] || '')) {
        body = gzipSync(body);
        headers['Content-Encoding'] = 'gzip';
    }
    res.writeHead(status, headers).end(body);
}).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}/`));
