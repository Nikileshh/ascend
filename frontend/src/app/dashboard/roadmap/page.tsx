"use client";

import { usePlan } from "@/lib/usePlan";
import { Card } from "@/components/ui/Card";

export default function RoadmapPage() {
  const { plan, error } = usePlan();
  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!plan)
    return <p className="animate-pulse text-sm text-zinc-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
        Your roadmap
      </h1>
      <Card>
        <ol className="space-y-6">
          {plan.roadmap.map((m) => (
            <li key={m.month} className="flex gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-semibold text-white">
                {m.month}
              </div>
              <div>
                <p className="font-medium text-black dark:text-white">
                  {m.title}
                </p>
                <ul className="mt-1 ml-4 list-disc text-sm text-zinc-600 dark:text-zinc-400">
                  {m.objectives.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
