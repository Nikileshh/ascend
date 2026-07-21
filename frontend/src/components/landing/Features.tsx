import { ScrollReveal } from "./ScrollReveal";

const features = [
  {
    title: "Dynamic Adaptation",
    description:
      "Skipped three days? Ascend never punishes you. It analyzes what happened, recalculates, generates a new roadmap, and adjusts your schedule — keeping you motivated instead of guilty.",
    icon: "↻",
  },
  {
    title: "Command Center Dashboard",
    description:
      "Today's mission, priority tasks, habits, deep work timer, goal progress, streaks, countdown, and AI insights — everything in one calm view.",
    icon: "▦",
  },
  {
    title: "Analytics That Matter",
    description:
      "Habit completion, deep work hours, consistency, focus trends, mood, sleep, and energy — everything becomes visual, so you always know if you're on track.",
    icon: "◔",
  },
  {
    title: "AI Memory",
    description:
      "Ascend remembers your preferences, working hours, strengths, weaknesses, past failures, and past wins. Every recommendation becomes more personal over time.",
    icon: "◈",
  },
  {
    title: "Gamification",
    description:
      "XP, levels, badges, milestones, daily and weekly challenges, and goal completion certificates. Progress feels rewarding.",
    icon: "★",
  },
  {
    title: "Daily AI Coach",
    description:
      "Every morning, your coach tells you what to do today, why it matters, and what your highest-impact task is. No decisions to make — just begin.",
    icon: "✦",
  },
];

const scores = [
  { label: "Productivity Score", value: "92" },
  { label: "Discipline Score", value: "87" },
  { label: "Focus Score", value: "78" },
  { label: "Streak", value: "23 days" },
];

export function Features() {
  return (
    <section id="features" className="mx-auto w-full max-w-6xl px-6 py-28">
      <ScrollReveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-4xl font-medium tracking-tight text-[#1f1a14] sm:text-6xl">
          A system that adapts to your life
        </h2>
        <p className="mt-5 text-lg leading-8 text-[#6b6155]">
          Life changes. Plans should too. Every feature exists to answer one
          question: does this increase your probability of achieving your goal?
        </p>
      </ScrollReveal>

      <ScrollReveal className="mt-12 grid gap-4 sm:grid-cols-4" stagger={0.08}>
        {scores.map((score) => (
          <div
            key={score.label}
            className="rounded-2xl border border-[#1f1a14]/[0.09] bg-gradient-to-b from-white to-[#faf6ee] p-6 text-center backdrop-blur-xl"
          >
            <p className="text-3xl font-semibold tracking-tight text-[#1f1a14]">
              {score.value}
            </p>
            <p className="mt-1 text-sm text-[#9a8f80]">{score.label}</p>
          </div>
        ))}
      </ScrollReveal>

      <ScrollReveal
        className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        stagger={0.1}
      >
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-3xl border border-[#1f1a14]/[0.09] bg-gradient-to-b from-white to-[#faf6ee] p-8 backdrop-blur-xl transition-colors hover:border-[#d9622b]/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d9622b] to-[#b04d18] text-lg text-white shadow-[0_0_18px_rgba(217,98,43,0.3)]">
              {feature.icon}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[#1f1a14]">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#6b6155]">
              {feature.description}
            </p>
          </div>
        ))}
      </ScrollReveal>
    </section>
  );
}
