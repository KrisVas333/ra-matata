#!/usr/bin/env python3
"""kainos.py · Matata v2 · VIENA komanda po config.js pakeitimo.

  python3 v2/_tools/kainos.py            # viskas: tekstas + PDF + og.png
  python3 v2/_tools/kainos.py --no-pdf   # tik tekstas ir og.png
  python3 v2/_tools/kainos.py --no-og    # tik tekstas ir PDF
  python3 v2/_tools/kainos.py --check    # nieko nerašo, tik parodo, kas skiriasi

Skaito v2/config.js (vienintelis tiesos šaltinis) ir perrašo KIEKVIENĄ išvestinę kopiją:
  [data-cfg] statinį tekstą · [data-cfg-attr] atributus (href, src) · [data-cfg-tpl] meta/og aprašymus ·
  [data-cfg-list] sąrašus · [data-cfg-show] rodymą · JSON-LD · atsiliepimų korteles (<!--TST-->) ·
  STEM.org ženklą pagal validUntil · COI eilutę
failuose: v2/index.html · v2/lankstinukas/index.html · v2/komandai/index.html · v2/darzeliui/index.html ·
v2/_tools/og-src.html. Tada perdaro v2/assets/og.png, v2/lankstinukas/lankstinukas.pdf, v2/darzeliui/darzeliui.pdf
(sistemos Google Chrome, headless) ir patikrina, ar senos kainos neliko nė viename viešame faile.
QR lankstinuke priklauso tik nuo siteUrl + leafletSrc: jei jis pasikeitė, paleidžia node sync.js (jei įdiegta).
Tik python3 standartinė biblioteka + Google Chrome.
"""
import json, os, re, subprocess, sys, tempfile, datetime, html as htmlmod

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)                      # v2/
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
ARGS = sys.argv[1:]
NO_PDF = '--no-pdf' in ARGS
NO_OG = '--no-og' in ARGS
CHECK = '--check' in ARGS
PUBLIC_FILES = ['index.html', 'lankstinukas/index.html', 'komandai/index.html', 'darzeliui/index.html']
TPL_FILES = PUBLIC_FILES + ['_tools/og-src.html']


# ---------- 1. config.js -> dict (Chrome evaluates the real file; fallback: tolerant JS->JSON) ----------
def load_cfg():
    src_path = os.path.join(ROOT, 'config.js')
    cfg = None
    if os.path.exists(CHROME):
        with tempfile.TemporaryDirectory() as td:
            page = os.path.join(td, 'cfg.html')
            open(page, 'w', encoding='utf-8').write('<!doctype html><meta charset="utf-8"><script src="file://%s"></script><pre id="o"></pre><script>document.getElementById("o").textContent=JSON.stringify(window.RA_CFG||null)</script>' % src_path)
            try:
                out = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--virtual-time-budget=1500', '--dump-dom', 'file://' + page], capture_output=True, text=True, timeout=60).stdout
                m = re.search(r'<pre id="o">(.*?)</pre>', out, re.S)
                if m and m.group(1).strip() not in ('', 'null'):
                    cfg = json.loads(htmlmod.unescape(m.group(1)))
            except Exception as e:
                print('chrome config read failed:', e)
    if cfg is None:
        js = open(src_path, encoding='utf-8').read()
        js = re.sub(r'/\*.*?\*/', '', js, flags=re.S)
        js = re.sub(r'^\s*//.*$', '', js, flags=re.M)
        body = js[js.index('{', js.index('RA_CFG')):js.rindex('}') + 1]
        body = re.sub(r"'((?:[^'\\]|\\.)*)'", lambda m: json.dumps(m.group(1).replace("\\'", "'")), body)
        body = re.sub(r'([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:', r'\1"\2":', body)
        body = re.sub(r',(\s*[}\]])', r'\1', body)
        cfg = json.loads(body)
    if not cfg:
        sys.exit('config.js nenustatė window.RA_CFG')
    return cfg


CFG = load_cfg()


def get(path):
    o = CFG
    for k in path.split('.'):
        if isinstance(o, dict) and k in o:
            o = o[k]
        else:
            return None
    return o


