"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { RichText } from "@/components/ui/RichText";
import { buttonClass, inputClass } from "@/components/ui/AuthCard";

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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
        Weekly reflection
      </h1>
      <Card>
        {adjustments ? (
          <div>
            <p className="text-sm font-medium text-black dark:text-white">
              Your AI coach suggests for next week:
            </p>
            <div className="mt-2">
              <RichText text={adjustments} />
            </div>
            <button
              onClick={() => {
                setAdjustments("");
                setReflection({ win: "", distraction: "", lesson: "" });
              }}
              className="mt-4 text-sm text-blue-600 dark:text-blue-400"
            >
              Write another reflection
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Write freely — your AI coach reads this and adjusts next
              week&apos;s plan for you.
            </p>
            {(
              [
                ["win", "What was your biggest win this week?"],
                ["distraction", "What distracted you the most?"],
                ["lesson", "What is the biggest lesson you learned?"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium text-black dark:text-white">
                  {label}
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Take your time — the more honest you are, the better the suggestions."
                  value={reflection[key]}
                  onChange={(e) =>
                    setReflection({ ...reflection, [key]: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
            ))}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" disabled={loading} className={buttonClass}>
              {loading ? "Reflecting…" : "Submit reflection"}
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}
