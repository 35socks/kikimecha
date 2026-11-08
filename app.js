/* ============================================================
   kikimecha.com — app.js
   1. Icons
   2. Render helpers
   3. Content registry (ITEMS)  ← add projects here
   4. Departments
   5. Launcher rendering
   6. Window manager
   7. Global listeners & clock
   ============================================================ */

(function () {
  'use strict';

  /* ── 1. ICONS ──────────────────────────────────────────────
     20×20 viewBox, stroke-based, minimalist. Add new glyphs here
     and reference them with `icon:'name'` in ITEMS.             */
  const svg = (paths) =>
    `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.25"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

  const ICONS = {
    sliders: svg(`<path d="M2.5 6h6.2M13.4 6h4.1M2.5 14h3.9M9.9 14h7.6"/>
                  <circle cx="11.1" cy="6" r="1.6"/><circle cx="7.6" cy="14" r="1.6"/>`),
    vault:   svg(`<rect x="2.5" y="2.5" width="6" height="6"/><rect x="11.5" y="2.5" width="6" height="6"/>
                  <rect x="2.5" y="11.5" width="6" height="6"/><rect x="11.5" y="11.5" width="6" height="6"/>`),
    pen:     svg(`<path d="M3 17l1.2-4.2L13.4 3.6l3 3L7.2 15.8 3 17z"/><path d="M11.6 5.4l3 3"/>`),
    faders:  svg(`<path d="M5 3v14M10 3v14M15 3v14"/>
                  <rect x="3.3" y="6" width="3.4" height="2.6" rx=".4"/>
                  <rect x="8.3" y="11" width="3.4" height="2.6" rx=".4"/>
                  <rect x="13.3" y="4.5" width="3.4" height="2.6" rx=".4"/>`),
    wave:    svg(`<path d="M2.6 10h1.6M7 5v10M11 2.5v15M15 6.5v7M18.4 10H17"/>`),
    house:   svg(`<path d="M2.6 9.4 10 3l7.4 6.4V17H2.6z"/><path d="M8.4 12.4l3.2 1.9-3.2 1.9z"/>`),
    film:    svg(`<rect x="2.5" y="4" width="15" height="12" rx="1"/>
                  <path d="M6.5 4v12M13.5 4v12M2.5 8.2h4M2.5 11.8h4M13.5 8.2h4M13.5 11.8h4"/>`),
    layers:  svg(`<rect x="2.5" y="2.5" width="9" height="9"/><rect x="8.5" y="8.5" width="9" height="9"/>`),
    image:   svg(`<rect x="2.5" y="4" width="15" height="12" rx="1"/>
                  <path d="M2.5 13.2l4.2-4 2.6 2.6L13 8.2l4.5 4.3"/>
                  <circle cx="6.6" cy="7.4" r="1.1"/>`),
    id:      svg(`<circle cx="10" cy="10" r="7.2"/><path d="M10 9.2v5M10 6.3v.3"/>`)
  };

  /* ── 2. RENDER HELPERS ─────────────────────────────────── */
  const ph  = (t) => `<span class="ph">${t}</span>`;
  const pill = (label, tone = 'idle') => `<span class="pill pill--${tone}">${label}</span>`;

  const p = (t) => `<p class="txt">${t}</p>`;

  const sec = (label, inner) => `
    <section class="sec">
      <h3 class="sec__h"><i aria-hidden="true"></i>${label}</h3>
      ${inner}
    </section>`;

  const strip = (rows) => `
    <div class="strip">
      ${rows.map(([k, v]) => `
        <div class="strip__cell">
          <span class="strip__k">${k}</span>
          <span class="strip__v">${v}</span>
        </div>`).join('')}
    </div>`;

  const list = (items) => `<ul class="bullets">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;

  const feats = (items) => `
    <ol class="feats">
      ${items.map(([t, d], i) => `
        <li>
          <span class="feats__n">${String(i + 1).padStart(2, '0')}</span>
          <div><h4>${t}</h4><p>${d}</p></div>
        </li>`).join('')}
    </ol>`;

  const chips = (items) => `<ul class="chips">${items.map((c) => `<li>${c}</li>`).join('')}</ul>`;

  const table = (head, rows) => `
    <div class="tbl-wrap">
      <table class="tbl">
        <thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>`;

  const kv = (rows) => `
    <dl class="kv">
      ${rows.map(([k, v]) => `<div class="kv__row"><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
    </dl>`;

  const btn = (label, href = '#') => `
    <a class="btn" href="${href}"${href === '#' ? ' data-placeholder-link title="Placeholder link — replace this URL"' : ''}>
      <span>${label}</span><span class="btn__i" aria-hidden="true">↗</span>
    </a>`;

  const shot = (path, ratio = '16 / 10', cap = '') => `
    <figure class="shot-f">
      <div class="shot" style="--ratio:${ratio}"><span class="shot__label">${path}</span></div>
      ${cap ? `<figcaption>${cap}</figcaption>` : ''}
    </figure>`;

  const player = (title, src = 'assets/audio/placeholder.mp3') => `
    <div class="player">
      <div class="player__head">
        <span class="player__t">${title}</span>
        <span>${ph('[ REPLACE AUDIO ]')}</span>
      </div>
      <audio controls preload="none" src="${src}">
        Your browser does not support the audio element.
      </audio>
      <p class="player__note">Point the <code>src</code> at a real file in <code>assets/audio/</code>.</p>
    </div>`;

  /* ── 3. CONTENT REGISTRY ──────────────────────────────────
     Every window in the site is an entry in ITEMS.
     `body()` returns the inner HTML of the window.
     Items listed in DEPARTMENTS appear on the launcher;
     items that are not listed (e.g. individual releases)
     are only reachable from inside other windows.            */
  const ITEMS = {

    /* ══════════ SOFTWARE ══════════ */
    livecontrol: {
      code: 'SW-01',
      title: 'LiveControl',
      desc: 'Live performance and playback control for musicians.',
      status: { label: 'Beta', tone: 'live' },
      icon: 'sliders',
      body: () => `
        ${strip([
          ['Type', 'Software · Desktop'],
          ['Version', 'v0.9.4'],
          ['Status', pill('Beta', 'live')],
          ['Updated', '2026.02']
        ])}
        <p class="lead">
          LiveControl is a software project built around live music performance and
          playback control — one place to run a set, cue tracks and keep the show moving.
        </p>

        ${sec('Overview', `
          ${p('LiveControl handles playback during live performance. ' +
              ph('[PLACEHOLDER — describe the core idea: what it replaces, what it does better, and who it is for.]'))}
          ${p(ph('[PLACEHOLDER — a paragraph on the origin of the project: why you started building it and what it is designed to solve on stage.]'))}
        `)}

        ${sec('Purpose & function', list([
          'Control playback of tracks and cues during a live set.',
          ph('[PLACEHOLDER — additional purpose or capability]'),
          ph('[PLACEHOLDER — additional purpose or capability]'),
          ph('[PLACEHOLDER — additional purpose or capability]')
        ]))}

        ${sec('Features', feats([
          ['Playback control',
           'Start, stop and move through tracks without leaving the set view. ' + ph('[VERIFY / EXPAND]')],
          ['Set & cue management',
           ph('[PLACEHOLDER — how sets and cues are organised, if applicable.]')],
          ['Controller integration',
           ph('[PLACEHOLDER — MIDI / OSC / audio interface support, if applicable.]')],
          ['Show persistence',
           ph('[PLACEHOLDER — saving and recalling show state between sessions.]')]
        ]))}

        ${sec('Interface', `
          <div class="shots">
            ${shot('assets/img/livecontrol-01.png', '16 / 10', 'Main playback view')}
            ${shot('assets/img/livecontrol-02.png', '16 / 10', 'Set / cue editor')}
          </div>
        `)}

        ${sec('Technology', `
          ${p(ph('[PLACEHOLDER — one line on the technical approach.]'))}
          ${chips([ph('[LANGUAGE]'), ph('[FRAMEWORK]'), ph('[AUDIO API]'), ph('[PLATFORM]')])}
        `)}

        ${sec('Development status', `
          ${p('Currently in beta. ' + ph('[PLACEHOLDER — describe what works, what is unstable, and what is planned next.]'))}
          ${kv([
            ['Stage', 'Beta'],
            ['Version', 'v0.9.4'],
            ['Next', 'v1.0.0 — ' + ph('[TARGET DATE]')],
            ['Platform', ph('[WINDOWS / MACOS / LINUX]')]
          ])}
        `)}

        ${sec('Release history', table(
          ['Version', 'Date', 'Notes'],
          [
            ['v0.9.4', ph('[YYYY-MM-DD]'), ph('[Release notes]')],
            ['v0.9.0', ph('[YYYY-MM-DD]'), ph('[Release notes]')],
            ['v0.8.2', ph('[YYYY-MM-DD]'), ph('[Release notes]')]
          ]
        ))}

        ${sec('Links', `<div class="btns">${btn('GitHub repository')}${btn('Documentation')}</div>`)}
      `
    },

    samplevault: {
      code: 'SW-02',
      title: 'SampleVault',
      desc: 'Sample library management and audio organisation.',
      status: { label: 'In development', tone: 'dev' },
      icon: 'vault',
      body: () => `
        ${strip([
          ['Type', 'Software · Audio tool'],
          ['Version', 'v0.4.0'],
          ['Status', pill('Alpha', 'dev')],
          ['Updated', '2026.01']
        ])}
        <p class="lead">
          SampleVault is a software project for managing sample libraries and keeping
          audio organised — built for people whose sample folders have outgrown them.
        </p>

        ${sec('Overview', `
          ${p(ph('[PLACEHOLDER — describe what SampleVault does, what problem it solves, and who it is for.]'))}
          ${p(ph('[PLACEHOLDER — a short paragraph on how the project started and how it is being developed.]'))}
        `)}

        ${sec('Features', feats([
          ['Library indexing',
           ph('[PLACEHOLDER — how samples are scanned, indexed and stored.]')],
          ['Tagging & search',
           ph('[PLACEHOLDER — metadata, tags, filters, search behaviour.]')],
          ['Auditioning',
           ph('[PLACEHOLDER — preview, waveform, looping, playback.]')],
          ['Organisation',
           ph('[PLACEHOLDER — collections, folders, smart sets, export.]')]
        ]))}

        ${sec('Interface', `
          <div class="shots">
            ${shot('assets/img/samplevault-01.png', '16 / 10', 'Library browser')}
            ${shot('assets/img/samplevault-02.png', '16 / 10', 'Sample detail panel')}
          </div>
        `)}

        ${sec('Technology', `
          ${p(ph('[PLACEHOLDER — one line on the technical approach.]'))}
          ${chips([ph('[LANGUAGE]'), ph('[FRAMEWORK]'), ph('[DATABASE]'), ph('[AUDIO API]')])}
        `)}

        ${sec('Development status', `
          ${p('Early alpha. ' + ph('[PLACEHOLDER — describe the current state of the build.]'))}
          ${kv([
            ['Stage', 'Alpha'],
            ['Version', 'v0.4.0'],
            ['Next', ph('[NEXT MILESTONE]')],
            ['Platform', ph('[PLATFORM]')]
          ])}
        `)}

        ${sec('Release history', table(
          ['Version', 'Date', 'Notes'],
          [
            ['v0.4.0', ph('[YYYY-MM-DD]'), ph('[Release notes]')],
            ['v0.3.1', ph('[YYYY-MM-DD]'), ph('[Release notes]')]
          ]
        ))}

        ${sec('Links', `<div class="btns">${btn('GitHub repository')}</div>`)}
      `
    },

    /* ══════════ MUSIC — DEPARTMENTS ══════════ */
    writing: {
      code: 'MU-W',
      title: 'Writing',
      desc: 'Original compositions, arrangements and production.',
      status: { label: '03 works', tone: 'idle' },
      icon: 'pen',
      body: () => `
        ${strip([
          ['Discipline', 'Writing'],
          ['Works', '03'],
          ['Role', 'Composer · Producer'],
          ['Status', pill('Open', 'live')]
        ])}
        <p class="lead">
          Original compositions, songwriting, arrangements and production.
        </p>

        ${sec('Approach', `
          ${p(ph('[PLACEHOLDER — a short statement on how you approach writing and production: instruments, process, what you are drawn to.]'))}
        `)}

        ${sec('Works', `
          <button class="rel__item" data-open="rel-01">
            <span class="rel__art" aria-hidden="true"></span>
            <span>
              <span class="rel__title">[RELEASE TITLE]</span>
              <span class="rel__meta">Single · 2025 · Writer, producer, performer</span>
            </span>
            <span class="rel__code">MU-W-01</span>
          </button>
          <button class="rel__item" data-open="rel-02">
            <span class="rel__art" aria-hidden="true"></span>
            <span>
              <span class="rel__title">[RELEASE TITLE]</span>
              <span class="rel__meta">EP · 2024 · Writer, producer</span>
            </span>
            <span class="rel__code">MU-W-02</span>
          </button>
          <button class="rel__item" data-open="rel-03">
            <span class="rel__art" aria-hidden="true"></span>
            <span>
              <span class="rel__title">[RELEASE TITLE]</span>
              <span class="rel__meta">Arrangement · 2024 · Arranger</span>
            </span>
            <span class="rel__code">MU-W-03</span>
          </button>
        `)}

        ${sec('Notes', p(ph('[PLACEHOLDER — collaborators, studios, instruments, or anything else worth noting.]')))}
      `
    },

    mixing: {
      code: 'MU-M',
      title: 'Mixing',
      desc: 'Selected mixing projects and credits.',
      status: { label: '04 credits', tone: 'idle' },
      icon: 'faders',
      body: () => `
        ${strip([
          ['Discipline', 'Mixing'],
          ['Credits', '04'],
          ['Format', 'Stereo · Hybrid'],
          ['Status', pill('Open', 'live')]
        ])}
        <p class="lead">
          Audio mixing for records, sessions and single releases.
        </p>

        ${sec('Approach', `
          ${p(ph('[PLACEHOLDER — a short statement on your mixing approach: in the box, hybrid, outboard, revision policy.]'))}
        `)}

        ${sec('Selected credits', `
          <button class="rel__item" data-open="mix-01">
            <span class="rel__art" aria-hidden="true"></span>
            <span>
              <span class="rel__title">[ARTIST — TRACK TITLE]</span>
              <span class="rel__meta">Single · 2025 · Mix engineer</span>
            </span>
            <span class="rel__code">MU-M-01</span>
          </button>
          <button class="rel__item" data-open="mix-01">
            <span class="rel__art" aria-hidden="true"></span>
            <span>
              <span class="rel__title">[ARTIST — TRACK TITLE]</span>
              <span class="rel__meta">EP · 2025 · Mix engineer</span>
            </span>
            <span class="rel__code">MU-M-02</span>
          </button>
          <button class="rel__item" data-open="mix-01">
            <span class="rel__art" aria-hidden="true"></span>
            <span>
              <span class="rel__title">[ARTIST — TRACK TITLE]</span>
              <span class="rel__meta">Album · 2024 · Mix engineer</span>
            </span>
            <span class="rel__code">MU-M-03</span>
          </button>
        `)}

        ${sec('Technical notes', p(ph('[PLACEHOLDER — DAW, summing, monitoring, delivery formats, turnaround.]')))}
      `
    },

    mastering: {
      code: 'MU-X',
      title: 'Mastering',
      desc: 'Mastering projects, technical approach and examples.',
      status: { label: '02 credits', tone: 'idle' },
      icon: 'wave',
      body: () => `
        ${strip([
          ['Discipline', 'Mastering'],
          ['Credits', '02'],
          ['Format', 'Digital · Vinyl prep'],
          ['Status', pill('Open', 'live')]
        ])}
        <p class="lead">
          Mastering for digital release, with vinyl preparation where required.
        </p>

        ${sec('Technical approach', `
          ${p(ph('[PLACEHOLDER — describe your mastering chain, monitoring, and philosophy on loudness and dynamics.]'))}
          ${kv([
            ['Chain', ph('[PLACEHOLDER]')],
            ['Monitoring', ph('[PLACEHOLDER]')],
            ['Delivery', ph('[WAV 24-BIT / MP3 / DDP]')],
            ['Turnaround', ph('[PLACEHOLDER]')]
          ])}
        `)}

        ${sec('Selected credits', `
          <button class="rel__item" data-open="mas-01">
            <span class="rel__art" aria-hidden="true"></span>
            <span>
              <span class="rel__title">[ARTIST — RELEASE TITLE]</span>
              <span class="rel__meta">Album · 2025 · Mastering engineer</span>
            </span>
            <span class="rel__code">MU-X-01</span>
          </button>
          <button class="rel__item" data-open="mas-01">
            <span class="rel__art" aria-hidden="true"></span>
            <span>
              <span class="rel__title">[ARTIST — RELEASE TITLE]</span>
              <span class="rel__meta">Single · 2024 · Mastering engineer</span>
            </span>
            <span class="rel__code">MU-X-02</span>
          </button>
        `)}
      `
    },

    /* ══════════ VIDEO & GRAPHICS ══════════ */
    noisyflatmate: {
      code: 'VG-01',
      title: 'Noisy Flatmate',
      desc: 'Glasgow-based music series — bands performing in a flat. Audio, video and premiere hosting.',
      status: { label: 'Ongoing', tone: 'live' },
      icon: 'house',
      featured: true,
      body: () => `
        ${strip([
          ['Type', 'Case study · Series'],
          ['Role', 'Audio · Video · Premiere'],
          ['Location', 'Glasgow, UK'],
          ['Status', pill('Ongoing', 'live')]
        ])}
        <p class="lead">
          Noisy Flatmate is a Glasgow-based music project showcasing bands performing
          in a flat — intimate, single-room sessions built around the room itself.
        </p>

        ${sec('Introduction', `
          ${p('Noisy Flatmate films and records live performances in a residential flat in Glasgow. ' +
              ph('[PLACEHOLDER — two or three sentences introducing the series and your relationship to it.]'))}
        `)}

        ${sec('The concept', `
          ${p(ph('[PLACEHOLDER — describe the idea behind the series: why a flat, what the constraint does to the performances, and how episodes are structured.]'))}
          ${p(ph('[PLACEHOLDER — a second paragraph on the visual and sonic identity of the series.]'))}
        `)}

        ${sec('My involvement', list([
          '<strong>Audio</strong> — recording and mixing the performances in the room.',
          '<strong>Video</strong> — production and editing of the episodes.',
          '<strong>Premiere</strong> — co-hosting the premiere of the first episode.'
        ]))}

        ${sec('Audio work', `
          ${p(ph('[PLACEHOLDER — recording setup, microphone placement, challenges of a domestic room, mixing approach.]'))}
          ${chips([ph('[RECORDER]'), ph('[MICROPHONES]'), ph('[DAW]'), ph('[MIX APPROACH]')])}
        `)}

        ${sec('Video work', `
          ${p(ph('[PLACEHOLDER — cameras, framing, edit structure, colour, and how the video supports the performance.]'))}
        `)}

        ${sec('Episode 01', `
          <div class="shots">
            ${shot('assets/video/noisy-flatmate-ep01.mp4', '16 / 9', 'Episode 01 — embed video here')}
          </div>
          ${kv([
            ['Featured artist', ph('[ARTIST NAME]')],
            ['Runtime', ph('[00:00]')],
            ['Recorded', ph('[LOCATION / DATE]')],
            ['Released', ph('[YYYY-MM-DD]')]
          ])}
        `)}

        ${sec('Premiere', `
          ${p('The first episode was premiered at ' + ph('[VENUE]') + ' on ' + ph('[DATE]') + ', with hosting and a Q&A. ' +
              ph('[PLACEHOLDER — a sentence about the night: turnout, atmosphere, what happened.]'))}
        `)}

        ${sec('Photography & graphics', `
          <div class="gallery">
            ${shot('assets/img/nf-01.jpg', '4 / 5', 'Session still')}
            ${shot('assets/img/nf-02.jpg', '4 / 5', 'Artwork / poster')}
            ${shot('assets/img/nf-03.jpg', '4 / 5', 'Behind the scenes')}
          </div>
        `)}

        ${sec('Credits & collaborators', table(
          ['Role', 'Credit'],
          [
            ['Audio · Video', '[YOUR NAME] — kikimecha'],
            ['Host · Producer', ph('[COLLABORATOR NAME]')],
            ['Featured artists', ph('[BAND NAMES]')],
            ['Artwork', ph('[DESIGNER]')]
          ]
        ))}

        ${sec('Links', `<div class="btns">${btn('Watch the series')}${btn('Instagram')}</div>`)}
      `
    },

    video: {
      code: 'VG-02',
      title: 'Video',
      desc: 'Video production and editing — performance, promo and documentary.',
      status: { label: 'Showreel', tone: 'idle' },
      icon: 'film',
      body: () => `
        ${strip([
          ['Discipline', 'Video'],
          ['Scope', 'Production · Editing'],
          ['Format', ph('[4K / HD]')],
          ['Status', pill('Open', 'live')]
        ])}
        <p class="lead">
          Video production and editing — live sessions, promotional work and short-form
          documentary.
        </p>

        ${sec('Approach', p(ph('[PLACEHOLDER — a short statement on how you shoot and edit: cameras, workflow, edit philosophy.]')))}

        ${sec('Selected work', `
          <div class="shots">
            ${shot('assets/video/clip-01.mp4', '16 / 9', '[PROJECT TITLE 01] · [Role] · [Year]')}
            ${shot('assets/video/clip-02.mp4', '16 / 9', '[PROJECT TITLE 02] · [Role] · [Year]')}
            ${shot('assets/video/clip-03.mp4', '16 / 9', '[PROJECT TITLE 03] · [Role] · [Year]')}
            ${shot('assets/video/clip-04.mp4', '16 / 9', '[PROJECT TITLE 04] · [Role] · [Year]')}
          </div>
        `)}

        ${sec('Tools', chips([ph('[CAMERA]'), ph('[EDIT SUITE]'), ph('[COLOUR]'), ph('[AUDIO]')]))}
      `
    },

    graphics: {
      code: 'VG-03',
      title: 'Graphics',
      desc: 'Graphic design, identities and promotional material.',
      status: { label: 'Portfolio', tone: 'idle' },
      icon: 'layers',
      body: () => `
        ${strip([
          ['Discipline', 'Graphic design'],
          ['Scope', 'Identity · Print · Digital'],
          ['Status', pill('Open', 'live')],
          ['Contact', ph('[EMAIL]')]
        ])}
        <p class="lead">
          Graphic design work — release artwork, posters, identities and promotional material.
        </p>

        ${sec('Approach', p(ph('[PLACEHOLDER — a short statement on how you work as a designer.]')))}

        ${sec('Selected work', `
          <div class="gallery">
            ${shot('assets/img/graphic-01.jpg', '4 / 5', '[PROJECT 01] — Poster')}
            ${shot('assets/img/graphic-02.jpg', '1 / 1', '[PROJECT 02] — Sleeve')}
            ${shot('assets/img/graphic-03.jpg', '4 / 5', '[PROJECT 03] — Identity')}
            ${shot('assets/img/graphic-04.jpg', '1 / 1', '[PROJECT 04] — Promo')}
            ${shot('assets/img/graphic-05.jpg', '4 / 5', '[PROJECT 05] — Print')}
            ${shot('assets/img/graphic-06.jpg', '1 / 1', '[PROJECT 06] — Digital')}
          </div>
        `)}

        ${sec('Tools', chips([ph('[DESIGN SUITE]'), ph('[TYPE]'), ph('[MOTION]')]))}
      `
    },

    artwork: {
      code: 'VG-04',
      title: 'Artwork',
      desc: 'Release artwork and creative collaborations.',
      status: { label: 'Archive', tone: 'idle' },
      icon: 'image',
      body: () => `
        ${strip([
          ['Discipline', 'Artwork'],
          ['Scope', 'Sleeves · Covers'],
          ['Status', pill('Archive', 'idle')],
          ['Updated', '2026.01']
        ])}
        <p class="lead">
          Release artwork, cover design and visual collaborations for records.
        </p>

        ${sec('Approach', p(ph('[PLACEHOLDER — a short statement on your visual approach and materials.]')))}

        ${sec('Selected artwork', `
          <div class="gallery">
            ${shot('assets/img/art-01.jpg', '1 / 1', '[RELEASE — ARTWORK 01]')}
            ${shot('assets/img/art-02.jpg', '1 / 1', '[RELEASE — ARTWORK 02]')}
            ${shot('assets/img/art-03.jpg', '1 / 1', '[RELEASE — ARTWORK 03]')}
            ${shot('assets/img/art-04.jpg', '1 / 1', '[RELEASE — ARTWORK 04]')}
            ${shot('assets/img/art-05.jpg', '1 / 1', '[RELEASE — ARTWORK 05]')}
            ${shot('assets/img/art-06.jpg', '1 / 1', '[RELEASE — ARTWORK 06]')}
          </div>
        `)}

        ${sec('Collaborations', p(ph('[PLACEHOLDER — artists, labels or designers you have worked with.]')))}
      `
    },

    /* ══════════ ABOUT ══════════ */
    about: {
      code: 'AB-01',
      title: 'About',
      desc: 'The practice, the disciplines, and how to get in touch.',
      status: { label: 'Contact', tone: 'idle' },
      icon: 'id',
      body: () => `
        ${strip([
          ['Based', 'Glasgow, UK'],
          ['Disciplines', '04'],
          ['Status', pill('Available', 'live')],
          ['Email', ph('[EMAIL]')]
        ])}
        <p class="lead">
          kikimecha brings together independent software, music, audio engineering
          and visual projects under one practice.
        </p>

        ${sec('Biography', `
          ${p(ph('[PLACEHOLDER — a short biography. Where you are, how you got here, what you spend your time on.]'))}
          ${p(ph('[PLACEHOLDER — a second paragraph: current focus, notable work, or how you like to work with people.]'))}
        `)}

        ${sec('Skills & disciplines', list([
          '<strong>Software</strong> — application development, interface design, audio tooling.',
          '<strong>Music</strong> — writing, arrangement, production, mixing and mastering.',
          '<strong>Audio engineering</strong> — recording, editing and delivery.',
          '<strong>Visual</strong> — video production and editing, graphic design, artwork.'
        ]))}

        ${sec('Tools & software', chips([
          ph('[LANGUAGE]'), ph('[FRAMEWORK]'), ph('[DAW]'),
          ph('[VIDEO EDITOR]'), ph('[DESIGN SUITE]'), ph('[VERSION CONTROL]')
        ]))}

        ${sec('Contact & links', `
          <div class="btns">
            ${btn('GitHub')}
            ${btn('Email')}
            ${btn('Instagram')}
            ${btn('Bandcamp')}
            ${btn('YouTube')}
          </div>
          ${p('<span class="ph">[PLACEHOLDER — replace these links in app.js and in the footer of index.html.]</span>')}
        `)}
      `
    },

    /* ══════════ MUSIC — INDIVIDUAL RELEASES ══════════
       These are not listed on the launcher; they open from
       inside the Writing / Mixing / Mastering windows.        */
    'rel-01': {
      code: 'MU-W-01',
      title: '[RELEASE TITLE]',
      icon: 'pen',
      body: () => `
        ${strip([
          ['Type', 'Single'],
          ['Released', '2025'],
          ['Role', 'Writer · Producer'],
          ['Length', ph('[00:00]')]
        ])}

        <div class="relhead">
          <div class="artwork">assets/img/rel-01.jpg</div>
          <div>
            <p class="lead">
              [RELEASE TITLE] is a [PLACEHOLDER — one-line description of the release:
              what it is, when it was made, what it sounds like.]
            </p>
            <div style="margin-top:18px">
              ${chips(['Writer', 'Producer', 'Performer', 'Mix'])}
            </div>
          </div>
        </div>

        ${sec('Description', `
          ${p(ph('[PLACEHOLDER — a paragraph about the release: the idea, the process, the recording.]'))}
        `)}

        ${sec('Credits', table(
          ['Role', 'Credit'],
          [
            ['Written by', '[YOUR NAME]'],
            ['Produced by', '[YOUR NAME]'],
            ['Performed by', ph('[PERFORMERS]')],
            ['Mixed by', ph('[MIX ENGINEER]')],
            ['Mastered by', ph('[MASTERING ENGINEER]')],
            ['Artwork', ph('[DESIGNER]')]
          ]
        ))}

        ${sec('Audio', player('[RELEASE TITLE] — main mix', 'assets/audio/rel-01.mp3'))}

        ${sec('Listen', `<div class="btns">${btn('Spotify')}${btn('Apple Music')}${btn('Bandcamp')}</div>`)}

        ${sec('Technical notes', p(ph('[PLACEHOLDER — recording details, instruments, sample rate, notable technical decisions.]')))}
      `
    },

    'rel-02': {
      code: 'MU-W-02',
      title: '[RELEASE TITLE]',
      icon: 'pen',
      body: () => `
        ${strip([
          ['Type', 'EP'],
          ['Released', '2024'],
          ['Role', 'Writer · Producer'],
          ['Tracks', '04']
        ])}
        <div class="relhead">
          <div class="artwork">assets/img/rel-02.jpg</div>
          <div>
            <p class="lead">[PLACEHOLDER — one-line description of this release.]</p>
            <div style="margin-top:18px">${chips(['Writer', 'Producer', 'Arranger'])}</div>
          </div>
        </div>
        ${sec('Description', p(ph('[PLACEHOLDER — release description.]')))}
        ${sec('Credits', table(['Role', 'Credit'], [
          ['Written by', '[YOUR NAME]'],
          ['Produced by', '[YOUR NAME]'],
          ['Mixed by', ph('[MIX ENGINEER]')],
          ['Mastered by', ph('[MASTERING ENGINEER]')]
        ]))}
        ${sec('Audio', player('[RELEASE TITLE] — track 01', 'assets/audio/rel-02.mp3'))}
        ${sec('Listen', `<div class="btns">${btn('Spotify')}${btn('Bandcamp')}</div>`)}
      `
    },

    'rel-03': {
      code: 'MU-W-03',
      title: '[RELEASE TITLE]',
      icon: 'pen',
      body: () => `
        ${strip([
          ['Type', 'Arrangement'],
          ['Released', '2024'],
          ['Role', 'Arranger'],
          ['Length', ph('[00:00]')]
        ])}
        <div class="relhead">
          <div class="artwork">assets/img/rel-03.jpg</div>
          <div>
            <p class="lead">[PLACEHOLDER — one-line description of this arrangement.]</p>
            <div style="margin-top:18px">${chips(['Arranger', 'Strings', 'Production'])}</div>
          </div>
        </div>
        ${sec('Description', p(ph('[PLACEHOLDER — arrangement notes.]')))}
        ${sec('Credits', table(['Role', 'Credit'], [
          ['Original by', ph('[ARTIST]')],
          ['Arranged by', '[YOUR NAME]'],
          ['Performed by', ph('[ENSEMBLE]')]
        ]))}
        ${sec('Audio', player('[RELEASE TITLE] — arrangement', 'assets/audio/rel-03.mp3'))}
      `
    },

    'mix-01': {
      code: 'MU-M-01',
      title: '[ARTIST — TRACK TITLE]',
      icon: 'faders',
      body: () => `
        ${strip([
          ['Type', 'Mix'],
          ['Client', ph('[ARTIST]')],
          ['Year', '2025'],
          ['Format', 'Stereo']
        ])}
        <div class="relhead">
          <div class="artwork">assets/img/mix-01.jpg</div>
          <div>
            <p class="lead">
              [PLACEHOLDER — one line describing the record and what you were asked to do.]
            </p>
            <div style="margin-top:18px">${chips(['Mix engineer', 'Editing', 'Vocal production'])}</div>
          </div>
        </div>
        ${sec('Description', p(ph('[PLACEHOLDER — the brief, the state of the session on arrival, and what you did.]')))}
        ${sec('Credits', table(['Role', 'Credit'], [
          ['Artist', ph('[ARTIST]')],
          ['Produced by', ph('[PRODUCER]')],
          ['Mixed by', '[YOUR NAME]'],
          ['Mastered by', ph('[MASTERING ENGINEER]')]
        ]))}
        ${sec('Audio', `
          ${player('Final mix', 'assets/audio/mix-01-final.mp3')}
          ${player('Rough / pre-mix reference', 'assets/audio/mix-01-rough.mp3')}
        `)}
        ${sec('Technical notes', p(ph('[PLACEHOLDER — session details, sample rate, summing, plugin chains, revisions.]')))}
      `
    },

    'mas-01': {
      code: 'MU-X-01',
      title: '[ARTIST — RELEASE TITLE]',
      icon: 'wave',
      body: () => `
        ${strip([
          ['Type', 'Mastering'],
          ['Client', ph('[ARTIST]')],
          ['Year', '2025'],
          ['Delivery', ph('[WAV 24-BIT / DDP]')]
        ])}
        <div class="relhead">
          <div class="artwork">assets/img/mas-01.jpg</div>
          <div>
            <p class="lead">
              [PLACEHOLDER — one line on the release and the mastering brief.]
            </p>
            <div style="margin-top:18px">${chips(['Mastering engineer', 'Sequencing', 'Vinyl prep'])}</div>
          </div>
        </div>
        ${sec('Description', p(ph('[PLACEHOLDER — the approach, targets and outcome for this release.]')))}
        ${sec('Credits', table(['Role', 'Credit'], [
          ['Artist', ph('[ARTIST]')],
          ['Mixed by', ph('[MIX ENGINEER]')],
          ['Mastered by', '[YOUR NAME]'],
          ['Artwork', ph('[DESIGNER]')]
        ]))}
        ${sec('Audio', player('Master — reference track', 'assets/audio/mas-01.mp3'))}
        ${sec('Technical notes', p(ph('[PLACEHOLDER — chain, loudness targets, formats delivered.]')))}
      `
    }
  };

  /* ── 4. DEPARTMENTS ──────────────────────────────────────
     Order and contents of the launcher. Add an item id here
     to make it visible on the homepage.                       */
  const DEPARTMENTS = [
    {
      id: 'software', num: '01', title: 'Software',
      note: 'Applications, tools & audio software',
      entries: ['livecontrol', 'samplevault']
    },
    {
      id: 'music', num: '02', title: 'Music',
      note: 'Writing · Mixing · Mastering',
      entries: ['writing', 'mixing', 'mastering']
    },
    {
      id: 'visual', num: '03', title: 'Video & Graphics',
      note: 'Production · Design · Artwork',
      entries: ['noisyflatmate', 'video', 'graphics', 'artwork']
    },
    {
      id: 'about', num: '04', title: 'About',
      note: 'Practice · Contact · Links',
      entries: ['about']
    }
  ];

  /* ── 5. LAUNCHER RENDERING ─────────────────────────────── */
  const launcherRoot = document.getElementById('launcher-root');
  let itemIndex = 0;

  function itemHTML(id, item) {
    const wide = item.featured || id === 'about' ? ' item--wide' : '';
    return `
      <button class="item${wide}" data-open="${id}" aria-haspopup="dialog" style="--i:${itemIndex++}">
        <span class="item__icon">${ICONS[item.icon] || ''}</span>
        <span class="item__main">
          <span class="item__name">
            ${item.title}
            ${item.featured ? '<span class="item__star">Featured</span>' : ''}
          </span>
          <span class="item__desc">${item.desc}</span>
        </span>
        <span class="item__meta">
          ${item.status ? pill(item.status.label, item.status.tone) : ''}
          <span class="item__code">${item.code}</span>
        </span>
      </button>`;
  }

  function renderLauncher() {
    launcherRoot.innerHTML = DEPARTMENTS.map((d) => `
      <section class="dept" id="dept-${d.id}" aria-labelledby="dept-h-${d.id}">
        <div class="dept__head">
          <span class="dept__num">${d.num}</span>
          <h2 class="dept__title" id="dept-h-${d.id}">${d.title}</h2>
          <span class="dept__note">${d.note}</span>
          <span class="dept__rule" aria-hidden="true"></span>
          <span class="dept__count">${String(d.entries.length).padStart(2, '0')} ${
            d.entries.length === 1 ? 'Entry' : 'Entries'
          }</span>
        </div>
        <div class="grid">
          ${d.entries.filter((id) => ITEMS[id]).map((id) => itemHTML(id, ITEMS[id])).join('')}
        </div>
      </section>`).join('');
  }

  /* ── 6. WINDOW MANAGER ─────────────────────────────────── */
  const WM = (function () {
    const layer    = document.getElementById('window-layer');
    const backdrop = document.getElementById('backdrop');
    const taskbar  = document.getElementById('taskbar');
    const tasksEl  = document.getElementById('tasks');

    const open = new Map();   // id -> { el, chip, trigger }
    const stack = [];         // ids, back → front
    let z = 100;
    let seq = 0;

    const isMin = (id) => open.has(id) && open.get(id).el.classList.contains('is-min');

    function topVisible() {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (!isMin(stack[i])) return stack[i];
      }
      return null;
    }

    function focusWin(id) {
      const rec = open.get(id);
      if (!rec) return;
      rec.el.style.zIndex = ++z;
      rec.el.classList.remove('is-min');
      rec.chip.classList.remove('is-min');

      const i = stack.indexOf(id);
      if (i > -1) stack.splice(i, 1);
      stack.push(id);

      open.forEach((r, k) => r.chip.classList.toggle('is-active', k === id));
      const body = rec.el.querySelector('.win__body');
      if (body) body.focus({ preventScroll: true });
    }

    function openWin(id) {
      const item = ITEMS[id];
      if (!item || typeof item.body !== 'function') return;

      if (open.has(id)) { focusWin(id); return; }

      seq++;
      const offset = ((seq - 1) % 4) * 20;

      const el = document.createElement('div');
      el.className = 'win';
      el.dataset.win = id;
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.setAttribute('aria-labelledby', 'wt-' + id);
      el.style.setProperty('--ox', offset + 'px');
      el.style.setProperty('--oy', offset + 'px');
      el.innerHTML = `
        <div class="win__bar">
          <span class="win__icon">${ICONS[item.icon] || ''}</span>
          <span class="win__title" id="wt-${id}">${item.title}</span>
          <span class="win__code">${item.code || ''}</span>
          <span class="win__grow"></span>
          <button class="win__btn" data-min="${id}" title="Minimise" aria-label="Minimise ${item.title}">
            <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 5h6" stroke="currentColor" stroke-width="1.2"/></svg>
          </button>
          <button class="win__btn win__btn--x" data-close="${id}" title="Close" aria-label="Close ${item.title}">
            <svg viewBox="0 0 10 10" aria-hidden="true">
              <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="currentColor" stroke-width="1.2"/>
            </svg>
          </button>
        </div>
        <div class="win__body" tabindex="-1">${item.body()}</div>`;

      layer.appendChild(el);

      const chip = document.createElement('button');
      chip.className = 'task';
      chip.dataset.task = id;
      chip.setAttribute('title', item.title);
      chip.innerHTML = `<span class="task__dot" aria-hidden="true"></span><span>${item.title}</span>`;
      tasksEl.appendChild(chip);

      open.set(id, { el, chip, trigger: document.activeElement });

      document.body.classList.add('is-locked');
      backdrop.hidden = false;
      taskbar.hidden = false;
      requestAnimationFrame(() => taskbar.classList.add('is-active'));

      focusWin(id);
    }

    function minimise(id) {
      const rec = open.get(id);
      if (!rec) return;
      rec.el.classList.add('is-min');
      rec.chip.classList.add('is-min');
      rec.chip.classList.remove('is-active');
      rec.chip.focus({ preventScroll: true });
    }

    function close(id) {
      const rec = open.get(id);
      if (!rec) return;

      rec.el.remove();
      rec.chip.remove();
      open.delete(id);

      const i = stack.indexOf(id);
      if (i > -1) stack.splice(i, 1);

      if (open.size === 0) {
        backdrop.hidden = true;
        taskbar.classList.remove('is-active');
        window.setTimeout(() => { if (open.size === 0) taskbar.hidden = true; }, 260);
        document.body.classList.remove('is-locked');
      }

      const next = topVisible();
      if (next) {
        focusWin(next);
      } else {
        const t = rec.trigger;
        if (t && t.isConnected) t.focus({ preventScroll: true });
      }
    }

    /* focus trap for the front-most window */
    function trapFocus(e) {
      const id = topVisible();
      if (!id) return;
      const win = open.get(id).el;
      const focusables = win.querySelectorAll(
        'a[href], button:not([disabled]), audio[controls], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === win.querySelector('.win__body'))) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault(); first.focus();
      }
    }

    /* wiring */
    layer.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('[data-close]');
      if (closeBtn) { close(closeBtn.dataset.close); return; }

      const minBtn = e.target.closest('[data-min]');
      if (minBtn) { minimise(minBtn.dataset.min); return; }

      const win = e.target.closest('.win');
      if (win) focusWin(win.dataset.win);
    });

    tasksEl.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-task]');
      if (chip) focusWin(chip.dataset.task);
    });

    backdrop.addEventListener('click', () => {
      const id = topVisible();
      if (id) close(id);
    });

    document.addEventListener('keydown', (e) => {
      if (open.size === 0) return;

      if (e.key === 'Escape') {
        const id = topVisible();
        if (id) { e.preventDefault(); close(id); }
        return;
      }
      if (e.key === 'Tab') trapFocus(e);
    });

    return { open: openWin, close, minimise };
  })();

  /* ── 7. GLOBAL LISTENERS & CLOCK ───────────────────────── */
  document.addEventListener('click', (e) => {
    // anything with data-open launches a window
    const opener = e.target.closest('[data-open]');
    if (opener) {
      e.preventDefault();
      WM.open(opener.dataset.open);
      return;
    }
    // placeholder links should not jump the page
    const phLink = e.target.closest('[data-placeholder-link]');
    if (phLink) e.preventDefault();
  });

  function tickClock() {
    const now = new Date();
    let label;
    try {
      label = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      }).format(now);
    } catch (err) {
      label = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
    document.querySelectorAll('[data-clock]').forEach((el) => { el.textContent = label; });
  }

  /* boot */
  renderLauncher();
  tickClock();
  window.setInterval(tickClock, 20000);

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
