#!/usr/bin/env node
// Renders the Open Graph images static/og-en.jpg and static/og-ru.jpg (1200x630).
// Dev-only helper: needs Playwright (`npx playwright` / a global install) and ImageMagick.
// Run after changing the name, title or portrait: node scripts/og.mjs
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch {
    playwright = require(join(execSync('npm root -g').toString().trim(), 'playwright'));
}

const portrait = pathToFileURL(join(root, 'static/assets/img/portrait-563.jpg')).href;
const font = name => pathToFileURL(join(root, 'static/assets/fonts', name)).href;
const content = lang => JSON.parse(readFileSync(join(root, `content/${lang}.json`), 'utf8'));

function page(lang) {
    const c = content(lang);
    const sans = '"Montserrat", sans-serif';
    const serif = '"Libre Baskerville", serif';
    const [before, accent, after] = c.hero.title.split('*');
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        @font-face { font-family: "Montserrat"; font-weight: 600; src: url("${font('montserrat-latin-600-normal.woff2')}"); }
        @font-face { font-family: "Montserrat"; font-weight: 600; src: url("${font('montserrat-cyrillic-600-normal.woff2')}"); unicode-range: U+0400-045F; }
        @font-face { font-family: "Montserrat"; font-weight: 800; src: url("${font('montserrat-latin-800-normal.woff2')}"); }
        @font-face { font-family: "Montserrat"; font-weight: 800; src: url("${font('montserrat-cyrillic-800-normal.woff2')}"); unicode-range: U+0400-045F; }
        @font-face { font-family: "Libre Baskerville"; font-style: italic; src: url("${font('librebaskerville-italic-webfont.woff2')}"); }
        * { margin: 0; box-sizing: border-box; }
        body { width: 1200px; height: 630px; display: flex; background: #f6f3ee; color: #1c1a19; font-family: ${sans}; }
        .text { flex: 1; padding: 72px 64px 64px 80px; display: flex; flex-direction: column; justify-content: center; }
        .name { font-size: 26px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: #9b2226; }
        .role { margin-top: 18px; font-size: 92px; font-weight: 800; line-height: 1.02; letter-spacing: -.035em; }
        .role em { font-family: ${serif}; font-style: italic; font-weight: 400; color: #9b2226; letter-spacing: -.02em; }
        .loc { margin-top: 22px; font-size: 34px; font-weight: 600; color: #625c57; }
        .site { margin-top: auto; font-size: 24px; font-weight: 600; color: #625c57; }
        .photo { width: 430px; height: 630px; background: url("${portrait}") 50% 18% / cover no-repeat; }
    </style></head><body>
        <div class="text">
            <div class="name">${c.hero.name}</div>
            <div class="role">${before}<em>${accent}</em>${after}</div>
            <div class="loc">${c.hero.location}</div>
            <div class="site">buzumurga.com</div>
        </div>
        <div class="photo"></div>
    </body></html>`;
}

const browser = await playwright.chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const lang of ['en', 'ru']) {
    const tmpHtml = join(root, `.og-${lang}.html`);
    const tmpPng = join(root, `.og-${lang}.png`);
    writeFileSync(tmpHtml, page(lang));
    await tab.goto(pathToFileURL(tmpHtml).href);
    await tab.evaluate(() => document.fonts.ready);
    await tab.screenshot({ path: tmpPng });
    execSync(`convert "${tmpPng}" -strip -quality 85 "${join(root, `static/og-${lang}.jpg`)}"`);
    rmSync(tmpHtml); rmSync(tmpPng);
    console.log(`static/og-${lang}.jpg`);
}
await browser.close();
