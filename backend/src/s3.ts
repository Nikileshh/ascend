import { env } from "./env.js";

// Optional AWS S3 mirror for the database. Enabled only when
// STORE_DRIVER=s3 and S3_BUCKET is set. All failures are non-fatal: the app
// always keeps working off the local db.json, S3 is just durable backing.

export const s3Enabled = env.STORE_DRIVER === "s3" && !!env.S3_BUCKET;

// The SDK client is created lazily so `file` mode never pays for it.
type S3Client = import("@aws-sdk/client-s3").S3Client;
let client: S3Client | null = null;

async function getClient(): Promise<S3Client> {
  if (!client) {
    const { S3Client } = await import("@aws-sdk/client-s3");
    client = new S3Client({ region: env.AWS_REGION });
  }
  return client;
}

/** Fetch the database JSON from S3, or null if absent/unreachable. */
export async function s3GetDb(): Promise<string | null> {
  if (!s3Enabled) return null;
  try {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const c = await getClient();
    const res = await c.send(
      new GetObjectCommand({ Bucket: env.S3_BUCKET!, Key: env.S3_KEY }),
    );
    const body = await res.Body?.transformToString();
    return body ?? null;
  } catch (err) {
    const e = err as { name?: string; message?: string };
    // A missing object on first run is expected, not an error.
    if (e.name === "NoSuchKey" || e.name === "NotFound") return null;
    console.warn(`[s3] load failed (${e.name}): ${e.message} — using local db`);
    return null;
  }
}

/** Upload the database JSON to S3. Never throws. */
export async function s3PutDb(json: string): Promise<void> {
  if (!s3Enabled) return;
  try {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const c = await getClient();
    await c.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET!,
        Key: env.S3_KEY,
        Body: json,
        ContentType: "application/json",
      }),
    );
  } catch (err) {
    console.warn(`[s3] save failed: ${(err as Error).message}`);
  }
}
