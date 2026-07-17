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
    return d.toLocaleDateString("en-CA"); // YYYY-MM-DD in the user's timezone
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
    // click cycles: empty → done (accent) → missed (rose) → empty
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
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#a8721f]/30 bg-[#a8721f]/12 text-base font-semibold text-[#7d5a1e] shadow-[0_2px_12px_rgba(168,114,31,0.18)]">
          {todayScore}%
        </div>
        <div>
          <p className="text-sm font-semibold text-[#1f1a14]">
            Today&apos;s productivity score
          </p>
          <p className="mt-1 text-xs text-[#6b6155]">
            Click a cell to mark a habit — gold = done, red = missed, click
            again to clear.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-xs">
          <thead>
            <tr>
              <th className="min-w-24 text-left font-medium text-[#9a8f80] sm:min-w-40">
                Habit
              </th>
              {days.map((d) => (
                <th
                  key={d}
                  className={`px-1 text-center font-mono text-[10px] ${d === today ? "font-semibold text-[#7d5a1e]" : "font-normal text-[#9a8f80]"}`}
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
                <td className="max-w-28 pr-2 leading-tight text-[#4a4239] sm:max-w-none">
                  {habit}
                </td>
                {days.map((d) => {
                  const status = log[d]?.[habit];
                  return (
                    <td key={d}>
                      <button
                        aria-label={`${habit} on ${d}: ${status ?? "not marked"}`}
                        onClick={() => toggle(d, habit)}
                        className={`h-[26px] w-[26px] rounded-lg border transition-all hover:scale-110 active:scale-90 ${
                          status === "done"
                            ? "border-[#a8721f] bg-[#a8721f] shadow-[0_0_10px_rgba(168,114,31,0.3)]"
                            : status === "missed"
                              ? "border-[#DC2626] bg-[#DC2626]"
                              : "border-[#1f1a14]/10 bg-[#1f1a14]/[0.03] hover:bg-[#1f1a14]/[0.06]"
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td className="pt-2 pr-2 font-medium text-[#9a8f80]">
                Daily score
              </td>
              {days.map((d) => {
                const score = dayScore(d);
                return (
                  <td
                    key={d}
                    className={`pt-2 text-center font-mono text-[10px] font-semibold ${
                      score >= 70
                        ? "text-[#10B981]"
                        : score > 0
                          ? "text-[#F59E0B]"
                          : "text-[#c9bfae]"
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
