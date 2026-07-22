"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { usePlan } from "@/lib/usePlan";
import {
  buttonAccent,
  buttonGhostDark,
  inputDark,
} from "@/components/ui/Glass";

interface Week {
  week: number;
  focus: string;
}
interface Month {
  month: number;
  title: string;
  objectives: string[];
  weeks: Week[];
}

export default function RoadmapPage() {
  const { plan, error } = usePlan();
  const [draft, setDraft] = useState<Month[] | null>(null);
  const [saved, setSaved] = useState<Month[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [notice, setNotice] = useState(false);

  if (error) return <p className="p-10 text-sm text-[#b5551f]">{error}</p>;
  if (!plan)
    return (
      <p className="animate-pulse p-10 text-sm text-[#6b6155]">Loading…</p>
    );

  const roadmap: Month[] = saved ?? (plan.roadmap as Month[]);
  const editing = draft !== null;

  function setMonth(i: number, patch: Partial<Month>) {
    setDraft((d) => d!.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  }

  async function save() {
    setSaving(true);
    setSaveErr("");
    try {
      const r = await api<{ roadmap: Month[] }>("/agents/roadmap", {
        method: "PATCH",
        body: { roadmap: draft },
      });
      setSaved(r.roadmap);
      setDraft(null);
      setNotice(true);
    } catch (err) {
      setSaveErr((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-[820px] px-5 py-10 sm:px-8 sm:py-14 md:px-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-[32px] leading-tight font-medium tracking-tight text-[#1f1a14] sm:text-[42px]">
            Roadmap
          </h1>
          <p className="mt-2 text-[16px] text-[#6b6155]">
            Your path to “{plan.goal}”, month by month, and week by week.
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => {
              setDraft(JSON.parse(JSON.stringify(roadmap)));
              setNotice(false);
            }}
            className={`${buttonAccent} shrink-0 self-start`}
          >
            Customize
          </button>
        )}
      </div>

      {notice && (
        <p className="mt-4 rounded-xl border border-[#34c98e]/35 bg-[#34c98e]/10 px-4 py-2.5 text-[13px] text-[#1a8f63]">
          Roadmap saved ✓
        </p>
      )}

      {editing ? (
        <div className="mt-6 flex flex-col gap-4">
          {draft.map((m, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#1f1a14]/[0.09] bg-white/80 p-5 backdrop-blur-xl"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-[#9a8f80]">
                  M{m.month}
                </span>
                <input
                  value={m.title}
                  onChange={(e) => setMonth(i, { title: e.target.value })}
                  placeholder="Month theme"
                  className={`${inputDark} font-medium`}
                />
              </div>

              <p className="mt-4 mb-1.5 text-[11px] font-semibold tracking-wider text-[#9a8f80] uppercase">
                Objectives
              </p>
              <div className="flex flex-col gap-2">
                {m.objectives.map((o, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      value={o}
                      onChange={(e) =>
                        setMonth(i, {
                          objectives: m.objectives.map((x, j) =>
                            j === oi ? e.target.value : x,
                          ),
                        })
                      }
                      className={`${inputDark} text-[13px]`}
                    />
                    <button
                      aria-label="Remove objective"
                      onClick={() =>
                        setMonth(i, {
                          objectives: m.objectives.filter((_, j) => j !== oi),
                        })
                      }
                      className="shrink-0 px-1.5 text-lg text-[#9a8f80] hover:text-[#e0567a]"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setMonth(i, { objectives: [...m.objectives, ""] })
                  }
                  className="self-start text-[12.5px] font-medium text-[#b04d18] hover:underline"
                >
                  + Add objective
                </button>
              </div>

              {m.weeks?.length > 0 && (
                <>
                  <p className="mt-4 mb-1.5 text-[11px] font-semibold tracking-wider text-[#9a8f80] uppercase">
                    Weekly focus
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {m.weeks.map((w, wi) => (
                      <div key={wi} className="flex items-center gap-2">
                        <span className="shrink-0 font-mono text-[11px] text-[#9a8f80]">
                          W{w.week}
                        </span>
                        <input
                          value={w.focus}
                          onChange={(e) =>
                            setMonth(i, {
                              weeks: m.weeks.map((x, j) =>
                                j === wi ? { ...x, focus: e.target.value } : x,
                              ),
                            })
                          }
                          className={`${inputDark} text-[12.5px]`}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
          {saveErr && <p className="text-sm text-[#b5551f]">{saveErr}</p>}
          <div className="flex gap-2.5">
            <button onClick={save} disabled={saving} className={buttonAccent}>
              {saving ? "Saving…" : "Save roadmap"}
            </button>
            <button
              onClick={() => {
                setDraft(null);
                setSaveErr("");
              }}
              className={buttonGhostDark}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="relative mt-7 flex flex-col gap-4">
          <div className="absolute top-4 bottom-4 left-[17px] w-px bg-[#1f1a14]/10" />
          {roadmap.map((m, i) => {
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
      )}
    </main>
  );
}
