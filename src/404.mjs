// Bilingual 404 page.
import { esc } from './helpers.mjs';

export function render404({ en, ru, asset, styles }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>404 - ${esc(en.hero.name)}</title>
    <meta name="robots" content="noindex">
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <style>${styles('css/style.css')}</style>
    <script src="${asset('js/boot.js')}"></script>
</head>
<body>
    <main class="notfound">
        <p class="notfound__code">404</p>
        <div class="notfound__cols">
            <section>
                <h1>Page not found</h1>
                <p>This page doesn't exist or has been moved.</p>
                <a class="btn btn--solid" href="/">Go to homepage</a>
            </section>
            <section lang="ru">
                <h2>Страница не найдена</h2>
                <p>Такой страницы нет или она переехала.</p>
                <a class="btn" href="/ru/" hreflang="ru">На главную</a>
            </section>
        </div>
    </main>
</body>
</html>
`;
}
