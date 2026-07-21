"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, clearSession, getUser, type SessionUser } from "@/lib/api";
import { GlassCard, buttonAccent, inputDark } from "@/components/ui/Glass";
import { MountainBackdrop } from "@/components/ui/MountainBackdrop";
import { COPY_SECTIONS, DEFAULT_COPY } from "@/lib/copy";

interface AdminUser extends SessionUser {
  goal: string | null;
  lastActive: string | null;
  habitsMarked: number;
}

interface Payment {
  id: string;
  userId: string;
  name: string;
  email: string;
  amount: number;
  upiRef: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

interface Analytics {
  totals: {
    users: number;
    admins: number;
    premium: number;
    pendingPayments: number;
    plansCreated: number;
    analysesRun: number;
    visits: number;
    visitsToday: number;
    activeToday: number;
  };
  activityByType: Record<string, number>;
  recent: { at: string; type: string; email?: string; detail?: string }[];
  payments: Payment[];
  users: AdminUser[];
}

const TABS = ["Users", "Payments", "Content", "Analytics", "Activity"] as const;

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Premium on/off switch. */
function Toggle({
  on,
  onChange,
  busy,
}: {
  on: boolean;
  onChange: () => void;
  busy?: boolean;
}) {
  return (
    <button
      onClick={onChange}
      disabled={busy}
      aria-pressed={on}
      className={`relative inline-flex h-[22px] w-[38px] items-center rounded-full transition-colors duration-200 disabled:opacity-50 ${
        on ? "bg-[#d9622b]" : "bg-[#1f1a14]/15"
      }`}
      title={on ? "Premium — click to revoke" : "Free — click to grant premium"}
    >
      <span
        className={`inline-block h-[16px] w-[16px] transform rounded-full bg-white shadow transition-transform duration-200 ${
          on ? "translate-x-[19px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

/**
 * Website-wording editor: every headline/quote on the landing page, grouped
 * by section. Saved text goes live immediately; clearing a field (or Reset)
 * restores the original wording.
 */
function ContentEditor() {
  const [baseline, setBaseline] = useState<Record<string, string> | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ copy: Record<string, string> }>("/content")
      .then((r) => {
        const effective = { ...DEFAULT_COPY, ...(r.copy ?? {}) };
        setBaseline(effective);
        setDraft(effective);
      })
      .catch((err) => setError((err as Error).message));
  }, []);

  if (error) return <p className="text-sm text-[#b5551f]">{error}</p>;
  if (!baseline)
    return (
      <p className="animate-pulse text-sm text-[#9a8f80]">Loading content…</p>
    );

  const dirty = Object.keys(DEFAULT_COPY).some(
    (k) => (draft[k] ?? "") !== baseline[k],
  );

  async function saveAll() {
    setSaving(true);
    setError("");
    try {
      // Only store wording that differs from the built-in default.
      const overrides: Record<string, string> = {};
      for (const [key, def] of Object.entries(DEFAULT_COPY)) {
        const value = (draft[key] ?? "").trim();
        if (value && value !== def) overrides[key] = value;
      }
      await api("/admin/content", { method: "PUT", body: { copy: overrides } });
      const effective = { ...DEFAULT_COPY, ...overrides };
      setBaseline(effective);
      setDraft(effective);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d9622b]/25 bg-[#d9622b]/[0.06] px-5 py-3.5">
        <p className="text-[13px] text-[#6b6155]">
          Edit the wording shown on the landing page. Changes go live the moment
          you save — clear a field or press Reset to restore the original text.
        </p>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-[13px] font-medium text-[#5a7d2a]">
              Saved ✓ — live on the site
            </span>
          )}
          <button
            onClick={saveAll}
            disabled={!dirty || saving}
            className={buttonAccent}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {COPY_SECTIONS.map((section) => (
        <GlassCard key={section.title} title={section.title}>
          <p className="-mt-3 mb-5 text-[13px] text-[#9a8f80]">
            {section.hint}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {section.fields.map((f) => {
              const value = draft[f.key] ?? "";
              const edited = value.trim() !== f.default;
              return (
                <label
                  key={f.key}
                  className={f.multiline ? "block md:col-span-2" : "block"}
                >
                  <span className="mb-1.5 flex items-center justify-between">
                    <span className="text-[12px] font-medium tracking-wide text-[#6b6155] uppercase">
                      {f.label}
                      {edited && (
                        <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-[#d9622b] align-middle" />
                      )}
                    </span>
                    {edited && (
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({ ...d, [f.key]: f.default }))
                        }
                        className="text-[12px] text-[#9a8f80] underline-offset-2 hover:text-[#d9622b] hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </span>
                  {f.multiline ? (
                    <textarea
                      value={value}
                      rows={3}
                      placeholder={f.default}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, [f.key]: e.target.value }))
                      }
                      className={`${inputDark} resize-y leading-6`}
                    />
                  ) : (
                    <input
                      value={value}
                      placeholder={f.default}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, [f.key]: e.target.value }))
                      }
                      className={inputDark}
                    />
                  )}
                </label>
              );
            })}
          </div>
        </GlassCard>
      ))}

      <div className="flex justify-end">
        <button
          onClick={saveAll}
          disabled={!dirty || saving}
          className={buttonAccent}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Users");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = () =>
    api<Analytics>("/admin/analytics")
      .then(setData)
      .catch((err) => setError((err as Error).message));

  useEffect(() => {
    const me = getUser();
    if (!me || me.role !== "admin") {
      router.replace("/login");
      return;
    }
    load();
  }, [router]);

  async function togglePremium(u: AdminUser) {
    setBusyId(u.id);
    try {
      await api(`/admin/users/${u.id}/premium`, {
        body: { premium: !u.premium },
      });
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId("");
    }
  }

  async function reviewPayment(p: Payment, action: "approve" | "reject") {
    setBusyId(p.id);
    try {
      await api(`/admin/payments/${p.id}/${action}`, { body: {} });
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId("");
    }
  }

  if (error)
    return (
      <main className="min-h-screen bg-[#f4efe6] p-10">
        <p className="text-sm text-[#b5551f]">{error}</p>
      </main>
    );
  if (!data)
    return (
      <main className="min-h-screen bg-[#f4efe6] p-10">
        <p className="animate-pulse text-sm text-[#9a8f80]">
          Loading admin data…
        </p>
      </main>
    );

  const t = data.totals;
  const maxCount = Math.max(1, ...Object.values(data.activityByType));
  const pending = data.payments.filter((p) => p.status === "pending");
  const reviewed = data.payments.filter((p) => p.status !== "pending");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4efe6] px-6 py-12 text-[#1f1a14]">
      <MountainBackdrop src="/desk-bg.jpg" center={0.93} edge={0.83} />

      <div className="relative mx-auto max-w-5xl space-y-6">
        <div className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#d9622b] text-sm text-white">
              ▲
            </span>
            <div>
              <h1 className="font-display text-[30px] leading-none font-medium tracking-tight text-[#1f1a14]">
                Admin
              </h1>
              <p className="mt-1 font-mono text-[11px] tracking-[0.14em] text-[#9a8f80] uppercase">
                Ascend control room
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href="/"
              target="_blank"
              className="rounded-full border border-[#1f1a14]/[0.16] bg-white px-4 py-1.5 text-sm whitespace-nowrap text-[#6b6155] transition-colors hover:bg-[#faf6ee] hover:text-[#1f1a14]"
            >
              View site ↗
            </a>
            <button
              onClick={load}
              className="rounded-full border border-[#1f1a14]/[0.16] bg-white px-4 py-1.5 text-sm whitespace-nowrap text-[#6b6155] transition-colors hover:bg-[#faf6ee] hover:text-[#1f1a14]"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                clearSession();
                router.push("/login");
              }}
              className="rounded-full border border-[#1f1a14]/[0.16] bg-white px-4 py-1.5 text-sm whitespace-nowrap text-[#6b6155] transition-colors hover:bg-[#faf6ee] hover:text-[#1f1a14]"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="animate-fade-up-1 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ["Registered users", t.users],
              ["Premium users", t.premium],
              ["Pending payments", t.pendingPayments, t.pendingPayments > 0],
              ["Plans created", t.plansCreated],
              ["Analyses run", t.analysesRun],
              ["Page visits", t.visits],
              ["Visits today", t.visitsToday],
              ["Active today", t.activeToday],
            ] as [string, number, boolean?][]
          ).map(([label, value, highlight]) => (
            <div
              key={label}
              className={`rounded-2xl border p-4 ${
                highlight
                  ? "border-[#d9622b]/40 bg-[#d9622b]/[0.07]"
                  : "border-[#1f1a14]/[0.09] bg-white/70 backdrop-blur-xl"
              }`}
            >
              <p className="text-[11px] font-medium tracking-wide text-[#9a8f80] uppercase">
                {label}
              </p>
              <p
                className={`mt-1 text-2xl font-semibold ${
                  highlight && value > 0 ? "text-[#d9622b]" : "text-[#1f1a14]"
                }`}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="animate-fade-up-2 flex flex-wrap gap-2">
          {TABS.map((name) => (
            <button
              key={name}
              onClick={() => setTab(name)}
              className={`relative rounded-full px-4 py-1.5 text-sm transition-colors ${
                tab === name
                  ? "bg-gradient-to-b from-[#2a231b] to-[#1f1a14] font-medium text-[#f7f1e6]"
                  : "border border-[#1f1a14]/[0.14] bg-white text-[#6b6155] hover:bg-[#faf6ee] hover:text-[#1f1a14]"
              }`}
            >
              {name}
              {name === "Payments" && t.pendingPayments > 0 && (
                <span className="ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#b5551f] px-1 text-[10px] font-semibold text-white">
                  {t.pendingPayments}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="animate-fade-up-3">
          {tab === "Users" && (
            <GlassCard>
              {/* Mobile: stacked user cards with the premium toggle up front */}
              <ul className="space-y-3 md:hidden">
                {data.users.map((u) => (
                  <li
                    key={u.id}
                    className="rounded-2xl border border-[#1f1a14]/[0.09] bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-[#1f1a14]">
                          {u.name}
                        </p>
                        <p className="truncate text-[12.5px] text-[#6b6155]">
                          {u.email}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] capitalize ${
                          u.role === "admin"
                            ? "border border-[#d9622b]/40 bg-[#d9622b]/12 text-[#b04d18]"
                            : "border border-[#1f1a14]/10 bg-[#1f1a14]/[0.04] text-[#6b6155]"
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    {u.goal && (
                      <p className="mt-2 line-clamp-2 text-[13px] text-[#4a4239]">
                        🎯 {u.goal}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between border-t border-[#1f1a14]/[0.06] pt-3">
                      {u.role === "admin" ? (
                        <span className="text-[11.5px] text-[#9a8f80]">
                          Premium: always
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Toggle
                            on={!!u.premium}
                            busy={busyId === u.id}
                            onChange={() => togglePremium(u)}
                          />
                          <span
                            className={`text-[12px] font-medium ${
                              u.premium ? "text-[#d9622b]" : "text-[#9a8f80]"
                            }`}
                          >
                            {u.premium ? "Premium" : "Free"}
                          </span>
                        </div>
                      )}
                      <span className="font-mono text-[10.5px] text-[#9a8f80]">
                        active {fmt(u.lastActive)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop: full table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="text-[#9a8f80]">
                    <tr className="border-b border-[#1f1a14]/10">
                      <th className="px-3 py-3 font-medium">Name</th>
                      <th className="px-3 py-3 font-medium">Email</th>
                      <th className="px-3 py-3 font-medium">Role</th>
                      <th className="px-3 py-3 font-medium">Premium</th>
                      <th className="px-3 py-3 font-medium">Goal</th>
                      <th className="px-3 py-3 font-medium">Habits</th>
                      <th className="px-3 py-3 font-medium">Joined</th>
                      <th className="px-3 py-3 font-medium">Last active</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#4a4239]">
                    {data.users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-[#1f1a14]/[0.06] transition-colors last:border-0 hover:bg-[#d9622b]/[0.04]"
                      >
                        <td className="px-3 py-3 font-medium text-[#1f1a14]">
                          {u.name}
                        </td>
                        <td className="px-3 py-3">{u.email}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] capitalize ${
                              u.role === "admin"
                                ? "border border-[#d9622b]/40 bg-[#d9622b]/12 text-[#b04d18]"
                                : "border border-[#1f1a14]/10 bg-[#1f1a14]/[0.04] text-[#6b6155]"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {u.role === "admin" ? (
                            <span className="text-[11px] text-[#9a8f80]">
                              always
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Toggle
                                on={!!u.premium}
                                busy={busyId === u.id}
                                onChange={() => togglePremium(u)}
                              />
                              <span
                                className={`text-[11px] ${
                                  u.premium
                                    ? "text-[#d9622b]"
                                    : "text-[#9a8f80]"
                                }`}
                              >
                                {u.premium ? "Premium" : "Free"}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="max-w-48 truncate px-3 py-3">
                          {u.goal ?? "—"}
                        </td>
                        <td className="px-3 py-3">{u.habitsMarked}</td>
                        <td className="px-3 py-3 font-mono text-xs text-[#9a8f80]">
                          {fmt(u.createdAt)}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-[#9a8f80]">
                          {fmt(u.lastActive)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-[12px] text-[#9a8f80]">
                Flip the Premium switch to grant or revoke full access instantly
                — no payment required. The user is emailed when you grant it.
              </p>
            </GlassCard>
          )}

          {tab === "Payments" && (
            <div className="space-y-4">
              <GlassCard title="Awaiting review" gradient>
                {pending.length === 0 ? (
                  <p className="text-sm text-[#6b6155]">
                    No payments waiting. When a user pays via GPay and submits
                    their reference, it shows up here to approve.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {pending.map((p) => (
                      <li
                        key={p.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1f1a14]/[0.09] bg-white p-4"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-[#1f1a14]">
                            {p.name}{" "}
                            <span className="font-normal text-[#9a8f80]">
                              · {p.email}
                            </span>
                          </p>
                          <p className="mt-0.5 text-[13px] text-[#6b6155]">
                            ₹{p.amount} · UPI ref{" "}
                            <span className="font-mono text-[#1f1a14]">
                              {p.upiRef}
                            </span>{" "}
                            · {fmt(p.createdAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            onClick={() => reviewPayment(p, "approve")}
                            disabled={busyId === p.id}
                            className="rounded-full bg-gradient-to-b from-[#2a231b] to-[#1f1a14] px-4 py-1.5 text-[13px] font-medium text-[#f7f1e6] transition-all hover:-translate-y-0.5 disabled:opacity-50"
                          >
                            Approve & grant
                          </button>
                          <button
                            onClick={() => reviewPayment(p, "reject")}
                            disabled={busyId === p.id}
                            className="rounded-full border border-[#b5551f]/40 bg-white px-4 py-1.5 text-[13px] font-medium text-[#b5551f] transition-colors hover:bg-[#b5551f]/[0.06] disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </GlassCard>

              {reviewed.length > 0 && (
                <GlassCard title="History">
                  <ul className="divide-y divide-[#1f1a14]/[0.06] text-sm">
                    {reviewed.map((p) => (
                      <li
                        key={p.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                      >
                        <span className="text-[#4a4239]">
                          <span className="font-medium text-[#1f1a14]">
                            {p.name}
                          </span>{" "}
                          · ₹{p.amount} ·{" "}
                          <span className="font-mono text-xs">{p.upiRef}</span>
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] capitalize ${
                            p.status === "approved"
                              ? "bg-[#d9622b]/12 text-[#b04d18]"
                              : "bg-[#b5551f]/10 text-[#b5551f]"
                          }`}
                        >
                          {p.status} · {fmt(p.reviewedAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              )}
            </div>
          )}

