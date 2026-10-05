(function () {
    'use strict';

    var root = document.documentElement;

    // theme toggle
    var themeBtn = document.querySelector('.theme-toggle');
    var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    function isDark() {
        var t = root.dataset.theme;
        return t ? t === 'dark' : darkQuery.matches;
    }
    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            var next = isDark() ? 'light' : 'dark';
            root.dataset.theme = next;
            try { localStorage.setItem('theme', next); } catch (e) {}
        });
    }

    // header border on scroll
    var header = document.querySelector('.header');
    function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // mobile menu
    var menuBtn = document.querySelector('.menu-toggle');
    var nav = document.getElementById('nav');
    function setMenu(open) {
        nav.classList.toggle('is-open', open);
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', open ? menuBtn.dataset.labelClose : menuBtn.dataset.labelOpen);
    }
    menuBtn.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('is-open')) {
            setMenu(false);
            menuBtn.focus();
        }
    });

    // language switch keeps the current section
    var currentSection = '';
    var langSwitch = document.querySelector('[data-lang-switch]');
    function updateLangLink() {
        if (!langSwitch) return;
        var base = langSwitch.getAttribute('href').split('#')[0];
        var hash = currentSection || location.hash.slice(1);
        langSwitch.setAttribute('href', hash && hash !== 'top' ? base + '#' + hash : base);
    }

    // reveal on scroll, active nav link, counters
    var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a'));
    if ('IntersectionObserver' in window) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
        document.querySelectorAll('.reveal').forEach(function (el) { revealObserver.observe(el); });

        var sectionObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                currentSection = entry.target.id;
                navLinks.forEach(function (a) {
                    a.classList.toggle('is-active', a.getAttribute('href') === '#' + currentSection);
                });
                updateLangLink();
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        document.querySelectorAll('main section[id]').forEach(function (s) { sectionObserver.observe(s); });
    } else {
        document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
    }
    updateLangLink();

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('[data-count]').forEach(function (el) {
        if (reduceMotion || !('IntersectionObserver' in window)) return;
        var target = parseInt(el.dataset.count, 10);
        var suffix = el.dataset.suffix || '';
        var io = new IntersectionObserver(function (entries) {
            if (!entries[0].isIntersecting) return;
            io.disconnect();
            var start = null;
            function step(ts) {
                if (!start) start = ts;
                var p = Math.min((ts - start) / 1200, 1);
                el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
                if (p < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        });
        io.observe(el);
    });

    // testimonials: show more / less
    var quotes = document.getElementById('quotes');
    var quotesBtn = document.querySelector('.quotes__toggle');
    if (quotes && quotesBtn && quotes.querySelector('.quote--extra')) {
        quotesBtn.hidden = false;
        quotesBtn.addEventListener('click', function () {
            var open = !quotes.classList.contains('is-expanded');
            quotes.classList.toggle('is-expanded', open);
            quotesBtn.setAttribute('aria-expanded', String(open));
            quotesBtn.textContent = open ? quotesBtn.dataset.less : quotesBtn.dataset.more;
            if (open) {
                var first = quotes.querySelector('.quote--extra');
                first.setAttribute('tabindex', '-1');
                first.focus({ preventScroll: true });
            }
        });
    }

    // email: decoded on the client, never present in the HTML as plain text
    document.querySelectorAll('[data-e]').forEach(function (box) {
        var email;
        try { email = atob(box.dataset.e).split('').reverse().join(''); } catch (e) { return; }
        var addr = box.querySelector('.email__addr');
        var actions = box.querySelector('.email__actions');
        addr.textContent = email;
        actions.hidden = false;
        actions.querySelector('[data-mailto]').href = 'mailto:' + email;
        var copyBtn = actions.querySelector('[data-copy]');
        var label = copyBtn.textContent;
        copyBtn.addEventListener('click', function () {
            var done = function () {
                copyBtn.textContent = copyBtn.dataset.copied;
                setTimeout(function () { copyBtn.textContent = label; }, 2000);
            };
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(email).then(done, function () { selectText(addr); });
            } else {
                selectText(addr);
            }
        });
    });
    function selectText(node) {
        var range = document.createRange();
        range.selectNodeContents(node);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    // contact form
    var form = document.getElementById('contact-form');
    if (form) {
        var status = form.querySelector('.form__status');
        var submitBtn = form.querySelector('button[type="submit"]');
        var msg = form.dataset;
        form.elements.ts.value = String(Date.now());

        var setStatus = function (text, type) {
            status.textContent = text;
            status.className = 'form__status' + (type ? ' is-' + type : '');
        };

        var validate = function () {
            var firstInvalid = null;
            form.querySelectorAll('input[required], textarea[required]').forEach(function (field) {
                var valid = field.value.trim().length > 0 && field.checkValidity();
                field.closest('.field').classList.toggle('is-invalid', !valid);
                field.setAttribute('aria-invalid', String(!valid));
                if (!valid && !firstInvalid) firstInvalid = field;
            });
            if (firstInvalid) firstInvalid.focus();
            return !firstInvalid;
        };

        form.setAttribute('novalidate', '');
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validate()) {
                setStatus(msg.msgInvalid, 'error');
                return;
            }
            submitBtn.disabled = true;
            setStatus(msg.msgSending);

            fetch(form.action, {
                method: 'POST',
                body: new URLSearchParams(new FormData(form)),
                headers: { 'Accept': 'application/json' }
            })
                .then(function (res) {
                    return res.json().catch(function () { return {}; }).then(function (data) {
                        return { status: res.status, data: data };
                    });
                })
                .then(function (r) {
                    if (r.data.ok) {
                        form.reset();
                        form.elements.ts.value = String(Date.now());
                        setStatus(msg.msgOk, 'ok');
                        if (typeof window.ym === 'function' && window.METRIKA_ID) window.ym(window.METRIKA_ID, 'reachGoal', 'contact_form');
                    } else if (r.status === 429) {
                        setStatus(msg.msgToomany, 'error');
                    } else if (r.status === 422) {
                        setStatus(msg.msgInvalid, 'error');
                    } else {
                        setStatus(msg.msgError, 'error');
                    }
                })
                .catch(function () { setStatus(msg.msgNetwork, 'error'); })
                .then(function () { submitBtn.disabled = false; });
        });

        form.addEventListener('input', function (e) {
            var field = e.target.closest('.field');
            if (field && field.classList.contains('is-invalid') && e.target.checkValidity()) {
                field.classList.remove('is-invalid');
                e.target.removeAttribute('aria-invalid');
            }
        });
    }

    var year = document.querySelector('[data-year]');
    if (year) year.textContent = new Date().getFullYear();
})();
