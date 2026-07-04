const plan = {
  name: "Ascend",
  price: "₹250",
  period: "/month",
  description:
    "One plan. Everything included. Start with a 1-week free trial — no card required.",
  features: [
    "Unlimited goals & AI analyses",
    "Full personalized roadmap with milestones",
    "Daily adaptive timetable",
    "Habit system & streak coaching",
    "Weekly AI progress reviews",
    "AI coach that adapts to you",
  ],
  trialNote:
    "Free trial includes a preview AI analysis. Full features unlock with the plan.",
};

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-black sm:text-5xl dark:text-white">
          One plan. One week free.
        </h2>
        <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Try Ascend free for 7 days, then ₹250/month. No tiers, no upsells.
        </p>
      </div>

      <div className="mx-auto mt-14 max-w-lg">
        <div className="flex flex-col rounded-3xl border border-blue-600 bg-white p-8 shadow-xl shadow-blue-600/10 dark:border-blue-400 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-black dark:text-white">
              {plan.name}
            </h3>
            <span className="rounded-full bg-blue-600 px-3 py-0.5 text-xs font-medium text-white dark:bg-blue-400 dark:text-black">
              1-week free trial
            </span>
          </div>
          <p className="mt-4">
            <span className="text-4xl font-semibold tracking-tight text-black dark:text-white">
              {plan.price}
            </span>
            <span className="text-sm text-zinc-500"> {plan.period}</span>
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {plan.description}
          </p>
          <ul className="mt-6 flex-1 space-y-3">
            {plan.features.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <span className="text-blue-600 dark:text-blue-400">✓</span>
                {feature}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-zinc-500">{plan.trialNote}</p>
          <a
            href="/register"
            className="mt-6 rounded-full bg-blue-600 px-6 py-2.5 text-center text-sm font-medium text-white transition-opacity hover:opacity-80 dark:bg-blue-400 dark:text-black"
          >
            Start free trial
          </a>
        </div>
      </div>
    </section>
  );
}
