import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(4000),
  JWT_SECRET: z.string().min(1).default("dev-secret-change-me"),
  // Public URL of the frontend — used for links inside emails. Set this to
  // your real domain in production (e.g. https://ascend.vercel.app).
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  // Local LLM via Ollama (replaces Gemini). Point OLLAMA_URL at a remote host
  // to use a shared/GPU Ollama server instead of localhost.
  OLLAMA_URL: z.string().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().default("llama3.2:3b"),
  OLLAMA_TIMEOUT_MS: z.coerce.number().default(180000),
  // Set true ONLY for reasoning models (qwen3, deepseek-r1) so we manage their
  // <think> output. Leave false for normal instruct models (llama3.2, qwen2.5)
  // — sending the `think` flag to those errors.
  OLLAMA_REASONING: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  // Gemini keys kept optional for rollback, but the AI flow no longer uses them.
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-3.1-flash-lite"),
  // Registration emails are logged to the console unless SMTP is configured.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("Ascend <nikileshh2005@gmail.com>"),
  ADMIN_EMAIL: z.string().default("admin@ascend.app"),
  ADMIN_PASSWORD: z.string().default("admin123"),
  // Session/data persistence. "file" (default) = local db.json only.
  // "supabase" = mirror the database to a Supabase Postgres table for
  // durability (recommended for hosting). "s3" = mirror to AWS S3.
  // The mirror is loaded on boot and written after every change.
  STORE_DRIVER: z.enum(["file", "supabase", "s3"]).default("file"),
  // Supabase — use the SERVICE ROLE key (backend only, keep secret).
  SUPABASE_URL: z.string().optional(),
  SUPABASE_KEY: z.string().optional(),
  // AWS S3 (optional alternative)
  AWS_REGION: z.string().default("ap-south-1"), // Mumbai
  S3_BUCKET: z.string().optional(),
  S3_KEY: z.string().default("ascend/db.json"),
  // Premium billing — manual UPI/GPay QR flow (zero gateway fees).
  UPI_ID: z.string().default("nikileshh2005@oksbi"),
  UPI_NAME: z.string().default("Ascend"),
  PREMIUM_PRICE: z.coerce.number().default(250), // ₹ / month
});

export const env = envSchema.parse(process.env);
