// Cinematic photo backdrop kept faint under an opaque light veil, so the scene
// reads as a subtle texture and foreground text stays crisp. Shared by the auth
// shell and onboarding (each picks its scene via `src`); the dashboard has its
// own animated variant.
export function MountainBackdrop({
  src = "/dashboard-bg.jpg",
  center = 0.93,
  edge = 0.82,
}: {
  /** which scene photo to show behind the page */
  src?: string;
  /** light-veil opacity where content sits (higher = fainter photo) */
  center?: number;
  /** light-veil opacity at the edges (lower = photo a touch more visible) */
  edge?: number;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(130% 120% at 50% 38%, rgba(245,242,236,${center}) 45%, rgba(245,242,236,${edge}) 100%)`,
        }}
      />
    </div>
  );
}
