// All knobs for the cinematic intro live here: colors, timings, and copy.
export const introConfig = {
  colors: {
    night: "#070b1a",
    nightGlow: "#1b2550",
    gold: "#d4af37",
    goldLight: "#f3d98b",
  },
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
