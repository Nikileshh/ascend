import { env } from "./env.js";

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export async function gemini(prompt: string): Promise<string> {
  if (!env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to backend/.env to enable AI analysis.",
    );
  }
  const res = await fetch(
    `${API_URL}/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}

export function extractJson<T>(text: string): T {
  const match = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in AI response");
  return JSON.parse(match[0]) as T;
}

export async function generateQuestions(goal: string): Promise<string[]> {
  const text = await gemini(
    `A user of a personal AI coaching app has this goal: "${goal}".
Generate exactly 5 short onboarding questions to understand their current situation, available time per day, deadline, strengths/weaknesses, and biggest obstacle — tailored to this specific goal.
Respond with ONLY a JSON array of 5 strings, no markdown.`,
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
  const analysis = await gemini(
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
