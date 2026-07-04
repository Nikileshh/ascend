"use client";

/**
 * Night-ascent scene: starfield sky, moon glow, and three layered mountain
 * ridges. The whole layer carries the Ken Burns zoom (class "kb-layer",
 * animated by AnimationTimeline via GSAP), so it only ever moves on the
 * GPU compositor (transform, translate3d).
 */
export function Background() {
  return (
    <div
      className="kb-layer absolute inset-0"
      style={{
        transform: "translate3d(0,0,0) scale(1)",
        willChange: "transform",
        background:
          "linear-gradient(180deg, var(--intro-night) 0%, var(--intro-night-glow) 62%, #0c1230 100%)",
      }}
    >
      {/* stars */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,.9) 50%, transparent 51%)," +
            "radial-gradient(1px 1px at 28% 34%, rgba(255,255,255,.55) 50%, transparent 51%)," +
            "radial-gradient(1.5px 1.5px at 41% 12%, rgba(255,255,255,.8) 50%, transparent 51%)," +
            "radial-gradient(1px 1px at 57% 26%, rgba(255,255,255,.5) 50%, transparent 51%)," +
            "radial-gradient(1.5px 1.5px at 68% 9%, rgba(255,255,255,.85) 50%, transparent 51%)," +
            "radial-gradient(1px 1px at 79% 31%, rgba(255,255,255,.6) 50%, transparent 51%)," +
            "radial-gradient(1px 1px at 89% 15%, rgba(255,255,255,.75) 50%, transparent 51%)," +
            "radial-gradient(1px 1px at 8% 44%, rgba(255,255,255,.4) 50%, transparent 51%)," +
            "radial-gradient(1.5px 1.5px at 94% 41%, rgba(255,255,255,.5) 50%, transparent 51%)," +
            "radial-gradient(1px 1px at 49% 39%, rgba(255,255,255,.45) 50%, transparent 51%)",
        }}
      />

      {/* moon glow behind the peak */}
      <div
        className="absolute top-[12%] left-1/2 h-[46vmin] w-[46vmin] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(243,217,139,0.22) 0%, rgba(243,217,139,0.07) 45%, transparent 70%)",
        }}
      />

      {/* mountain ridges */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[62%] w-full"
        viewBox="0 0 100 60"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 60 L0 34 L12 22 L22 30 L34 14 L46 27 L60 8 L74 24 L86 16 L100 30 L100 60 Z"
          fill="#141b3a"
          opacity="0.75"
        />
        <path
          d="M0 60 L0 42 L10 34 L24 41 L38 26 L52 38 L66 20 L82 36 L92 30 L100 38 L100 60 Z"
          fill="#0e1430"
          opacity="0.92"
        />
        <path
          d="M0 60 L0 50 L14 43 L30 50 L44 40 L60 50 L72 36 L88 48 L100 44 L100 60 Z"
          fill="#080d22"
        />
        {/* a tiny gold summit marker on the highest peak */}
        <circle cx="60" cy="7.2" r="0.7" fill="var(--intro-gold)">
          <animate
            attributeName="opacity"
            values="0.4;1;0.4"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>

      {/* low mist */}
      <div
        className="absolute inset-x-0 bottom-0 h-[30%]"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(20,27,58,0.55) 60%, rgba(7,11,26,0.9))",
        }}
      />
    </div>
  );
}
