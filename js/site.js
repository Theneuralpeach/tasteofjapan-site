/* Taste of Japan — shared behaviors
   noren opening / EN-JP toggle / countdown / lanterns / tilt / fireworks / reveal / sky */

(function () {
  "use strict";

  /* ---------- noren opening (once per session) ---------- */
  const noren = document.querySelector(".noren");
  if (noren) {
    if (sessionStorage.getItem("norenSeen")) {
      noren.classList.add("gone");
    } else {
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        noren.classList.add("open");
        sessionStorage.setItem("norenSeen", "1");
        setTimeout(() => {
          noren.classList.add("gone");
          document.body.style.overflow = "";
        }, 1150);
      }, 950);
    }
  }

  /* ---------- header scroll state ---------- */
  const header = document.querySelector(".site-header");
  const onScroll = () => header && header.classList.toggle("scrolled", window.scrollY > 24);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- EN / JP toggle ----------
     Any element with a data-ja attribute is translatable.
     English source is captured into data-en on first switch. */
  const langBtn = document.querySelector(".lang-toggle");
  const applyLang = (lang) => {
    document.documentElement.lang = lang === "ja" ? "ja" : "en";
    document.querySelectorAll("[data-ja]").forEach((el) => {
      if (!el.dataset.en) el.dataset.en = el.innerHTML;
      el.innerHTML = lang === "ja" ? el.dataset.ja : el.dataset.en;
    });
    if (langBtn) langBtn.textContent = lang === "ja" ? "EN" : "日本語";
    localStorage.setItem("tojLang", lang);
  };
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      const next = (localStorage.getItem("tojLang") || "en") === "en" ? "ja" : "en";
      applyLang(next);
    });
    if ((localStorage.getItem("tojLang") || "en") === "ja") applyLang("ja");
  }

  /* ---------- countdown ----------
     <div class="countdown" data-target="2026-08-16T11:00:00-07:00"> */
  const pad = (n) => String(n).padStart(2, "0");
  document.querySelectorAll(".countdown[data-target]").forEach((box) => {
    const target = new Date(box.dataset.target).getTime();
    const cells = {};
    ["days", "hours", "mins", "secs"].forEach((k) => {
      cells[k] = box.querySelector(`[data-cd="${k}"]`);
    });
    const tick = () => {
      let diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 864e5);
      const h = Math.floor(diff / 36e5) % 24;
      const m = Math.floor(diff / 6e4) % 60;
      const s = Math.floor(diff / 1e3) % 60;
      if (cells.days) cells.days.textContent = d;
      if (cells.hours) cells.hours.textContent = pad(h);
      if (cells.mins) cells.mins.textContent = pad(m);
      if (cells.secs) cells.secs.textContent = pad(s);
    };
    tick();
    setInterval(tick, 1000);
  });

  /* ---------- lantern countdown ----------
     <div class="lantern-row" data-target="..." data-window="70">
     Lanterns light as the event gets closer (window = days out when first lights). */
  document.querySelectorAll(".lantern-row[data-target]").forEach((row) => {
    const target = new Date(row.dataset.target).getTime();
    const windowDays = Number(row.dataset.window || 70);
    const lanterns = row.querySelectorAll(".lantern");
    const daysLeft = Math.max(0, (target - Date.now()) / 864e5);
    const progress = Math.min(1, Math.max(0, 1 - daysLeft / windowDays));
    const litCount = Math.round(progress * lanterns.length);
    lanterns.forEach((l, i) => {
      if (i < litCount) setTimeout(() => l.classList.add("lit"), 350 + i * 220);
    });
  });

  /* ---------- 3D tilt cards ---------- */
  const fine = window.matchMedia("(pointer: fine)").matches;
  if (fine) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      const strength = Number(card.dataset.tilt || 7);
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          `perspective(900px) rotateY(${x * strength}deg) rotateX(${-y * strength}deg) translateY(-4px)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
        card.style.transition = "transform .5s cubic-bezier(.22,.61,.36,1)";
        setTimeout(() => (card.style.transition = ""), 500);
      });
    });
  }

  /* ---------- scroll reveal ---------- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    }),
    { threshold: 0.14 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ---------- fireworks on ticket buttons ---------- */
  const canvas = document.getElementById("fx");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let parts = [];
    let raf = null;
    const fit = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
    fit();
    window.addEventListener("resize", fit);

    const PALETTES = {
      default: ["#e3c98a", "#f2f0e9", "#c9a24b", "#e9b7c3", "#7fa8c9"],
      pink: ["#ff4d88", "#ffd166", "#f2f0e9", "#ff8fb3", "#5ec8e5"],
      gold: ["#e3c98a", "#b98a2f", "#fff3d6", "#f2f0e9", "#c9a24b"],
    };

    function burst(x, y, palette) {
      const colors = PALETTES[palette] || PALETTES.default;
      for (let i = 0; i < 90; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 2.2 + Math.random() * 5.4;
        parts.push({
          x, y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - 1.4,
          life: 1,
          decay: 0.011 + Math.random() * 0.014,
          size: 1.6 + Math.random() * 2.4,
          color: colors[(Math.random() * colors.length) | 0],
        });
      }
      if (!raf) loop();
    }

    function loop() {
      raf = requestAnimationFrame(loop);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      parts = parts.filter((p) => p.life > 0);
      if (!parts.length) { cancelAnimationFrame(raf); raf = null; return; }
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.055; p.vx *= 0.985;
        p.life -= p.decay;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    document.querySelectorAll("[data-fireworks]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const r = btn.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        const pal = btn.dataset.fireworks || "default";
        burst(x, y, pal);
        setTimeout(() => burst(x + (Math.random() * 160 - 80), y - 90, pal), 240);
        setTimeout(() => burst(x + (Math.random() * 200 - 100), y - 40, pal), 460);
      });
    });
  }

  /* ---------- time-of-day sky (hub hero) ---------- */
  if (document.body.dataset.skyAuto !== undefined) {
    const h = new Date().getHours();
    const sky = h >= 5 && h < 9 ? "dawn" : h >= 9 && h < 16 ? "day" : h >= 16 && h < 20 ? "dusk" : "night";
    document.body.dataset.sky = sky;
  }
})();
