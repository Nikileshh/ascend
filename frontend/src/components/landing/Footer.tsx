import { ScrollReveal } from "./ScrollReveal";

export function Footer() {
  return (
    <footer className="border-t border-[#1f1a14]/[0.08]">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl border border-[#a8721f]/30 bg-gradient-to-br from-[#a8721f]/25 via-[#7d5a1e]/15 to-transparent px-8 py-16 text-center backdrop-blur-xl">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#a8721f]/30 blur-[80px]"
            />
            <h2 className="font-display relative text-4xl font-medium tracking-tight text-[#1f1a14] sm:text-5xl">
              The operating system for personal growth
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-lg leading-8 text-[#4a4239]">
              Don&apos;t open Ascend to check tasks. Open it to know what to do
              today, why it matters, and what your next best action is.
            </p>
            <a
              href="/register"
              className="relative mt-8 inline-block rounded-full bg-white px-8 py-3 text-base font-medium text-[#1f1a14] transition-transform hover:scale-[1.04] active:scale-[0.97]"
            >
              Start your ascent
            </a>
          </div>
        </ScrollReveal>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-[#9a8f80]">
            © {new Date().getFullYear()} Ascend. You bring the goal. Ascend
            builds the path.
          </p>
          <div className="flex gap-6 text-sm text-[#9a8f80]">
            <a
              href="#how-it-works"
              className="transition-colors hover:text-[#1f1a14]"
            >
              How it works
            </a>
            <a
              href="#features"
              className="transition-colors hover:text-[#1f1a14]"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="transition-colors hover:text-[#1f1a14]"
            >
              Pricing
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
