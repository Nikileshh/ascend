"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, setSession, type SessionUser } from "@/lib/api";
import { AuthCard, buttonClass, inputClass } from "@/components/ui/AuthCard";
import { PasswordInput } from "@/components/ui/PasswordInput";

type View = "login" | "verify" | "forgot" | "reset";
type Auth = { token: string; user: SessionUser };

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  function go(next: View) {
    setError("");
    setNotice("");
    setView(next);
  }

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, user } = await api<Auth>("/auth/login", {
        body: { email, password },
      });
      setSession(token, user);
      router.push(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("verified")) go("verify");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, user } = await api<Auth>("/auth/verify", {
        body: { email, code },
      });
      setSession(token, user);
      router.push("/onboarding");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onForgot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { message } = await api<{ message: string }>("/auth/forgot", {
        body: { email },
      });
      setCode("");
      setNewPassword("");
      setNotice(message);
      setView("reset");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, user } = await api<Auth>("/auth/reset", {
        body: { email, code, password: newPassword },
      });
      setSession(token, user);
      router.push(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // ── Verify Gmail (unverified account tried to log in) ──
  if (view === "verify")
    return (
      <AuthCard
        title="Verify your Gmail"
        subtitle={`Your account isn't verified yet. We just emailed a 6-digit code to ${email}.`}
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
            onClick={() => api("/auth/resend", { body: { email } })}
            className="font-medium text-[#a8721f] hover:underline"
          >
            resend the code
          </button>
        </p>
      </AuthCard>
    );

  // ── Forgot password: ask for the email ──
  if (view === "forgot")
    return (
      <AuthCard
        title="Forgot your password?"
        subtitle="Enter your Gmail and we'll send you a 6-digit reset code."
      >
        <form onSubmit={onForgot} className="space-y-4">
          <input
            type="email"
            required
            placeholder="yourname@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          {error && <p className="text-sm text-[#b5551f]">{error}</p>}
          <button type="submit" disabled={loading} className={buttonClass}>
            {loading ? "Sending…" : "Send reset code"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-[#6b6155]">
          Remembered it?{" "}
          <button
            onClick={() => go("login")}
            className="font-medium text-[#a8721f] hover:underline"
          >
            Back to log in
          </button>
        </p>
      </AuthCard>
    );

  // ── Reset: enter the code + a new password ──
  if (view === "reset")
    return (
      <AuthCard
        title="Set a new password"
        subtitle={`Enter the code we emailed to ${email} and choose a new password.`}
      >
        <form onSubmit={onReset} className="space-y-4">
          {notice && (
            <p className="rounded-xl border border-[#a8721f]/30 bg-[#a8721f]/[0.08] px-4 py-2.5 text-[13px] text-[#7d5a1e]">
              {notice}
            </p>
          )}
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
          <PasswordInput
            required
            minLength={6}
            placeholder="New password (min 6 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {error && <p className="text-sm text-[#b5551f]">{error}</p>}
          <button type="submit" disabled={loading} className={buttonClass}>
            {loading ? "Resetting…" : "Reset password & log in"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-[#6b6155]">
          Didn&apos;t get a code?{" "}
          <button
            onClick={() => go("forgot")}
            className="font-medium text-[#a8721f] hover:underline"
          >
            Send again
          </button>
        </p>
      </AuthCard>
    );

  // ── Login (default) ──
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to continue your ascent. Admins are redirected to the admin dashboard."
    >
      <form onSubmit={onLogin} className="space-y-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <PasswordInput
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="text-right">
          <button
            type="button"
            onClick={() => go("forgot")}
            className="text-[13px] font-medium text-[#a8721f] hover:underline"
          >
            Forgot password?
          </button>
        </div>
        {error && <p className="text-sm text-[#b5551f]">{error}</p>}
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-[#6b6155]">
        New to Ascend?{" "}
        <Link
          href="/register"
          className="font-medium text-[#a8721f] hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
