/* Matata v2 · consent strip for the secondary pages (leaflet, komandai, darzeliui, palyginimas).
   Same rule as the main page: Microsoft Clarity loads ONLY after „Leisti"; the choice is shared across all v2 pages
   (localStorage key matata-consent-v2). Without consent only anonymous, cookie-free events (track.js) are sent.
   Usage: <script defer src="../js/consent.js" data-clarity="yvonvcmo2n"></script> (+ optional [data-consent-open] button). */
(function () {
  'use strict';
  var me = document.currentScript;
  var CFG = window.RA_CFG || {};
  var ID = (me && me.dataset.clarity) || CFG.clarityId || '';
  var PRIVACY = (me && me.dataset.privacy) || CFG.privacyUrl || 'https://robotikosakademija.lt/privatumo-politika/';
  var KEY = 'matata-consent-v2';
  var saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
  var base = window.__btBase || { version: 'v2', src: (new URLSearchParams(location.search).get('src') || 'direct').replace(/[^a-z0-9_.-]/gi, '').slice(0, 40) || 'direct' };
  function track(name, props) { if (typeof window.bt === 'function') { try { window.bt(name, Object.assign({}, base, props || {})); } catch (e) {} } }

  function loadClarity() {
    if (!ID) return;
    if (window.__clarityLoaded) { try { window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' }); } catch (e) {} return; }
    window.__clarityLoaded = true;
    (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, 'clarity', 'script', ID);
    try { window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' }); } catch (e) {}
  }
  function dropCookies() {
    var host = location.hostname, past = 'expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    ['_clck', '_clsk'].forEach(function (n) { document.cookie = n + '=; ' + past; document.cookie = n + '=; ' + past + '; domain=' + host; document.cookie = n + '=; ' + past + '; domain=.' + host; });
  }

  var css = '.ra-consent{position:fixed;left:0;right:0;bottom:0;z-index:60;background:#fff;color:#152039;border-top:1.5px solid rgba(42,79,181,.32);padding:8px 16px;display:none;grid-template-columns:1fr;gap:6px;align-items:center;font:600 14px/1.3 Nunito,ui-sans-serif,system-ui,sans-serif;box-shadow:0 -12px 30px -20px rgba(21,32,57,.5);padding-bottom:calc(8px + env(safe-area-inset-bottom))}' +
    '.ra-consent.on{display:grid}.ra-consent p{margin:0;max-width:none}.ra-consent a{color:#2A4FB5}.ra-consent .row{display:flex;gap:8px}' +
    '.ra-consent button{flex:1;min-height:44px;padding:6px 14px;border-radius:999px;border:1.5px solid rgba(42,79,181,.32);background:#fff;color:#152039;font:800 14px Nunito,ui-sans-serif,system-ui,sans-serif;cursor:pointer}.ra-consent button:hover{border-color:#3F6EDC}' +
    '@media (min-width:640px){.ra-consent{grid-template-columns:1fr auto}.ra-consent button{flex:none}}@media (max-width:420px){.ra-consent{font-size:13px;line-height:1.25;gap:5px;padding-top:6px}}@media print{.ra-consent{display:none!important}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var box = document.createElement('div'); box.className = 'ra-consent'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Slapukų pasirinkimas');
  box.innerHTML = '<p><b>Ar galime mokytis iš jūsų apsilankymo?</b> Su sutikimu įjungsime Microsoft Clarity įrašus (anoniminius). Be sutikimo: tik anoniminiai įvykiai be slapukų. <a href="' + PRIVACY + '" target="_blank" rel="noopener">Privatumo politika</a>.</p>' +
    '<div class="row"><button type="button" data-c="all">Leisti</button><button type="button" data-c="essential">Tik būtini</button></div>';
  document.body.appendChild(box);
  function open(why) { box.classList.add('on'); track('engage', { what: 'consent_open', why: why || 'auto' }); }
  function decide(v) {
    saved = v; try { localStorage.setItem(KEY, v); } catch (e) {}
    box.classList.remove('on');
    if (v === 'all') loadClarity(); else { if (window.clarity) { try { window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' }); } catch (e) {} } dropCookies(); }
    track('consent', { choice: v });
  }
  box.addEventListener('click', function (e) { var b = e.target.closest('button[data-c]'); if (b) decide(b.getAttribute('data-c')); });
  if (saved === 'all') loadClarity();
  else if (!saved && ID && !window.matchMedia('print').matches) setTimeout(function () { if (!saved) open('auto'); }, 3000);
  Array.prototype.forEach.call(document.querySelectorAll('[data-consent-open]'), function (el) { el.addEventListener('click', function () { open('footer'); }); });
})();
