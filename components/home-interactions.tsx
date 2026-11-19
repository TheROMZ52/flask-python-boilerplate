"use client";

import { useEffect } from "react";

const codeSamples = [
  "const server = await nexvor.boot();",
  "plugins.register(customPlugin);",
  "world.optimize({ performance: true });",
  "if (server.ready) return success;",
  "import { GameServer } from 'nexvor';",
  "config.set('online-mode', true);",
  "function buildProject() { ... }",
  "await database.connect();",
  "const players = server.getOnlinePlayers();",
  "console.log('NexvorDEV initialized');",
  "server.listen(25565);",
  "return { status: 'READY' };",
];

export default function HomeInteractions() {
  useEffect(() => {
    let frame = 0;
    const streams = Array.from(document.querySelectorAll<HTMLElement>(".code-stream"));
    const updateCode = () => {
      streams.forEach((stream, column) => {
        stream.querySelectorAll("span").forEach((line, index) => {
          line.textContent = codeSamples[(frame + column * 2 + index) % codeSamples.length];
        });
      });
      frame = (frame + 1) % codeSamples.length;
    };
    const timer = window.setInterval(updateCode, 1250);
    updateCode();

    const root = document.documentElement;
    const updateProgress = () => {
      const scrollable = root.scrollHeight - window.innerHeight;
      root.style.setProperty("--scroll-progress", scrollable > 0 ? `${(window.scrollY / scrollable) * 100}%` : "0%");
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    document.body.classList.add("motion-ready");
    const revealItems = document.querySelectorAll(".section-heading, .platform-card, .service-card, .price-card, .step, .contact-panel");
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    revealItems.forEach((item, index) => {
      (item as HTMLElement).style.setProperty("--reveal-delay", `${(index % 4) * 85}ms`);
      item.classList.add("reveal-item");
      revealObserver.observe(item);
    });

    const cards = document.querySelectorAll<HTMLElement>(".platform-card, .service-card, .price-card");
    const canTilt = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const tiltMove = (event: PointerEvent) => {
      const card = event.currentTarget as HTMLElement;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.style.setProperty("--pointer-x", `${x * 100}%`);
      card.style.setProperty("--pointer-y", `${y * 100}%`);
      card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 5}deg) rotateY(${(x - 0.5) * 6}deg) translateY(-5px)`;
    };
    const tiltReset = (event: PointerEvent) => {
      (event.currentTarget as HTMLElement).style.transform = "";
    };
    if (canTilt) cards.forEach((card) => {
      card.addEventListener("pointermove", tiltMove);
      card.addEventListener("pointerleave", tiltReset);
    });

    const hero = document.querySelector<HTMLElement>(".hero");
    const moveGlow = (event: PointerEvent) => {
      if (!hero || !canTilt) return;
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty("--glow-x", `${event.clientX - rect.left}px`);
      hero.style.setProperty("--glow-y", `${event.clientY - rect.top}px`);
    };
    hero?.addEventListener("pointermove", moveGlow);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      revealObserver.disconnect();
      cards.forEach((card) => {
        card.removeEventListener("pointermove", tiltMove);
        card.removeEventListener("pointerleave", tiltReset);
      });
      hero?.removeEventListener("pointermove", moveGlow);
      document.body.classList.remove("motion-ready");
    };
  }, []);

  return null;
}
