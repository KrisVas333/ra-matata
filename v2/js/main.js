/* Matata v2 · vanilla JS + GSAP (one authored hero moment + stepper line).
   Everything renders without JS; this file adds config rendering, tracking, forms, game, consent. */
(function () {
  'use strict';

  var CFG = window.RA_CFG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var body = document.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var params = new URLSearchParams(location.search);
  function clean(v, n) { return (v || '').replace(/[^a-z0-9_.-]/gi, '').slice(0, n || 40); }
  var SRC = clean(params.get('src'), 40) || 'direct';
  var UTM_S = clean(params.get('utm_source'), 40);
  var UTM_C = clean(params.get('utm_campaign'), 60);
  var HAS_FB = params.has('fbclid') ? 1 : 0;

  // ---------- tracking: EVERY event carries version + src (+ utm when present) ----------
  function track(name, props) {
    if (typeof window.bt !== 'function') return;
    var base = { version: 'v2', src: SRC };
    if (UTM_S) base.utm_source = UTM_S;
    if (UTM_C) base.utm_campaign = UTM_C;
    if (HAS_FB) base.fbclid = 1;
    try { window.bt(name, Object.assign(base, props || {})); } catch (e) {}
  }
  window.__mt = track;

  // ---------- config rendering into [data-cfg] slots ----------
  function get(path) {
    return path.split('.').reduce(function (o, k) { return (o && o[k] !== undefined) ? o[k] : undefined; }, CFG);
  }
  function money(n) { return String(n).replace('.', ','); }
  function calc(key) {
    var lpm = CFG.lessonsPerMonth || 4;
    if (key === 'perLesson.darzelis') return money((get('prices.darzelis.amount') / lpm).toFixed(2).replace(/\.?0+$/, ''));
    if (key === 'perLesson.centras') return money((get('prices.centras.amount') / lpm).toFixed(2).replace(/\.?0+$/, ''));
    if (key === 'ltVoice') return get('claims.ltVoiceBuiltIn') ? get('claims.ltVoiceBuiltInText') : get('claims.ltVoiceRecorded');
    return undefined;
  }
  function renderCfg() {
    $$('[data-cfg]').forEach(function (el) {
      var p = el.getAttribute('data-cfg'), v;
      if (p.indexOf('calc:') === 0) v = calc(p.slice(5)); else v = get(p);
      if (v === undefined || v === null) return;
      if (typeof v === 'number') v = money(v);
      if (el.textContent !== String(v)) el.textContent = String(v);
    });
    // the free-lesson chip is injected ONLY when config.firstLessonFree is true (nothing of it exists in the HTML otherwise)
    if (CFG.firstLessonFree && CFG.firstLessonFreeText) {
      var ft = CFG.firstLessonFreeText || '';
      var facts = $('.hero .facts'); if (facts) { var li = document.createElement('li'); li.className = 'free'; li.textContent = ft; facts.appendChild(li); }
      $$('.pc').forEach(function (pc) { var s = document.createElement('span'); s.className = 'free'; s.textContent = ft; pc.insertBefore(s, $('.btn', pc)); });
      var bt = $('.bar .txt span'); if (bt) bt.textContent += ' · ' + ft;
      var fp = $('#faqPrice'); if (fp) fp.textContent += ' ' + ft + '.';
    }
    // STEM.org seal: only while the credential is valid and switched on
    var stem = $('#stem'), so = get('trust.stemOrg') || {};
    if (stem) {
      var today = new Date().toISOString().slice(0, 10);
      var ok = so.show !== false && (!so.validUntil || today <= so.validUntil);
      stem.classList.toggle('off', !ok);
      var a = $('a', stem); if (a && so.href) a.href = so.href;
    }
    var rating = $('#rating'); if (rating) rating.classList.toggle('off', !(get('trust.rating.show')));
    $$('[data-trust]').forEach(function (li) { var t = get('trust.' + li.getAttribute('data-trust')); if (t && t.show === false) li.style.display = 'none'; });
    body.classList.toggle('coi', !!(CFG.coi && CFG.coi.show && CFG.coi.text));
    // testimonials from config (placeholders stay visibly marked)
    var box = $('#testimonials');
    if (box && Array.isArray(CFG.testimonials) && CFG.testimonials.length) {
      var ava = '<span class="ava" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="17" r="8"/><path d="M8 42c0-9 7-14 16-14s16 5 16 14"/></svg></span>';
      box.innerHTML = CFG.testimonials.map(function (t) {
        var ph = t.placeholder !== false;
        return '<article class="tcard' + (ph ? '' : ' real') + '" data-placeholder="' + (ph ? 1 : 0) + '" data-role="' + esc(t.role) + '"' + (ph ? '' : ' style="border-style:solid"') + '>' +
          (ph ? '<span class="ph-label">Pavyzdys · čia bus tikras atsiliepimas</span>' : '') +
          '<p class="q">' + esc(t.quote || '') + '</p>' +
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
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  renderCfg();

  // ---------- age (3 / 4): ?age=, saved choice, invalid -> 4 ----------
  function setAge(age, quiet, where) {
    age = (age === '3' || age === '4') ? age : (CFG.product && CFG.product.defaultAge) || '4';
    body.setAttribute('data-age', age);
    $$('[data-set-age]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-set-age') === age)); });
    var r = $('input[name="child_age"][value="' + age + '"]'); if (r) r.checked = true;
    try { localStorage.setItem('matata-age', age); } catch (e) {}
    if (!quiet) track('engage', { what: 'age_switch', age: age, where: where || 'dna' });
  }
  var startAge = params.get('age');
  if (!startAge) { try { startAge = localStorage.getItem('matata-age'); } catch (e) {} }
  setAge(startAge, true);
  $$('[data-set-age]').forEach(function (b) { b.addEventListener('click', function () { setAge(b.getAttribute('data-set-age'), false, b.closest('section') ? b.closest('section').id : 'page'); }); });

  // ---------- join tabs (parents / kindergarten) ----------
  var wl = $('#wlform'), org = $('#orgform');
  function jtab(which, quiet) {
    var isOrg = which === 'istaiga';
    if (wl) wl.hidden = isOrg; if (org) org.hidden = !isOrg;
    $$('[data-jtab]').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-jtab') === which)); });
    if (!quiet) track('engage', { what: 'tab', id: 'join_' + which });
  }
  $$('[data-jtab]').forEach(function (b) { b.addEventListener('click', function () { jtab(b.getAttribute('data-jtab')); }); });
  function openOrg() { jtab('istaiga', true); }
  if (location.hash === '#darzeliams') openOrg();

  // ---------- CTAs: tracking + prefill ----------
  $$('[data-cta]').forEach(function (a) {
    a.addEventListener('click', function () {
      var where = a.getAttribute('data-cta');
      var href = a.getAttribute('href') || '';
      var p = { where: where, age: body.getAttribute('data-age') };
      if (href.indexOf('mailto:') === 0) p.kind = 'email'; else if (href.indexOf('tel:') === 0) p.kind = 'tel';
      track('cta', p);
      if (href === '#darzeliams') openOrg(); else if (href === '#sarasas') jtab('tevai', true);
      var loc = a.getAttribute('data-loc');
      if (loc) { var r = $('input[name="location_pref"][value="' + loc + '"]'); if (r) r.checked = true; }
    });
  });
  // in-page nav links + outbound links (every meaningful click fires an event)
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    if (a.hasAttribute('data-cta')) return;
    var href = a.getAttribute('href') || '';
    if (href.charAt(0) === '#') { track('engage', { what: 'nav', to: href.slice(1, 40), from: (a.closest('header') ? 'header' : a.closest('footer') ? 'footer' : 'body') }); if (href === '#darzeliams') openOrg(); return; }
    if (href.indexOf('tel:') === 0) { track('cta', { where: 'tel', kind: 'tel' }); return; }
    if (href.indexOf('mailto:') === 0) { track('cta', { where: 'email', kind: 'email' }); return; }
    if (/^https?:/.test(href)) { var h = href.split('/')[2] || ''; track('cta', { where: 'out', kind: a.getAttribute('data-out') || 'link', host: h.slice(0, 60) }); }
  }, { capture: true, passive: true });

  // ---------- secondary sections: collapsed on phones, open on desktop ----------
  var MOB_DETAILS = ['gameBox', 'goalsBox', 'wefBox', 'rulesBox', 'tstBox', 'elsewhereBox', 'faqBox'];
  function syncDetails() {
    var desk = window.innerWidth >= 860;
    MOB_DETAILS.forEach(function (id) { var d = $('#' + id); if (d && desk && !d.open) d.open = true; });
  }
  syncDetails();
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(syncDetails, 150); });
  // FAQ: 4 visible, the rest behind one button
  var faqMore = $('#faqMore'), faqMoreBox = $('#faqMoreBox');
  if (faqMore && faqMoreBox) faqMore.addEventListener('click', function () { faqMoreBox.hidden = false; faqMore.setAttribute('aria-expanded', 'true'); faqMore.hidden = true; track('engage', { what: 'faq_more' }); var f = faqMoreBox.querySelector('summary'); if (f) f.focus(); });

  // ---------- pillars accordion (mobile; always open on desktop via CSS) ----------
  $$('.pl .head').forEach(function (h) {
    h.addEventListener('click', function () {
      if (window.innerWidth >= 860) return;
      var art = h.closest('.pl'); var open = !art.classList.contains('open');
      art.classList.toggle('open', open); h.setAttribute('aria-expanded', String(open));
      if (open) track('engage', { what: 'pillar', id: art.id });
    });
  });

  // ---------- every <details> toggle is tracked (FAQ, WEF, elsewhere, sources) ----------
  $$('details').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      if (d.classList.contains('mob-details')) { if (window.innerWidth < 860) track('engage', { what: 'expand', id: d.id || 'details' }); return; } // desktop opens them by layout
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
    pv.addEventListener('play', function () { pvPlay.classList.add('off'); pv.controls = true; if (!fired) { fired = true; track('engage', { what: 'video_play', id: 'pristatymas' }); } });
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
          else { say('Robotas sustojo čia. Bandome dar kartą?', 2200); track('engage', { what: 'game_miss', moves: seq.length, run: runs }); }
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
      var h1 = $('#h1');
      if (h1 && !h1.dataset.split) {
        h1.dataset.split = '1';
        h1.innerHTML = h1.innerHTML.replace(/(<em>.*?<\/em>|[^\s<]+)/g, function (m) { return '<span class="w" style="display:inline-block">' + m + '</span>'; });
      }
      var tl = g.timeline({ defaults: { ease: 'expo.out' } });
      tl.from('.stage .kid', { y: 26, opacity: 0, scale: .96, duration: .9 }, 0)
        .from('.bubble', { scale: .6, opacity: 0, duration: .55, ease: 'back.out(1.8)' }, .55)
        .from($$('#h1 .w'), { y: 18, opacity: 0, duration: .55, stagger: .035 }, .15)
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

  // ---------- sticky bar: hero out AND form not in view ----------
  var hero = $('#hero'), join = $('#sarasas'), heroOut = false, formIn = false;
  function bar() { body.classList.toggle('show-bar', heroOut && !formIn); }
  if ('IntersectionObserver' in window && hero) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { heroOut = !e.isIntersecting && e.boundingClientRect.top < 0; bar(); if (heroOut && typeof window.__consentMaybe === 'function') window.__consentMaybe(); }); }, { threshold: 0 }).observe(hero);
    if (join) new IntersectionObserver(function (es) { es.forEach(function (e) { formIn = e.isIntersecting; bar(); if (e.isIntersecting && !join.dataset.seen) { join.dataset.seen = '1'; track('engage', { what: 'form_view' }); } }); }, { threshold: 0.15 }).observe(join);
    [['#meile-mokytis', 'dna_view'], ['#ateities-kompetencijos', 'future_view'], ['#kaina', 'price_view'], ['#mentoriai', 'mentor_view'], ['#pabandykite', 'game_view']].forEach(function (pair) {
      var el = $(pair[0]); if (!el) return;
      new IntersectionObserver(function (es, io) { es.forEach(function (e) { if (e.isIntersecting) { track('engage', { what: pair[1] }); io.disconnect(); } }); }, { threshold: 0.3 }).observe(el);
    });
  }

  // ---------- human error copy (never a raw HTTP code) ----------
  function humanError(status) {
    if (status === 0) return 'Nėra ryšio. Patikrinkite internetą ir bandykite dar kartą.';
    if (status === 400 || status === 422) return 'Patikrinkite laukus: tekstas per ilgas arba netinkamo formato (miestas iki 40 ženklų).';
    if (status === 409) return 'Atrodo, šis el. paštas jau sąraše. Jei norite pridėti kitą vaiką, parašykite info@robotikosakademija.lt.';
    if (status === 401 || status === 403) return 'Nepavyko išsiųsti. Pabandykite dar kartą arba parašykite info@robotikosakademija.lt su tema „Matata".';
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
  function val(form, name) { var e = form.elements[name]; if (!e) return ''; if (e.length && !e.value && e[0] && e[0].type === 'radio') { for (var i = 0; i < e.length; i++) if (e[i].checked) return e[i].value; return ''; } return (e.value || '').trim(); }
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // ---------- parents form (3 steps) ----------
  if (wl) {
    var steps = $$('.fstep', wl), cur = 1, total = steps.length, prog = $$('.prog i', wl), ann = $('#stepAnn'), started = false;
    function err(name, msg, field) {
      var p = wl.querySelector('[data-err="' + name + '"]'); if (p) p.textContent = msg || '';
      var f = wl.elements[field || name]; if (f && f.setAttribute) f.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg) track('error', { where: 'form', field: name });
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
      if (n === 1) { if (val(wl, 'city').length < 2) { err('city', 'Įrašykite miestą, kad žinotume, kur atidaryti grupę.'); ok = false; } else err('city'); }
      if (n === 2) {
        if (val(wl, 'parent_name').length < 2) { err('parent_name', 'Įrašykite vardą, kad žinotume, kaip kreiptis.'); ok = false; } else err('parent_name');
        if (!EMAIL.test(val(wl, 'email'))) { err('email', 'Patikrinkite el. paštą: reikia @ ir taško, pvz. vardas@pastas.lt.'); ok = false; } else err('email');
      }
      if (n === 3) { if (!wl.elements.consent_contact.checked) { err('consent_contact', 'Be sutikimo negalėsime parašyti, kai atsidarys grupė.'); ok = false; } else err('consent_contact'); }
      if (!ok) focusFirst(n);
      return ok;
    }
    function product() { var a = val(wl, 'child_age'); return a === '3' ? 'matata-3' : a === '4' ? 'matata-4' : 'matata'; }
    function whereText() { var l = val(wl, 'location_pref'); return l === 'darzelis' ? 'jūsų darželyje' : l === 'ra-centras' ? 'Tech Zity centre' : 'jūsų darželyje arba Tech Zity centre'; }
    function summary() { var a = val(wl, 'child_age'); var s = $('#summary'); if (s) s.textContent = (a === 'kitas' ? 'Vaikas: kito amžiaus' : 'Vaikas: ' + a + ' m.') + ' · ' + val(wl, 'city') + ' · ' + whereText() + ' · ' + val(wl, 'email'); }
    function days() { return $$('input[name="preferred_day"]:checked', wl).map(function (c) { return c.value; }).join(','); }
    wl.addEventListener('focusin', function () { if (!started) { started = true; track('engage', { what: 'form_start' }); } });
    wl.addEventListener('click', function (e) {
      var t = e.target.closest('[data-next],[data-prev]'); if (!t) return;
      if (t.hasAttribute('data-next')) { if (validate(cur)) show(Math.min(cur + 1, total)); } else show(Math.max(cur - 1, 1), true);
    });
    $$('input[name="child_age"]', wl).forEach(function (r) { r.addEventListener('change', function () { if (r.value === '3' || r.value === '4') setAge(r.value, true); track('engage', { what: 'form_age', age: r.value }); }); });
    $$('input[name="location_pref"]', wl).forEach(function (r) { r.addEventListener('change', function () { track('engage', { what: 'form_location', loc: r.value }); }); });
    wl.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && cur < total) { e.preventDefault(); if (validate(cur)) show(cur + 1); } });

    function done() {
      steps.forEach(function (s) { s.classList.remove('on'); }); $('.prog', wl).style.display = 'none';
      $('#doneWhere').textContent = whereText();
      var d = $('#done'); d.classList.add('on'); wl.classList.remove('sending'); d.focus({ preventScroll: true }); scrollToEl(wl); celebrate($('#confetti'));
      try { localStorage.setItem('matata-v2-joined', '1'); } catch (x) {}
    }
    wl.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(total)) return;
      var btn = $('#submitBtn'); btn.disabled = true; btn.textContent = 'Siunčiame…'; wl.classList.add('sending'); err('submit');
      if (val(wl, 'website')) { track('error', { where: 'honeypot', form: 'tevai' }); done(); return; }
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
        track('value', { step: 'waitlist_submit', product: payload.product, location: payload.location_pref, has_phone: payload.phone ? 1 : 0 });
      }).catch(function (x) {
        wl.classList.remove('sending'); btn.disabled = false; btn.textContent = 'Bandyti dar kartą';
        err('submit', humanError(x.status)); track('error', { where: 'waitlist_submit', code: x.status || 0 });
      });
    });
    // share + "another child"
    var shareBtn = $('#shareBtn');
    function share(btn, text) {
      var url = (CFG.siteUrl || location.href.split('#')[0].split('?')[0]) + '?src=share';
      if (navigator.share) { navigator.share({ title: 'Matata: robotas ir pasakų knyga. Be ekrano.', text: text, url: url }).catch(function () {}); }
      else if (navigator.clipboard) { navigator.clipboard.writeText(url).then(function () { btn.textContent = 'Nuoroda nukopijuota'; track('share', { how: 'copy' }); }).catch(function () {}); }
    }
    if (shareBtn) shareBtn.addEventListener('click', function () { share(shareBtn, 'Robotika be ekrano 3–4 metų vaikams darželyje.'); });
    function again() {
      $('#done').classList.remove('on'); $('.prog', wl).style.display = ''; wl.reset(); setAge(body.getAttribute('data-age'), true);
      $('#joined').classList.remove('on'); show(1); track('engage', { what: 'form_again' });
    }
    var againBtn = $('#againBtn'); if (againBtn) againBtn.addEventListener('click', again);
    var joinAgain = $('#joinAgain'); if (joinAgain) joinAgain.addEventListener('click', function () { $('#joined').classList.remove('on'); track('engage', { what: 'form_again' }); });
    try { if (localStorage.getItem('matata-v2-joined') === '1') $('#joined').classList.add('on'); } catch (x) {}
  }

  // ---------- kindergarten form ----------
  if (org) {
    var ostarted = false;
    org.addEventListener('focusin', function () { if (!ostarted) { ostarted = true; track('engage', { what: 'org_form_start' }); } });
    function oerr(name, msg, field) {
      var p = org.querySelector('[data-err="' + name + '"]'); if (p) p.textContent = msg || '';
      var f = org.elements[field]; if (f && f.setAttribute) f.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg) track('error', { where: 'org_form', field: name });
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
      var btn = $('#orgSubmit'); btn.disabled = true; btn.textContent = 'Siunčiame…'; org.classList.add('sending'); oerr('org_submit', '');
      function odone() {
        $$('.fstep', org).forEach(function (s) { s.classList.remove('on'); });
        $('#orgDoneWhere').textContent = val(org, 'org_name') ? '„' + val(org, 'org_name').slice(0, 60) + '"' : 'jūsų darželį';
        var d = $('#orgDone'); d.classList.add('on'); org.classList.remove('sending'); d.focus({ preventScroll: true }); scrollToEl(org); celebrate($('#orgConfetti'));
      }
      if (val(org, 'website')) { track('error', { where: 'honeypot', form: 'istaiga' }); odone(); return; }
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
    if (os) os.addEventListener('click', function () {
      var url = (CFG.siteUrl || location.href.split('#')[0]) + '?src=share-darzelis';
      if (navigator.share) navigator.share({ title: 'Matata darželiams', text: 'Robotika be ekrano 3–4 metų vaikams darželyje.', url: url }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { os.textContent = 'Nuoroda nukopijuota'; track('share', { how: 'copy' }); }).catch(function () {});
    });
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
  function loadClarity() {
    if (!CLARITY_ID || window.__clarityLoaded) return;
    window.__clarityLoaded = true;
    (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, 'clarity', 'script', CLARITY_ID);
    try { window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' }); } catch (e) {}
  }
  function decide(v) {
    try { localStorage.setItem(CONSENT_KEY, v); } catch (e) {}
    banner.classList.remove('on'); body.classList.remove('consent-open');
    if (v === 'all') loadClarity();
    else if (window.clarity) { try { window.clarity('consent', false); } catch (e) {} }
    track('consent', { choice: v });
  }
  function openBanner(why) { banner.classList.add('on'); body.classList.add('consent-open'); track('engage', { what: 'consent_open', why: why || 'auto' }); }
  var saved = null; try { saved = localStorage.getItem(CONSENT_KEY); } catch (e) {}
  if (saved === 'all') loadClarity();
  window.__consentMaybe = function () { if (!saved && CLARITY_ID && !banner.classList.contains('on')) { openBanner('auto'); window.__consentMaybe = null; } };
  $('#consentYes').addEventListener('click', function () { decide('all'); });
  $('#consentNo').addEventListener('click', function () { decide('essential'); });
  var co = $('#consentOpen'); if (co) co.addEventListener('click', function () { openBanner('footer'); });
})();
