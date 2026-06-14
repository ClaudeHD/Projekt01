/* ============================================================
   ENPARA – Energy Paraguay · script.js
   Vanilla ES6+ · modulare Funktionen
   ============================================================ */
'use strict';

/* ------------------------------------------------------------
   1. KONSTANTEN & DATEN
   ------------------------------------------------------------ */
const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur';
const PRICE_REFRESH_MS = 60_000;   // alle 60 s aktualisieren
const PRICE_CACHE_KEY = 'enpara_btc_price';
const BLOCKS_PER_DAY = 144;        // ~1 Block / 10 min
const DAYS_PER_MONTH = 365 / 12;   // 30,4375

// Statischer Fallback, falls API & Cache nicht verfügbar sind.
const FALLBACK_PRICE = { usd: 90000, eur: 83000, fallback: true, ts: 0 };

// Live-Netzwerkdaten (mempool.space). Läuft clientseitig im Browser des
// Besuchers – mit Timeout & statischem Fallback wie beim BTC-Preis.
const MEMPOOL_API = 'https://mempool.space/api';
const NET_REFRESH_MS = 90_000;     // alle 90 s aktualisieren
// Richtwerte, falls die API nicht erreichbar ist (werden als „stale" markiert).
const NET_FALLBACK = {
  hashrateEh: 700, difficultyT: 88, height: 880000,
  changePct: null, progressPct: null, remainingBlocks: null, retargetTs: null,
};

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
    'nav.home': 'Startseite', 'nav.about': 'Warum ENPARA', 'nav.location': 'Standort', 'nav.packages': 'Pakete',
    'nav.calculator': 'Kalkulator', 'nav.faq': 'FAQ', 'nav.instagram': 'Instagram', 'nav.contact': 'Kontakt',
    'ticker.loading': 'lädt…',
    'hero.eyebrow': '⚡ Wasserkraft aus Paraguay',
    'hero.title': 'Bitcoin Mining Hosting mit grüner Energie',
    'hero.subtitle': 'Ihre Miner. Unser Wasserstrom. Hosten Sie Antminer ASIC in Alto Paraná, Paraguay – ab 0,045 $/kWh, Air- & Hydro-cooled, 24/7 überwacht.',
    'hero.cta': 'Jetzt anfragen', 'hero.cta2': 'ROI berechnen',
    'hero.hl1': 'pro kWh', 'hero.hl2': 'Uptime-Garantie', 'hero.hl3': 'Wasserkraft',
    // Stats-Band
    'stats.title': 'ENPARA in Zahlen',
    'stats.subtitle': 'Harte Fakten statt Marketing – das spricht für unseren Standort.',
    'stats.from': 'ab',
    'stats.l1': 'Leistung Itaipú-Wasserkraftwerk',
    'stats.l2': 'Uptime-Ziel im Rechenzentrum',
    'stats.l3': 'Live-Monitoring & Support',
    'stats.l4': 'Strompreis aus Wasserkraft',
    // Pakete
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
    // Infrastruktur
    'infra.eyebrow': '🔌 Infrastruktur',
    'infra.title': 'Vom Wasser zum Hash',
    'infra.subtitle': 'So wird aus erneuerbarer Wasserkraft die Rechenleistung für Ihre Miner.',
    'infra.s1t': 'Wasserkraft', 'infra.s1d': 'Das Itaipú-Wasserkraftwerk erzeugt rund um die Uhr 100 % erneuerbaren Strom.',
    'infra.s2t': 'Stromnetz', 'infra.s2d': 'Günstige Energie gelangt über stabile Leitungen direkt zu unserem Standort.',
    'infra.s3t': 'Rechenzentrum', 'infra.s3d': 'Air- & Hydro-cooled Racks in Alto Paraná, 24/7 überwacht und gewartet.',
    'infra.s4t': 'Ihre Miner', 'infra.s4d': 'Maximale Hashrate bei minimalen Stromkosten – Ihr Bitcoin-Ertrag.',
    'infra.fact1t': 'Standort', 'infra.fact1d': 'Alto Paraná, Paraguay',
    'infra.fact2t': 'Energiequelle', 'infra.fact2d': 'Itaipú-Wasserkraft · 100 % erneuerbar',
    'infra.fact3t': 'Kühlung', 'infra.fact3d': 'Air- & Direct-Hydro-Cooling',
    // Weltkarte / Standort
    'map.eyebrow': '🌎 Standort',
    'map.title': 'Unser Standort auf der Weltkarte',
    'map.subtitle': 'Alto Paraná, Paraguay – im Herzen Südamerikas, direkt an einer der größten Wasserkraft-Quellen der Welt.',
    'map.pin': 'Alto Paraná, Paraguay',
    'map.coords': '25°30′ S · 54°37′ W · Itaipú-Wasserkraftwerk',
    // Kalkulator
    'calc.title': 'ROI-Kalkulator', 'calc.subtitle': 'Live-Berechnung auf Basis des aktuellen Bitcoin-Kurses.',
    'calc.model': 'Miner-Modell', 'calc.modelhint': 'Hash-Rate & Verbrauch werden automatisch übernommen.',
    'calc.count': 'Anzahl Miner', 'calc.hashrate': 'Hash-Rate (TH/s) pro Miner',
    'calc.power': 'Verbrauch (W) pro Miner', 'calc.elec': 'Stromkosten (USD/kWh)',
    'calc.poolfee': 'Pool-Gebühr (%)', 'calc.hwcost': 'Hardware-Invest (USD) pro Miner',
    'calc.advanced': 'Netzwerk-Parameter (optional)', 'calc.nethash': 'Netzwerk-Hashrate (EH/s)',
    'calc.reward': 'Block-Reward (BTC)',
    'calc.nethashhint': 'Wird automatisch mit den Live-Netzwerkdaten unten befüllt.',
    'calc.dailybtc': 'Täglicher BTC-Output', 'calc.monthlyusd': 'Monatlich netto (USD)',
    'calc.monthlyeur': 'Monatlich netto (EUR)', 'calc.profit12': 'Gewinn nach 12 Monaten',
    'calc.profit24': 'Gewinn nach 24 Monaten', 'calc.breakeven': 'Break-even',
    'calc.disclaimer': 'Schätzung ohne Berücksichtigung künftiger Difficulty-Anpassungen. Keine Anlageberatung.',
    // Live-Dashboard
    'dash.eyebrow': '📡 Live-Daten',
    'dash.title': 'Live-Netzwerkdaten',
    'dash.subtitle': 'So sieht Bitcoin-Mining gerade jetzt aus – direkt aus dem Netzwerk.',
    'dash.live': 'LIVE',
    'dash.hashrate': 'Netzwerk-Hashrate', 'dash.difficulty': 'Difficulty',
    'dash.block': 'Block-Höhe', 'dash.blocksub': 'aktueller Block', 'dash.btc': 'Bitcoin-Preis',
    'dash.retarget': 'Nächste Difficulty-Anpassung',
    'dash.retargetwait': 'Lade Netzwerkdaten …',
    'dash.source': 'Quellen: mempool.space (Netzwerk) & CoinGecko (Kurs). Aktualisierung clientseitig im Browser.',
    // Features
    'features.title': 'Warum ENPARA?',
    'features.subtitle': 'Rundum-Service für Ihr Mining – von der Hardware bis zum Support.',
    'features.f1.t': 'Hardware-Verkauf', 'features.f1.d': 'Neue & geprüfte Antminer ASIC direkt von uns – inklusive Einrichtung im Rechenzentrum.',
    'features.f2.t': 'Repair-Service', 'features.f2.d': 'Eigene Reparaturwerkstatt vor Ort. Hashboard-Tausch und Firmware-Optimierung inklusive.',
    'features.f3.t': 'Insurance', 'features.f3.d': 'Versicherungsschutz für Ihre Hardware gegen Feuer, Diebstahl und Elementarschäden.',
    'features.f4.t': '24/7 Support', 'features.f4.d': 'Monitoring rund um die Uhr und ein persönlicher Ansprechpartner auf Deutsch & Englisch.',
    'features.f5.t': 'Bandbreiten-Garantie', 'features.f5.d': 'Redundante Glasfaseranbindung sorgt für stabile Pool-Verbindungen ohne Stale Shares.',
    'features.f6.t': 'Wasserkraft-Vorteil', 'features.f6.d': 'Strom aus dem Itaipú-Wasserkraftwerk: günstig, CO₂-arm und nahezu unbegrenzt verfügbar.',
    // Testimonials
    'testi.eyebrow': '⭐ Stimmen',
    'testi.title': 'Was Mining-Kunden überzeugt',
    'testi.subtitle': 'Beispielhafte Szenarien, die zeigen, worauf es beim Hosting ankommt.',
    'testi.sample': 'Beispiel',
    'testi.q1': '„Vom deutschen Netz nach Paraguay gewechselt – die Stromkosten pro kWh sind ein Bruchteil. Der ROI-Zeitraum hat sich spürbar verkürzt.“',
    'testi.n1': 'M. K.', 'testi.m1': 'Hosting-Kunde · Air-Cooled',
    'testi.q2': '„Hydro-cooled Setup läuft extrem stabil. Das 24/7-Monitoring und der schnelle Support auf Deutsch geben mir Sicherheit.“',
    'testi.n2': 'S. B.', 'testi.m2': 'Hosting-Kunde · Hydro-Cooled',
    'testi.q3': '„Hardware bei ENPARA gekauft und direkt vor Ort einrichten lassen. Transparente Abrechnung und volle Sicht auf die Hashrate.“',
    'testi.n3': 'T. R.', 'testi.m3': 'Hardware & Hosting',
    'testi.note': 'Mit „Beispiel“ markierte Aussagen sind Platzhalter und werden vor dem Live-Gang durch echte, freigegebene Kundenstimmen ersetzt.',
    // FAQ
    'faq.eyebrow': '❓ FAQ',
    'faq.title': 'Häufige Fragen',
    'faq.subtitle': 'Alles Wichtige zu Hosting, Strom und Sicherheit auf einen Blick.',
    'faq.q1': 'Was kostet das Hosting bei ENPARA?',
    'faq.a1': 'Air-cooled ab 0,12 $/TH pro Tag, Hydro-cooled ab 0,10 $/TH pro Tag. Der günstige Strom aus Wasserkraft (ab 0,045 $/kWh) ist im Hosting-Tarif berücksichtigt. Den genauen ROI berechnest du mit unserem Kalkulator.',
    'faq.q2': 'Welche Miner kann ich hosten?',
    'faq.a2': 'Wir hosten gängige Antminer-ASICs der S19- und S21-Serie – sowohl luft- als auch wassergekühlt. Andere Modelle gerne auf Anfrage.',
    'faq.q3': 'Woher kommt der Strom?',
    'faq.a3': 'Aus Wasserkraft in Alto Paraná, Paraguay – gespeist aus dem Itaipú-Wasserkraftwerk, einem der größten der Welt mit rund 14.000 MW Leistung. Der Strom ist zu 100 % erneuerbar und CO₂-arm.',
    'faq.q4': 'Wie sicher ist meine Hardware?',
    'faq.a4': '24/7-Monitoring, Zutrittskontrolle, redundante Glasfaseranbindung und optionaler Versicherungsschutz gegen Feuer, Diebstahl und Elementarschäden.',
    'faq.q5': 'Wie schnell kann ich starten?',
    'faq.a5': 'Nach Anfrage und Eingang der Hardware erfolgt das Setup in der Regel innerhalb weniger Werktage. Hardware kann auch direkt bei uns gekauft und im Rechenzentrum eingerichtet werden.',
    'faq.q6': 'Bekomme ich Zugriff auf meine Miner?',
    'faq.a6': 'Ja. Du erhältst Monitoring-Zugang zu Hashrate, Stromverbrauch und Status deiner Geräte sowie einen persönlichen Ansprechpartner auf Deutsch und Englisch.',
    // Instagram
    'insta.eyebrow': '📸 Instagram',
    'insta.title': 'Folge uns auf Instagram',
    'insta.subtitle': 'Einblicke in unsere Mining-Farm, Updates zur Wasserkraft und Neuigkeiten aus Paraguay.',
    'insta.bio': 'Energy Paraguay · Bitcoin Mining Hosting',
    'insta.follow': 'Auf Instagram folgen',
    'insta.p1': 'Hydro-cooled Antminer im Einsatz',
    'insta.p2': '100 % Strom aus dem Itaipú-Wasserkraftwerk',
    'insta.p3': 'Behind the Scenes: Rechenzentrum Alto Paraná',
    'insta.p4': 'Setup-Tag: neue Mining-Rigs',
    'insta.p5': 'Team & Support vor Ort',
    'insta.p6': 'BTC-Marktupdate der Woche',
    // Kontakt
    'contact.title': 'Kontakt aufnehmen',
    'contact.subtitle': 'Sie haben Fragen oder möchten ein Angebot? Wir melden uns innerhalb von 24 Stunden.',
    'contact.addr': 'Adresse', 'contact.email': 'E-Mail', 'contact.instagram': 'Instagram', 'contact.name': 'Name',
    'contact.emaillabel': 'E-Mail', 'contact.interest': 'Paket-Interesse', 'contact.message': 'Nachricht',
    'contact.opt.air': 'Air-Cooled Hosting', 'contact.opt.hydro': 'Hydro-Cooled Hosting',
    'contact.opt.hw': 'Hardware-Kauf', 'contact.opt.other': 'Sonstiges', 'contact.send': 'Nachricht senden',
    'contact.trust': 'Transparenz-Hinweis: ENPARA fragt niemals unaufgefordert nach Wallet-Seeds oder Privatschlüsseln. Offizielle Kommunikation läuft ausschließlich über @enpara.energy und info@enpara.energy.',
    // Footer
    'footer.tag': 'Energy Paraguay · Bitcoin Mining Hosting · Alto Paraná',
    'footer.imprint': 'Impressum', 'footer.privacy': 'Datenschutz', 'footer.terms': 'AGB',
    'footer.rights': 'Alle Rechte vorbehalten.', 'footer.data': 'Kursdaten: CoinGecko · Netzwerkdaten: mempool.space',
  },
  en: {
    'nav.home': 'Home', 'nav.about': 'Why ENPARA', 'nav.location': 'Location', 'nav.packages': 'Plans',
    'nav.calculator': 'Calculator', 'nav.faq': 'FAQ', 'nav.instagram': 'Instagram', 'nav.contact': 'Contact',
    'ticker.loading': 'loading…',
    'hero.eyebrow': '⚡ Hydropower from Paraguay',
    'hero.title': 'Bitcoin Mining Hosting Powered by Green Energy',
    'hero.subtitle': 'Your miners. Our hydropower. Host Antminer ASICs in Alto Paraná, Paraguay – from $0.045/kWh, air- & hydro-cooled, monitored 24/7.',
    'hero.cta': 'Request a quote', 'hero.cta2': 'Calculate ROI',
    'hero.hl1': 'per kWh', 'hero.hl2': 'uptime guarantee', 'hero.hl3': 'hydropower',
    // Stats band
    'stats.title': 'ENPARA in Numbers',
    'stats.subtitle': 'Hard facts over marketing – this is what our location delivers.',
    'stats.from': 'from',
    'stats.l1': 'Itaipú hydro plant capacity',
    'stats.l2': 'Uptime target in the data center',
    'stats.l3': 'Live monitoring & support',
    'stats.l4': 'Electricity price from hydropower',
    // Plans
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
    // Infrastructure
    'infra.eyebrow': '🔌 Infrastructure',
    'infra.title': 'From Water to Hash',
    'infra.subtitle': 'How renewable hydropower becomes computing power for your miners.',
    'infra.s1t': 'Hydropower', 'infra.s1d': 'The Itaipú hydro plant generates 100% renewable power around the clock.',
    'infra.s2t': 'Power grid', 'infra.s2d': 'Cheap energy travels over stable lines straight to our site.',
    'infra.s3t': 'Data center', 'infra.s3d': 'Air- & hydro-cooled racks in Alto Paraná, monitored and serviced 24/7.',
    'infra.s4t': 'Your miners', 'infra.s4d': 'Maximum hashrate at minimum power cost – your Bitcoin yield.',
    'infra.fact1t': 'Location', 'infra.fact1d': 'Alto Paraná, Paraguay',
    'infra.fact2t': 'Energy source', 'infra.fact2d': 'Itaipú hydropower · 100% renewable',
    'infra.fact3t': 'Cooling', 'infra.fact3d': 'Air- & direct-hydro cooling',
    // World map / Location
    'map.eyebrow': '🌎 Location',
    'map.title': 'Our location on the world map',
    'map.subtitle': 'Alto Paraná, Paraguay – in the heart of South America, right next to one of the largest hydropower sources in the world.',
    'map.pin': 'Alto Paraná, Paraguay',
    'map.coords': '25°30′ S · 54°37′ W · Itaipú hydro plant',
    // Calculator
    'calc.title': 'ROI Calculator', 'calc.subtitle': 'Live calculation based on the current Bitcoin price.',
    'calc.model': 'Miner model', 'calc.modelhint': 'Hash rate & power draw are filled in automatically.',
    'calc.count': 'Number of miners', 'calc.hashrate': 'Hash rate (TH/s) per miner',
    'calc.power': 'Power draw (W) per miner', 'calc.elec': 'Electricity cost (USD/kWh)',
    'calc.poolfee': 'Pool fee (%)', 'calc.hwcost': 'Hardware investment (USD) per miner',
    'calc.advanced': 'Network parameters (optional)', 'calc.nethash': 'Network hashrate (EH/s)',
    'calc.reward': 'Block reward (BTC)',
    'calc.nethashhint': 'Auto-filled from the live network data below.',
    'calc.dailybtc': 'Daily BTC output', 'calc.monthlyusd': 'Monthly net (USD)',
    'calc.monthlyeur': 'Monthly net (EUR)', 'calc.profit12': 'Profit after 12 months',
    'calc.profit24': 'Profit after 24 months', 'calc.breakeven': 'Break-even',
    'calc.disclaimer': 'Estimate excluding future difficulty adjustments. Not investment advice.',
    // Live dashboard
    'dash.eyebrow': '📡 Live data',
    'dash.title': 'Live Network Data',
    'dash.subtitle': 'This is what Bitcoin mining looks like right now – straight from the network.',
    'dash.live': 'LIVE',
    'dash.hashrate': 'Network hashrate', 'dash.difficulty': 'Difficulty',
    'dash.block': 'Block height', 'dash.blocksub': 'current block', 'dash.btc': 'Bitcoin price',
    'dash.retarget': 'Next difficulty adjustment',
    'dash.retargetwait': 'Loading network data …',
    'dash.source': 'Sources: mempool.space (network) & CoinGecko (price). Updated client-side in your browser.',
    // Features
    'features.title': 'Why ENPARA?',
    'features.subtitle': 'End-to-end service for your mining – from hardware to support.',
    'features.f1.t': 'Hardware Sales', 'features.f1.d': 'New & tested Antminer ASICs directly from us – including data-center setup.',
    'features.f2.t': 'Repair Service', 'features.f2.d': 'On-site repair workshop. Hashboard replacement and firmware tuning included.',
    'features.f3.t': 'Insurance', 'features.f3.d': 'Insurance coverage for your hardware against fire, theft and natural hazards.',
    'features.f4.t': '24/7 Support', 'features.f4.d': 'Round-the-clock monitoring and a personal contact in English & German.',
    'features.f5.t': 'Bandwidth Guarantee', 'features.f5.d': 'Redundant fiber connectivity ensures stable pool connections without stale shares.',
    'features.f6.t': 'Hydropower Advantage', 'features.f6.d': 'Power from the Itaipú hydroelectric plant: cheap, low-carbon and virtually unlimited.',
    // Testimonials
    'testi.eyebrow': '⭐ Voices',
    'testi.title': 'What Convinces Mining Clients',
    'testi.subtitle': 'Example scenarios that show what matters in hosting.',
    'testi.sample': 'Example',
    'testi.q1': '“Moved from the German grid to Paraguay – the cost per kWh is a fraction. My ROI period shortened noticeably.”',
    'testi.n1': 'M. K.', 'testi.m1': 'Hosting client · Air-Cooled',
    'testi.q2': '“The hydro-cooled setup runs extremely stable. The 24/7 monitoring and fast support give me peace of mind.”',
    'testi.n2': 'S. B.', 'testi.m2': 'Hosting client · Hydro-Cooled',
    'testi.q3': '“Bought hardware from ENPARA and had it set up on-site. Transparent billing and full visibility of my hashrate.”',
    'testi.n3': 'T. R.', 'testi.m3': 'Hardware & Hosting',
    'testi.note': 'Statements marked “Example” are placeholders and will be replaced with real, approved client testimonials before launch.',
    // FAQ
    'faq.eyebrow': '❓ FAQ',
    'faq.title': 'Frequently Asked Questions',
    'faq.subtitle': 'Everything important about hosting, power and security at a glance.',
    'faq.q1': 'What does hosting at ENPARA cost?',
    'faq.a1': 'Air-cooled from $0.12/TH per day, hydro-cooled from $0.10/TH per day. The cheap hydropower (from $0.045/kWh) is included in the hosting rate. Calculate your exact ROI with our calculator.',
    'faq.q2': 'Which miners can I host?',
    'faq.a2': 'We host common Antminer ASICs of the S19 and S21 series – both air- and water-cooled. Other models on request.',
    'faq.q3': 'Where does the power come from?',
    'faq.a3': 'From hydropower in Alto Paraná, Paraguay – fed by the Itaipú hydroelectric plant, one of the largest in the world with around 14,000 MW of capacity. The power is 100% renewable and low-carbon.',
    'faq.q4': 'How secure is my hardware?',
    'faq.a4': '24/7 monitoring, access control, redundant fiber connectivity and optional insurance against fire, theft and natural hazards.',
    'faq.q5': 'How quickly can I start?',
    'faq.a5': 'After your request and once the hardware arrives, setup usually takes a few business days. Hardware can also be purchased directly from us and installed in the data center.',
    'faq.q6': 'Do I get access to my miners?',
    'faq.a6': 'Yes. You get monitoring access to the hashrate, power consumption and status of your devices, plus a personal contact in English and German.',
    // Instagram
    'insta.eyebrow': '📸 Instagram',
    'insta.title': 'Follow us on Instagram',
    'insta.subtitle': 'Behind-the-scenes of our mining farm, hydropower updates and news from Paraguay.',
    'insta.bio': 'Energy Paraguay · Bitcoin Mining Hosting',
    'insta.follow': 'Follow on Instagram',
    'insta.p1': 'Hydro-cooled Antminers in action',
    'insta.p2': '100% power from the Itaipú hydro plant',
    'insta.p3': 'Behind the scenes: Alto Paraná data center',
    'insta.p4': 'Setup day: new mining rigs',
    'insta.p5': 'Team & on-site support',
    'insta.p6': 'BTC market update of the week',
    // Contact
    'contact.title': 'Get in touch',
    'contact.subtitle': 'Have questions or want a quote? We reply within 24 hours.',
    'contact.addr': 'Address', 'contact.email': 'Email', 'contact.instagram': 'Instagram', 'contact.name': 'Name',
    'contact.emaillabel': 'Email', 'contact.interest': 'Plan of interest', 'contact.message': 'Message',
    'contact.opt.air': 'Air-Cooled Hosting', 'contact.opt.hydro': 'Hydro-Cooled Hosting',
    'contact.opt.hw': 'Hardware purchase', 'contact.opt.other': 'Other', 'contact.send': 'Send message',
    'contact.trust': 'Transparency note: ENPARA never asks for wallet seeds or private keys unprompted. Official communication runs exclusively through @enpara.energy and info@enpara.energy.',
    // Footer
    'footer.tag': 'Energy Paraguay · Bitcoin Mining Hosting · Alto Paraná',
    'footer.imprint': 'Imprint', 'footer.privacy': 'Privacy', 'footer.terms': 'Terms',
    'footer.rights': 'All rights reserved.', 'footer.data': 'Price data: CoinGecko · Network data: mempool.space',
  },
};

