import { llm, llmChat, extractJson, type ChatTurn } from "./ai.js";

export interface QA {
  question: string;
  answer: string;
}

export interface GoalProfile {
  goalDifficulty: string;
  estimatedMonths: number;
  dailyHours: number;
  weeklyHours: number;
  confidence: number;
  skillsRequired: string[];
  risks: string[];
}

export interface RoadmapWeek {
  week: number; // 1-4 within the month
  focus: string; // what to complete that week
}

export interface RoadmapMonth {
  month: number;
  title: string;
  objectives: string[];
  weeks: RoadmapWeek[];
}

export interface TimetableSlot {
  time: string;
  activity: string;
}

export interface Habit {
  name: string;
  frequency: string;
  why: string;
}

export interface UserMemory {
  goal: string;
  qa: QA[];
  profile: GoalProfile;
  reflections: {
    date: string;
    win: string;
    distraction: string;
    lesson: string;
  }[];
}

export interface Plan {
  goal: string;
  profile: GoalProfile;
  roadmap: RoadmapMonth[];
  timetable: TimetableSlot[];
  habits: Habit[];
  createdAt: string;
}

// When the AI is unreachable (missing/invalid key, quota, timeout), agents
// fall back to sample output so the app stays fully usable.
async function withFallback<T>(
  agent: string,
  call: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await call();
  } catch (err) {
    console.warn(
      `[${agent}] LLM unavailable, using sample output:`,
      (err as Error).message,
    );
    return fallback;
  }
}

// JSON Schemas for structured (Ollama-constrained) outputs — one per agent
// that must return machine-readable data. These guarantee the exact shape.
const strings = { type: "array", items: { type: "string" } } as const;
const questionsSchema = strings;
const profileSchema = {
  type: "object",
  properties: {
    goalDifficulty: { type: "string" },
    estimatedMonths: { type: "number" },
    dailyHours: { type: "number" },
    weeklyHours: { type: "number" },
    confidence: { type: "number" },
    skillsRequired: strings,
    risks: strings,
  },
  required: [
    "goalDifficulty",
    "estimatedMonths",
    "dailyHours",
    "weeklyHours",
    "confidence",
    "skillsRequired",
    "risks",
  ],
} as const;
const roadmapSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      month: { type: "number" },
      title: { type: "string" },
      objectives: strings,
      weeks: {
        type: "array",
        items: {
          type: "object",
          properties: { week: { type: "number" }, focus: { type: "string" } },
          required: ["week", "focus"],
        },
      },
    },
    required: ["month", "title", "objectives", "weeks"],
  },
} as const;
const timetableSchema = {
  type: "array",
  items: {
    type: "object",
    properties: { time: { type: "string" }, activity: { type: "string" } },
    required: ["time", "activity"],
  },
} as const;
const habitsSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      name: { type: "string" },
      frequency: { type: "string" },
      why: { type: "string" },
    },
    required: ["name", "frequency", "why"],
  },
} as const;

function qaText(qa: QA[]) {
  return qa.map((x) => `Q: ${x.question}\nA: ${x.answer}`).join("\n");
}

function memoryText(m: UserMemory) {
  return `Goal: ${m.goal}
Profile: ${JSON.stringify(m.profile)}
Onboarding answers:\n${qaText(m.qa)}
Recent reflections: ${JSON.stringify(m.reflections.slice(-3))}`;
}

// 1. Goal Agent — follow-up questions tailored to the goal
export function goalAgentQuestions(goal: string): Promise<string[]> {
  return withFallback("Goal Agent", () => goalAgentQuestionsLive(goal), [
    `What is your current level of preparation or experience toward "${goal}"?`,
    "What is your target deadline or timeline?",
    "How many hours per day can you realistically invest?",
    "What time do you usually wake up, and what time do you go to sleep?",
    "What do you consider your weakest area for this goal?",
    "What other commitments (work, college, family) shape your day?",
    "When during the day do you focus best?",
  ]);
}

