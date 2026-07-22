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

      {/* Free trial vs Premium — what each gives you */}
      <ScrollReveal
        className="mx-auto mt-8 grid max-w-lg gap-4 sm:grid-cols-2"
        stagger={0.08}
      >
        <div className="rounded-2xl border border-[#1f1a14]/[0.1] bg-white/70 p-6 backdrop-blur-xl">
          <p className="text-[15px] font-semibold text-[#1f1a14]">Free trial</p>
          <p className="mt-0.5 text-xs text-[#9a8f80]">7 days, no card</p>
          <ul className="mt-4 space-y-2.5 text-[13.5px] text-[#4a4239]">
            <li className="flex gap-2">
              <span className="text-[#d9622b]">✓</span> Every feature unlocked
            </li>
            <li className="flex gap-2">
              <span className="text-[#d9622b]">✓</span> 10 AI actions a day
            </li>
            <li className="flex gap-2">
              <span className="text-[#9a8f80]">·</span> Locks after 7 days
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-[#d9622b]/40 bg-[#d9622b]/[0.06] p-6 backdrop-blur-xl">
          <p className="text-[15px] font-semibold text-[#1f1a14]">Premium ✦</p>
          <p className="mt-0.5 text-xs text-[#b04d18]">₹250 / month</p>
          <ul className="mt-4 space-y-2.5 text-[13.5px] text-[#4a4239]">
            <li className="flex gap-2">
              <span className="text-[#d9622b]">✓</span> Everything in the trial
            </li>
            <li className="flex gap-2">
              <span className="text-[#d9622b]">✓</span> Unlimited AI, every day
            </li>
            <li className="flex gap-2">
              <span className="text-[#d9622b]">✓</span> Yours as long as you
              subscribe
            </li>
          </ul>
        </div>
      </ScrollReveal>
    </section>
  );
}
