"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, setSession, type SessionUser } from "@/lib/api";
import { AuthCard, buttonClass, inputClass } from "@/components/ui/AuthCard";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0); // cooldown seconds

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api("/auth/register", { body: { name, email, password } });
      setVerifying(true);
      setNotice(`We emailed a 6-digit code to ${email}.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, user } = await api<{ token: string; user: SessionUser }>(
        "/auth/verify",
        { body: { email, code } },
      );
      setSession(token, user);
      router.push("/onboarding");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (resendIn > 0) return;
    setError("");
    try {
      await api("/auth/resend", { body: { email } });
      setNotice(`A new code is on its way to ${email}.`);
      setCode("");
      let t = 30;
      setResendIn(t);
      const timer = setInterval(() => {
        t -= 1;
        setResendIn(t);
        if (t <= 0) clearInterval(timer);
      }, 1000);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (verifying) {
    return (
      <AuthCard
        title="Verify your Gmail"
        subtitle={notice || `Enter the 6-digit code we sent to ${email}.`}
      >
        <form onSubmit={onVerify} className="space-y-4">
          <input
            required
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className={`${inputClass} text-center font-mono text-lg tracking-[0.5em]`}
          />
          {error && <p className="text-sm text-[#b5551f]">{error}</p>}
          <button type="submit" disabled={loading} className={buttonClass}>
            {loading ? "Verifying…" : "Verify & continue"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-[#6b6155]">
          Didn&apos;t get it? Check spam, or{" "}
          <button
            onClick={resend}
            disabled={resendIn > 0}
            className="font-medium text-[#d9622b] hover:underline disabled:text-[#9a8f80] disabled:no-underline"
          >
            {resendIn > 0 ? `resend in ${resendIn}s` : "resend the code"}
          </button>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Start your 7-day free trial"
      subtitle="Sign up with your Gmail — we'll send a code to verify it's really you."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          required
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        <input
          type="email"
          required
          placeholder="yourname@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <PasswordInput
          required
          minLength={6}
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordInput
          required
          minLength={6}
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <p className="text-sm text-[#b5551f]">{error}</p>}
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-[#6b6155]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-[#d9622b] hover:underline"
        >
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
