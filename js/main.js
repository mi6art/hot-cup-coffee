(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- open / closed by Moscow time (works without motion) ---------- */
  function mskNow() {
    const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Moscow", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false })
      .formatToParts(new Date()).reduce((a, x) => (a[x.type] = x.value, a), {});
    const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { day: days[p.weekday], min: (+p.hour % 24) * 60 + +p.minute };
  }
  function updateStatus() {
    const { day, min } = mskNow();
    const weekend = day === 0 || day === 6;
    const open = weekend ? 600 : 540, close = 1200;
    const isOpen = min >= open && min < close;
    const txt = $("[data-status-text]");
    if (txt) {
      if (isOpen) txt.textContent = "Сейчас открыто · до 20:00";
      else {
        const tomorrowWeekend = ((day + 1) % 7 === 0) || ((day + 1) % 7 === 6);
        const opensAt = min < open ? (weekend ? "10:00" : "09:00") : (tomorrowWeekend ? "10:00" : "09:00");
        txt.textContent = "Сейчас закрыто · откроемся " + (min < open ? "сегодня" : "завтра") + " в " + opensAt;
      }
    }
    $$(".dot").forEach(d => { if (d.closest("[data-status]") || d.hasAttribute("data-open-dot")) d.classList.toggle("is-open", isOpen); });
    $$(".hours tr").forEach(tr => tr.classList.toggle("is-today", tr.dataset.days.split(",").map(Number).includes(day)));
  }
  updateStatus(); setInterval(updateStatus, 60000);

  /* ---------- nav solid after hero ---------- */
  const nav = $(".nav");
  const onScrollNav = () => { const past = window.scrollY > window.innerHeight * 0.9, dark = past && inDark(); nav.classList.toggle("is-solid", past && !dark); nav.classList.toggle("is-dark", dark); };
  function inDark() {
    const y = 40;
    return $$(".loyalty, .contacts, .footer, .marquee").some(el => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom >= y; });
  }

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !window.gsap || !window.ScrollTrigger) {
    window.addEventListener("scroll", onScrollNav, { passive: true });
    return;
  }

  document.documentElement.classList.add("motion");
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------- Lenis smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
      const id = a.getAttribute("href");
      const el = id === "#top" ? 0 : $(id);
      if (el === null) return;
      e.preventDefault(); lenis.scrollTo(el, { offset: id === "#top" ? 0 : -10 });
    }));
  }
  ScrollTrigger.create({ start: 0, end: "max", onUpdate: () => onScrollNav() });

  /* progress bar */
  gsap.to(".progress span", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

  const mm = gsap.matchMedia();

  /* ---------- HERO ---------- */
  gsap.from(".hero__word", { yPercent: 110, opacity: 0, duration: 1.3, ease: "expo.out", stagger: 0.12, delay: 0.1 });
  gsap.from(".hero__media", { opacity: 0, scale: 0.92, duration: 1.4, ease: "expo.out" });
  gsap.from([".hero__kicker", ".steam"], { opacity: 0, y: 20, duration: 1, delay: 0.6 });

  mm.add({ mobile: "(max-width: 700px)", desktop: "(min-width: 701px)" }, ctx => {
    const { mobile } = ctx.conditions;
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: ".hero", start: "top top", end: "+=160%", pin: true, scrub: 0.6, anticipatePin: 1 }
    });
    const side = () => mobile ? 0 : Math.max(0, (1 - (window.innerHeight * 0.5625) / window.innerWidth) / 2 * 100);
    tl.fromTo(".hero__media", { clipPath: mobile ? "inset(22% 18% 20% 18% round 26px)" : "inset(17% 37% 13% 37% round 32px)" }, { clipPath: () => `inset(0% ${side()}% 0% ${side()}% round 0px)`, duration: 1 }, 0)
      .to(".hero__bg", { opacity: 1, duration: 0.8 }, 0.1)
      .to(".hero__media img", { scale: 1, duration: 1 }, 0)
      .to(".hero__word--l", mobile ? { yPercent: -160, scale: 1.25, opacity: 0, duration: 0.8 } : { xPercent: -140, scale: 1.4, opacity: 0, duration: 0.8 }, 0)
      .to(".hero__word--r", mobile ? { yPercent: 160, scale: 1.25, opacity: 0, duration: 0.8 } : { xPercent: 140, scale: 1.4, opacity: 0, duration: 0.8 }, 0)
      .to([".hero__kicker", ".hero__scroll", ".steam"], { opacity: 0, duration: 0.25 }, 0)
      .to(".hero__shade", { opacity: 1, duration: 0.5 }, 0.5)
      .fromTo(".hero__after", { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.45 }, 0.65)
      .to({}, { duration: 0.25 });
  });

  /* ---------- word-by-word reveal ---------- */
  $$(".reveal-words").forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.innerHTML = words.map(w => `<span class="w" aria-hidden="true">${w} </span>`).join("");
    gsap.fromTo(el.querySelectorAll(".w"), { opacity: 0.12, y: 8 }, {
      opacity: 1, y: 0, stagger: 0.08, ease: "none",
      scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 45%", scrub: true }
    });
  });
  gsap.from(".manifesto__note", { opacity: 0, x: -30, duration: 1, scrollTrigger: { trigger: ".manifesto__note", start: "top 90%" } });

  /* ---------- headings ---------- */
  $$(".h2").forEach(h => gsap.from(h, { yPercent: 40, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: h, start: "top 88%" } }));

  /* ---------- counters ---------- */
  function counter(el) {
    const end = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0), suf = el.dataset.suffix || "";
    const o = { v: 0 };
    el.textContent = (0).toFixed(dec) + suf;
    gsap.to(o, { v: end, duration: 2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" },
      onUpdate: () => el.textContent = o.v.toFixed(dec) + suf });
  }
  $$("[data-count]").forEach(counter);
  gsap.from(".stat", { y: 60, opacity: 0, stagger: 0.12, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".stats__grid", start: "top 85%" } });
  gsap.from(".award", { scale: 0.6, rotate: -8, opacity: 0, duration: 1, ease: "back.out(2)", scrollTrigger: { trigger: ".award", start: "top 92%" } });
  $$(".bar__track i").forEach(i => gsap.fromTo(i, { scaleX: 0 }, { scaleX: () => getComputedStyle(i).getPropertyValue("--v"), duration: 1.8, ease: "power3.out", scrollTrigger: { trigger: i, start: "top 92%" } }));

  /* ---------- horizontal menu ---------- */
  const track = $(".menu__track");
  const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
  const hz = gsap.to(track, {
    x: () => -dist(), ease: "none",
    scrollTrigger: { trigger: ".menu", start: "top top", end: () => "+=" + dist(), pin: ".menu__pin", scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 }
  });
  $$(".card").forEach(card => {
    gsap.from(card, { y: 80, rotate: 4, opacity: 0.3, ease: "power2.out",
      scrollTrigger: { trigger: card, containerAnimation: hz, start: "left 100%", end: "left 65%", scrub: true } });
    const img = card.querySelector("img");
    if (img) gsap.fromTo(img, { scale: 1.25, xPercent: -6 }, { scale: 1.05, xPercent: 6, ease: "none",
      scrollTrigger: { trigger: card, containerAnimation: hz, start: "left right", end: "right left", scrub: true } });
  });

  /* ---------- marquee driven by scroll ---------- */
  const mq = $(".marquee__inner");
  const loop = gsap.to(mq, { xPercent: -50, ease: "none", duration: 28, repeat: -1 });
  ScrollTrigger.create({ trigger: ".marquee", start: "top bottom", end: "bottom top",
    onUpdate: self => { const v = self.getVelocity() / 300; gsap.to(loop, { timeScale: 1 + Math.min(Math.abs(v), 6) * (v < 0 ? -1 : 1), duration: 0.2, overwrite: true }); gsap.to(loop, { timeScale: 1, duration: 1, delay: 0.25 }); } });

  /* ---------- parallax layers ---------- */
  $$("[data-speed]").forEach(el => {
    const s = parseFloat(el.dataset.speed);
    gsap.fromTo(el, { yPercent: -s * 100 }, { yPercent: s * 100, ease: "none", scrollTrigger: { trigger: ".space__layers", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.fromTo(el.querySelector("img"), { scale: 1.2 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
  });
  gsap.from(".features li", { y: 30, opacity: 0, stagger: 0.08, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".features", start: "top 90%" } });

  /* ---------- loyalty cups fill ---------- */
  const fills = $$(".cup__fill"), countEl = $("[data-cup-count]"), cups = $$(".cup");
  gsap.set(fills, { scaleY: 0, transformOrigin: "50% 100%" }); countEl.textContent = 0;
  const ltl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: ".loyalty", start: "top top", end: "+=140%", pin: ".loyalty__pin", scrub: 0.5, anticipatePin: 1,
      onUpdate: () => { countEl.textContent = Math.max(0, Math.min(7, Math.floor(ltl.time() + 0.35))); } }
  });
  fills.forEach((f, i) => {
    ltl.to(f, { scaleY: 1, duration: 1 }, i);
    ltl.fromTo(cups[i], { y: 0 }, { y: -10, duration: 0.5, yoyo: true, repeat: 1 }, i + 0.5);
  });
  ltl.fromTo(".cup--gift svg", { rotate: 0, scale: 1 }, { rotate: -8, scale: 1.18, duration: 0.6, ease: "back.out(3)" }, 6.6)
     .fromTo(".loyalty__gift", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, 6.6)
     .to({}, { duration: 0.5 });

  /* ---------- gallery clip reveals ---------- */
  $$(".g").forEach((g, i) => {
    const clip = g.querySelector(".g__clip"), img = g.querySelector("img");
    const from = ["inset(100% 0% 0% 0% round 22px)", "inset(0% 100% 0% 0% round 22px)", "inset(0% 0% 100% 0% round 22px)", "inset(0% 0% 0% 100% round 22px)"][i % 4];
    gsap.timeline({ scrollTrigger: { trigger: g, start: "top 88%" } })
      .fromTo(clip, { clipPath: from }, { clipPath: "inset(0% 0% 0% 0% round 22px)", duration: 1.3, ease: "expo.inOut" })
      .fromTo(img, { scale: 1.4 }, { scale: 1, duration: 1.6, ease: "expo.out" }, 0.1);
    gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: "none", scrollTrigger: { trigger: g, start: "top bottom", end: "bottom top", scrub: true } });
  });

  /* ---------- reviews ---------- */
  gsap.from(".review", { y: 90, rotate: (i) => [-3, 2, -2][i], opacity: 0, stagger: 0.15, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: ".reviews__list", start: "top 85%" } });

  /* ---------- contacts + footer ---------- */
  gsap.from([".status", ".contacts__addr", ".contacts__phone", ".hours", ".contacts__btns"], { y: 40, opacity: 0, stagger: 0.08, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: ".contacts", start: "top 75%" } });
  gsap.fromTo(".contacts__map", { clipPath: "inset(0% 0% 0% 100%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: ".contacts__map", start: "top 85%" } });
  gsap.fromTo(".footer__big", { yPercent: 40, letterSpacing: "0.1em" }, { yPercent: 0, letterSpacing: "-0.03em", ease: "none", scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true } });

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