def money(n):
    return str(n).replace('.', ',')


def per_lesson(k):
    a = get('prices.%s.amount' % k)
    if a is None:
        return None
    lpm = CFG.get('lessonsPerMonth') or 4
    s = '%.2f' % (a / lpm)
    s = re.sub(r'\.?0+$', '', s)
    return money(s)


def calc(key):
    if key == 'perLesson.darzelis': return per_lesson('darzelis')
    if key == 'perLesson.centras': return per_lesson('centras')
    if key == 'ltVoice': return get('claims.ltVoiceBuiltInText') if get('claims.ltVoiceBuiltIn') else get('claims.ltVoiceRecorded')
    if key == 'telHref': return 'tel:' + get('legal.phoneHref') if get('legal.phoneHref') else None
    if key == 'mailtoHref': return 'mailto:' + get('legal.email') if get('legal.email') else None
    if key == 'qrUrl': return (CFG.get('siteUrl') or '') + '?src=' + (CFG.get('leafletSrc') or 'lankstinukas')
    if key == 'qrUrlShort': return re.sub(r'^https?://', '', calc('qrUrl'))
    return None


def value(p):
    v = calc(p[5:]) if p.startswith('calc:') else get(p)
    if v is None or isinstance(v, (dict, list)):
        return None
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return money(v)
    return str(v)


def fill(tpl):
    return re.sub(r'\{([A-Za-z0-9_.:]+)\}', lambda m: value(m.group(1)) if value(m.group(1)) is not None else m.group(0), tpl)


def esc(s):
    return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def esc_attr(s):
    return esc(s).replace('"', '&quot;')


def local_today():
    return datetime.date.today().isoformat()


def stem_ok():
    so = get('trust.stemOrg') or {}
    return so.get('show', True) is not False and (not so.get('validUntil') or local_today() <= so['validUntil'])


def lt_date(iso):
    m = re.match(r'^(\d{4})-(\d{2})-(\d{2})$', iso or '')
    if not m: return iso
    months = ['sausio', 'vasario', 'kovo', 'balandžio', 'gegužės', 'birželio', 'liepos', 'rugpjūčio', 'rugsėjo', 'spalio', 'lapkričio', 'gruodžio']
    return '%s m. %s %d d.' % (m.group(1), months[int(m.group(2)) - 1], int(m.group(3)))


# ---------- 2. sync one file ----------
AVA = '<span class="ava" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="17" r="8"/><path d="M8 42c0-9 7-14 16-14s16 5 16 14"/></svg></span>'


def testimonials_html():
    out = []
    for t in CFG.get('testimonials') or []:
        ph = t.get('placeholder', True) is not False
        out.append('      <article class="tcard%s" data-placeholder="%d" data-role="%s">\n' % ('' if ph else ' real', 1 if ph else 0, esc_attr(t.get('role', ''))) +
                   ('        <span class="ph-label">PAVYZDYS · čia bus tikras atsiliepimas</span>\n' if ph else '') +
                   '        <p class="q">„%s"</p>\n' % esc(t.get('quote', '')) +
                   '        <div class="by">%s<span><b>%s</b><small>%s</small></span></div>\n      </article>\n' % (AVA, esc(t.get('who', '')), esc(t.get('age', ''))))
    return ''.join(out)


def json_ld():
    d = {"@context": "https://schema.org", "@type": "Course",
         "name": "Matata: robotas ir pasakų knyga be ekrano 3–4 metų vaikams",
         "description": "%s. %s min kartą per savaitę, grupės iki %s vaikų, darželyje arba Tech Zity centre Vilniuje." % (get('claims.first'), get('lessonMinutes'), get('groupMax')),
         "provider": {"@type": "Organization", "name": "Robotikos akademija", "url": get('legal.site') or "https://robotikosakademija.lt/"},
         "audience": {"@type": "EducationalAudience", "audienceType": "3 ir 4 metų vaikai ir jų tėvai"}, "inLanguage": "lt"}
    return json.dumps(d, ensure_ascii=False, separators=(',', ':'))


