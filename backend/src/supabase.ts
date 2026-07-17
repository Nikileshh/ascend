import { env } from "./env.js";

// Optional Supabase mirror for the database. Enabled only when
// STORE_DRIVER=supabase and SUPABASE_URL + SUPABASE_KEY are set. The whole
// database is stored as one JSONB row in an `app_state` table:
//
//   create table app_state (
//     id text primary key,
//     data jsonb,
//     updated_at timestamptz default now()
//   );
//
// Use the SERVICE ROLE key (backend only) so row-level security is bypassed.
// All failures are non-fatal — the app always keeps working off local db.json.

export const supabaseEnabled =
  env.STORE_DRIVER === "supabase" && !!env.SUPABASE_URL && !!env.SUPABASE_KEY;

const TABLE = "app_state";
const ROW_ID = "db";

type SupabaseClient = import("@supabase/supabase-js").SupabaseClient;
let client: SupabaseClient | null = null;

async function getClient(): Promise<SupabaseClient> {
  if (!client) {
    const { createClient } = await import("@supabase/supabase-js");
    client = createClient(env.SUPABASE_URL!, env.SUPABASE_KEY!, {
      auth: { persistSession: false },
    });
  }
  return client;
}

/** Fetch the database JSON from Supabase, or null if absent/unreachable. */
export async function supabaseGetDb(): Promise<string | null> {
  if (!supabaseEnabled) return null;
  try {
    const c = await getClient();
    const { data, error } = await c
      .from(TABLE)
      .select("data")
      .eq("id", ROW_ID)
      .maybeSingle();
    if (error) {
      console.warn(`[supabase] load failed: ${error.message} — using local db`);
      return null;
    }
    return data?.data ? JSON.stringify(data.data) : null;
  } catch (err) {
    console.warn(`[supabase] load error: ${(err as Error).message}`);
    return null;
  }
}

/** Upsert the database JSON into Supabase. Never throws. */
export async function supabasePutDb(json: string): Promise<void> {
  if (!supabaseEnabled) return;
  try {
    const c = await getClient();
    const { error } = await c.from(TABLE).upsert({
      id: ROW_ID,
      data: JSON.parse(json),
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn(`[supabase] save failed: ${error.message}`);
  } catch (err) {
    console.warn(`[supabase] save error: ${(err as Error).message}`);
  }
}
