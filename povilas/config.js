/* Matata v2 · vienas failas kainoms, skaičiams, teiginiams, atsiliepimams ir CTA tekstams.
   Pakeitus:  python3 v2/_tools/kainos.py   (instrukcija: v2/KAINOS.md) */
window.RA_CFG = {
  version: 'v2',

  product: {
    key: 'matata',
    name: 'Matata',
    ages: '3–4 m.',
    agesLong: '3–4 metų vaikams',
    ageList: ['3', '4'],
    defaultAge: '4'
  },

  /* ---------- KAINOS (eur per mėnesį) ---------- */
  prices: {
    currency: '€',
    darzelis: { amount: 25, label: 'Darželyje', where: 'darželyje, laiką deriname su darželiu', note: 'Ateiname į vaiko grupę. Vežti nereikia.', noteShort: 'vežti nereikia, ateiname į vaiko grupę. Grupė atsiranda, kai užsirašo keli tėvai iš to paties darželio ir darželis sutinka.' },
    centras:  { amount: 29, label: 'Tech Zity centre', where: 'Tech Zity, Panerių g. 43, Vilnius', note: 'Popiet, Robotikos akademijos centre.', noteShort: 'Panerių g. 43, Vilnius, popiet.' }
  },
  lessonsPerMonth: 4,
  lessonMinutes: 30,
  groupMax: 10,
  robotRatio: '1 robotas dviem',
  city: 'Vilnius',
  /* true tik su tikra 0 € grupe. Kol false, žodis „nemokama" nerodomas niekur. */
  firstLessonFree: false,
  firstLessonFreeText: 'Pirmoji pamoka nemokama',

  /* ---------- STARTAS (date: 'YYYY-MM-DD' arba null) ---------- */
  start: {
    date: null,
    datePrefix: 'Startas:',
    text: 'Grupės startuoja, kai susirenka pakankamai vaikų. Laukiančiųjų sąraše esantiems pranešime pirmiesiems.',
    notify: 'Pradžios datą pranešime el. paštu.'
  },

  /* ---------- IŠĖJIMO SĄLYGA (show: true rodo tekstą prie kainos, DUK ir formoje) ---------- */
  exitPolicy: { show: false, text: '' },

  /* ---------- PASITIKĖJIMO SKAIČIAI (šaltinis: robotikosakademija.lt, Registrų centras) ---------- */
  trust: {
    years:     { show: true, value: '13+',     text: 'metų patirties' },
    kids:      { show: true, value: '10 000+', text: 'vaikų per metus' },
    places:    { show: true, value: '650+',    text: 'vietų Lietuvoje' },
    recommend: { show: true, value: '9 iš 10', text: 'klientų rekomenduoja' },
    rating: {
      show: true,
      text: 'Tėvai mūsų stovyklų mentorius įvertino 9,8 iš 10*',
      footnote: '* Robotikos akademijos tėvų apklausa, 2025 m. vasaros stovyklos'
    },
    stemOrg: {
      show: true,
      validUntil: '2026-10-31',
      text: 'STEM.org Accredited™ akredituota organizacija',
      verifyLabel: 'Patikrinti',
      href: 'https://blockchain.stem.org/6e43c2b3-e72b-4a8c-9707-ecb45a6cc024',
      img: 'assets/logo/stem-org-accredited-200.png'
    },
    source: 'Skaičiai iš robotikosakademija.lt. Matata yra nauja programa.'
  },

  /* ---------- TEIGINIAI (tik patikrintos formuluotės) ---------- */
  claims: {
    innovation: 'Naujausia Robotikos akademijos inovacija darželiams',
    first: 'Pirmasis Robotikos akademijos būrelis 3–4 metų vaikams su kalbančiu robotu',
    ltVoiceBuiltIn: false,
    ltVoiceRecorded: 'Robotas prabyla lietuviškai mūsų balsu: žodžius įrašome kartu su vaikais.',
    ltVoiceBuiltInText: 'Robotas su vaiku kalba lietuviškai ir angliškai.'
  },

  /* ---------- ATSILIEPIMAI (placeholder: true = pavyzdys be vardų ir veidų; laužtiniai skliaustai rodo, kas bus) ---------- */
  testimonials: [
    { role: 'tevai',     placeholder: true, who: '[Vardas]', age: '[N] m. vaiko mama arba tėtis', quote: '[Ką vaikas pradėjo daryti namie po 4 pamokų]' },
    { role: 'vaikas',    placeholder: true, who: '[Vardas]', age: '[N] m.',                       quote: '[Ką pats sukūrė ar išmoko, savo žodžiais]' },
    { role: 'mentorius', placeholder: true, who: '[Vardas]', age: 'Robotikos akademijos mentorė (-ius)', quote: '[Ką mato per 3 mėnesius]' }
  ],
  mentor: { placeholder: true, name: '', line: '', years: '' },

  /* ---------- CTA ---------- */
  ctas: {
    primary: 'Užsirašyti į laukiančiųjų sąrašą',
    primaryShort: 'Į sąrašą',
    org: 'Pakvieskite į savo darželį',
    orgShort: 'Darželiui',
    orgTab: 'Kviečiu į darželį',
    orgTabHelp: 'darbuotojams ir tėvų atstovams',
    micro: 'Užtruks 1 minutę. Parašysime, kai atidarysime grupę jūsų darželyje ar centre.'
  },

  /* ---------- DARŽELIUI (blokas prie įstaigos formos ir PDF vadovui) ---------- */
  darzeliui: {
    title: 'Darželiui',
    lines: [
      'Darželiui tai nekainuoja: moka tik tėvai, {prices.darzelis.amount} €/mėn.',
      'Laiką deriname su darželiu.',
      'Viską atsivežame: robotus, žemėlapius, korteles ir knygas.',
      'Atvykstame pasikalbėti ir parodyti, kaip vyksta pamoka.',
      'Grupė iki 10 vaikų, 1 robotas dviem, mentorius visada šalia.'
    ],
    pdf: 'darzeliui/darzeliui.pdf',
    pdfLabel: 'Atsisiųsti vadovui (PDF, 1 psl.)'
  },

  /* Skaidrumo eilutė: show: true rodo tekstą poraštėje ir lankstinuke. */
  coi: { show: false, text: '' },

  robotName: 'Tale-Bot Pro',

  /* ---------- TECHNIKA ---------- */
  supabase: {
    url: 'https://iiekmeylpppczicrsxho.supabase.co/rest/v1/ra_waitlist',
    key: 'sb_publishable_iJC59f30YJm7hU4OwZsLDQ_9FN-ygzF'
  },
  clarityId: 'yvonvcmo2n',
  privacyUrl: 'https://robotikosakademija.lt/privatumo-politika/',
  siteUrl: 'https://krisvas333.github.io/ra-matata/povilas/',
  leafletSrc: 'lankstinukas',

  legal: {
    name: 'VšĮ „Robotikos akademija"',
    address: 'Panerių g. 43, LT-03202 Vilnius',
    code: 'įm. k. 303015010',
    phone: '+370 5 25 25 713',
    phoneHref: '+37052525713',
    email: 'info@robotikosakademija.lt',
    site: 'https://robotikosakademija.lt/',
    siteLabel: 'robotikosakademija.lt'
  }
};
