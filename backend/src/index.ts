import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { env } from "./env.js";
import {
  addPayment,
  addUser,
  allActivity,
  allPayments,
  allUsers,
  findPaymentById,
  findUserByEmail,
  findUserById,
  logActivity,
  save,
  trialInfo,
  type PaymentRequest,
  type User,
} from "./store.js";
import {
  publicUser,
  requireAdmin,
  requireAuth,
  signToken,
  type AuthedRequest,
} from "./auth.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendLoginAlert,
  sendPlanReadyEmail,
  sendTimetableUpdatedEmail,
  sendReflectionEmail,
  sendDailyPlanEmail,
  sendTaskStartingEmail,
  sendPremiumActivatedEmail,
  sendPaymentSubmittedAdminAlert,
} from "./email.js";
import {
  analyticsAgent,
  chatAgent,
  coachAgent,
  goalAgentQuestions,
  motivationAgent,
  orchestrate,
  reflectionAgent,
} from "./agents.js";

const TRIAL_ANALYSIS_LIMIT = 2;
// Testing mode: everyone gets the full plan (unlimited goals, all agents).
// Set to false to re-enable trial limits and Pro locks.
const FREE_ACCESS = true;

const app = express();
app.use(cors());
app.use(express.json());

// Seed the admin accounts on first boot.
const ADMINS = [
  { name: "Nikileshh", email: "nikileshh@ascend.app" },
  { name: "Rohith", email: "rohith@ascend.app" },
];
for (const admin of ADMINS) {
  if (!findUserByEmail(admin.email)) {
    addUser({
      id: randomUUID(),
      name: admin.name,
      email: admin.email,
      passwordHash: bcrypt.hashSync(env.ADMIN_PASSWORD, 10),
      role: "admin",
      createdAt: new Date().toISOString(),
      analysisCount: 0,
    });
    console.log(`Seeded admin account: ${admin.name} <${admin.email}>`);
  }
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// --- Auth (Gmail-only, verified via emailed OTP) ---

function newVerifyCode(user: User) {
  user.verifyCode = String(Math.floor(100000 + Math.random() * 900000));
  user.verifyExpires = new Date(Date.now() + 15 * 60_000).toISOString();
}

app.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body ?? {};
  if (!name || !email || !password)
    return res.status(400).json({ error: "name, email, password required" });
  if (!/^[^\s@]+@gmail\.com$/i.test(email))
    return res
      .status(400)
      .json({
        error: "Only Gmail accounts are allowed. Use your @gmail.com address.",
      });
  if (findUserByEmail(email))
    return res.status(409).json({ error: "Email already registered" });

  const user: User = {
    id: randomUUID(),
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: "user",
    createdAt: new Date().toISOString(),
    analysisCount: 0,
    verified: false,
  };
  newVerifyCode(user);
  addUser(user);
  logActivity("register", email);
  sendVerificationEmail(name, email, user.verifyCode!);
  res.status(201).json({
    needsVerification: true,
    email,
    message: "Verification code sent to your Gmail.",
  });
});

app.post("/auth/verify", (req, res) => {
  const { email, code } = req.body ?? {};
  const user = email && findUserByEmail(email);
  if (!user) return res.status(404).json({ error: "Account not found" });
  if (user.verified !== false)
    return res.json({ token: signToken(user), user: publicUser(user) });
  if (
    !code ||
    code !== user.verifyCode ||
    !user.verifyExpires ||
    new Date() > new Date(user.verifyExpires)
  )
    return res
      .status(400)
      .json({ error: "Invalid or expired code. Tap resend to get a new one." });

  user.verified = true;
  delete user.verifyCode;
  delete user.verifyExpires;
  save();
  logActivity("verify", user.email);
  sendWelcomeEmail(user.name, user.email);
  res.json({ token: signToken(user), user: publicUser(user) });
});

app.post("/auth/resend", (req, res) => {
  const { email } = req.body ?? {};
  const user = email && findUserByEmail(email);
  if (!user) return res.status(404).json({ error: "Account not found" });
  if (user.verified !== false)
    return res.status(400).json({ error: "Account already verified" });
  newVerifyCode(user);
  save();
  sendVerificationEmail(user.name, user.email, user.verifyCode!);
  res.json({ ok: true, message: "New code sent to your Gmail." });
});

// --- Password reset (emailed PIN) ---

