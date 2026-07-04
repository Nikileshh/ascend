"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { usePlan } from "@/lib/usePlan";
import { Card } from "@/components/ui/Card";
import { buttonClass, inputClass } from "@/components/ui/AuthCard";

interface Slot {
  time: string;
  activity: string;
}

export default function TimetablePage() {
  const { plan, error: loadError } = usePlan();
  // draft is non-null only while editing; saved holds customizations
  const [draft, setDraft] = useState<Slot[] | null>(null);
  const [savedSlots, setSavedSlots] = useState<Slot[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);

  if (loadError) return <p className="text-sm text-red-500">{loadError}</p>;
  if (!plan)
    return <p className="animate-pulse text-sm text-zinc-500">Loading…</p>;

  const current = savedSlots ?? plan.timetable;
  const editing = draft !== null;

  async function saveTimetable() {
    setSaving(true);
    setError("");
    setSavedNotice(false);
    try {
      const r = await api<{ timetable: Slot[] }>("/agents/timetable", {
        method: "PATCH",
        body: { timetable: draft },
      });
      setSavedSlots(r.timetable);
      setDraft(null);
      setSavedNotice(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function update(i: number, field: keyof Slot, value: string) {
    setDraft(draft!.map((s, j) => (j === i ? { ...s, [field]: value } : s)));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
            Your daily timetable
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Couldn&apos;t finish a task, or life changed? Rearrange it your way
            — reminders follow whatever you set here.
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => {
              setDraft(current);
              setSavedNotice(false);
            }}
            className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            Customize
          </button>
        )}
      </div>

      {savedNotice && (
        <p className="rounded-2xl border border-green-500/30 bg-green-50 px-4 py-2 text-sm text-green-700 dark:bg-green-500/10 dark:text-green-300">
          Timetable saved ✓
        </p>
      )}

      <Card>
        {editing ? (
          <div className="space-y-3">
            {draft.map((slot, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={slot.time}
                  onChange={(e) => update(i, "time", e.target.value)}
                  className={`${inputClass} !w-40 shrink-0`}
                  placeholder="06:00 - 07:00"
                />
                <input
                  value={slot.activity}
                  onChange={(e) => update(i, "activity", e.target.value)}
                  className={inputClass}
                  placeholder="Activity"
                />
                <button
                  aria-label="Remove slot"
                  onClick={() => setDraft(draft.filter((_, j) => j !== i))}
                  className="shrink-0 rounded-full px-2 text-lg text-zinc-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => setDraft([...draft, { time: "", activity: "" }])}
              className="text-sm text-blue-600 dark:text-blue-400"
            >
              + Add a slot
            </button>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button
                onClick={saveTimetable}
                disabled={saving}
                className={buttonClass}
              >
                {saving ? "Saving…" : "Save timetable"}
              </button>
              <button
                onClick={() => {
                  setDraft(null);
                  setError("");
                }}
                className="rounded-full border border-black/10 px-6 py-2.5 text-sm font-medium text-black dark:border-white/15 dark:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-black/5 text-sm dark:divide-white/10">
            {current.map((slot, i) => (
              <li key={i} className="flex gap-4 py-2.5">
                <span className="w-36 shrink-0 font-medium text-zinc-500">
                  {slot.time}
                </span>
                <span className="text-zinc-800 dark:text-zinc-200">
                  {slot.activity}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
