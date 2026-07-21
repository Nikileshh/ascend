// Sunset-mountain backdrop (the Ascend summit photo) with a warm bone wash
// so foreground text stays readable. Shared by the auth shell and onboarding;
// the dashboard has its own animated variant.
export function MountainBackdrop({
  center = 0.86,
  edge = 0.6,
}: {
  /** wash opacity where content sits (higher = more readable, less photo) */
  center?: number;
  /** wash opacity at the edges (lower = peaks more visible) */
  edge?: number;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/dashboard-bg.jpg"
        alt=""
        className="h-full w-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(130% 120% at 50% 38%, rgba(244,239,230,${center}) 45%, rgba(244,239,230,${edge}) 100%)`,
        }}
      />
      {/* cinematic vignette: a whisper of darkness in the corners */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 45%, transparent 62%, rgba(31,26,20,0.16) 100%)",
        }}
      />
    </div>
  );
}
