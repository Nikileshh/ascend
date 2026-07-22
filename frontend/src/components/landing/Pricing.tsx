"use client";

import { ScrollReveal } from "./ScrollReveal";
import { useCopy } from "@/lib/useCopy";

const plan = {
  name: "Ascend",
  price: "₹250",
  period: "/month",
  features: [
    "Unlimited goals & AI analyses",
    "Full personalized roadmap with milestones",
    "Daily adaptive timetable",
    "Habit system & streak coaching",
    "Weekly AI progress reviews",
    "AI coach that adapts to you",
  ],
};

export function Pricing() {
  const copy = useCopy();
  return (
    <section id="pricing" className="mx-auto w-full max-w-6xl px-6 py-28">
      <ScrollReveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-4xl font-medium tracking-tight text-[#1f1a14] sm:text-6xl">
          {copy["pricing.heading"]}
        </h2>
        <p className="mt-5 text-lg leading-8 text-[#6b6155]">
          {copy["pricing.sub"]}
        </p>
      </ScrollReveal>

      <ScrollReveal className="mx-auto mt-14 max-w-lg">
        <div className="flex flex-col rounded-3xl border border-[#d9622b]/40 bg-gradient-to-br from-[#d9622b]/12 via-white/[0.03] to-white/[0.03] p-8 shadow-[0_0_60px_rgba(199,154,74,0.18)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#1f1a14]">
              {plan.name}
            </h3>
            <span className="rounded-full bg-gradient-to-br from-[#d9622b] to-[#b04d18] px-3 py-1 text-xs font-medium text-white shadow-[0_0_16px_rgba(217,98,43,0.32)]">
              7-day free trial
            </span>
          </div>
          <p className="mt-4">
            <span className="text-4xl font-semibold tracking-tight text-[#1f1a14]">
              {plan.price}
            </span>
            <span className="text-sm text-[#6b6155]"> {plan.period}</span>
          </p>
          <p className="mt-2 text-sm text-[#6b6155]">
            {copy["pricing.description"]}
          </p>
          <ul className="mt-6 flex-1 space-y-3">
            {plan.features.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2.5 text-sm text-[#4a4239]"
              >
                <span className="text-[#d9622b]">✓</span>
                {feature}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-[#9a8f80]">
            {copy["pricing.trialNote"]}
          </p>
          <a
            href="/register"
            className="mt-6 rounded-full bg-gradient-to-b from-[#2a231b] to-[#1f1a14] px-6 py-3 text-center text-sm font-medium text-[#f7f1e6] shadow-[0_8px_24px_rgba(31,26,20,0.24)] transition-all duration-200 hover:-translate-y-0.5"
          >
            Start free trial
          </a>
        </div>
      </ScrollReveal>
    </section>
  );
}
