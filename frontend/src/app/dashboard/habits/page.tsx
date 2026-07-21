"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { usePlan } from "@/lib/usePlan";
import { GlassCard, buttonAccent, inputDark } from "@/components/ui/Glass";
import { HabitTracker } from "@/components/ui/HabitTracker";

interface Habit {
  name: string;
  frequency: string;
  why: string;
}

// A library of high-leverage habits users can add with one tap.
const SUGGESTED: Habit[] = [
  {
    name: "Deep Work",
    frequency: "daily",
    why: "One protected, distraction-free block moves the goal more than a scattered day.",
  },
  {
    name: "Read 20 Min",
    frequency: "daily",
    why: "Twenty focused minutes a day compounds into deep knowledge over months.",
  },
  {
    name: "Exercise",
    frequency: "daily",
    why: "Physical energy is the base every productive day is built on.",
  },
  {
    name: "Sleep by 11",
    frequency: "daily",
    why: "A fixed sleep time protects tomorrow's focus before the day even starts.",
  },
  {
    name: "Plan Tomorrow",
    frequency: "daily",
    why: "Deciding tonight removes morning friction and decision fatigue.",
  },
  {
    name: "No Phone AM",
    frequency: "daily",
    why: "A quiet first hour sets a calm, intentional tone for the whole day.",
  },
  {
    name: "Weekly Review",
    frequency: "weekly",
    why: "A regular review keeps the plan honest and catches drift early.",
  },
  {
    name: "Journal",
    frequency: "daily",
    why: "Writing clears the head and surfaces what actually matters.",
  },
  {
    name: "Hydrate",
    frequency: "daily",
    why: "Steady hydration is the simplest lever for consistent energy and focus.",
  },
];

export default function HabitsPage() {
  const { plan, habitLog, error } = usePlan();
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  // seed local state from the plan once it loads
  const list = habits ?? plan?.habits ?? [];

  if (error) return <p className="p-10 text-sm text-[#b5551f]">{error}</p>;
  if (!plan)
    return (
      <p className="animate-pulse p-10 text-sm text-[#6b6155]">Loading…</p>
    );

  async function addHabit(h: {
    name: string;
    frequency: string;
    why?: string;
  }) {
    const clean = h.name.trim();
    if (!clean || busy) return;
    if (list.some((x) => x.name.toLowerCase() === clean.toLowerCase())) {
      setNotice(`"${clean}" is already in your habits.`);
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const r = await api<{ habits: Habit[] }>("/agents/habits", {
        body: { name: clean, frequency: h.frequency, why: h.why },
      });
      setHabits(r.habits);
      setName("");
    } catch (err) {
      setNotice((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function removeHabit(habitName: string) {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      const r = await api<{ habits: Habit[] }>(
        `/agents/habits/${encodeURIComponent(habitName)}`,
        { method: "DELETE" },
      );
      setHabits(r.habits);
    } catch (err) {
      setNotice((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const available = SUGGESTED.filter(
    (s) => !list.some((h) => h.name.toLowerCase() === s.name.toLowerCase()),
  );

  return (
    <main className="mx-auto max-w-[880px] px-5 py-10 sm:px-8 sm:py-14 md:px-12">
      <h1 className="font-display text-[32px] leading-tight font-medium tracking-tight text-[#1f1a14] sm:text-[42px]">
        Habits
      </h1>
      <p className="mt-2 text-[16px] text-[#6b6155]">
        Small daily wins that compound toward your goal. Add your own, or pick
        from proven ones below.
      </p>

      <GlassCard className="mt-6">
        <HabitTracker
          key={list.map((h) => h.name).join("|")}
          habits={list.map((h) => h.name)}
          initialLog={habitLog}
        />
      </GlassCard>

      {/* Add / customize habits */}
      <GlassCard title="Add a habit" className="mt-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && addHabit({ name, frequency })
            }
            placeholder="e.g. Revise notes"
            maxLength={40}
            className={`${inputDark} !w-auto flex-1`}
          />
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className={`${inputDark} !w-auto`}
          >
            <option value="daily">daily</option>
            <option value="weekdays">weekdays</option>
            <option value="weekly">weekly</option>
          </select>
          <button
            onClick={() => addHabit({ name, frequency })}
            disabled={busy || !name.trim()}
            className={buttonAccent}
          >
            Add
          </button>
        </div>
        {notice && <p className="mt-3 text-[13px] text-[#DC2626]">{notice}</p>}

        {available.length > 0 && (
          <div className="mt-5">
            <p className="mb-2.5 text-[11px] font-semibold tracking-wider text-[#9a8f80] uppercase">
              Suggested productive habits
            </p>
            <div className="flex flex-wrap gap-2">
              {available.map((s) => (
                <button
                  key={s.name}
                  onClick={() => addHabit(s)}
                  disabled={busy}
                  title={s.why}
                  className="rounded-full border border-[#d9622b]/25 bg-[#d9622b]/[0.06] px-3.5 py-1.5 text-[12.5px] font-medium text-[#b04d18] transition-colors hover:bg-[#d9622b]/12 disabled:opacity-50"
                >
                  + {s.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard title="Your habits" className="mt-5">
        <div className="flex flex-col gap-4">
          {list.map((h) => (
            <div
              key={h.name}
              className="flex items-start justify-between gap-3"
            >
              <div>
                <p className="flex items-center gap-2 text-[13.5px] font-medium text-[#1f1a14]">
                  {h.name}
                  <span className="rounded-full border border-[#1f1a14]/10 bg-[#1f1a14]/[0.04] px-2.5 py-0.5 text-[10.5px] text-[#6b6155] capitalize">
                    {h.frequency}
                  </span>
                </p>
                <p className="mt-1 text-[12.5px] leading-[19px] text-[#6b6155]">
                  {h.why}
                </p>
              </div>
              <button
                aria-label={`Remove ${h.name}`}
                onClick={() => removeHabit(h.name)}
                disabled={busy || list.length <= 1}
                title={
                  list.length <= 1 ? "Keep at least one habit" : "Remove habit"
                }
                className="shrink-0 rounded-lg px-2 py-0.5 text-lg text-[#9a8f80] transition-colors hover:text-[#DC2626] disabled:opacity-30"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </GlassCard>
    </main>
  );
}
