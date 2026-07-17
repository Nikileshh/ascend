import { env } from "./env.js";

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Model chain: if the primary model's free quota is exhausted (429), fall
// through to backups — each model has its own quota bucket at Google.
function modelChain(): string[] {
  return [
    ...new Set([
      env.GEMINI_MODEL,
      "gemini-3-flash-preview",
      "gemini-2.5-flash-lite",
    ]),
  ];
}

type JsonSchema = Record<string, unknown>;

// POST to Gemini with per-model retry (503) and cross-model failover (429).
async function geminiPost(body: object): Promise<string> {
  if (!env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to backend/.env to enable AI analysis.",
    );
  }
  let lastError = "";
  for (const model of modelChain()) {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
      const res = await fetch(
        `${API_URL}/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(60_000),
        },
      );
      if (res.ok) {
        const data = (await res.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Gemini returned an empty response");
        return text;
      }
      lastError = `Gemini API error ${res.status} (${model}): ${(await res.text()).slice(0, 200)}`;
      if (res.status === 429) break; // quota gone on this model → next model
      if (res.status !== 503) return Promise.reject(new Error(lastError));
    }
  }
  throw new Error(lastError);
}

/** Single-shot completion. Pass `{ schema }` to force JSON output. */
export async function llm(
  prompt: string,
  opts: { schema?: JsonSchema } = {},
): Promise<string> {
  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
  };
  // A schema means the caller wants JSON — ask Gemini for a JSON mime type so
  // it never wraps the payload in prose (extractJson still guards the parse).
  if (opts.schema)
    body.generationConfig = { responseMimeType: "application/json" };
  return geminiPost(body);
}

export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

/**
 * True multi-turn conversation: the full message history is sent to Gemini
 * with proper user/model roles plus a system instruction carrying the user's
 * long-term memory, so the coach stays aware of everything said earlier.
 */
export async function llmChat(
  system: string,
  turns: ChatTurn[],
): Promise<string> {
  return geminiPost({
    systemInstruction: { parts: [{ text: system }] },
    contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
  });
}

export function extractJson<T>(text: string): T {
  const match = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in AI response");
  return JSON.parse(match[0]) as T;
}

export async function generateQuestions(goal: string): Promise<string[]> {
  const text = await llm(
    `A user of a personal AI coaching app has this goal: "${goal}".
Generate exactly 5 short onboarding questions to understand their current situation, available time per day, deadline, strengths/weaknesses, and biggest obstacle — tailored to this specific goal.
Respond with ONLY a JSON array of 5 strings, no markdown.`,
    { schema: { type: "array", items: { type: "string" } } },
  );
  return extractJson<string[]>(text);
}

export interface AnalysisResult {
  analysis: string;
  limited: boolean;
  lockedFeatures: string[];
}

const LOCKED_FEATURES = [
  "Full personalized roadmap with milestones",
  "Daily adaptive timetable",
  "Habit system & streak coaching",
  "Weekly AI progress reviews",
  "Unlimited goal analyses",
];

export async function analyzeGoal(
  goal: string,
  qa: { question: string; answer: string }[],
  limited: boolean,
): Promise<AnalysisResult> {
  const qaText = qa.map((x) => `Q: ${x.question}\nA: ${x.answer}`).join("\n");
  const scope = limited
    ? `This is a FREE TRIAL user. Give ONLY a brief overview: a 2-3 sentence assessment of their situation and the first 3 recommended action steps. Keep it under 200 words. Do not include a full roadmap, timetable, or habit plan.`
    : `Give a complete analysis: situation assessment, a phased roadmap with milestones, a suggested daily timetable, key habits to build, and how to handle their biggest obstacle.`;
  const analysis = await llm(
    `You are Ascend, a personal AI coach. A user has this goal: "${goal}".
Their onboarding answers:
${qaText}

${scope}
Respond in clean markdown.`,
  );
  return {
    analysis,
    limited,
    lockedFeatures: limited ? LOCKED_FEATURES : [],
  };
}
