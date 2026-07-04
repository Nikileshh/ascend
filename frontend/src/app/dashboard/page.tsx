"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { usePlan } from "@/lib/usePlan";
import { Card } from "@/components/ui/Card";
import { RichText } from "@/components/ui/RichText";

export default function OverviewPage() {
  const { plan, error } = usePlan();
  const [coach, setCoach] = useState("");

  useEffect(() => {
    api<{ coach: string }>("/agents/briefing")
      .then((r) => setCoach(r.coach))
      .catch(() => {});
  }, []);

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!plan)
    return (
      <p className="animate-pulse text-sm text-zinc-500">Loading your plan…</p>
    );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium tracking-wide text-blue-600 uppercase dark:text-blue-400">
          Your execution system
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-black dark:text-white">
          {plan.goal}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["Difficulty", plan.profile.goalDifficulty],
          ["Timeline", `${plan.profile.estimatedMonths} months`],
          ["Daily effort", `${plan.profile.dailyHours}h/day`],
          ["Confidence", `${plan.profile.confidence}%`],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
          >
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="mt-1 text-xl font-semibold text-black dark:text-white">
              {value}
            </p>
          </div>
        ))}
      </div>

      <Card title="Today's briefing">
        {coach ? (
          <RichText text={coach} />
        ) : (
          <p className="animate-pulse text-sm text-zinc-500">
            Your coach is writing today&apos;s briefing…
          </p>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Roadmap", "/dashboard/roadmap", "See your month-by-month path"],
          ["Timetable", "/dashboard/timetable", "Your day — customize anytime"],
          ["Habits", "/dashboard/habits", "Track today and build streaks"],
        ].map(([title, href, desc]) => (
          <Link
            key={href}
            href={href}
            className="rounded-2xl border border-black/5 bg-white p-5 transition-shadow hover:shadow-lg dark:border-white/10 dark:bg-zinc-900"
          >
            <p className="font-semibold text-black dark:text-white">
              {title} →
            </p>
            <p className="mt-1 text-sm text-zinc-500">{desc}</p>
          </Link>
        ))}
      </div>

      <Link
        href="/onboarding"
        className="inline-block text-sm text-blue-600 dark:text-blue-400"
      >
        ← Start a new goal
      </Link>
    </div>
  );
}
