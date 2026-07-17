"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/ui/Glass";
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

  return (
    <main className="mx-auto max-w-[820px] px-5 py-10 sm:px-8 sm:py-14 md:px-12">
      <h1 className="font-display text-[32px] leading-tight font-medium tracking-tight text-[#1f1a14] sm:text-[42px]">
        Insights
      </h1>
      <p className="mt-2 text-[16px] text-[#6b6155]">
        What your patterns say, and where you stand.
      </p>

      {error && <p className="mt-6 text-[15px] text-[#b5551f]">{error}</p>}
      {!data && !error && (
        <p className="mt-8 animate-pulse text-[15px] text-[#9a8f80]">
          Analyzing your patterns…
        </p>
      )}
      {data && (
        <div className="mt-8 flex flex-col gap-6">
          <GlassCard gradient title="Patterns & adjustments">
            <RichText text={data.analytics} />
          </GlassCard>
          <GlassCard title="Where you stand">
            <RichText text={data.motivation} />
          </GlassCard>
        </div>
      )}
    </main>
  );
}
