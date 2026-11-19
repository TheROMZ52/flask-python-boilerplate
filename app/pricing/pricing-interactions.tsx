"use client";
import { useEffect } from "react";
export default function PricingInteractions() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const progress = document.createElement("div");
    progress.className = "pricing-scroll-progress";
    document.body.appendChild(progress);
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    let revealObserver: IntersectionObserver | undefined;
    let counterObserver: IntersectionObserver | undefined;
    const targets = document.querySelectorAll(".pricing-hero-copy,.pricing-range-panel,.pricing-hero-foot,.pricing-section-heading,.pricing-platform-card,.pricing-service-card,.pricing-factors-intro,.pricing-factor,.pricing-step,.pricing-final-panel");
    if (reduced) targets.forEach((el) => el.classList.add("is-visible"));
    else {
      revealObserver = new IntersectionObserver((entries, observer) => entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
      }), { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
      targets.forEach((el, i) => {
        (el as HTMLElement).style.setProperty("--reveal-delay", `${(i % 4) * 75}ms`);
        revealObserver?.observe(el);
      });
    }
    const counters = document.querySelectorAll<HTMLElement>("[data-count]");
    counterObserver = new IntersectionObserver((entries, observer) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target as HTMLElement;
      observer.unobserve(el);
      const end = Number(el.dataset.count);
      if (!Number.isFinite(end)) return;
      if (reduced) { el.textContent = end.toLocaleString("fa-IR"); return; }
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / 1400, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - t, 4))).toLocaleString("fa-IR");
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }), { threshold: 0.65 });
    counters.forEach((el) => counterObserver?.observe(el));
    const cleanups: Array<() => void> = [];
    if (!reduced && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      document.querySelectorAll<HTMLElement>(".pricing-platform-card,.pricing-service-card,.pricing-step,.pricing-range-panel").forEach((card) => {
        const move = (event: PointerEvent) => {
          const rect = card.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;
          card.style.setProperty("--pointer-x", (x * 100) + "%");
          card.style.setProperty("--pointer-y", (y * 100) + "%");
          if (card.classList.contains("pricing-platform-card") || card.classList.contains("pricing-step"))
            card.style.transform = `perspective(850px) rotateX(${(0.5-y)*5}deg) rotateY(${(x-0.5)*5}deg) translateY(-4px)`;
        };
        const leave = () => card.style.removeProperty("transform");
        card.addEventListener("pointermove", move);
        card.addEventListener("pointerleave", leave);
        cleanups.push(() => { card.removeEventListener("pointermove", move); card.removeEventListener("pointerleave", leave); });
      });
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      progress.remove();
      revealObserver?.disconnect();
      counterObserver?.disconnect();
      cleanups.forEach((fn) => fn());
    };
  }, []);
  return null;
}
