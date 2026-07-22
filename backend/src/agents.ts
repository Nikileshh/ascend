import { llm, extractJson } from "./ai.js";

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
  timetable: TimetableSlot[]; // weekday schedule (Mon–Fri)
  weekendTimetable: TimetableSlot[]; // Sat–Sun schedule
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
const questionsSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      question: { type: "string" },
      type: { type: "string", enum: ["choice", "time"] },
      options: strings,
      multi: { type: "boolean" },
    },
    required: ["question", "type", "options"],
  },
} as const;
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

// 1. Goal Agent — follow-up questions tailored to the goal, each with
// tap-to-select options ("time" questions get a clock-time grid in the UI;
// the frontend appends an "Other" free-text option to every question).
export interface OnboardingQuestion {
  question: string;
  type: "choice" | "time";
  options: string[];
  // multi = several options can apply (e.g. commitments); UI toggles instead
  // of replacing, and the answer is the selections joined with commas.
  multi?: boolean;
}

const WAKE_TIMES = [
  "4:30 AM",
  "5:00 AM",
  "5:30 AM",
  "6:00 AM",
  "6:30 AM",
  "7:00 AM",
  "7:30 AM",
  "8:00 AM",
  "8:30 AM",
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
];
const SLEEP_TIMES = [
  "9:00 PM",
  "9:30 PM",
  "10:00 PM",
  "10:30 PM",
  "11:00 PM",
  "11:30 PM",
  "12:00 AM",
  "12:30 AM",
  "1:00 AM",
  "1:30 AM",
  "2:00 AM",
  "2:30 AM",
];

export function goalAgentQuestions(
  goal: string,
): Promise<OnboardingQuestion[]> {
  return withFallback("Goal Agent", () => goalAgentQuestionsLive(goal), [
    {
      question: `What is your current level of preparation or experience toward "${goal}"?`,
      type: "choice",
      options: [
        "Complete beginner — starting from zero",
        "Know the basics — learned informally",
        "Intermediate — prepared before, need structure",
        "Advanced — polishing and consistency",
      ],
    },
    {
      question: "What is your target deadline or timeline?",
      type: "choice",
      options: [
        "3 months",
        "6 months",
        "1 year",
        "2 years",
        "No fixed deadline",
      ],
    },
    {
      question: "How many hours per day can you realistically invest?",
      type: "choice",
      options: ["1–2 hours", "3–4 hours", "5–6 hours", "7+ hours"],
    },
    {
      question: "What time do you usually wake up?",
      type: "time",
      options: WAKE_TIMES,
    },
    {
      question: "What time do you usually go to sleep?",
      type: "time",
      options: SLEEP_TIMES,
    },
    {
      question: "What do you consider your weakest areas for this goal?",
      type: "choice",
      multi: true,
      options: [
        "Staying consistent",
        "Core concepts and fundamentals",
        "Time management",
        "Practice and test performance",
        "Motivation and focus",
      ],
    },
    {
      question: "What does a normal WEEKDAY look like for you?",
      type: "choice",
      multi: true,
      options: [
        "Classes / lectures",
        "Job or work shift",
        "Self-study time",
        "Gym or sports",
        "Commute / travel",
        "Chores & errands",
        "Time with family",
        "Mostly free",
      ],
    },
    {
      question: "What do you usually do on WEEKENDS?",
      type: "choice",
      multi: true,
      options: [
        "Sleep in and rest",
        "Sports or gym",
        "Movies or gaming",
        "Out with friends",
        "Family time",
        "Errands & chores",
        "Catch up on studies/work",
        "Side projects / hobbies",
      ],
    },
    {
      question: "When during the day do you focus best?",
      type: "choice",
      options: [
        "Early morning",
        "Late morning",
        "Afternoon",
        "Evening",
        "Late night",
      ],
    },
  ]);
}

