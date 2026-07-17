"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  GlassCard,
  inputDark,
  buttonAccent,
  CoachBadge,
} from "@/components/ui/Glass";

interface BillingInfo {
  premium: boolean;
  price: number;
  upiId: string;
  upiName: string;
  pending: {
    id: string;
    amount: number;
    upiRef: string;
    createdAt: string;
  } | null;
}

const PERKS = [
  "Unlimited goal analyses & re-plans",
  "Every AI coach section — briefing, insights, chat",
  "Adaptive roadmap with weekly breakdowns",
  "Daily plan emails & task-start reminders",
  "Priority access to new features",
];

export default function UpgradePage() {
  const [info, setInfo] = useState<BillingInfo | null>(null);
  const [ref, setRef] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // null = still probing, true = QR present, false = fall back to UPI id
  const [qrOk, setQrOk] = useState<boolean | null>(null);

  const load = () =>
    api<BillingInfo>("/billing/info")
      .then(setInfo)
      .catch((err) => setError((err as Error).message));

  useEffect(() => {
    load();
    // Probe the QR client-side so a missing file reliably shows the fallback
    // (an <img onError> can be missed across hydration).
    const probe = new window.Image();
    probe.onload = () => setQrOk(true);
    probe.onerror = () => setQrOk(false);
    probe.src = "/upi-qr.png";
  }, []);

  async function submit() {
    setError("");
    if (ref.trim().length < 4) {
      setError("Enter the UPI transaction / reference ID from GPay.");
      return;
    }
    setBusy(true);
    try {
      await api("/billing/request", { body: { upiRef: ref.trim() } });
      setRef("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const upiLink = info
    ? `upi://pay?pa=${encodeURIComponent(info.upiId)}&pn=${encodeURIComponent(
        info.upiName,
      )}&am=${info.price}&cu=INR&tn=${encodeURIComponent("Ascend Premium")}`
    : "#";

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-10 md:px-10">
      <header className="mb-8">
        <p className="font-mono text-[11px] tracking-[0.16em] text-[#a8721f] uppercase">
          Ascend Premium
        </p>
        <h1 className="font-display mt-2 text-[32px] leading-tight font-medium tracking-tight text-[#1f1a14] sm:text-[42px]">
          {info?.premium ? "You're Premium ✦" : "Unlock the full climb"}
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-[#6b6155]">
          {info?.premium
            ? "Your account has full access to every Ascend feature. Thank you for supporting the climb."
            : `Everything Ascend can do, for ₹${info?.price ?? 250}/month.`}
        </p>
      </header>

      {info?.premium ? (
        <GlassCard gradient className="max-w-xl">
          <CoachBadge caption="All features are unlocked on your account." />
          <ul className="space-y-2.5">
            {PERKS.map((p) => (
              <li
                key={p}
                className="flex items-start gap-2.5 text-[15px] text-[#4a4239]"
              >
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#a8721f]" />
                {p}
              </li>
            ))}
          </ul>
        </GlassCard>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          {/* Left: what you get */}
          <GlassCard title="What you get">
            <ul className="space-y-3">
              {PERKS.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-2.5 text-[15px] text-[#4a4239]"
                >
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#a8721f]" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-baseline gap-1.5 border-t border-[#1f1a14]/[0.08] pt-5">
              <span className="font-display text-[40px] font-medium text-[#1f1a14]">
                ₹{info?.price ?? 250}
              </span>
              <span className="text-[14px] text-[#9a8f80]">/ month</span>
            </div>
          </GlassCard>

          {/* Right: pay via GPay QR */}
          <GlassCard title="Pay with GPay / UPI" gradient>
            {info?.pending ? (
              <div className="rounded-2xl border border-[#a8721f]/30 bg-[#a8721f]/[0.07] p-5 text-center">
                <p className="text-[15px] font-medium text-[#7d5a1e]">
                  Payment received — awaiting review
                </p>
                <p className="mt-1.5 text-[13px] text-[#6b6155]">
                  We got your reference{" "}
                  <span className="font-mono text-[#1f1a14]">
                    {info.pending.upiRef}
                  </span>
                  . Your Premium activates as soon as an admin confirms it —
                  usually within a few hours. You&apos;ll get an email.
                </p>
              </div>
            ) : (
              <>
                <ol className="mb-5 space-y-1.5 text-[13.5px] text-[#6b6155]">
                  <li>
                    <span className="font-medium text-[#1f1a14]">1.</span> Scan
                    the QR in GPay / any UPI app and pay ₹{info?.price ?? 250}.
                  </li>
                  <li>
                    <span className="font-medium text-[#1f1a14]">2.</span> Copy
                    the UPI transaction / reference ID.
                  </li>
                  <li>
                    <span className="font-medium text-[#1f1a14]">3.</span> Paste
                    it below — we verify &amp; unlock Premium.
                  </li>
                </ol>

                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-2xl border border-[#1f1a14]/[0.09] bg-white p-3">
                    {qrOk === true ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src="/upi-qr.png"
                        alt="Scan to pay with GPay"
                        width={190}
                        height={190}
                        className="h-[190px] w-[190px] rounded-lg object-contain"
                      />
                    ) : (
                      <div className="flex h-[190px] w-[190px] flex-col items-center justify-center gap-2 rounded-lg bg-[#faf6ee] px-4 text-center">
                        <span className="text-2xl">📱</span>
                        <p className="text-[12px] text-[#9a8f80]">
                          {qrOk === null
                            ? "Loading…"
                            : "Pay to the UPI ID below."}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-[13px] text-[#1f1a14]">
                      {info?.upiId ?? "—"}
                    </p>
                    <a
                      href={upiLink}
                      className="mt-1 inline-block text-[12px] font-medium text-[#7d5a1e] hover:underline"
                    >
                      Open in a UPI app →
                    </a>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <label className="text-[12px] font-medium tracking-wide text-[#6b6155] uppercase">
                    UPI transaction / reference ID
                  </label>
                  <input
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    placeholder="e.g. 4198XXXXXX21"
                    className={inputDark}
                  />
                  {error && (
                    <p className="text-[13px] text-[#b5551f]">{error}</p>
                  )}
                  <button
                    onClick={submit}
                    disabled={busy}
                    className={`${buttonAccent} w-full`}
                  >
                    {busy ? "Submitting…" : "I've paid — unlock Premium"}
                  </button>
                </div>
              </>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