async function goalAgentQuestionsLive(goal: string): Promise<string[]> {
  const text = await llm(
    `You are the Goal Analysis Agent of Ascend, a personal AI coaching app.
A user has this goal: "${goal}".
Ask exactly 7 short, intelligent follow-up questions to understand: their current level/situation, deadline or target attempt, available hours per day, their usual wake-up time AND sleep time (one question asking both — needed to build their timetable), weakest area, other commitments (work/college), and preferred working/study timings — all tailored to this specific goal.
Respond with ONLY a JSON array of 7 strings.`,
    { schema: questionsSchema },
  );
  return extractJson<string[]>(text);
}

// 1b. Goal Agent — difficulty/timeline analysis
export function goalAgentAnalyze(goal: string, qa: QA[]): Promise<GoalProfile> {
  return withFallback("Goal Agent", () => goalAgentAnalyzeLive(goal, qa), {
    goalDifficulty: "High",
    estimatedMonths: 12,
    dailyHours: 4,
    weeklyHours: 28,
    confidence: 75,
    skillsRequired: ["Consistency", "Deep focus", "Weekly review discipline"],
    risks: ["Overcommitment in early weeks", "Loss of momentum after month 2"],
  });
}

async function goalAgentAnalyzeLive(
  goal: string,
  qa: QA[],
): Promise<GoalProfile> {
  const text = await llm(
    `You are the Goal Analysis Agent. Goal: "${goal}".
User answers:\n${qaText(qa)}
Assess the goal. Respond with ONLY JSON:
{"goalDifficulty":"Low|Medium|High|Very High","estimatedMonths":number,"dailyHours":number,"weeklyHours":number,"confidence":number (0-100),"skillsRequired":[strings],"risks":[strings]}`,
    { schema: profileSchema },
  );
  return extractJson<GoalProfile>(text);
}

// 2. Planning Agent — monthly roadmap
export function planningAgent(
  goal: string,
  qa: QA[],
  profile: GoalProfile,
): Promise<RoadmapMonth[]> {
  return withFallback(
    "Planning Agent",
    () => planningAgentLive(goal, qa, profile),
    sampleRoadmap(profile),
  );
}

function sampleRoadmap(profile: GoalProfile): RoadmapMonth[] {
  const phases = [
    [
      "Foundations",
      [
        "Map the full scope of your goal into a checklist",
        "Set up your daily routine, tools, and workspace",
        "Complete the first fundamentals block",
        "Start your daily progress log",
      ],
    ],
    [
      "Momentum",
      [
        "Reach your full daily deep-work target",
        "Take your first self-assessment and record the score",
        "Begin fixing your weakest area with focused sessions",
        "Review progress every Sunday",
      ],
    ],
    [
      "Consolidation",
      [
        "Revise everything covered so far",
        "Take a second assessment and compare scores",
        "Adjust the plan based on what the results show",
        "Strengthen habits that slipped",
      ],
    ],
    [
      "Depth",
      [
        "Go deeper into the hardest topics",
        "Increase practice difficulty step by step",
        "Get feedback from a mentor, test series, or peers",
        "Protect your morning deep-focus block",
      ],
    ],
    [
      "Application",
      [
        "Shift from learning to applying under real conditions",
        "Simulate the real environment weekly",
        "Track accuracy and speed, not just hours",
        "Close the remaining weak areas",
      ],
    ],
    [
      "Mastery",
      [
        "Full revision cycles with spaced repetition",
        "Peak-condition weekly simulations",
        "Fine-tune sleep, energy, and timing",
        "Prepare mentally for the final stretch",
      ],
    ],
  ] as const;
  const months = Math.max(3, Math.min(profile.estimatedMonths, 12));
  return Array.from({ length: months }, (_, i) => {
    const [title, objectives] = phases[Math.min(i, phases.length - 1)];
    // Break the month's objectives across 4 weeks so progress is trackable
    // week by week, not just month by month.
    const weeks: RoadmapWeek[] = Array.from({ length: 4 }, (_, w) => ({
      week: w + 1,
      focus:
        objectives[w] ??
        objectives[w % objectives.length] ??
        "Consolidate the week's work and review your progress",
    }));
    return {
      month: i + 1,
      title: i < phases.length ? title : `${title} ${i - phases.length + 2}`,
      objectives: [...objectives],
      weeks,
    };
  });
}

