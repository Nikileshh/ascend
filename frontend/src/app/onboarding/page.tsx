"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import {
  buttonAccent,
  buttonGhostDark,
  inputDark,
} from "@/components/ui/Glass";
import { MountainBackdrop } from "@/components/ui/MountainBackdrop";

interface Question {
  question: string;
  type: "choice" | "time";
  options: string[];
  multi?: boolean; // several options can apply — toggle instead of replace
}

const OTHER = "__other__";

const MODULES = [
  {
    key: "roadmap",
    name: "Roadmap",
    desc: "Month-by-month milestones toward the goal",
    icon: "🗺",
  },
  {
    key: "timetable",
    name: "Timetable",
    desc: "A daily schedule with task-start reminders",
    icon: "⏰",
  },
  {
    key: "habits",
    name: "Habits",
    desc: "Daily habit tracker with streaks",
    icon: "✓",
  },
  {
    key: "insights",
    name: "Insights",
    desc: "AI analytics on your progress",
    icon: "📊",
  },
  {
    key: "reflection",
    name: "Reflection",
    desc: "Weekly review, and your coach adjusts the plan",
    icon: "✍️",
  },
  {
    key: "chat",
    name: "AI Chat",
    desc: "Ask your coach anything, anytime",
    icon: "💬",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  // Per question: chosen options (single-choice holds at most one + OTHER)
  const [selected, setSelected] = useState<string[][]>([]);
  const [otherText, setOtherText] = useState<string[]>([]);
  const [modules, setModules] = useState<string[]>(MODULES.map((m) => m.key));
  // 0 = goal · 1..n = questions · n+1 = module picker
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getUser()) router.replace("/login");
  }, [router]);

  const modulesStep = questions.length + 1;

  function answerOf(i: number) {
    const picks = (selected[i] ?? []).filter((s) => s !== OTHER);
    if ((selected[i] ?? []).includes(OTHER) && (otherText[i] ?? "").trim())
      picks.push((otherText[i] ?? "").trim());
    return picks.join(", ");
  }

  function pick(i: number, opt: string, multi: boolean) {
    setSelected((prev) => {
      const copy = [...prev];
      const cur = copy[i] ?? [];
      if (cur.includes(opt))
        copy[i] = cur.filter((o) => o !== opt); // tap again → unselect
      else if (multi)
        copy[i] = [...cur, opt]; // stack selections
      else copy[i] = [opt]; // single choice replaces
      return copy;
    });
  }

  async function submitGoal(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { questions } = await api<{ questions: Question[] }>(
        "/agents/questions",
        { body: { goal } },
      );
      setQuestions(questions);
      setSelected(questions.map(() => []));
      setOtherText(Array(questions.length).fill(""));
      setStep(1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function buildPlan() {
    setError("");
    setLoading(true);
    try {
      await api("/agents/orchestrate", {
        body: {
          goal,
          qa: questions.map((q, i) => ({
            question: q.question,
            answer: answerOf(i),
          })),
          modules,
        },
      });
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  function toggleModule(key: string) {
    setModules((m) =>
      m.includes(key) ? m.filter((k) => k !== key) : [...m, key],
    );
  }

  const current = step - 1;
  const q = questions[current];
  const building = loading && step === modulesStep;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4efe6] px-6 py-10 text-[#1f1a14]">
      <MountainBackdrop src="/dashboard-bg.jpg" center={0.84} edge={0.62} />

      <div className="animate-fade-up relative w-full max-w-xl rounded-[20px] border border-[#1f1a14]/[0.09] bg-white/60 p-8 shadow-[0_20px_50px_-24px_rgba(70,50,20,0.22)] backdrop-blur-xl">
        {building ? (
          <div className="py-10 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d9622b]/25 bg-[#d9622b]/[0.08] px-4 py-1.5 font-mono text-xs font-medium tracking-[0.14em] text-[#d9622b] uppercase">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#d9622b]" />
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
              <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-[#d9622b] to-[#e6c992]" />
            </div>
          </div>
        ) : step === 0 ? (
          <form onSubmit={submitGoal}>
            <h1 className="font-display text-[34px] leading-tight font-medium text-[#1f1a14]">
              What do you want to achieve?
            </h1>
            <p className="mt-1.5 text-sm leading-6 text-[#6b6155]">
              Your AI coach will ask a few questions tailored to your goal, most
              are one tap to answer.
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
        ) : step <= questions.length ? (
          <div key={step} className="animate-fade-up">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs font-medium tracking-[0.14em] text-[#d9622b] uppercase">
                Question {step} of {questions.length}
              </p>
              <div className="flex gap-1">
                {questions.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 w-5 rounded-full ${
                      i < step ? "bg-[#d9622b]" : "bg-[#1f1a14]/10"
                    }`}
                  />
                ))}
              </div>
            </div>
            <h1 className="font-display mt-3 text-[26px] leading-snug font-medium text-[#1f1a14]">
              {q.question}
            </h1>
            {q.multi && (
              <p className="mt-1.5 text-[12.5px] font-medium text-[#d9622b]">
                Select all that apply
              </p>
            )}

            {/* Options — a compact clock grid for time questions, stacked
                pills for everything else, plus "Other" for a custom answer. */}
            <div
              className={`mt-6 ${
                q.type === "time"
                  ? "grid grid-cols-3 gap-2 sm:grid-cols-4"
                  : "flex flex-col gap-2"
              }`}
            >
              {q.options.map((opt) => {
                const active = (selected[current] ?? []).includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => pick(current, opt, !!q.multi)}
                    className={`rounded-xl border px-4 text-left text-[14px] transition-all duration-150 ${
                      q.type === "time"
                        ? "py-2.5 text-center font-mono text-[13px]"
                        : "py-3"
                    } ${
                      active
                        ? "border-[#d9622b] bg-[#d9622b]/10 font-medium text-[#b04d18] shadow-[0_0_0_1px_#d9622b]"
                        : "border-[#1f1a14]/[0.12] bg-white text-[#4a4239] hover:border-[#d9622b]/50 hover:bg-[#faf6ee]"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => pick(current, OTHER, !!q.multi)}
                className={`rounded-xl border px-4 text-left text-[14px] transition-all duration-150 ${
                  q.type === "time" ? "py-2.5 text-center" : "py-3"
                } ${
                  (selected[current] ?? []).includes(OTHER)
                    ? "border-[#d9622b] bg-[#d9622b]/10 font-medium text-[#b04d18] shadow-[0_0_0_1px_#d9622b]"
                    : "border-dashed border-[#1f1a14]/20 bg-transparent text-[#6b6155] hover:border-[#d9622b]/50"
                }`}
              >
                Other…
              </button>
            </div>

            {(selected[current] ?? []).includes(OTHER) && (
              <textarea
                autoFocus
                rows={2}
                placeholder="Type your answer…"
                value={otherText[current] ?? ""}
                onChange={(e) => {
                  const copy = [...otherText];
                  copy[current] = e.target.value;
                  setOtherText(copy);
                }}
                className={`mt-3 ${inputDark} resize-y leading-6`}
              />
            )}

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
              <button
                type="button"
                disabled={!answerOf(current)}
                onClick={() => setStep(step + 1)}
                className={`${buttonAccent} disabled:cursor-not-allowed`}
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-up">
            <p className="font-mono text-xs font-medium tracking-[0.14em] text-[#d9622b] uppercase">
              Last step
            </p>
            <h1 className="font-display mt-3 text-[28px] leading-snug font-medium text-[#1f1a14]">
              Which modules do you want?
            </h1>
            <p className="mt-1.5 text-sm leading-6 text-[#6b6155]">
              Your dashboard shows only what you pick. The Overview is always
              included. You can start a new goal anytime to change these.
            </p>

            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {MODULES.map((m) => {
                const on = modules.includes(m.key);
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => toggleModule(m.key)}
                    aria-pressed={on}
                    className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all duration-150 ${
                      on
                        ? "border-[#d9622b] bg-[#d9622b]/[0.07] shadow-[0_0_0_1px_#d9622b]"
                        : "border-[#1f1a14]/[0.12] bg-white opacity-70 hover:opacity-100"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] ${
                        on
                          ? "border-[#d9622b] bg-[#d9622b] text-white"
                          : "border-[#1f1a14]/20 bg-white text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span>
                      <span className="block text-[14px] font-semibold text-[#1f1a14]">
                        {m.icon} {m.name}
                      </span>
                      <span className="mt-0.5 block text-[12.5px] leading-5 text-[#6b6155]">
                        {m.desc}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {error && <p className="mt-3 text-sm text-[#b5551f]">{error}</p>}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className={buttonGhostDark}
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={buildPlan}
                className={buttonAccent}
              >
                Build my plan
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
