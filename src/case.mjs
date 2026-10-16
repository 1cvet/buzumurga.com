// "Ploom.ae D2C launch" case study page: /work/ploom/ and /ru/work/ploom/.
// One template for both languages; texts live in content/*.json under "ploomCase".
// Quotes are reused from "testimonials" (the ones whose context mentions Ploom).
import { esc, md, attr, ext, initials, ICON_LINKS, breadcrumbs } from './helpers.mjs';

export const CASE_PATH = 'work/ploom/';

export function renderCase({ c, site, lang, alt, asset, styles }) {
    const k = c.ploomCase;
    const home = lang.path;
    const path = lang.path + CASE_PATH;
    const altPath = alt.path + CASE_PATH;
    const url = site.domain + path;
    const nav = [
        ['about', c.ui.nav.about],
        ['experience', c.ui.nav.experience],
        ['work', c.ui.nav.work],
        ['education', c.ui.nav.education],
        ['testimonials', c.ui.nav.testimonials],
        ['contact', c.ui.nav.contact],
    ];
    const quotes = c.testimonials.items.filter(t => /ploom/i.test(t.context));

    const headline = k.heading.replace(/\*/g, '');
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Article',
                headline,
                description: k.meta.description,
                inLanguage: lang.code,
                url,
                mainEntityOfPage: url,
                image: site.domain + c.meta.ogImage,
                author: { '@type': 'Person', name: c.hero.name, url: site.domain + '/' },
                about: { '@type': 'WebSite', name: 'ploom.ae', url: 'https://www.ploom.ae/' },
            },
            breadcrumbs([[c.hero.name, site.domain + home], [headline.replace(/\.$/, ''), url]]),
        ],
    };

    return `<!DOCTYPE html>
<html lang="${lang.code}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(k.meta.title)}</title>
    <meta name="description" content="${attr(k.meta.description)}">
    <meta name="author" content="${attr(c.hero.name)}">
    <link rel="canonical" href="${url}">
${site.languages.map(l => `    <link rel="alternate" hreflang="${l.code}" href="${site.domain}${l.path}${CASE_PATH}">`).join('\n')}
    <link rel="alternate" hreflang="x-default" href="${site.domain}/${CASE_PATH}">
    <meta name="theme-color" content="#f6f3ee" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#121111" media="(prefers-color-scheme: dark)">

    <meta property="og:type" content="article">
    <meta property="og:url" content="${url}">
    <meta property="og:site_name" content="buzumurga.com">
    <meta property="og:title" content="${attr(k.meta.title)}">
    <meta property="og:description" content="${attr(k.meta.ogDescription)}">
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
                <a class="work-back" href="${home}#work">&larr; ${esc(k.back)}</a>
                <p class="eyebrow">${esc(k.eyebrow)}</p>
                <h1 class="work-hero__title">${md(k.heading)}</h1>
                <p class="case-meta">${esc(k.byline)}</p>
                <p class="work-hero__intro">${md(k.intro)}</p>
                <ul class="stats">
${k.stats.map(s => `                    <li><strong${/^\d+$/.test(s.value) ? ` data-count="${parseInt(s.value, 10)}" data-suffix=""` : ''}>${esc(s.value)}</strong><span>${esc(s.label)}</span></li>`).join('\n')}
                </ul>
            </div>
        </section>

        <section class="section section--alt" id="setup">
            <div class="container grid-2">
                <div class="section__head reveal">
                    <p class="eyebrow">${esc(k.setup.eyebrow)}</p>
                    <h2 class="case-h2">${md(k.setup.heading)}</h2>
                </div>
                <div class="reveal">
${k.setup.paragraphs.map((p, i) => `                    <p${i === 0 ? ' class="lead"' : ''}>${md(p)}</p>`).join('\n')}
                    <ul class="chips case-parties">${k.setup.parties.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
                </div>
            </div>
        </section>

        <section class="section" id="what-i-did">
            <div class="container">
                <div class="section__head reveal">
                    <p class="eyebrow">${esc(k.done.eyebrow)}</p>
                    <h2 class="case-h2">${md(k.done.heading)}</h2>
                </div>
                <div class="cards">
${k.done.items.map((d, i) => `                    <article class="card reveal">
                        <span class="card__num">${String(i + 1).padStart(2, '0')}</span>
                        <h3 class="case-card__title">${esc(d.title)}</h3>
                        <p>${md(d.text)}</p>
                    </article>`).join('\n')}
                </div>

                <h3 class="subhead reveal">${esc(k.flow.heading)}</h3>
                <ol class="flow reveal">
${k.flow.steps.map(s => `                    <li class="flow__step">
                        <span class="flow__label">${esc(s.label)}</span>
                        <strong>${esc(s.value)}</strong>
                        <span class="flow__note">${esc(s.note)}</span>
                    </li>`).join('\n')}
                </ol>
            </div>
        </section>

        <section class="section section--alt" id="beyond">
            <div class="container grid-2">
                <div class="section__head reveal">
                    <p class="eyebrow">${esc(k.beyond.eyebrow)}</p>
                    <h2 class="case-h2">${md(k.beyond.heading)}</h2>
                    <p class="muted section__intro">${md(k.beyond.intro)}</p>
                </div>
                <div class="reveal">
                    <ul class="checks">
${k.beyond.items.map(b => `                        <li>${md(b)}</li>`).join('\n')}
                    </ul>
                    <p class="case-note">${md(k.beyond.note)}</p>
                </div>
            </div>
        </section>

        <section class="section" id="result">
            <div class="container">
                <div class="section__head reveal">
                    <p class="eyebrow">${esc(k.result.eyebrow)}</p>
                    <h2 class="case-h2">${md(k.result.heading)}</h2>
                    <p class="lead section__intro case-result">${md(k.result.text)}</p>
                </div>
                <h3 class="subhead reveal">${esc(k.result.quotesHeading)}</h3>
                <div class="quotes">
${quotes.map(t => `                    <figure class="quote reveal">
                        <blockquote><p>${md(t.quote)}</p></blockquote>
                        <figcaption>
                            <span class="quote__avatar" aria-hidden="true">${esc(initials(t.name))}</span>
                            <span class="quote__who"><strong>${esc(t.name)}</strong><span>${esc(t.role)}</span></span>
                        </figcaption>
                    </figure>`).join('\n')}
                </div>
                <div class="hero__cta case-cta reveal">
                    <a class="btn btn--solid" href="${home}#contact">${esc(k.cta.contact)}</a>
                    <a class="btn" href="${site.cv}" target="_blank" rel="noopener">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-5-5m5 5 5-5M4 21h16"/></svg>
                        ${esc(c.ui.downloadCvLong)}
                    </a>
                    <a class="card__link" href="https://www.ploom.ae/en"${ext}>${esc(k.cta.visit)}</a>
                </div>
            </div>
        </section>
    </main>

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
