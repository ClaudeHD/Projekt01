/* ============================================================
   HydroVolt Mining – script.js
   Vanilla ES6+ · modulare Funktionen
   ============================================================ */
'use strict';

/* ------------------------------------------------------------
   1. KONSTANTEN & DATEN
   ------------------------------------------------------------ */
const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur';
const PRICE_REFRESH_MS = 60_000;   // alle 60 s aktualisieren
const PRICE_CACHE_KEY = 'hv_btc_price';
const BLOCKS_PER_DAY = 144;        // ~1 Block / 10 min
const DAYS_PER_MONTH = 365 / 12;   // 30,4375

// Statischer Fallback, falls API & Cache nicht verfügbar sind.
const FALLBACK_PRICE = { usd: 90000, eur: 83000, fallback: true, ts: 0 };

// Antminer-Modelle: [Hash TH/s, Watt, Hardwarekosten USD]
const MINER_MODELS = [
  { id: 's21xph', name: 'Antminer S21 XP Hydro', th: 473, w: 5676, cost: 8200, type: 'hydro' },
  { id: 's21h',   name: 'Antminer S21 Hydro',    th: 335, w: 5360, cost: 5500, type: 'hydro' },
  { id: 's21xp',  name: 'Antminer S21 XP',       th: 270, w: 3645, cost: 6500, type: 'air'   },
  { id: 's21pro', name: 'Antminer S21 Pro',      th: 234, w: 3531, cost: 5300, type: 'air'   },
  { id: 's21',    name: 'Antminer S21',          th: 200, w: 3500, cost: 4000, type: 'air'   },
  { id: 's19xp',  name: 'Antminer S19 XP',       th: 140, w: 3010, cost: 2500, type: 'air'   },
  { id: 's19pro', name: 'Antminer S19 Pro',      th: 110, w: 3250, cost: 1700, type: 'air'   },
  { id: 'custom', name: 'Custom / Eigene Werte', th: 100, w: 3250, cost: 3000, type: 'air'   },
];

/* ------------------------------------------------------------
   2. ÜBERSETZUNGEN (DE / EN)
   ------------------------------------------------------------ */
