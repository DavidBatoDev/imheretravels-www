/**
 * POST /api/work-with-us: Host / Affiliate / Supplier applications.
 *
 * multipart/form-data:
 *   type        "host" | "affiliate" | "supplier"
 *   payload     JSON answers (validated against data/workWithUs.ts via zod)
 *   consent     "true" (required)
 *   fax_number  honeypot (real users never see or fill it)
 *   document    optional file, supplier only (PDF/Word/Excel/CSV, ≤ 4 MB)
 *
 * Flow: honeypot → validate → rate limit → upload → Firestore
 * `partnerApplications` → emails (team + applicant). The lead is saved before
 * any email is sent, and an email failure is recorded on the doc rather than
 * failing the request.
 */

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminBucket, adminDb } from "@/lib/firebase-admin";
import { forms, SUPPLIER_UPLOAD } from "@/data/workWithUs";
import { partnerTypeSchema, validateApplication } from "@/lib/work-with-us/schema";
import { getDestinationOptions } from "@/lib/work-with-us/destinations";
import { getAllNationalities } from "@/lib/nationalities";
import { storeDocument, validateDocument, type StoredAttachment } from "@/lib/work-with-us/upload";
import {
  answerRows,
  buildApplicantEmail,
  buildTeamEmail,
  type SubmissionSummary,
} from "@/lib/work-with-us/emails";
import { getGmailAccessToken, sendGmail } from "@/lib/gmail";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLLECTION = "partnerApplications";
const RATE_COLLECTION = "partnerApplicationRateLimits";
const LIMIT_PER_IP = { name: "wwu-ip", max: 5, windowMs: 60 * 60_000 };
const LIMIT_PER_EMAIL = { name: "wwu-email", max: 3, windowMs: 60 * 60_000 };
/** Vercel rejects bodies over 4.5 MB; leave room for the form fields. */
const MAX_BODY_BYTES = SUPPLIER_UPLOAD.maxBytes + 512 * 1024;