async function planningAgentLive(
  goal: string,
  qa: QA[],
  profile: GoalProfile,
): Promise<RoadmapMonth[]> {
  const text = await llm(
    `You are the Planning Agent. Goal: "${goal}" (difficulty ${profile.goalDifficulty}, ~${profile.estimatedMonths} months, ${profile.weeklyHours}h/week).
User answers:\n${qaText(qa)}
Create a DETAILED roadmap covering all ${Math.min(profile.estimatedMonths, 12)} months (or up to 12). Each month needs a clear theme, 4-6 specific monthly objectives, AND a week-by-week breakdown: exactly 4 weeks, each with one concrete thing to complete that week (what to finish in week 1, week 2, week 3, week 4). Write in simple, encouraging language a beginner can understand. Respond with ONLY a JSON array:
[{"month":1,"title":"...","objectives":["...","...","...","..."],"weeks":[{"week":1,"focus":"..."},{"week":2,"focus":"..."},{"week":3,"focus":"..."},{"week":4,"focus":"..."}]}]`,
    { schema: roadmapSchema },
  );
  const months = extractJson<RoadmapMonth[]>(text);
  // Guarantee every month has a 4-week breakdown even if the model skipped it.
  return months.map((m) => {
    const objectives = m.objectives ?? [];
    const weeks =
      Array.isArray(m.weeks) && m.weeks.length
        ? m.weeks
        : Array.from({ length: 4 }, (_, w) => ({
            week: w + 1,
            focus:
              objectives[w] ??
              objectives[w % Math.max(objectives.length, 1)] ??
              "Consolidate the week's work and review your progress",
          }));
    return { ...m, objectives, weeks };
  });
}

// 3. Timetable Agent — realistic daily schedule
export function timetableAgent(
  goal: string,
  qa: QA[],
  profile: GoalProfile,
): Promise<TimetableSlot[]> {
  return withFallback(
    "Timetable Agent",
    () => timetableAgentLive(goal, qa, profile),
    sampleTimetable(qa),
  );
}

