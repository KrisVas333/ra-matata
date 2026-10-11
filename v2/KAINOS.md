# Matata v2 · kainos, skaičiai, teiginiai: kaip keisti

**Kris redaguoja tik vieną failą: `v2/config.js`.** Viskas, kas puslapyje yra skaičius, kaina, teiginys, atsiliepimas ar CTA tekstas, ateina iš jo.

## Ką galima keisti (dažniausia)

| Kas | Kur `config.js` | Pastaba |
|---|---|---|
| Kaina darželyje / centre | `prices.darzelis.amount`, `prices.centras.amount` | eur per mėnesį, skaičius be kabučių |
| Pamokų skaičius ir trukmė | `lessonsPerMonth`, `lessonMinutes` | „už pamoką" suma skaičiuojama automatiškai (kaina ÷ pamokų skaičius) |
| Grupės dydis | `groupMax` | |
| Nemokama pirmoji pamoka | `firstLessonFree: true` | **tik** kai ExoClass'e yra tikra 0 € grupė. Kol `false`, žodis „nemokama" niekur nerodomas |
| Skaičiai (13+, 10 000+, 650+, 9 iš 10) | `trust.*` | `show: false` paslepia eilutę |
| 9,8 įvertinimas | `trust.rating` | `show: false` paslepia; tekstas ir išnaša keičiami čia |
| STEM.org ženklas | `trust.stemOrg.validUntil` | po šios datos ženklas pasislepia pats. Pratęsus akreditaciją, įrašykite naują datą |
| Teiginiai (inovacija, pirmasis būrelis, roboto balsas) | `claims.*` | `ltVoiceBuiltIn: true` tik po video su tikru robotu, kalbančiu lietuviškai iš gamyklos |
| Atsiliepimai | `testimonials[]` | kol `placeholder: true`, kortelė rodoma kaip pavyzdys su punktyru. Tikram atsiliepimui: `placeholder: false`, `who`, `age`, `quote` (tik su raštišku sutikimu) |
| Mentorius | `mentor` | `placeholder: false` + `name`, `line`, `years` |
| CTA tekstai | `ctas.*` | |
| COI eilutė | `coi.show` | dabar `false` (Kris, 2026-10-11). `true` grąžina eilutę į poraštę ir lankstinuką |
| Juridinė eilutė, telefonas, el. paštas | `legal.*` | |

## Po kiekvieno pakeitimo: viena komanda

```bash
cd ~/ra-matata/v2/tools && npm install && node sync.js
```

(`npm install` užtenka vieną kartą.) Komanda:

1. perrašo tuos pačius skaičius į statinį tekstą `v2/index.html` ir `v2/lankstinukas/index.html` (kad be JavaScript ir paieškos robotams būtų tas pats);
2. perdaro QR kodą lankstinuke (`siteUrl` + `?src=` + `leafletSrc`);
3. iš naujo sugeneruoja `v2/lankstinukas/lankstinukas.pdf` (A5, dvi pusės, sistemos Google Chrome);
4. iš naujo sugeneruoja `v2/assets/og.png`.

Tik tekstas ir QR, be PDF ir OG: `node sync.js --no-pdf --no-og`.

Tada: `git add -A && git commit -m "v2: kainos" && git push`. GitHub Pages atsinaujina per 1–2 min.

## Kur kas rodoma

- Kaina: hero faktai · kainų kortelės · formos vietos pasirinkimas · DUK · lipni juosta · lankstinukas.
- Teiginiai: hero · poraštė · komandai puslapis · lankstinukas.
- Atsiliepimai: skyrius „Ką sakys tėvai, vaikai ir mentoriai".

## Ko config.js nekeičia

Sekcijų tekstus (Meilė mokytis, pamokos žingsniai, DUK) keičia tik kūrėjas `v2/index.html`. Vaizdai: `v2/assets/img/`.
