/**
 * Registry of admin-editable website wording.
 *
 * Every field here appears in the admin → Content tab. The defaults below are
 * what the site shows out of the box; anything the admin saves is stored in
 * the backend (`siteCopy`) and overrides the default. Clearing a field in the
 * admin restores the default.
 */

export interface CopyField {
  key: string;
  label: string;
  multiline?: boolean;
  default: string;
}

export interface CopySection {
  title: string;
  hint: string;
  fields: CopyField[];
}

export const COPY_SECTIONS: CopySection[] = [
  {
    title: "Hero (top of landing page)",
    hint: "The first thing every visitor reads.",
    fields: [
      {
        key: "hero.badge",
        label: "Badge line",
        default: "✨ The world's first AI Goal Execution System",
      },
      {
        key: "hero.title1",
        label: "Headline — line 1",
        default: "You bring the goal.",
      },
      {
        key: "hero.title2",
        label: "Headline — line 2 (gold)",
        default: "Ascend builds the path.",
      },
      {
        key: "hero.sub",
        label: "Subheadline",
        multiline: true,
        default:
          "Ascend is not a habit tracker, a to-do list, or a planner. It's an AI coach that turns your ambition into a personalized execution plan, then guides you every day until you achieve it.",
      },
      { key: "hero.cta1", label: "Primary button", default: "Get started" },
      {
        key: "hero.cta2",
        label: "Secondary button",
        default: "See how it works",
      },
    ],
  },
  {
    title: "Problem section",
    hint: "The 'Millions dream' argument for why Ascend exists.",
    fields: [
      {
        key: "problem.heading",
        label: "Heading",
        default: "Millions dream. Few execute.",
      },
      {
        key: "problem.sub",
        label: "Subtext",
        multiline: true,
        default:
          "It's not a lack of motivation. Most people never achieve their goals because no one shows them the path.",
      },
      {
        key: "problem.closing",
        label: "Closing line",
        default: "Productivity apps help you organize tasks.",
      },
      {
        key: "problem.closingBold",
        label: "Closing line (bold part)",
        default: "Ascend helps you achieve outcomes.",
      },
    ],
  },
  {
    title: "Pricing section",
    hint: "Wording only — the actual price charged comes from settings.",
    fields: [
      {
        key: "pricing.heading",
        label: "Heading",
        default: "One plan. One week free.",
      },
      {
        key: "pricing.sub",
        label: "Subtext",
        multiline: true,
        default:
          "Try Ascend free for 7 days, then ₹250/month. No tiers, no upsells.",
      },
      {
        key: "pricing.description",
        label: "Plan card description",
        multiline: true,
        default:
          "One plan. Everything included. Start with a 7-day free trial. No card required.",
      },
      {
        key: "pricing.trialNote",
        label: "Trial fine print",
        multiline: true,
        default:
          "The 7-day trial unlocks every feature, with up to 10 AI actions a day. Premium removes the limit.",
      },
    ],
  },
  {
    title: "Scene breaks (dark mountain bands)",
    hint: "The two cinematic statements between landing sections.",
    fields: [
      {
        key: "scene1.heading",
        label: "Opening statement (coffee desk)",
        default: "The summit is earned daily.",
      },
      {
        key: "scene1.sub",
        label: "Opening statement — subtext",
        multiline: true,
        default:
          "Not in bursts of motivation, but in small scheduled wins that stack.",
      },
      {
        key: "scene3.heading",
        label: "Middle statement (misty hills)",
        default: "Some days you can't see the summit.",
      },
      {
        key: "scene3.sub",
        label: "Middle statement — subtext",
        multiline: true,
        default:
          "Walk anyway. The path is still under your feet, and your plan knows the way.",
      },
      {
        key: "scene2.heading",
        label: "Closing statement (forest road)",
        default: "Discipline is a system, not a mood.",
      },
      {
        key: "scene2.sub",
        label: "Closing statement — subtext",
        multiline: true,
        default:
          "Ascend plans your day so showing up is the only decision left.",
      },
    ],
  },
  {
    title: "Closing quote & footer",
    hint: "The big statement at the bottom of the landing page.",
    fields: [
      {
        key: "footer.heading",
        label: "Quote headline",
        default: "The operating system for personal growth",
      },
      {
        key: "footer.sub",
        label: "Quote subtext",
        multiline: true,
        default:
          "Don't open Ascend to check tasks. Open it to know what to do today, why it matters, and what your next best action is.",
      },
      { key: "footer.cta", label: "Button", default: "Start your ascent" },
      {
        key: "footer.tagline",
        label: "Copyright tagline",
        default: "You bring the goal. Ascend builds the path.",
      },
    ],
  },
];

export const DEFAULT_COPY: Record<string, string> = Object.fromEntries(
  COPY_SECTIONS.flatMap((s) => s.fields.map((f) => [f.key, f.default])),
);
