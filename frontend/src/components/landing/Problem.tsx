"use client";

import { ScrollReveal } from "./ScrollReveal";
import { useCopy } from "@/lib/useCopy";

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
  const copy = useCopy();
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-28">
      <ScrollReveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-4xl font-medium tracking-tight text-[#1f1a14] sm:text-6xl">
          {copy["problem.heading"]}
        </h2>
        <p className="mt-5 text-lg leading-8 text-[#6b6155]">
          {copy["problem.sub"]}
        </p>
      </ScrollReveal>

      <ScrollReveal
        className="mt-12 flex flex-wrap justify-center gap-3"
        stagger={0.06}
        y={20}
      >
        {dreams.map((dream) => (
          <span
            key={dream}
            className="rounded-full border border-[#1f1a14]/[0.09] bg-white/55 px-4 py-1.5 text-sm text-[#4a4239] backdrop-blur-xl"
          >
            {dream}
          </span>
        ))}
      </ScrollReveal>

      <ScrollReveal
        className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3"
        stagger={0.08}
      >
        {blockers.map((blocker) => (
          <div
            key={blocker}
            className="rounded-2xl border border-[#1f1a14]/[0.09] bg-white/60 p-6 backdrop-blur-xl transition-colors hover:border-[#d9622b]/40"
          >
            <p className="text-sm font-medium text-[#9a8f80]">
              They don&apos;t know
            </p>
            <p className="mt-1 text-base font-medium text-[#1f1a14]">
              {blocker}
            </p>
          </div>
        ))}
      </ScrollReveal>

      <ScrollReveal className="mx-auto mt-16 max-w-2xl text-center">
        <p className="text-lg leading-8 text-[#6b6155]">
          {copy["problem.closing"]}{" "}
          <strong className="font-semibold text-[#1f1a14]">
            {copy["problem.closingBold"]}
          </strong>
        </p>
      </ScrollReveal>
    </section>
  );
}
