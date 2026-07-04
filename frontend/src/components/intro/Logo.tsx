"use client";

import { motion } from "framer-motion";

/** Centered luxury gold serif wordmark with a slow shimmer sweep. */
export function Logo({ title, tagline }: { title: string; tagline: string }) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
      style={{ willChange: "transform, opacity" }}
    >
      <div
        aria-hidden
        className="mb-6 h-px w-24 sm:w-32"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--intro-gold), transparent)",
        }}
      />
      <h1
        className="animate-shimmer bg-clip-text text-[clamp(2.8rem,9vw,6.5rem)] leading-none font-medium tracking-[0.22em] text-transparent"
        style={{
          fontFamily: "var(--intro-serif)",
          backgroundImage:
            "linear-gradient(100deg, var(--intro-gold) 20%, var(--intro-gold-light) 40%, var(--intro-gold) 60%)",
        }}
      >
        {title}
      </h1>
      <p
        className="mt-5 text-[clamp(0.65rem,1.6vw,0.85rem)] tracking-[0.5em] uppercase"
        style={{ color: "rgba(243, 217, 139, 0.75)" }}
      >
        {tagline}
      </p>
      <div
        aria-hidden
        className="mt-6 h-px w-24 sm:w-32"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--intro-gold), transparent)",
        }}
      />
    </motion.div>
  );
}
