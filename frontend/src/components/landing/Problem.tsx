const dreams = [
  "UPSC Officer",
  "Entrepreneur",
  "Software Engineer",
  "Fitness Athlete",
  "Financially Independent",
  "Content Creator",
  "Top Student",
];

const blockers = [
  "Where to begin",
  "What to learn first",
  "What to do today",
  "How much time is required",
  "Whether they are on track",
  "How to recover after falling behind",
];

export function Problem() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-black sm:text-5xl dark:text-white">
          Millions dream. Few execute.
        </h2>
        <p className="mt-4 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          It&apos;s not a lack of motivation. Most people never achieve their
          goals because no one shows them the path.
        </p>
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        {dreams.map((dream) => (
          <span
            key={dream}
            className="rounded-full border border-black/10 px-4 py-1.5 text-sm text-zinc-700 dark:border-white/15 dark:text-zinc-300"
          >
            {dream}
          </span>
        ))}
      </div>

      <div className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {blockers.map((blocker) => (
          <div
            key={blocker}
            className="rounded-2xl border border-black/5 bg-white p-6 dark:border-white/10 dark:bg-zinc-900"
          >
            <p className="text-sm font-medium text-zinc-500">
              They don&apos;t know
            </p>
            <p className="mt-1 text-base font-medium text-black dark:text-white">
              {blocker}
            </p>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-16 max-w-2xl text-center text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        Productivity apps help you organize tasks.{" "}
        <strong className="text-black dark:text-white">
          Ascend helps you achieve outcomes.
        </strong>
      </p>
    </section>
  );
}
