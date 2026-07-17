import nodemailer from "nodemailer";
import { env } from "./env.js";
import type { User } from "./store.js";

const transport =
  env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      })
    : null;

/** All app mail goes through here (from nikileshh2005@gmail.com). */
export async function sendMail(
  to: string,
  subject: string,
  text: string,
  html?: string,
) {
  if (!transport) {
    console.log(`[email] SMTP not configured — would send to ${to}:`);
    console.log(`[email] Subject: ${subject}\n${text}`);
    return;
  }
  await transport.sendMail({ from: env.SMTP_FROM, to, subject, text, html });
}

/** Fire-and-forget wrapper so emails never block or crash a request. */
export function notify(
  to: string,
  subject: string,
  text: string,
  html?: string,
) {
  sendMail(to, subject, text, html).catch((err) =>
    console.error(`[email] failed to send "${subject}" to ${to}:`, err.message),
  );
}

const signoff = "\n— Ascend, your AI goal coach";

// ────────────────────────────────────────────────────────────────────────────
// Branded HTML email system — warm editorial theme (matches the website).
// Bone canvas, espresso ink, amber accent, Georgia serif headings. Everything
// is inline-styled and table-based so it renders the same in Gmail/Outlook.
// ────────────────────────────────────────────────────────────────────────────

const C = {
  canvas: "#f4efe6",
  card: "#ffffff",
  border: "#eae3d6",
  ink: "#1f1a14",
  body: "#4a4239",
  soft: "#6b6155",
  faint: "#9a8f80",
  amber: "#a8721f",
  amberDark: "#7d5a1e",
  champagne: "#fbf3e2",
};
const serif = "Georgia, 'Times New Roman', serif";
const sans =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function esc(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Wraps body content in the full branded email shell. */
function shell(opts: {
  preview?: string;
  eyebrow?: string;
  heading: string;
  body: string; // inner HTML
}) {
  const { preview = "", eyebrow, heading, body } = opts;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:${C.canvas};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.canvas};padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.card};border:1px solid ${C.border};border-radius:18px;overflow:hidden;box-shadow:0 20px 50px -24px rgba(70,50,20,0.22);">
      <tr><td style="padding:30px 36px 8px 36px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="width:30px;height:30px;background:${C.amber};border-radius:8px;text-align:center;vertical-align:middle;color:#fff;font-size:14px;line-height:30px;">&#9650;</td>
          <td style="padding-left:10px;font-family:${serif};font-size:19px;color:${C.ink};font-weight:600;letter-spacing:-0.2px;">Ascend</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:22px 36px 4px 36px;">
        ${eyebrow ? `<div style="font-family:${sans};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.amber};font-weight:600;margin-bottom:10px;">${esc(eyebrow)}</div>` : ""}
        <h1 style="margin:0;font-family:${serif};font-size:27px;line-height:1.2;color:${C.ink};font-weight:600;">${esc(heading)}</h1>
      </td></tr>
      <tr><td style="padding:16px 36px 30px 36px;font-family:${sans};font-size:15px;line-height:1.62;color:${C.body};">
        ${body}
      </td></tr>
      <tr><td style="padding:20px 36px 30px 36px;border-top:1px solid ${C.border};">
        <div style="font-family:${serif};font-size:14px;color:${C.soft};font-style:italic;">— Ascend, your AI goal coach</div>
        <div style="font-family:${sans};font-size:11px;color:${C.faint};margin-top:8px;">You're receiving this because you have an Ascend account.</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function p(text: string) {
  return `<p style="margin:0 0 14px 0;">${text}</p>`;
}

function btn(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 8px 0;"><tr><td style="background:${C.ink};border-radius:999px;">
    <a href="${href}" style="display:inline-block;padding:12px 26px;font-family:${sans};font-size:14px;font-weight:600;color:#f7f1e6;text-decoration:none;">${esc(label)}</a>
  </td></tr></table>`;
}

/** Amber-highlighted callout box (OTP codes, key facts). */
function callout(inner: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 18px 0;background:${C.champagne};border:1px solid ${C.amber}33;border-radius:12px;"><tr><td style="padding:18px 22px;">${inner}</td></tr></table>`;
}

