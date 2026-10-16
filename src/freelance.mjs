// "Freelance web work" page: websites built alongside the corporate career (2017-2025).
// One template for both languages; texts live in content/*.json under "freelance".
// Covers live in static/assets/img/work/ (rendered by scripts/covers.mjs), screen recordings in static/assets/video/.
import { esc, md, attr, ext, ICON_LINKS, breadcrumbs } from './helpers.mjs';

export function renderFreelance({ c, site, lang, alt, asset, findAsset, picture, styles }) {
    const f = c.freelance;
    const home = lang.path;
    const path = lang.path + 'freelance/';
    const altPath = alt.path + 'freelance/';
    const url = site.domain + path;
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'CollectionPage',
                name: f.meta.title,
                description: f.meta.description,
                inLanguage: lang.code,
                url,
                author: { '@type': 'Person', name: c.hero.name, url: site.domain + '/' },
            },
            breadcrumbs([[c.hero.name, site.domain + home], [f.heading.replace(/\*/g, '').replace(/\.$/, ''), url]]),
        ],
    };
    const nav = [
        ['about', c.ui.nav.about],
        ['experience', c.ui.nav.experience],
        ['work', c.ui.nav.work],
        ['education', c.ui.nav.education],
        ['testimonials', c.ui.nav.testimonials],
        ['contact', c.ui.nav.contact],
    ];

    const cover = p => {
        if (p.picture) {
            return picture(p.picture, { widths: [640], width: 640, height: 640, sizes: '(max-width: 640px) 100vw, 560px', alt: p.alt });
        }
        const src = findAsset(`img/work/${p.cover}`);
        return `<img src="${src}" alt="${attr(p.alt)}" width="1200" height="900" loading="lazy" decoding="async">`;
    };

    const playButton = (p, small = false) => {
        if (!p.videos || !p.videos.length) return '';
        const list = p.videos.map(v => ({ src: asset(`video/${v.file}`), label: v.label }));
        const count = list.length > 1 ? `<span class="play__count">${list.length}</span>` : '';
        return `<button class="play${small ? ' play--small' : ''}" type="button" data-videos="${attr(JSON.stringify(list))}" data-title="${attr(p.title)}" aria-label="${attr(`${f.watch}: ${p.title}`)}"><span class="play__icon" aria-hidden="true"></span>${esc(f.watch)}${count}</button>`;
    };

    const siteLink = p => p.live && p.href
        ? `<a class="work-link" href="${attr(p.href)}"${ext}>${esc(p.domain)}</a>`
        : `<span class="work-link work-link--dead">${esc(p.domain)}</span>`;

    const status = p => `<span class="status${p.live ? '' : ' status--closed'}">${esc(p.live ? f.live : f.closed)}</span>`;

    const card = p => `                    <article class="card work-card reveal">
                        <div class="work-card__img">
                            ${cover(p)}
                            ${playButton(p)}
                        </div>
                        <p class="work-card__meta"><span>${esc(p.meta)}</span><span>${esc(p.year)}</span></p>
                        <h3>${esc(p.title)}</h3>
                        <p>${md(p.text)}</p>
                        <ul class="chips work-card__tags">${p.tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
                        <div class="work-card__foot">${siteLink(p)}${status(p)}</div>
                    </article>`;

    const row = p => `                    <li class="work-row">
                        <span class="work-row__year">${esc(p.year)}</span>
                        <span class="work-row__main"><strong>${esc(p.title)}</strong><span>${esc(p.text)}${p.place ? ` · ${esc(p.place)}` : ''}</span></span>
                        <span class="work-row__end">${siteLink(p)}${playButton(p, true)}</span>
                    </li>`;

    return `<!DOCTYPE html>
<html lang="${lang.code}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(f.meta.title)}</title>
    <meta name="description" content="${attr(f.meta.description)}">
    <meta name="author" content="${attr(c.hero.name)}">
    <link rel="canonical" href="${url}">
${site.languages.map(l => `    <link rel="alternate" hreflang="${l.code}" href="${site.domain}${l.path}freelance/">`).join('\n')}
    <link rel="alternate" hreflang="x-default" href="${site.domain}/freelance/">
    <meta name="theme-color" content="#f6f3ee" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#121111" media="(prefers-color-scheme: dark)">

    <meta property="og:type" content="website">
    <meta property="og:url" content="${url}">
    <meta property="og:site_name" content="buzumurga.com">
    <meta property="og:title" content="${attr(f.meta.title)}">
    <meta property="og:description" content="${attr(f.meta.ogDescription)}">
    <meta property="og:locale" content="${lang.locale}">
    <meta property="og:locale:alternate" content="${alt.locale}">
    <meta property="og:image" content="${site.domain}${c.meta.ogImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${attr(c.meta.ogImageAlt)}">
    <meta name="twitter:card" content="summary_large_image">

${ICON_LINKS}

    <link rel="preload" href="${asset(`fonts/montserrat-${lang.code === 'ru' ? 'cyrillic' : 'latin'}-400-normal.woff2`)}" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="${asset('fonts/montserrat-latin-800-normal.woff2')}" as="font" type="font/woff2" crossorigin>
    <style>${styles('css/style.css')}</style>
    <script src="${asset('js/boot.js')}" data-metrika="${site.metrikaId}"></script>
    <script src="${asset('js/main.js')}" defer></script>
    <script src="${asset('js/freelance.js')}" defer></script>
    <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
</head>

<body data-lang="${lang.code}">
    <noscript><div><img src="https://mc.yandex.ru/watch/${site.metrikaId}" style="position:absolute; left:-9999px;" alt=""></div></noscript>
    <a class="skip-link" href="#main">${esc(c.ui.skip)}</a>

    <header class="header">
        <div class="container header__inner">
            <a class="logo" href="${home}">
                <span class="logo__mark" aria-hidden="true">MB</span>
                <span class="logo__name">${esc(c.hero.name)}</span>
            </a>

            <nav class="nav" id="nav" aria-label="${attr(c.ui.mainNav)}">
${nav.map(([id, label]) => `                <a href="${home}#${id}">${esc(label)}</a>`).join('\n')}
            </nav>

            <div class="header__actions">
                <a class="lang-switch" href="${altPath}" hreflang="${alt.code}" lang="${alt.code}" data-lang-switch title="${attr(c.ui.langSwitch)}">
                    <span class="lang-switch__cur" aria-hidden="true">${lang.label}</span><span class="lang-switch__sep" aria-hidden="true">/</span><span>${alt.label}</span>
                    <span class="sr-only">${esc(c.ui.langSwitch)}</span>
                </a>
                <button class="icon-btn theme-toggle" type="button" aria-label="${attr(c.ui.theme)}">
                    <svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
                    <svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 1.5v3M12 19.5v3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M1.5 12h3M19.5 12h3M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/></svg>
                </button>
                <a class="btn btn--small btn--solid header__cv" href="${site.cv}" target="_blank" rel="noopener">${esc(c.ui.downloadCv)}</a>
                <button class="icon-btn menu-toggle" type="button" aria-label="${attr(c.ui.menuOpen)}" data-label-open="${attr(c.ui.menuOpen)}" data-label-close="${attr(c.ui.menuClose)}" aria-expanded="false" aria-controls="nav">
                    <span></span><span></span><span></span>
                </button>
            </div>
        </div>
    </header>

    <main id="main">

        <section class="hero work-hero" id="top">
            <div class="container">
                <a class="work-back" href="${home}#work">&larr; ${esc(f.back)}</a>
                <p class="eyebrow">${esc(f.eyebrow)}</p>
                <h1 class="work-hero__title">${md(f.heading)}</h1>
                <p class="work-hero__intro">${md(f.intro)}</p>
                <ul class="stats">
${f.stats.map(s => `                    <li><strong data-count="${parseInt(s.value, 10)}" data-suffix="">${esc(s.value)}</strong><span>${esc(s.label)}</span></li>`).join('\n')}
                </ul>
            </div>
        </section>

        <section class="section section--alt" id="recent">
            <div class="container">
                <div class="section__head reveal">
                    <p class="eyebrow">${esc(f.recentEyebrow)}</p>
                    <h2>${esc(f.recentHeading)}</h2>
                </div>
                <div class="work-grid">
${f.recent.map(card).join('\n')}
                </div>
            </div>
        </section>

${f.ownProduct ? `        <section class="section section--tight" id="own-product">
            <div class="container">
                <div class="section__head reveal">
                    <p class="eyebrow">${esc(f.ownProduct.eyebrow)}</p>
                    <h2>${esc(f.ownProduct.heading)}</h2>
                </div>
                <article class="card own-product reveal">
                    <p class="work-card__meta"><span>${esc(f.ownProduct.meta)}</span></p>
                    <h3>${esc(f.ownProduct.title)}</h3>
                    <p>${md(f.ownProduct.text)}</p>
                </article>
            </div>
        </section>

