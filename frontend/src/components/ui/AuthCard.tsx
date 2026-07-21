import { MountainBackdrop } from "./MountainBackdrop";

// Warm editorial auth shell (Ascend design system: bone canvas, espresso ink,
// amber accent, Cormorant serif) over the sunset-mountain backdrop.
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4efe6] px-6 text-[#1f1a14]">
      <MountainBackdrop src="/desk-bg.jpg" center={0.84} edge={0.62} />

      <div className="animate-fade-up relative w-full max-w-md rounded-[20px] border border-[#1f1a14]/[0.09] bg-white/60 p-8 shadow-[0_20px_50px_-24px_rgba(70,50,20,0.22)] backdrop-blur-xl">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d9622b] text-xs text-white">
            ▲
          </span>
          <span className="font-display text-xl font-medium tracking-[0.12em]">
            ASCEND
          </span>
        </div>
        <h1 className="font-display text-[32px] leading-tight font-medium text-[#1f1a14]">
          {title}
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-[#6b6155]">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}

export const inputClass =
  "w-full rounded-xl border border-[#1f1a14]/[0.16] bg-white px-4 py-2.5 text-sm text-[#1f1a14] placeholder-[#9a8f80] outline-none transition-all duration-200 focus:border-[#d9622b]/60 focus:ring-4 focus:ring-[#d9622b]/15";

export const buttonClass =
  "w-full rounded-full bg-gradient-to-b from-[#2a231b] to-[#1f1a14] px-6 py-2.5 text-sm font-medium text-[#f7f1e6] shadow-[0_8px_24px_rgba(31,26,20,0.24)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(31,26,20,0.32)] active:translate-y-0 disabled:opacity-50";