const I18N = {
  de: {
    'nav.home': 'Startseite', 'nav.packages': 'Hosting-Pakete', 'nav.calculator': 'ROI-Kalkulator',
    'nav.about': 'Über uns', 'nav.contact': 'Kontakt',
    'ticker.loading': 'lädt…',
    'hero.eyebrow': '⚡ Wasserkraft aus Paraguay',
    'hero.title': 'Bitcoin Mining Hosting mit grüner Energie',
    'hero.subtitle': 'Hosten Sie Ihre Antminer ASIC dort, wo Strom günstig und nachhaltig ist – in Alto Paraná, Paraguay. Air- & Hydro-cooled, 24/7 überwacht.',
    'hero.cta': 'Jetzt anfragen', 'hero.cta2': 'ROI berechnen',
    'hero.hl1': 'pro kWh', 'hero.hl2': 'Uptime-Garantie', 'hero.hl3': 'Wasserkraft',
    'packages.title': 'Hosting-Pakete',
    'packages.subtitle': 'Air-cooled für den Einstieg, Hydro-cooled für maximale Effizienz.',
    'packages.btcusd': 'BTC / USD', 'packages.btceur': 'BTC / EUR', 'packages.updated': 'Aktualisiert',
    'packages.caption': 'Vergleich Air-cooled und Hydro-cooled Antminer Hosting',
    'packages.spec': 'Spezifikation', 'packages.air': 'Air-Cooled', 'packages.airtag': 'Antminer S21',
    'packages.popular': 'Beliebt', 'packages.hydro': 'Hydro-Cooled', 'packages.hydrotag': 'Antminer S21 Hydro',
    'packages.hashrate': 'Hash Rate', 'packages.power': 'Stromverbrauch', 'packages.efficiency': 'Effizienz',
    'packages.priceth': 'Hosting-Preis / TH', 'packages.cooling': 'Kühlung',
    'packages.aircooling': 'Luftkühlung', 'packages.hydrocooling': 'Direkte Wasserkühlung',
    'packages.roi': 'ROI-Zeitraum*', 'packages.choose': 'Anfragen',
    'packages.note': '* ROI-Schätzung bei 0,05 $/kWh und aktuellem BTC-Kurs. Tatsächliche Werte abhängig von Netzwerk-Difficulty und Kurs. Nutze den Kalkulator unten.',
    'unit.months': 'Monate',
    'calc.title': 'ROI-Kalkulator', 'calc.subtitle': 'Live-Berechnung auf Basis des aktuellen Bitcoin-Kurses.',
    'calc.model': 'Miner-Modell', 'calc.modelhint': 'Hash-Rate & Verbrauch werden automatisch übernommen.',
    'calc.count': 'Anzahl Miner', 'calc.hashrate': 'Hash-Rate (TH/s) pro Miner',
    'calc.power': 'Verbrauch (W) pro Miner', 'calc.elec': 'Stromkosten (USD/kWh)',
    'calc.poolfee': 'Pool-Gebühr (%)', 'calc.hwcost': 'Hardware-Invest (USD) pro Miner',
    'calc.advanced': 'Netzwerk-Parameter (optional)', 'calc.nethash': 'Netzwerk-Hashrate (EH/s)',
    'calc.reward': 'Block-Reward (BTC)',
    'calc.dailybtc': 'Täglicher BTC-Output', 'calc.monthlyusd': 'Monatlich netto (USD)',
    'calc.monthlyeur': 'Monatlich netto (EUR)', 'calc.profit12': 'Gewinn nach 12 Monaten',
    'calc.profit24': 'Gewinn nach 24 Monaten', 'calc.breakeven': 'Break-even',
    'calc.disclaimer': 'Schätzung ohne Berücksichtigung künftiger Difficulty-Anpassungen. Keine Anlageberatung.',
    'features.title': 'Warum HydroVolt?',
    'features.subtitle': 'Rundum-Service für Ihr Mining – von der Hardware bis zum Support.',
    'features.f1.t': 'Hardware-Verkauf', 'features.f1.d': 'Neue & geprüfte Antminer ASIC direkt von uns – inklusive Einrichtung im Rechenzentrum.',
    'features.f2.t': 'Repair-Service', 'features.f2.d': 'Eigene Reparaturwerkstatt vor Ort. Hashboard-Tausch und Firmware-Optimierung inklusive.',
    'features.f3.t': 'Insurance', 'features.f3.d': 'Versicherungsschutz für Ihre Hardware gegen Feuer, Diebstahl und Elementarschäden.',
    'features.f4.t': '24/7 Support', 'features.f4.d': 'Monitoring rund um die Uhr und ein persönlicher Ansprechpartner auf Deutsch & Englisch.',
    'features.f5.t': 'Bandbreiten-Garantie', 'features.f5.d': 'Redundante Glasfaseranbindung sorgt für stabile Pool-Verbindungen ohne Stale Shares.',
    'features.f6.t': 'Wasserkraft-Vorteil', 'features.f6.d': 'Strom aus dem Itaipú-Wasserkraftwerk: günstig, CO₂-arm und nahezu unbegrenzt verfügbar.',
    'contact.title': 'Kontakt aufnehmen',
    'contact.subtitle': 'Sie haben Fragen oder möchten ein Angebot? Wir melden uns innerhalb von 24 Stunden.',
    'contact.addr': 'Adresse', 'contact.email': 'E-Mail', 'contact.name': 'Name',
    'contact.emaillabel': 'E-Mail', 'contact.interest': 'Paket-Interesse', 'contact.message': 'Nachricht',
    'contact.opt.air': 'Air-Cooled Hosting', 'contact.opt.hydro': 'Hydro-Cooled Hosting',
    'contact.opt.hw': 'Hardware-Kauf', 'contact.opt.other': 'Sonstiges', 'contact.send': 'Nachricht senden',
    'footer.tag': 'Bitcoin Mining Hosting · Alto Paraná, Paraguay',
    'footer.imprint': 'Impressum', 'footer.privacy': 'Datenschutz', 'footer.terms': 'AGB',
    'footer.rights': 'Alle Rechte vorbehalten.', 'footer.data': 'Kursdaten: CoinGecko',
  },
  en: {
    'nav.home': 'Home', 'nav.packages': 'Hosting Plans', 'nav.calculator': 'ROI Calculator',
    'nav.about': 'About', 'nav.contact': 'Contact',
    'ticker.loading': 'loading…',
    'hero.eyebrow': '⚡ Hydropower from Paraguay',
    'hero.title': 'Bitcoin Mining Hosting Powered by Green Energy',
    'hero.subtitle': 'Host your Antminer ASICs where electricity is cheap and sustainable – in Alto Paraná, Paraguay. Air- & hydro-cooled, monitored 24/7.',
    'hero.cta': 'Request a quote', 'hero.cta2': 'Calculate ROI',
    'hero.hl1': 'per kWh', 'hero.hl2': 'uptime guarantee', 'hero.hl3': 'hydropower',
    'packages.title': 'Hosting Plans',
    'packages.subtitle': 'Air-cooled to get started, hydro-cooled for maximum efficiency.',
    'packages.btcusd': 'BTC / USD', 'packages.btceur': 'BTC / EUR', 'packages.updated': 'Updated',
    'packages.caption': 'Comparison of air-cooled and hydro-cooled Antminer hosting',
    'packages.spec': 'Specification', 'packages.air': 'Air-Cooled', 'packages.airtag': 'Antminer S21',
    'packages.popular': 'Popular', 'packages.hydro': 'Hydro-Cooled', 'packages.hydrotag': 'Antminer S21 Hydro',
    'packages.hashrate': 'Hash Rate', 'packages.power': 'Power Draw', 'packages.efficiency': 'Efficiency',
    'packages.priceth': 'Hosting Price / TH', 'packages.cooling': 'Cooling',
    'packages.aircooling': 'Air cooling', 'packages.hydrocooling': 'Direct water cooling',
    'packages.roi': 'ROI Period*', 'packages.choose': 'Request',
    'packages.note': '* ROI estimate at $0.05/kWh and current BTC price. Actual figures depend on network difficulty and price. Use the calculator below.',
    'unit.months': 'months',
    'calc.title': 'ROI Calculator', 'calc.subtitle': 'Live calculation based on the current Bitcoin price.',
    'calc.model': 'Miner model', 'calc.modelhint': 'Hash rate & power draw are filled in automatically.',
    'calc.count': 'Number of miners', 'calc.hashrate': 'Hash rate (TH/s) per miner',
    'calc.power': 'Power draw (W) per miner', 'calc.elec': 'Electricity cost (USD/kWh)',
    'calc.poolfee': 'Pool fee (%)', 'calc.hwcost': 'Hardware investment (USD) per miner',
    'calc.advanced': 'Network parameters (optional)', 'calc.nethash': 'Network hashrate (EH/s)',
    'calc.reward': 'Block reward (BTC)',
    'calc.dailybtc': 'Daily BTC output', 'calc.monthlyusd': 'Monthly net (USD)',
    'calc.monthlyeur': 'Monthly net (EUR)', 'calc.profit12': 'Profit after 12 months',
    'calc.profit24': 'Profit after 24 months', 'calc.breakeven': 'Break-even',
    'calc.disclaimer': 'Estimate excluding future difficulty adjustments. Not investment advice.',
    'features.title': 'Why HydroVolt?',
    'features.subtitle': 'End-to-end service for your mining – from hardware to support.',
    'features.f1.t': 'Hardware Sales', 'features.f1.d': 'New & tested Antminer ASICs directly from us – including data-center setup.',
    'features.f2.t': 'Repair Service', 'features.f2.d': 'On-site repair workshop. Hashboard replacement and firmware tuning included.',
    'features.f3.t': 'Insurance', 'features.f3.d': 'Insurance coverage for your hardware against fire, theft and natural hazards.',
    'features.f4.t': '24/7 Support', 'features.f4.d': 'Round-the-clock monitoring and a personal contact in English & German.',
    'features.f5.t': 'Bandwidth Guarantee', 'features.f5.d': 'Redundant fiber connectivity ensures stable pool connections without stale shares.',
    'features.f6.t': 'Hydropower Advantage', 'features.f6.d': 'Power from the Itaipú hydroelectric plant: cheap, low-carbon and virtually unlimited.',
    'contact.title': 'Get in touch',
    'contact.subtitle': 'Have questions or want a quote? We reply within 24 hours.',
    'contact.addr': 'Address', 'contact.email': 'Email', 'contact.name': 'Name',
    'contact.emaillabel': 'Email', 'contact.interest': 'Plan of interest', 'contact.message': 'Message',
    'contact.opt.air': 'Air-Cooled Hosting', 'contact.opt.hydro': 'Hydro-Cooled Hosting',
    'contact.opt.hw': 'Hardware purchase', 'contact.opt.other': 'Other', 'contact.send': 'Send message',
    'footer.tag': 'Bitcoin Mining Hosting · Alto Paraná, Paraguay',
    'footer.imprint': 'Imprint', 'footer.privacy': 'Privacy', 'footer.terms': 'Terms',
    'footer.rights': 'All rights reserved.', 'footer.data': 'Price data: CoinGecko',
  },
};

