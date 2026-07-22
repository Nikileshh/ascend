"use client";

import { usePlan } from "@/lib/usePlan";

export default function RoadmapPage() {
  const { plan, error } = usePlan();
  if (error) return <p className="p-10 text-sm text-[#b5551f]">{error}</p>;
  if (!plan)
    return (
      <p className="animate-pulse p-10 text-sm text-[#6b6155]">Loading…</p>
    );

  return (
    <main className="mx-auto max-w-[820px] px-5 py-10 sm:px-8 sm:py-14 md:px-12">
      <h1 className="font-display text-[32px] leading-tight font-medium tracking-tight text-[#1f1a14] sm:text-[42px]">
        Roadmap
      </h1>
      <p className="mt-2 text-[16px] text-[#6b6155]">
        Your path to “{plan.goal}”, month by month, and week by week.
      </p>

      <div className="relative mt-7 flex flex-col gap-4">
        <div className="absolute top-4 bottom-4 left-[17px] w-px bg-[#1f1a14]/10" />
        {plan.roadmap.map((m, i) => {
          const current = i === 0;
          return (
            <div key={m.month} className="relative flex gap-4">
              <div
                className={`relative z-[1] flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border font-mono text-xs font-semibold ${
                  current
                    ? "border-[#d9622b] bg-[#d9622b] text-white shadow-[0_2px_14px_rgba(217,98,43,0.3)]"
                    : "border-[#1f1a14]/15 bg-white text-[#6b6155]"
                }`}
              >
                {m.month}
              </div>
              <div
                className={`flex-1 rounded-2xl border bg-white/80 p-5 shadow-[0_4px_24px_rgba(24,24,40,0.06)] backdrop-blur-xl ${
                  current ? "border-[#d9622b]/30" : "border-[#1f1a14]/[0.09]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[14.5px] font-semibold text-[#1f1a14]">
                    Month {m.month} · {m.title}
                  </p>
                  {current && (
                    <span className="shrink-0 text-[10.5px] font-semibold tracking-wider text-[#b04d18] uppercase">
                      Current
                    </span>
                  )}
                </div>

                <ul className="mt-2.5 flex flex-col gap-1.5">
                  {m.objectives.map((o) => (
                    <li
                      key={o}
                      className="flex gap-2.5 text-[13px] leading-5 text-[#6b6155]"
                    >
                      <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-[#1f1a14]/25" />
                      {o}
                    </li>
                  ))}
                </ul>

                {m.weeks && m.weeks.length > 0 && (
                  <div className="mt-4 border-t border-[#1f1a14]/[0.09] pt-4">
                    <p className="mb-2.5 text-[11px] font-semibold tracking-wider text-[#9a8f80] uppercase">
                      Weekly breakdown
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {m.weeks.map((w) => (
                        <div
                          key={w.week}
                          className="rounded-xl border border-[#1f1a14]/[0.09] bg-[#d9622b]/[0.04] px-3 py-2.5"
                        >
                          <p className="text-[10.5px] font-semibold tracking-wider text-[#b04d18] uppercase">
                            Week {w.week}
                          </p>
                          <p className="mt-1 text-[12.5px] leading-[18px] text-[#4a4239]">
                            {w.focus}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
