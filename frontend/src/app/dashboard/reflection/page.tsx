"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import {
  GlassCard,
  CoachBadge,
  buttonAccent,
  inputDark,
} from "@/components/ui/Glass";
import { RichText } from "@/components/ui/RichText";

export default function ReflectionPage() {
  const [reflection, setReflection] = useState({
    win: "",
    distraction: "",
    lesson: "",
  });
  const [adjustments, setAdjustments] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await api<{ adjustments: string }>("/agents/reflection", {
        body: reflection,
      });
      setAdjustments(r.adjustments);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-[720px] px-5 py-10 sm:px-8 sm:py-14 md:px-12">
      <h1 className="font-display text-[32px] leading-tight font-medium tracking-tight text-[#1f1a14] sm:text-[42px]">
        Weekly reflection
      </h1>
      <p className="mt-2 text-[16px] text-[#6b6155]">
        Write freely — your coach reads this and adjusts next week&apos;s plan
        for you.
      </p>

      <GlassCard className="mt-6">
        {adjustments ? (
          <div>
            <CoachBadge caption="Suggestions for next week" />
            <RichText text={adjustments} />
            <button
              onClick={() => {
                setAdjustments("");
                setReflection({ win: "", distraction: "", lesson: "" });
              }}
              className="mt-4 text-[13px] font-medium text-[#7d5a1e] hover:underline"
            >
              Write another reflection
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-5">
            {(
              [
                ["win", "What was your biggest win this week?"],
                ["distraction", "What distracted you the most?"],
                ["lesson", "What is the biggest lesson you learned?"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="mb-2 block text-[13.5px] font-medium text-[#1f1a14]">
                  {label}
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Take your time — the more honest you are, the better the suggestions."
                  value={reflection[key]}
                  onChange={(e) =>
                    setReflection({ ...reflection, [key]: e.target.value })
                  }
                  className={`${inputDark} resize-y leading-5`}
                />
              </div>
            ))}
            {error && <p className="text-sm text-[#b5551f]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className={`${buttonAccent} self-start`}
            >
              {loading ? "Reflecting…" : "Submit reflection"}
            </button>
          </form>
        )}
      </GlassCard>
    </main>
  );
}
