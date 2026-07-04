import { gemini, extractJson } from "./ai.js";

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

export interface RoadmapMonth {
  month: number;
  title: string;
  objectives: string[];
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

// When Gemini is unreachable (missing/invalid key), agents fall back to
// sample output so the app stays fully usable in development.
async function withFallback<T>(
  agent: string,
  call: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await call();
  } catch (err) {
    console.warn(
      `[${agent}] Gemini unavailable, using sample output:`,
      (err as Error).message,
    );
    return fallback;
  }
}

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
  const text = await gemini(
    `You are the Goal Analysis Agent of Ascend, a personal AI coaching app.
A user has this goal: "${goal}".
Ask exactly 7 short, intelligent follow-up questions to understand: their current level/situation, deadline or target attempt, available hours per day, their usual wake-up time AND sleep time (one question asking both — needed to build their timetable), weakest area, other commitments (work/college), and preferred working/study timings — all tailored to this specific goal.
Respond with ONLY a JSON array of 7 strings.`,
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
  const text = await gemini(
    `You are the Goal Analysis Agent. Goal: "${goal}".
User answers:\n${qaText(qa)}
Assess the goal. Respond with ONLY JSON:
{"goalDifficulty":"Low|Medium|High|Very High","estimatedMonths":number,"dailyHours":number,"weeklyHours":number,"confidence":number (0-100),"skillsRequired":[strings],"risks":[strings]}`,
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
    return {
      month: i + 1,
      title: i < phases.length ? title : `${title} ${i - phases.length + 2}`,
      objectives: [...objectives],
    };
  });
}

async function planningAgentLive(
  goal: string,
  qa: QA[],
  profile: GoalProfile,
): Promise<RoadmapMonth[]> {
  const text = await gemini(
    `You are the Planning Agent. Goal: "${goal}" (difficulty ${profile.goalDifficulty}, ~${profile.estimatedMonths} months, ${profile.weeklyHours}h/week).
User answers:\n${qaText(qa)}
Create a DETAILED monthly roadmap covering all ${Math.min(profile.estimatedMonths, 12)} months (or up to 12). Each month needs a clear theme and 4-6 specific, actionable objectives written in simple, encouraging language a beginner can understand. Respond with ONLY a JSON array:
[{"month":1,"title":"...","objectives":["...","...","...","..."]}]`,
  );
  return extractJson<RoadmapMonth[]>(text);
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
  if (focus) {
    return [
      {
        time: `Before ${focus.start}`,
        activity: "Wake up, freshen up, water — no phone",
      },
      {
        time: `${focus.start} - ${focus.end}`,
        activity:
          "Deep focus block — your hardest, highest-impact work (your chosen hours)",
      },
      {
        time: `After ${focus.end}`,
        activity: "Breakfast and a short walk to reset",
      },
      {
        time: "09:00 - 13:00",
        activity: "College / work / primary commitments",
      },
      {
        time: "13:00 - 14:00",
        activity: "Lunch + 15-minute break away from screens",
      },
      {
        time: "14:00 - 16:00",
        activity: "Second work block — practice and application",
      },
      { time: "16:00 - 17:00", activity: "Exercise / gym / outdoor break" },
      {
        time: "17:00 - 19:00",
        activity: "Lighter tasks — notes, revision, reading",
      },
      { time: "19:00 - 21:00", activity: "Dinner + family / personal time" },
      { time: "21:00 - 21:30", activity: "Review today + plan tomorrow" },
      {
        time: "21:30",
        activity: "Wind down and sleep — protect tomorrow's focus block",
      },
    ];
  }
  return [
    { time: "06:00 - 07:00", activity: "Wake up, light exercise, breakfast" },
    {
      time: "07:00 - 09:00",
      activity: "Deep work block 1 — hardest task of the day",
    },
    { time: "09:00 - 13:00", activity: "College / work / primary commitments" },
    { time: "13:00 - 14:00", activity: "Lunch + short walk" },
    {
      time: "14:00 - 16:00",
      activity: "Deep work block 2 — practice and application",
    },
    { time: "16:00 - 17:00", activity: "Break / gym" },
    { time: "17:00 - 19:00", activity: "Review, notes, and lighter tasks" },
    { time: "19:00 - 21:00", activity: "Dinner + personal time" },
    { time: "21:00 - 22:00", activity: "Daily review + plan tomorrow" },
    { time: "22:00", activity: "Sleep" },
  ];
}