/** Renders a timetable as clean rows: time in amber, activity in ink. */
function scheduleHtml(slots: { time: string; activity: string }[]) {
  const rows = slots
    .map(
      (t) =>
        `<tr>
          <td style="padding:8px 14px 8px 0;font-family:${sans};font-size:13px;font-weight:600;color:${C.amberDark};white-space:nowrap;vertical-align:top;border-bottom:1px solid ${C.border};">${esc(t.time)}</td>
          <td style="padding:8px 0;font-family:${sans};font-size:14px;color:${C.ink};border-bottom:1px solid ${C.border};">${esc(t.activity)}</td>
        </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 18px 0;">${rows}</table>`;
}

function bulletsHtml(items: string[]) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 18px 0;">${items
    .map(
      (i) =>
        `<tr><td style="padding:3px 10px 3px 0;vertical-align:top;color:${C.amber};font-size:15px;line-height:1.5;">&bull;</td><td style="padding:3px 0;font-family:${sans};font-size:14px;line-height:1.5;color:${C.body};">${esc(i)}</td></tr>`,
    )
    .join("")}</table>`;
}

const APP_URL = env.FRONTEND_URL;

// ────────────────────────────────────────────────────────────────────────────
// Emails
// ────────────────────────────────────────────────────────────────────────────

export function sendVerificationEmail(
  name: string,
  email: string,
  code: string,
) {
  notify(
    email,
    `${code} is your Ascend verification code`,
    `Hi ${name},

Your Ascend verification code is:

    ${code}

Enter it in the app to verify your Gmail address and activate your account. The code expires in 15 minutes.

If you didn't sign up for Ascend, you can ignore this email.${signoff}`,
    shell({
      preview: `${code} — your Ascend verification code`,
      eyebrow: "Verify your account",
      heading: `Hi ${name}, here's your code`,
      body:
        p(
          "Enter this code in the app to verify your Gmail and activate your account:",
        ) +
        callout(
          `<div style="font-family:${serif};font-size:34px;letter-spacing:8px;font-weight:700;color:${C.ink};text-align:center;">${esc(code)}</div>`,
        ) +
        p(
          `<span style="color:${C.faint};">The code expires in 15 minutes. If you didn't sign up for Ascend, you can safely ignore this email.</span>`,
        ),
    }),
  );
}

export function sendPasswordResetEmail(
  name: string,
  email: string,
  code: string,
) {
  notify(
    email,
    `${code} is your Ascend password reset code`,
    `Hi ${name},

We received a request to reset your Ascend password. Your reset code is:

    ${code}

Enter it in the app along with your new password. The code expires in 15 minutes.

If you didn't request this, you can safely ignore this email — your password stays unchanged.${signoff}`,
    shell({
      preview: `${code} — your Ascend password reset code`,
      eyebrow: "Password reset",
      heading: `Reset your password, ${name}`,
      body:
        p("Use this code in the app to set a new password:") +
        callout(
          `<div style="font-family:${serif};font-size:34px;letter-spacing:8px;font-weight:700;color:${C.ink};text-align:center;">${esc(code)}</div>`,
        ) +
        p(
          `<span style="color:${C.faint};">The code expires in 15 minutes. If you didn't request a reset, ignore this email — your password stays unchanged.</span>`,
        ),
    }),
  );
}

export function sendWelcomeEmail(name: string, email: string) {
  notify(
    email,
    "Welcome to Ascend — your account is verified ✓",
    `Hi ${name},

Your Gmail is verified and your Ascend account is active.

Next step: tell your AI coach your goal. It will interview you, then build your personalized roadmap, daily timetable, and habit system.

Let's begin your ascent.${signoff}`,
    shell({
      preview: "Your Ascend account is verified — let's begin.",
      eyebrow: "Welcome",
      heading: `Welcome to Ascend, ${name}`,
      body:
        p(
          "Your Gmail is verified and your account is active. You've got a <strong>14-day free trial</strong> to explore everything.",
        ) +
        p(
          "Next step: tell your AI coach your goal. It'll interview you, then build your personalized roadmap, daily timetable, and habit system.",
        ) +
        btn(`${APP_URL}/onboarding`, "Set my goal") +
        p(
          `<span style="color:${C.faint};">Consistency beats intensity. Let's begin your ascent.</span>`,
        ),
    }),
  );
}

export function sendLoginAlert(user: User) {
  const when = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  notify(
    user.email,
    "New login to your Ascend account",
    `Hi ${user.name},

You just logged in to Ascend on ${when}.

If this was you, you're all set — your plan is waiting on the dashboard. If not, change your password immediately.${signoff}`,
    shell({
      preview: "New login to your Ascend account",
      eyebrow: "Security",
      heading: "New login detected",
      body:
        p(
          `Hi ${esc(user.name)}, you just logged in to Ascend on <strong>${esc(when)}</strong>.`,
        ) +
        btn(`${APP_URL}/dashboard`, "Open dashboard") +
        p(
          `<span style="color:${C.faint};">If this wasn't you, change your password immediately.</span>`,
        ),
    }),
  );
}

