"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

const MINECRAFT_IMAGE = "/images/minecraft-scratch.jpg";
const COUNTER_STRIKE_IMAGE = "/images/counter-strike-scratch.jpg";
const optimizedImage = (src: string) => `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=75`;

export default function ScratchReveal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const underlayRef = useRef<HTMLImageElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const paintCover = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image?.complete || !image.naturalWidth) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const scale = Math.max(rect.width / image.naturalWidth, rect.height / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.clearRect(0, 0, rect.width, rect.height);
    context.drawImage(image, (rect.width - width) / 2, (rect.height - height) / 2, width, height);
  }, []);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 981px) and (hover: hover) and (pointer: fine)");
    if (!desktop.matches) return;
    const underlay = underlayRef.current;
    if (underlay) underlay.src = optimizedImage(COUNTER_STRIKE_IMAGE);
    const image = new Image();
    image.decoding = "async";
    image.fetchPriority = "low";
    image.src = optimizedImage(MINECRAFT_IMAGE);
    image.onload = () => {
      imageRef.current = image;
      paintCover();
    };
    const observer = new ResizeObserver(paintCover);
    if (canvasRef.current) observer.observe(canvasRef.current);
    window.addEventListener("resize", paintCover);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", paintCover);
      image.onload = null;
    };
  }, [paintCover]);

  const eraseAt = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const rect = canvas.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const previous = lastPointRef.current ?? point;
    const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
    const steps = Math.max(1, Math.ceil(distance / 8));
    context.save();
    context.globalCompositeOperation = "destination-out";
    for (let index = 0; index <= steps; index++) {
      const x = previous.x + ((point.x - previous.x) * index) / steps;
      const y = previous.y + ((point.y - previous.y) * index) / steps;
      const radius = Math.min(62, Math.max(38, rect.width * 0.045));
      const gradient = context.createRadialGradient(x, y, radius * 0.18, x, y, radius);
      gradient.addColorStop(0, "rgba(0,0,0,1)");
      gradient.addColorStop(0.72, "rgba(0,0,0,.94)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
    lastPointRef.current = point;
  };

  const reset = () => {
    lastPointRef.current = null;
    paintCover();
  };

  return (
    <div className="scratch-reveal scratch-reveal-background">
      <img ref={underlayRef} className="scratch-reveal-underlay" alt="تصویر کانتر استرایک" decoding="async" fetchPriority="low" />
      <canvas
        ref={canvasRef}
        className="scratch-reveal-canvas"
        aria-label="برای نمایان شدن تصویر کانتر استرایک، تصویر ماینکرفت را با موس یا لمس پاک کن"
        onPointerMove={(event) => {
          if (event.pointerType === "mouse") eraseAt(event);
        }}
      />
      <div className="scratch-reveal-hint" aria-hidden="true"><span className="scratch-hint-dot" /> با موس بکش یا با انگشت لمس کن</div>
      <button className="scratch-reveal-reset" type="button" onClick={reset}>شروع دوباره ↻</button>
    </div>
  );
}
