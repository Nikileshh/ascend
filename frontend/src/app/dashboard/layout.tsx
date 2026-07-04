"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, clearSession, getUser } from "@/lib/api";

const tabs = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/roadmap", label: "Roadmap" },
  { href: "/dashboard/timetable", label: "Timetable" },
  { href: "/dashboard/habits", label: "Habits" },
  { href: "/dashboard/insights", label: "Insights" },
  { href: "/dashboard/reflection", label: "Reflection" },
  { href: "/dashboard/chat", label: "AI Chat" },
];

interface Slot {
  time: string;
  activity: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [reminder, setReminder] = useState<Slot | null>(null);
  const timetableRef = useRef<Slot[]>([]);
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!getUser()) router.replace("/login");
  }, [router]);

  // record page visits for admin analytics
  useEffect(() => {
    if (getUser()) api("/track", { body: { page: pathname } }).catch(() => {});
  }, [pathname]);

  // Task reminders: when a timetable slot starts, notify the user.
  useEffect(() => {
    if (!getUser()) return;
    if ("Notification" in window && Notification.permission === "default")
      Notification.requestPermission().catch(() => {});

    api<{ plan: { timetable: Slot[] } }>("/agents/plan")
      .then((r) => (timetableRef.current = r.plan.timetable))
      .catch(() => {});

    const check = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const key = `${now.toDateString()} ${hhmm}`;
      for (const slot of timetableRef.current) {
        const start = slot.time.match(/^(\d{1,2}):(\d{2})/);
        if (!start) continue;
        const slotStart = `${start[1].padStart(2, "0")}:${start[2]}`;
        const slotKey = `${key} ${slot.activity}`;
        if (slotStart === hhmm && !notifiedRef.current.has(slotKey)) {
          notifiedRef.current.add(slotKey);
          setReminder(slot);
          if ("Notification" in window && Notification.permission === "granted")
            new Notification(`⏰ ${slot.time}`, {
              body: `${slot.activity}\nCan't do it right now? Adjust it in Timetable.`,
            });
        }
      }
    };
    check();
    const id = setInterval(check, 20_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-black/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
          <Link
            href="/dashboard"
            className="text-lg font-semibold tracking-tight text-black dark:text-white"
          >
            Ascend
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
                  pathname === t.href
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "text-zinc-600 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={() => {
              clearSession();
              router.push("/login");
            }}
            className="rounded-full border border-black/10 px-3 py-1.5 text-sm text-black dark:border-white/15 dark:text-white"
          >
            Log out
          </button>
        </div>
      </header>

      {reminder && (
        <div className="mx-auto mt-4 max-w-4xl px-6">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-blue-500/30 bg-blue-50 px-5 py-3 text-sm text-blue-900 dark:bg-blue-500/10 dark:text-blue-200">
            <p>
              ⏰ It&apos;s time for: <strong>{reminder.activity}</strong> (
              {reminder.time})
            </p>
            <span className="flex shrink-0 gap-2">
              <Link
                href="/dashboard/timetable"
                className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white"
                onClick={() => setReminder(null)}
              >
                Can&apos;t now — adjust
              </Link>
              <button
                onClick={() => setReminder(null)}
                className="rounded-full border border-blue-500/40 px-3 py-1 text-xs"
              >
                Done
              </button>
            </span>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
    </div>
  );
}
