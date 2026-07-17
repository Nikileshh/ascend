"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll-triggered stagger reveal (GSAP ScrollTrigger).
 * The wrapper's direct children fade-slide up one after another when the
 * block scrolls into view. Make this element the grid/flex container so
 * each card staggers individually. Skipped under prefers-reduced-motion.
 */
export function ScrollReveal({
  children,
  className = "",
  stagger = 0.1,
  y = 36,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.from(el.children, {
        opacity: 0,
        y,
        duration: 0.9,
        ease: "power3.out",
        stagger,
        force3D: true,
        scrollTrigger: { trigger: el, start: "top 82%" },
      });
    }, ref);
    return () => ctx.revert();
  }, [stagger, y]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
