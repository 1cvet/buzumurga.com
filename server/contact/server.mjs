#!/usr/bin/env node
// Contact form endpoint for buzumurga.com: POST /api/contact -> Telegram message.
// No dependencies, Node 18+. Listens on 127.0.0.1 only; Nginx proxies to it.
//
// Environment (see contact.env.example):
//   TELEGRAM_BOT_TOKEN  token of a dedicated bot (not the Kypito bot)
//   TELEGRAM_CHAT_ID    chat that receives the messages
//   HOST, PORT          listen address, default 127.0.0.1:8787
//   MIN_FILL_SECONDS    minimum time between page load and submit, default 3
import { createServer } from 'node:http';

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 8787);
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const TELEGRAM_API = process.env.TELEGRAM_API || 'https://api.telegram.org';
const MIN_FILL_MS = Number(process.env.MIN_FILL_SECONDS || 3) * 1000;
const MAX_BODY = 32 * 1024;

const LIMITS = { name: [2, 100], email: [3, 200], subject: [0, 200], message: [15, 5000] };
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;

// Second line of defence after Nginx limit_req: 5 messages per IP per 10 minutes.
const WINDOW_MS = 10 * 60 * 1000;
const PER_WINDOW = 5;
const hits = new Map();
function rateLimited(ip) {
    const now = Date.now();
    const list = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
    list.push(now);
    hits.set(ip, list);
    if (hits.size > 10000) hits.clear();
    return list.length > PER_WINDOW;
}

const PAGES = {
    en: { home: '/', ok: 'Thank you! Your message has been sent.', error: 'The message could not be sent. Please try again later.', invalid: 'Please fill in your name, a valid email and a message of at least 15 characters.', back: 'Back to the site' },
    ru: { home: '/ru/', ok: 'Спасибо! Сообщение отправлено.', error: 'Не удалось отправить сообщение. Попробуйте позже.', invalid: 'Укажите имя, корректный email и сообщение не короче 15 символов.', back: 'Вернуться на сайт' },
};

const escHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const oneLine = s => s.replace(/[\r\n\t]+/g, ' ').trim();

function reply(req, res, status, key, lang) {
    const wantsJson = (req.headers.accept || '').includes('application/json');
    if (wantsJson) {
        res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({ ok: key === 'ok', error: key === 'ok' ? null : key }));
        return;
    }
    // Plain form post (JavaScript disabled): a small page in the language of the form.
    const t = PAGES[lang] || PAGES.en;
    const text = t[key] || t.error;
    res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(`<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${escHtml(text)}</title></head>` +
        `<body style="font:18px/1.6 system-ui,sans-serif;max-width:560px;margin:15vh auto;padding:0 20px"><p>${escHtml(text)}</p><p><a href="${t.home}#contact">${escHtml(t.back)}</a></p></body></html>`);
}

async function sendTelegram(text) {
    const res = await fetch(`${TELEGRAM_API}/bot${TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // plain text on purpose: no parse_mode, so user input cannot inject markup
        body: JSON.stringify({ chat_id: CHAT_ID, text, disable_web_page_preview: true }),
        signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Telegram API ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let size = 0;
        const chunks = [];
        req.on('data', chunk => {
            size += chunk.length;
            if (size > MAX_BODY) { reject(Object.assign(new Error('too large'), { status: 413 })); req.destroy(); return; }
            chunks.push(chunk);
        });
        req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        req.on('error', reject);
    });
}

const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/healthz') {
        res.writeHead(200, { 'Content-Type': 'text/plain' }).end('ok');
        return;
    }
    if (url.pathname !== '/api/contact') { res.writeHead(404).end(); return; }
    if (req.method !== 'POST') { res.writeHead(405, { Allow: 'POST' }).end(); return; }

    let lang = 'en';
    try {
        const type = req.headers['content-type'] || '';
        if (!type.startsWith('application/x-www-form-urlencoded')) return reply(req, res, 415, 'error', lang);

        const form = new URLSearchParams(await readBody(req));
        lang = form.get('lang') === 'ru' ? 'ru' : 'en';
        const ip = req.headers['x-real-ip'] || req.socket.remoteAddress || '-';

        // bots: hidden field filled or the form sent too fast -> pretend success, send nothing
        const ts = Number(form.get('ts') || 0);
        if ((form.get('website') || '') !== '' || (ts && Date.now() - ts < MIN_FILL_MS)) {
            return reply(req, res, 200, 'ok', lang);
        }

        const data = {};
        for (const [field, [min, max]] of Object.entries(LIMITS)) {
            const value = (form.get(field) || '').trim();
            if (value.length < min || value.length > max) return reply(req, res, 422, 'invalid', lang);
            data[field] = field === 'message' ? value : oneLine(value);
        }
        if (!EMAIL_RE.test(data.email)) return reply(req, res, 422, 'invalid', lang);

        if (rateLimited(ip)) return reply(req, res, 429, 'error', lang);

        await sendTelegram([
            'New message from buzumurga.com' + (lang === 'ru' ? ' (RU)' : ''),
            '',
            `Name: ${data.name}`,
            `Email: ${data.email}`,
            data.subject ? `Subject: ${data.subject}` : null,
            '',
            data.message,
            '',
            `IP: ${ip}`,
        ].filter(line => line !== null).join('\n').slice(0, 4000));

        return reply(req, res, 200, 'ok', lang);
    } catch (err) {
        console.error(new Date().toISOString(), err.message);
        return reply(req, res, err.status || 500, 'error', lang);
    }
});

if (!TOKEN || !CHAT_ID) {
    console.error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set');
    process.exit(1);
}
server.listen(PORT, HOST, () => console.log(`buzumurga-contact listening on http://${HOST}:${PORT}`));
