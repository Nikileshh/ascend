"use client";

import { ScrollReveal } from "./ScrollReveal";
import { useCopy } from "@/lib/useCopy";

/**
 * Cinematic chapter break: a full-width summit-at-dusk band with one big
 * statement. The landing page alternates these dark scenes with the light
 * sections, like film chapters. Wording is admin-editable (copy registry).
 */
export function SceneBreak({
  headingKey,
  subKey,
  image = "/dashboard-bg.jpg",
}: {
  headingKey: string;
  subKey: string;
  /** scene photo for this chapter break */
  image?: string;
}) {
  const copy = useCopy();
  return (
    <section className="relative overflow-hidden py-28 text-center sm:py-36">
      {/* sm:bg-fixed = parallax on desktop; mobile browsers scroll it normally */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center sm:bg-fixed"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60"
      />
      <ScrollReveal className="relative mx-auto max-w-3xl px-6">
        <h2 className="font-display text-4xl leading-tight font-medium tracking-tight text-[#f7f1e6] sm:text-6xl">
          {copy[headingKey]}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-[#e8e0d3]">
          {copy[subKey]}
        </p>
      </ScrollReveal>
    </section>
  );
}