def sync_file(rel):
    path = os.path.join(ROOT, rel)
    if not os.path.exists(path):
        return 0, {}
    html = open(path, encoding='utf-8').read()
    orig = html
    changed = {}

    # [data-cfg] leaf slots (no nested tags inside the slot)
    def leaf(m):
        open_tag, tag, p, text, close = m.group(1), m.group(2), m.group(3), m.group(4), m.group(5)
        if p == 'coi.text':
            coi = CFG.get('coi') or {}
            v = esc(coi.get('text', '')) if coi.get('show') and coi.get('text') else ''
        else:
            v = value(p)
            if v is None:
                return m.group(0)
            v = esc(v)
        if text != v:
            changed[p] = (text, v)
        return open_tag + v + close
    html = re.sub(r'(<(\w+)(?:[^>]*?)\sdata-cfg="([^"]+)"(?:[^>]*)>)([^<]*)(</\2>)', leaf, html)

    # [data-cfg-attr="href:path"]
    def attr(m):
        tag = m.group(0)
        am = re.search(r'data-cfg-attr="([a-z-]+):([^"]+)"', tag)
        name, p = am.group(1), am.group(2)
        v = value(p)
        if v is None:
            return tag
        new = re.sub(r'(\s%s=")([^"]*)(")' % name, lambda mm: mm.group(1) + esc_attr(v) + mm.group(3), tag, count=1)
        if new != tag:
            changed['attr:' + p] = ('', v)
        return new
    html = re.sub(r'<[a-z]+[^>]*\sdata-cfg-attr="[^"]+"[^>]*>', attr, html)

    # [data-cfg-tpl="content=...{path}..."] or text template
    def tpl(m):
        tag = m.group(0)
        tm = re.search(r'data-cfg-tpl="([^"]*)"', tag)
        t = htmlmod.unescape(tm.group(1))
        am = re.match(r'^([a-z-]+)=([\s\S]*)$', t)
        if am:
            v = fill(am.group(2))
            new = re.sub(r'(\s%s=")([^"]*)(")' % am.group(1), lambda mm: mm.group(1) + esc_attr(v) + mm.group(3), tag, count=1)
            if new != tag:
                changed['tpl:' + am.group(1)] = ('', v)
            return new
        return tag
    html = re.sub(r'<[a-z]+[^>]*\sdata-cfg-tpl="[^"]*"[^>]*>', tpl, html)
    # text templates (element content)
    def tpl_text(m):
        t = htmlmod.unescape(m.group(2))
        if '=' in t.split('{')[0] and re.match(r'^[a-z-]+=', t):
            return m.group(0)
        v = esc(fill(t))
        if m.group(3) != v:
            changed['tpl-text'] = (m.group(3), v)
        return m.group(1) + v + m.group(4)
    html = re.sub(r'(<(?:span|p|b|small|li)[^>]*\sdata-cfg-tpl="([^"]*)"[^>]*>)([^<]*)(</(?:span|p|b|small|li)>)', tpl_text, html)

    # [data-cfg-list="darzeliui.lines"]: first <li> is the template
    def lst(m):
        open_ul, inner, close_ul = m.group(1), m.group(2), m.group(3)
        p = re.search(r'data-cfg-list="([^"]+)"', open_ul).group(1)
        arr = get(p)
        if not isinstance(arr, list) or not arr:
            return m.group(0)
        li = re.search(r'<li[^>]*>.*?</li>', inner, re.S)
        if not li:
            return m.group(0)
        li_tpl = li.group(0)
        items = []
        for line in arr:
            txt = esc(fill(str(line)))
            if '<span>' in li_tpl:
                items.append(re.sub(r'<span>[^<]*</span>', '<span>' + txt + '</span>', li_tpl, count=1))
            else:
                items.append(re.sub(r'>[^<]*</li>$', '>' + txt + '</li>', li_tpl))
        new_inner = '\n' + '\n'.join('              ' + i for i in items) + '\n            '
        if re.sub(r'\s+', '', new_inner) != re.sub(r'\s+', '', inner):
            changed['list:' + p] = ('', '%d items' % len(arr))
        return open_ul + new_inner + close_ul
    html = re.sub(r'(<ul[^>]*\sdata-cfg-list="[^"]+"[^>]*>)(.*?)(</ul>)', lst, html, flags=re.S)

    # [data-cfg-show="exitPolicy.show"]: toggle the hidden attribute (shown only when true AND text present)
    def show(m):
        tag = m.group(0)
        p = re.search(r'data-cfg-show="([^"]+)"', tag).group(1)
        on = bool(get(p))
        dc = re.search(r'data-cfg="([^"]+)"', tag)
        if dc and not value(dc.group(1)):
            on = False
        has_hidden = re.search(r'\shidden(?=[\s>])', tag) is not None
        if on and has_hidden:
            tag2 = re.sub(r'\shidden(?=[\s>])', '', tag, count=1); changed['show:' + p] = ('hidden', 'shown'); return tag2
        if not on and not has_hidden:
            tag2 = tag[:-1] + ' hidden>'; changed['show:' + p] = ('shown', 'hidden'); return tag2
        return tag
    html = re.sub(r'<[a-z]+[^>]*\sdata-cfg-show="[^"]+"[^>]*>', show, html)

    if rel == 'index.html':
        # testimonials block
        if '<!--TST-->' in html:
            new = '<!--TST-->\n' + testimonials_html() + '      <!--/TST-->'
            html2 = re.sub(r'<!--TST-->.*?<!--/TST-->', lambda _: new, html, flags=re.S)
            if html2 != html:
                changed['testimonials'] = ('', '%d cards' % len(CFG.get('testimonials') or []))
            html = html2
        # JSON-LD
        html2 = re.sub(r'(<script type="application/ld\+json">\n)(.*?)(\n</script>)', lambda m: m.group(1) + json_ld() + m.group(3), html, flags=re.S)
        if html2 != html:
            changed['json-ld'] = ('', 'updated')
        html = html2
        # STEM seal + source line: static class follows validUntil (JS does the same at runtime)
        for sel in ('id="stem"', 'id="stemSrc"'):
            pat = r'(<[a-z]+ class=")([^"]*)(" %s)' % re.escape(sel)
            def cls(m):
                classes = [c for c in m.group(2).split() if c != 'off']
                if not stem_ok():
                    classes.append('off')
                nc = ' '.join(classes)
                if nc != m.group(2):
                    changed['stem'] = (m.group(2), nc)
                return m.group(1) + nc + m.group(3)
            html = re.sub(pat, cls, html)
        # start line (date set -> "Startas: ...")
        st = CFG.get('start') or {}
        start_txt = ((st.get('datePrefix') or 'Startas:') + ' ' + lt_date(st['date'])) if st.get('date') else (st.get('text') or '')
        html2 = re.sub(r'(<span id="startText" data-cfg="start.text">)([^<]*)(</span>)', lambda m: m.group(1) + esc(start_txt) + m.group(3), html)
        if html2 != html:
            changed['start'] = ('', start_txt)
        html = html2

    if html != orig and not CHECK:
        open(path, 'w', encoding='utf-8').write(html)
    return (1 if html != orig else 0), changed