async function goalAgentQuestionsLive(
  goal: string,
): Promise<OnboardingQuestion[]> {
  const text = await llm(
    `You are the Goal Analysis Agent of Ascend, a personal AI coaching app.
A user has this goal: "${goal}".
Create exactly 9 short onboarding questions, each with tap-to-select answer options, covering in order: 1) current level/experience, 2) target deadline or attempt, 3) hours available per day, 4) usual wake-up time, 5) usual sleep time, 6) weakest area for this goal, 7) what a normal WEEKDAY looks like for them (classes, job, self-study, gym, chores, family, free…), 8) what they usually do on WEEKENDS (rest, sports, movies/gaming, friends, family, errands, hobbies…), 9) when they focus best. Tailor the wording and the options to this specific goal.
Each item: "question" (short), "type" ("time" for the wake-up and sleep questions, otherwise "choice"), "options" (4-6 short, realistic answers relevant to that question — for "time" questions give exactly these 12 clock times: wake-up ${JSON.stringify(WAKE_TIMES)}, sleep ${JSON.stringify(SLEEP_TIMES)}), and "multi" (true where several answers can apply at once — the weakest-areas, weekday, and weekend questions; false elsewhere). Never include an "Other" option — the app adds one automatically.
Respond with ONLY a JSON array of 9 objects {question, type, options, multi}.`,
    { schema: questionsSchema },
  );
  const parsed = extractJson<OnboardingQuestion[]>(text);
  // Guard against a model that ignores the shape (multi normalized below).
  return parsed
    .filter(
      (q) => q?.question && Array.isArray(q.options) && q.options.length >= 2,
    )
    .map((q) => ({
      ...q,
      type: q.type === "time" ? "time" : "choice",
      multi: q.type !== "time" && !!q.multi,
    }));
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
Assess the goal. For "estimatedMonths": if the user stated a deadline, timeline, or target date/attempt (e.g. "in 3 months", "by 2027", "next year"), set estimatedMonths to the number of months from now until that deadline and honor it EXACTLY. Only estimate a realistic number if they gave no timeline. Clamp between 1 and 36.
Respond with ONLY JSON:
{"goalDifficulty":"Low|Medium|High|Very High","estimatedMonths":number,"dailyHours":number,"weeklyHours":number,"confidence":number (0-100),"skillsRequired":[strings],"risks":[strings]}`,
    { schema: profileSchema },
  );
  const profile = extractJson<GoalProfile>(text);
  // Keep the timeline sane if the model returns something wild.
  profile.estimatedMonths = Math.max(
    1,
    Math.min(Math.round(profile.estimatedMonths) || 12, 36),
  );
  return profile;
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
  const months = Math.max(3, Math.min(profile.estimatedMonths, 18));
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
  const spanMonths = Math.max(1, Math.min(profile.estimatedMonths, 18));
  const text = await llm(
    `You are the Planning Agent. Goal: "${goal}" (difficulty ${profile.goalDifficulty}, ${profile.weeklyHours}h/week).
User answers:\n${qaText(qa)}
The user needs to reach this goal in about ${profile.estimatedMonths} months. Create a roadmap of EXACTLY ${spanMonths} months that is paced to finish right at that deadline: month 1 is where they are now, and the FINAL month (month ${spanMonths}) is the goal-achievement / final-preparation month (e.g. the exam, launch, or event itself). Distribute the work realistically across the whole timeline — do not cram everything early or leave the end empty.
Each month needs a clear theme, 4-6 specific monthly objectives, AND a week-by-week breakdown: exactly 4 weeks, each with one concrete thing to complete that week. Write in simple, encouraging language a beginner can understand. Respond with ONLY a JSON array:
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
    `You are the Timetable Agent. Build a realistic WEEKDAY (Mon–Fri) timetable (not generic) for a user with goal "${goal}" who can invest ${profile.dailyHours}h/day, respecting their weekday routine, commitments, and preferred timings from these answers:\n${qaText(qa)}
IMPORTANT: work around what they told you their weekday looks like (classes, job, commute…). If the user states specific focus/study hours (e.g. "5:30am to 7:30am"), the timetable MUST place their deep-focus block at exactly those times. If they state their wake-up and sleep times, the timetable MUST start at their wake-up time and end at their sleep time. Cover the full day from wake-up to sleep. Respond with ONLY a JSON array:
[{"time":"06:00 - 07:00","activity":"..."}]`,
    { schema: timetableSchema },
  );
  return extractJson<TimetableSlot[]>(text);
}

// 3b. Weekend Timetable Agent — a lighter Sat/Sun schedule that respects their
// rest and social plans but keeps steady progress toward the goal.
export function weekendTimetableAgent(
  goal: string,
  qa: QA[],
  profile: GoalProfile,
): Promise<TimetableSlot[]> {
  return withFallback(
    "Weekend Timetable Agent",
    () => weekendTimetableAgentLive(goal, qa, profile),
    sampleWeekendTimetable(qa),
  );
}

async function weekendTimetableAgentLive(
  goal: string,
  qa: QA[],
  profile: GoalProfile,
): Promise<TimetableSlot[]> {
  const text = await llm(
    `You are the Timetable Agent building a WEEKEND (Saturday/Sunday) schedule for a user with goal "${goal}". Weekends are different from weekdays: lighter, with real rest and the social/leisure things they told you they enjoy (movies, sports, friends, family, hobbies). Base it on these answers:\n${qaText(qa)}
Rules: keep a SHORTER but still meaningful goal-work block (about half of a weekday's ${profile.dailyHours}h) so momentum never fully stops, then genuinely schedule their weekend activities and rest. Respect their wake-up and sleep times (they may wake later on weekends). Cover the full day from wake-up to sleep. Make it feel like a good, balanced weekend — not a punishment. Respond with ONLY a JSON array:
[{"time":"08:00 - 09:00","activity":"..."}]`,
    { schema: timetableSchema },
  );
  return extractJson<TimetableSlot[]>(text);
}

