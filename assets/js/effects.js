/* =========================================================
   ENPARA — effects layer
   Progressive enhancements on top of main.js:
   word-split hero intro, marquee strip, 3D tilt + glare,
   magnetic buttons, scroll progress fallback, video director.
   Everything is skipped for prefers-reduced-motion.
   ========================================================= */
(function () {
  "use strict";

  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Reduced motion: freeze videos, keep page fully usable ---------------- */
  if (REDUCED) {
    $$("video").forEach((v) => { v.removeAttribute("autoplay"); v.pause(); });
    return;
  }

  /* ---------------- Scroll progress (JS fallback for browsers without scroll-driven CSS) ---------------- */
  const progress = document.querySelector(".scroll-progress i");
  const hasScrollTimeline = typeof CSS !== "undefined" && CSS.supports && CSS.supports("animation-timeline: scroll()");
  if (progress && !hasScrollTimeline) {
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
  }

  /* ---------------- Hero intro: staggered word reveal ---------------- */
  $$("[data-splitwords]").forEach((el) => {
    let index = 0;
    const splitNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const w = document.createElement("span");
          w.className = "w";
          w.style.setProperty("--wi", index++);
          w.textContent = part;
          frag.appendChild(w);
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        Array.from(node.childNodes).forEach(splitNode);
      }
    };
    Array.from(el.childNodes).forEach(splitNode);
    el.classList.add("splitwords");
    el.classList.add("in"); // entrance is handled per word, not by the .reveal fade
  });

  /* ---------------- Trust strip → endless marquee ---------------- */
  const stripInner = document.querySelector(".strip-inner");
  if (stripInner) {
    const track = document.createElement("div");
    track.className = "marquee-track";
    while (stripInner.firstChild) track.appendChild(stripInner.firstChild);
    // close the loop visually
    track.appendChild(track.querySelector(".sep") ? track.querySelector(".sep").cloneNode(true) : document.createTextNode(""));
    const clone = track.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    stripInner.appendChild(track);
    stripInner.appendChild(clone);
    stripInner.closest(".strip").classList.add("marquee-on");
  }

  /* ---------------- 3D tilt + glare on cards ---------------- */
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (finePointer) {
    $$(".card, .plan, .member").forEach((card) => {
      card.classList.add("tilt");
      const strength = 6; // deg
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
        const rx = ((0.5 - py) * strength).toFixed(2);
        const ry = ((px - 0.5) * strength).toFixed(2);
        card.style.transform = "perspective(900px) translateY(-4px) rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });

    /* ---------------- Magnetic primary buttons ---------------- */
    $$(".btn-primary").forEach((btn) => {
      btn.classList.add("magnetic");
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = "translate(" + (dx * 0.18).toFixed(1) + "px," + (dy * 0.3).toFixed(1) + "px)";
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });
  }

  /* ---------------- Video director: fixed page background follows tab visibility ---------------- */
  const bgVid = document.querySelector(".page-bg video");
  if (bgVid) {
    const sync = () => {
      if (document.hidden) { bgVid.pause(); }
      else { const p = bgVid.play(); if (p && p.catch) p.catch(() => {}); }
    };
    document.addEventListener("visibilitychange", sync);
    sync();
  }

  /* ---------------- Lightning engine: site-wide energy bolts ---------------- */
  const boltCanvas = document.querySelector(".energy-bg");
  if (boltCanvas && boltCanvas.getContext) {
    const ctx = boltCanvas.getContext("2d");
    const DPR = Math.min(1.5, window.devicePixelRatio || 1);
    let W = 0, H = 0;
    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      boltCanvas.width = Math.round(W * DPR);
      boltCanvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const rnd = (a, b) => a + Math.random() * (b - a);

    const makeBolt = (mini) => {
      const x0 = rnd(W * 0.06, W * 0.94);
      const y0 = mini ? rnd(H * 0.1, H * 0.75) : rnd(-H * 0.05, H * 0.18);
      const len = mini ? rnd(H * 0.08, H * 0.18) : rnd(H * 0.45, H * 0.75);
      const x1 = x0 + rnd(-len * 0.35, len * 0.35);
      const y1 = y0 + len;
      let pts = [[x0, y0], [x1, y1]];
      let jitter = len * 0.26;
      for (let d = 0; d < 7; d++) {
        const next = [pts[0]];
        for (let i = 1; i < pts.length; i++) {
          const ax = pts[i - 1][0], ay = pts[i - 1][1];
          const bx = pts[i][0], by = pts[i][1];
          next.push([(ax + bx) / 2 + rnd(-jitter, jitter), (ay + by) / 2 + rnd(-jitter, jitter) * 0.35], pts[i]);
        }
        pts = next;
        jitter *= 0.52;
      }
      const branches = [];
      if (!mini) {
        const nb = 1 + Math.floor(Math.random() * 3);
        for (let b = 0; b < nb; b++) {
          const start = pts[Math.floor(rnd(pts.length * 0.2, pts.length * 0.7))];
          const seg = [start.slice()];
          let px = start[0], py = start[1];
          const dir = Math.random() < 0.5 ? -1 : 1;
          const steps = 4 + Math.floor(Math.random() * 4);
          for (let s = 0; s < steps; s++) {
            px += dir * rnd(8, 34);
            py += rnd(10, 42);
            seg.push([px, py]);
          }
          branches.push(seg);
        }
      }
      return { pts, branches, mini, hue: Math.random() < 0.35 ? "orange" : "blue" };
    };

    const drawPath = (pts, width, style, blur, blurColor) => {
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        if (i) ctx.lineTo(pts[i][0], pts[i][1]); else ctx.moveTo(pts[i][0], pts[i][1]);
      }
      ctx.lineWidth = width;
      ctx.strokeStyle = style;
      ctx.shadowBlur = blur;
      ctx.shadowColor = blurColor;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
    };

    let active = null, raf = 0;

    const render = (now) => {
      ctx.clearRect(0, 0, W, H);
      if (!active) return;
      const p = (now - active.start) / active.dur;
      if (p >= 1) { active = null; return; }
      const flick = 0.55 + 0.45 * Math.sin(p * 26 + active.phase);
      const a = Math.max(0, 1 - p) * Math.max(0.15, flick);
      const wMul = active.bolt.mini ? 0.5 : 1;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      // screen flash around the strike
      const midPt = active.bolt.pts[Math.floor(active.bolt.pts.length / 2)];
      const flashCol = active.bolt.hue === "orange" ? "255,160,90" : "120,180,255";
      const flashA = (active.bolt.mini ? 0.03 : 0.09) * a;
      const g = ctx.createRadialGradient(midPt[0], midPt[1], 0, midPt[0], midPt[1], Math.max(W, H) * 0.7);
      g.addColorStop(0, "rgba(" + flashCol + "," + flashA.toFixed(3) + ")");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // bolt: blue/orange glow -> warm mid -> hot core
      const glow = active.bolt.hue === "orange" ? "rgba(255,138,60," : "rgba(77,166,255,";
      const mid = active.bolt.hue === "orange" ? "rgba(255,179,94," : "rgba(255,138,60,";
      ctx.globalAlpha = a;
      drawPath(active.bolt.pts, 7 * wMul, glow + "0.35)", 26, glow + "0.8)");
      drawPath(active.bolt.pts, 2.6 * wMul, mid + "0.85)", 8, mid + "0.9)");
      drawPath(active.bolt.pts, 1.1 * wMul, "rgba(255,238,214,0.95)", 0, "rgba(0,0,0,0)");
      active.bolt.branches.forEach((seg) => {
        drawPath(seg, 3.5, glow + "0.25)", 14, glow + "0.6)");
        drawPath(seg, 1, "rgba(255,238,214,0.7)", 0, "rgba(0,0,0,0)");
      });
      ctx.restore();
      raf = requestAnimationFrame(render);
    };

    const strike = (mini) => {
      active = { bolt: makeBolt(mini), start: performance.now(), dur: mini ? rnd(220, 380) : rnd(380, 620), phase: rnd(0, 6.28) };
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(render);
    };

    // big strikes every 4-9s, sometimes a double strike
    const schedule = () => setTimeout(() => {
      if (!document.hidden) {
        strike(false);
        if (Math.random() < 0.28) setTimeout(() => { if (!document.hidden) strike(false); }, rnd(140, 320));
      }
      schedule();
    }, rnd(4000, 9000));
    schedule();

    // subtle micro sparks in between (only when idle)
    const scheduleSpark = () => setTimeout(() => {
      if (!document.hidden && !active) strike(true);
      scheduleSpark();
    }, rnd(1600, 3400));
    scheduleSpark();

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { active = null; cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H); }
    });

    // debug/testing hook
    window.__enparaStrike = () => strike(false);

    // welcome strike shortly after load
    setTimeout(() => { if (!document.hidden) strike(false); }, 1200);
  }
})();