` : ''}        <section class="section${f.ownProduct ? ' section--alt' : ''}" id="extra-flow">
            <div class="container">
                <div class="section__head reveal">
                    <p class="eyebrow">${esc(f.earlyEyebrow)}</p>
                    <h2>${esc(f.earlyHeading)}</h2>
                    <p class="muted section__intro">${md(f.youtube)}</p>
                </div>
                <div class="work-grid">
${f.early.map(card).join('\n')}
                </div>
                <h3 class="subhead reveal">${esc(f.alsoHeading)}</h3>
                <ul class="work-rows reveal">
${f.also.map(row).join('\n')}
                </ul>
            </div>
        </section>

        <section class="section${f.ownProduct ? '' : ' section--alt'}" id="lessons">
            <div class="container">
                <div class="section__head reveal">
                    <p class="eyebrow">${esc(f.lessonsEyebrow)}</p>
                    <h2>${esc(f.lessonsHeading)}</h2>
                </div>
                <div class="cards">
${f.lessons.map((l, i) => `                    <article class="card reveal">
                        <span class="card__num">${String(i + 1).padStart(2, '0')}</span>
                        <h3>${esc(l.title)}</h3>
                        <p>${md(l.text)}</p>
                    </article>`).join('\n')}
                </div>
            </div>
        </section>
    </main>

    <dialog class="player" id="player" aria-labelledby="player-title" data-missing="${attr(f.missing)}">
        <div class="player__head">
            <h2 class="player__title" id="player-title">${esc(f.watch)}</h2>
            <button class="chip-btn player__close" type="button">${esc(f.close)}</button>
        </div>
        <div class="player__body"></div>
    </dialog>

    <footer class="footer">
        <div class="container footer__inner">
            <p>&copy; <span data-year>${new Date().getFullYear()}</span> ${esc(c.ui.footer)}</p>
            <a href="#top" class="footer__top">${esc(c.ui.backToTop)} &uarr;</a>
        </div>
    </footer>
</body>
</html>
`;
}
