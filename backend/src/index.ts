import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { env } from "./env.js";
import {
  addUser,
  allActivity,
  allUsers,
  findUserByEmail,
  logActivity,
  save,
  trialInfo,
  type User,
} from "./store.js";
import {
  publicUser,
  requireAdmin,
  requireAuth,
  signToken,
  type AuthedRequest,
} from "./auth.js";
import { sendRegistrationEmail } from "./email.js";
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

// --- Auth ---

app.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body ?? {};
  if (!name || !email || !password)
    return res.status(400).json({ error: "name, email, password required" });
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
  };
  addUser(user);
  logActivity("register", email);
  sendRegistrationEmail(name, email).catch((err) =>
    console.error("Failed to send registration email:", err),
  );
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body ?? {};
  const user = email && findUserByEmail(email);
  if (!user || !bcrypt.compareSync(password ?? "", user.passwordHash))
    return res.status(401).json({ error: "Invalid email or password" });
  logActivity("login", user.email);
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
          "Your 1-week free trial has ended. Subscribe to the Ascend plan (₹250/month) to continue.",
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
      save();
      logActivity("orchestrate", user.email, goal);
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
  res.json({ timetable: user.plan.timetable });
});

// --- AI sections (one call each, per page) ---

app.get("/agents/briefing", requireAuth, async (req: AuthedRequest, res) => {
  const user = req.user!;
  if (!user.memory)
    return res
      .status(404)
      .json({ error: "No plan yet. Run onboarding first." });
  try {
    res.json({ coach: await coachAgent(user.memory, user.plan) });
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
  try {
    const [analytics, motivation] = await Promise.all([
      analyticsAgent(user.memory),
      motivationAgent(user.memory),
    ]);
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

// --- Admin ---

app.get("/admin/users", requireAuth, requireAdmin, (_req, res) => {
  res.json({ users: allUsers().map(publicUser) });
});

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

  res.json({
    totals: {
      users: users.filter((u) => u.role === "user").length,
      admins: users.filter((u) => u.role === "admin").length,
      plansCreated: users.filter((u) => u.plan).length,
      analysesRun: users.reduce((s, u) => s + u.analysisCount, 0),
      visits: counts["visit"] ?? 0,
      visitsToday,
      activeToday,
    },
    activityByType: counts,
    recent: activity.slice(-80).reverse(),
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

app.listen(env.PORT, () => {
  console.log(`Ascend API listening on http://localhost:${env.PORT}`);
});
