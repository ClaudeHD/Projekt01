/* =========================================================
   ENPARA — interactions
   Edit CONFIG below to match your real numbers.
   ========================================================= */
(function () {
  "use strict";

  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const fmtE = (n) => euro.format(Math.round(n));
  const de = (n, dec = 0) => n.toLocaleString("de-DE", { minimumFractionDigits: dec, maximumFractionDigits: dec });

  /* ---------------- CONFIG (edit me) ---------------- */
  const CONFIG = {
    /* --- Hardware & Preisbildung (effiziente Antminer Hydro) --- */
    pricing: {
      asicModel: "Antminer S21 XP Hydro",
      asicTh: 473,            // TH/s je Einheit
      asicWattPerTh: 12,      // ≈ J/TH = W je TH/s (sehr effizienter Hydro-Miner)
      asicCostEur: 9500,      // Beschaffungskosten je Einheit (€) — Marktpreis ~$8,5k–12,6k
      shippingPct: 0.05,      // Versand (% der Hardware)
      customsPct: 0.06,       // Zoll
      importTaxPct: 0.10,     // Einfuhrsteuer / IVA Paraguay
      insurancePct: 0.02,     // Transportversicherung
      markupPct: 0.25,        // Preisaufschlag des Unternehmens (Marge + Puffer)
      volumeDiscounts: [      // Mengenvorteil nach Investitionssumme
        { min: 0,     d: 0.00 },
        { min: 9500,  d: 0.04 },
        { min: 22500, d: 0.08 },
      ],
      minTicketEur: 5000,
    },
    /* --- Mining-/Netzwerk-Annahmen --- */
    network: { hashrateEH: 900, growthPerYear: 0.10 }, // aktuelle Netzwerk-Hashrate + jährliches Wachstum (Default-Regler)
    tariffEurKwh: 0.12,      // All-in Mining-Tarif (Energie + Hosting + Wartung)
    poolFee: 0.02,           // Pool-/Management-Gebühr
    blockRewardBTC: 3.125,   // aktuelle Block-Subsidy
    blocksPerDay: 144,
    defaultBtcEur: 55000,    // Fallback-Kurs, falls Live-API nicht erreichbar
    defaultForecastEur: 100000, // Vorbelegung Prognose-Feld (Basis-Szenario, vom Nutzer änderbar)
    /* --- Währungs-Fallback (1 EUR = …), falls Live-/FX-API nicht erreichbar --- */
    fx: { usdPerEur: 1.08, pygPerEur: 7900 },
    /* --- Krypto-Zahlung — echte Wallets vor Launch eintragen! --- */
    crypto: {
      BTC:  { network: "Bitcoin-Netzwerk", rate: 55000, decimals: 6, addr: "bc1qENPARA-PLATZHALTER-ECHTE-ADRESSE-EINSETZEN" },
      ETH:  { network: "Ethereum · ERC-20", rate: 2400,  decimals: 4, addr: "0xENPARA0PLATZHALTER0ECHTE0ADRESSE0EINSETZEN" },
      USDT: { network: "Tether · TRC-20",   rate: 0.92,  decimals: 2, addr: "TENPARA-PLATZHALTER-ECHTE-ADRESSE-EINSETZEN" },
      USDC: { network: "USD Coin · ERC-20", rate: 0.92,  decimals: 2, addr: "0xENPARA0PLATZHALTER0USDC0ADRESSE0EINSETZEN" },
    },
  };

  const fmtCrypto = (n, dec) => n.toLocaleString("de-DE", { minimumFractionDigits: dec, maximumFractionDigits: dec });

  /* =========================================================
     Preismodell — eine Quelle der Wahrheit
     Hardware → +Logistik (Versand/Zoll/Steuer/Versicherung) → +Marge
     ========================================================= */
  const PR = CONFIG.pricing;
  const hwPerTh = () => PR.asicCostEur / PR.asicTh;
  const logisticsPct = () => PR.shippingPct + PR.customsPct + PR.importTaxPct + PR.insurancePct;
  const landedPerTh = () => hwPerTh() * (1 + logisticsPct());
  const discountFor = (amt) => {
    let d = 0;
    PR.volumeDiscounts.forEach((t) => { if (amt >= t.min) d = t.d; });
    return d;
  };
  const allInPerTh = (amt) => landedPerTh() * (1 + PR.markupPct) * (1 - discountFor(amt));
  const thFor = (amt) => amt / allInPerTh(amt);

  const costBreakdown = (amt) => {
    const d = discountFor(amt);
    const th = thFor(amt);
    const hw = hwPerTh();
    const f = (1 - d) * th; // Skalierungsfaktor inkl. Mengenvorteil
    const items = [
      { key: "hw",      label: "Hardware · " + PR.asicModel, eur: hw * f },
      { key: "ship",    label: "Versand",                    eur: hw * PR.shippingPct * f },
      { key: "customs", label: "Zoll",                       eur: hw * PR.customsPct * f },
      { key: "tax",     label: "Einfuhrsteuer (IVA 10 %)",   eur: hw * PR.importTaxPct * f },
      { key: "ins",     label: "Transportversicherung",      eur: hw * PR.insurancePct * f },
      { key: "markup",  label: "Projekt- & Servicemarge",    eur: landedPerTh() * PR.markupPct * f },
    ];
    return { th, perTh: allInPerTh(amt), discount: d, items };
  };

  /* =========================================================
     Live-Kurse (geteilt zwischen Rechner & Invest-Widget)
     ========================================================= */
  const LIVE = { eur: null, usd: null, pyg: null, ts: null };
  const liveListeners = [];
  const onLive = (fn) => liveListeners.push(fn);

  async function fetchJSON(url, ms = 6500) {
    const ctrl = ("AbortController" in window) ? new AbortController() : null;
    const t = ctrl ? setTimeout(() => ctrl.abort(), ms) : null;
    try {
      const r = await fetch(url, { signal: ctrl ? ctrl.signal : undefined, headers: { accept: "application/json" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } finally { if (t) clearTimeout(t); }
  }

  async function fetchLive() {
    // 1) CoinGecko — liefert EUR/USD/PYG in einem Call
    try {
      const j = await fetchJSON("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur,usd,pyg");
      const b = j && j.bitcoin;
      if (b && b.eur) {
        LIVE.eur = b.eur;
        LIVE.usd = b.usd || b.eur * CONFIG.fx.usdPerEur;
        LIVE.pyg = b.pyg || LIVE.usd * (CONFIG.fx.pygPerEur / CONFIG.fx.usdPerEur);
        LIVE.ts = Date.now();
        return notifyLive();
      }
    } catch (e) { /* weiter zum Fallback */ }
    // 2) Coinbase — EUR + USD (PYG aus FX-Fallback)
    try {
      const [e, u] = await Promise.all([
        fetchJSON("https://api.coinbase.com/v2/prices/BTC-EUR/spot"),
        fetchJSON("https://api.coinbase.com/v2/prices/BTC-USD/spot"),
      ]);
      const eur = parseFloat(e.data.amount), usd = parseFloat(u.data.amount);
      if (eur) {
        LIVE.eur = eur;
        LIVE.usd = usd || eur * CONFIG.fx.usdPerEur;
        LIVE.pyg = eur * CONFIG.fx.pygPerEur;
        LIVE.ts = Date.now();
        return notifyLive();
      }
    } catch (e) { /* aufgeben — Fallback-Default bleibt im Feld */ }
    notifyLive(); // auch im Fehlerfall melden (für „Live n. v.")
  }
  function notifyLive() { liveListeners.forEach((fn) => { try { fn(); } catch (e) {} }); }

  // Währungsverhältnisse (für Nebeninfo $/₲)
  const fxRatios = () => {
    if (LIVE.eur && LIVE.usd) {
      return { usdPerEur: LIVE.usd / LIVE.eur, pygPerEur: (LIVE.pyg ? LIVE.pyg / LIVE.eur : CONFIG.fx.pygPerEur) };
    }
    return { usdPerEur: CONFIG.fx.usdPerEur, pygPerEur: CONFIG.fx.pygPerEur };
  };
  const usdFmt = (n) => "$ " + de(Math.round(n));
  const pygFmt = (n) => {
    if (n >= 1e9) return "₲ " + de(n / 1e9, 2) + " Mrd.";
    if (n >= 1e6) return "₲ " + de(n / 1e6, 1) + " Mio.";
    return "₲ " + de(Math.round(n));
  };

  /* ---------------- Header shadow ---------------- */
  const header = $(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------- Mobile menu ---------------- */
  const toggle = $(".nav-toggle");
  const menu = $(".mobile-menu");
  if (toggle && menu) {
    const close = () => { toggle.classList.remove("open"); menu.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); };
    toggle.addEventListener("click", () => {
      const open = toggle.classList.toggle("open");
      menu.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    $$("a", menu).forEach((a) => a.addEventListener("click", close));
  }

  /* ---------------- Footer year ---------------- */
  const yr = $("#year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------------- Scroll reveal ---------------- */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* ---------------- Animated counters ---------------- */
  const animate = (el) => {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || "0", 10);
    const dur = 1500, start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const val = target * (1 - Math.pow(1 - p, 3));
      el.textContent = dec ? val.toFixed(dec).replace(".", ",") : Math.round(val).toLocaleString("de-DE");
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const counters = $$("[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    const cio = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { animate(e.target); cio.unobserve(e.target); } }),
      { threshold: 0.5 }
    );
    counters.forEach((el) => cio.observe(el));
  } else {
    counters.forEach(animate);
  }

  /* ---------------- FAQ single-open ---------------- */
  const faqItems = $$(".faq-item");
  faqItems.forEach((item) => item.addEventListener("toggle", () => {
    if (item.open) faqItems.forEach((o) => { if (o !== item) o.open = false; });
  }));

  /* ---------------- Pakete & Chips aus Preismodell befüllen ---------------- */
  $$(".plan").forEach((plan) => {
    const trigger = $("[data-amount]", plan);
    if (!trigger) return;
    const amt = parseInt(trigger.dataset.amount, 10);
    const th = Math.round(thFor(amt));
    trigger.dataset.th = th;
    const hrEl = $("[data-pkg-hr]", plan);
    if (hrEl) hrEl.textContent = de(th) + " TH/s · " + de(allInPerTh(amt), 2) + " € / TH/s";
    const thEl = $("[data-pkg-th]", plan);
    if (thEl) thEl.textContent = de(th) + " TH/s";
  });
  $$(".amount-chips .chip").forEach((chip) => {
    const amt = parseInt(chip.dataset.amount, 10);
    const th = Math.round(thFor(amt));
    chip.dataset.th = th;
    const b = $("b", chip);
    if (b) b.textContent = de(th) + " TH/s";
  });

  /* ---------------- Mining-Rechner (neu) ---------------- */
  const calc = $("#calc");
  if (calc) {
    const el = {
      amount: $("#calc-amount", calc), amountOut: $("#calc-amount-out", calc), thHint: $("#calc-th-out", calc),
      term: $("#calc-term", calc), termOut: $("#calc-term-out", calc),
      btc: $("#calc-btc", calc), btcLive: $("#btc-live", calc), fx: $("#btc-fx", calc),
      net: $("#calc-net", calc), netOut: $("#calc-net-out", calc), netHint: $("#net-hint", calc),
      total: $("#out-total"), termLabel: $("#out-term-label"), roi: $("#out-roi"), pay: $("#out-payback"),
      hash: $("#r-hash"), power: $("#r-power"), btcM: $("#r-btc"), gross: $("#r-gross"), energy: $("#r-energy"), netM: $("#r-net"),
      costAmount: $("#cost-amount"), costTh: $("#cost-th"), costPerTh: $("#cost-perth"),
      costMeter: $("#cost-meter"), costLegend: $("#cost-legend"),
    };
    const setNeg = (node, neg) => node && node.classList.toggle("neg", neg);

    const returnsOf = (amount, months, btcEur, growth) => {
      const th = thFor(amount);
      const powerKW = th * PR.asicWattPerTh / 1000;
      const energyDay = powerKW * 24 * CONFIG.tariffEurKwh;
      const net0TH = CONFIG.network.hashrateEH * 1e6;
      let totalNet = 0, totalGross = 0, totalBtc = 0, cum = 0, payback = null;
      for (let m = 0; m < months; m++) {
        const networkTH = net0TH * Math.pow(1 + growth, m / 12);
        const dailyBTC = CONFIG.blockRewardBTC * CONFIG.blocksPerDay * (th / networkTH);
        const grossDay = dailyBTC * btcEur * (1 - CONFIG.poolFee);
        const netDay = grossDay - energyDay;
        totalGross += grossDay * 30.4; totalNet += netDay * 30.4; totalBtc += dailyBTC * 30.4;
        cum += netDay * 30.4;
        if (payback === null && cum >= amount) payback = m + 1;
      }
      return {
        th, powerKW, energyMonth: energyDay * 30.4,
        avgGross: totalGross / months, avgNet: totalNet / months, avgBtc: totalBtc / months,
        totalNet, payback, roiPa: (totalNet / months * 12) / amount * 100,
      };
    };

    const COST_LABELS = {
      hw: "hw", ship: "ship", customs: "customs", tax: "tax", ins: "ins", markup: "markup",
    };

    const renderCost = (amount) => {
      const cb = costBreakdown(amount);
      if (el.costAmount) el.costAmount.textContent = fmtE(amount);
      if (el.costTh) el.costTh.textContent = de(Math.round(cb.th));
      if (el.costPerTh) el.costPerTh.textContent = de(cb.perTh, 2) + " €/TH/s"
        + (cb.discount > 0 ? "  ·  −" + Math.round(cb.discount * 100) + " % Mengenvorteil" : "");
      if (el.costMeter) cb.items.forEach((it) => {
        const seg = $(".s-" + it.key, el.costMeter);
        if (seg) seg.style.width = (it.eur / amount * 100).toFixed(2) + "%";
      });
      if (el.costLegend) el.costLegend.innerHTML = cb.items.map((it) =>
        `<div class="cost-li"><span class="dot ${COST_LABELS[it.key]}"></span>` +
        `<span class="lab">${it.label}</span><b>${fmtE(it.eur)}</b>` +
        `<span class="pct">${Math.round(it.eur / amount * 100)} %</span></div>`).join("");
    };

    const render = () => {
      const amount = parseInt(el.amount.value, 10);
      const months = parseInt(el.term.value, 10);
      const btc = Math.max(1000, parseFloat(el.btc.value) || CONFIG.defaultBtcEur);
      const growth = parseInt(el.net.value, 10) / 100;
      const r = returnsOf(amount, months, btc, growth);

      el.amountOut.textContent = de(amount);
      if (el.thHint) el.thHint.textContent = "≈ " + de(Math.round(r.th)) + " TH/s";
      el.termOut.textContent = months;
      el.netOut.textContent = (growth > 0 ? "+" : "") + Math.round(growth * 100);
      if (el.netHint) el.netHint.textContent = growth > 0 ? "Schwierigkeit steigt" : growth < 0 ? "Schwierigkeit sinkt" : "konstant";

      // FX-Nebeninfo zum Prognose-Kurs
      const fx = fxRatios();
      if (el.fx) el.fx.textContent = "≈ " + usdFmt(btc * fx.usdPerEur) + "  ·  " + pygFmt(btc * fx.pygPerEur);

      if (el.termLabel) el.termLabel.textContent = months + " Monate";
      el.total.textContent = fmtE(r.totalNet); setNeg(el.total, r.totalNet < 0);
      el.roi.textContent = (r.roiPa >= 0 ? "" : "−") + Math.abs(r.roiPa).toFixed(1).replace(".", ",") + " % p.a.";
      el.roi.classList.toggle("neg-badge", r.roiPa < 0);

      if (r.avgNet > 0 && r.payback) el.pay.textContent = "Amortisation ≈ " + r.payback + " Mon.";
      else if (r.avgNet > 0) el.pay.textContent = "Amortisation > " + months + " Mon.";
      else el.pay.textContent = "Amortisation: in diesem Szenario nicht";

      el.hash.textContent = de(Math.round(r.th)) + " TH/s";
      el.power.textContent = de(r.powerKW, 1) + " kW";
      el.btcM.textContent = fmtCrypto(r.avgBtc, 4) + " BTC";
      el.gross.textContent = fmtE(r.avgGross);
      el.energy.textContent = "−" + fmtE(r.energyMonth);
      el.netM.textContent = fmtE(r.avgNet); setNeg(el.netM, r.avgNet < 0);

      renderCost(amount);
    };

    // Live-Kurs als Referenz anzeigen (überschreibt das Prognose-Feld nicht)
    const applyLive = () => {
      if (LIVE.eur) {
        el.btcLive.classList.add("on");
        el.btcLive.innerHTML = '<span class="pulse"></span> Live · ' + euro.format(Math.round(LIVE.eur));
        el.btcLive.title = "Aktualisiert: " + new Date(LIVE.ts).toLocaleTimeString("de-DE");
      } else {
        el.btcLive.classList.remove("on");
        el.btcLive.textContent = "Live-Kurs n. v.";
      }
      render();
    };
    onLive(applyLive);

    el.amount.addEventListener("input", render);
    el.term.addEventListener("input", render);
    el.net.addEventListener("input", render);
    el.btc.addEventListener("input", () => {
      $$(".btc-presets button", calc).forEach((x) => x.classList.remove("active"));
      render();
    });
    $$(".btc-presets button", calc).forEach((b) => b.addEventListener("click", () => {
      if (b.dataset.btc === "live") { if (LIVE.eur) el.btc.value = Math.round(LIVE.eur); }
      else { el.btc.value = parseInt(b.dataset.btc, 10); }
      $$(".btc-presets button", calc).forEach((x) => x.classList.toggle("active", x === b));
      render();
    }));

    // Prognose-Standard (Basis-Szenario) vorbelegen
    el.btc.value = CONFIG.defaultForecastEur;
    $$(".btc-presets button", calc).forEach((x) => x.classList.toggle("active", parseInt(x.dataset.btc, 10) === CONFIG.defaultForecastEur));

    // „Diesen Betrag investieren" → Invest-Bereich vorbefüllen
    const investBtn = $("#calc-invest", calc);
    if (investBtn) investBtn.addEventListener("click", () => {
      const amt = parseInt(el.amount.value, 10);
      if (window.__enparaSetInvest) window.__enparaSetInvest(amt);
    });

    render();
  }

  /* ---------------- Invest widget (Crypto + SEPA) ---------------- */
  const investWrap = $(".invest-wrap");
  if (investWrap) {
    const amountInput = $("#inv-amount");
    const chips = $$(".amount-chips .chip");
    const thOut = $("#inv-th");
    const payTabs = $$(".pay-tab");
    const panels = $$(".pay-panel");
    const assets = $$(".asset");
    const cp = {
      amount: $("#cp-amount"), net: $("#cp-net"), addr: $("#cp-addr"),
      ref: $("#cp-ref"), qr: $("#cp-qr"), copy: $("#cp-copy"),
    };
    const sepaAmount = $("#sepa-amount");
    const sepaRef = $("#sepa-ref");
    const fields = { method: $("#f-method"), asset: $("#f-asset"), amount: $("#f-amount") };
    const submitBtn = $("#inv-submit");
    const form = $("#invest-form");

    let amount = 5000, method = "crypto", asset = "BTC";
    const ref = "ENP-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    if (cp.ref) cp.ref.textContent = ref;
    if (sepaRef) sepaRef.textContent = ref;

    const thForInvest = (amt) => Math.max(1, Math.round(thFor(amt)));
    const copyDefault = cp.copy ? cp.copy.innerHTML : "";

    const renderCrypto = () => {
      const a = CONFIG.crypto[asset];
      cp.amount.textContent = fmtCrypto(amount / a.rate, a.decimals) + " " + asset;
      cp.net.textContent = "· " + a.network;
      cp.addr.textContent = a.addr;
      fields.asset.value = asset;
      cp.qr.style.display = "";
      cp.qr.src = "https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&qzone=1&data=" + encodeURIComponent(a.addr);
      if (cp.copy) { cp.copy.classList.remove("copied"); cp.copy.innerHTML = copyDefault; }
    };

    const render = () => {
      thOut.textContent = de(thForInvest(amount));
      fields.amount.value = amount;
      sepaAmount.textContent = fmtE(amount);
      chips.forEach((c) => c.classList.toggle("active", parseInt(c.dataset.amount, 10) === amount));
      renderCrypto();
    };

    // Live-Kurs in Krypto-Betrag (BTC) übernehmen
    onLive(() => { if (LIVE.eur) { CONFIG.crypto.BTC.rate = LIVE.eur; if (asset === "BTC") renderCrypto(); } });

    chips.forEach((c) => c.addEventListener("click", () => {
      amount = parseInt(c.dataset.amount, 10);
      amountInput.value = amount;
      render();
    }));
    amountInput.addEventListener("input", () => {
      const v = parseInt(amountInput.value, 10);
      amount = isNaN(v) ? 0 : v;
      render();
    });
    amountInput.addEventListener("blur", () => {
      if (amount < PR.minTicketEur) { amount = PR.minTicketEur; amountInput.value = PR.minTicketEur; render(); }
    });

    payTabs.forEach((t) => t.addEventListener("click", () => {
      method = t.dataset.method;
      payTabs.forEach((x) => x.classList.toggle("active", x === t));
      panels.forEach((p) => { p.hidden = p.dataset.panel !== method; });
      fields.method.value = method;
      submitBtn.textContent = method === "crypto" ? "Krypto-Investition melden" : "SEPA-Investition melden";
    }));

    assets.forEach((x) => x.addEventListener("click", () => {
      asset = x.dataset.asset;
      assets.forEach((y) => y.classList.toggle("active", y === x));
      renderCrypto();
    }));

    if (cp.copy) cp.copy.addEventListener("click", () => {
      const text = CONFIG.crypto[asset].addr;
      const done = () => { cp.copy.classList.add("copied"); cp.copy.innerHTML = "✓ Kopiert!"; setTimeout(() => { cp.copy.classList.remove("copied"); cp.copy.innerHTML = copyDefault; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
      } else { fallbackCopy(text, done); }
    });
    function fallbackCopy(text, cb) {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); cb(); } catch (e) {}
      document.body.removeChild(ta);
    }

    cp.qr.addEventListener("error", () => { cp.qr.style.display = "none"; });

    // Allow pricing cards / external buttons to preset the amount
    window.__enparaSetInvest = (amt) => {
      amount = amt; amountInput.value = amt; render();
      const target = $("#invest");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // Submit (front-end demo — wire to backend/CRM, see README)
    if (form) form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const data = { name: $("#f-name").value, email: $("#f-email").value, betrag: amount, methode: method, asset: method === "crypto" ? asset : "—", ref };
      try { console.info("[ENPARA] Investitionsanfrage:", data); } catch (_) {}

      const card = $(".invest-card");
      $$(".inv-step", card).forEach((s) => (s.style.display = "none"));
      const ok = $("#form-success");
      const nameEl = $("#success-name");
      if (nameEl) nameEl.textContent = (data.name || "").split(" ")[0] || "danke";
      const msg = $("#success-msg");
      if (msg) {
        msg.textContent = method === "crypto"
          ? `Bitte sende ${fmtCrypto(amount / CONFIG.crypto[asset].rate, CONFIG.crypto[asset].decimals)} ${asset} an die angezeigte Adresse (Referenz ${ref}). Sobald die Zahlung eingegangen ist, bestätigen wir deinen Anteil von ${de(thForInvest(amount))} TH/s.`
          : `Bitte überweise ${fmtE(amount)} per SEPA mit Verwendungszweck „${ref}". Nach Zahlungseingang bestätigen wir deinen Anteil von ${de(thForInvest(amount))} TH/s.`;
      }
      if (ok) ok.classList.add("show");
    });

    render();
  }

  /* ---------------- Pricing buttons → preset invest amount + scroll ---------------- */
  $$("[data-plan]").forEach((btn) => btn.addEventListener("click", (e) => {
    e.preventDefault();
    const amt = parseInt(btn.dataset.amount, 10);
    if (amt && window.__enparaSetInvest) window.__enparaSetInvest(amt);
    setTimeout(() => { const n = $("#f-name"); if (n) n.focus(); }, 600);
  }));

  /* ---------------- Image fallback ---------------- */
  $$("img[data-fallback]").forEach((img) => {
    const fail = () => img.classList.add("img-failed");
    img.addEventListener("error", fail);
    if (img.complete && img.naturalWidth === 0) fail();
  });

  /* ---------------- Live-Kurse laden ---------------- */
  fetchLive();
})();
