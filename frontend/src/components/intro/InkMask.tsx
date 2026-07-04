"use client";

/**
 * Liquid scroll wipe. A full-screen SVG whose reveal layer (colored to
 * match the landing page background) is shown through an SVG <mask>.
 * The mask's white content is a group (.ink-rise) of irregular wobbling
 * blobs riding a huge rect. The scroll-scrubbed GSAP timeline in
 * AnimationTimeline translates the group upward, so the night scene
 * dissolves organically into the page below as the user scrolls.
 *
 * viewBox is 0 0 100 100 with preserveAspectRatio="none", so the same
 * geometry stretches to every screen size.
 */

// Irregular blob outlines (hand-drawn, roughly centered on y=0)
const BLOB_PATHS = [
  "M-6 4 C -4 -4, 4 -7, 9 -3 C 14 1, 12 7, 5 8 C -1 9, -8 10, -6 4 Z",
  "M-7 3 C -6 -5, 2 -9, 8 -5 C 13 -2, 14 5, 7 7 C 0 9, -8 9, -7 3 Z",
  "M-8 2 C -7 -6, 0 -8, 6 -6 C 12 -4, 13 3, 8 6 C 2 9, -9 8, -8 2 Z",
];

// Positions along the rising edge: [cx, scale]
const BLOBS: [number, number][] = [
  [-2, 1.6],
  [10, 1.1],
  [21, 1.9],
  [33, 1.2],
  [44, 2.1],
  [55, 1.3],
  [66, 1.8],
  [77, 1.15],
  [88, 2.0],
  [99, 1.4],
  [106, 1.7],
];

export function InkMask() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <mask id="ascend-ink-mask" maskUnits="userSpaceOnUse">
          <rect x="-20" y="-20" width="140" height="140" fill="black" />
          {/* starts fully below the viewport (translate 0,120) */}
          <g
            className="ink-rise"
            style={{ willChange: "transform" }}
            transform="translate(0,120)"
          >
            <rect x="-20" y="0" width="140" height="260" fill="white" />
            {BLOBS.map(([cx, s], i) => (
              <g key={i} transform={`translate(${cx}, 0.5)`}>
                <path
                  className="ink-blob"
                  d={BLOB_PATHS[i % BLOB_PATHS.length]}
                  fill="white"
                  transform={`scale(${s})`}
                />
              </g>
            ))}
          </g>
        </mask>
      </defs>

      {/* reveal layer — matches the landing page background so the wipe
          hands off seamlessly into the page content */}
      <g mask="url(#ascend-ink-mask)">
        <rect
          x="-1"
          y="-1"
          width="102"
          height="102"
          className="fill-white dark:fill-black"
        />
      </g>
    </svg>
  );
}