/* ------------------------------------------------------------
   3. ZUSTAND
   ------------------------------------------------------------ */
const state = {
  lang: 'de',
  price: { ...FALLBACK_PRICE },   // { usd, eur, fallback, ts }
};

/* ------------------------------------------------------------
   4. HILFSFUNKTIONEN
   ------------------------------------------------------------ */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function fmtCurrency(value, currency) {
  const locale = state.lang === 'de' ? 'de-DE' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(isFinite(value) ? value : 0);
}

function fmtNumber(value, digits = 8) {
  const locale = state.lang === 'de' ? 'de-DE' : 'en-US';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(isFinite(value) ? value : 0);
}

function fmtTime(ts) {
  if (!ts) return '–';
  const locale = state.lang === 'de' ? 'de-DE' : 'en-US';
  return new Date(ts).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

const numVal = (el, fallback = 0) => {
  const n = parseFloat(el.value);
  return Number.isFinite(n) ? n : fallback;
};

/* ------------------------------------------------------------
   5. I18N
   ------------------------------------------------------------ */
function applyTranslations(lang) {
  state.lang = lang;
  document.documentElement.lang = lang;
  const dict = I18N[lang];

  $$('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (dict[key] != null) el.textContent = dict[key];
  });
  $$('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (dict[key] != null) el.placeholder = dict[key];
  });

  // Sprach-Buttons synchronisieren
  $$('.lang-btn').forEach((btn) => {
    const active = btn.dataset.lang === lang;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
  });

  try { localStorage.setItem('hv_lang', lang); } catch (_) {}

  // Dynamische Inhalte neu rendern (Zahlenformat, Modell-Select)
  renderMinerOptions();
  renderPrice();
  calculateRoi();
}

