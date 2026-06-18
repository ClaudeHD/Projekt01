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

  /* ---------------- CONFIG (edit me) ---------------- */
  const CONFIG = {
    pricePerTH: 25,          // € per TH/s (entry rate; packages give volume discounts)
    wattPerTH: 13.5,         // efficiency of hydro Antminer class (~13–16 J/TH)
    tariffEurKwh: 0.12,      // all-in customer mining tariff (energy + hosting + maintenance)
    poolFee: 0.02,           // pool / management fee
    blockRewardBTC: 3.125,   // current block subsidy
    blocksPerDay: 144,
    defaultBtcEur: 80000,
    scenarios: {
      conservative: { factor: 0.90, networkEH: 780, label: "Vorsichtige Annahmen" },
      base:         { factor: 1.00, networkEH: 700, label: "Basis-Annahmen" },
      optimistic:   { factor: 1.30, networkEH: 600, label: "Optimistische Annahmen" },
    },
    // Crypto payment options — REPLACE addresses with your real wallets before launch!
    crypto: {
      BTC:  { network: "Bitcoin-Netzwerk", rate: 80000, decimals: 6, addr: "bc1qENPARA-PLATZHALTER-ECHTE-ADRESSE-EINSETZEN" },
      ETH:  { network: "Ethereum · ERC-20", rate: 3000,  decimals: 4, addr: "0xENPARA0PLATZHALTER0ECHTE0ADRESSE0EINSETZEN" },
      USDT: { network: "Tether · TRC-20",   rate: 0.92,  decimals: 2, addr: "TENPARA-PLATZHALTER-ECHTE-ADRESSE-EINSETZEN" },
      USDC: { network: "USD Coin · ERC-20", rate: 0.92,  decimals: 2, addr: "0xENPARA0PLATZHALTER0USDC0ADRESSE0EINSETZEN" },
    },
  };

  const fmtCrypto = (n, dec) => n.toLocaleString("de-DE", { minimumFractionDigits: dec, maximumFractionDigits: dec });

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

  /* ---------------- ROI / mining calculator ---------------- */
  const calc = $("#calc");
  if (calc) {
    const slider = $("#calc-amount", calc);
    const amountOut = $("#calc-amount-out", calc);
    const btcInput = $("#calc-btc", calc);
    const termSel = $("#calc-term", calc);
    const scnBtns = $$(".scenario button", calc);
    const hint = $("#scn-hint", calc);
    const out = {
      annual: $("#out-annual", calc), roi: $("#out-roi", calc), pay: $("#out-payback", calc),
      hash: $("#r-hash", calc), power: $("#r-power", calc), btc: $("#r-btc", calc),
      gross: $("#r-gross", calc), energy: $("#r-energy", calc), net: $("#r-net", calc), total: $("#r-total", calc),
    };
    let scn = "base";

    const setNeg = (el, neg) => el.classList.toggle("neg", neg);

    const render = () => {
      const amount = parseInt(slider.value, 10);
      const btc = Math.max(1000, parseFloat(btcInput.value) || CONFIG.defaultBtcEur);
      const term = parseInt(termSel.value, 10);
      const s = CONFIG.scenarios[scn];

      const th = amount / CONFIG.pricePerTH;
      const effBtc = btc * s.factor;
      const networkTH = s.networkEH * 1e6;            // 1 EH/s = 1e6 TH/s
      const dailyBTC = CONFIG.blockRewardBTC * CONFIG.blocksPerDay * (th / networkTH);
      const grossDay = dailyBTC * effBtc * (1 - CONFIG.poolFee);
      const powerKW = th * CONFIG.wattPerTH / 1000;
      const energyDay = powerKW * 24 * CONFIG.tariffEurKwh;
      const netDay = grossDay - energyDay;
      const monthlyNet = netDay * 30.4;
      const annualNet = netDay * 365;

      amountOut.textContent = amount.toLocaleString("de-DE");
      hint.textContent = s.label;

      out.hash.textContent = Math.round(th).toLocaleString("de-DE") + " TH/s";
      out.power.textContent = powerKW.toFixed(1).replace(".", ",") + " kW";
      out.btc.textContent = fmtCrypto(dailyBTC * 30.4, 4) + " BTC";
      out.gross.textContent = fmtE(grossDay * 30.4);
      out.energy.textContent = "−" + fmtE(energyDay * 30.4);
      out.net.textContent = fmtE(monthlyNet); setNeg(out.net, monthlyNet < 0);
      out.total.textContent = fmtE(monthlyNet * term); setNeg(out.total, monthlyNet < 0);
      out.annual.textContent = fmtE(annualNet); setNeg(out.annual, annualNet < 0);

      const roi = (annualNet / amount) * 100;
      out.roi.textContent = (roi >= 0 ? "" : "−") + Math.abs(roi).toFixed(1).replace(".", ",") + " % p.a.";

      if (monthlyNet > 0) {
        const months = Math.ceil(amount / monthlyNet);
        out.pay.textContent = months > 120
          ? "Amortisation > 10 Jahre"
          : "Amortisation ≈ " + months + " Mon.";
      } else {
        out.pay.textContent = "Amortisation: in diesem Szenario nicht";
      }
    };

    slider.addEventListener("input", render);
    btcInput.addEventListener("input", render);
    termSel.addEventListener("change", render);
    scnBtns.forEach((b) => b.addEventListener("click", () => {
      scnBtns.forEach((o) => o.classList.remove("active"));
      b.classList.add("active");
      scn = b.dataset.scenario;
      render();
    }));
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

    const thFor = (amt) => {
      if (amt === 5000) return 200;
      if (amt === 9500) return 400;
      if (amt === 22500) return 1000;
      return Math.max(1, Math.round(amt / CONFIG.pricePerTH));
    };

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
      thOut.textContent = thFor(amount).toLocaleString("de-DE");
      fields.amount.value = amount;
      sepaAmount.textContent = fmtE(amount);
      chips.forEach((c) => c.classList.toggle("active", parseInt(c.dataset.amount, 10) === amount));
      renderCrypto();
    };

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
      if (amount < 5000) { amount = 5000; amountInput.value = 5000; render(); }
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
    window.__enparaSetInvest = (amt) => { amount = amt; amountInput.value = amt; render(); };

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
          ? `Bitte sende ${fmtCrypto(amount / CONFIG.crypto[asset].rate, CONFIG.crypto[asset].decimals)} ${asset} an die angezeigte Adresse (Referenz ${ref}). Sobald die Zahlung eingegangen ist, bestätigen wir deinen Anteil von ${thFor(amount).toLocaleString("de-DE")} TH/s.`
          : `Bitte überweise ${fmtE(amount)} per SEPA mit Verwendungszweck „${ref}". Nach Zahlungseingang bestätigen wir deinen Anteil von ${thFor(amount).toLocaleString("de-DE")} TH/s.`;
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
    const target = $("#invest");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => { const n = $("#f-name"); if (n) n.focus(); }, 600);
  }));

  /* ---------------- Image fallback ---------------- */
  $$("img[data-fallback]").forEach((img) => {
    const fail = () => img.classList.add("img-failed");
    img.addEventListener("error", fail);
    if (img.complete && img.naturalWidth === 0) fail();
  });
})();
