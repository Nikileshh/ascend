"use client";

import { usePlan } from "@/lib/usePlan";
import { Card } from "@/components/ui/Card";
import { HabitTracker } from "@/components/ui/HabitTracker";

export default function HabitsPage() {
  const { plan, habitLog, error } = usePlan();
  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!plan)
    return <p className="animate-pulse text-sm text-zinc-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
        Habit tracker
      </h1>
      <Card>
        <HabitTracker
          habits={plan.habits.map((h) => h.name)}
          initialLog={habitLog}
        />
      </Card>
      <Card title="Why these habits">
        <ul className="space-y-3">
          {plan.habits.map((h) => (
            <li key={h.name} className="text-sm">
              <span className="font-medium text-black dark:text-white">
                {h.name}
              </span>{" "}
              <span className="text-xs text-blue-600 dark:text-blue-400">
                {h.frequency}
              </span>
              <p className="text-zinc-600 dark:text-zinc-400">{h.why}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