# ---------- 3. run ----------
print('config: darželyje %s € · centras %s € · %s pamokos po %s min · perLesson %s / %s € · firstLessonFree=%s · stemOrg %s' % (
    get('prices.darzelis.amount'), get('prices.centras.amount'), get('lessonsPerMonth'), get('lessonMinutes'), per_lesson('darzelis'), per_lesson('centras'),
    bool(CFG.get('firstLessonFree')), 'rodomas iki ' + str(get('trust.stemOrg.validUntil')) if stem_ok() else 'PASLĖPTAS (validUntil praėjo)'))
all_old = set()
for rel in TPL_FILES:
    n, ch = sync_file(rel)
    print('%-28s %s' % (rel, ('%d pakeitimai: ' % len(ch) + ', '.join('%s %s→%s' % (k, (v[0] or '')[:30], (v[1] or '')[:30]) for k, v in list(ch.items())[:12])) if ch else 'be pakeitimų'))
    for k, (old, new) in ch.items():
        if re.fullmatch(r'\d+(,\d+)?', old or ''):
            all_old.add(old)
if CHECK:
    sys.exit(0)

# QR depends only on siteUrl + leafletSrc
leaflet = os.path.join(ROOT, 'lankstinukas', 'index.html')
lf = open(leaflet, encoding='utf-8').read()
m = re.search(r'aria-label="QR kodas: ([^"]+)"', lf)
if m and htmlmod.unescape(m.group(1)) != calc('qrUrl'):
    sync_js = os.path.join(HERE, 'sync.js')
    if os.path.exists(os.path.join(HERE, 'node_modules', 'qrcode')):
        print('qr: URL pasikeitė, perdarau per node sync.js')
        subprocess.run(['node', sync_js, '--no-pdf', '--no-og'], cwd=HERE)
    else:
        print('⚠️ qr: URL pasikeitė (%s), bet node_modules neįdiegta. Paleiskite: cd v2/_tools && npm install && node sync.js --no-pdf --no-og' % calc('qrUrl'))

