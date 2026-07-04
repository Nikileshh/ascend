export function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-xl shadow-black/5 dark:border-white/10 dark:bg-zinc-900">
      {title && (
        <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
