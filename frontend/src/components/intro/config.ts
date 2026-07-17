// All knobs for the cinematic intro live here: colors, timings, and copy.
export const introConfig = {
  colors: {
    night: "#0a0a0a",
    nightGlow: "#1a1713",
    // beige typography over the photo background
    gold: "#e6d5b8",
    goldLight: "#f5ead6",
  },
  /** photo shown behind the logo (place the file in frontend/public/) */
  backgroundImage: "/intro-bg.jpg",
  scroll: {
    /** how much scrolling (as % of viewport height) the wipe takes */
    distance: 130,
    /** scrub smoothing in seconds (0 = locked to scroll) */
    scrub: 0.8,
  },
  /** one full Ken Burns breath (zoom in, then back), seconds */
  kenBurnsDuration: 9,
  logo: {
    title: "ASCEND",
    tagline: "The AI Goal Execution System",
  },
} as const;

export type IntroConfig = typeof introConfig;
