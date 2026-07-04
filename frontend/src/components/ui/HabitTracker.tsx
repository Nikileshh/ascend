"use client";

import { useState } from "react";
import { api } from "@/lib/api";

type Status = "done" | "missed";
type HabitLog = Record<string, Record<string, Status>>;

// 14 days starting from today, so the tracker begins the day the plan starts
function trackedDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export function HabitTracker({
  habits,
  initialLog,
}: {
  habits: string[];
  initialLog: HabitLog;
}) {
  const [log, setLog] = useState<HabitLog>(initialLog);
  const days = trackedDays(14);
  const today = days[0];

  async function toggle(date: string, habit: string) {
    const current = log[date]?.[habit];
    // click cycles: empty → done (green) → missed (red) → empty
    const next: "done" | "missed" | "clear" =
      current === "done" ? "missed" : current === "missed" ? "clear" : "done";
    const optimistic = structuredClone(log);
    optimistic[date] ??= {};
    if (next === "clear") delete optimistic[date][habit];
    else optimistic[date][habit] = next;
    setLog(optimistic);
    try {
      await api("/agents/habits/log", { body: { date, habit, status: next } });
    } catch {
      setLog(log); // revert on failure
    }
  }

  function dayScore(date: string) {
    const marked = log[date] ?? {};
    const done = habits.filter((h) => marked[h] === "done").length;
    return Math.round((done / habits.length) * 100);
  }

  const todayScore = dayScore(today);

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-lg font-semibold text-white">
          {todayScore}%
        </div>
        <div>
          <p className="text-sm font-medium text-black dark:text-white">
            Today&apos;s productivity score
          </p>
          <p className="text-xs text-zinc-500">
            Click a cell to mark a habit: green = done, red = missed, click
            again to clear.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-xs">
          <thead>
            <tr>
              <th className="min-w-40 text-left font-medium text-zinc-500">
                Habit
              </th>
              {days.map((d) => (
                <th
                  key={d}
                  className={`px-1 text-center font-normal ${d === today ? "font-semibold text-blue-600 dark:text-blue-400" : "text-zinc-400"}`}
                >
                  <span className="block">
                    {new Date(d).toLocaleDateString("en", { month: "short" })}
                  </span>
                  {new Date(d).getDate()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => (
              <tr key={habit}>
                <td className="pr-2 text-zinc-700 dark:text-zinc-300">
                  {habit}
                </td>
                {days.map((d) => {
                  const status = log[d]?.[habit];
                  return (
                    <td key={d}>
                      <button
                        aria-label={`${habit} on ${d}: ${status ?? "not marked"}`}
                        onClick={() => toggle(d, habit)}
                        className={`h-7 w-7 rounded-md border transition-colors ${
                          status === "done"
                            ? "border-green-600 bg-green-500"
                            : status === "missed"
                              ? "border-red-600 bg-red-500"
                              : "border-black/10 bg-zinc-100 hover:bg-zinc-200 dark:border-white/10 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td className="pt-2 pr-2 font-medium text-zinc-500">
                Daily score
              </td>
              {days.map((d) => {
                const score = dayScore(d);
                return (
                  <td
                    key={d}
                    className={`pt-2 text-center font-medium ${
                      score >= 70
                        ? "text-green-600 dark:text-green-400"
                        : score > 0
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-zinc-400"
                    }`}
                  >
                    {score}%
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
