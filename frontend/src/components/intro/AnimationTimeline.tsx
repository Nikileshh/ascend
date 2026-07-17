"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Playfair_Display } from "next/font/google";
import { Background } from "./Background";
import { Particles } from "./Particles";
import { Logo } from "./Logo";
import { InkMask } from "./InkMask";
import { introConfig, type IntroConfig } from "./config";

gsap.registerPlugin(ScrollTrigger);

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
function getReducedMotion() {
  return window.matchMedia(REDUCED_QUERY).matches;
}

/**
 * Scroll-driven cinematic opener.
 *
 * The night scene lives in a FIXED overlay above the page while a spacer
 * provides the scroll distance. Scroll progress scrubs the GSAP timeline:
 * the logo drifts up and fades, the liquid ink mask rises, and in the
 * final stretch the whole overlay fades out — landing exactly on the top
 * of the real landing page with no dead space. Scrolling back up plays
 * everything in reverse.
 *
 * Under prefers-reduced-motion: a plain static first screen, no overlay,
 * no spacer, normal scrolling.
 */
export function AscendIntro({
  config = introConfig,
}: {
  config?: IntroConfig;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );

  useEffect(() => {
    if (reduced) return;

    const ctx = gsap.context(() => {
      // Ambient motion (time-based, not scroll-based)
      gsap.to(".kb-layer", {
        scale: 1.03,
        duration: config.kenBurnsDuration,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        force3D: true,
      });
      gsap.utils.toArray<SVGPathElement>(".ink-blob").forEach((blob, i) => {
        gsap.to(blob, {
          scaleX: 1 + 0.18 + (i % 3) * 0.06,
          scaleY: 1 - 0.12 - (i % 4) * 0.04,
          rotation: i % 2 === 0 ? 7 : -6,
          transformOrigin: "50% 50%",
          duration: 1 + (i % 5) * 0.22,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      // Scroll-scrubbed sequence over the spacer's height:
      // 0 → 0.85: liquid rises (logo fades in the first half)
      // 0.85 → 1: overlay fades away, revealing the page top underneath
      gsap
        .timeline({
          scrollTrigger: {
            trigger: ".intro-spacer",
            start: "top top",
            end: "bottom top",
            scrub: config.scroll.scrub,
          },
        })
        .to(
          ".intro-logo",
          { opacity: 0, y: -70, ease: "none", duration: 0.5 },
          0,
        )
        .to(".intro-cue", { opacity: 0, ease: "none", duration: 0.15 }, 0)
        .to(
          ".ink-rise",
          { y: -30, ease: "none", duration: 0.85, force3D: true },
          0,
        )
        .to(
          ".intro-overlay",
          { autoAlpha: 0, ease: "none", duration: 0.15 },
          0.85,
        );
    }, rootRef);

    return () => ctx.revert();
  }, [config, reduced]);

  const c = config.colors;
  const vars = {
    "--intro-night": c.night,
    "--intro-night-glow": c.nightGlow,
    "--intro-gold": c.gold,
    "--intro-gold-light": c.goldLight,
    "--intro-serif": `${playfair.style.fontFamily}, Georgia, serif`,
  } as React.CSSProperties;

  if (reduced) {
    return (
      <section
        aria-label="Ascend — the AI goal execution system"
        className="relative h-[100svh] w-full overflow-hidden"
        style={{ background: c.night, ...vars }}
      >
        <Background image={config.backgroundImage} />
        <Logo title={config.logo.title} tagline={config.logo.tagline} />
      </section>
    );
  }

  return (
    <div ref={rootRef} style={vars}>
      {/* provides the scroll distance for the wipe; the page content sits
          right after it, so when the overlay fades the hero is at the top */}
      <div
        className="intro-spacer"
        style={{ height: `${config.scroll.distance}svh` }}
        aria-hidden
      />

      <section
        aria-label="Ascend — the AI goal execution system"
        className="intro-overlay pointer-events-none fixed inset-0 z-[60] overflow-hidden"
        style={{ background: c.night, willChange: "opacity" }}
      >
        <Background image={config.backgroundImage} />
        <Particles />

        <div
          className="intro-logo absolute inset-0"
          style={{ willChange: "transform, opacity" }}
        >
          <Logo title={config.logo.title} tagline={config.logo.tagline} />
        </div>

        <InkMask />

        <div
          className="intro-cue absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-xs tracking-[0.3em] uppercase"
          style={{ color: "rgba(230, 213, 184, 0.75)" }}
        >
          <span className="flex flex-col items-center gap-2">
            Scroll
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              className="animate-bounce"
              aria-hidden
            >
              <path
                d="M2 4 L7 10 L12 4"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </div>
      </section>
    </div>
  );
}
