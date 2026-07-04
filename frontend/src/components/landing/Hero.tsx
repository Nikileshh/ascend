import { CoachIllustration } from "./CoachIllustration";

export function Hero() {
  return (
    <section className="relative flex flex-col items-center overflow-hidden px-6 pt-40 pb-24 text-center">
      {/* animated gradient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-blob absolute top-10 left-1/4 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl dark:bg-blue-500/15" />
        <div className="animate-blob absolute top-40 right-1/4 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl [animation-delay:-7s] dark:bg-violet-500/15" />
      </div>

      <span className="animate-fade-up rounded-full border border-black/10 bg-white/70 px-4 py-1 text-sm text-zinc-600 backdrop-blur dark:border-white/15 dark:bg-white/5 dark:text-zinc-400">
        ✨ The world&apos;s first AI Goal Execution System
      </span>
      <h1 className="animate-fade-up-1 mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-black sm:text-7xl dark:text-white">
        You bring the goal.
        <br />
        <span className="animate-shimmer bg-gradient-to-r from-blue-600 via-violet-600 to-blue-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-violet-400 dark:to-blue-400">
          Ascend builds the path.
        </span>
      </h1>
      <p className="animate-fade-up-2 mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
        Ascend is not a habit tracker, a to-do list, or a planner. It&apos;s an
        AI coach that turns your ambition into a personalized execution plan —
        and guides you every day until you achieve it.
      </p>
      <div className="animate-fade-up-3 mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <a
          href="/register"
          className="rounded-full bg-black px-8 py-3 text-base font-medium text-white transition-all hover:scale-105 hover:opacity-90 dark:bg-white dark:text-black"
        >
          Get started
        </a>
        <a
          href="#how-it-works"
          className="rounded-full border border-black/10 px-8 py-3 text-base font-medium text-black transition-colors hover:bg-black/5 dark:border-white/15 dark:text-white dark:hover:bg-white/10"
        >
          See how it works
        </a>
      </div>

      <div className="animate-float mt-16 flex justify-center">
        <CoachIllustration />
      </div>

      <div className="mt-12 w-full max-w-3xl rounded-3xl border border-black/5 bg-white p-8 text-left shadow-xl shadow-black/5 dark:border-white/10 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-lg text-white">
            ✦
          </div>
          <div>
            <p className="text-sm font-medium text-black dark:text-white">
              Your AI Coach
            </p>
            <p className="text-xs text-zinc-500">Today, 6:00 AM</p>
          </div>
        </div>
        <div className="mt-5 space-y-3 text-[15px] leading-7 text-zinc-700 dark:text-zinc-300">
          <p>Good morning.</p>
          <p>
            You have{" "}
            <strong className="text-black dark:text-white">126 days</strong>{" "}
            remaining to achieve your goal. Yesterday you completed{" "}
            <strong className="text-black dark:text-white">89%</strong> of your
            plan, and your consistency has improved by{" "}
            <strong className="text-black dark:text-white">6%</strong>.
          </p>
          <p>
            Today&apos;s highest-impact task is finishing your revision before
            lunch. Let&apos;s begin.
          </p>
        </div>
      </div>
    </section>
  );
}
