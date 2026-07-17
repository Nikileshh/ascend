"use client";

import { useCopy } from "@/lib/useCopy";

export function Hero() {
  const copy = useCopy();
  return (
    <section className="relative isolate flex flex-col items-center overflow-hidden px-6 pt-40 pb-24 text-center">
      {/* photo backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/intro-bg.png"
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-black/80" />
      </div>

      <span className="animate-fade-up rounded-full border border-[#e6c992]/40 bg-white/10 px-4 py-1 font-mono text-xs tracking-[0.14em] text-[#e6c992] uppercase backdrop-blur">
        {copy["hero.badge"]}
      </span>
      <h1 className="font-display animate-fade-up-1 mt-7 max-w-4xl text-6xl leading-[1.02] font-medium tracking-tight text-white sm:text-8xl">
        {copy["hero.title1"]}
        <br />
        <span className="bg-gradient-to-r from-[#f2e4c8] via-[#e6c992] to-[#c79a4a] bg-clip-text text-transparent">
          {copy["hero.title2"]}
        </span>
      </h1>
      <p className="animate-fade-up-2 mt-6 max-w-2xl text-lg leading-8 font-light text-[#e8e0d3]">
        {copy["hero.sub"]}
      </p>
      <div className="animate-fade-up-3 mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <a
          href="/register"
          className="rounded-full bg-gradient-to-b from-[#f2e4c8] to-[#e6c992] px-8 py-3 text-base font-medium text-[#1f1a14] shadow-[0_8px_28px_rgba(199,154,74,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_38px_rgba(199,154,74,0.45)]"
        >
          {copy["hero.cta1"]}
        </a>
        <a
          href="#how-it-works"
          className="rounded-full border border-[#e6c992]/35 px-8 py-3 text-base font-medium text-[#f2e4c8] transition-colors hover:bg-[#e6c992]/10"
        >
          {copy["hero.cta2"]}
        </a>
      </div>
    </section>
  );
}
