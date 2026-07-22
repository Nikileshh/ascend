import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plan, UserMemory } from "./agents.js";
import { remoteEnabled, remoteGetDb, remotePutDb } from "./remote.js";

export interface ChatMessage {
  role: "user" | "coach";
  text: string;
  at: string;
}

export interface Activity {
  at: string;
  type: string; // register | login | orchestrate | visit | chat | reflection | habit | timetable_edit
  email?: string;
  detail?: string;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  name: string;
  email: string;
  amount: number;
  upiRef: string; // the UPI/GPay transaction reference the user typed in
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string; // admin email
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  createdAt: string; // ISO — trial starts at registration
  analysisCount: number;
  // Premium: granted by admin (toggle) or by approving a payment request
  premium?: boolean;
  premiumSince?: string;
  // Email verification (users without the field are grandfathered as verified)
  verified?: boolean;
  verifyCode?: string;
  verifyExpires?: string;
  // Password reset via emailed PIN
  resetCode?: string;
  resetExpires?: string;
  plan?: Plan;
  memory?: UserMemory;
  // Dashboard modules the user opted into at onboarding (absent = all).
  modules?: string[];
  // one AI call per day per section — cached to conserve API quota
  briefingCache?: { date: string; text: string };
  insightsCache?: { date: string; analytics: string; motivation: string };
  // habitLog[date][habitName] = "done" | "missed"
  habitLog?: Record<string, Record<string, "done" | "missed">>;
  chat?: ChatMessage[];
}

interface Db {
  users: User[];
  activity: Activity[];
  payments: PaymentRequest[];
  // Admin-editable website wording (hero lines, quotes, pricing copy…).
  // Keys map to fields defined in the frontend copy registry; missing keys
  // fall back to the defaults hardcoded in the frontend.
  siteCopy: Record<string, string>;
}

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const dbPath = join(dataDir, "db.json");
const tmpPath = join(dataDir, "db.json.tmp");
const backupPath = join(dataDir, "db.backup.json");
const snapshotsDir = join(dataDir, "snapshots");

function parseDb(raw: string): Db {
  const parsed = JSON.parse(raw) as Partial<Db>;
  return {
    users: parsed.users ?? [],
    activity: parsed.activity ?? [],
    payments: parsed.payments ?? [],
    siteCopy: parsed.siteCopy ?? {},
  };
}

function loadLocal(): Db {
  for (const path of [dbPath, backupPath]) {
    try {
      if (existsSync(path)) {
        if (path === backupPath)
          console.warn("db.json unreadable — recovered from db.backup.json");
        return parseDb(readFileSync(path, "utf8"));
      }
    } catch (err) {
      console.error(`Failed to read ${path}:`, err);
    }
  }
  return { users: [], activity: [], payments: [], siteCopy: {} };
}

// On boot, prefer the durable copy in the cloud mirror (Supabase/S3, when
// enabled) and seed a local cache from it; otherwise fall back to the local
// file. Any mirror failure is non-fatal — the app always has the local db.
async function loadInitial(): Promise<Db> {
  if (remoteEnabled) {
    const remote = await remoteGetDb();
    if (remote) {
      try {
        const parsed = parseDb(remote);
        mkdirSync(dataDir, { recursive: true });
        writeFileSync(dbPath, JSON.stringify(parsed, null, 2));
        console.log(
          `[store] loaded database from cloud mirror (${parsed.users.length} users)`,
        );
        return parsed;
      } catch (err) {
        console.warn(
          "[store] remote db unparseable, using local:",
          (err as Error).message,
        );
      }
    } else {
      console.log(
        "[store] no database in the cloud mirror yet — starting from local/empty",
      );
    }
  }
  return loadLocal();
}

const db = await loadInitial();
let lastSnapshotDay = "";

// Mirror to the cloud after writes, debounced so a burst of saves is one write.
let remoteTimer: ReturnType<typeof setTimeout> | null = null;
function mirrorRemote() {
  if (!remoteEnabled) return;
  if (remoteTimer) clearTimeout(remoteTimer);
  remoteTimer = setTimeout(() => {
    remoteTimer = null;
    void remotePutDb(JSON.stringify(db, null, 2));
  }, 1500);
}

/**
 * Crash-safe persistence: the previous good file is kept as a backup,
 * the new state is written to a temp file and atomically renamed into
 * place (so a crash mid-write can never corrupt db.json), and the first
 * save of each day also drops a dated snapshot into data/snapshots/.
 */
export function save() {
  mkdirSync(dataDir, { recursive: true });
  if (existsSync(dbPath)) copyFileSync(dbPath, backupPath);
  writeFileSync(tmpPath, JSON.stringify(db, null, 2));
  renameSync(tmpPath, dbPath);

  const day = new Date().toISOString().slice(0, 10);
  if (day !== lastSnapshotDay) {
    mkdirSync(snapshotsDir, { recursive: true });
    copyFileSync(dbPath, join(snapshotsDir, `db-${day}.json`));
    lastSnapshotDay = day;
  }

  mirrorRemote(); // durable copy in Supabase/S3 when STORE_DRIVER is set
}

export function logActivity(type: string, email?: string, detail?: string) {
  db.activity.push({ at: new Date().toISOString(), type, email, detail });
  // keep the log bounded
  if (db.activity.length > 5000)
    db.activity.splice(0, db.activity.length - 5000);
  save();
}

export function allActivity() {
  return db.activity;
}

export function getSiteCopy() {
  return db.siteCopy;
}

export function setSiteCopy(copy: Record<string, string>) {
  db.siteCopy = copy;
  save();
}

export function findUserByEmail(email: string) {
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string) {
  return db.users.find((u) => u.id === id);
}

export function addUser(user: User) {
  db.users.push(user);
  save();
}

export function allUsers() {
  return db.users;
}

export function addPayment(payment: PaymentRequest) {
  db.payments.push(payment);
  save();
}

export function allPayments() {
  return db.payments;
}

export function findPaymentById(id: string) {
  return db.payments.find((p) => p.id === id);
}

/** Whether the user currently has full access (admin, premium, or in trial). */
export function isPremium(user: User) {
  return user.role === "admin" || user.premium === true;
}

const TRIAL_DAYS = 7;

export function trialInfo(user: User) {
  const trialEndsAt = new Date(
    new Date(user.createdAt).getTime() + TRIAL_DAYS * 86_400_000,
  );
  const now = new Date();
  return {
    trialEndsAt: trialEndsAt.toISOString(),
    trialExpired: now > trialEndsAt,
    daysLeft: Math.max(
      0,
      Math.ceil((trialEndsAt.getTime() - now.getTime()) / 86_400_000),
    ),
  };
}
