export function Footer() {
  return (
    <footer className="border-t border-black/5 dark:border-white/10">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-violet-700 px-8 py-16 text-center text-white">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            The operating system for personal growth
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-blue-100">
            Don&apos;t open Ascend to check tasks. Open it to know what to do
            today, why it matters, and what your next best action is.
          </p>
          <a
            href="#pricing"
            className="mt-8 inline-block rounded-full bg-white px-8 py-3 text-base font-medium text-blue-700 transition-opacity hover:opacity-90"
          >
            Start your ascent
          </a>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} Ascend. You bring the goal. Ascend
            builds the path.
          </p>
          <div className="flex gap-6 text-sm text-zinc-500">
            <a
              href="#how-it-works"
              className="hover:text-black dark:hover:text-white"
            >
              How it works
            </a>
            <a
              href="#features"
              className="hover:text-black dark:hover:text-white"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="hover:text-black dark:hover:text-white"
            >
              Pricing
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
