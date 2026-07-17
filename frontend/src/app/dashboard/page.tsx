"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, getUser } from "@/lib/api";
import { useIsClient } from "@/lib/useIsClient";
import { usePlan } from "@/lib/usePlan";
import { GlassCard, CoachBadge } from "@/components/ui/Glass";
import { RichText } from "@/components/ui/RichText";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// "05:30 - 07:30" → minutes range
function slotRange(time: string) {
  const m = time.match(/^(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return {
    start: parseInt(m[1]) * 60 + parseInt(m[2]),
    end: parseInt(m[3]) * 60 + parseInt(m[4]),
  };
}

export default function OverviewPage() {
  const { plan, habitLog, error } = usePlan();
  const [coach, setCoach] = useState("");
  // The user's clicks this session, layered over the server's habit log.
  const [touched, setTouched] = useState<Record<string, "done" | "clear">>({});

  const todayKey = new Date().toISOString().slice(0, 10);

  // Greeting and date are client-only values (clock + localStorage), derived
  // at render once hydration completes.
  const isClient = useIsClient();
  const user = isClient ? getUser() : null;
  const hello = isClient
    ? `${greeting()}, ${user ? user.name.split(" ")[0] : "there"}`
    : "Welcome";
  const today = isClient
    ? new Date().toLocaleDateString("en", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "";

  useEffect(() => {
    api<{ coach: string }>("/agents/briefing")
      .then((r) => setCoach(r.coach))
      .catch(() => {});
  }, []);

  const marked: Record<string, string> = { ...(habitLog[todayKey] ?? {}) };
  for (const [habit, status] of Object.entries(touched)) {
    if (status === "clear") delete marked[habit];
    else marked[habit] = "done";
  }

  if (error) return <p className="p-10 text-sm text-[#b5551f]">{error}</p>;
  if (!plan)
    return (
      <p className="animate-pulse p-10 text-sm text-[#6b6155]">
        Loading your plan…
      </p>
    );

  async function toggleHabit(habit: string) {
    const next = marked[habit] === "done" ? "clear" : "done";
    setTouched((t) => ({ ...t, [habit]: next }));
    try {
      await api("/agents/habits/log", {
        body: { date: todayKey, habit, status: next },
      });
    } catch {
      setTouched((t) => {
        const rest = { ...t }; // revert this click
        delete rest[habit];
        return rest;
      });
    }
  }

  const doneCount = plan.habits.filter((h) => marked[h.name] === "done").length;
  const pct = Math.round((doneCount / plan.habits.length) * 100);
  const C = 326.73;

  // schedule window: previous slot, current, and the next few
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
  let nowIdx = plan.timetable.findIndex((s) => {
    const r = slotRange(s.time);
    return r && nowMins >= r.start && nowMins < r.end;
  });
  if (nowIdx === -1)
    nowIdx = plan.timetable.findIndex((s) => {
      const r = slotRange(s.time);
      return r && r.start > nowMins;
    });
  const from = Math.max(0, (nowIdx === -1 ? 0 : nowIdx) - 1);
  const windowSlots = plan.timetable.slice(from, from + 5);

  return (
    <main className="mx-auto max-w-[1120px] px-5 py-10 sm:px-8 sm:py-14 md:px-12">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-[36px] leading-[1.08] font-medium tracking-tight text-[#1f1a14] sm:text-[52px] sm:leading-[1.03] md:text-[64px]">
            {hello}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#a8721f]/30 bg-[#a8721f]/12 px-3.5 py-1.5 text-[13px] font-medium text-[#1f1a14]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#a8721f]" />
              {plan.goal}
            </span>
            <span className="rounded-full border border-[#1f1a14]/[0.09] bg-white/70 px-3 py-1.5 text-xs text-[#6b6155]">
              {plan.profile.goalDifficulty} difficulty
            </span>
            <span className="rounded-full border border-[#1f1a14]/[0.09] bg-white/70 px-3 py-1.5 text-xs text-[#6b6155]">
              {plan.profile.dailyHours}h / day
            </span>
          </div>
        </div>
        <p className="font-mono text-[13px] text-[#6b6155]">{today}</p>
      </div>

      {/* briefing */}
      <GlassCard gradient className="mt-10">
        <CoachBadge caption="Today's briefing" />
        {coach ? (
          <RichText text={coach} />
        ) : (
          <p className="animate-pulse text-[15px] text-[#6b6155]">
            Your coach is writing today&apos;s briefing…
          </p>
        )}
      </GlassCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* schedule */}
        <GlassCard
          title="Today's schedule"
          className="lg:col-span-3"
          action={
            <Link
              href="/dashboard/timetable"
              className="text-xs text-[#6b6155] transition-colors hover:text-[#1f1a14]"
            >
              Edit timetable →
            </Link>
          }
        >
          <div className="mt-1 flex flex-col">
            {windowSlots.map((slot, i) => {
              const r = slotRange(slot.time);
              const isNow = r ? nowMins >= r.start && nowMins < r.end : false;
              const isPast = r ? nowMins >= r.end : false;
              return (
                <div
                  key={i}
                  className="grid grid-cols-[76px_20px_1fr] gap-2.5 sm:grid-cols-[112px_20px_1fr] sm:gap-3"
                >
                  <p
                    className={`pt-0.5 text-right font-mono text-[11px] break-words sm:text-[12.5px] sm:whitespace-nowrap ${isNow ? "text-[#7d5a1e]" : "text-[#6b6155]"}`}
                  >
                    {slot.time}
                  </p>
                  <div className="flex flex-col items-center">
                    <span
                      className={`mt-1.5 h-[9px] w-[9px] shrink-0 rounded-full border-2 ${
                        isNow
                          ? "animate-pulse border-[#a8721f] bg-[#a8721f]"
                          : isPast
                            ? "border-[#1f1a14]/25 bg-[#1f1a14]/25"
                            : "border-[#1f1a14]/20 bg-transparent"
                      }`}
                    />
                    {i < windowSlots.length - 1 && (
                      <span className="mt-1 w-px flex-1 bg-[#1f1a14]/10" />
                    )}
                  </div>
                  <div className="pb-6">
                    <p
                      className={`text-sm font-medium ${isPast ? "text-[#9a8f80]" : "text-[#1f1a14]"}`}
                    >
                      {slot.activity}
                      {isNow && (
                        <span className="ml-2 text-[11px] font-semibold tracking-wider text-[#7d5a1e] uppercase">
                          Now
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* habits */}
        <GlassCard className="lg:col-span-2">
          <div className="mb-6 flex items-center gap-4">
            <div className="relative h-24 w-24 shrink-0">
              <svg
                width="96"
                height="96"
                viewBox="0 0 128 128"
                className="-rotate-90"
              >
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  fill="none"
                  stroke="rgba(31,26,20,0.1)"
                  strokeWidth="10"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  fill="none"
                  stroke="#a8721f"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - pct / 100)}
                  className="transition-[stroke-dashoffset] duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[22px] font-semibold text-[#1f1a14]">
                {pct}%
              </div>
            </div>
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-[#1f1a14]">
                Today&apos;s habits
              </h2>
              <p className="mt-1.5 text-[12.5px] leading-[18px] text-[#6b6155]">
                {doneCount} of {plan.habits.length} done. Tap to check off.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {plan.habits.map((h) => {
              const done = marked[h.name] === "done";
              return (
                <button
                  key={h.name}
                  onClick={() => toggleHabit(h.name)}
                  className="flex w-full items-center gap-3 rounded-xl border border-[#1f1a14]/[0.09] bg-[#1f1a14]/[0.02] px-3 py-2.5 text-left transition-colors hover:border-[#1f1a14]/15 hover:bg-[#1f1a14]/[0.04]"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-[1.5px] transition-all ${
                      done
                        ? "border-[#a8721f] bg-[#a8721f] shadow-[0_0_14px_rgba(168,114,31,0.3)]"
                        : "border-[#1f1a14]/20 bg-white"
                    }`}
                  >
                    {done && (
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block text-[13.5px] font-medium ${done ? "text-[#9a8f80]" : "text-[#1f1a14]"}`}
                    >
                      {h.name}
                    </span>
                    <span className="mt-px block text-[11px] text-[#9a8f80] capitalize">
                      {h.frequency}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* roadmap strip */}
      <GlassCard className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold tracking-tight text-[#1f1a14]">
            Roadmap
          </h2>
          <span className="font-mono text-xs text-[#6b6155]">
            Month 1 / {plan.profile.estimatedMonths}
          </span>
        </div>
        <p className="mt-3 text-sm font-medium text-[#1f1a14]">
          {plan.roadmap[0]?.title}
        </p>
        <div className="mt-4 h-[5px] overflow-hidden rounded-full bg-[#1f1a14]/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#a8721f] to-[#e6c992] shadow-[0_0_12px_rgba(168,114,31,0.4)]"
            style={{
              width: `${Math.max(4, 100 / plan.profile.estimatedMonths)}%`,
            }}
          />
        </div>
        {plan.roadmap[1] && (
          <p className="mt-3 flex items-center justify-between text-[11.5px] text-[#9a8f80]">
            <span>Next up · {plan.roadmap[1].title}</span>
            <Link
              href="/dashboard/roadmap"
              className="text-[#7d5a1e] hover:underline"
            >
              Full roadmap →
            </Link>
          </p>
        )}
      </GlassCard>
    </main>
  );
}