/* ------------------------------------------------------------
   3. ZUSTAND
   ------------------------------------------------------------ */
const state = {
  lang: 'de',
  price: { ...FALLBACK_PRICE },        // { usd, eur, fallback, ts }
  net: { ...NET_FALLBACK, loaded: false, fallback: false, ts: 0 },
};

// Merkt sich, ob der Nutzer die Netzwerk-Hashrate im Kalkulator selbst
// angepasst hat – dann überschreiben wir sie nicht mit Live-Daten.
let userTouchedNetHash = false;

/* ------------------------------------------------------------
   4. HILFSFUNKTIONEN
   ------------------------------------------------------------ */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const locale = () => (state.lang === 'de' ? 'de-DE' : 'en-US');

function fmtCurrency(value, currency) {
  return new Intl.NumberFormat(locale(), {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(isFinite(value) ? value : 0);
}

function fmtNumber(value, digits = 8) {
  return new Intl.NumberFormat(locale(), {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(isFinite(value) ? value : 0);
}

function fmtTime(ts) {
  if (!ts) return '–';
  return new Date(ts).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(ts) {
  if (!ts) return '–';
  return new Date(ts).toLocaleDateString(locale(), { day: '2-digit', month: 'short' });
}

const numVal = (el, fallback = 0) => {
  const n = parseFloat(el.value);
  return Number.isFinite(n) ? n : fallback;
};

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  try { localStorage.setItem('enpara_lang', lang); } catch (_) {}

  // Dynamische Inhalte neu rendern (Zahlenformat, Modell-Select, Live-Daten)
  renderMinerOptions();
  renderCounters();
  renderPrice();
  renderNetwork();
  calculateRoi();
}

function initLanguage() {
  let lang = 'de';
  try {
    const saved = localStorage.getItem('enpara_lang');
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
  if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
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
   8. ANIMIERTE ZAHLEN (Stat-Band)
   ------------------------------------------------------------ */
function renderCounters() {
  $$('.stat-num').forEach((el) => {
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const target = parseFloat(el.dataset.countTo) || 0;
    el.textContent = fmtNumber(el.dataset.done === '1' ? target : 0, decimals);
  });
}

function animateCount(el) {
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const target = parseFloat(el.dataset.countTo);
  if (!Number.isFinite(target)) return;

  if (prefersReducedMotion()) {
    el.dataset.done = '1';
    el.textContent = fmtNumber(target, decimals);
    return;
  }

  const duration = 1400;
  const start = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  const tick = (now) => {
    const p = Math.min(1, (now - start) / duration);
    el.textContent = fmtNumber(target * ease(p), decimals);
    if (p < 1) {
      requestAnimationFrame(tick);
    } else {
      el.dataset.done = '1';
      el.textContent = fmtNumber(target, decimals);
    }
  };
  requestAnimationFrame(tick);
}

function initCounters() {
  const nums = $$('.stat-num');
  if (!nums.length) return;
  renderCounters();

  if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
    nums.forEach((el) => { el.dataset.done = '1'; });
    renderCounters();
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  nums.forEach((el) => io.observe(el));
}

/* ------------------------------------------------------------
   9. BITCOIN-PREIS (CoinGecko + Fallback + Cache)
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
    console.warn('[ENPARA] BTC-Preis konnte nicht geladen werden:', err.message);
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
  const dashBtc = $('#dashBtc');

  if (tickerPrice) tickerPrice.textContent = fmtCurrency(usd, 'USD');
  if (ticker) ticker.classList.toggle('is-stale', !!fallback);
  if (bannerUsd) bannerUsd.textContent = fmtCurrency(usd, 'USD');
  if (bannerEur) bannerEur.textContent = fmtCurrency(eur, 'EUR');
  if (dashBtc) dashBtc.textContent = fmtCurrency(usd, 'USD');
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
   10. LIVE-NETZWERKDATEN (mempool.space + Fallback)
   ------------------------------------------------------------ */
async function fetchJson(url, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ctype = res.headers.get('content-type') || '';
    return ctype.includes('json') ? res.json() : res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchNetwork() {
  const [hr, da, ht] = await Promise.allSettled([
    fetchJson(`${MEMPOOL_API}/v1/mining/hashrate/1m`),
    fetchJson(`${MEMPOOL_API}/v1/difficulty-adjustment`),
    fetchJson(`${MEMPOOL_API}/blocks/tip/height`),
  ]);

  let ok = false;

  if (hr.status === 'fulfilled' && hr.value && hr.value.currentHashrate) {
    state.net.hashrateEh = hr.value.currentHashrate / 1e18;
    if (hr.value.currentDifficulty) state.net.difficultyT = hr.value.currentDifficulty / 1e12;
    ok = true;
  }
  if (da.status === 'fulfilled' && da.value && typeof da.value === 'object') {
    const d = da.value;
    if (Number.isFinite(d.difficultyChange)) state.net.changePct = d.difficultyChange;
    if (Number.isFinite(d.progressPercent)) state.net.progressPct = d.progressPercent;
    if (Number.isFinite(d.remainingBlocks)) state.net.remainingBlocks = d.remainingBlocks;
    if (Number.isFinite(d.estimatedRetargetDate)) state.net.retargetTs = d.estimatedRetargetDate;
    ok = true;
  }
  if (ht.status === 'fulfilled') {
    const h = parseInt(ht.value, 10);
    if (Number.isFinite(h)) { state.net.height = h; ok = true; }
  }

  state.net.loaded = true;
  state.net.fallback = !ok;
  state.net.ts = Date.now();

  if (!ok) console.warn('[ENPARA] Netzwerkdaten nicht verfügbar – Richtwerte werden angezeigt.');

  // Live-Hashrate in den Kalkulator übernehmen (sofern Nutzer nichts geändert hat)
  if (ok && !userTouchedNetHash) {
    const field = $('#netHash');
    if (field) { field.value = Math.round(state.net.hashrateEh); calculateRoi(); }
  }

  renderNetwork();
}

function renderNetwork() {
  if (!state.net.loaded) return; // vor dem ersten Laden bleiben die „–"-Platzhalter

  const { hashrateEh, difficultyT, height, changePct, progressPct,
          remainingBlocks, retargetTs, fallback, ts } = state.net;
  const de = state.lang === 'de';

  const set = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };

  set('#dashHashrate', fmtNumber(hashrateEh, 0));
  set('#dashDifficulty', fmtNumber(difficultyT, 1));
  set('#dashBlock', fmtNumber(height, 0));

  // Difficulty-Veränderung (+/-)
  const changeEl = $('#dashChange');
  if (changeEl) {
    if (Number.isFinite(changePct)) {
      const sign = changePct >= 0 ? '+' : '−';
      changeEl.textContent = `${sign}${fmtNumber(Math.abs(changePct), 2)} %`;
      changeEl.classList.toggle('is-up', changePct >= 0);
      changeEl.classList.toggle('is-down', changePct < 0);
    } else {
      changeEl.textContent = '–';
    }
  }

  // Fortschrittsbalken bis zur nächsten Anpassung
  const fill = $('#retargetFill');
  const bar = $('#retargetBar');
  if (fill && Number.isFinite(progressPct)) {
    const pct = Math.max(0, Math.min(100, progressPct));
    fill.style.width = `${pct}%`;
    if (bar) bar.setAttribute('aria-valuenow', String(Math.round(pct)));
  }

  // Meta-Text: in ~X Blöcken · geschätzt DATUM
  const meta = $('#retargetMeta');
  if (meta) {
    if (fallback) {
      meta.textContent = de
        ? 'Live-Daten momentan nicht verfügbar – Richtwerte angezeigt.'
        : 'Live data temporarily unavailable – showing reference values.';
    } else {
      const parts = [];
      if (Number.isFinite(remainingBlocks)) {
        parts.push(de ? `in ~${fmtNumber(remainingBlocks, 0)} Blöcken` : `in ~${fmtNumber(remainingBlocks, 0)} blocks`);
      }
      if (retargetTs) {
        parts.push(de ? `geschätzt ${fmtDate(retargetTs)}` : `est. ${fmtDate(retargetTs)}`);
      }
      meta.textContent = parts.join(' · ') || (de ? 'Aktuell' : 'Up to date');
    }
  }

  // LIVE-Indikator & Stale-Zustand
  const dash = $('#dashboard');
  if (dash) dash.classList.toggle('is-stale', !!fallback);

  const updated = $('#dashUpdated');
  if (updated) {
    updated.textContent = fallback ? '' : ` · ${de ? 'Stand' : 'as of'} ${fmtTime(ts)}`;
  }
}

function initNetwork() {
  if (!$('#dashboard')) return;
  fetchNetwork();
  setInterval(fetchNetwork, NET_REFRESH_MS);
}

/* ------------------------------------------------------------
   11. ROI-KALKULATOR
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

  // Manuelle Änderung der Netzwerk-Hashrate merken (keine Live-Überschreibung)
  const netHash = $('#netHash');
  if (netHash) netHash.addEventListener('input', () => { userTouchedNetHash = true; });

  // Jede Eingabe löst Neuberechnung aus
  form.addEventListener('input', calculateRoi);
  calculateRoi();
}

/* ------------------------------------------------------------
   12. FAQ (nur ein Eintrag gleichzeitig offen)
   ------------------------------------------------------------ */
function initFaq() {
  const items = $$('.faq-item');
  if (!items.length) return;
  items.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        items.forEach((other) => { if (other !== item) other.open = false; });
      }
    });
  });
}

/* ------------------------------------------------------------
   13. KONTAKTFORMULAR
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
   13b. HERO-VISUALS (Video + animierte Wasserkraft-Szene)
   ------------------------------------------------------------ */
function initHeroMedia() {
  const video = $('.hero-video');
  const scene = $('.hero-scene');

  if (prefersReducedMotion()) {
    // Bewegung reduzieren: Video pausieren/ausblenden, statische Szene zeigen
    if (video) {
      video.removeAttribute('autoplay');
      video.pause?.();
      video.style.display = 'none';
    }
    // SMIL-Animationen der SVG-Szene anhalten
    try { scene?.contentDocument?.documentElement?.pauseAnimations?.(); } catch (_) {}
    return;
  }

  if (!video) return;

  // Fehlt das Video (z. B. assets/hydro-bg.mp4 nicht vorhanden), bleibt
  // die animierte SVG-Szene darunter sichtbar – Element ausblenden.
  video.addEventListener('error', () => { video.style.display = 'none'; }, true);
  video.addEventListener('stalled', () => { video.style.display = 'none'; });

  // Energie sparen: Video nur abspielen, solange der Hero sichtbar ist
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) video.play?.().catch(() => {});
        else video.pause?.();
      });
    }, { threshold: 0.15 });
    io.observe(video);
  }
}

/* ------------------------------------------------------------
   14. INIT
   ------------------------------------------------------------ */
function init() {
  $('#year').textContent = new Date().getFullYear();
  initLanguage();
  initHeader();
  initMobileNav();
  initHeroMedia();
  initReveal();
  initCounters();
  initCalculator();
  initFaq();
  initContactForm();
  initPrice();
  initNetwork();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
