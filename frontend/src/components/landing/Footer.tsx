"use client";

import { ScrollReveal } from "./ScrollReveal";
import { useCopy } from "@/lib/useCopy";

export function Footer() {
  const copy = useCopy();
  return (
    <footer className="border-t border-[#1f1a14]/[0.08]">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <ScrollReveal>
          {/* Cinematic closing shot: the summit at dusk */}
          <div className="relative overflow-hidden rounded-3xl border border-[#a8721f]/30 px-8 py-20 text-center">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/dashboard-bg.jpg"
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/25" />
            </div>
            <h2 className="font-display relative text-4xl font-medium tracking-tight text-[#f7f1e6] sm:text-5xl">
              {copy["footer.heading"]}
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-lg leading-8 text-[#e8e0d3]">
              {copy["footer.sub"]}
            </p>
            <a
              href="/register"
              className="relative mt-8 inline-block rounded-full bg-gradient-to-b from-[#f2e4c8] to-[#e6c992] px-8 py-3 text-base font-medium text-[#1f1a14] shadow-[0_8px_28px_rgba(199,154,74,0.4)] transition-transform hover:scale-[1.04] active:scale-[0.97]"
            >
              {copy["footer.cta"]}
            </a>
          </div>
        </ScrollReveal>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-[#9a8f80]">
            © {new Date().getFullYear()} Ascend. {copy["footer.tagline"]}
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