async function timetableAgentLive(
  goal: string,
  qa: QA[],
  profile: GoalProfile,
): Promise<TimetableSlot[]> {
  const text = await gemini(
    `You are the Timetable Agent. Build a realistic weekday timetable (not generic) for a user with goal "${goal}" who can invest ${profile.dailyHours}h/day, respecting their commitments and preferred timings from these answers:\n${qaText(qa)}
IMPORTANT: if the user states specific focus/study hours (e.g. "5:30am to 7:30am"), the timetable MUST place their deep-focus block at exactly those times. If they state their wake-up and sleep times, the timetable MUST start at their wake-up time and end at their sleep time. Cover the full day from wake-up to sleep. Respond with ONLY a JSON array:
[{"time":"06:00 - 07:00","activity":"..."}]`,
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
  const text = await gemini(
    `You are the Habit Agent. For the goal "${goal}" and this user context:\n${qaText(qa)}
Suggest 4-6 personalized habits (not generic ones). Each habit "name" MUST be only 2-3 simple words so it's easy to read at a glance (e.g. "Mock Test", "Editorial Reading"). Respond with ONLY a JSON array:
[{"name":"...","frequency":"daily|weekdays|weekly","why":"one sentence"}]`,
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
  return gemini(
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
    `Your plan allocates ${memory.profile.weeklyHours} hours per week; users at this load typically dip in week 3 — schedule your lightest day mid-week to absorb it. Your listed risks (${memory.profile.risks.join("; ")}) are best countered by keeping the morning deep-work block untouchable. Demanding work placed early in the day consistently outperforms evening sessions.`,
  );
}

async function analyticsAgentLive(memory: UserMemory): Promise<string> {
  return gemini(
    `You are the Analytics Agent. Based on this user's profile, risks, and reflections:\n${memoryText(memory)}
Write 2-3 short insights that EXPLAIN patterns and suggest concrete adjustments (e.g. when to schedule demanding work). Plain sentences, no headings. Mark the most important phrases in **bold** (double asterisks).`,
  );
}

// 8. Motivation Agent — real, numbers-based motivation
export function motivationAgent(memory: UserMemory): Promise<string> {
  return withFallback(
    "Motivation Agent",
    () => motivationAgentLive(memory),
    `You are at the start of a ${memory.profile.estimatedMonths}-month plan with ${memory.profile.confidence}% estimated confidence — that confidence rises with every completed day. Protecting just your ${memory.profile.dailyHours} planned hours today keeps you exactly on schedule. Small, kept promises to yourself are what close the gap.`,
  );
}

async function motivationAgentLive(memory: UserMemory): Promise<string> {
  return gemini(
    `You are the Motivation Agent. Not quotes — real motivation grounded in the user's actual plan and numbers.
User memory:\n${memoryText(memory)}
Write 2-3 sentences quantifying where they stand and the small concrete adjustment that keeps them on track.`,
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
  return gemini(
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
  message: string,
): Promise<string> {
  const recent = history
    .slice(-10)
    .map((m) => `${m.role === "user" ? "User" : "Coach"}: ${m.text}`)
    .join("\n");
  const planText = plan
    ? `Their current plan — roadmap month 1: ${plan.roadmap[0]?.title}; timetable: ${plan.timetable.map((t) => `${t.time} ${t.activity}`).join("; ")}; habits: ${plan.habits.map((h) => h.name).join(", ")}.`
    : "";
  return gemini(
    `You are the user's personal AI coach in Ascend. Be warm, direct, and practical. Answer their doubts clearly in simple language; keep replies under 150 words unless they ask for detail. Mark key phrases in **bold**.
User memory:\n${memoryText(memory)}
${planText}
Recent conversation:\n${recent}
User: ${message}
Coach:`,
  );
}

// Master Orchestrator — Goal → (Planning ∥ Timetable ∥ Habit) → Plan
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