// Pull a time range like "5:30am to 7:30 am" out of the user's answers so the
// sample timetable honors their stated focus hours.
function parseFocusWindow(qa: QA[]): { start: string; end: string } | null {
  const joined = qa.map((x) => x.answer).join(" ");
  const m = joined.match(
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|-|–|until)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
  );
  if (!m) return null;
  const fmt = (h: string, min: string | undefined, ap: string | undefined) => {
    let hour = parseInt(h, 10);
    if (ap?.toLowerCase() === "pm" && hour < 12) hour += 12;
    if (ap?.toLowerCase() === "am" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${min ?? "00"}`;
  };
  return {
    start: fmt(m[1], m[2], m[3] ?? m[6]),
    end: fmt(m[4], m[5], m[6] ?? m[3]),
  };
}

function sampleTimetable(qa: QA[]): TimetableSlot[] {
  const focus = parseFocusWindow(qa);

  const fmt = (mins: number) =>
    `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  const toMins = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  // Base day in minutes; a stated focus window replaces whatever it
  // overlaps and the day is re-sorted so it always reads top-to-bottom.
  let slots: { start: number; end: number; activity: string }[] = [
    { start: 360, end: 420, activity: "Wake up, light exercise, breakfast" },
    {
      start: 420,
      end: 540,
      activity: "Deep work block — hardest task of the day",
    },
    { start: 540, end: 780, activity: "College / work / primary commitments" },
    { start: 780, end: 840, activity: "Lunch + short walk" },
    {
      start: 840,
      end: 960,
      activity: "Second work block — practice and application",
    },
    { start: 960, end: 1020, activity: "Exercise / gym / outdoor break" },
    {
      start: 1020,
      end: 1140,
      activity: "Lighter tasks — notes, revision, reading",
    },
    { start: 1140, end: 1260, activity: "Dinner + family / personal time" },
    { start: 1260, end: 1320, activity: "Review today + plan tomorrow" },
    { start: 1320, end: 1350, activity: "Wind down and sleep" },
  ];

  if (focus) {
    const fs = toMins(focus.start);
    const fe = toMins(focus.end);
    if (fe > fs) {
      // carve the focus window out of any overlapping base slots
      slots = slots.flatMap((s) => {
        if (s.end <= fs || s.start >= fe) return [s];
        const parts: typeof slots = [];
        if (s.start < fs) parts.push({ ...s, end: fs });
        if (s.end > fe) parts.push({ ...s, start: fe });
        return parts;
      });
      // the user chose their own deep-work hours — drop the generic block
      slots = slots.filter((s) => !s.activity.startsWith("Deep work block"));
      slots.push({
        start: fs,
        end: fe,
        activity:
          "Deep focus block — your hardest, highest-impact work (your chosen hours)",
      });
      slots.sort((a, b) => a.start - b.start);
    }
  }

  return slots
    .filter((s) => s.end - s.start >= 15)
    .map((s) => ({
      time: `${fmt(s.start)} - ${fmt(s.end)}`,
      activity: s.activity,
    }));
}

async function timetableAgentLive(
  goal: string,
  qa: QA[],
  profile: GoalProfile,
): Promise<TimetableSlot[]> {
  const text = await llm(
    `You are the Timetable Agent. Build a realistic weekday timetable (not generic) for a user with goal "${goal}" who can invest ${profile.dailyHours}h/day, respecting their commitments and preferred timings from these answers:\n${qaText(qa)}
IMPORTANT: if the user states specific focus/study hours (e.g. "5:30am to 7:30am"), the timetable MUST place their deep-focus block at exactly those times. If they state their wake-up and sleep times, the timetable MUST start at their wake-up time and end at their sleep time. Cover the full day from wake-up to sleep. Respond with ONLY a JSON array:
[{"time":"06:00 - 07:00","activity":"..."}]`,
    { schema: timetableSchema },
  );
  return extractJson<TimetableSlot[]>(text);
}

// 4. Habit Agent — personalized habits
export function habitAgent(goal: string, qa: QA[]): Promise<Habit[]> {
  return withFallback("Habit Agent", () => habitAgentLive(goal, qa), [
    {
      name: "Morning Focus",
      frequency: "daily",
      why: "Your hardest work done before distractions begin compounds fastest.",
    },
    {
      name: "Progress Log",
      frequency: "daily",
      why: "Tracking keeps the plan honest and feeds your weekly review.",
    },
    {
      name: "Weekly Test",
      frequency: "weekly",
      why: "Regular testing exposes weak areas before they become risks.",
    },
    {
      name: "Plan Tomorrow",
      frequency: "daily",
      why: "Planning tomorrow tonight removes morning decision friction.",
    },
  ]);
}

async function habitAgentLive(goal: string, qa: QA[]): Promise<Habit[]> {
  const text = await llm(
    `You are the Habit Agent. For the goal "${goal}" and this user context:\n${qaText(qa)}
Suggest 4-6 personalized habits (not generic ones). Each habit "name" MUST be only 2-3 simple words so it's easy to read at a glance (e.g. "Mock Test", "Editorial Reading"). Respond with ONLY a JSON array:
[{"name":"...","frequency":"daily|weekdays|weekly","why":"one sentence"}]`,
    { schema: habitsSchema },
  );
  return extractJson<Habit[]>(text);
}

// 5. Coach Agent — morning briefing
export function coachAgent(memory: UserMemory, plan?: Plan): Promise<string> {
  return withFallback(
    "Coach Agent",
    () => coachAgentLive(memory, plan),
    `Good morning! You're working toward **"${memory.goal}"**, and today is another chance to move closer to it. Your plan for today is simple: give your best **${memory.profile.dailyHours} hours**, starting with your **deep-focus block** before anything else can interrupt you. One strong morning session puts the whole day on your side — let's begin.`,
  );
}

async function coachAgentLive(
  memory: UserMemory,
  plan?: Plan,
): Promise<string> {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const planText = plan
    ? `Their daily timetable:\n${plan.timetable.map((t) => `${t.time}: ${t.activity}`).join("\n")}
Their habits: ${plan.habits.map((h) => h.name).join(", ")}
Current roadmap month: ${plan.roadmap[0]?.title} — ${plan.roadmap[0]?.objectives.join("; ")}`
    : "";
  return llm(
    `You are the Coach Agent of Ascend — a calm, direct personal coach. Today is ${today}.
User memory:\n${memoryText(memory)}
${planText}
Write a short, warm morning briefing (4-5 sentences) in simple, encouraging, everyday language, tailored to THEIR specific lifestyle: reference their actual wake-up/focus times from the timetable, their current roadmap month, and one of their habits by name. Name today's single highest-impact task. Mark the 3-5 most important words or phrases in **bold** (double asterisks). No headings, no bullet points, no difficulty ratings.`,
  );
}

// 6. Analytics Agent — explains patterns, not just graphs
export function analyticsAgent(memory: UserMemory): Promise<string> {
  return withFallback(
    "Analytics Agent",
    () => analyticsAgentLive(memory),
    `• Your plan allocates **${memory.profile.weeklyHours} hours per week** — users at this load typically dip in week 3, so schedule your lightest day mid-week to absorb it.
• Keep your **morning deep-work block untouchable**; it's your best defense against your listed risks (${memory.profile.risks.join("; ")}).
• Demanding work placed **early in the day** consistently outperforms evening sessions — front-load your hardest task.`,
  );
}

async function analyticsAgentLive(memory: UserMemory): Promise<string> {
  return llm(
    `You are the Analytics Agent. Based on this user's profile, risks, and reflections:\n${memoryText(memory)}
Write exactly 3 short insights that EXPLAIN patterns and suggest concrete adjustments (e.g. when to schedule demanding work). Format each as its own bullet point starting with "• ". No headings, no intro sentence. Mark the most important phrase in each bullet in **bold** (double asterisks).`,
  );
}

// 8. Motivation Agent — real, numbers-based motivation
export function motivationAgent(memory: UserMemory): Promise<string> {
  return withFallback(
    "Motivation Agent",
    () => motivationAgentLive(memory),
    `• You're at the start of a **${memory.profile.estimatedMonths}-month plan** with ${memory.profile.confidence}% estimated confidence — that number climbs with every completed day.
• Protecting just your **${memory.profile.dailyHours} planned hours today** keeps you exactly on schedule.
• Small, kept promises to yourself are what close the gap — **consistency beats intensity**.`,
  );
}

async function motivationAgentLive(memory: UserMemory): Promise<string> {
  return llm(
    `You are the Motivation Agent. Not quotes — real motivation grounded in the user's actual plan and numbers.
User memory:\n${memoryText(memory)}
Write exactly 3 bullet points (each starting with "• ") that quantify where they stand and name the small concrete adjustment that keeps them on track. Mark the key number or phrase in each bullet in **bold**.`,
  );
}

// 9. Reflection Agent — turns Sunday answers into next week's adjustments
export function reflectionAgent(
  memory: UserMemory,
  reflection: { win: string; distraction: string; lesson: string },
): Promise<string> {
  return withFallback(
    "Reflection Agent",
    () => reflectionAgentLive(memory, reflection),
    [
      `• Double down on what produced your win ("${reflection.win}") — schedule it earlier in the day.`,
      `• Put a guard around your distraction ("${reflection.distraction}"): remove it from your deep-work blocks entirely.`,
      `• Apply your lesson ("${reflection.lesson}") to next week's plan during Sunday planning.`,
    ].join("\n"),
  );
}

async function reflectionAgentLive(
  memory: UserMemory,
  reflection: { win: string; distraction: string; lesson: string },
): Promise<string> {
  return llm(
    `You are the Reflection Agent. User memory:\n${memoryText(memory)}
This week's reflection — Win: ${reflection.win}. Distraction: ${reflection.distraction}. Lesson: ${reflection.lesson}.
First, in 1-2 sentences, tell them what their reflection reveals about how their week actually went. Then suggest 3 specific, personalized adjustments to next week's plan as short bullet lines starting with "•". Mark key phrases in **bold** (double asterisks). Simple, encouraging language.`,
  );
}

// AI Chat — continue the conversation, answer doubts, grounded in the plan
export function chatAgent(
  memory: UserMemory,
  plan: Plan | undefined,
  history: { role: string; text: string }[],
  message: string,
): Promise<string> {
  return withFallback(
    "Chat",
    () => chatAgentLive(memory, plan, history, message),
    `I'm having trouble reaching the AI service right now, but here's my take: stay focused on today's plan for "${memory.goal}" — your **deep-focus block** matters more than anything else today. Ask me again in a little while and I'll give you a fuller answer.`,
  );
}

async function chatAgentLive(
  memory: UserMemory,
  plan: Plan | undefined,
  history: { role: string; text: string }[],
  _message: string,
): Promise<string> {
  const planText = plan
    ? `Their current plan:
- Roadmap: ${plan.roadmap.map((m) => `Month ${m.month}: ${m.title}`).join("; ")}
- Timetable: ${plan.timetable.map((t) => `${t.time} ${t.activity}`).join("; ")}
- Habits: ${plan.habits.map((h) => `${h.name} (${h.frequency})`).join(", ")}`
    : "";
  const system = `You are the user's personal AI coach in Ascend, a goal-execution app. Be warm, direct, and practical. Answer doubts clearly in simple language; keep replies under 150 words unless they ask for detail. Mark key phrases in **bold** (double asterisks).

You have an ongoing relationship with this user — this is a continuing conversation, not a first meeting. Remember and refer back to what they told you earlier in the chat (names, numbers, decisions, struggles they mentioned). If they refer to something from before ("that", "the thing I said", "like last time"), resolve it from the conversation history. Never re-ask something they already answered; build on it.

Long-term memory about the user:
${memoryText(memory)}
${planText}`;

  // Send the real conversation as role-based turns (last 30 messages),
  // which already ends with the user's newest message.
  const turns: ChatTurn[] = history.slice(-30).map((m) => ({
    role: m.role === "user" ? "user" : "model",
    text: m.text,
  }));
  // The conversation must open with a user turn
  while (turns.length && turns[0].role !== "user") turns.shift();
  return llmChat(system, turns);
}

// Master Orchestrator — Goal → (Planning ∥ Timetable ∥ Habit) → Plan.
// Gemini handles concurrent requests, so the three run in parallel for speed.
export async function orchestrate(goal: string, qa: QA[]): Promise<Plan> {
  const profile = await goalAgentAnalyze(goal, qa);
  const [roadmap, timetable, habits] = await Promise.all([
    planningAgent(goal, qa, profile),
    timetableAgent(goal, qa, profile),
    habitAgent(goal, qa),
  ]);
  return {
    goal,
    profile,
    roadmap,
    timetable,
    habits,
    createdAt: new Date().toISOString(),
  };
}
