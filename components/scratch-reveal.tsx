"use client";

import { useCallback, useEffect, useRef } from "react";

const MINECRAFT_IMAGE = "/images/minecraft-scratch.jpg";
const COUNTER_STRIKE_IMAGE = "/images/counter-strike-scratch.jpg";

export default function ScratchReveal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const paintCover = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image?.complete || !image.naturalWidth) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
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
    const image = new Image();
    image.src = MINECRAFT_IMAGE;
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
    };
  }, [paintCover]);

  const eraseAt = (event: React.PointerEvent<HTMLCanvasElement>) => {
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
    <div className="scratch-reveal">
      <img className="scratch-reveal-underlay" src={COUNTER_STRIKE_IMAGE} alt="تصویر کانتر استرایک" />
      <canvas
        ref={canvasRef}
        className="scratch-reveal-canvas"
        aria-label="برای نمایان شدن تصویر کانتر استرایک، تصویر ماینکرفت را با موس یا لمس پاک کن"
        onPointerDown={(event) => {
          drawingRef.current = true;
          lastPointRef.current = null;
          event.currentTarget.setPointerCapture(event.pointerId);
          eraseAt(event);
        }}
        onPointerMove={(event) => {
          if (drawingRef.current) eraseAt(event);
        }}
        onPointerUp={() => {
          drawingRef.current = false;
          lastPointRef.current = null;
        }}
        onPointerCancel={() => {
          drawingRef.current = false;
          lastPointRef.current = null;
        }}
      />
      <div className="scratch-reveal-hint" aria-hidden="true"><span className="scratch-hint-dot" /> با موس بکش یا با انگشت لمس کن</div>
      <button className="scratch-reveal-reset" type="button" onClick={reset}>شروع دوباره ↻</button>
    </div>
  );
}
