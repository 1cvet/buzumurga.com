#!/usr/bin/env node
// Renders the project covers for /freelance/ in one style: the site in a browser window on the page background.
// Live sites are screenshotted fresh; closed ones use a saved image (`from`). Output: static/assets/img/work/<name>.jpg
// Dev-only helper: needs Playwright (`npx playwright` / a global install), like scripts/og.mjs.
// Run after adding a project or when a site changed: node scripts/covers.mjs [name ...]
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch {
    playwright = require(join(execSync('npm root -g').toString().trim(), 'playwright'));
}

// name -> live url to screenshot, or a saved image for closed sites; `domain` is shown in the address bar,
// `hide` lists overlays (cookie banners, chat widgets) to remove before the screenshot
const projects = {
    cardinals: { domain: 'cardinals.law', url: 'https://cardinals.law/', hide: '#cl-cc-banner, #cl-cc-modal' },
    christicrazycake: { domain: 'christicrazycake.com', url: 'https://christicrazycake.com/' },
    prodaykv23: { domain: 'prodaykv23.ru', url: 'https://prodaykv23.ru/', hide: '.bazz-widget' },
    myidem: { domain: 'myidem.moscow', from: 'static/assets/img/myidem-640.jpg' },
};

const W = 1200, H = 900;              // cover size, matches the 4:3 card image
const VIEW = { width: 1366, height: 1000 }; // desktop viewport for screenshots
const dataUrl = (buf, type) => `data:${type};base64,${buf.toString('base64')}`;
const font = readFileSync(join(root, 'static/assets/fonts/montserrat-latin-600-normal.woff2'));

const frame = (shot, domain) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @font-face { font-family: "Montserrat"; font-weight: 600; src: url("${dataUrl(font, 'font/woff2')}"); }
    * { box-sizing: border-box; margin: 0; }
    body { width: ${W}px; height: ${H}px; overflow: hidden; background: #efeae2; font-family: "Montserrat", sans-serif; }
    body::before { content: ""; position: absolute; inset: 0; background: radial-gradient(120% 90% at 85% 100%, rgba(155, 34, 38, .14), transparent 60%); }
    .win { position: absolute; left: 90px; right: 90px; top: 90px; bottom: -40px; border-radius: 18px 18px 0 0; overflow: hidden;
           background: #fff; box-shadow: 0 30px 80px rgba(40, 25, 15, .22), 0 0 0 1px rgba(40, 25, 15, .08); }
    .bar { display: flex; align-items: center; gap: 10px; height: 54px; padding: 0 22px; background: #f6f3ee; border-bottom: 1px solid #ddd5ca; }
    .bar i { width: 13px; height: 13px; border-radius: 50%; background: #d8cfc3; }
    .url { flex: 1; margin: 0 40px 0 26px; height: 32px; border-radius: 16px; background: #fff; border: 1px solid #ddd5ca;
           display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 600; color: #6b625a; letter-spacing: .01em; }
    .shot { display: block; width: 100%; height: calc(100% - 54px); object-fit: cover; object-position: top center; }
</style></head><body>
    <div class="win"><div class="bar"><i></i><i></i><i></i><div class="url">${domain}</div></div><img class="shot" src="${shot}"></div>
</body></html>`;

const only = process.argv.slice(2);
const browser = await playwright.chromium.launch();
try {
    for (const [name, p] of Object.entries(projects)) {
        if (only.length && !only.includes(name)) continue;
        let shot;
        if (p.url) {
            const page = await browser.newPage({ viewport: VIEW });
            await page.goto(p.url, { waitUntil: 'networkidle', timeout: 60000 });
            await page.waitForTimeout(2500); // hero animations, lazy images
            if (p.hide) await page.addStyleTag({ content: `${p.hide} { display: none !important; }` });
            shot = dataUrl(await page.screenshot({ type: 'png' }), 'image/png');
            await page.close();
        } else {
            shot = dataUrl(readFileSync(join(root, p.from)), 'image/jpeg');
        }
        const page = await browser.newPage({ viewport: { width: W, height: H } });
        await page.setContent(frame(shot, p.domain), { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        const out = join(root, `static/assets/img/work/${name}.jpg`);
        await page.screenshot({ path: out, type: 'jpeg', quality: 82 });
        await page.close();
        console.log('ok   ', out.slice(root.length + 1));
    }
} finally {
    await browser.close();
}