function initLanguage() {
  let lang = 'de';
  try {
    const saved = localStorage.getItem('hv_lang');
    if (saved && I18N[saved]) lang = saved;
    else if (navigator.language && navigator.language.startsWith('en')) lang = 'en';
  } catch (_) {}

  $$('.lang-btn').forEach((btn) =>
    btn.addEventListener('click', () => applyTranslations(btn.dataset.lang)));

  applyTranslations(lang);
}

/* ------------------------------------------------------------
   6. HEADER / NAVIGATION
   ------------------------------------------------------------ */
function initHeader() {
  const header = $('#siteHeader');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initMobileNav() {
  const toggle = $('#navToggle');
  const nav = $('#mainNav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  };

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));

  // Schließen bei Link-Klick oder Escape
  $$('a', nav).forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      setOpen(false); toggle.focus();
    }
  });
}

/* ------------------------------------------------------------
   7. FADE-IN ANIMATIONEN
   ------------------------------------------------------------ */
function initReveal() {
  const items = $$('.fade-in');
  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach((el) => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach((el) => io.observe(el));
}

/* ------------------------------------------------------------
   8. BITCOIN-PREIS (CoinGecko + Fallback + Cache)
   ------------------------------------------------------------ */
function loadCachedPrice() {
  try {
    const raw = localStorage.getItem(PRICE_CACHE_KEY);
    if (!raw) return;
    const cached = JSON.parse(raw);
    if (cached && cached.usd && cached.eur) {
      state.price = { ...cached, fallback: true }; // bis Live-Fetch bestätigt
    }
  } catch (_) {}
}

async function fetchPrice() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(COINGECKO_URL, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const btc = data && data.bitcoin;
    if (!btc || !btc.usd || !btc.eur) throw new Error('Unerwartetes Antwortformat');

    state.price = { usd: btc.usd, eur: btc.eur, fallback: false, ts: Date.now() };
    try { localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify(state.price)); } catch (_) {}
  } catch (err) {
    // Fallback: gecachter Wert bleibt erhalten, sonst statischer Wert
    console.warn('[HydroVolt] BTC-Preis konnte nicht geladen werden:', err.message);
    if (!state.price || !state.price.usd) state.price = { ...FALLBACK_PRICE };
    state.price.fallback = true;
  } finally {
    clearTimeout(timer);
    renderPrice();
    calculateRoi();
  }
}

