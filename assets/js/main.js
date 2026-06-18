/* =========================================================
   VerdeHash — interactions
   ========================================================= */
(function () {
  "use strict";

  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  /* ---- Header shadow on scroll ---- */
  const header = $(".site-header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Mobile menu ---- */
  const toggle = $(".nav-toggle");
  const menu = $(".mobile-menu");
  if (toggle && menu) {
    const close = () => { toggle.classList.remove("open"); menu.classList.remove("open"); };
    toggle.addEventListener("click", () => {
      const open = toggle.classList.toggle("open");
      menu.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    $$("a", menu).forEach((a) => a.addEventListener("click", () => {
      close();
      toggle.setAttribute("aria-expanded", "false");
    }));
  }

  /* ---- Footer year ---- */
  const yr = $("#year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---- Scroll reveal ---- */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      }),
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* ---- Animated counters ---- */
  const counters = $$("[data-count]");
  const animate = (el) => {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || "0", 10);
    const dur = 1500;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = target * eased;
      el.textContent = dec ? val.toFixed(dec).replace(".", ",") : Math.round(val).toLocaleString("de-DE");
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in window && counters.length) {
    const cio = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { animate(e.target); cio.unobserve(e.target); }
      }),
      { threshold: 0.5 }
    );
    counters.forEach((el) => cio.observe(el));
  } else {
    counters.forEach(animate);
  }

  /* ---- FAQ: single-open accordion ---- */
  const faqItems = $$(".faq-item");
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (item.open) faqItems.forEach((o) => { if (o !== item) o.open = false; });
    });
  });

  /* ---- ROI / yield calculator (illustrative) ---- */
  const calc = $("#calc");
  if (calc) {
    const slider = $("#calc-amount", calc);
    const amountOut = $("#calc-amount-out", calc);
    const scenarioBtns = $$(".scenario button", calc);
    const outAnnual = $("#out-annual", calc);
    const rRate = $("#r-rate", calc);
    const rMonthly = $("#r-monthly", calc);
    const rThree = $("#r-three", calc);
    const rHash = $("#r-hash", calc);

    // Illustrative NET annual yield assumptions (after energy, ops & fees). NOT guaranteed.
    const scenarios = { conservative: 0.06, base: 0.11, optimistic: 0.18 };
    let current = "base";

    // ~ TH/s provisioned per € invested (illustrative hardware efficiency)
    const TH_PER_EUR = 0.9;

    const render = () => {
      const amount = parseInt(slider.value, 10);
      const rate = scenarios[current];
      const annual = amount * rate;
      amountOut.textContent = amount.toLocaleString("de-DE");
      outAnnual.textContent = euro.format(annual);
      rRate.textContent = (rate * 100).toFixed(0) + " %";
      rMonthly.textContent = euro.format(annual / 12);
      rThree.textContent = euro.format(annual * 3);
      rHash.textContent = Math.round(amount * TH_PER_EUR).toLocaleString("de-DE") + " TH/s";
    };

    slider.addEventListener("input", render);
    scenarioBtns.forEach((b) => b.addEventListener("click", () => {
      scenarioBtns.forEach((o) => o.classList.remove("active"));
      b.classList.add("active");
      current = b.dataset.scenario;
      render();
    }));
    render();
  }

  /* ---- Plan buttons → prefill form & scroll ---- */
  $$("[data-plan]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const plan = btn.dataset.plan;
      const sel = $("#f-amount");
      if (sel) {
        const opt = Array.from(sel.options).find((o) => o.dataset.plan === plan);
        if (opt) sel.value = opt.value;
      }
      const target = $("#invest");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => $("#f-name") && $("#f-name").focus(), 600);
    });
  });

  /* ---- Investment interest form (front-end demo) ---- */
  const form = $("#invest-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      // NOTE: Wire this up to your backend / CRM / email service (see README).
      const data = Object.fromEntries(new FormData(form).entries());
      try { console.info("[VerdeHash] Lead erfasst:", data); } catch (_) {}
      form.style.display = "none";
      const ok = $("#form-success");
      if (ok) {
        ok.classList.add("show");
        const nameEl = $("#success-name");
        if (nameEl && data.name) nameEl.textContent = data.name.split(" ")[0];
      }
    });
  }

  /* ---- Image fallback: reveal gradient placeholder if a photo fails to load ---- */
  $$("img[data-fallback]").forEach((img) => {
    const fail = () => img.classList.add("img-failed");
    img.addEventListener("error", fail);
    if (img.complete && img.naturalWidth === 0) fail();
  });
})();
