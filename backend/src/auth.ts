import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "./env.js";
import { findUserById, trialInfo, type User } from "./store.js";

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
    ...rest
  } = user;
  return { ...rest, ...trialInfo(user) };
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