function bad(error: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error, ...extra }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BODY_BYTES) {
    return bad("That file is larger than 4 MB. Please upload a smaller file or email it to bella@imheretravels.com.", 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return bad("Invalid request.");
  }

  // Honeypot: pretend success, store nothing.
  const honeypot = form.get("fax_number");
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const typeParse = partnerTypeSchema.safeParse(form.get("type"));
  if (!typeParse.success) return bad("Unknown application type.");
  const type = typeParse.data;
  const cfg = forms[type];

  if (form.get("consent") !== "true") {
    return bad("Please agree to the Privacy Policy to continue.", 400, {
      fieldErrors: { consent: "Please agree to the Privacy Policy to continue." },
    });
  }

  let rawAnswers: unknown;
  try {
    rawAnswers = JSON.parse(String(form.get("payload") ?? "{}"));
  } catch {
    return bad("Invalid request.");
  }
  const validated = validateApplication(type, rawAnswers);
  if (!validated.ok) {
    return bad("Please check the highlighted fields.", 400, { fieldErrors: validated.errors });
  }
  const answers = validated.data;

  // Country and destinations must come from the real lists the form offers.
  const listErrors: Record<string, string> = {};
  const countries = new Set(getAllNationalities().map((c) => c.countryName));
  let allowedDestinations: Set<string> | null = null;
  for (const f of cfg.fields) {
    const v = answers[f.name];
    if (f.kind === "country" && typeof v === "string" && v && !countries.has(v)) {
      listErrors[f.name] = "Please choose a country from the list.";
    }
    if (f.kind === "destinations" && Array.isArray(v) && v.length > 0) {
      allowedDestinations ??= new Set(await getDestinationOptions());
      if (v.some((d) => !allowedDestinations!.has(d))) {
        listErrors[f.name] = "Please choose destinations from the list.";
      }
    }
  }
  if (Object.keys(listErrors).length > 0) {
    return bad("Please check the highlighted fields.", 400, { fieldErrors: listErrors });
  }

  // Optional supplier document.
  const fileEntry = form.get(cfg.upload?.name ?? "__none__");
  const file = cfg.upload && fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;
  let fileBuf: Buffer | null = null;
  if (file) {
    fileBuf = Buffer.from(await file.arrayBuffer());
    const fileError = validateDocument(file, fileBuf);
    if (fileError) {
      return bad(fileError, 400, { fieldErrors: { [cfg.upload!.name]: fileError } });
    }
  }

  const name = String(answers[cfg.nameField] ?? "").trim();
  const email = String(answers.email ?? "").trim().toLowerCase();
  const country = String(answers.country ?? "").trim();
  const org = cfg.orgField ? String(answers[cfg.orgField] ?? "").trim() : undefined;

  // Only valid submissions count towards the limit.
  const ip = clientIp(request);
  const retryIp = await checkRateLimit(RATE_COLLECTION, LIMIT_PER_IP, ip);
  const retryEmail = retryIp ? null : await checkRateLimit(RATE_COLLECTION, LIMIT_PER_EMAIL, email);
  const retryAfter = retryIp ?? retryEmail;
  if (retryAfter) {
    return bad(
      "You've sent several applications in a short time. Please try again later, or email bella@imheretravels.com.",
      429,
      { retryAfterS: retryAfter },
    );
  }

  const ref = adminDb.collection(COLLECTION).doc();

  let attachment: StoredAttachment | null = null;
  if (file && fileBuf) {
    try {
      attachment = await storeDocument(ref.id, file, fileBuf);
    } catch (e) {
      console.error("[work-with-us] document upload failed", e);
      return bad("We couldn't upload your file. Please try again, or submit without it and email it to bella@imheretravels.com.", 502);
    }
  }

  try {
    await ref.set({
      type,
      status: "new",
      name,
      nameLower: name.toLowerCase(),
      email,
      country,
      ...(org ? { organisation: org } : {}),
      data: answers,
      // Labelled, ordered copy for the admin review screen, so admin doesn't
      // need www's form config to display an application.
      answerList: answerRows(type, answers).map(([label, value]) => ({ label, value })),
      attachment: attachment ? { ...attachment, bucket: adminBucket.name } : null,
      consent: {
        agreed: true,
        at: FieldValue.serverTimestamp(),
        privacyPolicyUrl: "https://www.imheretravels.com/privacy-policy",
        text: "I agree to I'm Here Travels' Privacy Policy and consent to being contacted about my application.",
      },
      source: {
        page: "/work-with-us",
        userAgent: (request.headers.get("user-agent") ?? "").slice(0, 300),
        referrer: (request.headers.get("referer") ?? "").slice(0, 300),
      },
      notes: [],
      emails: { team: "pending", applicant: "pending" },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error("[work-with-us] Firestore write failed", e);
    return bad("Something went wrong saving your application. Please try again in a moment.", 500);
  }

  // Emails: best effort, recorded on the doc.
  const summary: SubmissionSummary = {
    id: ref.id,
    type,
    name,
    email,
    country,
    org,
    answers,
    attachment:
      attachment && fileBuf
        ? { filename: attachment.name, contentType: attachment.contentType, content: fileBuf, size: attachment.size }
        : undefined,
  };

  let team = "failed";
  let applicant = "failed";
  try {
    const token = await getGmailAccessToken();
    const [t, a] = await Promise.allSettled([
      sendGmail(buildTeamEmail(summary), token),
      sendGmail(buildApplicantEmail(summary), token),
    ]);
    team = t.status === "fulfilled" ? "sent" : "failed";
    applicant = a.status === "fulfilled" ? "sent" : "failed";
    if (t.status === "rejected") console.error("[work-with-us] team email failed", t.reason);
    if (a.status === "rejected") console.error("[work-with-us] applicant email failed", a.reason);
  } catch (e) {
    console.error("[work-with-us] Gmail unavailable", e);
  }
  await ref
    .update({ emails: { team, applicant, at: FieldValue.serverTimestamp() } })
    .catch((e) => console.error("[work-with-us] email status update failed", e));

  return NextResponse.json({ ok: true, id: ref.id }, { headers: { "Cache-Control": "no-store" } });
}
