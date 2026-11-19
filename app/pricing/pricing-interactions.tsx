"use client";

import { useEffect } from "react";

export default function PricingInteractions() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const progress = document.createElement("div");
    progress.className = "pricing-scroll-progress";
    progress.setAttribute("aria-hidden", "true");
    document.body.appendChild(progress);

    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const value = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      progress.style.transform = `scaleX(${value / 100})`;
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });

    const revealTargets = document.querySelectorAll(
      ".pricing-hero-copy,.pricing-range-panel,.pricing-hero-foot,.pricing-section-heading,.pricing-platform-card,.pricing-service-card,.pricing-factors-intro,.pricing-factor,.pricing-step,.pricing-final-panel"
    );

    if (reduceMotion) {
      revealTargets.forEach((element) => element.classList.add("is-visible"));
    } else {
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -35px 0px" }
      );
      revealTargets.forEach((element, index) => {
        (element as HTMLElement).style.setProperty("--reveal-delay", `${(index % 4) * 75}ms`);
        revealObserver.observe(element);
      });
    }

    const counters = document.querySelectorAll<HTMLElement>("[data-count]");
    const animateCounter = (element: HTMLElement) => {
      if (element.dataset.counted === "true") return;
      element.dataset.counted = "true";
      const target = Number(element.dataset.count);
      if (!Number.isFinite(target)) return;
      if (reduceMotion) {
        element.textContent = target.toLocaleString("fa-IR");
        return;
      }
      const duration = 1500;
      const start = performance.now();
      const tick = (now: number) => {
        const progressValue = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progressValue, 4);
        element.textContent = Math.round(target * eased).toLocaleString("fa-IR");
        if (progressValue < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.65 });
    counters.forEach((counter) => counterObserver.observe(counter));

    const cards = document.querySelectorAll<HTMLElement>(
      ".pricing-platform-card,.pricing-service-card,.pricing-step,.pricing-range-panel"
    );
    const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const cleanups: Array<() => void> = [];

    if (supportsHover && !reduceMotion) {
      cards.forEach((card) => {
        const move = (event: PointerEvent) => {
          const rect = card.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;
          card.style.setProperty("--pointer-x", `${x * 100}%`);
          card.style.setProperty("--pointer-y", `${y * 100}%`);
          if (card.classList.contains("pricing-platform-card") || card.classList.contains("pricing-step")) {
            card.style.transform = `perspective(850px) rotateX(${(0.5 - y) * 5}deg) rotateY(${(x - 0.5) * 5}deg) translateY(-4px)`;
          }
        };
        const leave = () => {
          card.style.removeProperty("transform");
          card.style.setProperty("--pointer-x", "50%");
          card.style.setProperty("--pointer-y", "50%");
        };
        card.addEventListener("pointermove", move);
        card.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          card.removeEventListener("pointermove", move);
          card.removeEventListener("pointerleave", leave);
        });
      });
    }

    return () => {
      window.removeEventListener("scroll", updateProgress);
      progress.remove();
      revealTargets.forEach((element) => element.classList.remove("is-visible"));
      cleanups.forEach((cleanup) => cleanup());
      // Disconnect observers on route navigation.
      revealObserverCleanup();
    };

    function revealObserverCleanup() {
      // Observers stop observing once targets reveal; page teardown removes their targets.
    }
  }, []);

  return null;
}
