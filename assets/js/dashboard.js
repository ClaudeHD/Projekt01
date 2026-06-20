/* =========================================================
   ENPARA — Seed-Round Dashboard
   Reads the shared seed model + ledger from window.ENPARA_SEED
   (assets/js/seed.js). Admin edits are persisted in localStorage.
   ========================================================= */
(function () {
  "use strict";
  const S = window.ENPARA_SEED;
  if (!S) return;

  const $ = (s) => document.querySelector(s);
  const num = S.num, fmtE = S.fmtE;

  const yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------------- count-up helper ---------------- */
  function animateNum(el, target, fmt, animated) {
    if (!el) return;
    if (!animated) { el.textContent = fmt(target); return; }
    const dur = 1200, start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------------- static capacity / target labels ---------------- */
  if ($("#d-seedmw")) $("#d-seedmw").textContent = S.fmt2(S.CFG.seedMW);
  if ($("#d-totalth")) $("#d-totalth").textContent = num(S.CFG.totalTH);
  if ($("#d-target")) $("#d-target").textContent = fmtE(S.CFG.target);

  /* ---------------- progress ring geometry ---------------- */
  const ring = $("#d-ring");
  let circ = 0;
  if (ring) {
    const r = parseFloat(ring.getAttribute("r"));
    circ = 2 * Math.PI * r;
    ring.style.strokeDasharray = circ.toFixed(2);
    ring.style.strokeDashoffset = circ.toFixed(2);
  }

  const barItem = (label, value, pctWidth, warm) =>
    `<div class="bar-item"><div class="bl"><span>${label}</span><b>${value}</b></div>` +
    `<div class="bar-track"><div class="bar-fill${warm ? " warm" : ""}" data-w="${pctWidth}"></div></div></div>`;

  /* ---------------- use of funds (static allocation) ---------------- */
  const useEl = $("#d-usefunds");
  if (useEl) useEl.innerHTML = S.CFG.useOfFunds.map((u) => barItem(u.label, u.pct + " %", u.pct)).join("");

  /* ---------------- main dashboard render ---------------- */
  function render(animated) {
    const t = S.totals();

    if (ring) requestAnimationFrame(() => requestAnimationFrame(() => { ring.style.strokeDashoffset = (circ * (1 - t.pct)).toFixed(2); }));
    animateNum($("#d-pct"), t.pct * 100, (v) => Math.round(v) + " %", animated);
    animateNum($("#d-raised"), t.raised, (v) => fmtE(v), animated);
    animateNum($("#d-investors"), t.investors, (v) => num(v), animated);
    animateNum($("#d-avg"), t.avg, (v) => num(v), animated);
    animateNum($("#d-min"), S.CFG.minTicket, (v) => num(v), animated);

    // capacity (committed share of the 0.70 MW seed allocation)
    animateNum($("#d-mw"), t.committedMW, (v) => S.fmt2(v), animated);
    animateNum($("#d-th"), t.committedTH, (v) => num(v), animated);
    const capbar = $("#d-capbar");
    if (capbar) requestAnimationFrame(() => requestAnimationFrame(() => { capbar.style.width = (t.pct * 100).toFixed(1) + "%"; }));

    // free volume + which packages still fit
    if ($("#d-free")) $("#d-free").textContent = fmtE(t.free);
    if ($("#d-freeth")) $("#d-freeth").textContent = num(t.freeTH);
    if ($("#d-freemw")) $("#d-freemw").textContent = S.fmt2(t.freeMW);
    const remainEl = $("#d-remain");
    if (remainEl) {
      const rp = S.remainingPackages();
      const maxR = Math.max(1, ...rp.map((p) => p.remaining));
      remainEl.innerHTML = rp.map((p) =>
        barItem(`${p.name} · ${num(p.th)} TH/s · ${fmtE(p.price)}`, `noch ${p.remaining}×`, Math.round((p.remaining / maxR) * 100), true)
      ).join("");
    }

    // animate all bar widths
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.querySelectorAll(".bar-fill[data-w]").forEach((f) => { f.style.width = f.dataset.w + "%"; });
    }));

    renderChart();
    renderFeed();
  }

  /* ---------------- capital timeline chart ---------------- */
  function renderChart() {
    const chartEl = $("#d-chart");
    if (!chartEl) return;
    const data = S.monthlySeries();
    const W = 600, H = 210, padT = 14, padB = 16;
    const max = Math.max(1, Math.max.apply(null, data.values)) * 1.08;
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
      `<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="4.5" fill="#0b110e" stroke="#18d27e" stroke-width="2.5"/>`).join("");

    chartEl.innerHTML =
      `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Kapitalverlauf">` +
      `<defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="#18d27e" stop-opacity="0.35"/><stop offset="1" stop-color="#18d27e" stop-opacity="0"/>` +
      `</linearGradient></defs>` +
      `<path d="${area}" fill="url(#areaGrad)"/>` +
      `<path d="${line}" fill="none" stroke="url(#lg)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` +
      dots + `</svg>`;

    const xEl = $("#d-chartx");
    if (xEl) xEl.innerHTML = data.labels.map((l) => `<span>${l}</span>`).join("");
  }

  /* ---------------- activity feed (latest ledger entries) ---------------- */
  function renderFeed() {
    const feedEl = $("#d-feed");
    if (!feedEl) return;
    const sym = { BTC: "₿", ETH: "Ξ", USDT: "₮", USDC: "$", SEPA: "🏦" };
    const rows = S.ledger().slice(0, 8);
    feedEl.innerHTML = rows.length ? rows.map((f) => {
      const isSepa = f.method === "SEPA";
      const who = f.name && f.name !== "—" ? f.name + " · " : "";
      return `<div class="feed-row">` +
        `<div class="feed-badge${isSepa ? " sepa" : ""}">${sym[f.method] || "•"}</div>` +
        `<div class="feed-main"><b>Neue Beteiligung</b><span>${f.method} · ${who}${S.whenLabel(f.ts)}</span></div>` +
        `<div class="feed-amt">+ ${fmtE(f.amount)}</div></div>`;
    }).join("") : `<div class="admin-empty">Noch keine Beteiligungen erfasst.</div>`;
  }

  /* ---------------- live countdown ---------------- */
  function tickCountdown() {
    const cd = S.countdown();
    if ($("#cd-date")) $("#cd-date").textContent = S.deadlineLabel();
    if ($("#cd-d")) $("#cd-d").textContent = cd.days;
    if ($("#cd-h")) $("#cd-h").textContent = String(cd.hours).padStart(2, "0");
    if ($("#cd-m")) $("#cd-m").textContent = String(cd.mins).padStart(2, "0");
    const pill = $("#d-days-pill");
    if (pill) pill.textContent = cd.ended ? "beendet" : cd.days + " Tagen";
    if ($("#d-days")) $("#d-days").textContent = cd.ended ? "0" : num(cd.days);
  }

  /* ---------------- admin ---------------- */
  const panel = $("#admin-panel");
  const toggle = $("#admin-toggle");
  const showPanel = (show) => { if (panel) panel.hidden = !show; if (toggle) toggle.classList.toggle("active", show); };

  if (S.isUnlocked()) showPanel(true);

  if (toggle) toggle.addEventListener("click", () => {
    if (panel.hidden) {
      if (!S.isUnlocked()) {
        const p = prompt("Admin-Passwort eingeben:");
        if (p === null) return;
        if (!S.unlock(p)) { alert("Falsches Passwort."); return; }
      }
      showPanel(true); renderAdmin();
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      showPanel(false);
    }
  });
  if ($("#admin-lock")) $("#admin-lock").addEventListener("click", () => { S.lock(); showPanel(false); });

  const addForm = $("#admin-add");
  if (addForm) addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const amt = parseFloat($("#aa-amount").value);
    if (!amt || amt <= 0) { return; }
    S.addEntry({ amount: amt, method: $("#aa-method").value, name: $("#aa-name").value });
    $("#aa-amount").value = ""; $("#aa-name").value = "";
    render(false); renderAdmin();
  });
  if ($("#aa-demo")) $("#aa-demo").addEventListener("click", () => {
    if (confirm("Ledger mit Demo-Daten ersetzen?")) { S.resetDemo(); render(false); renderAdmin(); }
  });
  if ($("#aa-clear")) $("#aa-clear").addEventListener("click", () => {
    if (confirm("Wirklich ALLE gebuchten Einnahmen löschen?")) { S.clearAll(); render(false); renderAdmin(); }
  });

  function renderAdmin() {
    // pending visitor requests
    const reqEl = $("#admin-requests");
    const reqs = S.requests();
    if ($("#req-count")) $("#req-count").textContent = reqs.length;
    if (reqEl) {
      reqEl.innerHTML = reqs.length ? reqs.map((r) => {
        const m = r.method === "crypto" ? (r.asset || "Krypto") : "SEPA";
        return `<div class="admin-row"><div class="ar-main"><b>${fmtE(r.amount)}</b>` +
          `<span>${m} · ${r.name || r.email || "—"} · ${S.whenLabel(r.ts)}</span></div>` +
          `<div class="ar-act"><button class="mini ok" data-confirm="${r.id}">✓ buchen</button>` +
          `<button class="mini" data-drop="${r.id}">✕</button></div></div>`;
      }).join("") : `<div class="admin-empty">Keine offenen Anfragen.</div>`;
      reqEl.querySelectorAll("[data-confirm]").forEach((b) => b.addEventListener("click", () => { S.confirmRequest(b.dataset.confirm); render(false); renderAdmin(); }));
      reqEl.querySelectorAll("[data-drop]").forEach((b) => b.addEventListener("click", () => { S.dropRequest(b.dataset.drop); renderAdmin(); }));
    }

    // booked ledger
    const ledEl = $("#admin-ledger");
    const led = S.ledger();
    if ($("#led-count")) $("#led-count").textContent = led.length;
    if (ledEl) {
      ledEl.innerHTML = led.length ? led.map((en) =>
        `<div class="admin-row"><div class="ar-main"><b>${fmtE(en.amount)}</b>` +
        `<span>${en.method} · ${en.name || "—"} · ${S.whenLabel(en.ts)}</span></div>` +
        `<div class="ar-act"><button class="mini" data-del="${en.id}">✕ löschen</button></div></div>`
      ).join("") : `<div class="admin-empty">Noch keine Einnahmen gebucht.</div>`;
      ledEl.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => { S.removeEntry(b.dataset.del); render(false); renderAdmin(); }));
    }
  }

  /* ---------------- init ---------------- */
  render(true);
  renderAdmin();
  tickCountdown();
  setInterval(tickCountdown, 30000);
})();