app.post("/auth/forgot", (req, res) => {
  const email = String(req.body?.email ?? "");
  const user = email ? findUserByEmail(email) : undefined;
  // Only act for real, verified accounts — but always return the same generic
  // response so we never reveal whether an email is registered.
  if (user && user.verified !== false) {
    user.resetCode = String(Math.floor(100000 + Math.random() * 900000));
    user.resetExpires = new Date(Date.now() + 15 * 60_000).toISOString();
    save();
    logActivity("password_forgot", user.email);
    sendPasswordResetEmail(user.name, user.email, user.resetCode);
  }
  res.json({
    ok: true,
    message: "If that Gmail is registered, a reset code is on its way.",
  });
});

app.post("/auth/reset", (req, res) => {
  const { email, code, password } = req.body ?? {};
  const user = email ? findUserByEmail(email) : undefined;
  if (
    !user ||
    !user.resetCode ||
    code !== user.resetCode ||
    !user.resetExpires ||
    new Date() > new Date(user.resetExpires)
  )
    return res
      .status(400)
      .json({ error: "Invalid or expired reset code. Request a new one." });
  if (!password || String(password).length < 6)
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters." });

  user.passwordHash = bcrypt.hashSync(String(password), 10);
  user.verified = true; // resetting via the emailed code proves ownership
  delete user.resetCode;
  delete user.resetExpires;
  save();
  logActivity("password_reset", user.email);
  res.json({ token: signToken(user), user: publicUser(user) });
});

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body ?? {};
  const user = email && findUserByEmail(email);
  if (!user || !bcrypt.compareSync(password ?? "", user.passwordHash))
    return res.status(401).json({ error: "Invalid email or password" });
  if (user.verified === false) {
    newVerifyCode(user);
    save();
    sendVerificationEmail(user.name, user.email, user.verifyCode!);
    return res.status(403).json({
      needsVerification: true,
      error: "Your Gmail isn't verified yet. We just sent you a new code.",
    });
  }
  logActivity("login", user.email);
  sendLoginAlert(user);
  res.json({ token: signToken(user), user: publicUser(user) });
});

app.get("/auth/me", requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: publicUser(req.user!) });
});

// --- Onboarding agents ---