export function sendPlanReadyEmail(user: User) {
  const pl = user.plan;
  if (!pl) return;
  notify(
    user.email,
    `Your plan for "${pl.goal}" is ready 🎯`,
    `Hi ${user.name},

Your AI coach has finished building your execution system for:

    ${pl.goal}

Difficulty: ${pl.profile.goalDifficulty} · Timeline: ~${pl.profile.estimatedMonths} months · ${pl.profile.dailyHours}h/day

MONTH 1 — ${pl.roadmap[0]?.title}
${pl.roadmap[0]?.objectives.map((o) => `  • ${o}`).join("\n")}

YOUR DAILY TIMETABLE
${pl.timetable.map((t) => `  ${t.time}  ${t.activity}`).join("\n")}

YOUR HABITS
${pl.habits.map((h) => `  • ${h.name} (${h.frequency})`).join("\n")}

Open your dashboard to start today. Consistency beats intensity.${signoff}`,
    shell({
      preview: `Your plan for "${pl.goal}" is ready`,
      eyebrow: "Your plan is ready",
      heading: pl.goal,
      body:
        callout(
          `<div style="font-family:${sans};font-size:13px;color:${C.soft};">Difficulty <strong style="color:${C.ink};">${esc(pl.profile.goalDifficulty)}</strong> &nbsp;·&nbsp; ~<strong style="color:${C.ink};">${pl.profile.estimatedMonths} months</strong> &nbsp;·&nbsp; <strong style="color:${C.ink};">${pl.profile.dailyHours}h/day</strong></div>`,
        ) +
        `<div style="font-family:${sans};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${C.faint};font-weight:600;margin:6px 0 8px;">Month 1 — ${esc(pl.roadmap[0]?.title ?? "")}</div>` +
        bulletsHtml(pl.roadmap[0]?.objectives ?? []) +
        `<div style="font-family:${sans};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${C.faint};font-weight:600;margin:6px 0 8px;">Your daily timetable</div>` +
        scheduleHtml(pl.timetable) +
        `<div style="font-family:${sans};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${C.faint};font-weight:600;margin:6px 0 8px;">Your habits</div>` +
        bulletsHtml(pl.habits.map((h) => `${h.name} (${h.frequency})`)) +
        btn(`${APP_URL}/dashboard`, "Start today"),
    }),
  );
}

export function sendTimetableUpdatedEmail(user: User) {
  const pl = user.plan;
  if (!pl) return;
  notify(
    user.email,
    "Your Ascend timetable was updated",
    `Hi ${user.name},

Your daily timetable was just changed. Here's the new schedule your reminders will follow:

${pl.timetable.map((t) => `  ${t.time}  ${t.activity}`).join("\n")}

If you didn't make this change, log in and review it.${signoff}`,
    shell({
      preview: "Your Ascend timetable was updated",
      eyebrow: "Timetable updated",
      heading: "Your new daily schedule",
      body:
        p(
          "Your timetable was just changed. Here's the schedule your reminders will follow from now on:",
        ) +
        scheduleHtml(pl.timetable) +
        p(
          `<span style="color:${C.faint};">If you didn't make this change, log in and review it.</span>`,
        ),
    }),
  );
}

export function sendReflectionEmail(user: User, adjustments: string) {
  notify(
    user.email,
    "Your weekly reflection — coach's adjustments",
    `Hi ${user.name},

Thanks for reflecting on your week. Here's what your coach suggests for next week:

${adjustments.replace(/\*\*/g, "")}

Small adjustments, kept consistently, are how goals get finished.${signoff}`,
    shell({
      preview: "Your coach's adjustments for next week",
      eyebrow: "Weekly reflection",
      heading: "Your coach's adjustments",
      body:
        p(
          "Thanks for reflecting on your week. Here's what your coach suggests for next week:",
        ) +
        callout(
          `<div style="font-family:${sans};font-size:14px;line-height:1.6;color:${C.body};">${esc(adjustments.replace(/\*\*/g, "")).replace(/\n/g, "<br>")}</div>`,
        ) +
        p(
          `<span style="color:${C.faint};">Small adjustments, kept consistently, are how goals get finished.</span>`,
        ),
    }),
  );
}

