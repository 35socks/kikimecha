/* LiveControl demo
   A small working model of the app: setlist, sections, loops, [STOP], mute/solo,
   performance view. Nothing here talks to a server. Time is fast-forwarded:
   one bar lasts one second. */
(function () {
  'use strict';

  var root = document.getElementById('demo');
  if (!root) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var BAR_MS = 1000;

  var SONGS = [
    { name: 'Opening', color: '#3B82F6', note: '',
      sections: [{ n: 'Intro', len: 4 }, { n: 'Build', len: 4 }, { n: 'Drop', len: 8 }] },
    { name: 'Midnight Drive', color: '#34C07A', note: 'Drop the bass for four bars before the chorus',
      sections: [{ n: 'Intro', len: 4 }, { n: 'Verse 1', len: 8 }, { n: 'Chorus', len: 8 }, { n: 'Verse 2', len: 8 }, { n: 'Outro', len: 4 }] },
    { name: 'Afterglow', color: '#F97316', note: 'Count in on kick drum only', stop: true,
      sections: [{ n: 'Intro', len: 4 }, { n: 'Verse', len: 8 }, { n: 'Chorus', len: 8 }] },
    { name: 'Static', color: '#EAB308', note: '',
      sections: [{ n: 'Intro', len: 4 }, { n: 'Verse', len: 8 }, { n: 'Chorus', len: 8 }, { n: 'Outro', len: 8, auto: true }] }
  ];

  var TRACKS = [
    { n: 'Drums', c: '#3B82F6' },
    { n: 'Bass', c: '#34C07A' },
    { n: 'Keys', c: '#F97316' },
    { n: 'Vocals', c: '#EAB308' }
  ];

  var TABS = [
    { id: 'set', label: 'Setlist' },
    { id: 'tracks', label: 'Tracks' },
    { id: 'perform', label: 'Perform' }
  ];

  var S = {
    song: 1, sec: 1, bar: 2,
    playing: !reduceMotion,
    loop: null,
    tab: 'set',
    open: 1,
    mute: TRACKS.map(function () { return false; }),
    solo: TRACKS.map(function () { return false; })
  };

  var ICON = function (name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>';
  };

  function key(si, ci) { return si + ':' + ci; }
  function totalBars(song) { return song.sections.reduce(function (a, s) { return a + s.len; }, 0); }

  function mk(tag, cls, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    return e;
  }

  /* ---------- Build the DOM once ---------- */

  root.textContent = '';

  var head = mk('div', 'd-head');
  var title = mk('span', 'd-title'); title.textContent = 'Friday Set';
  var conn = mk('span', 'd-status'); conn.textContent = 'Connected';
  head.appendChild(title); head.appendChild(conn);

  var now = mk('div', 'd-now');
  var nowSong = mk('div', 'd-song');
  var nowWhere = mk('div', 'd-where');
  var nowSec = mk('span'); var nowState = mk('span');
  nowWhere.appendChild(nowSec); nowWhere.appendChild(nowState);
  var nowSeg = mk('div', 'seg', { 'aria-hidden': 'true' });
  now.appendChild(nowSong); now.appendChild(nowWhere); now.appendChild(nowSeg);

  var tabsEl = mk('div', 'd-tabs', { role: 'tablist', 'aria-label': 'Views' });
  var tabBtns = TABS.map(function (t, i) {
    var b = mk('button', '', { type: 'button', role: 'tab', id: 'demo-tab-' + t.id, 'aria-controls': 'demo-panel-' + t.id, 'data-tab': t.id });
    b.textContent = t.label;
    tabsEl.appendChild(b);
    return b;
  });

  var views = mk('div', 'd-views');

  // Setlist
  var setPanel = mk('div', '', { role: 'tabpanel', id: 'demo-panel-set', 'aria-labelledby': 'demo-tab-set' });
  var songsEl = mk('ul', 'songs');
  var songEls = [], secEls = [];
  SONGS.forEach(function (song, i) {
    var li = mk('li', 'song'); li.style.setProperty('--c', song.color);
    var go = mk('button', 'song-go', { type: 'button', 'data-song': i, 'aria-expanded': 'false', 'aria-controls': 'demo-secs-' + i });
    var sw = mk('span', 'sw');
    var txt = mk('span');
    var nm = mk('span', 'song-name'); nm.textContent = song.name;
    txt.appendChild(nm);
    if (song.note) { var nt = mk('span', 'song-note'); nt.textContent = song.note; txt.appendChild(nt); }
    var meta = mk('span', 'song-meta');
    if (song.stop) { var st = mk('span', 'stoptag'); st.textContent = '[STOP]'; meta.appendChild(st); }
    var num = mk('span'); num.textContent = String(i + 1); meta.appendChild(num);
    go.appendChild(sw); go.appendChild(txt); go.appendChild(meta);

    var wrap = mk('div', 'secs-wrap');
    var ol = mk('ol', 'secs', { id: 'demo-secs-' + i });
    secEls[i] = [];
    song.sections.forEach(function (sec, c) {
      var row = mk('li', 'sec');
      var sgo = mk('button', 'sec-go', { type: 'button', 'data-song': i, 'data-sec': c });
      var left = mk('span'); left.textContent = sec.n;
      if (sec.auto) { var tg = mk('span', 'sec-tag'); tg.textContent = '+LOOP'; left.appendChild(tg); }
      var bars = mk('span', 'sec-bars'); bars.textContent = sec.len + ' bars';
      sgo.appendChild(left); sgo.appendChild(bars);
      var lp = mk('button', 'sec-loop', { type: 'button', 'data-loop-song': i, 'data-loop-sec': c, 'aria-pressed': 'false', 'aria-label': 'Loop ' + sec.n });
      lp.innerHTML = ICON('loop');
      row.appendChild(sgo); row.appendChild(lp);
      ol.appendChild(row);
      secEls[i][c] = { row: row, loop: lp };
    });
    wrap.appendChild(ol);
    li.appendChild(go); li.appendChild(wrap);
    songsEl.appendChild(li);
    songEls[i] = { li: li, go: go };
  });
  setPanel.appendChild(songsEl);

  // Tracks
  var trackPanel = mk('div', '', { role: 'tabpanel', id: 'demo-panel-tracks', 'aria-labelledby': 'demo-tab-tracks', hidden: '' });
  var tracksEl = mk('ul', 'tracks');
  var trackEls = TRACKS.map(function (t, i) {
    var li = mk('li', 'track');
    var sw = mk('span', 'sw'); sw.style.setProperty('--c', t.c);
    var nm = mk('span', 'track-name'); nm.textContent = t.n;
    var m = mk('button', 'ms mute', { type: 'button', 'data-mute': i, 'aria-pressed': 'false', 'aria-label': 'Mute ' + t.n });
    m.textContent = 'M';
    var s = mk('button', 'ms solo', { type: 'button', 'data-solo': i, 'aria-pressed': 'false', 'aria-label': 'Solo ' + t.n });
    s.textContent = 'S';
    li.appendChild(sw); li.appendChild(nm); li.appendChild(m); li.appendChild(s);
    tracksEl.appendChild(li);
    return { li: li, m: m, s: s };
  });
  var hint = mk('p', 'tracks-hint'); hint.textContent = 'Soloing a track silences the others.';
  trackPanel.appendChild(tracksEl); trackPanel.appendChild(hint);

  // Perform
  var perfPanel = mk('div', '', { role: 'tabpanel', id: 'demo-panel-perform', 'aria-labelledby': 'demo-tab-perform', hidden: '' });
  var perf = mk('div', 'perf');
  var perfSong = mk('div', 'perf-song');
  var perfSec = mk('div', 'perf-sec');
  var perfCount = mk('div', 'perf-count');
  var perfSeg = mk('div', 'seg', { 'aria-hidden': 'true' });
  var perfNext = mk('div', 'perf-next');
  var nextLbl = mk('span'); var nextName = mk('b');
  perfNext.appendChild(nextLbl); perfNext.appendChild(nextName);
  perf.appendChild(perfSong); perf.appendChild(perfSec); perf.appendChild(perfCount); perf.appendChild(perfSeg); perf.appendChild(perfNext);
  perfPanel.appendChild(perf);

  views.appendChild(setPanel); views.appendChild(trackPanel); views.appendChild(perfPanel);
  var panels = { set: setPanel, tracks: trackPanel, perform: perfPanel };

  // Transport
  var transport = mk('div', 'd-transport');
  function tbtn(act, label, icon, cls) {
    var b = mk('button', cls || '', { type: 'button', 'data-act': act, 'aria-label': label });
    b.innerHTML = ICON(icon);
    transport.appendChild(b);
    return b;
  }
  tbtn('prev', 'Previous song', 'prev');
  var playBtn = tbtn('play', 'Play', 'play', 'd-play');
  playBtn.setAttribute('aria-pressed', 'false');
  tbtn('stop', 'Stop', 'stop');
  tbtn('next', 'Next song', 'next');

  var live = mk('div', 'sr-only', { 'aria-live': 'polite' });

  [head, now, tabsEl, views, transport, live].forEach(function (n) { root.appendChild(n); });

  /* ---------- Model ---------- */

  function enter(si, ci) {
    S.song = si; S.sec = ci; S.bar = 0;
    var k = key(si, ci);
    if (SONGS[si].sections[ci].auto) S.loop = k;
    else if (S.loop !== k) S.loop = null;
  }

  function advance(bars) {
    S.bar += bars;
    var guard = 0;
    while (guard++ < 8) {
      var song = SONGS[S.song];
      var sec = song.sections[S.sec];
      if (S.bar < sec.len) break;
      var carry = S.bar - sec.len;
      if (S.loop === key(S.song, S.sec)) { S.bar = carry; continue; }
      if (S.sec + 1 < song.sections.length) {
        enter(S.song, S.sec + 1); S.bar = carry;
      } else if (S.song + 1 >= SONGS.length) {
        S.playing = false; enter(0, 0); S.open = 0; break;
      } else {
        var stopHere = song.stop;
        enter(S.song + 1, 0); S.open = S.song;
        if (stopHere) { S.playing = false; S.bar = 0; break; }
        S.bar = carry;
      }
    }
  }

  /* ---------- Rendering ---------- */

  var segBuilt = -1, segFills = [], segLast = [];
  var lastKey = '', firstRender = true;

  function buildSeg(song) {
    segFills = []; segLast = [];
    [nowSeg, perfSeg].forEach(function (host) {
      host.textContent = '';
      song.sections.forEach(function (s, idx) {
        var i = mk('i'); i.style.setProperty('--len', s.len);
        var b = mk('b'); i.appendChild(b); host.appendChild(i);
        (segFills[idx] = segFills[idx] || []).push(b);
      });
    });
  }

  function setF(el, v) { el.style.setProperty('--f', v.toFixed(3)); }

  function render() {
    var song = SONGS[S.song], sec = song.sections[S.sec], k = key(S.song, S.sec);
    var looping = S.loop === k;
    var barNum = Math.min(sec.len, Math.floor(S.bar) + 1);
    var frac = Math.min(1, S.bar / sec.len);
    var stateText = !S.playing ? 'Stopped' : (looping ? 'Looping' : 'Playing');

    root.style.setProperty('--song', song.color);

    nowSong.textContent = song.name;
    nowSec.textContent = sec.n + ', bar ' + barNum + ' of ' + sec.len;
    nowState.textContent = stateText;

    if (segBuilt !== S.song) { buildSeg(song); segBuilt = S.song; }
    song.sections.forEach(function (s, idx) {
      var v = idx < S.sec ? 1 : (idx === S.sec ? frac : 0);
      var r = Math.round(v * 200) / 200;
      if (segLast[idx] !== r) { segLast[idx] = r; segFills[idx].forEach(function (b) { setF(b, r); }); }
    });

    // Tabs
    TABS.forEach(function (t, i) {
      var on = S.tab === t.id;
      tabBtns[i].setAttribute('aria-selected', on ? 'true' : 'false');
      tabBtns[i].tabIndex = on ? 0 : -1;
      panels[t.id].hidden = !on;
    });
    now.hidden = S.tab === 'perform';

    // Setlist
    SONGS.forEach(function (sg, i) {
      var cur = i === S.song, open = i === S.open;
      songEls[i].li.classList.toggle('is-current', cur);
      songEls[i].li.classList.toggle('is-open', open);
      songEls[i].go.setAttribute('aria-expanded', open ? 'true' : 'false');
      sg.sections.forEach(function (s, c) {
        var e = secEls[i][c], isCur = cur && c === S.sec;
        e.row.classList.toggle('is-current', isCur);
        e.row.style.setProperty('--c', sg.color);
        e.row.style.setProperty('--f', isCur ? frac.toFixed(3) : '0');
        e.loop.setAttribute('aria-pressed', S.loop === key(i, c) ? 'true' : 'false');
      });
    });

    // Tracks
    var anySolo = S.solo.some(Boolean);
    trackEls.forEach(function (t, i) {
      t.m.setAttribute('aria-pressed', S.mute[i] ? 'true' : 'false');
      t.s.setAttribute('aria-pressed', S.solo[i] ? 'true' : 'false');
      var audible = !S.mute[i] && (!anySolo || S.solo[i]);
      t.li.classList.toggle('is-silent', !audible);
    });

    // Perform
    perfSong.textContent = song.name;
    perfSec.textContent = sec.n;
    perfCount.textContent = 'Bar ' + barNum + ' of ' + sec.len + (looping ? ', looping' : '');
    var nxt = SONGS[S.song + 1];
    if (looping) { nextLbl.textContent = 'Looping this section. Tap next to move on.'; nextName.textContent = ''; }
    else if (song.stop) { nextLbl.textContent = 'Stops at the end of this song. Up next: '; nextName.textContent = nxt ? nxt.name : 'end of set'; }
    else { nextLbl.textContent = 'Up next: '; nextName.textContent = nxt ? nxt.name : 'end of set'; }

    // Transport
    playBtn.setAttribute('aria-pressed', S.playing ? 'true' : 'false');

    // Screen reader announcement when the position changes
    var kk = k + (S.playing ? 'p' : 's');
    if (kk !== lastKey) {
      if (!firstRender) live.textContent = song.name + ', ' + sec.n + (S.playing ? '' : ', stopped');
      lastKey = kk;
    }
    firstRender = false;
  }

  function reveal(i) {
    window.setTimeout(function () {
      if (S.tab !== 'set') return;
      var li = songEls[i].li, vr = views.getBoundingClientRect(), r = li.getBoundingClientRect();
      if (r.top < vr.top) views.scrollTop -= vr.top - r.top + 8;
      else if (r.bottom > vr.bottom) views.scrollTop += r.bottom - vr.bottom + 8;
    }, 260);
  }

  /* ---------- Actions ---------- */

  function act(fn) {
    var before = S.song;
    fn();
    render();
    if (S.song !== before || S.open === S.song) reveal(S.song);
  }

  function goSong(i) {
    if (S.song === i) S.open = S.open === i ? -1 : i;
    else { enter(i, 0); S.open = i; }
  }
  function goSec(i, c) { enter(i, c); S.open = i; }
  function toggleLoop(i, c) {
    var k = key(i, c);
    if (S.loop === k) { S.loop = null; return; }
    if (!(S.song === i && S.sec === c)) enter(i, c);
    S.loop = k; S.open = i;
  }
  function prev() {
    if (S.sec > 0 || S.bar >= 2 || S.song === 0) enter(S.song, 0);
    else enter(S.song - 1, 0);
    S.open = S.song;
  }
  function next() {
    if (S.song < SONGS.length - 1) { enter(S.song + 1, 0); S.open = S.song; }
  }

  root.addEventListener('click', function (e) {
    var t = e.target.closest('button');
    if (!t || !root.contains(t)) return;

    if (t.hasAttribute('data-tab')) { S.tab = t.getAttribute('data-tab'); render(); return; }
    if (t.hasAttribute('data-loop-song')) { act(function () { toggleLoop(+t.getAttribute('data-loop-song'), +t.getAttribute('data-loop-sec')); }); return; }
    if (t.hasAttribute('data-sec')) { act(function () { goSec(+t.getAttribute('data-song'), +t.getAttribute('data-sec')); }); return; }
    if (t.hasAttribute('data-song')) { act(function () { goSong(+t.getAttribute('data-song')); }); return; }
    if (t.hasAttribute('data-mute')) { var m = +t.getAttribute('data-mute'); S.mute[m] = !S.mute[m]; render(); return; }
    if (t.hasAttribute('data-solo')) { var s = +t.getAttribute('data-solo'); S.solo[s] = !S.solo[s]; render(); return; }

    switch (t.getAttribute('data-act')) {
      case 'play': S.playing = true; render(); break;
      case 'stop': S.playing = false; render(); break;
      case 'prev': act(prev); break;
      case 'next': act(next); break;
    }
  });

  tabsEl.addEventListener('keydown', function (e) {
    var i = TABS.findIndex(function (t) { return t.id === S.tab; });
    var n = TABS.length, to = -1;
    if (e.key === 'ArrowRight') to = (i + 1) % n;
    else if (e.key === 'ArrowLeft') to = (i - 1 + n) % n;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = n - 1;
    if (to < 0) return;
    e.preventDefault();
    S.tab = TABS[to].id; render(); tabBtns[to].focus();
  });

  /* ---------- Clock ---------- */

  var timer = null, last = 0;
  function tick() {
    var t = performance.now(), dt = Math.min(t - last, 300);
    last = t;
    if (S.playing && !document.hidden) { var before = S.song; advance(dt / BAR_MS); if (S.song !== before) reveal(S.song); }
    render();
  }
  function start() { if (timer) return; last = performance.now(); timer = window.setInterval(tick, 100); }
  function stop() { if (!timer) return; window.clearInterval(timer); timer = null; }

  render();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) start(); else stop(); });
    }, { threshold: 0.05 }).observe(root);
  } else {
    start();
  }
})();
