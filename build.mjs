#!/usr/bin/env node
// Builds the static site into dist/:
//   dist/index.html (EN), dist/ru/index.html (RU), dist/404.html,
//   dist/sitemap.xml, dist/robots.txt and fingerprinted files in dist/assets/.
// No dependencies, Node 18+.
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, posix, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage } from './src/page.mjs';
import { render404 } from './src/404.mjs';
import { renderFreelance } from './src/freelance.mjs';
import { attr } from './src/helpers.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');
const staticDir = join(root, 'static');
const assetsDir = join(staticDir, 'assets');

const readJson = file => JSON.parse(readFileSync(join(root, file), 'utf8'));
const site = readJson('content/site.json');
const content = { en: readJson('content/en.json'), ru: readJson('content/ru.json') };

// Long dashes are not allowed anywhere in the texts.
const EM_DASH = '\u2014';
for (const file of ['content/en.json', 'content/ru.json', 'content/site.json']) {
    if (readFileSync(join(root, file), 'utf8').includes(EM_DASH)) {
        throw new Error(`${file} contains an em dash - use a hyphen "-" instead`);
    }
}

function walk(dir) {
    return readdirSync(dir).flatMap(name => {
        const full = join(dir, name);
        return statSync(full).isDirectory() ? walk(full) : [full];
    });
}

const hashOf = buf => createHash('sha256').update(buf).digest('hex').slice(0, 10);

function fingerprint(rel, buf) {
    const ext = extname(rel);
    const name = `${rel.slice(0, -ext.length)}.${hashOf(buf)}${ext}`;
    mkdirSync(dirname(join(dist, 'assets', name)), { recursive: true });
    writeFileSync(join(dist, 'assets', name), buf);
    return '/assets/' + name;
}

// 1. clean and copy files that keep stable URLs (CV, certificates, icons, verification files)
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(staticDir, dist, { recursive: true, filter: src => !src.startsWith(assetsDir) });

// 2. fingerprint assets: everything except CSS first, then CSS with rewritten url() references
const assetMap = {};
const files = walk(assetsDir).map(f => relative(assetsDir, f).split('\\').join('/'));
for (const rel of files.filter(f => !f.endsWith('.css'))) {
    assetMap[rel] = fingerprint(rel, readFileSync(join(assetsDir, rel)));
}
const inlineCss = {};
for (const rel of files.filter(f => f.endsWith('.css'))) {
    const css = readFileSync(join(assetsDir, rel), 'utf8').replace(/url\(["']?([^"')]+)["']?\)/g, (match, ref) => {
        if (/^(data:|https?:|#)/.test(ref)) return match;
        const target = posix.normalize(posix.join(posix.dirname(rel), ref));
        if (!assetMap[target]) throw new Error(`${rel}: unknown asset ${ref}`);
        return `url("${assetMap[target]}")`;
    });
    assetMap[rel] = fingerprint(rel, Buffer.from(css));
    inlineCss[rel] = css;
}

// The stylesheet is small, so pages inline it (one request less before the first paint).
function styles(rel) {
    if (!inlineCss[rel]) throw new Error(`Unknown stylesheet: ${rel}`);
    return inlineCss[rel].replace(/<\/style/gi, '<\\/style');
}

function asset(rel) {
    if (!assetMap[rel]) throw new Error(`Unknown asset: ${rel}`);
    return assetMap[rel];
}

// <picture> with WebP + JPEG; images live in static/assets/img/<base>-<width>.(webp|jpg)
function picture(base, { widths, width, height, sizes, alt, eager = false }) {
    const srcset = type => widths.map(w => `${asset(`img/${base}-${w}.${type}`)} ${w}w`).join(', ');
    const largest = widths[widths.length - 1];
    const loading = eager ? 'fetchpriority="high"' : 'loading="lazy" fetchpriority="low"';
    return `<picture>
                        <source type="image/webp" srcset="${srcset('webp')}" sizes="${sizes}">
                        <img src="${asset(`img/${base}-${largest}.jpg`)}" srcset="${srcset('jpg')}" sizes="${sizes}" width="${width}" height="${height}" alt="${attr(alt)}" ${loading} decoding="async">
                    </picture>`;
}

// Media of the freelance page (covers and screen recordings) are downloaded once with
// scripts/fetch-freelance-media.sh; stop with a clear message if any file is missing.
const missingMedia = [];
for (const c of Object.values(content)) {
    const f = c.freelance;
    if (!f) continue;
    for (const p of [...f.recent, ...f.early, ...f.also]) {
        if (p.cover && !['webp', 'jpg', 'png'].some(ext => assetMap[`img/work/${p.cover}.${ext}`])) missingMedia.push(`img/work/${p.cover}.(webp|jpg|png)`);
        for (const v of p.videos || []) if (!assetMap[`video/${v.file}`]) missingMedia.push(`video/${v.file}`);
    }
}
if (missingMedia.length) {
    throw new Error(`Missing media in static/assets/ (run scripts/fetch-freelance-media.sh):\n  ${[...new Set(missingMedia)].join('\n  ')}`);
}

// First existing variant of an image: img/work/name -> .webp, .jpg or .png
function findAsset(base) {
    for (const ext of ['webp', 'jpg', 'png']) if (assetMap[`${base}.${ext}`]) return assetMap[`${base}.${ext}`];
    throw new Error(`Unknown asset: ${base}.(webp|jpg|png)`);
}

// 3. pages
const [enLang, ruLang] = site.languages;
const pages = [
    { lang: enLang, alt: ruLang, c: content.en, out: 'index.html' },
    { lang: ruLang, alt: enLang, c: content.ru, out: 'ru/index.html' },
];
for (const p of pages) {
    const html = renderPage({ ...p, site, asset, picture, styles });
    if (html.includes(EM_DASH)) throw new Error(`${p.out} contains an em dash`);
    mkdirSync(dirname(join(dist, p.out)), { recursive: true });
    writeFileSync(join(dist, p.out), html);
}
for (const p of pages) {
    if (!p.c.freelance) continue;
    const out = p.out.replace(/index\.html$/, 'freelance/index.html');
    const html = renderFreelance({ ...p, site, asset, findAsset, picture, styles });
    if (html.includes(EM_DASH)) throw new Error(`${out} contains an em dash`);
    mkdirSync(dirname(join(dist, out)), { recursive: true });
    writeFileSync(join(dist, out), html);
}
writeFileSync(join(dist, '404.html'), render404({ en: content.en, ru: content.ru, asset, styles }));

// 4. sitemap and robots
const today = new Date().toISOString().slice(0, 10);
const sitemapPages = ['', 'freelance/'];
const alternates = sub => site.languages
    .map(l => `        <xhtml:link rel="alternate" hreflang="${l.code}" href="${site.domain}${l.path}${sub}"/>`)
    .concat(`        <xhtml:link rel="alternate" hreflang="x-default" href="${site.domain}/${sub}"/>`)
    .join('\n');
writeFileSync(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemapPages.flatMap(sub => site.languages.map(l => `    <url>
        <loc>${site.domain}${l.path}${sub}</loc>
        <lastmod>${today}</lastmod>
${alternates(sub)}
    </url>`)).join('\n')}
</urlset>
`);
writeFileSync(join(dist, 'robots.txt'), `User-agent: *
Disallow:

Sitemap: ${site.domain}/sitemap.xml
`);

const count = walk(dist).length;
console.log(`Built ${count} files into ${relative(root, dist)}/`);
if (!existsSync(join(dist, 'Buzumurga_Mikhail.pdf'))) console.warn('Warning: static/Buzumurga_Mikhail.pdf is missing');
