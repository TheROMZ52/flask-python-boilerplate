"use client";

import { useEffect } from "react";

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export default function HomeFx() {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Array<() => void> = [];
    body.classList.add("hx-ready");

    const header = document.querySelector<HTMLElement>(".hx-header");
    const timeline = document.querySelector<HTMLElement>(".hx-timeline");
    const steps = Array.from(document.querySelectorAll<HTMLElement>(".hx-step"));
    const depthItems = Array.from(document.querySelectorAll<HTMLElement>("[data-depth]"));
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const max = root.scrollHeight - window.innerHeight;
      root.style.setProperty("--hx-progress", max > 0 ? `${(y / max) * 100}%` : "0%");
      header?.classList.toggle("is-scrolled", y > 24);
      const vh = window.innerHeight;
      if (timeline) {
        const rect = timeline.getBoundingClientRect();
        timeline.style.setProperty("--tl", String(clamp((vh * 0.62 - rect.top) / rect.height)));
        steps.forEach(step => step.classList.toggle("on", step.getBoundingClientRect().top < vh * 0.66));
      }
      if (!reduce) depthItems.forEach(item => {
        const rect = item.getBoundingClientRect();
        const offset = (rect.top + rect.height / 2 - vh / 2) * Number(item.dataset.depth);
        item.style.setProperty("--dy", `${offset.toFixed(1)}px`);
      });
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    cleanups.push(() => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); });

    const countTo = (el: HTMLElement) => {
      const target = Number(el.dataset.count || 0);
      if (reduce) return;
      const start = performance.now();
      const tick = (now: number) => {
        const t = clamp((now - start) / 1300);
        el.textContent = Math.round(target * (1 - Math.pow(1 - t, 4))).toLocaleString("fa-IR");
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target as HTMLElement;
      el.classList.add("in");
      window.setTimeout(() => el.classList.add("settled"), 1200 + Number(el.dataset.delay || 0));
      el.querySelectorAll<HTMLElement>("[data-count]").forEach(countTo);
      if (el.dataset.count) countTo(el);
      reveal.unobserve(el);
    }), { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach(el => {
      el.style.setProperty("--rd", `${Number(el.dataset.delay || 0)}ms`);
      reveal.observe(el);
    });
    cleanups.push(() => reveal.disconnect());

    const toggle = document.querySelector<HTMLElement>("[data-menu-toggle]");
    const closeMenu = () => header?.classList.remove("menu-open");
    const onToggle = () => header?.classList.toggle("menu-open");
    toggle?.addEventListener("click", onToggle);
    const menuLinks = Array.from(document.querySelectorAll<HTMLElement>(".hx-nav a"));
    menuLinks.forEach(link => link.addEventListener("click", closeMenu));
    cleanups.push(() => { toggle?.removeEventListener("click", onToggle); menuLinks.forEach(link => link.removeEventListener("click", closeMenu)); });

    if (fine && !reduce) {
      const tilts = Array.from(document.querySelectorAll<HTMLElement>("[data-tilt]"));
      tilts.forEach(card => {
        const move = (event: PointerEvent) => {
          const rect = card.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;
          card.style.setProperty("--mx", `${x * 100}%`);
          card.style.setProperty("--my", `${y * 100}%`);
          if (card.dataset.tilt !== "flat") card.style.transform = `perspective(1000px) rotateX(${((0.5 - y) * 7).toFixed(2)}deg) rotateY(${((x - 0.5) * 9).toFixed(2)}deg) translateY(-4px)`;
        };
        const leave = () => { card.style.transform = ""; };
        card.addEventListener("pointermove", move);
        card.addEventListener("pointerleave", leave);
        cleanups.push(() => { card.removeEventListener("pointermove", move); card.removeEventListener("pointerleave", leave); });
      });

      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach(el => {
        const move = (event: PointerEvent) => {
          const rect = el.getBoundingClientRect();
          el.style.transform = `translate(${((event.clientX - rect.left - rect.width / 2) * 0.28).toFixed(1)}px,${((event.clientY - rect.top - rect.height / 2) * 0.4).toFixed(1)}px)`;
        };
        const leave = () => { el.style.transform = ""; };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        cleanups.push(() => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); });
      });

      const hero = document.querySelector<HTMLElement>(".hx-hero");
      if (hero) {
        let frame = 0;
        let px = 0, py = 0, tx = 0, ty = 0;
        const loop = () => {
          px += (tx - px) * 0.08; py += (ty - py) * 0.08;
          hero.style.setProperty("--px", px.toFixed(3));
          hero.style.setProperty("--py", py.toFixed(3));
          frame = requestAnimationFrame(loop);
        };
        const move = (event: PointerEvent) => {
          const rect = hero.getBoundingClientRect();
          tx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
          ty = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        };
        const leave = () => { tx = 0; ty = 0; };
        hero.addEventListener("pointermove", move);
        hero.addEventListener("pointerleave", leave);
        frame = requestAnimationFrame(loop);
        cleanups.push(() => { cancelAnimationFrame(frame); hero.removeEventListener("pointermove", move); hero.removeEventListener("pointerleave", leave); });
      }

      const aura = document.createElement("div");
      aura.className = "hx-aura";
      body.appendChild(aura);
      let ax = window.innerWidth / 2, ay = window.innerHeight / 2, bx = ax, by = ay, auraFrame = 0;
      const follow = (event: PointerEvent) => { bx = event.clientX; by = event.clientY; };
      const run = () => {
        ax += (bx - ax) * 0.12; ay += (by - ay) * 0.12;
        aura.style.transform = `translate3d(${ax.toFixed(1)}px,${ay.toFixed(1)}px,0)`;
        auraFrame = requestAnimationFrame(run);
      };
      window.addEventListener("pointermove", follow, { passive: true });
      auraFrame = requestAnimationFrame(run);
      cleanups.push(() => { cancelAnimationFrame(auraFrame); window.removeEventListener("pointermove", follow); aura.remove(); });
    }

    return () => { cleanups.forEach(fn => fn()); body.classList.remove("hx-ready"); };
  }, []);

  return null;
}
