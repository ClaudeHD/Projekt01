/* ==========================================================================
   HashWerk – Interaktionen
   ========================================================================== */

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
    el.textContent = (target * eased).toLocaleString("de-DE", {
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

// ----- Mining-Rechner -----
// Vereinfachtes Modell auf Basis fester Netzwerk-Annahmen.
// Reale Erträge hängen von Difficulty, Gebühren, Pool-Fees und Glück ab.
const NETZWERK_HASHRATE_EHS = 900; // Gesamt-Hashrate des Netzwerks in EH/s (Annahme)
const BLOCK_REWARD_BTC = 3.125;    // Block-Subvention nach dem Halving 2024
const BLOECKE_PRO_TAG = 144;       // ~ alle 10 Minuten ein Block

const inputs = {
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
};

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

function berechne() {
  const hashrateThs = parseFloat(inputs.hashrate.value) || 0;
  const powerWatt = parseFloat(inputs.power.value) || 0;
  const stromCt = parseFloat(inputs.price.value) || 0;
  const btcKurs = parseFloat(inputs.btc.value) || 0;

  // Anteil an der Netzwerk-Hashrate (1 EH/s = 1.000.000 TH/s)
  const netzwerkThs = NETZWERK_HASHRATE_EHS * 1_000_000;
  const anteil = netzwerkThs > 0 ? hashrateThs / netzwerkThs : 0;

  const btcProTag = anteil * BLOECKE_PRO_TAG * BLOCK_REWARD_BTC;
  const erloesProTag = btcProTag * btcKurs;
  const kostenProTag = (powerWatt / 1000) * 24 * (stromCt / 100);
  const gewinnProTag = erloesProTag - kostenProTag;

  outputs.btc.textContent = btcProTag.toLocaleString("de-DE", {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  }) + " BTC";
  outputs.revenue.textContent = euro.format(erloesProTag);
  outputs.cost.textContent = euro.format(kostenProTag);
  outputs.profit.textContent = euro.format(gewinnProTag);
  outputs.profit.classList.toggle("positive", gewinnProTag >= 0);
  outputs.profit.classList.toggle("negative", gewinnProTag < 0);

  outputs.note.textContent =
    `Annahmen: Netzwerk-Hashrate ${NETZWERK_HASHRATE_EHS} EH/s, ` +
    `Block-Belohnung ${BLOCK_REWARD_BTC} BTC, ${BLOECKE_PRO_TAG} Blöcke/Tag. ` +
    `Ohne Pool-Gebühren, Transaktionsgebühren und Difficulty-Anpassungen – ` +
    `nur eine grobe Schätzung, keine Anlageberatung.`;
}

Object.values(inputs).forEach((input) => {
  input.addEventListener("input", berechne);
});

berechne();
