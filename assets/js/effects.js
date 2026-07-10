/* =========================================================
   ENPARA — decorative visual effects (wow layer)
   Purely presentational: no business logic, no data.
   Every effect respects prefers-reduced-motion and pauses
   when it is not visible.
   ========================================================= */
(function () {
  "use strict";

  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");

  /* ---------------- Scroll progress bar ---------------- */
  const progress = $(".scroll-progress i");
  if (progress) {
    let ticking = false;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      progress.style.setProperty("--sp", max > 0 ? (window.scrollY / max).toFixed(4) : 0);
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------------- Hero energy-particle canvas ---------------- */
  const canvas = $(".hero-canvas");
  if (canvas && !reduceMotion.matches && window.requestAnimationFrame) {
    const ctx = canvas.getContext("2d");
    const hero = canvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, particles = [], rafId = 0, running = false, visible = true;

    const COLORS = [
      { c: "24, 210, 126", w: 5 },   // green (energy)
      { c: "0, 224, 184", w: 4 },    // teal
      { c: "247, 147, 26", w: 1 },   // rare bitcoin spark
    ];
    const pick = () => {
      const total = COLORS.reduce((s, x) => s + x.w, 0);
      let r = Math.random() * total;
      for (const x of COLORS) { if ((r -= x.w) <= 0) return x.c; }
      return COLORS[0].c;
    };

    const spawn = (randomY) => ({
      x: Math.random() * W,
      y: randomY ? Math.random() * H : H + 10,
      r: 1 + Math.random() * 2.2,
      vy: 0.25 + Math.random() * 0.7,
      vx: (Math.random() - 0.5) * 0.25,
      a: 0.25 + Math.random() * 0.5,
      color: pick(),
      tw: Math.random() * Math.PI * 2,          // twinkle phase
    });

    const resize = () => {
      const rect = hero.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(75, Math.max(28, (W * H) / 22000)));
      particles = Array.from({ length: target }, () => spawn(true));
    };

    const LINK_DIST = 110;
    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      // links between nearby particles (network association)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_DIST * LINK_DIST) {
            const o = (1 - Math.sqrt(d2) / LINK_DIST) * 0.14;
            ctx.strokeStyle = "rgba(24, 210, 126, " + o.toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // particles rising like energy
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y -= p.vy;
        p.x += p.vx;
        p.tw += 0.03;
        if (p.y < -12 || p.x < -12 || p.x > W + 12) particles[i] = spawn(false);
        const alpha = p.a * (0.7 + 0.3 * Math.sin(p.tw));
        ctx.fillStyle = "rgba(" + p.color + ", " + alpha.toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      rafId = requestAnimationFrame(frame);
    };

    const start = () => { if (!running && visible && !document.hidden) { running = true; rafId = requestAnimationFrame(frame); } };
    const stop = () => { running = false; cancelAnimationFrame(rafId); };

    resize();
    let resizeT;
    window.addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(resize, 150); }, { passive: true });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        visible ? start() : stop();
      }, { threshold: 0.02 }).observe(hero);
    }
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    reduceMotion.addEventListener && reduceMotion.addEventListener("change", (e) => {
      if (e.matches) { stop(); ctx.clearRect(0, 0, W, H); } else { start(); }
    });
    start();
  }

  /* ---------------- Hero card 3D tilt ---------------- */
  const visual = $(".hero-visual");
  const card = $(".hero-card");
  if (visual && card && finePointer.matches && !reduceMotion.matches) {
    const MAX = 6; // degrees
    let raf = 0;
    visual.addEventListener("mousemove", (e) => {
      const rect = visual.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform =
          "perspective(900px) rotateX(" + (-py * MAX).toFixed(2) + "deg) rotateY(" + (px * MAX).toFixed(2) + "deg)";
      });
    });
    visual.addEventListener("mouseleave", () => {
      cancelAnimationFrame(raf);
      card.style.transform = "";
    });
  }

  /* ---------------- Card spotlight (cursor-following glow) ---------------- */
  if (finePointer.matches) {
    const SPOT = ".card, .stat, .plan, .step, .dash-card";
    document.addEventListener("mousemove", (e) => {
      const el = e.target.closest && e.target.closest(SPOT);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - rect.left) + "px");
      el.style.setProperty("--my", (e.clientY - rect.top) + "px");
    }, { passive: true });
  }

  /* ---------------- Roadmap timeline fill ---------------- */
  const timeline = $(".timeline");
  if (timeline && "IntersectionObserver" in window) {
    new IntersectionObserver((entries, io) => {
      if (entries[0].isIntersecting) { timeline.classList.add("in"); io.disconnect(); }
    }, { threshold: 0.25 }).observe(timeline);
  } else if (timeline) {
    timeline.classList.add("in");
  }
})();