          {tab === "Content" && <ContentEditor />}

          {tab === "Analytics" && (
            <GlassCard title="Activity by type" gradient>
              <ul className="space-y-3">
                {Object.entries(data.activityByType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <li key={type} className="flex items-center gap-3 text-sm">
                      <span className="w-36 shrink-0 text-[#6b6155] capitalize">
                        {type.replace(/_/g, " ")}
                      </span>
                      <span
                        className="h-2 rounded-full bg-gradient-to-r from-[#d9622b] to-[#e6c992]"
                        style={{
                          width: `${Math.max(4, (count / maxCount) * 60)}%`,
                        }}
                      />
                      <span className="font-mono font-medium text-[#1f1a14]">
                        {count}
                      </span>
                    </li>
                  ))}
              </ul>
            </GlassCard>
          )}

          {tab === "Activity" && (
            <GlassCard title="Recent activity">
              <ul className="divide-y divide-[#1f1a14]/[0.06] text-sm">
                {data.recent.map((a, i) => (
                  <li key={i} className="flex gap-4 py-2.5">
                    <span className="w-32 shrink-0 font-mono text-xs leading-5 text-[#9a8f80]">
                      {fmt(a.at)}
                    </span>
                    <span className="w-28 shrink-0 font-medium text-[#b04d18] capitalize">
                      {a.type.replace(/_/g, " ")}
                    </span>
                    <span className="truncate text-[#6b6155]">
                      {a.email ?? ""} {a.detail ? `— ${a.detail}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}
        </div>
      </div>
    </main>
  );
}