# PDFs + og.png with the system Chrome
def chrome(args, timeout=120):
    if not os.path.exists(CHROME):
        print('⚠️ Chrome nerastas:', CHROME); return False
    r = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-sandbox', '--allow-file-access-from-files', '--hide-scrollbars', '--virtual-time-budget=6000'] + args, capture_output=True, text=True, timeout=timeout)
    return r.returncode == 0


def pdf_size_ok(path, w_pt, h_pt):
    try:
        d = open(path, 'rb').read()
        boxes = set(re.findall(rb'MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]', d))
        return any(abs(float(a) - w_pt) < 2 and abs(float(b) - h_pt) < 2 for a, b in boxes)
    except Exception:
        return False


if not NO_PDF:
    out = os.path.join(ROOT, 'lankstinukas', 'lankstinukas.pdf')
    chrome(['--no-pdf-header-footer', '--print-to-pdf=' + out, 'file://' + leaflet])
    print('pdf: lankstinukas/lankstinukas.pdf', 'A5 ✓' if pdf_size_ok(out, 419.5, 595.3) else '⚠️ ne A5')
    dz = os.path.join(ROOT, 'darzeliui', 'index.html')
    if os.path.exists(dz):
        out2 = os.path.join(ROOT, 'darzeliui', 'darzeliui.pdf')
        chrome(['--no-pdf-header-footer', '--print-to-pdf=' + out2, 'file://' + dz])
        print('pdf: darzeliui/darzeliui.pdf', 'A4 ✓' if pdf_size_ok(out2, 595.3, 841.9) else '⚠️ ne A4')
if not NO_OG:
    og = os.path.join(ROOT, 'assets', 'og.png')
    chrome(['--window-size=1200,630', '--screenshot=' + og, 'file://' + os.path.join(HERE, 'og-src.html')])
    print('og: assets/og.png', os.path.getsize(og) if os.path.exists(og) else '⚠️ nesukurtas')

# ---------- 4. guard: no stale price left in any public file ----------
cur = {money(get('prices.darzelis.amount')), money(get('prices.centras.amount')), per_lesson('darzelis'), per_lesson('centras')}
stale = [o for o in all_old if o not in cur]
hits = []
for rel in PUBLIC_FILES:
    p = os.path.join(ROOT, rel)
    if not os.path.exists(p):
        continue
    t = open(p, encoding='utf-8').read()
    for o in stale:
        for mm in re.finditer(r'(?<![\d,])' + re.escape(o) + r'\s*(?:€|&euro;|&#8364;)', t):
            hits.append('%s: "%s"' % (rel, t[max(0, mm.start() - 40):mm.end() + 10].replace('\n', ' ')))
if hits:
    print('⚠️ SENA KAINA LIKO:'); [print('  ' + h) for h in hits]; sys.exit(2)
print('✓ senų kainų viešuose failuose neliko' if stale else '✓ baigta')
print('Toliau: git add -A && git commit -m "v2: kainos" && git push')
