/**
 * Firebase Admin SDK singleton for server-side Firestore access.
 *
 * Credentials are read from the FIREBASE_SERVICE_ACCOUNT env var, which must
 * hold the full service-account JSON as a base-64–encoded string.  In
 * development, set it in `www/web/.env.local`:
 *
 *   FIREBASE_SERVICE_ACCOUNT=<base64-of-service-account.json>
 *
 * In CI / production, inject it as an environment variable.
 *
 * This module is server-only (no "use client" export) and must never be
 * imported by client components.
 */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getApp() {
  if (getApps().length > 0) return getApps()[0]!;

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!b64) {
    throw new Error(
      "Missing FIREBASE_SERVICE_ACCOUNT env var. " +
        "Set it to the base-64-encoded service-account JSON.",
    );
  }

  const serviceAccount = JSON.parse(
    Buffer.from(b64, "base64").toString("utf-8"),
  );

  return initializeApp({ credential: cert(serviceAccount) });
}

export const adminDb = getFirestore(getApp());
