/* ==========================================================================
   HashWerk – Interaktionen
   Live-Daten, Mining-Rechner, Kontaktformular, Animationen
   ========================================================================== */

// ----- Sprache (DE-Startseite oder EN-Version unter /en/) -----
const LANG = document.documentElement.lang === "en" ? "en" : "de";
const LOCALE = LANG === "en" ? "en-US" : "de-DE";

const TEXTE = {
  de: {
    liveBadge: "Live-Daten",
    fallbackBadge: "Standardwerte",
    btcHintLive: "Live-Kurs (CoinGecko) – manuell anpassbar",
    calcNote: (ehs, live) =>
      `Annahmen: Netzwerk-Hashrate ${ehs.toLocaleString("de-DE")} EH/s` +
      (live ? " (live, mempool.space)" : " (Standardwert)") +
      `, Block-Belohnung 3,125 BTC, 144 Blöcke/Tag. Ohne Pool- und ` +
      `Transaktionsgebühren – nur eine grobe Schätzung, keine Anlageberatung.`,
    formSuccess: "Danke! Deine Nachricht ist angekommen (Demo – es wird nichts versendet).",
    formError: "Bitte fülle alle Pflichtfelder korrekt aus.",
  },
  en: {
    liveBadge: "Live data",
    fallbackBadge: "Default values",
    btcHintLive: "Live price (CoinGecko) – adjustable",
    calcNote: (ehs, live) =>
      `Assumptions: network hashrate ${ehs.toLocaleString("en-US")} EH/s` +
      (live ? " (live, mempool.space)" : " (default)") +
      `, block reward 3.125 BTC, 144 blocks/day. Excludes pool and ` +
      `transaction fees – a rough estimate, not financial advice.`,
    formSuccess: "Thanks! Your message was received (demo – nothing is actually sent).",
    formError: "Please fill in all required fields correctly.",
  },
}[LANG];

// ----- Mobiles Menü -----
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});

navLinks.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

// ----- Animierte Kennzahlen (starten, sobald sichtbar) -----
function animateCount(el) {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals, 10) || 0;
  const duration = 1400;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = (target * eased).toLocaleString(LOCALE, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const statsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll(".stat-value").forEach(animateCount);
        statsObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.4 }
);

const statsBar = document.getElementById("stats");
if (statsBar) statsObserver.observe(statsBar);

