const audiences = [
  "Students",
  "UPSC Aspirants",
  "GATE Aspirants",
  "Entrepreneurs",
  "Founders",
  "Freelancers",
  "Professionals",
  "Fitness Enthusiasts",
  "Content Creators",
];

export function Audience() {
  return (
    <section className="border-y border-black/5 bg-zinc-50 dark:border-white/10 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-6xl px-6 py-24 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-black sm:text-5xl dark:text-white">
          Built for anyone with a meaningful goal
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {audiences.map((audience) => (
            <span
              key={audience}
              className="rounded-full border border-black/10 bg-white px-5 py-2 text-sm font-medium text-zinc-700 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-300"
            >
              {audience}
            </span>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          If you&apos;re working toward a meaningful long-term goal, Ascend is
          for you.
        </p>
      </div>
    </section>
  );
}
