/**
 * Fixed-window rate limiter backed by Firestore counters, the same model as
 * admin/client/src/lib/sale/http.ts. The subject (an IP or email) is only ever
 * stored as a sha256 hash. Fails open if Firestore is unavailable, so a counter
 * outage never blocks a genuine applicant.
 *
 * Counter docs carry `expiresAt`; a Firestore TTL policy on that field (set up
 * once in the console) keeps the collection small.
 */

import { createHash } from "crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";

export interface RateLimit {
  name: string;
  max: number;
  windowMs: number;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Returns seconds until retry when the limit is exceeded, otherwise null. */
export async function checkRateLimit(
  collection: string,
  limit: RateLimit,
  subject: string,
): Promise<number | null> {
  const now = Date.now();
  const windowStart = Math.floor(now / limit.windowMs) * limit.windowMs;
  const id = createHash("sha256").update(`${limit.name}:${subject}:${windowStart}`).digest("hex");
  const ref = adminDb.collection(collection).doc(id);

  let count: number;
  try {
    count = await adminDb.runTransaction(async (tx) => {
      const n = ((await tx.get(ref)).get("count") as number | undefined) ?? 0;
      if (n >= limit.max) return n + 1;
      tx.set(
        ref,
        {
          count: FieldValue.increment(1),
          limit: limit.name,
          expiresAt: Timestamp.fromMillis(windowStart + limit.windowMs),
        },
        { merge: true },
      );
      return n + 1;
    });
  } catch (e) {
    console.error(`[rate-limit] ${limit.name} counter unavailable, failing open`, e);
    return null;
  }
  return count > limit.max ? Math.ceil((windowStart + limit.windowMs - now) / 1000) : null;
}
