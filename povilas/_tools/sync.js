#!/usr/bin/env node
/* Matata v2 · sync.js
   Reads ../config.js (the ONLY file Kris edits) and:
   1. writes the same values into every [data-cfg] slot of ../index.html and ../lankstinukas/index.html
      (static fallback text = config, so no-JS visitors and search engines see the same numbers);
   2. regenerates the leaflet QR code (quiet zone included) pointing at config.siteUrl + ?src=config.leafletSrc;
   3. renders ../lankstinukas/lankstinukas.pdf (A5, two pages) with the system Google Chrome;
   4. renders ../assets/og.png (1200×630) from ./og-src.html.
   Usage (from the repo root):  cd v2/tools && npm install && node sync.js
   Flags: --no-pdf  --no-og   (text + QR only)                                              */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const args = process.argv.slice(2);
const NO_PDF = args.includes('--no-pdf');
const NO_OG = args.includes('--no-og');

// ---- 1. load config ----
const cfgSrc = fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(cfgSrc, sandbox);
const CFG = sandbox.window.RA_CFG;
if (!CFG) throw new Error('config.js nenustatė window.RA_CFG');

function get(p) { return p.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), CFG); }
function money(n) { return String(n).replace('.', ','); }
function calc(key) {
  const lpm = CFG.lessonsPerMonth || 4;
  if (key === 'perLesson.darzelis') return money((get('prices.darzelis.amount') / lpm).toFixed(2).replace(/\.?0+$/, ''));
  if (key === 'perLesson.centras') return money((get('prices.centras.amount') / lpm).toFixed(2).replace(/\.?0+$/, ''));
  if (key === 'ltVoice') return get('claims.ltVoiceBuiltIn') ? get('claims.ltVoiceBuiltInText') : get('claims.ltVoiceRecorded');
  if (key === 'qrUrl') return (CFG.siteUrl || '') + '?src=' + (CFG.leafletSrc || 'lankstinukas');
  if (key === 'qrUrlShort') return ((CFG.siteUrl || '') + '?src=' + (CFG.leafletSrc || 'lankstinukas')).replace(/^https?:\/\//, '');
  return undefined;
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function value(p) {
  let v = p.startsWith('calc:') ? calc(p.slice(5)) : get(p);
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'number') v = money(v);
  return String(v);
}

// ---- 2. sync [data-cfg] leaf slots (no nested tags inside a slot) ----
function syncFile(file) {
  let html = fs.readFileSync(file, 'utf8');
  let n = 0, missing = [];
  html = html.replace(/(<(\w+)(?:[^>]*?)\sdata-cfg="([^"]+)"(?:[^>]*)>)([^<]*)(<\/\2>)/g, (m, open, tag, p, text, close) => {
    const v = value(p);
    if (v === undefined) { missing.push(p); return m; }
    if (p === 'coi.text' && !(CFG.coi && CFG.coi.show)) { if (text !== '') n++; return open + close; }
    if (text !== esc(v)) n++;
    return open + esc(v) + close;
  });
  fs.writeFileSync(file, html);
  console.log(`sync: ${path.relative(ROOT, file)} · ${n} slot(s) updated` + (missing.length ? ` · nerasta config'e: ${[...new Set(missing)].join(', ')}` : ''));
  return html;
}
syncFile(path.join(ROOT, 'index.html'));
const leafletFile = path.join(ROOT, 'lankstinukas', 'index.html');
let leaflet = syncFile(leafletFile);

// ---- 3. QR (quiet zone = margin 4 modules, white) ----
(async () => {
  const QR = require('qrcode');
  const url = calc('qrUrl');
  const svg = await QR.toString(url, { type: 'svg', errorCorrectionLevel: 'M', margin: 4, color: { dark: '#152039', light: '#ffffff' } });
  const inner = svg.replace(/^<\?xml[^>]*>/, '').replace(/<svg([^>]*)>/, (m, a) => `<svg${a.replace(/ (width|height)="[^"]*"/g, '')} role="img" aria-label="QR kodas: ${esc(url)}">`);
  if (!/<!--QR-->[\s\S]*?<!--\/QR-->/.test(leaflet)) throw new Error('lankstinukas/index.html neturi <!--QR--> žymų');
  leaflet = leaflet.replace(/<!--QR-->[\s\S]*?<!--\/QR-->/, `<!--QR-->${inner}<!--/QR-->`);
  fs.writeFileSync(leafletFile, leaflet);
  console.log('qr: ' + url);

  if (NO_PDF && NO_OG) return;
  const puppeteer = require('puppeteer-core');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  try {
    if (!NO_PDF) {
      const page = await browser.newPage();
      await page.goto('file://' + leafletFile, { waitUntil: 'networkidle0' });
      await page.evaluate(() => document.fonts.ready);
      await page.pdf({ path: path.join(ROOT, 'lankstinukas', 'lankstinukas.pdf'), format: 'A5', printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
      console.log('pdf: lankstinukas/lankstinukas.pdf');
      await page.close();
    }
    if (!NO_OG) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
      await page.goto('file://' + path.join(__dirname, 'og-src.html'), { waitUntil: 'networkidle0' });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(ROOT, 'assets', 'og.png'), clip: { x: 0, y: 0, width: 1200, height: 630 } });
      console.log('og: assets/og.png');
      await page.close();
    }
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
