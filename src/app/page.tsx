export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col items-center gap-6 px-8 text-center">
        <span className="rounded-full border border-black/10 px-4 py-1 text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-400">
          Coming soon
        </span>
        <h1 className="text-6xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Ascend
        </h1>
        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Turn your goals into a personalized execution system. Your AI coach
          for roadmaps, schedules, and habits — so you always know what to do
          next.
        </p>
      </main>
    </div>
  );
}
