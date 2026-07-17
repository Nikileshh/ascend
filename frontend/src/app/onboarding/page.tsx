"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import {
  buttonAccent,
  buttonGhostDark,
  inputDark,
} from "@/components/ui/Glass";

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
  const building = loading && step === questions.length && step > 0;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4efe6] px-6 text-[#1f1a14]">
      {/* ambient warm wash */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="animate-blob absolute -top-44 left-[20%] h-[560px] w-[560px] rounded-full bg-[#a8721f]/[0.08] blur-[80px]" />
        <div className="animate-blob absolute -right-20 -bottom-56 h-[620px] w-[620px] rounded-full bg-[#e6c992]/12 blur-[90px] [animation-delay:-7s]" />
      </div>

      <div className="animate-fade-up relative w-full max-w-xl rounded-[20px] border border-[#1f1a14]/[0.09] bg-gradient-to-b from-white to-[#faf6ee] p-8 shadow-[0_20px_50px_-24px_rgba(70,50,20,0.22)]">
        {building ? (
          <div className="py-10 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#a8721f]/25 bg-[#a8721f]/[0.08] px-4 py-1.5 font-mono text-xs font-medium tracking-[0.14em] text-[#a8721f] uppercase">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#a8721f]" />
              AI at work
            </span>
            <h1 className="font-display mt-5 text-[34px] leading-tight font-medium text-[#1f1a14]">
              Building your execution system…
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#6b6155]">
              Analyzing your goal, drafting the roadmap, shaping your timetable
              and habits. This takes about a minute.
            </p>
            <div className="mx-auto mt-7 h-1.5 w-56 overflow-hidden rounded-full bg-[#1f1a14]/[0.07]">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-[#a8721f] to-[#e6c992]" />
            </div>
          </div>
        ) : step === 0 ? (
          <form onSubmit={submitGoal}>
            <h1 className="font-display text-[34px] leading-tight font-medium text-[#1f1a14]">
              What do you want to achieve?
            </h1>
            <p className="mt-1.5 text-sm leading-6 text-[#6b6155]">
              Your AI coach will ask a few questions tailored to your goal.
            </p>
            <textarea
              required
              rows={3}
              placeholder="e.g. Crack UPSC in 2027, launch my startup, run a marathon…"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className={`mt-6 ${inputDark} resize-y leading-6`}
            />
            {error && <p className="mt-3 text-sm text-[#b5551f]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className={`mt-6 ${buttonAccent}`}
            >
              {loading ? "Thinking…" : "Continue"}
            </button>
          </form>
        ) : (
          <form onSubmit={next} key={step} className="animate-fade-up">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs font-medium tracking-[0.14em] text-[#a8721f] uppercase">
                Question {step} of {questions.length}
              </p>
              <div className="flex gap-1">
                {questions.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 w-5 rounded-full ${
                      i < step ? "bg-[#a8721f]" : "bg-[#1f1a14]/10"
                    }`}
                  />
                ))}
              </div>
            </div>
            <h1 className="font-display mt-3 text-[28px] leading-snug font-medium text-[#1f1a14]">
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
              className={`mt-6 ${inputDark} resize-y leading-6`}
            />
            {error && <p className="mt-3 text-sm text-[#b5551f]">{error}</p>}
            <div className="mt-6 flex gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className={buttonGhostDark}
                >
                  Back
                </button>
              )}
              <button type="submit" disabled={loading} className={buttonAccent}>
                {step === questions.length ? "Build my plan" : "Next"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
