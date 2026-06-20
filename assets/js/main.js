/* =========================================================
   ENPARA — interactions
   Mining constants & seed model live in assets/js/seed.js
   (window.ENPARA_SEED). Edit wallet addresses in CONFIG below.
   ========================================================= */
(function () {
  "use strict";

  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const fmtE = (n) => euro.format(Math.round(n));

  const S = window.ENPARA_SEED;                 // shared seed model
  const M = (S && S.CFG.mining) || { tariffEurKwh: 0.12, poolFee: 0.02, blockRewardBTC: 3.125, blocksPerDay: 144, networkEH: 850, defaultBtcEur: 100000 };
  const wattPerTH = (S && S.CFG.wattPerTH) || 13.5;
  const pricePerTH = (S && S.CFG.pricePerTH) || 25;

  /* ---------------- CONFIG (edit me) ---------------- */
  const CONFIG = {
    // Crypto payment options — REPLACE addresses with your real wallets before launch!
    crypto: {
      BTC:  { network: "Bitcoin-Netzwerk", rate: 100000, decimals: 6, addr: "bc1qENPARA-PLATZHALTER-ECHTE-ADRESSE-EINSETZEN" },
      ETH:  { network: "Ethereum · ERC-20", rate: 3000,   decimals: 4, addr: "0xENPARA0PLATZHALTER0ECHTE0ADRESSE0EINSETZEN" },
      USDT: { network: "Tether · TRC-20",   rate: 0.92,   decimals: 2, addr: "TENPARA-PLATZHALTER-ECHTE-ADRESSE-EINSETZEN" },
      USDC: { network: "USD Coin · ERC-20", rate: 0.92,   decimals: 2, addr: "0xENPARA0PLATZHALTER0USDC0ADRESSE0EINSETZEN" },
    },
  };

  const fmtCrypto = (n, dec) => n.toLocaleString("de-DE", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const fmt1 = (n) => n.toFixed(1).replace(".", ",");

  /* ---------------- Shared mining economics ----------------
     One function so the calculator and the package "impact"
     view always show consistent numbers. */
  function mining(th, btcEur, scnPct) {
    const effBtc = btcEur * (1 + (scnPct || 0) / 100);
    const networkTH = M.networkEH * 1e6;                 // 1 EH/s = 1e6 TH/s
    const dailyBTC = M.blockRewardBTC * M.blocksPerDay * (th / networkTH);
    const grossDay = dailyBTC * effBtc * (1 - M.poolFee);
    const powerKW = th * wattPerTH / 1000;
    const kwhMonth = powerKW * 24 * 30.4;
    const energyDay = powerKW * 24 * M.tariffEurKwh;
    const netDay = grossDay - energyDay;
    return {
      effBtc, powerKW, kwhMonth, dailyBTC,
      btcMonth: dailyBTC * 30.4,
      grossMonth: grossDay * 30.4,
      energyMonth: energyDay * 30.4,
      netMonth: netDay * 30.4,
      netAnnual: netDay * 365,
    };
  }

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

  /* ---------------- Seed progress (hero badge + invest aside) ---------------- */
  if (S) {
    const t = S.totals();
    const pctTxt = Math.round(t.pct * 100);
    const setTxt = (id, v) => { const el = $("#" + id); if (el) el.textContent = v; };
    setTxt("hero-pct", pctTxt);
    setTxt("mp-pct", pctTxt + " %");
    setTxt("mp-raised", S.fmtE(t.raised));
    setTxt("mp-target", S.fmtE(t.target));
    setTxt("mp-free", "Frei: " + S.fmtE(t.free));
    const fill = $("#mp-fill");
    if (fill) requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = (t.pct * 100).toFixed(1) + "%"; }));
    const cd = S.countdown();
    setTxt("mp-deadline", cd.ended ? "Runde beendet" : "noch " + cd.days + " Tage");
  }

  /* ---------------- Package impact view (pricing cards) ---------------- */
  $$(".plan-impact").forEach((box) => {
    const th = parseFloat(box.dataset.th) || 0;
    const r = mining(th, M.defaultBtcEur, 0);
    const grossPos = Math.max(r.grossMonth, 0.0001);
    let energyPct = Math.min(100, (r.energyMonth / grossPos) * 100);
    let netPct = Math.max(0, 100 - energyPct);
    if (r.netMonth < 0) { energyPct = 100; netPct = 0; }
    box.innerHTML =
      '<div class="pi-stats">' +
        '<div><span>Leistung</span><b>' + fmt1(r.powerKW) + ' kW</b></div>' +
        '<div><span>Strom / Monat</span><b>' + Math.round(r.kwhMonth).toLocaleString("de-DE") + ' kWh</b></div>' +
        '<div><span>Energie / Monat</span><b>' + fmtE(r.energyMonth) + '</b></div>' +
      '</div>' +
      '<div class="pi-bar" role="img" aria-label="Aufteilung Brutto-Ertrag in Energie und Netto">' +
        '<i class="pi-energy" style="width:' + energyPct.toFixed(0) + '%"></i>' +
        '<i class="pi-net" style="width:' + netPct.toFixed(0) + '%"></i>' +
      '</div>' +
      '<div class="pi-legend">' +
        '<span><i class="d-energy"></i>Energie & Tarif</span>' +
        '<span><i class="d-net"></i>Netto-Anteil*</span>' +
      '</div>' +
      '<div class="pi-note">* illustrativ bei 100.000 € BTC, Basis-Szenario — interaktiv im <a href="#rechner">Rechner</a>.</div>';
  });

  /* ---------------- ROI / mining calculator ---------------- */
  const calc = $("#calc");
  if (calc) {
    const slider = $("#calc-amount", calc);
    const amountOut = $("#calc-amount-out", calc);
    const btcInput = $("#calc-btc", calc);
    const btcOut = $("#calc-btc-out", calc);
    const btcPresets = $$("#btc-presets button", calc);
    const termSlider = $("#calc-term", calc);
    const termOut = $("#calc-term-out", calc);
    const termYr = $("#calc-term-yr", calc);
    const scnSlider = $("#calc-scn", calc);
    const scnOut = $("#scn-out", calc);
    const scnHint = $("#scn-hint", calc);
    const scnQuick = $$("#scn-quick button", calc);
    const minersEl = $("#r-miners", calc);
    const out = {
      annual: $("#out-annual", calc), roi: $("#out-roi", calc), pay: $("#out-payback", calc),
      hash: $("#r-hash", calc), power: $("#r-power", calc), kwh: $("#r-kwh", calc), btc: $("#r-btc", calc),
      gross: $("#r-gross", calc), energy: $("#r-energy", calc), net: $("#r-net", calc), total: $("#r-total", calc),
    };

    const setNeg = (el, neg) => el.classList.toggle("neg", neg);
    const yearsLabel = (m) => { const y = m / 12; return "Monate (" + (Number.isInteger(y) ? y : fmt1(y)) + " J.)"; };

    const render = () => {
      const amount = parseInt(slider.value, 10);
      const btc = Math.max(1000, parseFloat(btcInput.value) || M.defaultBtcEur);
      const term = parseInt(termSlider.value, 10);
      const scn = parseInt(scnSlider.value, 10);

      const th = amount / pricePerTH;
      const r = mining(th, btc, scn);

      amountOut.textContent = amount.toLocaleString("de-DE");
      btcOut.textContent = Math.round(btc).toLocaleString("de-DE");
      termOut.textContent = term;
      if (termYr) termYr.textContent = yearsLabel(term);
      scnOut.textContent = (scn >= 0 ? "+" : "−") + Math.abs(scn);
      if (scnHint) scnHint.textContent = "Effektiver Kurs: " + fmtE(r.effBtc) + " · stufenlos in 1-%-Schritten bis +900 %.";

      out.hash.textContent = Math.round(th).toLocaleString("de-DE") + " TH/s";
      out.power.textContent = fmt1(r.powerKW) + " kW";
      out.kwh.textContent = Math.round(r.kwhMonth).toLocaleString("de-DE") + " kWh";
      out.btc.textContent = fmtCrypto(r.btcMonth, 4) + " BTC";
      out.gross.textContent = fmtE(r.grossMonth);
      out.energy.textContent = "−" + fmtE(r.energyMonth);
      out.net.textContent = fmtE(r.netMonth); setNeg(out.net, r.netMonth < 0);
      out.total.textContent = fmtE(r.netMonth * term); setNeg(out.total, r.netMonth < 0);
      out.annual.textContent = fmtE(r.netAnnual); setNeg(out.annual, r.netAnnual < 0);

      const roi = (r.netAnnual / amount) * 100;
      out.roi.textContent = (roi >= 0 ? "" : "−") + Math.abs(roi).toFixed(1).replace(".", ",") + " % p.a.";

      if (r.netMonth > 0) {
        const months = Math.ceil(amount / r.netMonth);
        out.pay.textContent = months > 120 ? "Amortisation > 10 Jahre" : "Amortisation ≈ " + months + " Mon.";
      } else {
        out.pay.textContent = "Amortisation: in diesem Szenario nicht";
      }

      // Example miners that fall into this hashrate range
      if (minersEl && S) {
        minersEl.innerHTML = S.CFG.miners.map((mn) => {
          const cnt = th / mn.th;
          return '<span class="me-chip"><b>' + fmt1(cnt) + '×</b> ' + mn.name + ' <i>(' + mn.th + ' TH)</i></span>';
        }).join("");
      }

      // keep preset / quick highlights in sync
      btcPresets.forEach((b) => b.classList.toggle("active", parseInt(b.dataset.btc, 10) === Math.round(btc)));
      scnQuick.forEach((b) => b.classList.toggle("active", parseInt(b.dataset.scn, 10) === scn));
    };

    slider.addEventListener("input", render);
    btcInput.addEventListener("input", render);
    termSlider.addEventListener("input", render);
    scnSlider.addEventListener("input", render);
    btcPresets.forEach((b) => b.addEventListener("click", () => { btcInput.value = b.dataset.btc; render(); }));
    scnQuick.forEach((b) => b.addEventListener("click", () => { scnSlider.value = b.dataset.scn; render(); }));
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

    const pkgByAmount = {};
    if (S) S.CFG.packages.forEach((p) => { pkgByAmount[p.price] = p.th; });
    const thFor = (amt) => pkgByAmount[amt] || Math.max(1, Math.round(amt / pricePerTH));

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
      submitBtn.textContent = method === "crypto" ? "Krypto-Anfrage absenden" : "SEPA-Anfrage absenden";
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

    // Submit — records a pending enquiry the admin can confirm (Dashboard → Admin)
    if (form) form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const data = { name: $("#f-name").value, email: $("#f-email").value, amount, method, asset: method === "crypto" ? asset : "", ref };
      if (S) { try { S.addRequest(data); } catch (_) {} }
      try { console.info("[ENPARA] Anfrage:", data); } catch (_) {}

      const card = $(".invest-card");
      $$(".inv-step", card).forEach((s) => (s.style.display = "none"));
      const ok = $("#form-success");
      const nameEl = $("#success-name");
      if (nameEl) nameEl.textContent = (data.name || "").split(" ")[0] || "danke";
      const msg = $("#success-msg");
      if (msg) {
        msg.textContent = method === "crypto"
          ? `Deine Anfrage über ${thFor(amount).toLocaleString("de-DE")} TH/s ist eingegangen. Für die Zahlung sende ${fmtCrypto(amount / CONFIG.crypto[asset].rate, CONFIG.crypto[asset].decimals)} ${asset} an die angezeigte Adresse (Referenz ${ref}) – wir bestätigen den Eingang.`
          : `Deine Anfrage über ${thFor(amount).toLocaleString("de-DE")} TH/s ist eingegangen. Überweise ${fmtE(amount)} per SEPA mit Verwendungszweck „${ref}" – nach Zahlungseingang bestätigen wir deinen Anteil.`;
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
