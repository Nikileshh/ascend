"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";

export interface Plan {
  goal: string;
  profile: {
    goalDifficulty: string;
    estimatedMonths: number;
    dailyHours: number;
    weeklyHours: number;
    confidence: number;
    skillsRequired: string[];
    risks: string[];
  };
  roadmap: {
    month: number;
    title: string;
    objectives: string[];
    weeks?: { week: number; focus: string }[];
  }[];
  timetable: { time: string; activity: string }[];
  habits: { name: string; frequency: string; why: string }[];
}

export type HabitLog = Record<string, Record<string, "done" | "missed">>;

/** Fetches the saved plan; redirects to onboarding if none exists yet. */
export function usePlan() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [habitLog, setHabitLog] = useState<HabitLog>({});
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ plan: Plan; habitLog: HabitLog }>("/agents/plan")
      .then((r) => {
        setPlan(r.plan);
        setHabitLog(r.habitLog);
      })
      .catch((err) => {
        const msg = (err as Error).message;
        if (msg.includes("No plan")) router.replace("/onboarding");
        else setError(msg);
      });
  }, [router]);

  return { plan, habitLog, error };
}

export function Loading() {
  return null;
}
