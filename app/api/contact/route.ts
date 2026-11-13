import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { subscribeToMailchimp } from "@/lib/mailchimp";

export const runtime = "nodejs";

const CONTACT_RECIPIENT = "bella@imheretravels.com";
/** Local dev saves to the dev Firestore but doesn't email Bella or touch
 *  Mailchimp unless ENQUIRY_SIDE_EFFECTS_IN_DEV=1 (same switch as /api/enquiry). */
const SIDE_EFFECTS =
  process.env.NODE_ENV === "production" || process.env.ENQUIRY_SIDE_EFFECTS_IN_DEV === "1";

type ContactPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  message?: string;
  subscribe?: boolean;
  acceptedPrivacy?: boolean;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function encodeSubject(subject: string): string {
  return `=?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Gmail OAuth credentials are not configured.");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to refresh Gmail token: ${text}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Gmail token response missing access_token.");
  return data.access_token;
}

function buildRawMessage(params: {
  to: string;
  from: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
}): string {
  const boundary = `bnd_${Date.now().toString(16)}`;
  const headers = [
    `From: ${params.from}`,
    `To: ${params.to}`,
    params.replyTo ? `Reply-To: ${params.replyTo}` : null,
    `Subject: ${encodeSubject(params.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ]
    .filter(Boolean)
    .join("\r\n");

  const body = [
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    params.text,
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    params.html,
    `--${boundary}--`,
    "",
  ].join("\r\n");

  return `${headers}\r\n\r\n${body}`;
}

export async function POST(request: Request) {
  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const firstName = payload.firstName?.trim() ?? "";
  const lastName = payload.lastName?.trim() ?? "";
  const email = payload.email?.trim() ?? "";
  const phone = payload.phone?.trim() ?? "";
  const message = payload.message?.trim() ?? "";

  if (!firstName || !lastName || !email || !phone || !message) {
    return NextResponse.json(
      { error: "All fields are required." },
      { status: 400 },
    );
  }

  if (!payload.acceptedPrivacy) {
    return NextResponse.json(
      { error: "You must accept the privacy policy." },
      { status: 400 },
    );
  }

  const fullName = `${firstName} ${lastName}`.trim();

  // Saved first, to the same `enquiries` list as the tour "Inquire now" form
  // (admin → Enquiries), so a message is never lost to a Gmail outage.
  const ref = adminDb.collection("enquiries").doc();
  let saved = false;
  try {
    await ref.set({
      status: "new",
      firstName,
      lastName,
      name: fullName,
      nameLower: fullName.toLowerCase(),
      email: email.toLowerCase(),
      phone,
      message,
      tour: null,
      subscribe: payload.subscribe === true,
      consent: {
        agreed: true,
        at: FieldValue.serverTimestamp(),
        privacyPolicyUrl: "https://www.imheretravels.com/privacy-policy",
      },
      source: {
        form: "contact_us",
        location: null,
        page: (request.headers.get("referer") ?? "").slice(0, 300),
        userAgent: (request.headers.get("user-agent") ?? "").slice(0, 300),
      },
      emails: { team: "pending" },
      mailchimp: payload.subscribe ? "pending" : "not_requested",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    saved = true;
  } catch (err) {
    console.error("Contact form: Firestore save failed:", err);
  }
  const adminUrl = saved ? `https://admin.imheretravels.com/enquiries?id=${ref.id}` : "";

  const subject = "New Website Enquiry";
  const text = [
    `Name: ${fullName}`,
    `Email Address: ${email}`,
    `Phone: ${phone}`,
    `Message: ${message}`,
    payload.subscribe ? "Subscribed to updates: Yes" : "Subscribed to updates: No",
    adminUrl ? `Open in admin: ${adminUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #1C1F2A;">
      <h2 style="margin:0 0 16px 0;">New Website Enquiry</h2>
      <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
      <p><strong>Email Address:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
      <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
      <p><strong>Message:</strong><br/>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
      <p><strong>Subscribed to updates:</strong> ${payload.subscribe ? "Yes" : "No"}</p>
      ${adminUrl ? `<p><a href="${adminUrl}">Open in admin</a></p>` : ""}
    </div>
  `.trim();

  let team = SIDE_EFFECTS ? "failed" : "skipped_dev";
  let mailchimp = payload.subscribe ? (SIDE_EFFECTS ? "failed" : "skipped_dev") : "not_requested";
  if (SIDE_EFFECTS) {
    try {
      const accessToken = await getAccessToken();
      const raw = toBase64Url(
        buildRawMessage({
          to: CONTACT_RECIPIENT,
          from: `ImHereTravels <${CONTACT_RECIPIENT}>`,
          replyTo: `${fullName} <${email}>`,
          subject,
          html,
          text,
        }),
      );
      const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
        cache: "no-store",
      });
      if (sendRes.ok) team = "sent";
      else console.error("Gmail send failed:", await sendRes.text());
    } catch (err) {
      console.error("Contact API email error:", err);
    }

    if (payload.subscribe) {
      try {
        await subscribeToMailchimp({ email, firstName, lastName, tag: "Website Contact Form" });
        mailchimp = "subscribed";
      } catch (err) {
        console.error("Mailchimp subscribe (contact form) failed:", err);
      }
    }
  }

  if (saved) {
    await ref
      .update({ emails: { team, at: FieldValue.serverTimestamp() }, mailchimp })
      .catch((err) => console.error("Contact form: status update failed:", err));
  } else if (team !== "sent") {
    // Neither saved nor emailed: the message would be lost, so say so.
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
