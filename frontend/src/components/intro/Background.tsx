"use client";

/**
 * Photo backdrop for the opening scene. The whole layer carries the
 * Ken Burns zoom (class "kb-layer", animated by AnimationTimeline via
 * GSAP), so it only ever moves on the GPU compositor.
 *
 * A soft vignette sits over the photo to keep the beige logo readable.
 * If the image file is missing, the dark base color shows instead.
 */
export function Background({ image }: { image: string }) {
  return (
    <div
      className="kb-layer absolute inset-0"
      style={{
        transform: "translate3d(0,0,0) scale(1)",
        willChange: "transform",
        background:
          "linear-gradient(180deg, var(--intro-night) 0%, var(--intro-night-glow) 100%)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=""
        draggable={false}
        onError={(e) => (e.currentTarget.style.display = "none")}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* vignette for text legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.62) 100%)",
        }}
      />
    </div>
  );
}
