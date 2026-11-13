/**
 * POST /api/enquiry: the "Inquire now" form on tour cards and tour pages.
 *
 * Same fields as the /contact-us form, plus the tour it was opened from.
 * Flow: honeypot → validate → rate limit → Firestore `enquiries` (the lead is
 * saved first) → email to bella@ → optional Mailchimp opt-in. Email and
 * Mailchimp are best effort and recorded on the doc, so a Gmail outage never
 * loses a lead.
 *
 * Local dev writes to the dev Firestore but does not email Bella or touch
 * Mailchimp unless ENQUIRY_SIDE_EFFECTS_IN_DEV=1.
 */

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { escapeHtml, formatAddress, getGmailAccessToken, sendGmail } from "@/lib/gmail";
import { subscribeToMailchimp } from "@/lib/mailchimp";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLLECTION = "enquiries";
const RATE_COLLECTION = "enquiryRateLimits";
const LIMIT_PER_IP = { name: "enquiry-ip", max: 8, windowMs: 60 * 60_000 };
const LIMIT_PER_EMAIL = { name: "enquiry-email", max: 5, windowMs: 60 * 60_000 };
const TEAM_EMAIL = "bella@imheretravels.com";
const SIDE_EFFECTS =
  process.env.NODE_ENV === "production" || process.env.ENQUIRY_SIDE_EFFECTS_IN_DEV === "1";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Payload = {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  phone?: unknown;
  message?: unknown;
  subscribe?: unknown;
  acceptedPrivacy?: unknown;
  tourName?: unknown;
  tourSlug?: unknown;
  /** Where the button was: "sale_card", "tour_page", "tour_mobile_bar". */
  location?: unknown;
  /** Honeypot. */
  website?: unknown;
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  let p: Payload;
  try {
    p = (await request.json()) as Payload;
  } catch {
    return bad("Invalid request.");
  }

  // Bots fill every field; pretend success and store nothing.
  if (str(p.website, 200)) return NextResponse.json({ ok: true });

  const firstName = str(p.firstName, 100);
  const lastName = str(p.lastName, 100);
  const email = str(p.email, 200).toLowerCase();
  const phone = str(p.phone, 50);
  const message = str(p.message, 5000);
  const tourName = str(p.tourName, 200);
  const tourSlug = /^[a-z0-9-]{1,120}$/.test(str(p.tourSlug, 120)) ? str(p.tourSlug, 120) : "";
  const location = /^[a-z_]{1,40}$/.test(str(p.location, 40)) ? str(p.location, 40) : "";
  const subscribe = p.subscribe === true;

  if (!firstName || !lastName || !email || !phone) {
    return bad("Please fill in your name, email and phone number.");
  }
  if (!EMAIL_RE.test(email)) return bad("Please enter a valid email address.");
  if (p.acceptedPrivacy !== true) return bad("Please accept our privacy policy to continue.");

  const ip = clientIp(request);
  const retryIp = await checkRateLimit(RATE_COLLECTION, LIMIT_PER_IP, ip);
  const retryEmail = retryIp ? null : await checkRateLimit(RATE_COLLECTION, LIMIT_PER_EMAIL, email);
  if (retryIp ?? retryEmail) {
    return bad(
      "You've sent several enquiries in a short time. Please try again later, or email bella@imheretravels.com.",
      429,
    );
  }

  const fullName = `${firstName} ${lastName}`;
  const ref = adminDb.collection(COLLECTION).doc();
  try {
    await ref.set({
      status: "new",
      firstName,
      lastName,
      name: fullName,
      nameLower: fullName.toLowerCase(),
      email,
      phone,
      message,
      tour: tourSlug || tourName ? { slug: tourSlug || null, name: tourName || null } : null,
      subscribe,
      consent: {
        agreed: true,
        at: FieldValue.serverTimestamp(),
        privacyPolicyUrl: "https://www.imheretravels.com/privacy-policy",
      },
      source: {
        form: "tour_enquiry",
        location: location || null,
        page: str(request.headers.get("referer"), 300),
        userAgent: str(request.headers.get("user-agent"), 300),
      },
      emails: { team: "pending" },
      mailchimp: subscribe ? "pending" : "not_requested",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error("[enquiry] Firestore write failed", e);
    return bad("Something went wrong sending your enquiry. Please try again in a moment.", 500);
  }

  let team = "skipped_dev";
  let mailchimp = subscribe ? "skipped_dev" : "not_requested";
  if (SIDE_EFFECTS) {
    const subject = tourName ? `Tour Enquiry: ${tourName}` : "New Tour Enquiry";
    const rows: [string, string][] = [
      ["Tour", tourName || "Not specified"],
      ["Name", fullName],
      ["Email", email],
      ["Phone", phone],
      ["Message", message || "(none)"],
      ["Subscribed to updates", subscribe ? "Yes" : "No"],
    ];
    const tourUrl = tourSlug ? `https://www.imheretravels.com/tours/${tourSlug}` : "";
    const adminUrl = `https://admin.imheretravels.com/enquiries?id=${ref.id}`;
    const html = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #1C1F2A;">
        <h2 style="margin:0 0 16px 0;">${escapeHtml(subject)}</h2>
        ${rows
          .map(([k, v]) =>
            k === "Email"
              ? `<p><strong>${k}:</strong> <a href="mailto:${escapeHtml(v)}">${escapeHtml(v)}</a></p>`
              : `<p><strong>${k}:</strong> ${escapeHtml(v).replace(/\n/g, "<br/>")}</p>`,
          )
          .join("\n")}
        ${tourUrl ? `<p><a href="${tourUrl}">${tourUrl}</a></p>` : ""}
        <p><a href="${adminUrl}">Open in admin</a></p>
      </div>`.trim();
    const text = [...rows.map(([k, v]) => `${k}: ${v}`), tourUrl, `Open in admin: ${adminUrl}`]
      .filter(Boolean)
      .join("\n");
    try {
      await sendGmail(
        {
          to: TEAM_EMAIL,
          from: formatAddress("IHT Website", TEAM_EMAIL),
          replyTo: formatAddress(fullName, email),
          subject,
          html,
          text,
        },
        await getGmailAccessToken(),
      );
      team = "sent";
    } catch (e) {
      team = "failed";
      console.error("[enquiry] team email failed", e);
    }
    if (subscribe) {
      try {
        await subscribeToMailchimp({ email, firstName, lastName, tag: "Tour Enquiry" });
        mailchimp = "subscribed";
      } catch (e) {
        mailchimp = "failed";
        console.error("[enquiry] Mailchimp subscribe failed", e);
      }
    }
  }
  await ref
    .update({ emails: { team, at: FieldValue.serverTimestamp() }, mailchimp })
    .catch((e) => console.error("[enquiry] status update failed", e));

  return NextResponse.json({ ok: true, id: ref.id }, { headers: { "Cache-Control": "no-store" } });
}
