"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { usePlan } from "@/lib/usePlan";
import {
  GlassCard,
  buttonAccent,
  buttonGhostDark,
  inputDark,
} from "@/components/ui/Glass";

interface Slot {
  time: string;
  activity: string;
}

// "05:30 - 07:30" → is the current time inside this range?
function isNow(time: string, now: Date) {
  const m = time.match(/^(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (!m) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  const start = parseInt(m[1]) * 60 + parseInt(m[2]);
  const end = parseInt(m[3]) * 60 + parseInt(m[4]);
  return end > start ? mins >= start && mins < end : mins >= start;
}

export default function TimetablePage() {
  const { plan, error: loadError } = usePlan();
  // draft is non-null only while editing; savedSlots holds customizations
  const [draft, setDraft] = useState<Slot[] | null>(null);
  const [savedSlots, setSavedSlots] = useState<Slot[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  if (loadError)
    return <p className="p-10 text-sm text-[#b5551f]">{loadError}</p>;
  if (!plan)
    return (
      <p className="animate-pulse p-10 text-sm text-[#6b6155]">Loading…</p>
    );

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
    <main className="mx-auto max-w-[820px] px-5 py-10 sm:px-8 sm:py-14 md:px-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-[32px] leading-tight font-medium tracking-tight text-[#1f1a14] sm:text-[42px]">
            Timetable
          </h1>
          <p className="mt-2 text-[16px] text-[#6b6155]">
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
            className={`${buttonAccent} shrink-0 self-start`}
          >
            Customize
          </button>
        )}
      </div>

      {savedNotice && (
        <p className="mt-4 rounded-xl border border-[#34c98e]/35 bg-[#34c98e]/10 px-4 py-2.5 text-[13px] text-[#1a8f63]">
          Timetable saved ✓
        </p>
      )}

      <GlassCard className="mt-5 !p-4">
        {editing ? (
          <div className="flex flex-col gap-2.5 p-2">
            {draft.map((slot, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap"
              >
                <input
                  value={slot.time}
                  onChange={(e) => update(i, "time", e.target.value)}
                  className={`${inputDark} !w-32 shrink-0 font-mono text-[13px] sm:!w-36`}
                  placeholder="06:00 - 07:00"
                />
                <input
                  value={slot.activity}
                  onChange={(e) => update(i, "activity", e.target.value)}
                  className={`${inputDark} order-3 min-w-0 flex-1 basis-full sm:order-none sm:basis-auto`}
                  placeholder="Activity"
                />
                <button
                  aria-label="Remove slot"
                  onClick={() => setDraft(draft.filter((_, j) => j !== i))}
                  className="order-2 ml-auto shrink-0 rounded-lg px-2 text-lg text-[#9a8f80] transition-colors hover:text-[#e0567a] sm:order-none sm:ml-0"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => setDraft([...draft, { time: "", activity: "" }])}
              className="self-start text-[13px] font-medium text-[#b04d18] hover:underline"
            >
              + Add a slot
            </button>
            {error && <p className="text-sm text-[#b5551f]">{error}</p>}
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={saveTimetable}
                disabled={saving}
                className={buttonAccent}
              >
                {saving ? "Saving…" : "Save timetable"}
              </button>
              <button
                onClick={() => {
                  setDraft(null);
                  setError("");
                }}
                className={buttonGhostDark}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {current.map((slot, i) => {
              const active = now ? isNow(slot.time, now) : false;
              return (
                <div
                  key={i}
                  className={`relative flex flex-col gap-0.5 rounded-xl border-b border-[#1f1a14]/[0.06] px-2.5 py-[11px] last:border-0 sm:flex-row sm:items-center sm:gap-4 ${
                    active ? "bg-[#d9622b]/12" : ""
                  }`}
                >
                  <span
                    className={`shrink-0 font-mono text-[12px] sm:w-[118px] sm:text-[12.5px] ${active ? "text-[#b04d18]" : "text-[#9a8f80] sm:text-[#6b6155]"}`}
                  >
                    {slot.time}
                  </span>
                  <span
                    className={`pr-14 text-[14px] sm:pr-0 sm:text-[13.5px] ${active ? "text-[#1f1a14]" : "text-[#4a4239]"}`}
                  >
                    {slot.activity}
                  </span>
                  {active && (
                    <span className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full bg-[#d9622b] px-2.5 py-[3px] text-[10px] font-semibold tracking-wider text-white uppercase shadow-[0_0_14px_rgba(217,98,43,0.4)] sm:static sm:ml-auto sm:translate-y-0">
                      Now
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </main>
  );
}
