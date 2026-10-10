/* Matata landing · vanilla JS + GSAP (hero moment + stepper line only) */
(function () {
  'use strict';

  // ---------- config ----------
  var SUPABASE_URL = 'https://iiekmeylpppczicrsxho.supabase.co/rest/v1/ra_waitlist';
  var SUPABASE_KEY = 'sb_publishable_iJC59f30YJm7hU4OwZsLDQ_9FN-ygzF';
  var CLARITY_ID = 'yvonvcmo2n'; // Clarity project (Strict masking), loads ONLY after „Leisti".
  var CONSENT_KEY = 'matata-consent-v1';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var params = new URLSearchParams(location.search);
  var SRC = (params.get('src') || 'direct').replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'direct';
  function track(name, props) { if (typeof window.bt === 'function') { try { window.bt(name, Object.assign({ src: SRC }, props || {})); } catch (e) {} } }

  // ---------- age switch (central element) ----------
  var body = document.body;
  function setAge(age, quiet) {
    age = age === '4' ? '4' : '3';
    body.setAttribute('data-age', age);
    $$('[data-set-age]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-set-age') === age)); });
    var r = $('input[name="child_age"][value="' + age + '"]');
    if (r) r.checked = true;
    try { localStorage.setItem('matata-age', age); } catch (e) {}
    if (!quiet) track('engage', { age: age, what: 'age_switch' });
  }
  var startAge = params.get('age');
  if (!startAge) { try { startAge = localStorage.getItem('matata-age'); } catch (e) {} }
  setAge(startAge || '4', true);
  $$('[data-set-age]').forEach(function (b) { b.addEventListener('click', function () { setAge(b.getAttribute('data-set-age')); }); });

  // ---------- CTA tracking + interest prefill ----------
  $$('[data-cta]').forEach(function (a) {
    a.addEventListener('click', function () {
      track('cta', { where: a.getAttribute('data-cta'), age: body.getAttribute('data-age') });
      var it = a.getAttribute('data-interest');
      if (it) { var r = $('input[name="interest"][value="' + it + '"]'); if (r) r.checked = true; var l = $('input[name="location_pref"][value="namuose"]'); if (l) l.checked = true; }
    });
  });

  // ---------- intro video: click-to-play, poster only until then ----------
  var pv = $('#pv'), pvPlay = $('#pvPlay');
  if (pv && pvPlay) {
    pvPlay.addEventListener('click', function () { pvPlay.classList.add('off'); var p = pv.play(); if (p && p.catch) p.catch(function () {}); });
    var fired = false;
    pv.addEventListener('play', function () { pvPlay.classList.add('off'); pv.controls = true; if (!fired) { fired = true; track('value', { step: 'video_play', age: body.getAttribute('data-age') }); } });
  }

  // ---------- outcomes: tabs on mobile (one period at a time) ----------
  function showOut(i) {
    $$('.out-grid').forEach(function (g) { $$('.out', g).forEach(function (o, k) { o.classList.toggle('show', k === i); }); });
    $$('.out-tabs [data-out]').forEach(function (b) { b.setAttribute('aria-selected', String(+b.getAttribute('data-out') === i)); });
  }
  showOut(1);
  $$('.out-tabs [data-out]').forEach(function (b) { b.addEventListener('click', function () { showOut(+b.getAttribute('data-out')); track('engage', { what: 'outcome_tab', i: b.getAttribute('data-out') }); }); });

  // ---------- collapsible sections on mobile ----------
  $$('[data-collapsible] .mob-sum').forEach(function (b) {
    b.addEventListener('click', function () {
      var sec = b.closest('[data-collapsible]'); var open = !sec.classList.contains('open');
      sec.classList.toggle('open', open); b.setAttribute('aria-expanded', String(open));
      if (open) track('engage', { what: 'expand', id: b.getAttribute('aria-controls') });
    });
  });

  // ---------- sticky bar: show once the hero is scrolled past ----------
  var hero = $('.hero');
  if ('IntersectionObserver' in window && hero) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { var out = !e.isIntersecting && e.boundingClientRect.top < 0; body.classList.toggle('show-bar', out); if (out && typeof window.__consentMaybe === 'function') window.__consentMaybe(); });
    }, { threshold: 0 }).observe(hero);
    var wl = $('#sarasas');
    if (wl) new IntersectionObserver(function (es) {
      es.forEach(function (e) { body.classList.toggle('at-form', e.isIntersecting); if (e.isIntersecting) body.classList.remove('show-bar'); });
    }, { threshold: 0.15 }).observe(wl);
  }

  // ---------- lite YouTube: iframe only on click, nocookie domain ----------
  $$('.yt').forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-yt');
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&hl=lt';
      f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      f.allowFullscreen = true; f.title = b.getAttribute('aria-label') || 'YouTube';
      b.innerHTML = ''; b.appendChild(f); b.disabled = true; b.style.cursor = 'default';
      track('engage', { what: 'video', id: id });
    });
  });

  // ---------- GSAP: ONE authored hero moment + stepper line ----------
  function motion() {
    if (!window.gsap) return;
    var g = window.gsap;
    if (window.ScrollTrigger) g.registerPlugin(window.ScrollTrigger);
    var mm = g.matchMedia();

    mm.add({ ok: '(prefers-reduced-motion: no-preference)', reduceMotion: '(prefers-reduced-motion: reduce)' }, function (ctx) {
      var ok = ctx.conditions.ok;
      var tiles = $$('.tiles .t'), cmds = $$('.cmd .c'), card = $('.robot-card'), badge = $('.badge');
      if (!ok) { tiles.forEach(function (t) { t.classList.add('on'); }); return; }

      // split the visible h1 into words once
      var h1 = $('.hero-copy h1');
      $$('span[data-age-only]', h1).forEach(function (s) {
        if (s.dataset.split) return; s.dataset.split = '1';
        s.innerHTML = s.innerHTML.replace(/(<em>.*?<\/em>|[^\s<]+)/g, function (m) { return '<span class="w">' + m + '</span>'; });
      });

      var tl = g.timeline({ defaults: { ease: 'expo.out' } });
      tl.from('.tiles', { opacity: 0, duration: .5 }, 0)
        .to(tiles, { opacity: 1, duration: .25, stagger: .07, ease: 'power1.out' }, .15)
        .from(card, { x: -70, rotation: -4, opacity: 0, duration: .9 }, .35)
        .from(cmds, { scale: .5, y: 14, opacity: 0, duration: .5, stagger: .09, ease: 'back.out(1.8)' }, .55)
        .from(badge, { scale: .7, opacity: 0, duration: .5, ease: 'back.out(2)' }, 1.0)
        .from($$('.w', $('.hero-copy h1 [data-age-only="' + body.getAttribute('data-age') + '"]')), { y: 18, opacity: 0, duration: .6, stagger: .035 }, .25)
        .from(['.hero .lead', '.hero-cta', '.hero-facts'], { y: 14, opacity: 0, duration: .6, stagger: .08 }, .6);

      // stepper line draws as the list scrolls (scrub)
      var line = $('.steps .line');
      if (line && window.ScrollTrigger) {
        g.to(line, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 70%', end: 'bottom 60%', scrub: .6 } });
        g.from($$('.step .min'), { scale: .6, ease: 'back.out(2)', duration: .4, stagger: .08, scrollTrigger: { trigger: '.steps', start: 'top 80%', once: true } });
      }
      // safety net: whatever happens, everything is visible after 3 s
      setTimeout(function () { if (tl.progress() < 1) { tl.progress(1); } }, 3000);
      return function () { tl.kill(); };
    });
  }
  if (window.gsap) motion(); else window.addEventListener('load', function () { if (window.gsap) motion(); else $$('.tiles .t').forEach(function (t) { t.classList.add('on'); }); });

  // ---------- multi-step waitlist form ----------
  var form = $('#wlform');
  if (form) {
    var steps = $$('.fstep', form), cur = 1, total = steps.length;
    var prog = $$('.prog i', form), ann = $('#stepAnn');
    function err(name, msg) { var p = form.querySelector('[data-err="' + name + '"]'); if (p) p.textContent = msg || ''; var f = form.elements[name]; if (f && f.setAttribute) f.setAttribute('aria-invalid', msg ? 'true' : 'false'); }
    function show(n) {
      cur = n; steps.forEach(function (s) { s.classList.toggle('on', +s.dataset.step === n); });
      prog.forEach(function (p, i) { p.classList.toggle('on', i < n); });
      if (ann) ann.textContent = n + ' žingsnis iš ' + total;
      if (n === total) summary();
      var first = steps[n - 1].querySelector('input:not([type=radio]):not([type=checkbox]), h3');
      if (first && first.focus) { first.setAttribute('tabindex', '-1'); first.focus({ preventScroll: true }); }
      track('engage', { what: 'form_step', step: n });
    }
    function val(name) { var e = form.elements[name]; if (!e) return ''; if (e.length && !e.value && e[0] && e[0].type === 'radio') { for (var i = 0; i < e.length; i++) if (e[i].checked) return e[i].value; return ''; } return (e.value || '').trim(); }
    function days() { return $$('input[name="preferred_day"]:checked', form).map(function (c) { return c.value; }).join(','); }
    function validate(n) {
      var ok = true;
      if (n === 1) { if (val('city').length < 2) { err('city', 'Įrašykite miestą arba darželį, kad žinotume, kur atidaryti grupę.'); ok = false; } else err('city'); }
      if (n === 3) {
        if (val('parent_name').length < 2) { err('parent_name', 'Įrašykite vardą, kad žinotume, kaip kreiptis.'); ok = false; } else err('parent_name');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val('email'))) { err('email', 'Patikrinkite el. paštą: reikia @ ir taško, pvz. vardas@pastas.lt.'); ok = false; } else err('email');
      }
      if (n === 3) { if (!val('price_pref')) { err('price_pref', 'Pasirinkite vieną variantą, kad žinotume, kokia kaina jums tinka.'); ok = false; } else err('price_pref'); }
      if (n === 5) { if (!form.elements.consent_contact.checked) { err('consent_contact', 'Be sutikimo negalėsime parašyti, kai atsidarys grupė.'); ok = false; } else err('consent_contact'); }
      return ok;
    }
    function product() { var a = val('child_age'); return a === '3' ? 'matata-3' : a === '4' ? 'matata-4' : 'matata'; }
    function whereText() { var l = val('location_pref'); return l === 'darzelis' ? 'darželyje' : l === 'ra-centras' ? 'Robotikos akademijos centre' : 'namuose'; }
    function summary() {
      var a = val('child_age'); var s = $('#summary');
      if (s) s.textContent = (a === 'kitas' ? 'Vaikas: kito amžiaus' : 'Vaikas: ' + a + ' m.') + ' · ' + val('city') + ' · ' + whereText() + ' · ' + val('email');
    }
    form.addEventListener('click', function (e) {
      var t = e.target.closest('[data-next],[data-prev]'); if (!t) return;
      if (t.hasAttribute('data-next')) { if (validate(cur)) show(Math.min(cur + 1, total)); }
      else show(Math.max(cur - 1, 1));
    });
    $$('input[name="child_age"]', form).forEach(function (r) { r.addEventListener('change', function () { if (r.value === '3' || r.value === '4') setAge(r.value, true); }); });
    form.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && cur < total) { e.preventDefault(); if (validate(cur)) show(cur + 1); } });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(total)) return;
      var btn = $('#submitBtn'); btn.disabled = true; btn.textContent = 'Siunčiame…'; form.classList.add('sending'); err('submit');
      var payload = {
        product: product(),
        parent_name: val('parent_name').slice(0, 80),
        email: val('email').toLowerCase().slice(0, 120),
        phone: val('phone').slice(0, 30) || null,
        child_age: val('child_age'),
        city: val('city').slice(0, 120),
        location_pref: val('location_pref'),
        interest: val('interest'),
        price_pref: val('price_pref'),
        preferred_day: days() || null,
        src: SRC,
        consent_contact: true,
        consent_text_version: 'v1'
      };
      fetch(SUPABASE_URL, { method: 'POST', headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(payload) })
        .then(function (r) {
          if (r.status !== 201) throw new Error('HTTP ' + r.status);
          steps.forEach(function (s) { s.classList.remove('on'); }); $('.prog', form).style.display = 'none';
          $('#doneWhere').textContent = whereText() + (val('city') ? ' (' + val('city') + ')' : '');
          $('#done').classList.add('on'); form.classList.remove('sending'); celebrate();
          track('value', { step: 'waitlist_submit', product: payload.product, interest: payload.interest, location: payload.location_pref });
          try { localStorage.setItem('matata-joined', '1'); } catch (x) {}
        })
        .catch(function (x) {
          form.classList.remove('sending'); btn.disabled = false; btn.innerHTML = 'Bandyti dar kartą';
          err('submit', 'Nepavyko išsiųsti (' + x.message + '). Pabandykite dar kartą arba parašykite info@robotikosakademija.lt su tema „Matata".');
          track('error', { where: 'waitlist_submit', msg: x.message });
        });
    });
  }

  function celebrate() {
    if (reduce) return;
    var box = $('#confetti'); if (!box) return;
    var cols = ['#56B13F', '#FEC404', '#3F6EDC', '#E6483B', '#F7A11A', '#6A41D4'];
    for (var i = 0; i < 46; i++) {
      var s = document.createElement('i');
      s.style.left = (Math.random() * 100) + '%'; s.style.background = cols[i % cols.length];
      s.style.animationDelay = (Math.random() * .5) + 's'; s.style.animationDuration = (1.3 + Math.random() * .9) + 's';
      s.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
      box.appendChild(s);
    }
    setTimeout(function () { box.innerHTML = ''; }, 3000);
  }

  // ---------- consent gate: Clarity only after „Leisti" ----------
  var banner = $('#consent');
  function loadClarity() {
    if (!CLARITY_ID || window.clarity) return;
    (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, 'clarity', 'script', CLARITY_ID);
  }
  function decide(v) {
    try { localStorage.setItem(CONSENT_KEY, v); } catch (e) {}
    banner.classList.remove('on'); body.classList.remove('consent-open');
    if (v === 'all') loadClarity();
    track('engage', { what: 'consent', choice: v });
  }
  function openBanner() { banner.classList.add('on'); body.classList.add('consent-open'); }
  var saved = null; try { saved = localStorage.getItem(CONSENT_KEY); } catch (e) {}
  if (saved === 'all') loadClarity();
  window.__consentMaybe = function () { if (!saved && CLARITY_ID && !banner.classList.contains('on')) { openBanner(); window.__consentMaybe = null; } };
  $('#consentYes').addEventListener('click', function () { decide('all'); });
  $('#consentNo').addEventListener('click', function () { decide('essential'); });
  var co = $('#consentOpen'); if (co) co.addEventListener('click', openBanner);
})();
/* QA helper: ?qa=1 lists elements wider than the viewport in <pre id="qa"> (never shown to parents) */
(function(){ if(!/[?&]qa=1/.test(location.search)) return; window.addEventListener('load',function(){ setTimeout(function(){
  var w=document.documentElement.clientWidth, out=['clientWidth='+w,'scrollWidth='+document.documentElement.scrollWidth,'scrollHeight='+document.documentElement.scrollHeight];
  document.querySelectorAll('body *').forEach(function(el){ var r=el.getBoundingClientRect(); if(r.right>w+1&&r.width>0){ out.push((el.tagName+'.'+(el.className||'')).slice(0,60)+' right='+Math.round(r.right)+' w='+Math.round(r.width)); } });
  var p=document.createElement('pre'); p.id='qa'; p.textContent=out.slice(0,40).join('\n'); document.body.appendChild(p); },500); }); })();
