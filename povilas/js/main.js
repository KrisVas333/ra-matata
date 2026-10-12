/* Matata v2 · vanilla JS + GSAP (one authored hero moment + stepper line).
   Everything renders without JS; this file adds config rendering, tracking, forms, game, consent. */
(function () {
  'use strict';

  var CFG = window.RA_CFG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var body = document.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var BASE = window.__btBase || { version: 'v2', src: 'direct' };
  var SRC = BASE.src || 'direct';

  // ---------- tracking: every event carries version + src (the head shim also stamps track.js's own events) ----------
  function track(name, props) {
    if (typeof window.bt !== 'function') return;
    try { window.bt(name, Object.assign({}, BASE, props || {})); } catch (e) {}
  }
  window.__mt = track;

  // ---------- config rendering ----------
  function get(path) {
    return path.split('.').reduce(function (o, k) { return (o && o[k] !== undefined) ? o[k] : undefined; }, CFG);
  }
  function money(n) { return String(n).replace('.', ','); }
  function perLesson(k) { var lpm = CFG.lessonsPerMonth || 4; var a = get('prices.' + k + '.amount'); return a === undefined ? undefined : money((a / lpm).toFixed(2).replace(/\.?0+$/, '')); }
  function calc(key) {
    if (key === 'perLesson.darzelis') return perLesson('darzelis');
    if (key === 'perLesson.centras') return perLesson('centras');
    if (key === 'ltVoice') return get('claims.ltVoiceBuiltIn') ? get('claims.ltVoiceBuiltInText') : get('claims.ltVoiceRecorded');
    if (key === 'telHref') return get('legal.phoneHref') ? 'tel:' + get('legal.phoneHref') : undefined;
    if (key === 'mailtoHref') return get('legal.email') ? 'mailto:' + get('legal.email') : undefined;
    return undefined;
  }
  function value(p) {
    var v = p.indexOf('calc:') === 0 ? calc(p.slice(5)) : get(p);
    if (v === undefined || v === null) return undefined;
    if (typeof v === 'number') v = money(v);
    return String(v);
  }
  function fill(tpl) { return tpl.replace(/\{([a-zA-Z0-9_.:]+)\}/g, function (m, p) { var v = value(p); return v === undefined ? m : v; }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function localISO(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function ltDate(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[1] + ' m. ' + ['sausio', 'vasario', 'kovo', 'balandžio', 'gegužės', 'birželio', 'liepos', 'rugpjūčio', 'rugsėjo', 'spalio', 'lapkričio', 'gruodžio'][+m[2] - 1] + ' ' + (+m[3]) + ' d.' : iso; }

  function renderCfg() {
    // text slots
    $$('[data-cfg]').forEach(function (el) {
      var p = el.getAttribute('data-cfg');
      if (p === 'coi.text') { var coi = CFG.coi || {}; var t = coi.show && coi.text ? String(coi.text) : ''; if (el.textContent !== t) el.textContent = t; return; }
      var v = value(p); if (v === undefined) return;
      if (el.textContent !== v) el.textContent = v;
    });
    // attribute slots: data-cfg-attr="href:legal.site"
    $$('[data-cfg-attr]').forEach(function (el) {
      var m = /^([a-z-]+):(.+)$/.exec(el.getAttribute('data-cfg-attr') || ''); if (!m) return;
      var v = value(m[2]); if (v !== undefined && el.getAttribute(m[1]) !== v) el.setAttribute(m[1], v);
    });
    // templated slots: data-cfg-tpl="content=... {prices.darzelis.amount} ..." (attr=) or plain text template
    $$('[data-cfg-tpl]').forEach(function (el) {
      var t = el.getAttribute('data-cfg-tpl') || '', m = /^([a-z-]+)=([\s\S]*)$/.exec(t);
      if (m) { var v = fill(m[2]); if (el.getAttribute(m[1]) !== v) el.setAttribute(m[1], v); }
      else { var tv = fill(t); if (el.textContent !== tv) el.textContent = tv; }
    });
    // list slots: data-cfg-list="darzeliui.lines" (first <li> is the template)
    $$('[data-cfg-list]').forEach(function (ul) {
      var arr = get(ul.getAttribute('data-cfg-list')); if (!Array.isArray(arr) || !arr.length) return;
      var tpl = ul.querySelector('li'); if (!tpl) return;
      var html = arr.map(function (line) { var li = tpl.cloneNode(true); var span = li.querySelector('span') || li; span.textContent = fill(String(line)); return li.outerHTML; }).join('');
      if (ul.innerHTML.replace(/\s+/g, '') !== html.replace(/\s+/g, '')) ul.innerHTML = html;
    });
    // show/hide slots: data-cfg-show="exitPolicy.show"
    $$('[data-cfg-show]').forEach(function (el) { var on = !!get(el.getAttribute('data-cfg-show')); var txt = el.getAttribute('data-cfg') ? value(el.getAttribute('data-cfg')) : 'x'; el.hidden = !(on && txt); });
    // start line: date set -> "Startas: 2026 m. ... d."
    var st = CFG.start || {}, stEl = $('#startText');
    if (stEl) stEl.textContent = st.date ? ((st.datePrefix || 'Startas:') + ' ' + ltDate(st.date)) : (st.text || '');
    // the free-lesson chip exists ONLY when config.firstLessonFree is true
    if (CFG.firstLessonFree && CFG.firstLessonFreeText) {
      var ft = CFG.firstLessonFreeText || '';
      var facts = $('.hero .facts'); if (facts) { var li = document.createElement('li'); li.className = 'free'; li.textContent = ft; facts.appendChild(li); }
      $$('.pc').forEach(function (pc) { var s = document.createElement('span'); s.className = 'free'; s.textContent = ft; pc.insertBefore(s, $('.btn', pc)); });
      var bt = $('.bar .txt span'); if (bt) bt.textContent += ' · ' + ft;
      var fp = $('#faqPrice'); if (fp) fp.textContent += ' ' + ft + '.';
    }
    // STEM.org seal: only while the credential is valid (local date) and switched on
    var stem = $('#stem'), so = get('trust.stemOrg') || {};
    var ok = so.show !== false && (!so.validUntil || localISO() <= so.validUntil);
    if (stem) stem.classList.toggle('off', !ok);
    var ss = $('#stemSrc'); if (ss) ss.classList.toggle('off', !ok);
    var rating = $('#rating'); if (rating) rating.classList.toggle('off', !(get('trust.rating.show')));
    $$('[data-trust]').forEach(function (li) { var t = get('trust.' + li.getAttribute('data-trust')); if (t && t.show === false) li.style.display = 'none'; });
    body.classList.toggle('coi', !!(CFG.coi && CFG.coi.show && CFG.coi.text));
    // testimonials from config (placeholders stay visibly marked; same markup as the static HTML)
    var box = $('#testimonials');
    if (box && Array.isArray(CFG.testimonials) && CFG.testimonials.length) {
      var ava = '<span class="ava" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="17" r="8"/><path d="M8 42c0-9 7-14 16-14s16 5 16 14"/></svg></span>';
      box.innerHTML = CFG.testimonials.map(function (t) {
        var ph = t.placeholder !== false;
        return '<article class="tcard' + (ph ? '' : ' real') + '" data-placeholder="' + (ph ? 1 : 0) + '" data-role="' + esc(t.role) + '">' +
          (ph ? '<span class="ph-label">PAVYZDYS · čia bus tikras atsiliepimas</span>' : '') +
          '<p class="q">„' + esc(t.quote || '') + '"</p>' +
          '<div class="by">' + ava + '<span><b>' + esc(t.who || '') + '</b><small>' + esc(t.age || '') + '</small></span></div></article>';
      }).join('');
    }
    var mc = $('#mentorCard'), m = CFG.mentor || {};
    if (mc && m.placeholder === false && m.name) {
      mc.style.borderStyle = 'solid';
      $('.ph-label', mc).textContent = 'Jūsų vaiko mentorius';
      $('b', mc).textContent = 'Su jūsų vaiku bus ' + m.name;
      $('p', mc).textContent = (m.line ? '„' + m.line + '" ' : '') + (m.years ? 'Su vaikais dirba ' + m.years + '. ' : '') + 'Mentoriai kasmet mokosi: klasės valdymo, dirbtinio intelekto, pirmosios pagalbos.';
    }
  }
  renderCfg();

  // ---------- age (3 / 4) for the "Meilė mokytis" cards: ?age=, saved choice, invalid -> 4. Never pre-checks the form. ----------
  function setAge(age, quiet, where) {
    age = (age === '3' || age === '4') ? age : (CFG.product && CFG.product.defaultAge) || '4';
    body.setAttribute('data-age', age);
    $$('[data-set-age]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-set-age') === age)); });
    try { localStorage.setItem('matata-age', age); } catch (e) {}
    if (!quiet) track('engage', { what: 'age_switch', age: age, where: where || 'dna' });
  }
  var startAge = BASE && new URLSearchParams(location.search).get('age');
  if (!startAge) { try { startAge = localStorage.getItem('matata-age'); } catch (e) {} }
  setAge(startAge, true);
  $$('[data-set-age]').forEach(function (b) { b.addEventListener('click', function () { setAge(b.getAttribute('data-set-age'), false, b.closest('section') ? b.closest('section').id : 'page'); }); });

  // ---------- join tabs (parents / kindergarten) ----------
  var wl = $('#wlform'), org = $('#orgform'), panelT = $('#panel-tevai'), panelO = $('#panel-istaiga');
  function jtab(which, quiet) {
    var isOrg = which === 'istaiga';
    if (panelT) panelT.hidden = isOrg; if (panelO) panelO.hidden = !isOrg;
    $$('[data-jtab]').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-jtab') === which)); });
    if (!quiet) track('engage', { what: 'tab', id: 'join_' + which });
  }
  $$('[data-jtab]').forEach(function (b) { b.addEventListener('click', function () { jtab(b.getAttribute('data-jtab')); }); });
  function openOrg() { jtab('istaiga', true); }
  if (location.hash === '#darzeliams') openOrg();

  // ---------- CTAs: tracking + prefill ----------
  var lastNavClick = 0;
  function kgSync() { var kg = $('#kgBox'); if (!kg || !wl) return; var r = wl.elements.location_pref; var on = false; for (var i = 0; r && i < r.length; i++) if (r[i].checked && r[i].value === 'darzelis') on = true; kg.classList.toggle('on', on); }
  $$('[data-cta]').forEach(function (a) {
    a.addEventListener('click', function () {
      var where = a.getAttribute('data-cta');
      var href = a.getAttribute('href') || '';
      var p = { where: where, age: body.getAttribute('data-age') };
      if (href.indexOf('mailto:') === 0) p.kind = 'email'; else if (href.indexOf('tel:') === 0) p.kind = 'tel'; else if (a.getAttribute('data-out')) p.kind = a.getAttribute('data-out');
      track('cta', p);
      if (href.charAt(0) === '#') lastNavClick = Date.now();
      if (href === '#darzeliams') openOrg(); else if (href === '#sarasas') jtab('tevai', true);
      var loc = a.getAttribute('data-loc');
      if (loc) { var r = $('input[name="location_pref"][value="' + loc + '"]'); if (r) { r.checked = true; kgSync(); } }
    });
  });
  // in-page nav links + outbound links (every meaningful click fires an event)
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href === '#saltiniai') { var sd = $('#saltiniai'); if (sd) sd.open = true; }
    if (a.hasAttribute('data-cta')) return;
    if (href.charAt(0) === '#') { lastNavClick = Date.now(); track('engage', { what: 'nav', to: href.slice(1, 40), from: (a.closest('header') ? 'header' : a.closest('footer') ? 'footer' : 'body') }); if (href === '#darzeliams') openOrg(); return; }
    if (href.indexOf('tel:') === 0) { track('cta', { where: 'tel', kind: 'tel' }); return; }
    if (href.indexOf('mailto:') === 0) { track('cta', { where: 'email', kind: 'email' }); return; }
    if (/^https?:/.test(href)) { var h = href.split('/')[2] || ''; track('cta', { where: 'out', kind: a.getAttribute('data-out') || 'link', host: h.slice(0, 60) }); }
  }, { capture: true, passive: true });

  // ---------- secondary sections: collapsed on phones, open on desktop ----------
  var MOB_DETAILS = ['gameBox', 'goalsBox', 'wefBox', 'rulesBox', 'elsewhereBox', 'faqBox'];
  function isDesk() { return window.innerWidth >= 860; }
  function syncDetails() {
    var desk = isDesk();
    MOB_DETAILS.forEach(function (id) {
      var d = $('#' + id); if (!d) return;
      if (desk && !d.open) d.open = true;
      var sm = $('summary', d); if (sm) { sm.tabIndex = desk ? -1 : 0; sm.setAttribute('aria-hidden', desk ? 'true' : 'false'); }
    });
    $$('.pl .head').forEach(function (h) { if (desk) h.setAttribute('aria-expanded', 'true'); else h.setAttribute('aria-expanded', String(h.closest('.pl').classList.contains('open'))); });
  }
  syncDetails();
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(syncDetails, 150); });
  MOB_DETAILS.forEach(function (id) { var d = $('#' + id); if (!d) return; d.addEventListener('keydown', function (e) { if (isDesk() && (e.key === 'Enter' || e.key === ' ') && e.target.tagName === 'SUMMARY') e.preventDefault(); }); d.addEventListener('click', function (e) { if (isDesk() && e.target.closest('summary')) e.preventDefault(); }); });
  // FAQ: 4 visible, the rest behind one button
  var faqMore = $('#faqMore'), faqMoreBox = $('#faqMoreBox');
  if (faqMore && faqMoreBox) faqMore.addEventListener('click', function () { faqMoreBox.hidden = false; faqMore.setAttribute('aria-expanded', 'true'); faqMore.hidden = true; track('engage', { what: 'faq_more' }); var f = faqMoreBox.querySelector('summary'); if (f) f.focus(); });

  // ---------- pillars accordion (mobile; always open on desktop via CSS) ----------
  $$('.pl .head').forEach(function (h) {
    h.addEventListener('click', function () {
      if (isDesk()) return;
      var art = h.closest('.pl'); var open = !art.classList.contains('open');
      art.classList.toggle('open', open); h.setAttribute('aria-expanded', String(open));
      if (open) track('engage', { what: 'pillar', id: art.id });
    });
  });

  // ---------- every <details> toggle is tracked (FAQ, WEF, elsewhere, sources) ----------
  $$('details').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      if (d.classList.contains('mob-details')) { if (!isDesk()) track('engage', { what: 'expand', id: d.id || 'details' }); return; } // desktop opens them by layout
      var faq = d.closest('.faq'), q = d.getAttribute('data-q');
      if (faq) track('engage', { what: 'faq', q: q || 'q' });
      else track('engage', { what: 'expand', id: d.id || 'details' });
    });
  });

  // ---------- intro video: click-to-play, progress ----------
  var pv = $('#pv'), pvPlay = $('#pvPlay');
  if (pv && pvPlay) {
    pvPlay.addEventListener('click', function () { pvPlay.classList.add('off'); var fig = pv.closest('.vid'); if (fig) fig.classList.add('playing'); var p = pv.play(); if (p && p.catch) p.catch(function () {}); });
    var fired = false, marks = { 25: 0, 50: 0, 75: 0, 100: 0 };
    pv.addEventListener('play', function () { pvPlay.classList.add('off'); pv.controls = true; if (!fired) { fired = true; track('engage', { what: 'video_play', id: 'pristatymas-v2' }); } });
    pv.addEventListener('timeupdate', function () {
      if (!pv.duration) return; var pct = pv.currentTime / pv.duration * 100;
      [25, 50, 75].forEach(function (m) { if (pct >= m && !marks[m]) { marks[m] = 1; track('engage', { what: 'video_progress', pct: m }); } });
    });
    pv.addEventListener('ended', function () { if (!marks[100]) { marks[100] = 1; track('engage', { what: 'video_progress', pct: 100 }); } });
  }

  // ---------- lite YouTube ----------
  $$('.yt').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-yt');
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&hl=lt';
      f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      f.allowFullscreen = true; f.title = b.getAttribute('aria-label') || 'YouTube';
      b.innerHTML = ''; b.appendChild(f); b.disabled = true; b.style.cursor = 'default';
      track('engage', { what: 'yt', id: id });
    });
  });

  // ---------- mini game: lead the robot to the lion ----------
  (function game() {
    var board = $('#board'), bot = $('#bot'), cmdsBox = $('#cmds'), runBtn = $('#runBtn'), resetBtn = $('#resetBtn'), msg = $('#gameMsg'), count = $('#gameCount');
    if (!board || !bot) return;
    var COLS = 5, ROWS = 3, LION = { x: 4, y: 0 }, START = { x: 0, y: 2 };
    var pos = { x: START.x, y: START.y }, seq = [], running = false, started = false, runs = 0;
    var ICONS = { up: ['g', 'M12 20V5M6 11l6-6 6 6'], down: ['b', 'M12 4v15M6 13l6 6 6-6'], left: ['y', 'M20 12H5M11 6l-6 6 6 6'], right: ['o', 'M4 12h15M13 6l6 6-6 6'] };
    var COL = { g: '#56B13F', b: '#3F6EDC', y: '#FEC404', o: '#F7A11A' };
    function place(animate) {
      bot.style.transition = animate && !reduce ? '' : 'none';
      bot.style.transform = 'translate(' + (pos.x * 100) + '%,' + ((pos.y - START.y) * 100) + '%)';
    }
    function draw() {
      if (!seq.length) { cmdsBox.innerHTML = '<span class="empty">Čia atsiras jūsų komandos</span>'; runBtn.disabled = true; return; }
      cmdsBox.innerHTML = seq.map(function (m) { var ic = ICONS[m]; return '<span class="c" style="background:' + COL[ic[0]] + '"><svg viewBox="0 0 24 24" fill="none" stroke="' + (ic[0] === 'y' ? '#152039' : '#fff') + '" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="' + ic[1] + '"/></svg></span>'; }).join('');
      runBtn.disabled = false;
    }
    function say(t, ms) { msg.textContent = t; msg.classList.add('on'); clearTimeout(say.t); say.t = setTimeout(function () { msg.classList.remove('on'); }, ms || 1800); }
    function reset(track_) {
      pos = { x: START.x, y: START.y }; seq = []; running = false; place(false); draw(); msg.classList.remove('on'); count.textContent = 'Žingsnių: 0';
      if (track_) track('engage', { what: 'game_reset' });
    }
    $$('.pad [data-move]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (running) return;
        if (!started) { started = true; track('engage', { what: 'game_start' }); }
        if (seq.length >= 12) { say('Užtenka 12 komandų', 1400); return; }
        seq.push(b.getAttribute('data-move')); draw();
      });
    });
    runBtn.addEventListener('click', function () {
      if (running || !seq.length) return;
      running = true; runs++; pos = { x: START.x, y: START.y }; place(false);
      track('engage', { what: 'game_run', moves: seq.length, run: runs });
      var i = 0, steps = 0;
      var step = reduce ? 60 : 380;
      function next() {
        if (i >= seq.length) {
          running = false;
          if (pos.x === LION.x && pos.y === LION.y) { say('Liūtas! Lion! Pavyko!', 2600); celebrate($('#board')); track('engage', { what: 'game_done', moves: seq.length, run: runs }); }
          else { say('Robotas sustojo čia. Bandome dar kartą.', 2200); track('engage', { what: 'game_miss', moves: seq.length, run: runs }); }
          return;
        }
        var m = seq[i++]; var nx = pos.x + (m === 'right' ? 1 : m === 'left' ? -1 : 0), ny = pos.y + (m === 'down' ? 1 : m === 'up' ? -1 : 0);
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) {
          running = false; say('Oi, žemėlapio kraštas! Tai bandymas, ne klaida.', 2400);
          track('engage', { what: 'game_edge', moves: seq.length, run: runs }); return;
        }
        pos = { x: nx, y: ny }; steps++; count.textContent = 'Žingsnių: ' + steps; place(true);
        setTimeout(next, step);
      }
      next();
    });
    resetBtn.addEventListener('click', function () { reset(true); });
    reset(false);
  })();

  // ---------- GSAP: ONE authored hero moment + stepper line ----------
  function motion() {
    if (!window.gsap) return;
    var g = window.gsap;
    if (window.ScrollTrigger) g.registerPlugin(window.ScrollTrigger);
    var mm = g.matchMedia();
    mm.add({ ok: '(prefers-reduced-motion: no-preference)', reduceMotion: '(prefers-reduced-motion: reduce)', desk: '(min-width: 900px)' }, function (ctx) {
      if (!ctx.conditions.ok) return;
      // the H1 animates as one block: splitting it into word spans reflowed the hero (CLS source)
      var tl = g.timeline({ defaults: { ease: 'expo.out' } });
      tl.from('.stage .kid', { y: 26, opacity: 0, scale: .96, duration: .9 }, 0)
        .from('.bubble', { scale: .6, opacity: 0, duration: .55, ease: 'back.out(1.8)' }, .55)
        .from('#h1', { y: 18, opacity: 0, duration: .6 }, .15)
        .from(['.hero .tags', '.hero .lead', '.hero-cta', '.hero .micro', '.hero .facts'], { y: 14, opacity: 0, duration: .55, stagger: .07 }, .3);
      if (ctx.conditions.desk) {
        var path = $('#heroPath');
        if (path) { var len = path.getTotalLength(); g.set(path, { strokeDasharray: '2 12', strokeDashoffset: len }); tl.to(path, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, .5); }
        tl.from('.stage .lion', { scale: .4, opacity: 0, duration: .5, ease: 'back.out(2.2)' }, 1.3);
      }
      var line = $('.lesson .line');
      if (line && window.ScrollTrigger && ctx.conditions.desk) {
        g.to(line, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 70%', end: 'bottom 60%', scrub: .6 } });
        g.from($$('.step .min'), { scale: .6, ease: 'back.out(2)', duration: .4, stagger: .08, scrollTrigger: { trigger: '.steps', start: 'top 80%', once: true } });
      }
      setTimeout(function () { if (tl.progress() < 1) tl.progress(1); }, 3200);
      return function () { tl.kill(); };
    });
  }
  if (window.gsap) motion(); else window.addEventListener('load', motion);

  // ---------- sticky bar: hero out AND form not in view · section views after 1 s of real visibility ----------
  var hero = $('#hero'), join = $('#sarasas'), barEl = $('#bar'), heroOut = false, formIn = false;
  function bar() {
    var on = heroOut && !formIn;
    body.classList.toggle('show-bar', on);
    if (on && barEl) body.style.setProperty('--bar-h', (barEl.offsetHeight || 66) + 'px');
  }
  function viewOnce(sel, what, threshold) {
    var el = $(sel); if (!el || !('IntersectionObserver' in window)) return;
    var t = null;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { if (!t) t = setTimeout(function () { track('view', { what: what }); io.disconnect(); }, 1000); }
        else if (t) { clearTimeout(t); t = null; }
      });
    }, { threshold: threshold || 0.3 });
    io.observe(el);
  }
  if ('IntersectionObserver' in window && hero) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { heroOut = !e.isIntersecting && e.boundingClientRect.top < 0; bar(); if (heroOut) consentMaybe('scroll'); }); }, { threshold: 0 }).observe(hero);
    if (join) new IntersectionObserver(function (es) { es.forEach(function (e) { formIn = e.isIntersecting; bar(); if (!formIn) consentMaybe('form_left'); }); }, { threshold: 0.15 }).observe(join);
    [['#meile-mokytis', 'dna'], ['#ateities-kompetencijos', 'future'], ['#kaina', 'price'], ['#mentoriai', 'mentor'], ['#pabandykite', 'game'], ['#sarasas', 'form']].forEach(function (p) { viewOnce(p[0], p[1]); });
  }

  // ---------- human error copy (never a raw HTTP code) ----------
  function humanError(status) {
    if (status === 0) return 'Nėra ryšio. Patikrinkite internetą ir bandykite dar kartą.';
    if (status === 400 || status === 422) return 'Patikrinkite laukus: tekstas per ilgas arba netinkamo formato (miestas iki 40 ženklų).';
    if (status === 409) return 'Atrodo, šis el. paštas jau sąraše. Jei norite pridėti kitą vaiką, parašykite info@robotikosakademija.lt.';
    return 'Nepavyko išsiųsti. Pabandykite dar kartą arba parašykite info@robotikosakademija.lt su tema „Matata".';
  }
  function post(payload) {
    var sb = CFG.supabase || {};
    return fetch(sb.url, { method: 'POST', headers: { apikey: sb.key, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(payload) })
      .then(function (r) { if (r.status !== 201) { var e = new Error('http'); e.status = r.status; throw e; } return r; })
      .catch(function (x) { if (x.status === undefined) x.status = 0; throw x; });
  }
  function scrollToEl(el, offset) {
    var top = el.getBoundingClientRect().top;
    if (top < 84 || top > window.innerHeight * 0.4) window.scrollTo({ top: window.scrollY + top - (offset || 84), behavior: reduce ? 'auto' : 'smooth' });
  }
  function val(form, name) { var e = form.elements[name]; if (!e) return ''; if (e.length && !e.value && e[0] && e[0].type === 'radio') { for (var i = 0; i < e.length; i++) if (e[i].checked) return e[i].value; return ''; } if (e.type === 'radio' && !e.checked) return ''; return (e.value || '').trim(); }
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function isVilnius(city) { return /^viln/i.test((city || '').trim()); }
  function restoreBtn(btn) { if (!btn) return; btn.disabled = false; if (btn.dataset.label) btn.innerHTML = btn.dataset.label; }

  // ---------- share: one event per tap, with where + how ----------
  function share(btn, where, text, src) {
    var url = (CFG.siteUrl || location.href.split('#')[0].split('?')[0]) + '?src=' + src;
    var data = { title: 'Matata: robotas ir pasakų knyga. Be ekrano.', text: text, url: url };
    if (window.__nativeShare) { track('share', { how: 'native', where: where }); try { window.__nativeShare(data).catch(function () {}); } catch (e) {} return; }
    if (navigator.clipboard) { navigator.clipboard.writeText(url).then(function () { btn.textContent = 'Nuoroda nukopijuota'; track('share', { how: 'copy', where: where }); }).catch(function () {}); }
  }

  // ---------- parents form (3 steps) ----------
  if (wl) {
    var steps = $$('.fstep', wl), cur = 1, total = steps.length, prog = $$('.prog i', wl), ann = $('#stepAnn'), started = false;
    var submitBtn = $('#submitBtn'); if (submitBtn) submitBtn.dataset.label = submitBtn.innerHTML;
    function err(name, msg, field) {
      var p = wl.querySelector('[data-err="' + name + '"]'); if (p) p.textContent = msg || '';
      var f = wl.elements[field || name];
      if (f && f.setAttribute) f.setAttribute('aria-invalid', msg ? 'true' : 'false');
      else if (f && f.length) for (var i = 0; i < f.length; i++) f[i].setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg) track('form_error', { form: 'tevai', field: name });
    }
    function focusFirst(n) {
      var bad = steps[n - 1].querySelector('[aria-invalid="true"]');
      var first = bad || steps[n - 1].querySelector('input:not([type=radio]):not([type=checkbox]):not(.hp), select, h3');
      if (first && first.focus) { if (first.tagName === 'H3') first.setAttribute('tabindex', '-1'); first.focus({ preventScroll: true }); }
    }
    function show(n, back) {
      cur = n; steps.forEach(function (s) { s.classList.toggle('on', +s.dataset.step === n); });
      prog.forEach(function (p, i) { p.classList.toggle('on', i < n); });
      if (ann) ann.textContent = n + ' žingsnis iš ' + total;
      if (n === total) summary();
      scrollToEl(wl); focusFirst(n);
      track('engage', { what: back ? 'form_back' : 'form_step', step: n });
    }
    function validate(n) {
      var ok = true;
      if (n === 1) {
        if (!val(wl, 'child_age')) { err('child_age', 'Pažymėkite vaiko amžių.'); ok = false; } else err('child_age');
        var loc = val(wl, 'location_pref');
        if (!loc) { err('location_pref', 'Pažymėkite, kur būtų patogiausia.'); ok = false; } else err('location_pref');
        if (loc === 'darzelis') { if (val(wl, 'kindergarten_name').length < 2) { err('kindergarten_name', 'Įrašykite darželio pavadinimą, kad galėtume suburti grupę būtent ten.'); ok = false; } else err('kindergarten_name'); } else err('kindergarten_name');
        if (val(wl, 'city').length < 2) { err('city', 'Įrašykite miestą, kad žinotume, kur atidaryti grupę.'); ok = false; } else err('city');
      }
      if (n === 2) {
        if (val(wl, 'parent_name').length < 2) { err('parent_name', 'Įrašykite vardą, kad žinotume, kaip kreiptis.'); ok = false; } else err('parent_name');
        if (!EMAIL.test(val(wl, 'email'))) { err('email', 'Patikrinkite el. paštą: reikia @ ir taško, pvz. vardas@pastas.lt.'); ok = false; } else err('email');
      }
      if (n === 3) { if (!wl.elements.consent_contact.checked) { err('consent_contact', 'Be sutikimo negalėsime parašyti, kai atsidarys grupė.'); ok = false; } else err('consent_contact'); }
      if (!ok && n === cur) focusFirst(n);
      return ok;
    }
    function product() { var a = val(wl, 'child_age'); return a === '3' ? 'matata-3' : a === '4' ? 'matata-4' : 'matata'; }
    function kgName() { return val(wl, 'kindergarten_name').slice(0, 60); }
    function whereText() { var l = val(wl, 'location_pref'); return l === 'darzelis' ? ('jūsų darželyje' + (kgName() ? ' „' + kgName() + '"' : '')) : l === 'ra-centras' ? 'Tech Zity centre' : 'jūsų darželyje arba Tech Zity centre'; }
    function summary() { var a = val(wl, 'child_age'); var s = $('#summary'); if (s) s.textContent = (a === 'kitas' ? 'Vaikas: kito amžiaus' : 'Vaikas: ' + a + ' m.') + ' · ' + val(wl, 'city') + ' · ' + whereText() + ' · ' + val(wl, 'email'); }
    function days() { return $$('input[name="preferred_day"]:checked', wl).map(function (c) { return c.value; }).join(','); }
    wl.addEventListener('focusin', function () { if (!started) { started = true; track('engage', { what: 'form_start' }); } });
    wl.addEventListener('click', function (e) {
      var t = e.target.closest('[data-next],[data-prev]'); if (!t) return;
      if (t.hasAttribute('data-next')) { if (validate(cur)) show(Math.min(cur + 1, total)); } else show(Math.max(cur - 1, 1), true);
    });
    $$('input[name="child_age"]', wl).forEach(function (r) { r.addEventListener('change', function () { if (r.value === '3' || r.value === '4') setAge(r.value, true); err('child_age'); track('engage', { what: 'form_age', age: r.value }); }); });
    $$('input[name="location_pref"]', wl).forEach(function (r) { r.addEventListener('change', function () { kgSync(); err('location_pref'); track('engage', { what: 'form_location', loc: r.value }); }); });
    kgSync();
    // Enter inside steps 1–2 acts like "Toliau" (checkboxes included); on the last step the native submit runs the full check
    wl.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && cur < total) { e.preventDefault(); if (validate(cur)) show(cur + 1); } });

    function done() {
      steps.forEach(function (s) { s.classList.remove('on'); }); $('.prog', wl).style.display = 'none';
      var city = val(wl, 'city'), dt = $('#doneText');
      if (dt) {
        if (isVilnius(city) || !city) dt.innerHTML = 'Parašysime, kai grupė susirinks <b id="doneWhere"></b>. Iki tol: atsiverskite su vaiku knygą apie gyvūnus ir paklauskite, kokį garsą daro liūtas.';
        else dt.innerHTML = 'Parašysime, kai atsiras grupė jūsų mieste (<b id="doneWhere"></b>). Pirmosios grupės startuoja Vilniuje, kitur skaičiuojame paklausą. Iki tol: atsiverskite su vaiku knygą apie gyvūnus ir paklauskite, kokį garsą daro liūtas.';
        $('#doneWhere').textContent = (isVilnius(city) || !city) ? whereText() : city.slice(0, 40);
      }
      var d = $('#done'); d.classList.add('on'); wl.classList.remove('sending'); restoreBtn(submitBtn); d.focus({ preventScroll: true }); scrollToEl(wl); celebrate($('#confetti'));
      try { localStorage.setItem('matata-v2-joined', '1'); } catch (x) {}
      setTimeout(function () { consentMaybe('done'); }, 1200);
    }
    wl.addEventListener('submit', function (e) {
      e.preventDefault();
      for (var n = 1; n <= total; n++) { if (!validate(n)) { if (cur !== n) show(n); else focusFirst(n); return; } }
      var btn = submitBtn; btn.disabled = true; btn.textContent = 'Siunčiame…'; wl.classList.add('sending'); err('submit');
      if (val(wl, 'website')) { track('form_error', { form: 'tevai', field: 'honeypot' }); done(); return; }
      var payload = {
        product: product(), lead_type: 'tevai',
        parent_name: val(wl, 'parent_name').slice(0, 80),
        email: val(wl, 'email').toLowerCase().slice(0, 160),
        phone: val(wl, 'phone').slice(0, 30) || null,
        child_age: val(wl, 'child_age').slice(0, 20),
        city: val(wl, 'city').slice(0, 40),
        kindergarten_name: val(wl, 'kindergarten_name').slice(0, 120) || null,
        location_pref: val(wl, 'location_pref').slice(0, 80),
        preferred_day: days().slice(0, 60) || null,
        src: SRC.slice(0, 60), page_version: 'v2',
        consent_contact: true, consent_text_version: 'v2'
      };
      post(payload).then(function () {
        done();
        track('value', { step: 'waitlist_submit', product: payload.product, location: payload.location_pref, has_phone: payload.phone ? 1 : 0, has_kg: payload.kindergarten_name ? 1 : 0 });
      }).catch(function (x) {
        wl.classList.remove('sending'); btn.disabled = false; btn.textContent = 'Bandyti dar kartą';
        err('submit', humanError(x.status)); track('error', { where: 'waitlist_submit', code: x.status || 0 });
      });
    });
    // share + "another child"
    var shareBtn = $('#shareBtn');
    if (shareBtn) shareBtn.addEventListener('click', function () { share(shareBtn, 'tevai_done', 'Robotika be ekrano 3–4 metų vaikams darželyje.', 'share'); });
    function again() {
      $('#done').classList.remove('on'); $('.prog', wl).style.display = ''; wl.reset(); restoreBtn(submitBtn); err('submit'); kgSync();
      $('#joined').classList.remove('on'); show(1); track('engage', { what: 'form_again' });
    }
    var againBtn = $('#againBtn'); if (againBtn) againBtn.addEventListener('click', again);
    var joinAgain = $('#joinAgain'); if (joinAgain) joinAgain.addEventListener('click', function () { $('#joined').classList.remove('on'); track('engage', { what: 'form_again' }); });
    try { if (localStorage.getItem('matata-v2-joined') === '1') $('#joined').classList.add('on'); } catch (x) {}
  }

  // ---------- kindergarten form ----------
  if (org) {
    var ostarted = false, orgBtn = $('#orgSubmit'); if (orgBtn) orgBtn.dataset.label = orgBtn.innerHTML;
    org.addEventListener('focusin', function () { if (!ostarted) { ostarted = true; track('engage', { what: 'org_form_start' }); } });
    function oerr(name, msg, field) {
      var p = org.querySelector('[data-err="' + name + '"]'); if (p) p.textContent = msg || '';
      var f = org.elements[field]; if (f && f.setAttribute) f.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg) track('form_error', { form: 'istaiga', field: name });
    }
    org.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      if (!val(org, 'org_role')) { oerr('org_role', 'Pasirinkite vaidmenį.', 'org_role'); ok = false; } else oerr('org_role', '', 'org_role');
      if (val(org, 'org_name').length < 2) { oerr('org_name', 'Įrašykite darželio pavadinimą.', 'org_name'); ok = false; } else oerr('org_name', '', 'org_name');
      if (val(org, 'city').length < 2) { oerr('org_city', 'Įrašykite miestą.', 'city'); ok = false; } else oerr('org_city', '', 'city');
      if (val(org, 'parent_name').length < 2) { oerr('org_contact', 'Įrašykite savo vardą.', 'parent_name'); ok = false; } else oerr('org_contact', '', 'parent_name');
      if (!EMAIL.test(val(org, 'email'))) { oerr('org_email', 'Patikrinkite el. paštą: reikia @ ir taško.', 'email'); ok = false; } else oerr('org_email', '', 'email');
      if (!org.elements.consent_contact.checked) { oerr('org_consent', 'Be sutikimo negalėsime susisiekti.', 'consent_contact'); ok = false; } else oerr('org_consent', '', 'consent_contact');
      if (!ok) { var bad = org.querySelector('[aria-invalid="true"]'); if (bad) { bad.focus({ preventScroll: true }); scrollToEl(bad, 120); } return; }
      var btn = orgBtn; btn.disabled = true; btn.textContent = 'Siunčiame…'; org.classList.add('sending'); oerr('org_submit', '');
      function odone() {
        $$('.fstep', org).forEach(function (s) { s.classList.remove('on'); });
        $('#orgDoneWhere').textContent = val(org, 'org_name') ? '„' + val(org, 'org_name').slice(0, 60) + '"' : 'jūsų darželį';
        var d = $('#orgDone'); d.classList.add('on'); org.classList.remove('sending'); restoreBtn(orgBtn); d.focus({ preventScroll: true }); scrollToEl(org); celebrate($('#orgConfetti'));
        setTimeout(function () { consentMaybe('done'); }, 1200);
      }
      if (val(org, 'website')) { track('form_error', { form: 'istaiga', field: 'honeypot' }); odone(); return; }
      var payload = {
        product: 'matata', lead_type: 'istaiga',
        org_role: val(org, 'org_role').slice(0, 60), org_name: val(org, 'org_name').slice(0, 160), org_size: val(org, 'org_size').slice(0, 40) || null,
        city: val(org, 'city').slice(0, 40), parent_name: val(org, 'parent_name').slice(0, 80),
        email: val(org, 'email').toLowerCase().slice(0, 160), phone: val(org, 'phone').slice(0, 30) || null,
        location_pref: 'darzelis', src: SRC.slice(0, 60), page_version: 'v2', consent_contact: true, consent_text_version: 'v2'
      };
      post(payload).then(function () {
        odone(); track('value', { step: 'org_lead_submit', role: payload.org_role, size: payload.org_size || '' });
      }).catch(function (x) {
        org.classList.remove('sending'); btn.disabled = false; btn.textContent = 'Bandyti dar kartą';
        oerr('org_submit', humanError(x.status)); track('error', { where: 'org_lead_submit', code: x.status || 0 });
      });
    });
    var os = $('#orgShareBtn');
    if (os) os.addEventListener('click', function () { share(os, 'istaiga_done', 'Robotika be ekrano 3–4 metų vaikams darželyje.', 'share-darzelis'); });
  }

  function celebrate(box) {
    if (reduce || !box) return;
    var cols = ['#56B13F', '#FEC404', '#3F6EDC', '#E6483B', '#F7A11A', '#6A41D4'];
    for (var i = 0; i < 40; i++) {
      var s = document.createElement('i');
      s.style.left = (Math.random() * 100) + '%'; s.style.background = cols[i % cols.length];
      s.style.animationDelay = (Math.random() * .5) + 's'; s.style.animationDuration = (1.3 + Math.random() * .9) + 's';
      s.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
      s.style.position = 'absolute'; s.style.top = '-12px'; s.style.width = '10px'; s.style.height = '14px'; s.style.borderRadius = '3px'; s.style.opacity = '0'; s.style.animationName = 'fall'; s.style.animationFillMode = 'forwards'; s.style.animationTimingFunction = 'cubic-bezier(.16,1,.3,1)';
      box.appendChild(s);
    }
    setTimeout(function () { box.innerHTML = ''; }, 3000);
  }

  // ---------- consent gate: Clarity only after „Leisti" ----------
  var banner = $('#consent'), CONSENT_KEY = 'matata-consent-v2', CLARITY_ID = CFG.clarityId || '';
  var saved = null; try { saved = localStorage.getItem(CONSENT_KEY); } catch (e) {}
  function loadClarity() {
    if (!CLARITY_ID || window.__clarityLoaded) { if (window.clarity) { try { window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' }); } catch (e) {} } return; }
    window.__clarityLoaded = true;
    (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, 'clarity', 'script', CLARITY_ID);
    try { window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' }); } catch (e) {}
  }
  function dropClarityCookies() {
    var host = location.hostname, past = 'expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    ['_clck', '_clsk'].forEach(function (n) {
      document.cookie = n + '=; ' + past;
      document.cookie = n + '=; ' + past + '; domain=' + host;
      document.cookie = n + '=; ' + past + '; domain=.' + host;
    });
  }
  function closeBanner() { banner.classList.remove('on'); body.classList.remove('consent-open'); body.style.removeProperty('--consent-h'); }
  function decide(v) {
    saved = v;
    try { localStorage.setItem(CONSENT_KEY, v); } catch (e) {}
    closeBanner();
    if (v === 'all') loadClarity();
    else { if (window.clarity) { try { window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' }); } catch (e) {} } dropClarityCookies(); }
    track('consent', { choice: v });
  }
  function openBanner(why) {
    banner.classList.add('on'); body.classList.add('consent-open');
    body.style.setProperty('--consent-h', (banner.offsetHeight || 0) + 'px');
    track('engage', { what: 'consent_open', why: why || 'auto' });
  }
  var consentAsked = false;
  // auto-open only when it cannot cover the form: never right after a CTA/nav jump, never while the form is in view
  function consentMaybe(why) {
    if (consentAsked || saved || !CLARITY_ID || banner.classList.contains('on')) return;
    if (why !== 'done') { if (Date.now() - lastNavClick < 1500) return; if (formIn) return; if (why !== 'dwell' && !heroOut) return; }
    consentAsked = true; openBanner(why);
  }
  if (saved === 'all') loadClarity();
  setTimeout(function () { consentMaybe('dwell'); }, 25000);
  $('#consentYes').addEventListener('click', function () { decide('all'); });
  $('#consentNo').addEventListener('click', function () { decide('essential'); });
  var co = $('#consentOpen'); if (co) co.addEventListener('click', function () { consentAsked = true; openBanner('footer'); });
  window.addEventListener('resize', function () { if (banner.classList.contains('on')) body.style.setProperty('--consent-h', banner.offsetHeight + 'px'); if (body.classList.contains('show-bar') && barEl) body.style.setProperty('--bar-h', barEl.offsetHeight + 'px'); });
})();
