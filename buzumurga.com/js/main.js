(function () {
    'use strict';

    var root = document.documentElement;
    root.classList.add('js');

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

    // header shadow on scroll
    var header = document.querySelector('.header');
    function onScroll() {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // mobile menu
    var menuBtn = document.querySelector('.menu-toggle');
    var nav = document.getElementById('nav');

    function setMenu(open) {
        nav.classList.toggle('is-open', open);
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    menuBtn.addEventListener('click', function () {
        setMenu(!nav.classList.contains('is-open'));
    });
    nav.addEventListener('click', function (e) {
        if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') setMenu(false);
    });

    // reveal on scroll, active nav link, counters
    var navLinks = Array.prototype.slice.call(nav.querySelectorAll('a'));

    if ('IntersectionObserver' in window) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                entry.target.querySelectorAll('[data-count]').forEach(countUp);
                revealObserver.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

        document.querySelectorAll('.reveal').forEach(function (el) {
            revealObserver.observe(el);
        });

        var sectionObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                navLinks.forEach(function (a) {
                    a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });

        document.querySelectorAll('main section[id]').forEach(function (s) {
            sectionObserver.observe(s);
        });
    } else {
        document.querySelectorAll('.reveal').forEach(function (el) {
            el.classList.add('is-visible');
        });
    }

    function countUp(el) {
        var target = parseInt(el.dataset.count, 10);
        var suffix = el.dataset.suffix || '';
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        var start = null;
        var duration = 1400;
        function step(ts) {
            if (!start) start = ts;
            var p = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    // contact form
    var form = document.getElementById('contact-form');
    if (form) {
        var status = form.querySelector('.form__status');
        var submitBtn = form.querySelector('button[type="submit"]');

        function setStatus(text, type) {
            status.textContent = text;
            status.className = 'form__status' + (type ? ' is-' + type : '');
        }

        function validate() {
            var ok = true;
            form.querySelectorAll('input[required], textarea[required]').forEach(function (field) {
                var valid = field.checkValidity();
                field.closest('.field').classList.toggle('is-invalid', !valid);
                if (!valid && ok) {
                    field.focus();
                    ok = false;
                }
            });
            return ok;
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validate()) {
                setStatus('Please fill in your name, a valid email and a message of at least 15 characters.', 'error');
                return;
            }

            submitBtn.disabled = true;
            setStatus('Sending...');

            fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: { 'Accept': 'application/json' }
            })
                .then(function (res) {
                    return res.json().catch(function () { return { ok: false }; });
                })
                .then(function (data) {
                    if (data.ok) {
                        form.reset();
                        setStatus('Thank you! Your message has been sent.', 'ok');
                        if (typeof window.ym === 'function') window.ym(80111218, 'reachGoal', 'contact_form');
                    } else {
                        setStatus(data.error || 'Something went wrong. Please email me directly.', 'error');
                    }
                })
                .catch(function () {
                    setStatus('Network error. Please email me at buzumurga.m@gmail.com.', 'error');
                })
                .then(function () {
                    submitBtn.disabled = false;
                });
        });

        form.addEventListener('input', function (e) {
            var field = e.target.closest('.field');
            if (field && field.classList.contains('is-invalid') && e.target.checkValidity()) {
                field.classList.remove('is-invalid');
            }
        });
    }

    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
})();
