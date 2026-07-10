/* =========================================================
   ENPARA — Seed-Round Dashboard
   All values are DEMO data. Replace DASH below with real numbers.
   ========================================================= */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const euro0 = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const num = (n) => Math.round(n).toLocaleString("de-DE");

  /* ---------------- DASH data (edit me) ---------------- */
  const DASH = {
    target: 1500000,
    raised: 1020000,
    investors: 143,
    daysLeft: 45,
    minTicket: 5000,
    capacityMW: 1,
    totalTH: 74000,
    useOfFunds: [
      { label: "Hydro-Hardware (ASICs)", pct: 64 },
      { label: "Halle & Infrastruktur", pct: 17 },
      { label: "Energie-Anbindung", pct: 10 },
      { label: "Betrieb & Reserve", pct: 9 },
    ],
    tiers: [
      { label: "Starter · 200 TH/s", count: 96, of: 120 },
      { label: "Pro · 400 TH/s", count: 40, of: 60 },
      { label: "Whale · 1.000 TH/s", count: 7, of: 15 },
    ],
    timeline: {
      labels: ["Feb", "Mär", "Apr", "Mai", "Jun"],
      values: [140000, 360000, 620000, 840000, 1020000],
    },
    feed: [
      { method: "BTC", amount: 9500, when: "vor 2 Std" },
      { method: "USDT", amount: 22500, when: "vor 5 Std" },
      { method: "SEPA", amount: 5000, when: "vor 9 Std" },
      { method: "ETH", amount: 9500, when: "gestern" },
      { method: "BTC", amount: 5000, when: "gestern" },
      { method: "SEPA", amount: 22500, when: "vor 2 Tagen" },
      { method: "USDC", amount: 9500, when: "vor 3 Tagen" },
    ],
  };

  const pct = Math.min(1, DASH.raised / DASH.target);

  /* ---------------- year ---------------- */
  const yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------------- number count-up ---------------- */
  const animateNum = (el, target, fmt) => {
    if (!el) return;
    const dur = 1500, start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const v = target * (1 - Math.pow(1 - p, 3));
      el.textContent = fmt(v);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------------- ring ---------------- */
  const ring = $("#d-ring");
  if (ring) {
    const r = parseFloat(ring.getAttribute("r"));
    const circ = 2 * Math.PI * r;
    ring.style.strokeDasharray = circ.toFixed(2);
    ring.style.strokeDashoffset = circ.toFixed(2);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      ring.style.strokeDashoffset = (circ * (1 - pct)).toFixed(2);
    }));
  }
  animateNum($("#d-pct"), pct * 100, (v) => Math.round(v) + " %");

  /* ---------------- headline figures ---------------- */
  animateNum($("#d-raised"), DASH.raised, (v) => euro0.format(v));
  $("#d-target").textContent = euro0.format(DASH.target);
  animateNum($("#d-investors"), DASH.investors, (v) => num(v));
  animateNum($("#d-avg"), DASH.raised / DASH.investors, (v) => num(v));
  animateNum($("#d-days"), DASH.daysLeft, (v) => num(v));
  animateNum($("#d-min"), DASH.minTicket, (v) => num(v));
  const daysPill = $("#d-days-pill"); if (daysPill) daysPill.textContent = DASH.daysLeft + " Tagen";

  /* ---------------- capacity ---------------- */
  animateNum($("#d-mw"), DASH.capacityMW * pct, (v) => v.toFixed(2).replace(".", ","));
  animateNum($("#d-th"), DASH.totalTH * pct, (v) => num(v));
  const capbar = $("#d-capbar");
  if (capbar) requestAnimationFrame(() => requestAnimationFrame(() => { capbar.style.width = (pct * 100).toFixed(1) + "%"; }));

  /* ---------------- bar lists ---------------- */
  const barItem = (label, value, pctWidth, warm) =>
    `<div class="bar-item"><div class="bl"><span>${label}</span><b>${value}</b></div>` +
    `<div class="bar-track"><div class="bar-fill${warm ? " warm" : ""}" data-w="${pctWidth}"></div></div></div>`;

  const useEl = $("#d-usefunds");
  if (useEl) useEl.innerHTML = DASH.useOfFunds.map((u) => barItem(u.label, u.pct + " %", u.pct)).join("");

  const tiersEl = $("#d-tiers");
  if (tiersEl) tiersEl.innerHTML = DASH.tiers.map((t) =>
    barItem(t.label, t.count + " / " + t.of, Math.round((t.count / t.of) * 100), true)).join("");

  // animate bar widths
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll(".bar-fill[data-w]").forEach((f) => { f.style.width = f.dataset.w + "%"; });
  }));

  /* ---------------- funding timeline chart ---------------- */
  const chartEl = $("#d-chart");
  if (chartEl) {
    const data = DASH.timeline;
    const W = 600, H = 210, padT = 14, padB = 16;
    const max = Math.max.apply(null, data.values) * 1.08;
    const n = data.values.length;
    const X = (i) => (n === 1 ? W / 2 : (i / (n - 1)) * W);
    const Y = (v) => padT + (1 - v / max) * (H - padT - padB);

    let line = "", area = "M0 " + H + " ";
    data.values.forEach((v, i) => {
      const x = X(i).toFixed(1), y = Y(v).toFixed(1);
      line += (i ? "L" : "M") + x + " " + y + " ";
      area += "L" + x + " " + y + " ";
    });
    area += "L" + W + " " + H + " Z";
    const dots = data.values.map((v, i) =>
      `<circle class="chart-dot" style="animation-delay:${(0.35 + i * 0.18).toFixed(2)}s" cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="4.5" fill="#0b110e" stroke="#18d27e" stroke-width="2.5"/>`).join("");

    chartEl.innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Kapitalverlauf">` +
      `<defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="#18d27e" stop-opacity="0.35"/><stop offset="1" stop-color="#18d27e" stop-opacity="0"/>` +
      `</linearGradient></defs>` +
      `<path d="${area}" fill="url(#areaGrad)"/>` +
      `<path class="chart-line" d="${line}" fill="none" stroke="url(#lg)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` +
      dots + `</svg>`;

    // draw-on-load animation for the line (decorative only)
    const lineEl = chartEl.querySelector(".chart-line");
    if (lineEl && lineEl.getTotalLength && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const len = lineEl.getTotalLength();
      lineEl.style.strokeDasharray = len;
      lineEl.style.strokeDashoffset = len;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        lineEl.style.transition = "stroke-dashoffset 1.4s cubic-bezier(.2,.7,.2,1)";
        lineEl.style.strokeDashoffset = "0";
      }));
    }

    const xEl = $("#d-chartx");
    if (xEl) xEl.innerHTML = data.labels.map((l) => `<span>${l}</span>`).join("");
  }

  /* ---------------- activity feed ---------------- */
  const feedEl = $("#d-feed");
  if (feedEl) {
    const sym = { BTC: "₿", ETH: "Ξ", USDT: "₮", USDC: "$", SEPA: "🏦" };
    feedEl.innerHTML = DASH.feed.map((f, i) => {
      const isSepa = f.method === "SEPA";
      return `<div class="feed-row" style="--i:${i}">` +
        `<div class="feed-badge${isSepa ? " sepa" : ""}">${sym[f.method] || "•"}</div>` +
        `<div class="feed-main"><b>Neue Beteiligung</b><span>${f.method} · ${f.when}</span></div>` +
        `<div class="feed-amt">+ ${euro0.format(f.amount)}</div></div>`;
    }).join("");
  }
})();
