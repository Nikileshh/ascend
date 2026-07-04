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
    <section id="features" className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-black sm:text-5xl dark:text-white">
          A system that adapts to your life
        </h2>
        <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Life changes. Plans should too. Every feature exists to answer one
          question: does this increase your probability of achieving your goal?
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-4">
        {scores.map((score) => (
          <div
            key={score.label}
            className="rounded-2xl border border-black/5 bg-white p-6 text-center dark:border-white/10 dark:bg-zinc-900"
          >
            <p className="text-3xl font-semibold tracking-tight text-black dark:text-white">
              {score.value}
            </p>
            <p className="mt-1 text-sm text-zinc-500">{score.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-3xl border border-black/5 bg-white p-8 dark:border-white/10 dark:bg-zinc-900"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-lg text-white">
              {feature.icon}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-black dark:text-white">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
