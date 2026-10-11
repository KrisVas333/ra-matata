# Matata v2 · kaip pakeisti kainą ar bet kurį skaičių

**Keičiamas vienas failas: `v2/config.js`.** Visi skaičiai, kainos, teiginiai, atsiliepimai ir mygtukų tekstai puslapyje, lankstinuke, komandos ir darželio puslapiuose, dalinimosi paveikslėlyje ir PDF failuose ateina iš jo.

## Trys žingsniai

1. Pakeiskite reikšmę `v2/config.js` (pvz. `prices.darzelis.amount: 25`).
2. Paleiskite vieną komandą iš repo šaknies:
   ```bash
   python3 v2/_tools/kainos.py
   ```
   Ji perrašo statinį tekstą visuose puslapiuose, meta aprašymus, perdaro `og.png`, `lankstinukas.pdf` ir `darzeliui.pdf` (reikia sistemos Google Chrome) ir patikrina, ar senos kainos neliko nė viename viešame faile.
3. `git add -A && git commit -m "v2: kainos" && git push`. GitHub Pages atsinaujina per 1–2 min.

Tik patikrinti, nieko nerašant: `python3 v2/_tools/kainos.py --check`. Be PDF ar be og.png: `--no-pdf`, `--no-og`.

## Ką galima keisti

| Kas | Kur `config.js` |
|---|---|
| Kaina darželyje / centre | `prices.darzelis.amount`, `prices.centras.amount` (eurai per mėnesį) |
| Pamokų skaičius ir trukmė | `lessonsPerMonth`, `lessonMinutes` („už pamoką" suma skaičiuojama pati) |
| Grupės dydis, robotų santykis | `groupMax`, `robotRatio` |
| Starto data | `start.date` (`'2026-11-03'` arba `null`), tekstai `start.text`, `start.notify` |
| Išėjimo sąlyga | `exitPolicy.show` + `exitPolicy.text` (rodoma prie kainų, DUK ir formoje) |
| Skaičiai apie akademiją | `trust.*` (`show: false` paslepia eilutę) |
| 9,8 įvertinimas | `trust.rating` |
| STEM.org ženklas | `trust.stemOrg.validUntil` (po šios datos ženklas pasislepia pats) |
| Teiginiai | `claims.*` |
| Atsiliepimai | `testimonials[]` (`placeholder: false` + `who`, `age`, `quote` tik su raštišku sutikimu) |
| Mentorius | `mentor` (`placeholder: false` + `name`, `line`, `years`) |
| Mygtukų tekstai | `ctas.*` |
| Blokas darželiui ir PDF vadovui | `darzeliui.*` |
| Juridinė eilutė, telefonas, el. paštas | `legal.*` |

QR kodas lankstinuke priklauso tik nuo `siteUrl` ir `leafletSrc`; jei juos pakeitėte, `kainos.py` perdaro QR per `node v2/_tools/sync.js` (vieną kartą: `cd v2/_tools && npm install`).

Sekcijų tekstus (Meilė mokytis, pamokos žingsniai, DUK) keičia kūrėjas `v2/index.html`. Vaizdai: `v2/assets/img/`.
