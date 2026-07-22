"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, clearSession, getUser, type SessionUser } from "@/lib/api";
import { useIsClient } from "@/lib/useIsClient";

const tabs = [
  {
    href: "/dashboard",
    label: "Overview",
    module: null, // always visible
    icon: "M3 9.5 12 3l9 6.5V21H3V9.5z",
  },
  {
    href: "/dashboard/roadmap",
    label: "Roadmap",
    module: "roadmap",
    icon: "M9 20l-5.5-2V4L9 6m0 14 6-2m-6 2V6m6 12 5.5 2V6L15 4m0 14V4M9 6l6-2",
  },
  {
    href: "/dashboard/timetable",
    label: "Timetable",
    module: "timetable",
    icon: "M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  },
  {
    href: "/dashboard/habits",
    label: "Habits",
    module: "habits",
    icon: "M5 13l4 4L19 7",
  },
  {
    href: "/dashboard/insights",
    label: "Insights",
    module: "insights",
    icon: "M4 19v-5m5.5 5V9M15 19v-8m5 8V5",
  },
  {
    href: "/dashboard/reflection",
    label: "Reflection",
    module: "reflection",
    icon: "M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.4-9.4a2 2 0 1 1 2.8 2.8L11 15l-4 1 1-4 8.6-8.4z",
  },
  {
    href: "/dashboard/chat",
    label: "AI Chat",
    module: "chat",
    icon: "M8 10h8m-8 4h5m8-2a9 9 0 0 1-13.2 8L3 21l1-4.8A9 9 0 1 1 21 12z",
  },
];

interface Slot {
  time: string;
  activity: string;
}

function NavIcon({ d }: { d: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [reminder, setReminder] = useState<Slot | null>(null);
  const [freshUser, setFreshUser] = useState<SessionUser | null>(null);
  const timetableRef = useRef<Slot[]>([]);
  const notifiedRef = useRef<Set<string>>(new Set());

  // Session data is derived at render (hydration-safe via useIsClient), then
  // refreshed from the server so admin-granted premium reflects without
  // re-login.
  const isClient = useIsClient();
  const user = freshUser ?? (isClient ? getUser() : null);
  const name = user?.name ?? "";
  const premium = !!user && (!!user.premium || user.role === "admin");
  const daysLeft = user?.daysLeft ?? 0;
  const aiLeft = user?.aiRemaining ?? 0;
  const aiLimit = user?.aiLimit ?? 10;
  // Locked = a non-premium user whose 7-day trial has ended. They may only see
  // the upgrade page (to pay); everything else redirects there.
  const locked = !!user && !premium && !!user.trialExpired;

  useEffect(() => {
    if (!getUser()) {
      router.replace("/login");
      return;
    }
    api<{ user: SessionUser }>("/auth/me")
      .then(({ user }) => {
        localStorage.setItem("ascend_user", JSON.stringify(user));
        setFreshUser(user);
      })
      .catch(() => {});
  }, [router]);

  // Once we know the trial has ended, keep them on the upgrade page only.
  useEffect(() => {
    if (locked && pathname !== "/dashboard/upgrade")
      router.replace("/dashboard/upgrade");
  }, [locked, pathname, router]);

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // record page visits for admin analytics
  useEffect(() => {
    if (getUser()) api("/track", { body: { page: pathname } }).catch(() => {});
  }, [pathname]);

  // Task reminders: when a timetable slot starts, notify the user.
  useEffect(() => {
    if (!getUser()) return;
    if ("Notification" in window && Notification.permission === "default")
      Notification.requestPermission().catch(() => {});

    api<{ plan: { timetable: Slot[]; weekendTimetable?: Slot[] } }>(
      "/agents/plan",
    )
      .then((r) => {
        const weekend = [0, 6].includes(new Date().getDay());
        timetableRef.current =
          weekend && r.plan.weekendTimetable?.length
            ? r.plan.weekendTimetable
            : r.plan.timetable;
      })
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

  // Show only the modules the user opted into (absent = all, e.g. old accounts)
  const visibleTabs = tabs.filter(
    (t) => !t.module || !user?.modules || user.modules.includes(t.module),
  );

  const nav = visibleTabs.map((t) => {
    const active = pathname === t.href;
    return (
      <Link
        key={t.href}
        href={t.href}
        className={`flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[14px] transition-all duration-200 ${
          active
            ? "bg-[#d9622b]/10 font-semibold text-[#b04d18]"
            : "font-medium text-[#6b6155] hover:bg-[#1f1a14]/[0.04] hover:text-[#1f1a14]"
        }`}
      >
        <span className={active ? "text-[#d9622b]" : "text-[#9a8f80]"}>
          <NavIcon d={t.icon} />
        </span>
        {t.label}
      </Link>
    );
  });

  return (
    // no overflow-hidden on this wrapper — it would break the sticky sidebar
    <div className="relative flex min-h-screen bg-[#f4efe6] text-[#1f1a14]">
      {/* Ambient backdrop — macOS-wallpaper feel: the photo drifts softly but a
          near-opaque white wash keeps it barely perceptible, only at the edges,
          never under text. The dashboard stays the visual focus. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden bg-[#f4efe6]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/dashboard-bg.jpg"
          alt=""
          className="animate-ken-burns h-full w-full object-cover opacity-[0.7]"
        />
        {/* radial white overlay: strongest in the center (where content sits),
            lighter at the edges so the peaks stay clearly visible */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(130% 120% at 50% 35%, rgba(245,242,236,0.9) 42%, rgba(245,242,236,0.7) 100%)",
          }}
        />
        {/* whisper-soft indigo ambience */}
        <div className="animate-blob absolute -top-52 left-[18%] h-[560px] w-[560px] rounded-full bg-[#d9622b]/[0.06] blur-[100px]" />
        <div className="animate-blob absolute -right-24 -bottom-60 h-[620px] w-[620px] rounded-full bg-[#e6c992]/[0.06] blur-[110px] [animation-delay:-7s]" />
      </div>

      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 z-10 hidden h-screen w-[260px] shrink-0 flex-col border-r border-[#1f1a14]/10 bg-white/80 px-4 py-6 backdrop-blur-xl md:flex">
        <Link
          href="/dashboard"
          className="mb-8 flex items-center gap-2.5 px-2 text-[15px] font-semibold tracking-[-0.01em] text-[#1f1a14]"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#d9622b] text-xs text-white">
            ▲
          </span>
          Ascend
        </Link>
        <nav className="flex flex-col gap-0.5">{nav}</nav>
        <div className="mt-auto pt-4">
          {premium ? (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#d9622b]/25 bg-[#d9622b]/[0.07] px-3 py-2">
              <span className="text-[13px]">✦</span>
              <span className="text-[12.5px] font-medium text-[#b04d18]">
                Premium active
              </span>
            </div>
          ) : (
            <Link
              href="/dashboard/upgrade"
              className="mb-3 block rounded-xl bg-gradient-to-b from-[#d9622b] to-[#b04d18] px-3.5 py-3 text-white shadow-[0_10px_24px_-10px_rgba(217,98,43,0.7)] transition-transform hover:-translate-y-0.5"
            >
              <p className="text-[13px] font-semibold">
                {locked
                  ? "Trial ended"
                  : daysLeft <= 1
                    ? "Last day of trial"
                    : `${daysLeft} days left in trial`}
              </p>
              <p className="mt-0.5 text-[11.5px] text-white/80">
                {locked
                  ? "Subscribe to continue"
                  : `${aiLeft} of ${aiLimit} AI actions left today · Upgrade`}
              </p>
            </Link>
          )}
          <div className="flex items-center gap-2.5 rounded-xl border border-[#1f1a14]/10 bg-white px-2.5 py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d9622b]/12 text-[12px] font-semibold text-[#b04d18]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-[#1f1a14]">
                {name}
              </p>
              <div className="mt-0.5 flex items-center gap-2.5 text-[11.5px]">
                <Link
                  href="/onboarding"
                  className="text-[#b04d18] hover:underline"
                >
                  New goal
                </Link>
                <span className="text-[#1f1a14]/20">·</span>
                <button
                  onClick={() => {
                    clearSession();
                    router.push("/login");
                  }}
                  className="text-[#9a8f80] transition-colors hover:text-[#1f1a14]"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="relative z-[1] min-w-0 flex-1">
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-40 border-b border-[#1f1a14]/[0.09] bg-white/85 backdrop-blur md:hidden">
          <div className="flex h-12 items-center justify-between px-4">
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-[#1f1a14]"
            >
              Ascend
            </Link>
            <button
              onClick={() => {
                clearSession();
                router.push("/login");
              }}
              className="text-xs text-[#6b6155]"
            >
              Log out
            </button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
            {visibleTabs.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`rounded-lg px-3 py-1.5 text-xs whitespace-nowrap ${
                  pathname === t.href
                    ? "bg-[#d9622b]/12 font-medium text-[#b04d18]"
                    : "text-[#6b6155]"
                }`}
              >
                {t.label}
              </Link>
            ))}
            {!premium && (
              <Link
                href="/dashboard/upgrade"
                className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                  pathname === "/dashboard/upgrade"
                    ? "bg-[#d9622b] text-white"
                    : "bg-[#d9622b]/12 text-[#b04d18]"
                }`}
              >
                Go Premium ✦
              </Link>
            )}
          </nav>
        </header>

        {reminder && (
          <div className="mx-auto mt-4 max-w-[1080px] px-4 md:px-10">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#d9622b]/30 bg-[#d9622b]/10 px-4 py-3 text-sm text-[#4a4239] backdrop-blur-xl">
              <p>
                ⏰ It&apos;s time for:{" "}
                <strong className="font-semibold text-[#1f1a14]">
                  {reminder.activity}
                </strong>{" "}
                <span className="text-[#b04d18]">({reminder.time})</span>
              </p>
              <span className="flex shrink-0 gap-2">
                <Link
                  href="/dashboard/timetable"
                  className="rounded-full bg-gradient-to-br from-[#d9622b] to-[#b04d18] px-3.5 py-1 text-xs font-medium text-white"
                  onClick={() => setReminder(null)}
                >
                  Can&apos;t now? Adjust
                </Link>
                <button
                  onClick={() => setReminder(null)}
                  className="rounded-full border border-[#d9622b]/40 px-3.5 py-1 text-xs"
                >
                  Done
                </button>
              </span>
            </div>
          </div>
        )}

        {/* Locked (trial ended) users only ever see the upgrade page; while
            the redirect to it settles, don't flash the gated content. */}
        {locked && pathname !== "/dashboard/upgrade" ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <p className="animate-pulse text-sm text-[#6b6155]">
              Your free trial has ended. Taking you to upgrade…
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
