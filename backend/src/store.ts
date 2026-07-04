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

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  createdAt: string; // ISO — trial starts at registration
  analysisCount: number;
  plan?: Plan;
  memory?: UserMemory;
  // habitLog[date][habitName] = "done" | "missed"
  habitLog?: Record<string, Record<string, "done" | "missed">>;
  chat?: ChatMessage[];
}

interface Db {
  users: User[];
  activity: Activity[];
}

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const dbPath = join(dataDir, "db.json");
const tmpPath = join(dataDir, "db.json.tmp");
const backupPath = join(dataDir, "db.backup.json");
const snapshotsDir = join(dataDir, "snapshots");

function load(): Db {
  for (const path of [dbPath, backupPath]) {
    try {
      if (existsSync(path)) {
        const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<Db>;
        if (path === backupPath)
          console.warn("db.json unreadable — recovered from db.backup.json");
        return { users: parsed.users ?? [], activity: parsed.activity ?? [] };
      }
    } catch (err) {
      console.error(`Failed to read ${path}:`, err);
    }
  }
  return { users: [], activity: [] };
}

const db = load();
let lastSnapshotDay = "";

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