// ----- Scroll-Reveal -----
const revealSelector = ".card, .feature, .step, .faq-item, .section-kicker, .section h2, .section-intro, .energy-panel, .contact-form";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduceMotion && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(revealSelector).forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${(i % 4) * 70}ms`; // leichter Versatz je Gruppe
    revealObserver.observe(el);
  });
}

// ----- Partikel-Hintergrund im Hero -----
const canvas = document.getElementById("hero-canvas");

if (canvas && !reduceMotion) {
  const ctx = canvas.getContext("2d");
  const PARTICLE_COUNT = 42;
  const LINK_DIST = 130;
  let particles = [];
  let width, height;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = canvas.width = rect.width;
    height = canvas.height = rect.height;
  }

  function initParticles() {
    particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 1 + Math.random() * 1.8,
    }));
  }

  function frame() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(247, 147, 26, 0.45)";
      ctx.fill();
    });

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < LINK_DIST) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(247, 147, 26, ${0.14 * (1 - dist / LINK_DIST)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(frame);
  }

  resize();
  initParticles();
  frame();
  window.addEventListener("resize", () => {
    resize();
    initParticles();
  });
}

// ----- Mining-Rechner -----
// Standard-Annahmen; werden durch Live-Daten ersetzt, sobald die APIs antworten.
// Reale Erträge hängen von Difficulty, Gebühren, Pool-Fees und Glück ab.
let netzwerkHashrateEhs = 900; // Gesamt-Hashrate des Netzwerks in EH/s
let netzwerkLive = false;
let kursLive = false;
const BLOCK_REWARD_BTC = 3.125; // Block-Subvention nach dem Halving 2024
const BLOECKE_PRO_TAG = 144;    // ~ alle 10 Minuten ein Block

// Gängige Geräte für Presets und Vergleichstabelle
const MINER = [
  { name: "Antminer S21 Pro", ths: 234, watt: 3531 },
  { name: "Antminer S21", ths: 200, watt: 3500 },
  { name: "Antminer S19k Pro", ths: 120, watt: 2760 },
  { name: "Whatsminer M60S", ths: 186, watt: 3441 },
  { name: "Whatsminer M50", ths: 114, watt: 3306 },
];

const inputs = {
  miner: document.getElementById("calc-miner"),
  hashrate: document.getElementById("calc-hashrate"),
  power: document.getElementById("calc-power"),
  price: document.getElementById("calc-price"),
  btc: document.getElementById("calc-btc"),
};

const outputs = {
  btc: document.getElementById("res-btc"),
  revenue: document.getElementById("res-revenue"),
  cost: document.getElementById("res-cost"),
  profit: document.getElementById("res-profit"),
  note: document.getElementById("calc-note"),
  badge: document.getElementById("data-badge"),
  btcHint: document.getElementById("calc-btc-hint"),
  tableBody: document.querySelector("#miner-table tbody"),
};

const euro = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

// Tagesgewinn für beliebige Gerätewerte (gemeinsame Basis für Rechner + Tabelle)
function tagesRechnung(hashrateThs, powerWatt, stromCt, btcKurs) {
  const netzwerkThs = netzwerkHashrateEhs * 1_000_000; // 1 EH/s = 1.000.000 TH/s
  const anteil = netzwerkThs > 0 ? hashrateThs / netzwerkThs : 0;
  const btcProTag = anteil * BLOECKE_PRO_TAG * BLOCK_REWARD_BTC;
  const erloes = btcProTag * btcKurs;
  const kosten = (powerWatt / 1000) * 24 * (stromCt / 100);
  return { btcProTag, erloes, kosten, gewinn: erloes - kosten };
}

function berechne() {
  const hashrateThs = parseFloat(inputs.hashrate.value) || 0;
  const powerWatt = parseFloat(inputs.power.value) || 0;
  const stromCt = parseFloat(inputs.price.value) || 0;
  const btcKurs = parseFloat(inputs.btc.value) || 0;

  const r = tagesRechnung(hashrateThs, powerWatt, stromCt, btcKurs);

  outputs.btc.textContent = r.btcProTag.toLocaleString(LOCALE, {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  }) + " BTC";
  outputs.revenue.textContent = euro.format(r.erloes);
  outputs.cost.textContent = euro.format(r.kosten);
  outputs.profit.textContent = euro.format(r.gewinn);
  outputs.profit.classList.toggle("positive", r.gewinn >= 0);
  outputs.profit.classList.toggle("negative", r.gewinn < 0);

  outputs.note.textContent = TEXTE.calcNote(Math.round(netzwerkHashrateEhs), netzwerkLive);

  aktualisiereTabelle(stromCt, btcKurs, hashrateThs, powerWatt);
}

function aktualisiereTabelle(stromCt, btcKurs, aktivThs, aktivWatt) {
  if (!outputs.tableBody) return;
  outputs.tableBody.innerHTML = "";
  MINER.forEach((m) => {
    const r = tagesRechnung(m.ths, m.watt, stromCt, btcKurs);
    const effizienz = (m.watt / m.ths).toLocaleString(LOCALE, { maximumFractionDigits: 1 });
    const tr = document.createElement("tr");
    if (m.ths === aktivThs && m.watt === aktivWatt) tr.classList.add("active");

    const cells = [
      m.name,
      `${m.ths} TH/s`,
      `${m.watt.toLocaleString(LOCALE)} W`,
      `${effizienz} J/TH`,
      euro.format(r.gewinn),
    ];
    cells.forEach((text, i) => {
      const td = document.createElement("td");
      td.textContent = text;
      if (i === 4) td.classList.add(r.gewinn >= 0 ? "positive" : "negative");
      tr.appendChild(td);
    });
    outputs.tableBody.appendChild(tr);
  });
}

// Preset-Auswahl füllt Hashrate/Watt; manuelle Eingabe schaltet auf "Eigene Werte"
inputs.miner.addEventListener("change", () => {
  if (inputs.miner.value === "custom") return;
  const [ths, watt] = inputs.miner.value.split(",").map(Number);
  inputs.hashrate.value = ths;
  inputs.power.value = watt;
  berechne();
});

[inputs.hashrate, inputs.power].forEach((input) => {
  input.addEventListener("input", () => {
    inputs.miner.value = "custom";
    berechne();
  });
});

[inputs.price, inputs.btc].forEach((input) => {
  input.addEventListener("input", () => {
    if (input === inputs.btc) kursLive = false; // manuell überschrieben
    berechne();
  });
});

berechne();

// ----- Live-Daten (CoinGecko + mempool.space) -----
const ticker = document.getElementById("ticker");
const tickerPrice = document.getElementById("ticker-price");
const tickerChange = document.getElementById("ticker-change");

function setzeBadge() {
  const live = kursLive || netzwerkLive;
  outputs.badge.dataset.state = live ? "live" : "fallback";
  outputs.badge.textContent = live ? TEXTE.liveBadge : TEXTE.fallbackBadge;
}

async function ladeKurs() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur&include_24hr_change=true"
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const kurs = data.bitcoin.eur;
    const change = data.bitcoin.eur_24h_change;

    // Ticker im Header
    ticker.hidden = false;
    tickerPrice.textContent = "BTC " + euro.format(kurs);
    tickerChange.textContent =
      (change >= 0 ? "+" : "") + change.toLocaleString(LOCALE, { maximumFractionDigits: 2 }) + " %";
    tickerChange.classList.toggle("up", change >= 0);
    tickerChange.classList.toggle("down", change < 0);

    // Rechner nur aktualisieren, solange der Nutzer den Kurs nicht selbst geändert hat
    if (!inputs.btc.dataset.userEdited) {
      inputs.btc.value = Math.round(kurs);
      kursLive = true;
      outputs.btcHint.textContent = TEXTE.btcHintLive;
      berechne();
    }
  } catch (err) {
    console.warn("BTC-Kurs nicht verfügbar, Standardwert bleibt aktiv:", err.message);
  }
  setzeBadge();
}

async function ladeNetzwerk() {
  try {
    const res = await fetch("https://mempool.space/api/v1/mining/hashrate/3d");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.currentHashrate > 0) {
      netzwerkHashrateEhs = data.currentHashrate / 1e18; // H/s → EH/s
      netzwerkLive = true;
      berechne();
    }
  } catch (err) {
    console.warn("Netzwerk-Hashrate nicht verfügbar, Standardwert bleibt aktiv:", err.message);
  }
  setzeBadge();
}

inputs.btc.addEventListener("input", () => {
  inputs.btc.dataset.userEdited = "1";
});

ladeKurs();
ladeNetzwerk();
setInterval(ladeKurs, 60_000); // Ticker alle 60 s aktualisieren

// ----- Kontaktformular (Demo ohne Backend) -----
// Für den Produktivbetrieb: action auf einen Form-Endpoint (z. B. Formspree)
// setzen und den submit-Handler durch echtes Absenden ersetzen.
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    let valid = true;
    contactForm.querySelectorAll("[required]").forEach((field) => {
      const ok = field.checkValidity() && field.value.trim() !== "";
      field.classList.toggle("invalid", !ok);
      if (!ok) valid = false;
    });

    if (!valid) {
      formStatus.textContent = TEXTE.formError;
      formStatus.className = "form-status error";
      return;
    }

    formStatus.textContent = TEXTE.formSuccess;
    formStatus.className = "form-status success";
    contactForm.reset();
  });
}
