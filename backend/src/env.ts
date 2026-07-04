import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(4000),
  JWT_SECRET: z.string().min(1).default("dev-secret-change-me"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  // Registration emails are logged to the console unless SMTP is configured.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("Ascend <nikileshh2005@gmail.com>"),
  ADMIN_EMAIL: z.string().default("admin@ascend.app"),
  ADMIN_PASSWORD: z.string().default("admin123"),
});

export const env = envSchema.parse(process.env);