export function sendDailyPlanEmail(user: User) {
  const pl = user.plan;
  if (!pl) return;
  const first = user.name.split(" ")[0] || user.name;
  notify(
    user.email,
    `Good morning ${first} — today's plan ☀️`,
    `Good morning ${user.name},

Here's your day, built for "${pl.goal}":

${pl.timetable.map((t) => `  ${t.time}  ${t.activity}`).join("\n")}

TODAY'S HABITS
${pl.habits.map((h) => `  ☐ ${h.name}`).join("\n")}

Check them off in the app as you go — your streak is counting on you.${signoff}`,
    shell({
      preview: `Good morning ${first} — here's your day.`,
      eyebrow: "Good morning ☀️",
      heading: `Good morning, ${first}`,
      body:
        p(`Here's your day, built for <strong>${esc(pl.goal)}</strong>:`) +
        scheduleHtml(pl.timetable) +
        `<div style="font-family:${sans};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${C.faint};font-weight:600;margin:6px 0 8px;">Today's habits</div>` +
        bulletsHtml(pl.habits.map((h) => h.name)) +
        btn(`${APP_URL}/dashboard`, "Check them off") +
        p(
          `<span style="color:${C.faint};">Your streak is counting on you.</span>`,
        ),
    }),
  );
}

export function sendTaskStartingEmail(
  user: User,
  slot: { time: string; activity: string },
) {
  notify(
    user.email,
    `⏰ Now: ${slot.activity}`,
    `Hi ${user.name},

It's time for your next block:

    ${slot.time}  —  ${slot.activity}

Give it your full focus. If you can't do it right now, open Ascend and adjust your timetable so the rest of your day still lines up.${signoff}`,
    shell({
      preview: `It's time for: ${slot.activity}`,
      eyebrow: `⏰ ${slot.time}`,
      heading: "Time for your next block",
      body:
        callout(
          `<div style="font-family:${sans};"><span style="font-size:13px;font-weight:600;color:${C.amberDark};">${esc(slot.time)}</span><div style="font-family:${serif};font-size:20px;color:${C.ink};margin-top:4px;">${esc(slot.activity)}</div></div>`,
        ) +
        p("Give it your full focus.") +
        btn(`${APP_URL}/dashboard/timetable`, "Can't now — adjust") +
        p(
          `<span style="color:${C.faint};">Adjusting keeps the rest of your day lined up.</span>`,
        ),
    }),
  );
}

/** Sent to the user when their premium is activated (payment approved or admin grant). */
export function sendPremiumActivatedEmail(user: User) {
  notify(
    user.email,
    "You're Ascend Premium ✦",
    `Hi ${user.name},

Your Ascend Premium is now active — thank you!

You now have unlimited goal analyses, every AI coach section, and priority access to new features. Open Ascend and keep climbing.${signoff}`,
    shell({
      preview: "Your Ascend Premium is now active.",
      eyebrow: "Premium ✦",
      heading: "You're Ascend Premium",
      body:
        p(
          `Hi ${esc(user.name)}, your Premium is now active — thank you for supporting the climb.`,
        ) +
        bulletsHtml([
          "Unlimited goal analyses & re-plans",
          "Every AI coach section — briefing, insights, chat",
          "Daily plan emails & task-start reminders",
          "Priority access to new features",
        ]) +
        btn(`${APP_URL}/dashboard`, "Keep climbing"),
    }),
  );
}

/** Alerts the admin inbox that a user submitted a payment awaiting review. */
export function sendPaymentSubmittedAdminAlert(payment: {
  name: string;
  email: string;
  amount: number;
  upiRef: string;
}) {
  notify(
    env.ADMIN_EMAIL,
    `New Ascend payment to review — ${payment.name}`,
    `A user submitted a premium payment awaiting your approval:

    Name:   ${payment.name}
    Email:  ${payment.email}
    Amount: ₹${payment.amount}
    UPI ref: ${payment.upiRef}

Open the admin dashboard → Payments tab to approve or reject it.${signoff}`,
    shell({
      preview: `Payment to review from ${payment.name}`,
      eyebrow: "Action needed",
      heading: "New payment to review",
      body:
        p("A user submitted a premium payment awaiting your approval:") +
        callout(
          `<div style="font-family:${sans};font-size:14px;line-height:1.8;color:${C.body};">
            <strong style="color:${C.ink};">${esc(payment.name)}</strong><br>
            ${esc(payment.email)}<br>
            Amount: <strong style="color:${C.ink};">&#8377;${payment.amount}</strong><br>
            UPI ref: <span style="font-family:monospace;color:${C.ink};">${esc(payment.upiRef)}</span>
          </div>`,
        ) +
        btn(`${APP_URL}/admin`, "Open admin → Payments"),
    }),
  );
}

// kept for compatibility with the register flow before verification existed
export async function sendRegistrationEmail(name: string, email: string) {
  notify(
    email,
    "Welcome to Ascend — you're registered!",
    `Hi ${name},\n\nYou have been successfully registered on Ascend.${signoff}`,
  );
}
