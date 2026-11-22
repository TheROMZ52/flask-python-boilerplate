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
      document.querySelectorAll<HTMLElement>("[data-tilt]").forEach(card => {
        const move = (event: PointerEvent) => {
          const rect = card.getBoundingClientRect();
          card.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width) * 100}%`);
          card.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height) * 100}%`);
        };
        card.addEventListener("pointermove", move, { passive: true });
        cleanups.push(() => card.removeEventListener("pointermove", move));
      });
    }

    return () => { cleanups.forEach(fn => fn()); body.classList.remove("hx-ready"); };
  }, []);

  return null;
}
