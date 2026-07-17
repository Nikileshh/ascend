// Durable off-machine mirror of the database. Dispatches to whichever driver
// STORE_DRIVER selects (Supabase or S3); both are no-ops in "file" mode.

import { s3Enabled, s3GetDb, s3PutDb } from "./s3.js";
import { supabaseEnabled, supabaseGetDb, supabasePutDb } from "./supabase.js";

export const remoteEnabled = supabaseEnabled || s3Enabled;

export async function remoteGetDb(): Promise<string | null> {
  if (supabaseEnabled) return supabaseGetDb();
  if (s3Enabled) return s3GetDb();
  return null;
}

export async function remotePutDb(json: string): Promise<void> {
  if (supabaseEnabled) return supabasePutDb(json);
  if (s3Enabled) return s3PutDb(json);
}
