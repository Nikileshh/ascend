"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, clearSession, getUser, type SessionUser } from "@/lib/api";
import { Card } from "@/components/ui/Card";

interface AdminUser extends SessionUser {
  goal: string | null;
  lastActive: string | null;
  habitsMarked: number;
}

interface Analytics {
  totals: {
    users: number;
    admins: number;
    plansCreated: number;
    analysesRun: number;
    visits: number;
    visitsToday: number;
    activeToday: number;
  };
  activityByType: Record<string, number>;
  recent: { at: string; type: string; email?: string; detail?: string }[];
  users: AdminUser[];
}

const TABS = ["Users", "Analytics", "Activity"] as const;

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Users");
  const [error, setError] = useState("");

  useEffect(() => {
    const me = getUser();
    if (!me || me.role !== "admin") {
      router.replace("/login");
      return;
    }
    api<Analytics>("/admin/analytics")
      .then(setData)
      .catch((err) => setError((err as Error).message));
  }, [router]);

  if (error) return <p className="p-10 text-sm text-red-500">{error}</p>;
  if (!data)
    return (
      <p className="animate-pulse p-10 text-sm text-zinc-500">
        Loading admin data…
      </p>
    );

  const t = data.totals;

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white">
            Admin dashboard
          </h1>
          <button
            onClick={() => {
              clearSession();
              router.push("/login");
            }}
            className="rounded-full border border-black/10 px-4 py-1.5 text-sm text-black dark:border-white/15 dark:text-white"
          >
            Log out
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Registered users", t.users],
            ["Plans created", t.plansCreated],
            ["Analyses run", t.analysesRun],
            ["Total page visits", t.visits],
            ["Visits today", t.visitsToday],
            ["Active today", t.activeToday],
            ["Admins", t.admins],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-zinc-900"
            >
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-black dark:text-white">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {TABS.map((name) => (
            <button
              key={name}
              onClick={() => setTab(name)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                tab === name
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "text-zinc-600 hover:bg-black/5 dark:text-zinc-400 dark:hover:bg-white/10"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {tab === "Users" && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-zinc-500">
                  <tr className="border-b border-black/5 dark:border-white/10">
                    <th className="px-3 py-3 font-medium">Name</th>
                    <th className="px-3 py-3 font-medium">Email</th>
                    <th className="px-3 py-3 font-medium">Role</th>
                    <th className="px-3 py-3 font-medium">Goal</th>
                    <th className="px-3 py-3 font-medium">Analyses</th>
                    <th className="px-3 py-3 font-medium">Habits marked</th>
                    <th className="px-3 py-3 font-medium">Joined</th>
                    <th className="px-3 py-3 font-medium">Last active</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-800 dark:text-zinc-200">
                  {data.users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-black/5 last:border-0 dark:border-white/10"
                    >
                      <td className="px-3 py-3">{u.name}</td>
                      <td className="px-3 py-3">{u.email}</td>
                      <td className="px-3 py-3 capitalize">{u.role}</td>
                      <td className="max-w-48 truncate px-3 py-3">
                        {u.goal ?? "—"}
                      </td>
                      <td className="px-3 py-3">{u.analysisCount}</td>
                      <td className="px-3 py-3">{u.habitsMarked}</td>
                      <td className="px-3 py-3">{fmt(u.createdAt)}</td>
                      <td className="px-3 py-3">{fmt(u.lastActive)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === "Analytics" && (
          <Card title="Activity by type">
            <ul className="space-y-2">
              {Object.entries(data.activityByType)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <li key={type} className="flex items-center gap-3 text-sm">
                    <span className="w-32 text-zinc-600 capitalize dark:text-zinc-400">
                      {type.replace("_", " ")}
                    </span>
                    <span
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-600"
                      style={{
                        width: `${Math.max(4, (count / Math.max(...Object.values(data.activityByType))) * 60)}%`,
                      }}
                    />
                    <span className="font-medium text-black dark:text-white">
                      {count}
                    </span>
                  </li>
                ))}
            </ul>
          </Card>
        )}

        {tab === "Activity" && (
          <Card title="Recent activity">
            <ul className="divide-y divide-black/5 text-sm dark:divide-white/10">
              {data.recent.map((a, i) => (
                <li key={i} className="flex gap-4 py-2.5">
                  <span className="w-36 shrink-0 text-zinc-500">
                    {fmt(a.at)}
                  </span>
                  <span className="w-24 shrink-0 font-medium text-black capitalize dark:text-white">
                    {a.type.replace("_", " ")}
                  </span>
                  <span className="truncate text-zinc-600 dark:text-zinc-400">
                    {a.email ?? ""} {a.detail ? `— ${a.detail}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </main>
  );
}
