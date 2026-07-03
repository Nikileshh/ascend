import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  // Uncomment as these services are wired up:
  // DATABASE_URL: z.string().min(1),
  // SUPABASE_URL: z.url(),
  // SUPABASE_ANON_KEY: z.string().min(1),
  // ANTHROPIC_API_KEY: z.string().min(1),
});

export const env = envSchema.parse(process.env);
