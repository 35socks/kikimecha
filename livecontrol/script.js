(function () {
  'use strict';

  var REPO = '35socks/LiveControl';

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) { return null; }
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? resolve() : reject(); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }

  function flash(btn, text) {
    var old = btn.getAttribute('data-label') || btn.textContent;
    btn.setAttribute('data-label', old);
    btn.textContent = text;
    window.clearTimeout(btn._t);
    btn._t = window.setTimeout(function () { btn.textContent = old; }, 1600);
  }

  /* ---------- Platform ---------- */

  var ua = navigator.userAgent || '';
  var plat = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  var isTouch = /iPhone|iPad|iPod|Android/i.test(ua) || (/Mac/i.test(plat) && navigator.maxTouchPoints > 1);
  var isMac = /Mac/i.test(plat) && !isTouch;
  var isWin = /Win/i.test(plat);

  if (!isMac) {
    var msg = isTouch
      ? 'You’re on a phone or tablet. LiveControl runs on the Mac that runs Ableton Live, and this device only needs a browser. Copy the link to open it on your Mac.'
      : 'LiveControl is a Mac app. Copy the link to open it on your Mac.';
    $$('[data-not-mac]').forEach(function (box) {
      $('[data-not-mac-text]', box).textContent = msg;
      box.hidden = false;
    });
  }

  $$('[data-copy-link]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var href = ($('[data-download]') || {}).href || '';
      copyText(href).then(function () { flash(btn, 'Link copied'); }, function () { flash(btn, 'Copy failed'); });
    });
  });

  /* ---------- Latest release ---------- */

  function applyRelease(rel) {
    var asset = (rel.assets || []).filter(function (a) { return /\.zip$/i.test(a.name); })[0];
    if (!asset) return;
    var ver = String(rel.tag_name || '').replace(/^v/i, '');
    if (ver) $$('[data-version]').forEach(function (n) { n.textContent = 'Version ' + ver; });
    if (asset.size) {
      var mb = (asset.size / 1048576).toFixed(asset.size > 10485760 ? 0 : 1);
      $$('[data-size]').forEach(function (n) { n.textContent = ', ' + mb + ' MB'; });
    }
    $$('[data-download]').forEach(function (a) { a.href = asset.browser_download_url; });
    if (rel.html_url) $$('[data-release]').forEach(function (a) { a.href = rel.html_url; });
  }

  (function loadRelease() {
    if (!window.fetch) return;
    var cacheKey = 'lc-release-v1', cached = store(cacheKey);
    if (cached) {
      try {
        var c = JSON.parse(cached);
        if (c && Date.now() - c.at < 36e5) { applyRelease(c.rel); return; }
      } catch (e) { /* ignore a bad cache */ }
    }
    var ctrl = window.AbortController ? new AbortController() : null;
    var timeout = window.setTimeout(function () { if (ctrl) ctrl.abort(); }, 4000);
    fetch('https://api.github.com/repos/' + REPO + '/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (rel) {
        window.clearTimeout(timeout);
        applyRelease(rel);
        store(cacheKey, JSON.stringify({ at: Date.now(), rel: { tag_name: rel.tag_name, html_url: rel.html_url, assets: (rel.assets || []).map(function (a) { return { name: a.name, size: a.size, browser_download_url: a.browser_download_url }; }) } }));
      })
      .catch(function () { /* the links in the page already point at a working release */ });
  })();

  /* ---------- Scroll playhead and current section ---------- */

  (function playhead() {
    var bar = $('#bar'), ticking = false;
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty('--p', max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)).toFixed(4) : 0);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();

    var links = $$('.bar-links a');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var a = map[en.target.id];
        if (a) a.setAttribute('aria-current', 'location');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  })();

  /* ---------- Copy buttons ---------- */

  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var src = $(btn.getAttribute('data-copy'));
      if (!src) return;
      copyText(src.textContent).then(function () { flash(btn, 'Copied'); }, function () { flash(btn, 'Copy failed'); });
    });
  });

  /* ---------- Setup tabs ---------- */

  (function tabs() {
    var list = $('.tabs');
    if (!list) return;
    var tabs = $$('[role="tab"]', list);

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        $('#' + t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var to = -1;
        if (e.key === 'ArrowRight') to = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') to = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') to = 0;
        else if (e.key === 'End') to = tabs.length - 1;
        if (to < 0) return;
        e.preventDefault(); select(tabs[to], true);
      });
    });

    if (isWin) select($('#tab-win'));
  })();

  /* ---------- Setup checklist (saved in this browser) ---------- */

  (function checklist() {
    var boxes = $$('#checks input[type="checkbox"]');
    if (!boxes.length) return;
    var KEY = 'lc-setup-v1';
    var out = $('#progress'), reset = $('#reset-checks');

    try {
      var saved = JSON.parse(store(KEY) || '[]');
      boxes.forEach(function (b, i) { b.checked = !!saved[i]; });
    } catch (e) { /* start empty */ }

    function sync(persist) {
      var done = boxes.filter(function (b) { return b.checked; }).length;
      out.textContent = done === boxes.length
        ? 'All done. Open LiveControl and scan the QR code.'
        : done + ' of ' + boxes.length + ' done';
      reset.hidden = done === 0;
      if (persist) store(KEY, JSON.stringify(boxes.map(function (b) { return b.checked; })));
    }

    boxes.forEach(function (b) { b.addEventListener('change', function () { sync(true); }); });
    reset.addEventListener('click', function () {
      boxes.forEach(function (b) { b.checked = false; });
      sync(true);
    });
    sync(false);
  })();

  /* ---------- FAQ deep links ---------- */

  function openFromHash() {
    var id = window.location.hash.slice(1);
    var d = id && document.getElementById(id);
    if (d && d.tagName === 'DETAILS') { d.open = true; }
  }
  window.addEventListener('hashchange', openFromHash);
  openFromHash();
})();
