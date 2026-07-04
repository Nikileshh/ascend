import nodemailer from "nodemailer";
import { env } from "./env.js";

const transport =
  env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      })
    : null;

export async function sendRegistrationEmail(name: string, email: string) {
  const subject = "Welcome to Ascend — you're registered!";
  const text = [
    `Hi ${name},`,
    "",
    "You have been successfully registered on Ascend.",
    "",
    "Your 1-week free trial has started. During the trial you get a preview of your AI analysis; the full experience unlocks with the Ascend plan at ₹250/month.",
    "",
    "Let's begin your ascent!",
    "— The Ascend Team",
  ].join("\n");

  if (!transport) {
    console.log(`[email] SMTP not configured — would send to ${email}:`);
    console.log(`[email] Subject: ${subject}\n${text}`);
    return;
  }
  await transport.sendMail({ from: env.SMTP_FROM, to: email, subject, text });
}
