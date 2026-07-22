import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "./env.js";
import { findUserById, save, trialInfo, type User } from "./store.js";

// Trial users get this many heavy AI actions (plan builds, chats, reflections)
// per day; premium and admins are unlimited.
export const TRIAL_DAILY_AI_LIMIT = 10;

// The app's day boundary is IST (users are in India, hosts run UTC).
function istDay() {
  return new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);
}

/** How many AI actions a user has left today (Infinity for premium/admin). */
export function aiRemaining(user: User) {
  if (user.role === "admin" || user.premium === true) return Infinity;
  const used = user.aiUsage?.date === istDay() ? user.aiUsage.count : 0;
  return Math.max(0, TRIAL_DAILY_AI_LIMIT - used);
}

export interface AuthedRequest extends Request {
  user?: User;
}

export function signToken(user: User) {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function publicUser(user: User) {
  const {
    passwordHash: _passwordHash,
    plan: _plan,
    memory: _memory,
    verifyCode: _verifyCode,
    verifyExpires: _verifyExpires,
    resetCode: _resetCode,
    resetExpires: _resetExpires,
    briefingCache: _briefingCache,
    insightsCache: _insightsCache,
    habitLog: _habitLog,
    chat: _chat,
    aiUsage: _aiUsage,
    ...rest
  } = user;
  const unlimitedAi = user.role === "admin" || user.premium === true;
  return {
    ...rest,
    ...trialInfo(user),
    unlimitedAi,
    aiLimit: TRIAL_DAILY_AI_LIMIT,
    aiRemaining: unlimitedAi ? TRIAL_DAILY_AI_LIMIT : aiRemaining(user),
  };
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const token = req.headers.authorization?.replace(/^Bearer /, "");
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    const user = findUserById(payload.sub);
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  if (req.user?.role !== "admin")
    return res.status(403).json({ error: "Admin access required" });
  next();
}

/**
 * Gate for app features: admins and premium users always pass; trial users
 * pass until their 7-day trial ends, then get a 402 (must subscribe). Their
 * account and data are untouched — access resumes the moment they go premium.
 * Must run after requireAuth. Billing routes are intentionally NOT gated so an
 * expired user can still pay.
 */
export function requireActiveAccess(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const user = req.user!;
  if (user.role === "admin" || user.premium === true) return next();
  if (trialInfo(user).trialExpired)
    return res.status(402).json({
      error:
        "Your 7-day free trial has ended. Subscribe to Ascend (₹250/month) to continue — your plan and progress are saved.",
      trialExpired: true,
    });
  next();
}

/**
 * Daily AI cap for trial users on heavy (Gemini-hitting, repeatable) actions.
 * Premium and admins bypass it entirely. Runs after requireActiveAccess, and
 * counts the action before the handler runs.
 */
export function requireAiQuota(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const user = req.user!;
  if (user.role === "admin" || user.premium === true) return next();
  const today = istDay();
  if (!user.aiUsage || user.aiUsage.date !== today)
    user.aiUsage = { date: today, count: 0 };
  if (user.aiUsage.count >= TRIAL_DAILY_AI_LIMIT)
    return res.status(429).json({
      error: `You've used all ${TRIAL_DAILY_AI_LIMIT} of today's free AI actions. Go Premium for unlimited — or come back tomorrow.`,
      dailyLimit: true,
    });
  user.aiUsage.count += 1;
  save();
  next();
}
