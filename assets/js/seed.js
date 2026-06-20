/* =========================================================
   ENPARA — shared seed-round model & client-side ledger
   Loaded BEFORE main.js / dashboard.js on every page.

   Why a client-side ledger?  This site is fully static (no
   backend), so "echte Einnahmen" are tracked in the browser
   via localStorage. The admin (Dashboard → Admin) confirms
   real SEPA / crypto income; visitor enquiries land as
   pending requests the admin can confirm into the ledger.
   For a production launch, replace the storage functions
   below with calls to your real backend/CRM.
   ========================================================= */
(function () {
  "use strict";

  /* ---------------- Core configuration (edit me) ---------------- */
  const CFG = {
    farmMW: 1,            // Phase-1 total farm capacity (MW)
    seedShare: 0.70,      // 70 % of the 1 MW is offered in the seed round
    wattPerTH: 13.5,      // hydro Antminer efficiency (J/TH ≈ W/TH)
    pricePerTH: 25,       // entry/headline € per TH/s (basis for target & availability)
    target: 1300000,      // seed funding goal (€) — round, editable headline
    minTicket: 5000,      // minimum participation (€)
    deadline: "2026-11-30T23:59:59", // round closes end of November 2026
    adminPass: "enpara2026",         // ⚠ client-side gate only — NOT real security

    // Hashrate packages used across the whole site
    packages: [
      { id: "starter", name: "Starter", th: 200,  price: 5000  },
      { id: "pro",     name: "Pro",     th: 400,  price: 9500  },
      { id: "whale",   name: "Whale",   th: 1100, price: 37000 },
    ],

    // Use of funds (allocation of raised capital)
    useOfFunds: [
      { label: "Hydro-Hardware (ASICs)", pct: 64 },
      { label: "Halle & Infrastruktur", pct: 17 },
      { label: "Energie-Anbindung", pct: 10 },
      { label: "Betrieb & Reserve", pct: 9 },
    ],

    // Reference hydro miners (for the calculator's "Beispiel-Miner")
    miners: [
      { name: "Antminer S19 XP Hydro", th: 257, w: 5304 },
      { name: "Antminer S21 Hydro",    th: 335, w: 5360 },
      { name: "Antminer S21 XP Hydro", th: 473, w: 5676 },
    ],

    // Shared mining-economics assumptions (calculator + package impact view)
    mining: {
      tariffEurKwh: 0.12,   // all-in customer tariff (energy + hosting + maintenance)
      poolFee: 0.02,        // pool / management fee
      blockRewardBTC: 3.125,
      blocksPerDay: 144,
      networkEH: 850,       // realistic network hashrate assumption (EH/s)
      defaultBtcEur: 100000,
    },
  };

  // Derived capacity figures
  CFG.seedMW  = CFG.farmMW * CFG.seedShare;                 // 0.70 MW
  CFG.totalTH = Math.round(CFG.seedMW * 1e6 / CFG.wattPerTH); // ≈ 51.852 TH/s available to the seed round

  /* ---------------- Formatting helpers ---------------- */
  const euro0 = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const fmtE = (n) => euro0.format(Math.round(n || 0));
  const num = (n) => Math.round(n || 0).toLocaleString("de-DE");
  const fmt1 = (n) => (n || 0).toFixed(1).replace(".", ",");
  const fmt2 = (n) => (n || 0).toFixed(2).replace(".", ",");

  function whenLabel(ts) {
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60000);
    if (min < 1) return "gerade eben";
    if (min < 60) return "vor " + min + " Min";
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return "vor " + hrs + " Std";
    const days = Math.floor(hrs / 24);
    if (days === 1) return "gestern";
    if (days < 30) return "vor " + days + " Tagen";
    const months = Math.floor(days / 30);
    return "vor " + months + " Mon.";
  }

  /* ---------------- Storage (localStorage) ---------------- */
  const LS_LEDGER = "enpara_ledger_v1";   // confirmed income
  const LS_REQ    = "enpara_requests_v1"; // pending visitor enquiries

  const readJSON = (key) => { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; } };
  const writeJSON = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // Demo ledger so the dashboard isn't empty on first visit.
  // Spread over ~5 months so the cumulative chart shows a real curve.
  // [amount, method, daysAgo, name]
  const DEMO_RAW = [
    [37000, "BTC",  1,   "M. Keller"],
    [9500,  "SEPA", 2,   "A. Roth"],
    [5000,  "USDT", 5,   "L. Bauer"],
    [22000, "ETH",  9,   "S. Fischer"],
    [9500,  "BTC",  14,  "—"],
    [5000,  "SEPA", 21,  "T. Wagner"],
    [37000, "USDC", 28,  "Family Office DE"],
    [14000, "BTC",  36,  "—"],
    [9500,  "SEPA", 45,  "P. Hofmann"],
    [5000,  "ETH",  55,  "—"],
    [9500,  "BTC",  66,  "C. Neumann"],
    [18500, "USDT", 78,  "—"],
    [5000,  "SEPA", 90,  "R. Schäfer"],
    [37000, "BTC",  104, "Krypto-Fonds I"],
    [9500,  "USDC", 116, "—"],
    [12000, "ETH",  128, "—"],
    [9500,  "SEPA", 140, "B. Krüger"],
    [5000,  "BTC",  150, "—"],
    [15000, "USDT", 158, "—"],
    [37000, "SEPA", 165, "Beteiligungs-GmbH"],
  ];

  function buildDemo() {
    const now = Date.now();
    return DEMO_RAW.map((r) => ({
      id: uid(), amount: r[0], method: r[1],
      ts: now - r[2] * 86400000 - Math.floor(Math.random() * 6) * 3600000,
      name: r[3] || "—", demo: true,
    })).sort((a, b) => b.ts - a.ts);
  }

  function ledger() {
    let l = readJSON(LS_LEDGER);
    if (!Array.isArray(l)) { l = buildDemo(); writeJSON(LS_LEDGER, l); }
    return l;
  }
  function requests() {
    const r = readJSON(LS_REQ);
    return Array.isArray(r) ? r : [];
  }

  /* ---------------- Ledger mutations (admin) ---------------- */
  function addEntry(e) {
    const list = ledger();
    list.unshift({
      id: uid(),
      amount: Math.max(0, Math.round(+e.amount || 0)),
      method: e.method || "SEPA",
      name: (e.name || "—").trim() || "—",
      ts: e.ts || Date.now(),
    });
    list.sort((a, b) => b.ts - a.ts);
    writeJSON(LS_LEDGER, list);
    return list;
  }
  function removeEntry(id) {
    writeJSON(LS_LEDGER, ledger().filter((x) => x.id !== id));
  }
  function resetDemo() { const d = buildDemo(); writeJSON(LS_LEDGER, d); return d; }
  function clearAll() { writeJSON(LS_LEDGER, []); return []; }

  /* ---------------- Requests (visitor enquiries) ---------------- */
  function addRequest(r) {
    const list = requests();
    list.unshift({
      id: uid(), ts: Date.now(),
      name: r.name || "", email: r.email || "",
      amount: Math.round(+r.amount || 0),
      method: r.method || "crypto",
      asset: r.asset || "", ref: r.ref || "",
    });
    writeJSON(LS_REQ, list);
    return list;
  }
  function confirmRequest(id) {
    const r = requests().find((x) => x.id === id);
    if (!r) return;
    addEntry({ amount: r.amount, method: r.method === "crypto" ? (r.asset || "BTC") : "SEPA", name: r.name || r.ref || "—", ts: Date.now() });
    dropRequest(id);
  }
  function dropRequest(id) { writeJSON(LS_REQ, requests().filter((x) => x.id !== id)); }

  /* ---------------- Aggregates ---------------- */
  function totals() {
    const es = ledger();
    const raised = es.reduce((a, e) => a + (+e.amount || 0), 0);
    const investors = es.length;
    const target = CFG.target;
    const free = Math.max(0, target - raised);
    const pct = target ? Math.min(1, raised / target) : 0;
    return {
      raised, investors, target, free, pct,
      avg: investors ? raised / investors : 0,
      committedMW: CFG.seedMW * pct,
      committedTH: Math.round(CFG.totalTH * pct),
      freeMW: CFG.seedMW * (1 - pct),
      freeTH: Math.round(CFG.totalTH * (1 - pct)),
    };
  }

  // Which packages still fit into the remaining free amount
  function remainingPackages() {
    const free = totals().free;
    return CFG.packages.map((p) => ({
      ...p, remaining: Math.floor(free / p.price),
    }));
  }

  // Cumulative capital over the last months (for the dashboard chart)
  function monthlySeries() {
    const es = ledger().slice().sort((a, b) => a.ts - b.ts);
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ y: d.getFullYear(), m: d.getMonth(), label: d.toLocaleDateString("de-DE", { month: "short" }), end: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() });
    }
    let cum = 0; let idx = 0;
    const values = months.map((mo) => {
      while (idx < es.length && es[idx].ts < mo.end) { cum += es[idx].amount; idx++; }
      return cum;
    });
    // include everything older than the window in the first bucket
    return { labels: months.map((m) => m.label), values };
  }

  /* ---------------- Countdown ---------------- */
  function countdown(now) {
    now = now || Date.now();
    const end = new Date(CFG.deadline).getTime();
    let ms = Math.max(0, end - now);
    const day = 86400000;
    const days = Math.floor(ms / day); ms -= days * day;
    const hours = Math.floor(ms / 3600000); ms -= hours * 3600000;
    const mins = Math.floor(ms / 60000);
    return { days, hours, mins, ended: end - now <= 0, end };
  }
  function deadlineLabel() {
    return new Date(CFG.deadline).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
  }

  /* ---------------- Admin session ---------------- */
  const isUnlocked = () => sessionStorage.getItem("enpara_admin") === "1";
  function unlock(pass) {
    if (pass === CFG.adminPass) { try { sessionStorage.setItem("enpara_admin", "1"); } catch (e) {} return true; }
    return false;
  }
  function lock() { try { sessionStorage.removeItem("enpara_admin"); } catch (e) {} }

  /* ---------------- Export ---------------- */
  window.ENPARA_SEED = {
    CFG,
    fmtE, num, fmt1, fmt2, whenLabel,
    ledger, requests, totals, remainingPackages, monthlySeries,
    addEntry, removeEntry, resetDemo, clearAll,
    addRequest, confirmRequest, dropRequest,
    countdown, deadlineLabel,
    isUnlocked, unlock, lock,
  };
})();
