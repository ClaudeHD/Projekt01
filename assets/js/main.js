/* =========================================================
   ENPARA — interactions (v2)
   Edit CONFIG below to match your real numbers & wallets.
   ========================================================= */
(function () {
  "use strict";

  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const fmtE = (n) => euro.format(Math.round(n));
  const fmtInt = (n) => Math.round(n).toLocaleString("de-DE");
  const fmtCrypto = (n, dec) => n.toLocaleString("de-DE", { minimumFractionDigits: dec, maximumFractionDigits: dec });

  /* ---------------- CONFIG (edit me) ---------------- */
  const CONFIG = {
    /* Paket-Preiskalkulation: effizienter Antminer + Logistik + 25 % Aufschlag */
    pricing: {
      asicCostPerTH: 13.90,   // € Hardware je TH/s (hydro-effizient, ~13,5 W/TH)
      logisticsPct: 0.15,     // Versand + Zoll + Steuer + Transportversicherung (auf Hardware)
      markup: 0.25,           // Unternehmens-Aufschlag (Marge & Puffer) auf Landed-Cost
      // → Basisrate ≈ 13,90 × 1,15 × 1,25 ≈ 20,00 €/TH (Starter)
      tiers: [                // Verkaufspreis je TH/s nach Volumen
        { minAmount: 22500, rate: 18.00 },  // Whale  (−10 %)
        { minAmount: 9500,  rate: 19.00 },  // Pro    (−5 %)
        { minAmount: 0,     rate: 20.00 },  // Starter
      ],
      packages: { 5000: 250, 9500: 500, 22500: 1250 },  // exakte TH der benannten Pakete
    },

    /* Mining-Modell */
    mining: {
      wattPerTH: 13.5,        // Effizienz hydro Antminer
      poolFee: 0.02,          // Pool-/Management-Gebühr
      blockRewardBTC: 3.125,  // aktueller Block-Subsidy (bis Halving 2028)
      blocksPerDay: 144,
      networkEH: 800,         // angenommene Netzwerk-Hashrate (EH/s) – Startwert
    },

    /* Fallback-Kurse, falls Live-Abruf fehlschlägt */
    fx: {
      btcEur: 90000,
      ethEur: 3000,
      usdPerEur: 1.08,        // 1 € ≈ 1,08 $
      pygPerEur: 8000,        // 1 € ≈ 8.000 ₲ (Guaraní)
    },

    /* Krypto-Wallets — ECHTE Adressen vor dem Launch eintragen!
       Sobald eine echte Adresse hier steht, erscheint automatisch der passende QR-Code. */
    crypto: {
      BTC:  { network: "Bitcoin-Netzwerk", uri: "bitcoin",  decimals: 6, addr: "bc1qENPARA-PLATZHALTER-ECHTE-ADRESSE-EINSETZEN" },
      ETH:  { network: "Ethereum · ERC-20", uri: "ethereum", decimals: 4, addr: "0xENPARA0PLATZHALTER0ECHTE0ADRESSE0EINSETZEN" },
      USDT: { network: "Tether · TRC-20",   uri: "",         decimals: 2, addr: "TENPARA-PLATZHALTER-ECHTE-ADRESSE-EINSETZEN" },
      USDC: { network: "USD Coin · ERC-20", uri: "",         decimals: 2, addr: "0xENPARA0PLATZHALTER0USDC0ADRESSE0EINSETZEN" },
    },
  };

  /* live FX state (updated from API, falls back to CONFIG.fx) */
  const FX = Object.assign({}, CONFIG.fx);

  /* ---------- pricing helpers ---------- */
  const rateForAmount = (amt) => {
    for (const t of CONFIG.pricing.tiers) if (amt >= t.minAmount) return t.rate;
    return CONFIG.pricing.tiers[CONFIG.pricing.tiers.length - 1].rate;
  };
  const thForAmount = (amt) => {
    if (CONFIG.pricing.packages[amt]) return CONFIG.pricing.packages[amt];
    return Math.max(1, Math.round(amt / rateForAmount(amt)));
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

  /* ---------------- Progress bars (hero + invest) ---------------- */
  ["#hero-fill", "#mp-fill"].forEach((sel) => {
    const el = $(sel);
    if (!el) return;
    const w = el.style.width || "0";
    el.style.width = "0";
    requestAnimationFrame(() => requestAnimationFrame(() => { el.style.width = w; }));
  });

  /* ---------------- Capacity cells (80 % seed / 20 % own) ---------------- */
  const capCells = $("#cap-cells");
  if (capCells) {
    const TOTAL = 50, seed = Math.round(TOTAL * 0.8);
    let html = "";
    for (let i = 0; i < TOTAL; i++) html += `<span class="cap-cell ${i < seed ? "seed" : "own"}"></span>`;
    capCells.innerHTML = html;
  }

  /* ---------------- Lightbox (Mining-Halle) ---------------- */
  const lb = $("#lightbox");
  if (lb) {
    const items = $$("[data-lightbox]").map((b) => ({ img: b.dataset.img, cap: b.dataset.cap || "" }));
    const lbImg = $("#lb-img"), lbCap = $("#lb-cap");
    let idx = 0;
    const show = (i) => {
      idx = (i + items.length) % items.length;
      lbImg.src = items[idx].img;
      lbCap.textContent = items[idx].cap;
    };
    const open = (i) => { show(i); lb.classList.add("open"); lb.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; };
    const close = () => { lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; };
    $$("[data-lightbox]").forEach((b, i) => b.addEventListener("click", () => open(i)));
    $("#lb-close").addEventListener("click", close);
    $("#lb-prev").addEventListener("click", () => show(idx - 1));
    $("#lb-next").addEventListener("click", () => show(idx + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  /* ---------------- Live Bitcoin price + FX ---------------- */
  const priceUI = {
    pill: $("#px-live"), eur: $("#px-eur"), usd: $("#px-usd"), pyg: $("#px-pyg"), note: $("#px-note"),
  };
  let forecastTouched = false;
  const renderPriceBox = (live) => {
    if (!priceUI.eur) return;
    priceUI.eur.textContent = fmtInt(FX.btcEur);
    priceUI.usd.textContent = "$ " + fmtInt(FX.btcEur * FX.usdPerEur);
    priceUI.pyg.textContent = "₲ " + fmtInt(FX.btcEur * FX.pygPerEur);
    if (priceUI.pill) priceUI.pill.classList.toggle("off", !live);
    if (priceUI.note) priceUI.note.textContent = live ? "" : "· Offline-Schätzwert";
  };

  async function fetchPrices() {
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=eur,usd,pyg";
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 7000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) throw new Error("http " + res.status);
      const d = await res.json();
      const b = d.bitcoin || {};
      if (b.eur) FX.btcEur = b.eur;
      if (b.usd && b.eur) FX.usdPerEur = b.usd / b.eur;
      if (b.pyg && b.eur) FX.pygPerEur = b.pyg / b.eur;
      if (d.ethereum && d.ethereum.eur) FX.ethEur = d.ethereum.eur;
      renderPriceBox(true);
      // Prognose-Feld auf Live-Kurs setzen, solange der Nutzer es nicht selbst verändert hat
      const btcInput = $("#calc-btc");
      if (btcInput && !forecastTouched) btcInput.value = Math.round(FX.btcEur / 1000) * 1000;
      if (typeof window.__enparaCalc === "function") window.__enparaCalc();
      if (typeof window.__enparaInvest === "function") window.__enparaInvest();
    } catch (e) {
      renderPriceBox(false);
    }
  }
  renderPriceBox(false);
  fetchPrices();

  /* ---------------- ROI / mining calculator (v2, monatsgenau) ---------------- */
  const calc = $("#calc");
  if (calc) {
    const slider = $("#calc-amount", calc);
    const amountOut = $("#calc-amount-out", calc);
    const amountFx = $("#calc-amount-fx", calc);
    const thSub = $("#calc-th-sub", calc);
    const btcInput = $("#calc-btc", calc);
    const termSel = $("#calc-term", calc);
    const termOut = $("#calc-term-out", calc);
    const growth = $("#calc-growth", calc);
    const growthOut = $("#calc-growth-out", calc);
    const tariff = $("#calc-tariff", calc);
    const tariffOut = $("#calc-tariff-out", calc);
    const cb = { hwBar: $("#cb-hw-bar"), logBar: $("#cb-log-bar"), marBar: $("#cb-mar-bar"), hwV: $("#cb-hw-v"), logV: $("#cb-log-v"), marV: $("#cb-mar-v") };
    const out = {
      total: $("#out-total"), totalFx: $("#out-total-fx"), roi: $("#out-roi"), pay: $("#out-payback"),
      hash: $("#r-hash"), power: $("#r-power"), btc: $("#r-btc"),
      gross: $("#r-gross"), energy: $("#r-energy"), net: $("#r-net"), total2: $("#r-total"),
    };
    const setNeg = (el, neg) => el && el.classList.toggle("neg", neg);

    const simulate = (amount, th, forecast, term, growthPa, tariffEur) => {
      const m = CONFIG.mining;
      const baseNetTH = m.networkEH * 1e6;            // EH/s → TH/s
      const powerKW = th * m.wattPerTH / 1000;
      const energyMonth = powerKW * 24 * 30.4 * tariffEur;
      const start = FX.btcEur > 0 ? FX.btcEur : forecast;
      let netTotal = 0, btcTotal = 0, grossTotal = 0, cum = 0, payback = null;
      for (let i = 1; i <= term; i++) {
        const price = start + (forecast - start) * (i / term);
        const diff = baseNetTH * Math.pow(1 + growthPa, i / 12);
        const btcMonth = m.blockRewardBTC * m.blocksPerDay * (th / diff) * 30.4;
        const grossMonth = btcMonth * price * (1 - m.poolFee);
        const netMonth = grossMonth - energyMonth;
        netTotal += netMonth; btcTotal += btcMonth; grossTotal += grossMonth; cum += netMonth;
        if (payback === null && cum >= amount) payback = i;
      }
      return {
        powerKW, energyMonth, netTotal,
        avgBtc: btcTotal / term, avgGross: grossTotal / term, avgNet: netTotal / term,
        roiPa: (netTotal / term * 12) / amount * 100, payback,
      };
    };

    const render = () => {
      const amount = parseInt(slider.value, 10);
      const forecast = Math.max(1000, parseFloat(btcInput.value) || FX.btcEur);
      const term = parseInt(termSel.value, 10);
      const growthPa = parseInt(growth.value, 10) / 100;
      const tariffEur = parseFloat(tariff.value);
      const th = thForAmount(amount);

      amountOut.textContent = amount.toLocaleString("de-DE");
      if (amountFx) amountFx.textContent = "≈ $ " + fmtInt(amount * FX.usdPerEur) + " · ₲ " + fmtInt(amount * FX.pygPerEur);
      if (thSub) thSub.textContent = fmtInt(th);
      termOut.textContent = term;
      growthOut.textContent = (growthPa * 100).toFixed(0);
      tariffOut.textContent = tariffEur.toFixed(3).replace(".", ",").replace(/0$/, "");

      // Kosten-Aufschlüsselung
      const hwTH = CONFIG.pricing.asicCostPerTH;
      const logTH = hwTH * CONFIG.pricing.logisticsPct;
      const landed = hwTH + logTH;
      const hw = th * hwTH, log = th * logTH;
      let mar = amount - th * landed; if (mar < 0) mar = 0;
      const sum = hw + log + mar || 1;
      if (cb.hwBar) cb.hwBar.style.width = (hw / sum * 100) + "%";
      if (cb.logBar) cb.logBar.style.width = (log / sum * 100) + "%";
      if (cb.marBar) cb.marBar.style.width = (mar / sum * 100) + "%";
      if (cb.hwV) cb.hwV.textContent = fmtE(hw);
      if (cb.logV) cb.logV.textContent = fmtE(log);
      if (cb.marV) cb.marV.textContent = fmtE(mar);

      const r = simulate(amount, th, forecast, term, growthPa, tariffEur);

      out.hash.textContent = fmtInt(th) + " TH/s";
      out.power.textContent = r.powerKW.toFixed(1).replace(".", ",") + " kW";
      out.btc.textContent = fmtCrypto(r.avgBtc, 4) + " BTC";
      out.gross.textContent = fmtE(r.avgGross);
      out.energy.textContent = "−" + fmtE(r.energyMonth);
      out.net.textContent = fmtE(r.avgNet); setNeg(out.net, r.avgNet < 0);
      out.total2.textContent = fmtE(r.netTotal); setNeg(out.total2, r.netTotal < 0);
      out.total.textContent = fmtE(r.netTotal); setNeg(out.total, r.netTotal < 0);
      if (out.totalFx) out.totalFx.textContent = "≈ $ " + fmtInt(r.netTotal * FX.usdPerEur) + " · ₲ " + fmtInt(r.netTotal * FX.pygPerEur);

      out.roi.textContent = (r.roiPa >= 0 ? "" : "−") + Math.abs(r.roiPa).toFixed(1).replace(".", ",") + " % p.a.";
      out.roi.classList.toggle("neg", r.roiPa < 0);
      if (r.payback) {
        out.pay.textContent = r.payback > term ? "Amortisation > Laufzeit" : "Amortisation ≈ " + r.payback + " Mon.";
      } else {
        out.pay.textContent = "Amortisation: außerhalb der Laufzeit";
      }
    };

    slider.addEventListener("input", render);
    btcInput.addEventListener("input", () => { forecastTouched = true; render(); });
    termSel.addEventListener("input", render);
    growth.addEventListener("input", render);
    tariff.addEventListener("input", render);
    window.__enparaCalc = render;
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
      ref: $("#cp-ref"), qr: $("#cp-qr"), copy: $("#cp-copy"), warn: $("#cp-warn"),
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

    const cryptoAmount = (asset, eur) => {
      if (asset === "BTC") return eur / FX.btcEur;
      if (asset === "ETH") return eur / FX.ethEur;
      return eur * FX.usdPerEur; // USDT / USDC ≈ USD
    };
    const isPlaceholder = (addr) => /PLATZHALTER/i.test(addr) || addr.length < 12;
    const qrData = (asset, addr, amt) => {
      if (asset === "BTC") return "bitcoin:" + addr + "?amount=" + amt.toFixed(8);
      if (asset === "ETH") return "ethereum:" + addr;
      return addr;
    };

    const copyDefault = cp.copy ? cp.copy.innerHTML : "";

    const renderCrypto = () => {
      const a = CONFIG.crypto[asset];
      const amt = cryptoAmount(asset, amount);
      cp.amount.textContent = fmtCrypto(amt, a.decimals) + " " + asset;
      cp.net.textContent = "· " + a.network;
      cp.addr.textContent = a.addr;
      fields.asset.value = asset;
      if (isPlaceholder(a.addr)) {
        cp.qr.style.display = "none";
        if (cp.warn) { cp.warn.classList.remove("ok"); cp.warn.innerHTML = "⚠ Platzhalter-Adresse – sobald du im Code (<code>assets/js/main.js</code>, <code>CONFIG.crypto</code>) die echte Wallet einträgst, erscheint hier automatisch der passende QR-Code."; }
      } else {
        cp.qr.style.display = "";
        cp.qr.src = "https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&qzone=1&data=" + encodeURIComponent(qrData(asset, a.addr, amt));
        if (cp.warn) { cp.warn.classList.add("ok"); cp.warn.innerHTML = "✓ Echte Adresse hinterlegt – QR-Code aktiv. Bitte Betrag und Verwendungszweck vor dem Senden prüfen."; }
      }
      if (cp.copy) { cp.copy.classList.remove("copied"); cp.copy.innerHTML = copyDefault; }
    };

    const render = () => {
      thOut.textContent = thForAmount(amount).toLocaleString("de-DE");
      fields.amount.value = amount;
      sepaAmount.textContent = fmtE(amount);
      chips.forEach((c) => c.classList.toggle("active", parseInt(c.dataset.amount, 10) === amount));
      renderCrypto();
    };
    window.__enparaInvest = renderCrypto;

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

    if (cp.qr) cp.qr.addEventListener("error", () => { cp.qr.style.display = "none"; });

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
          ? `Bitte sende ${fmtCrypto(cryptoAmount(asset, amount), CONFIG.crypto[asset].decimals)} ${asset} an die angezeigte Adresse (Referenz ${ref}). Sobald die Zahlung eingegangen ist, bestätigen wir deinen Anteil von ${thForAmount(amount).toLocaleString("de-DE")} TH/s.`
          : `Bitte überweise ${fmtE(amount)} per SEPA mit Verwendungszweck „${ref}". Nach Zahlungseingang bestätigen wir deinen Anteil von ${thForAmount(amount).toLocaleString("de-DE")} TH/s.`;
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
