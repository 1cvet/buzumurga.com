// Page template. One template for every language; text lives in content/*.json.
import { esc, md, attr, ext, initials, obfuscate } from './helpers.mjs';

export function renderPage({ c, site, lang, alt, asset, picture, styles }) {
    const url = site.domain + lang.path;
    const nav = [
        ['about', c.ui.nav.about],
        ['experience', c.ui.nav.experience],
        ['work', c.ui.nav.work],
        ['education', c.ui.nav.education],
        ['testimonials', c.ui.nav.testimonials],
        ['contact', c.ui.nav.contact],
    ];
    const visibleTestimonials = 3;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        url,
        inLanguage: lang.code,
        name: c.meta.title,
        mainEntity: {
            '@type': 'Person',
            name: c.hero.name,
            alternateName: lang.code === 'en' ? 'Михаил Бузумурга' : 'Mikhail Buzumurga',
            jobTitle: c.experience.jobs[0].title,
            worksFor: { '@type': 'Organization', name: c.experience.jobs[0].company },
            address: { '@type': 'PostalAddress', addressLocality: lang.code === 'en' ? 'Dubai' : 'Дубай', addressCountry: 'AE' },
            email: 'mailto:' + site.email,
            url: site.domain + '/',
            image: site.domain + c.meta.ogImage,
            alumniOf: { '@type': 'CollegeOrUniversity', name: 'National University of Science and Technology MISIS' },
            knowsLanguage: ['ru', 'en'],
            sameAs: [site.linkedin, site.telegram],
        },
    };

    return `<!DOCTYPE html>
<html lang="${lang.code}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(c.meta.title)}</title>
    <meta name="description" content="${attr(c.meta.description)}">
    <meta name="author" content="${attr(c.hero.name)}">
    <link rel="canonical" href="${url}">
${site.languages.map(l => `    <link rel="alternate" hreflang="${l.code}" href="${site.domain}${l.path}">`).join('\n')}
    <link rel="alternate" hreflang="x-default" href="${site.domain}/">
    <meta name="theme-color" content="#f6f3ee" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#121111" media="(prefers-color-scheme: dark)">

    <meta property="og:type" content="profile">
    <meta property="og:url" content="${url}">
    <meta property="og:site_name" content="buzumurga.com">
    <meta property="og:title" content="${attr(c.meta.ogTitle)}">
    <meta property="og:description" content="${attr(c.meta.ogDescription)}">
    <meta property="og:locale" content="${lang.locale}">
    <meta property="og:locale:alternate" content="${alt.locale}">
    <meta property="og:image" content="${site.domain}${c.meta.ogImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${attr(c.meta.ogImageAlt)}">
    <meta name="twitter:card" content="summary_large_image">

    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">

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
            <a class="logo" href="#top">
                <span class="logo__mark" aria-hidden="true">MB</span>
                <span class="logo__name">${esc(c.hero.name)}</span>
            </a>

            <nav class="nav" id="nav" aria-label="${attr(c.ui.mainNav)}">
${nav.map(([id, label]) => `                <a href="#${id}">${esc(label)}</a>`).join('\n')}
            </nav>

            <div class="header__actions">
                <a class="lang-switch" href="${alt.path}" hreflang="${alt.code}" lang="${alt.code}" data-lang-switch title="${attr(c.ui.langSwitch)}">
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

        <section class="hero" id="top">
            <div class="container hero__inner">
                <div class="hero__text">
                    <h1 class="hero__title">
                        <span class="hero__name">${esc(c.hero.name)}</span>
                        <span class="hero__role">${md(c.hero.title)}</span>
                        <span class="hero__loc">${esc(c.hero.location)}</span>
                    </h1>
                    <p class="hero__subtitle">${md(c.hero.subtitle)}</p>
                    <p class="hero__intro">${md(c.hero.intro)}</p>
                    <div class="hero__cta">
                        <a class="btn btn--solid" href="#contact">${esc(c.hero.cta)}</a>
                        <a class="btn" href="${site.cv}" target="_blank" rel="noopener">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0-5-5m5 5 5-5M4 21h16"/></svg>
                            ${esc(c.ui.downloadCvLong)}
                        </a>
                    </div>
                </div>
                <div class="hero__photo">
                    ${picture('portrait', { widths: [280, 360, 563], width: 563, height: 751, sizes: '(max-width: 900px) 220px, 360px', alt: c.hero.photoAlt, eager: true })}
                </div>
            </div>
            <div class="container">
                <ul class="stats">
${c.hero.stats.map(s => `                    <li><strong${/^\d+/.test(s.value) ? ` data-count="${parseInt(s.value, 10)}" data-suffix="${attr(s.value.replace(/^\d+/, ''))}"` : ''}>${esc(s.value)}</strong><span>${esc(s.label)}</span></li>`).join('\n')}
                </ul>
            </div>
        </section>

        <section class="section" id="about">
            <div class="container grid-about">
                <div class="about__media reveal">
                    ${picture('speaking', { widths: [480, 680, 838], width: 838, height: 1047, sizes: '(max-width: 900px) 100vw, 400px', alt: c.about.photoAlt })}
                </div>
                <div class="about reveal">
                    <p class="eyebrow">${esc(c.about.eyebrow)}</p>
                    <h2>${md(c.about.heading)}</h2>
${c.about.paragraphs.map((p, i) => `                    <p${i === 0 ? ' class="lead"' : ''}>${md(p)}</p>`).join('\n')}
                    <dl class="facts">
${c.about.facts.map(f => `                        <div><dt>${esc(f.term)}</dt><dd>${esc(f.value)}</dd></div>`).join('\n')}
                    </dl>
                </div>
            </div>
            <div class="container">
                <div class="tools reveal">
                    <h3>${esc(c.about.toolsHeading)}</h3>
                    <div class="tools__grid">
${c.about.tools.map(g => `                        <div class="tools__group">
                            <h4>${esc(g.name)}</h4>
                            <ul class="chips">${g.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
                        </div>`).join('\n')}
                    </div>
                </div>
            </div>
        </section>

        <section class="section section--alt" id="experience">
            <div class="container">
                <div class="section__head reveal">
                    <p class="eyebrow">${esc(c.experience.eyebrow)}</p>
                    <h2>${esc(c.experience.heading)}</h2>
                </div>
                <ol class="timeline">
${c.experience.jobs.map(j => `                    <li class="job reveal">
                        <div class="job__meta">
                            <span class="job__date">${esc(j.date)}</span>
                            <span class="job__place">${esc(j.place)}</span>
                        </div>
                        <div class="job__body">
                            <h3>${esc(j.title)}</h3>
                            <p class="job__company">${esc(j.company)}</p>
                            <ul>
${j.bullets.map(b => `                                <li>${md(b)}</li>`).join('\n')}
                            </ul>${j.more ? `
                            <details class="more">
                                <summary>${esc(c.experience.more)}</summary>
                                <ul>
${j.more.map(b => `                                    <li>${md(b)}</li>`).join('\n')}
                                </ul>
                            </details>` : ''}
                        </div>
                    </li>`).join('\n')}
                </ol>
            </div>
        </section>

        <section class="section" id="work">
            <div class="container">
                <div class="section__head reveal">
                    <p class="eyebrow">${esc(c.work.eyebrow)}</p>
                    <h2>${esc(c.work.heading)}</h2>
                </div>

                <article class="featured reveal">
                    <div class="featured__head">
                        <span class="featured__label">${esc(c.work.featured.label)}</span>
                        <h3>${esc(c.work.featured.title)}</h3>
                        <p class="featured__meta">${esc(c.work.featured.meta)}</p>
                    </div>
                    <ul class="featured__list">
${c.work.featured.bullets.map(b => `                        <li>${md(b)}</li>`).join('\n')}
                    </ul>
                    <a class="card__link" href="${attr(c.work.featured.link.href)}"${ext}>${esc(c.work.featured.link.label)}</a>
                </article>

                <h3 class="subhead reveal">${esc(c.work.casesHeading)}</h3>
                <div class="cards">
${c.work.cases.map((p, i) => `                    <article class="card reveal">
                        <span class="card__num">${String(i + 1).padStart(2, '0')}</span>
                        <h4>${esc(p.title)}</h4>
                        <p class="card__role">${esc(p.role)}</p>
                        <p>${md(p.text)}</p>${p.link ? `
                        <a class="card__link" href="${attr(p.link.href)}"${ext}>${esc(p.link.label)}</a>` : ''}
                    </article>`).join('\n')}
                </div>

                <h3 class="subhead reveal">${esc(c.work.sideHeading)}</h3>
                <div class="cards cards--side">
${c.work.side.map(p => `                    <article class="card card--side reveal">${p.image ? `
                        <div class="card__img">${picture(p.image.base, { widths: [p.image.width], width: p.image.width, height: p.image.height, sizes: '(max-width: 640px) 100vw, 360px', alt: p.image.alt })}</div>` : ''}
                        <h4>${esc(p.title)}</h4>
                        <p>${md(p.text)}</p>${p.link ? `
                        <a class="card__link" href="${attr(p.link.href)}"${ext}>${esc(p.link.label)}</a>` : ''}
                    </article>`).join('\n')}
                </div>
${site.SHOW_KYPITO ? `
                <article class="kypito reveal">
                    <h3>${esc(c.work.kypito.title)}</h3>
                    <p>${md(c.work.kypito.text)}</p>
                </article>` : ''}
            </div>
        </section>

        <section class="section section--alt" id="education">
            <div class="container grid-2">
                <div class="reveal">
                    <div class="section__head">
                        <p class="eyebrow">${esc(c.education.eyebrow)}</p>
                        <h2>${esc(c.education.heading)}</h2>
                    </div>
                    <ul class="edu">
${c.education.items.map(e => `                        <li>
                            <span class="edu__year">${esc(e.year)}</span>
                            <div><strong>${esc(e.title)}</strong><span>${esc(e.place)}</span></div>
                        </li>`).join('\n')}
                    </ul>
                </div>
                <div class="reveal">
                    <h3 class="certs__title">${esc(c.education.certsHeading)}</h3>
                    <ul class="certs">
${c.education.certs.map(x => `                        <li><a href="${attr(x.href)}" target="_blank" rel="noopener"><strong>${esc(x.title)}</strong><span>${esc(x.meta)}</span></a></li>`).join('\n')}
                        <li>
                            <details class="certs__more">
                                <summary>${esc(c.education.sololearn.label)}</summary>
                                <span class="chips chips--links">${c.education.sololearn.items.map(x => `<a href="${attr(x.href)}" target="_blank" rel="noopener">${esc(x.title)}</a>`).join('')}</span>
                            </details>
                        </li>
                    </ul>
                </div>
            </div>
        </section>

        <section class="section" id="testimonials">
            <div class="container">
                <div class="section__head reveal">
                    <p class="eyebrow">${esc(c.testimonials.eyebrow)}</p>
                    <h2>${esc(c.testimonials.heading)}</h2>${c.testimonials.note ? `
                    <p class="muted section__intro">${esc(c.testimonials.note)}</p>` : ''}
                </div>
                <div class="quotes" id="quotes">
${c.testimonials.items.map((t, i) => `                    <figure class="quote${i >= visibleTestimonials ? ' quote--extra' : ''}${i < visibleTestimonials ? ' reveal' : ''}">
                        <blockquote><p>${md(t.quote)}</p></blockquote>
                        <figcaption>
                            ${t.photo
                                ? `<img src="${asset('img/' + t.photo)}" alt="" width="48" height="48" loading="lazy" decoding="async">`
                                : `<span class="quote__avatar" aria-hidden="true">${esc(initials(t.name))}</span>`}
                            <span class="quote__who"><strong>${esc(t.name)}</strong><span>${esc(t.role)}</span><em>${esc(t.context)}</em></span>
                        </figcaption>
                    </figure>`).join('\n')}
                </div>
                <div class="quotes__actions">
                    <button class="btn quotes__toggle" type="button" aria-expanded="false" aria-controls="quotes" data-more="${attr(c.testimonials.showMore)}" data-less="${attr(c.testimonials.showLess)}" hidden>${esc(c.testimonials.showMore)}</button>
                    <a class="card__link" href="${attr(site.linkedin)}"${ext}>${esc(c.testimonials.linkedin)}</a>
                </div>
            </div>
        </section>

        <section class="section section--dark" id="contact">
            <div class="container grid-2">
                <div class="reveal">
                    <div class="section__head">
                        <p class="eyebrow">${esc(c.contact.eyebrow)}</p>
                        <h2>${esc(c.contact.heading)}</h2>
                    </div>
                    <p class="lead">${esc(c.contact.lead)}</p>
                </div>

                <ul class="contacts reveal">
                    <li>
                        <span class="contacts__label">${esc(c.contact.emailLabel)}</span>
                        <span class="email" data-e="${obfuscate(site.email)}">
                            <span class="email__addr">${esc(c.contact.emailHidden)}</span>
                            <span class="email__actions" hidden>
                                <button class="chip-btn" type="button" data-copy data-copied="${attr(c.contact.copied)}">${esc(c.contact.copy)}</button>
                                <a class="chip-btn" data-mailto href="#contact">${esc(c.contact.write)}</a>
                            </span>
                        </span>
                    </li>
                    <li>
                        <span class="contacts__label">${esc(c.contact.telegramLabel)}</span>
                        <a href="${attr(site.telegram)}"${ext}>${esc(site.telegramHandle)}</a>
                    </li>
                    <li>
                        <span class="contacts__label">${esc(c.contact.linkedinLabel)}</span>
                        <a href="${attr(site.linkedin)}"${ext}>linkedin.com/in/m-buzumurga</a>
                    </li>
                    <li>
                        <span class="contacts__label">${esc(c.contact.locationLabel)}</span>
                        <span>${esc(c.contact.location)}</span>
                    </li>
                </ul>
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