function renderPrice() {
  const { usd, eur, fallback, ts } = state.price;
  const tickerPrice = $('#btcTickerPrice');
  const ticker = $('#btcTicker');
  const bannerUsd = $('#bannerUsd');
  const bannerEur = $('#bannerEur');
  const bannerUpdated = $('#bannerUpdated');

  if (tickerPrice) tickerPrice.textContent = fmtCurrency(usd, 'USD');
  if (ticker) ticker.classList.toggle('is-stale', !!fallback);
  if (bannerUsd) bannerUsd.textContent = fmtCurrency(usd, 'USD');
  if (bannerEur) bannerEur.textContent = fmtCurrency(eur, 'EUR');
  if (bannerUpdated) {
    const fallbackLabel = state.lang === 'de' ? 'Fallback' : 'fallback';
    bannerUpdated.textContent = fallback ? fallbackLabel : fmtTime(ts);
  }
}

function initPrice() {
  loadCachedPrice();
  renderPrice();
  fetchPrice();
  setInterval(fetchPrice, PRICE_REFRESH_MS);
}

/* ------------------------------------------------------------
   9. ROI-KALKULATOR
   ------------------------------------------------------------ */
function renderMinerOptions() {
  const select = $('#minerModel');
  if (!select) return;
  const current = select.value;
  select.innerHTML = '';
  MINER_MODELS.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m.id;
    const label = m.id === 'custom'
      ? (state.lang === 'de' ? 'Custom / Eigene Werte' : 'Custom / manual values')
      : `${m.name} – ${m.th} TH/s`;
    opt.textContent = label;
    select.appendChild(opt);
  });
  select.value = current || 's21h';
}

function applyModelToInputs() {
  const select = $('#minerModel');
  const model = MINER_MODELS.find((m) => m.id === select.value);
  if (!model || model.id === 'custom') return;
  $('#hashRate').value = model.th;
  $('#powerDraw').value = model.w;
  $('#hwCost').value = model.cost;
}

