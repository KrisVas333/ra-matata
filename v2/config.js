/* ============================================================
   Matata v2 · VIENAS failas kainoms, skaičiams, teiginiams,
   atsiliepimams ir CTA tekstams.
   Kris redaguoja TIK šį failą. Po pakeitimo:  node v2/tools/sync.js
   (sinchronizuoja statinį tekstą index.html ir lankstinuke,
   perdaro QR ir lankstinukas.pdf). Instrukcija: v2/KAINOS.md
   ============================================================ */
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
    darzelis: { amount: 25, label: 'Darželyje', where: 'darželyje, dienos metu', note: 'Ateiname į vaiko grupę. Vežti nereikia.' },
    centras:  { amount: 29, label: 'Tech Zity centre', where: 'Tech Zity, Panerių g. 43, Vilnius', note: 'Popiet, Robotikos akademijos centre.' }
  },
  lessonsPerMonth: 4,
  lessonMinutes: 30,
  groupMax: 10,
  robotRatio: '1 robotas dviem vaikams',
  /* true tik tada, kai ExoClass'e yra tikra 0 € bandomoji grupė. Kol false: žodis „nemokama" nerodomas niekur. */
  firstLessonFree: false,
  firstLessonFreeText: 'Pirmoji pamoka nemokama',

  /* ---------- PASITIKĖJIMO SKAIČIAI (šaltinis: robotikosakademija.lt, Registrų centras) ---------- */
  trust: {
    years:     { show: true, value: '13+',     text: 'metų patirties' },
    kids:      { show: true, value: '10 000+', text: 'vaikų per metus' },
    mentors:   { show: true, value: '110+',    text: 'mentorių' },
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
    source: 'Skaičiai iš robotikosakademija.lt. Matata yra nauja programa: pirmųjų grupių rezultatus skelbsime čia.'
  },

  /* ---------- TEIGINIAI (tik patikrintos formuluotės) ---------- */
  claims: {
    innovation: 'Naujausia Robotikos akademijos inovacija darželiams',
    first: 'Pirmasis Robotikos akademijos būrelis 3–4 metų vaikams su kalbančiu robotu',
    /* false = robotas lietuviškai kalba įrašytu balsu (patvirtinta). true tik po 10 s video su tikru robotu. */
    ltVoiceBuiltIn: false,
    ltVoiceRecorded: 'Robotas prabyla lietuviškai mūsų balsu: žodžius įrašome kartu su vaikais.',
    ltVoiceBuiltInText: 'Robotas su vaiku kalba lietuviškai ir angliškai.'
  },

  /* ---------- ATSILIEPIMAI (placeholder: true = rodoma kaip pavyzdys, be vardų ir veidų) ---------- */
  testimonials: [
    { role: 'tevai',     placeholder: true, who: 'Mama arba tėtis', age: '4 m. vaikas', quote: 'Čia bus tikri tėvų žodžiai po pirmojo mėnesio.' },
    { role: 'vaikas',    placeholder: true, who: 'Vaikas',          age: '4 m.',        quote: 'Čia bus tai, ką vaikas pasakė apie robotą.' },
    { role: 'mentorius', placeholder: true, who: 'Robotikos akademijos mentorė (-ius)', age: 'veda darželinukams', quote: 'Čia bus mentoriaus pastebėjimas iš pirmųjų pamokų.' }
  ],
  mentor: { placeholder: true, name: '', line: '', years: '' },

  /* ---------- CTA ---------- */
  ctas: {
    primary: 'Užsirašyti į laukiančiųjų sąrašą',
    primaryShort: 'Į sąrašą',
    org: 'Pakvieskite į savo darželį',
    orgShort: 'Darželiui',
    micro: 'Užtruks 1 minutę. Parašysime, kai atidarysime grupę jūsų darželyje ar centre.'
  },

  /* COI eilutė viešai nerodoma (Kris, 2026-10-11). show: true grąžina ją į poraštę ir lankstinuką. */
  coi: { show: false, text: 'Skaidrumas: robotus gamina MatataStudio, o Lietuvoje juos platina UAB „Baltic Orbis". Robotikos akademijos bendraįkūrėjas Kristijonas Vasiliauskas su šia įmone susijęs asmeniškai. Robotus pasirinkome, nes jie veikia be ekrano ir tinka 3–4 metų vaikams.' },

  robotName: 'Tale-Bot Pro',

  /* ---------- TECHNIKA ---------- */
  supabase: {
    url: 'https://iiekmeylpppczicrsxho.supabase.co/rest/v1/ra_waitlist',
    key: 'sb_publishable_iJC59f30YJm7hU4OwZsLDQ_9FN-ygzF'
  },
  clarityId: 'yvonvcmo2n',
  privacyUrl: 'https://robotikosakademija.lt/privatumo-politika/',
  siteUrl: 'https://krisvas333.github.io/ra-matata/v2/',
  leafletSrc: 'lankstinukas',

  legal: {
    name: 'VšĮ „Robotikos akademija"',
    address: 'Panerių g. 43, LT-03202 Vilnius',
    code: 'įm. k. 303015010',
    phone: '+370 5 25 25 713',
    phoneHref: '+37052525713',
    email: 'info@robotikosakademija.lt',
    site: 'https://robotikosakademija.lt/'
  }
};
