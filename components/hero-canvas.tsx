"use client";

import { useEffect, useRef } from "react";

type Node = { x: number; y: number; vx: number; vy: number; r: number; hue: number };

export default function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0, height = 0, frame = 0, running = true;
    let nodes: Node[] = [];
    const mouse = { x: -999, y: -999 };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width; height = rect.height;
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.round(clampValue((width * height) / 15000, 24, 80));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width, y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: 1 + Math.random() * 1.8, hue: Math.random() < 0.28 ? 258 : 196,
      }));
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      for (const node of nodes) {
        if (!reduce) {
          node.x += node.vx; node.y += node.vy;
          if (node.x < -10) node.x = width + 10; else if (node.x > width + 10) node.x = -10;
          if (node.y < -10) node.y = height + 10; else if (node.y > height + 10) node.y = -10;
          const dx = node.x - mouse.x, dy = node.y - mouse.y, dist = Math.hypot(dx, dy);
          if (dist < 130 && dist > 0) { node.x += (dx / dist) * 1.1; node.y += (dy / dist) * 1.1; }
        }
      }
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 125) {
            context.strokeStyle = `hsla(${a.hue},90%,70%,${(1 - d / 125) * 0.22})`;
            context.lineWidth = 1;
            context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke();
          }
        }
        const m = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (m < 170) {
          context.strokeStyle = `hsla(${a.hue},95%,75%,${(1 - m / 170) * 0.5})`;
          context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(mouse.x, mouse.y); context.stroke();
        }
        context.fillStyle = `hsla(${a.hue},95%,78%,.85)`;
        context.beginPath(); context.arc(a.x, a.y, a.r, 0, Math.PI * 2); context.fill();
      }
      if (running && !reduce) frame = requestAnimationFrame(draw);
    };

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left; mouse.y = event.clientY - rect.top;
    };
    const onLeave = () => { mouse.x = -999; mouse.y = -999; };
    const observer = new IntersectionObserver(([entry]) => {
      const visible = entry.isIntersecting;
      if (visible && !running) { running = true; frame = requestAnimationFrame(draw); }
      if (!visible) { running = false; cancelAnimationFrame(frame); }
    });
    resize();
    draw();
    observer.observe(canvas);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      running = false; cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener("resize", resize); window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className="hx-canvas" aria-hidden="true" />;
}

function clampValue(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
