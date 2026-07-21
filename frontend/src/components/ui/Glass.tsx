// Warm editorial design system (Ascend) — bone canvas, espresso ink,
// amber accent, champagne highlight. Cormorant serif for titles.
export const ACCENT = "#d9622b";

export function GlassCard({
  title,
  action,
  gradient = false, // `gradient` marks a featured/highlight panel
  className = "",
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  gradient?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const base =
    "rounded-[20px] p-6 transition-all duration-[250ms] ease-out hover:-translate-y-0.5";
  const surface = gradient
    ? "border border-[#c79a4a]/50 bg-gradient-to-b from-white to-[#fbf3e2] shadow-[0_0_40px_-12px_rgba(199,154,74,0.4)]"
    : "border border-[#1f1a14]/[0.09] bg-gradient-to-b from-white to-[#faf6ee] shadow-[0_20px_50px_-24px_rgba(70,50,20,0.22)]";
  return (
    <section className={`${base} ${surface} ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between">
          {title && (
            <h2 className="font-display text-[24px] leading-tight font-medium text-[#1f1a14]">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function CoachBadge({ caption }: { caption?: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d9622b]/25 bg-[#d9622b]/[0.08] px-3 py-1 font-mono text-[11px] font-medium tracking-[0.14em] text-[#d9622b] uppercase">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d9622b]" />
        AI Coach
      </span>
      {caption && <span className="text-[13px] text-[#6b6155]">{caption}</span>}
    </div>
  );
}

// Inputs: white field, warm border, gold focus ring
export const inputDark =
  "w-full rounded-xl border border-[#1f1a14]/[0.16] bg-white px-4 py-2.5 text-[15px] text-[#1f1a14] placeholder-[#9a8f80] outline-none transition-all duration-200 focus:border-[#d9622b]/60 focus:ring-4 focus:ring-[#d9622b]/15";

// Primary button: espresso ink on cream, soft lift, no glow
export const buttonAccent =
  "rounded-full bg-gradient-to-b from-[#2a231b] to-[#1f1a14] px-6 py-2.5 text-[14px] font-medium text-[#f7f1e6] shadow-[0_8px_24px_rgba(31,26,20,0.24)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(31,26,20,0.32)] active:translate-y-0 disabled:opacity-50";

// Secondary button: white, warm border, soft hover
export const buttonGhostDark =
  "rounded-full border border-[#1f1a14]/[0.16] bg-white px-6 py-2.5 text-[14px] font-medium text-[#1f1a14] transition-colors duration-200 hover:bg-[#faf6ee] hover:border-[#1f1a14]/[0.28]";
