"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { RichText } from "@/components/ui/RichText";

export default function InsightsPage() {
  const [data, setData] = useState<{
    analytics: string;
    motivation: string;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ analytics: string; motivation: string }>("/agents/insights")
      .then(setData)
      .catch((err) => setError((err as Error).message));
  }, []);

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!data)
    return (
      <p className="animate-pulse text-sm text-zinc-500">
        Analyzing your patterns…
      </p>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
        AI insights
      </h1>
      <Card title="Patterns & adjustments">
        <RichText text={data.analytics} />
      </Card>
      <Card title="Where you stand">
        <RichText text={data.motivation} />
      </Card>
    </div>
  );
}