app.post("/agents/questions", requireAuth, async (req: AuthedRequest, res) => {
  const { goal } = req.body ?? {};
  if (!goal) return res.status(400).json({ error: "goal required" });
  try {
    res.json({ questions: await goalAgentQuestions(goal) });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

app.post(
  "/agents/orchestrate",
  requireAuth,
  async (req: AuthedRequest, res) => {
    const user = req.user!;
    const { goal, qa } = req.body ?? {};
    if (!goal || !Array.isArray(qa))
      return res.status(400).json({ error: "goal and qa required" });

    const { trialExpired } = trialInfo(user);
    const fullAccess = FREE_ACCESS || user.role === "admin";
    if (!fullAccess && trialExpired)
      return res.status(402).json({
        error:
          "Your 14-day free trial has ended. Subscribe to the Ascend plan (₹250/month) to continue.",
      });
    if (!fullAccess && user.analysisCount >= TRIAL_ANALYSIS_LIMIT)
      return res.status(402).json({
        error: `Free trial is limited to ${TRIAL_ANALYSIS_LIMIT} goal analyses. Subscribe to the Ascend plan (₹250/month) for unlimited analyses.`,
      });

    try {
      const plan = await orchestrate(goal, qa);
      user.plan = plan;
      user.memory = { goal, qa, profile: plan.profile, reflections: [] };
      user.analysisCount += 1;
      delete user.briefingCache; // new plan → fresh briefing/insights
      delete user.insightsCache;
      save();
      logActivity("orchestrate", user.email, goal);
      sendPlanReadyEmail(user);
      res.json({ plan });
    } catch (err) {
      res.status(502).json({ error: (err as Error).message });
    }
  },
);

// --- Plan data (no AI calls — fast) ---

app.get("/agents/plan", requireAuth, (req: AuthedRequest, res) => {
  const user = req.user!;
  if (!user.plan)
    return res
      .status(404)
      .json({ error: "No plan yet. Run onboarding first." });
  res.json({ plan: user.plan, habitLog: user.habitLog ?? {} });
});

// Customize the timetable (also how users reschedule unfinished tasks)
app.patch("/agents/timetable", requireAuth, (req: AuthedRequest, res) => {
  const user = req.user!;
  const { timetable } = req.body ?? {};
  if (!user.plan)
    return res
      .status(404)
      .json({ error: "No plan yet. Run onboarding first." });
  if (
    !Array.isArray(timetable) ||
    timetable.some(
      (t) => typeof t?.time !== "string" || typeof t?.activity !== "string",
    )
  )
    return res
      .status(400)
      .json({ error: "timetable must be [{time, activity}]" });
  user.plan.timetable = timetable.map((t) => ({
    time: t.time.trim(),
    activity: t.activity.trim(),
  }));
  save();
  logActivity("timetable_edit", user.email);
  sendTimetableUpdatedEmail(user);
  res.json({ timetable: user.plan.timetable });
});

// --- AI sections (one call each, per page) ---

app.get("/agents/briefing", requireAuth, async (req: AuthedRequest, res) => {
  const user = req.user!;
  if (!user.memory)
    return res
      .status(404)
      .json({ error: "No plan yet. Run onboarding first." });
  const today = new Date().toISOString().slice(0, 10);
  if (user.briefingCache?.date === today)
    return res.json({ coach: user.briefingCache.text });
  try {
    const coach = await coachAgent(user.memory, user.plan);
    user.briefingCache = { date: today, text: coach };
    save();
    res.json({ coach });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

app.get("/agents/insights", requireAuth, async (req: AuthedRequest, res) => {
  const user = req.user!;
  if (!user.memory)
    return res
      .status(404)
      .json({ error: "No plan yet. Run onboarding first." });
  const today = new Date().toISOString().slice(0, 10);
  if (user.insightsCache?.date === today)
    return res.json({
      analytics: user.insightsCache.analytics,
      motivation: user.insightsCache.motivation,
    });
  try {
    const [analytics, motivation] = await Promise.all([
      analyticsAgent(user.memory),
      motivationAgent(user.memory),
    ]);
    user.insightsCache = { date: today, analytics, motivation };
    save();
    res.json({ analytics, motivation });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

// --- AI chat ---

app.get("/agents/chat", requireAuth, (req: AuthedRequest, res) => {
  res.json({ messages: req.user!.chat ?? [] });
});

app.post("/agents/chat", requireAuth, async (req: AuthedRequest, res) => {
  const user = req.user!;
  const { message } = req.body ?? {};
  if (!message || typeof message !== "string")
    return res.status(400).json({ error: "message required" });
  if (!user.memory)
    return res
      .status(404)
      .json({ error: "No plan yet. Run onboarding first." });

  user.chat ??= [];
  user.chat.push({ role: "user", text: message, at: new Date().toISOString() });
  try {
    const reply = await chatAgent(user.memory, user.plan, user.chat, message);
    user.chat.push({
      role: "coach",
      text: reply,
      at: new Date().toISOString(),
    });
    if (user.chat.length > 200) user.chat.splice(0, user.chat.length - 200);
    save();
    logActivity("chat", user.email);
    res.json({ reply, messages: user.chat });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

// --- Habits ---

app.post("/agents/habits/log", requireAuth, (req: AuthedRequest, res) => {
  const user = req.user!;
  const { date, habit, status } = req.body ?? {};
  if (!user.plan)
    return res
      .status(404)
      .json({ error: "No plan yet. Run onboarding first." });
  if (
    !date ||
    !habit ||
    !["done", "missed", "clear"].includes(status) ||
    !user.plan.habits.some((h) => h.name === habit)
  )
    return res
      .status(400)
      .json({ error: "valid date, habit, status required" });

  user.habitLog ??= {};
  user.habitLog[date] ??= {};
  if (status === "clear") delete user.habitLog[date][habit];
  else user.habitLog[date][habit] = status;
  save();
  logActivity("habit", user.email, `${habit}: ${status}`);
  res.json({ habitLog: user.habitLog });
});

// Add a custom habit to the plan
app.post("/agents/habits", requireAuth, (req: AuthedRequest, res) => {
  const user = req.user!;
  if (!user.plan)
    return res
      .status(404)
      .json({ error: "No plan yet. Run onboarding first." });
  const name = String(req.body?.name ?? "").trim();
  const frequency = String(req.body?.frequency ?? "daily").trim();
  const why = String(req.body?.why ?? "").trim();
  if (!name || name.length > 40)
    return res.status(400).json({ error: "Habit name (1-40 chars) required" });
  if (!["daily", "weekdays", "weekly"].includes(frequency))
    return res
      .status(400)
      .json({ error: "frequency must be daily, weekdays or weekly" });
  if (user.plan.habits.some((h) => h.name.toLowerCase() === name.toLowerCase()))
    return res.status(409).json({ error: "You already have that habit" });
  if (user.plan.habits.length >= 15)
    return res
      .status(400)
      .json({ error: "That's plenty of habits — 15 is the max" });

  user.plan.habits.push({
    name,
    frequency,
    why: why || "A habit you chose to build toward your goal.",
  });
  save();
  logActivity("habit_add", user.email, name);
  res.status(201).json({ habits: user.plan.habits });
});

// Remove a habit from the plan (and its tracking history)
app.delete("/agents/habits/:name", requireAuth, (req: AuthedRequest, res) => {
  const user = req.user!;
  if (!user.plan)
    return res
      .status(404)
      .json({ error: "No plan yet. Run onboarding first." });
  const name = decodeURIComponent(String(req.params.name));
  const before = user.plan.habits.length;
  user.plan.habits = user.plan.habits.filter((h) => h.name !== name);
  if (user.plan.habits.length === before)
    return res.status(404).json({ error: "Habit not found" });
  // also drop it from every day's log so scores stay accurate
  for (const day of Object.values(user.habitLog ?? {})) delete day[name];
  save();
  logActivity("habit_remove", user.email, name);
  res.json({ habits: user.plan.habits });
});

// --- Reflection ---

app.post("/agents/reflection", requireAuth, async (req: AuthedRequest, res) => {
  const user = req.user!;
  const { win, distraction, lesson } = req.body ?? {};
  if (!user.memory)
    return res
      .status(404)
      .json({ error: "No plan yet. Run onboarding first." });
  if (!win || !distraction || !lesson)
    return res.status(400).json({ error: "win, distraction, lesson required" });
  try {
    const adjustments = await reflectionAgent(user.memory, {
      win,
      distraction,
      lesson,
    });
    user.memory.reflections.push({
      date: new Date().toISOString(),
      win,
      distraction,
      lesson,
    });
    save();
    logActivity("reflection", user.email);
    sendReflectionEmail(user, adjustments);
    res.json({ adjustments });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

// --- Visit tracking (page views) ---

app.post("/track", requireAuth, (req: AuthedRequest, res) => {
  const { page } = req.body ?? {};
  if (typeof page === "string" && page.length < 100)
    logActivity("visit", req.user!.email, page);
  res.json({ ok: true });
});

// --- Billing (manual UPI / GPay QR — zero gateway fees) ---

// What the upgrade screen needs: price, UPI target, and the user's status.
app.get("/billing/info", requireAuth, (req: AuthedRequest, res) => {
  const user = req.user!;
  const pending = allPayments().find(
    (p) => p.userId === user.id && p.status === "pending",
  );
  res.json({
    premium: user.role === "admin" || user.premium === true,
    price: env.PREMIUM_PRICE,
    upiId: env.UPI_ID,
    upiName: env.UPI_NAME,
    // /upi-qr.png is served by the frontend from its public/ folder
    pending: pending ?? null,
  });
});

// User submits their GPay/UPI transaction reference after paying.
app.post("/billing/request", requireAuth, (req: AuthedRequest, res) => {
  const user = req.user!;
  if (user.role === "admin" || user.premium === true)
    return res.status(400).json({ error: "You're already on Premium." });
  const upiRef = String(req.body?.upiRef ?? "").trim();
  if (upiRef.length < 4 || upiRef.length > 60)
    return res
      .status(400)
      .json({ error: "Enter the UPI transaction / reference ID from GPay." });
  if (allPayments().some((p) => p.userId === user.id && p.status === "pending"))
    return res
      .status(409)
      .json({ error: "You already have a payment awaiting review." });

  const payment: PaymentRequest = {
    id: randomUUID(),
    userId: user.id,
    name: user.name,
    email: user.email,
    amount: env.PREMIUM_PRICE,
    upiRef,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  addPayment(payment);
  logActivity(
    "payment_submitted",
    user.email,
    `₹${payment.amount} · ${upiRef}`,
  );
  sendPaymentSubmittedAdminAlert(payment);
  res.status(201).json({ payment });
});

// --- Admin ---

app.get("/admin/users", requireAuth, requireAdmin, (_req, res) => {
  res.json({ users: allUsers().map(publicUser) });
});

// Grant / revoke premium directly (toggle) — no payment needed.
app.post(
  "/admin/users/:id/premium",
  requireAuth,
  requireAdmin,
  (req: AuthedRequest, res) => {
    const target = findUserById(String(req.params.id));
    if (!target) return res.status(404).json({ error: "User not found" });
    const premium = Boolean(req.body?.premium);
    target.premium = premium;
    if (premium && !target.premiumSince)
      target.premiumSince = new Date().toISOString();
    if (!premium) delete target.premiumSince;
    save();
    logActivity(
      premium ? "premium_grant" : "premium_revoke",
      req.user!.email,
      target.email,
    );
    if (premium) sendPremiumActivatedEmail(target);
    res.json({ id: target.id, premium: target.premium });
  },
);

// Approve a payment request → activates the user's premium.
app.post(
  "/admin/payments/:id/approve",
  requireAuth,
  requireAdmin,
  (req: AuthedRequest, res) => {
    const payment = findPaymentById(String(req.params.id));
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    if (payment.status !== "pending")
      return res.status(400).json({ error: "Already reviewed" });
    const target = findUserById(payment.userId);
    payment.status = "approved";
    payment.reviewedAt = new Date().toISOString();
    payment.reviewedBy = req.user!.email;
    if (target) {
      target.premium = true;
      target.premiumSince ??= new Date().toISOString();
    }
    save();
    logActivity("payment_approved", req.user!.email, payment.email);
    if (target) sendPremiumActivatedEmail(target);
    res.json({ payment });
  },
);

// Reject a payment request (no premium granted).
app.post(
  "/admin/payments/:id/reject",
  requireAuth,
  requireAdmin,
  (req: AuthedRequest, res) => {
    const payment = findPaymentById(String(req.params.id));
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    if (payment.status !== "pending")
      return res.status(400).json({ error: "Already reviewed" });
    payment.status = "rejected";
    payment.reviewedAt = new Date().toISOString();
    payment.reviewedBy = req.user!.email;
    save();
    logActivity("payment_rejected", req.user!.email, payment.email);
    res.json({ payment });
  },
);

app.get("/admin/analytics", requireAuth, requireAdmin, (_req, res) => {
  const users = allUsers();
  const activity = allActivity();
  const today = new Date().toISOString().slice(0, 10);

  const lastActive: Record<string, string> = {};
  const counts: Record<string, number> = {};
  let visitsToday = 0;
  for (const a of activity) {
    counts[a.type] = (counts[a.type] ?? 0) + 1;
    if (a.email) lastActive[a.email] = a.at;
    if (a.type === "visit" && a.at.slice(0, 10) === today) visitsToday++;
  }
  const activeToday = new Set(
    activity
      .filter((a) => a.at.slice(0, 10) === today && a.email)
      .map((a) => a.email),
  ).size;

  const payments = allPayments();
  res.json({
    totals: {
      users: users.filter((u) => u.role === "user").length,
      admins: users.filter((u) => u.role === "admin").length,
      premium: users.filter((u) => u.role === "user" && u.premium).length,
      pendingPayments: payments.filter((p) => p.status === "pending").length,
      plansCreated: users.filter((u) => u.plan).length,
      analysesRun: users.reduce((s, u) => s + u.analysisCount, 0),
      visits: counts["visit"] ?? 0,
      visitsToday,
      activeToday,
    },
    activityByType: counts,
    recent: activity.slice(-80).reverse(),
    payments: [...payments].reverse(),
    users: users.map((u) => ({
      ...publicUser(u),
      goal: u.plan?.goal ?? null,
      lastActive: lastActive[u.email] ?? null,
      habitsMarked: Object.values(u.habitLog ?? {}).reduce(
        (s, day) => s + Object.keys(day).length,
        0,
      ),
    })),
  });
});

// --- Daily morning briefing: email each user their tasks for the day ---
let lastBriefingDate = "";
setInterval(
  () => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    if (now.getHours() === 6 && lastBriefingDate !== today) {
      lastBriefingDate = today;
      const recipients = allUsers().filter(
        (u) => u.plan && u.verified !== false && u.role === "user",
      );
      console.log(`Sending daily plan emails to ${recipients.length} users`);
      for (const u of recipients) sendDailyPlanEmail(u);
    }
  },
  10 * 60 * 1000,
);

// --- Per-task reminders: email each user when a timetable slot begins ---
// Checks every minute; a slot fires once per day (tracked in-memory).
const taskSent = new Set<string>();
let taskSweepDay = "";
setInterval(() => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (today !== taskSweepDay) {
    taskSent.clear(); // new day → allow every slot to fire again
    taskSweepDay = today;
  }
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const nowHHMM = `${hh}:${mm}`;

  for (const u of allUsers()) {
    if (!u.plan || u.verified === false || u.role !== "user") continue;
    for (const slot of u.plan.timetable) {
      const m = slot.time.match(/^(\d{1,2}):(\d{2})/);
      if (!m) continue;
      const slotStart = `${m[1].padStart(2, "0")}:${m[2]}`;
      if (slotStart !== nowHHMM) continue;
      const key = `${u.id}|${today}|${slot.time}|${slot.activity}`;
      if (taskSent.has(key)) continue;
      taskSent.add(key);
      sendTaskStartingEmail(u, slot);
    }
  }
}, 60 * 1000);

app.listen(env.PORT, () => {
  console.log(`Ascend API listening on http://localhost:${env.PORT}`);
});
