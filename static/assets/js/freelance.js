// Freelance page: plays the screen recordings of a project in a dialog.
// Each "Watch" button carries its recordings in data-videos: [{ "src": "...", "label": "..." }].
(function () {
    'use strict';

    var dialog = document.getElementById('player');
    if (!dialog || typeof dialog.showModal !== 'function') {
        document.querySelectorAll('.play').forEach(function (btn) { btn.hidden = true; });
        return;
    }
    var body = dialog.querySelector('.player__body');
    var title = dialog.querySelector('.player__title');
    var missing = dialog.dataset.missing;
    var opener = null;

    function clear() {
        body.querySelectorAll('video').forEach(function (v) {
            v.pause();
            v.removeAttribute('src');
            v.load();
        });
        body.textContent = '';
    }

    function open(btn) {
        var list = [];
        try { list = JSON.parse(btn.dataset.videos); } catch (e) { return; }
        clear();
        opener = btn;
        title.textContent = btn.dataset.title;
        body.classList.toggle('player__body--multi', list.length > 1);
        list.forEach(function (item, i) {
            var fig = document.createElement('figure');
            var video = document.createElement('video');
            video.controls = true;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = 'metadata';
            video.src = item.src;
            video.addEventListener('error', function () {
                var p = document.createElement('p');
                p.className = 'player__missing';
                p.textContent = missing;
                fig.replaceChild(p, video);
            });
            var cap = document.createElement('figcaption');
            cap.textContent = item.label;
            fig.appendChild(video);
            fig.appendChild(cap);
            body.appendChild(fig);
            if (i === 0) {
                var playing = video.play();
                if (playing && playing.catch) playing.catch(function () {});
            }
        });
        dialog.showModal();
    }

    function close() {
        clear();
        dialog.close();
        if (opener) opener.focus();
    }

    document.querySelectorAll('.play').forEach(function (btn) {
        btn.addEventListener('click', function () { open(btn); });
    });
    dialog.querySelector('.player__close').addEventListener('click', close);
    dialog.addEventListener('click', function (e) { if (e.target === dialog) close(); });
    dialog.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
})();
