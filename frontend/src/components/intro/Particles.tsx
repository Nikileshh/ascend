"use client";

import { useEffect, useRef } from "react";

interface Mote {
  x: number; // 0..1 fraction of width
  y: number; // 0..1 fraction of height
  r: number;
  rise: number;
  sway: number;
  phase: number;
  alpha: number;
}

/**
 * Canvas dust motes drifting upward with a gentle sine sway.
 * Runs on requestAnimationFrame; disabled entirely under reduced motion.
 */
export function Particles({
  count = 42,
  rgb = "230, 213, 184",
}: {
  count?: number;
  rgb?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const motes: Mote[] = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.6 + 0.5,
      rise: Math.random() * 0.00035 + 0.00012,
      sway: Math.random() * 0.0025 + 0.001,
      phase: Math.random() * Math.PI * 2,
      alpha: Math.random() * 0.3 + 0.08,
    }));

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        m.y -= m.rise * dt;
        m.phase += 0.0008 * dt;
        if (m.y < -0.03) {
          m.y = 1.03;
          m.x = Math.random();
        }
        const x = (m.x + Math.sin(m.phase) * m.sway * 8) * w;
        const y = m.y * h;
        ctx.beginPath();
        ctx.arc(x, y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${m.alpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [count, rgb]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}
