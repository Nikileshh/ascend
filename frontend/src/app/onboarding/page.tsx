"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import { buttonClass, inputClass } from "@/components/ui/AuthCard";

export default function OnboardingPage() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [step, setStep] = useState(0); // 0 = goal, 1..n = questions
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getUser()) router.replace("/login");
  }, [router]);

  async function submitGoal(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { questions } = await api<{ questions: string[] }>(
        "/agents/questions",
        { body: { goal } },
      );
      setQuestions(questions);
      setAnswers(Array(questions.length).fill(""));
      setStep(1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function next(e: React.FormEvent) {
    e.preventDefault();
    if (step < questions.length) {
      setStep(step + 1);
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api("/agents/orchestrate", {
        body: {
          goal,
          qa: questions.map((question, i) => ({
            question,
            answer: answers[i],
          })),
        },
      });
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const current = step - 1;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div className="w-full max-w-xl rounded-3xl border border-black/5 bg-white p-8 shadow-xl shadow-black/5 dark:border-white/10 dark:bg-zinc-900">
        {step === 0 ? (
          <form onSubmit={submitGoal}>
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
              What do you want to achieve?
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Your AI coach will ask a few questions tailored to your goal.
            </p>
            <textarea
              required
              rows={3}
              placeholder="e.g. Crack UPSC in 2027, launch my startup, run a marathon…"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className={`mt-6 ${inputClass}`}
            />
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className={`mt-6 ${buttonClass}`}
            >
              {loading ? "Thinking…" : "Continue"}
            </button>
          </form>
        ) : (
          <form onSubmit={next}>
            <p className="text-xs font-medium tracking-wide text-blue-600 uppercase dark:text-blue-400">
              Question {step} of {questions.length}
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-black dark:text-white">
              {questions[current]}
            </h1>
            <textarea
              required
              rows={3}
              value={answers[current]}
              onChange={(e) => {
                const copy = [...answers];
                copy[current] = e.target.value;
                setAnswers(copy);
              }}
              className={`mt-6 ${inputClass}`}
            />
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            <div className="mt-6 flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="rounded-full border border-black/10 px-6 py-2.5 text-sm font-medium text-black dark:border-white/15 dark:text-white"
                >
                  Back
                </button>
              )}
              <button type="submit" disabled={loading} className={buttonClass}>
                {loading
                  ? "Your AI agents are building your plan…"
                  : step === questions.length
                    ? "Build my plan"
                    : "Next"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