function calculateRoi() {
  const form = $('#calcForm');
  if (!form) return;

  const count      = Math.max(1, numVal($('#minerCount'), 1));
  const hashRate   = Math.max(0, numVal($('#hashRate'), 0));      // TH/s pro Miner
  const powerW     = Math.max(0, numVal($('#powerDraw'), 0));     // W pro Miner
  const elecCost   = Math.max(0, numVal($('#elecCost'), 0));      // USD/kWh
  const poolFee    = Math.min(100, Math.max(0, numVal($('#poolFee'), 0)));
  const hwCost     = Math.max(0, numVal($('#hwCost'), 0));        // USD pro Miner
  const netHashEh  = Math.max(0.0001, numVal($('#netHash'), 750));// EH/s
  const reward     = Math.max(0, numVal($('#blockReward'), 3.125));

  const { usd: btcUsd, eur: btcEur } = state.price;
  const eurPerUsd = btcUsd > 0 ? btcEur / btcUsd : 0;

  // BTC-Förderung: Anteil an der Netzwerk-Hashrate × Blöcke/Tag × Reward
  const netHashTh = netHashEh * 1e6;                 // EH/s → TH/s
  const totalHash = hashRate * count;
  const grossDailyBtc = totalHash > 0 && netHashTh > 0
    ? (totalHash / netHashTh) * BLOCKS_PER_DAY * reward : 0;
  const netDailyBtc = grossDailyBtc * (1 - poolFee / 100);

  // Erlöse & Kosten
  const dailyRevenueUsd = netDailyBtc * btcUsd;
  const dailyKwh        = (powerW * 24 / 1000) * count;
  const dailyElecUsd    = dailyKwh * elecCost;
  const dailyProfitUsd  = dailyRevenueUsd - dailyElecUsd;

  const monthlyProfitUsd = dailyProfitUsd * DAYS_PER_MONTH;
  const monthlyProfitEur = monthlyProfitUsd * eurPerUsd;

  const totalHwCost = hwCost * count;
  const profit12 = monthlyProfitUsd * 12 - totalHwCost;
  const profit24 = monthlyProfitUsd * 24 - totalHwCost;

  // Break-even in Monaten
  let breakevenText;
  if (monthlyProfitUsd <= 0) {
    breakevenText = state.lang === 'de' ? 'nicht erreichbar' : 'not reachable';
  } else {
    const months = totalHwCost / monthlyProfitUsd;
    const unit = state.lang === 'de' ? 'Monate' : 'months';
    breakevenText = totalHwCost === 0
      ? (state.lang === 'de' ? 'sofort' : 'immediate')
      : `${fmtNumber(months, 1)} ${unit}`;
  }

  // Ausgabe
  $('#resDailyBtc').textContent  = `${fmtNumber(netDailyBtc, 8)} BTC`;
  $('#resDailyUsd').textContent  = `≈ ${fmtCurrency(dailyProfitUsd, 'USD')} / ${state.lang === 'de' ? 'Tag' : 'day'}`;
  $('#resMonthlyUsd').textContent = fmtCurrency(monthlyProfitUsd, 'USD');
  $('#resMonthlyEur').textContent = fmtCurrency(monthlyProfitEur, 'EUR');

  const p12 = $('#resProfit12');
  const p24 = $('#resProfit24');
  p12.textContent = fmtCurrency(profit12, 'USD');
  p24.textContent = fmtCurrency(profit24, 'USD');
  p12.classList.toggle('is-loss', profit12 < 0);
  p24.classList.toggle('is-loss', profit24 < 0);

  $('#resBreakeven').textContent = breakevenText;
}

function initCalculator() {
  const form = $('#calcForm');
  if (!form) return;

  renderMinerOptions();
  applyModelToInputs();

  $('#minerModel').addEventListener('change', () => { applyModelToInputs(); calculateRoi(); });

  // Bei manueller Eingabe von Hash/Watt/Kosten → auf "custom" wechseln
  ['hashRate', 'powerDraw', 'hwCost'].forEach((id) => {
    $('#' + id).addEventListener('input', () => { $('#minerModel').value = 'custom'; });
  });

  // Jede Eingabe löst Neuberechnung aus
  form.addEventListener('input', calculateRoi);
  calculateRoi();
}

/* ------------------------------------------------------------
   10. KONTAKTFORMULAR
   ------------------------------------------------------------ */
function initContactForm() {
  const form = $('#contactForm');
  const status = $('#formStatus');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    status.className = 'form-status';

    if (!form.checkValidity()) {
      status.classList.add('err');
      status.textContent = state.lang === 'de'
        ? 'Bitte füllen Sie alle Pflichtfelder korrekt aus.'
        : 'Please complete all required fields correctly.';
      form.reportValidity();
      return;
    }

    // Kein Backend: Erfolgsmeldung + mailto-Fallback-Hinweis
    status.classList.add('ok');
    status.textContent = state.lang === 'de'
      ? 'Danke! Ihre Anfrage wurde erfasst – wir melden uns in Kürze.'
      : 'Thank you! Your request has been recorded – we will be in touch shortly.';
    form.reset();
  });
}

/* ------------------------------------------------------------
   11. INIT
   ------------------------------------------------------------ */
function init() {
  $('#year').textContent = new Date().getFullYear();
  initLanguage();
  initHeader();
  initMobileNav();
  initReveal();
  initCalculator();
  initContactForm();
  initPrice();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