function sampleWeekendTimetable(qa: QA[]): TimetableSlot[] {
  void qa;
  return [
    { time: "08:30 - 09:30", activity: "Slow start, breakfast, light stretch" },
    {
      time: "09:30 - 11:30",
      activity: "Focused goal work (lighter weekend block)",
    },
    { time: "11:30 - 13:00", activity: "Free time / hobby" },
    { time: "13:00 - 14:00", activity: "Lunch and a real break" },
    { time: "14:00 - 17:00", activity: "Out with friends / sports / movie" },
    { time: "17:00 - 18:00", activity: "Quick review of the week's progress" },
    { time: "18:00 - 22:00", activity: "Relax, family time, recharge" },
  ];
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
// The coach can both reply AND change the user's plan when asked.
export interface ChatAction {
  action:
    | "add_habit"
    | "remove_habit"
    | "set_weekday_timetable"
    | "set_weekend_timetable"
    | "none";
  habitName?: string;
  frequency?: string;
  why?: string;
  slots?: TimetableSlot[];
}
export interface ChatResult {
  reply: string;
  actions: ChatAction[];
}

const chatActionSchema = {
  type: "object",
  properties: {
    reply: { type: "string" },
    actions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: [
              "add_habit",
              "remove_habit",
              "set_weekday_timetable",
              "set_weekend_timetable",
              "none",
            ],
          },
          habitName: { type: "string" },
          frequency: { type: "string" },
          why: { type: "string" },
          slots: timetableSchema,
        },
        required: ["action"],
      },
    },
  },
  required: ["reply", "actions"],
} as const;

export function chatAgent(
  memory: UserMemory,
  plan: Plan | undefined,
  history: { role: string; text: string }[],
  message: string,
): Promise<ChatResult> {
  return withFallback(
    "Chat",
    () => chatAgentLive(memory, plan, history, message),
    {
      reply: `I'm having trouble reaching the AI service right now, but here's my take: stay focused on today's plan for "${memory.goal}" — your **deep-focus block** matters more than anything else today. Ask me again in a little while and I'll give you a fuller answer.`,
      actions: [],
    },
  );
}

async function chatAgentLive(
  memory: UserMemory,
  plan: Plan | undefined,
  history: { role: string; text: string }[],
  message: string,
): Promise<ChatResult> {
  const planText = plan
    ? `Their current plan:
- Weekday timetable: ${plan.timetable.map((t) => `${t.time} ${t.activity}`).join("; ")}
- Weekend timetable: ${(plan.weekendTimetable ?? []).map((t) => `${t.time} ${t.activity}`).join("; ")}
- Habits: ${plan.habits.map((h) => `${h.name} (${h.frequency})`).join(", ")}`
    : "";
  const convo = history
    .slice(-16)
    .map((m) => `${m.role === "user" ? "User" : "Coach"}: ${m.text}`)
    .join("\n");
  const prompt = `You are the user's personal AI coach in Ascend, a goal-execution app. Be warm, direct, and practical. Answer clearly in simple language; keep the "reply" under 150 words. Mark key phrases in **bold**. Continue the ongoing conversation naturally; never re-ask what they already told you.

You can ALSO change their dashboard when they clearly ask you to. Available actions:
- add_habit: fields habitName, frequency ("Daily"/"Weekly"/etc.), why (one short line)
- remove_habit: field habitName (must match one of their existing habits)
- set_weekday_timetable: field slots = the COMPLETE new weekday schedule as [{"time":"06:00 - 07:00","activity":"..."}] (return the whole updated list, keeping unchanged slots, not just the edited one)
- set_weekend_timetable: field slots = the COMPLETE new weekend schedule

CRITICAL RULE: if your reply says you added, removed, moved, or changed ANYTHING, you MUST include the matching object in "actions". Never claim a change in words without the action — the words alone do nothing. For plain questions or advice with no change, use an empty actions array.
Example — user says "add a 20 min meditation habit": {"reply":"Done — I've added **Meditation** to your daily habits.","actions":[{"action":"add_habit","habitName":"Meditation","frequency":"Daily","why":"20 minutes to clear your mind and focus"}]}

Long-term memory about the user:
${memoryText(memory)}
${planText}

Conversation so far (most recent last), the final User line is the new message to respond to:
${convo}
New message: ${message}

Respond with ONLY JSON: {"reply":"...","actions":[...]}`;
  const text = await llm(prompt, { schema: chatActionSchema });
  const parsed = extractJson<ChatResult>(text);
  return {
    reply: parsed.reply ?? "",
    actions: Array.isArray(parsed.actions) ? parsed.actions : [],
  };
}

// Master Orchestrator — Goal → (Planning ∥ Timetable ∥ Habit) → Plan.
// Gemini handles concurrent requests, so the three run in parallel for speed.
export async function orchestrate(goal: string, qa: QA[]): Promise<Plan> {
  const profile = await goalAgentAnalyze(goal, qa);
  const [roadmap, timetable, weekendTimetable, habits] = await Promise.all([
    planningAgent(goal, qa, profile),
    timetableAgent(goal, qa, profile),
    weekendTimetableAgent(goal, qa, profile),
    habitAgent(goal, qa),
  ]);
  return {
    goal,
    profile,
    roadmap,
    timetable,
    weekendTimetable,
    habits,
    createdAt: new Date().toISOString(),
  };
}
