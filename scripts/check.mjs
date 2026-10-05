#!/usr/bin/env node
// Checks the built site in dist/:
//  - every internal link, image, script and stylesheet points to an existing file;
//  - every #anchor exists on its page;
//  - no long dashes (U+2014) in the HTML;
//  - with --external: every external link answers with a non-error status.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const checkExternal = process.argv.includes('--external');
const walk = dir => readdirSync(dir).flatMap(n => statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]);
const pages = walk(dist).filter(f => f.endsWith('.html') && !/(google|yandex)\w+\.html$/.test(f));

const errors = [];
const external = new Map();

for (const file of pages) {
    const html = readFileSync(file, 'utf8');
    const page = '/' + relative(dist, file).replace(/index\.html$/, '');
    if (html.includes('\u2014')) errors.push(`${page}: contains an em dash`);
    const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));

    const refs = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map(m => m[1])
        .concat([...html.matchAll(/\ssrcset="([^"]+)"/g)].flatMap(m => m[1].split(',').map(s => s.trim().split(/\s+/)[0])));

    for (const ref of refs) {
        if (/^(mailto:|tel:|data:)/.test(ref)) continue;
        if (/^https?:\/\//.test(ref)) {
            if (!ref.startsWith('https://buzumurga.com')) {
                if (!external.has(ref)) external.set(ref, page);
                continue;
            }
        }
        const url = new URL(ref, 'https://buzumurga.com' + page);
        if (url.origin !== 'https://buzumurga.com') continue;
        if (url.pathname.startsWith('/api/')) continue;
        let target = join(dist, decodeURIComponent(url.pathname));
        if (url.pathname.endsWith('/')) target = join(target, 'index.html');
        if (!existsSync(target)) { errors.push(`${page}: broken link ${ref}`); continue; }
        if (url.hash && url.hash.length > 1 && (url.pathname === page || ref.startsWith('#'))) {
            if (!ids.has(url.hash.slice(1))) errors.push(`${page}: missing anchor ${url.hash}`);
        }
    }
}

if (checkExternal) {
    for (const [url, page] of external) {
        try {
            let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(20000) });
            if (res.status >= 400) res = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(20000) });
            // LinkedIn answers 999 to bots, treat it as reachable
            if (res.status >= 400 && res.status !== 999) errors.push(`${page}: ${url} -> HTTP ${res.status}`);
            else console.log(`ok ${res.status} ${url}`);
        } catch (e) {
            errors.push(`${page}: ${url} -> ${e.cause?.code || e.message}`);
        }
    }
} else {
    console.log(`${external.size} external links (run with --external to check them)`);
}

if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
}
console.log(`Checked ${pages.length} pages: OK`);
