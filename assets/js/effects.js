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

  /* ---------------- Video director: pause the hero video offscreen ---------------- */
  const heroVid = document.querySelector(".hero-bgvid");
  if (heroVid && "IntersectionObserver" in window) {
    const vio = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { const p = heroVid.play(); if (p && p.catch) p.catch(() => {}); }
      else { heroVid.pause(); }
    }), { threshold: 0.05 });
    vio.observe(heroVid);
  }
})();
