// Runs in <head> before the first paint: theme, .js flag and Yandex.Metrica.
(function () {
    var root = document.documentElement;
    root.classList.add('js');
    try {
        var theme = localStorage.getItem('theme');
        if (theme) root.dataset.theme = theme;
    } catch (e) {}

    var script = document.currentScript;
    var id = script && Number(script.getAttribute('data-metrika'));
    if (!id) return;
    (function (m, e, t, r, i, k, a) {
        m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
        m[i].l = 1 * new Date();
        k = e.createElement(t); a = e.getElementsByTagName(t)[0];
        k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(id, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
    window.METRIKA_ID = id;
})();
