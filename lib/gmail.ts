/**
 * Server-only Gmail API sender (OAuth refresh token for bella@imheretravels.com,
 * the same GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN env vars
 * the contact form uses).
 *
 * Sends through the media-upload endpoint with a raw RFC 822 message, so file
 * attachments up to Gmail's 25 MB limit work (the JSON `raw` endpoint caps the
 * whole request much lower). Bodies are base64 encoded so non-ASCII names and
 * text survive.
 *
 * TODO: app/api/contact and app/api/personalized-tours still carry their own
 * copy of this logic; move them onto this helper in a follow-up.
 */

import { randomUUID } from "crypto";

export interface MailAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
}

export interface MailMessage {
  to: string;
  from: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  attachments?: MailAttachment[];
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** RFC 2047 encoded-word, so names/subjects with accents or emoji are safe. */
function encodeHeader(value: string): string {
  return /^[\x20-\x7e]*$/.test(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value, "utf-8").toString("base64")}?=`;
}

/** "Name <email>" with the display name encoded when needed. */
export function formatAddress(name: string, email: string): string {
  const clean = name.replace(/[\r\n"<>]/g, "").trim();
  return clean ? `${encodeHeader(clean)} <${email}>` : email;
}

function wrap76(b64: string): string {
  return b64.replace(/.{1,76}/g, "$&\r\n").trimEnd();
}

function b64(value: string | Buffer): string {
  return wrap76(Buffer.isBuffer(value) ? value.toString("base64") : Buffer.from(value, "utf-8").toString("base64"));
}

function stripHeaderBreaks(v: string): string {
  return v.replace(/[\r\n]+/g, " ");
}

export function buildMime(msg: MailMessage): string {
  const mixed = `mixed_${randomUUID()}`;
  const alt = `alt_${randomUUID()}`;
  const hasAttachments = (msg.attachments?.length ?? 0) > 0;

  const headers = [
    `From: ${stripHeaderBreaks(msg.from)}`,
    `To: ${stripHeaderBreaks(msg.to)}`,
    msg.replyTo ? `Reply-To: ${stripHeaderBreaks(msg.replyTo)}` : null,
    `Subject: ${encodeHeader(stripHeaderBreaks(msg.subject))}`,
    "MIME-Version: 1.0",
    hasAttachments
      ? `Content-Type: multipart/mixed; boundary="${mixed}"`
      : `Content-Type: multipart/alternative; boundary="${alt}"`,
  ].filter((h): h is string => h !== null);

  const altPart = [
    `--${alt}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    b64(msg.text),
    `--${alt}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    b64(msg.html),
    `--${alt}--`,
  ];

  if (!hasAttachments) {
    return [...headers, "", ...altPart, ""].join("\r\n");
  }

  const parts: string[] = [
    ...headers,
    "",
    `--${mixed}`,
    `Content-Type: multipart/alternative; boundary="${alt}"`,
    "",
    ...altPart,
  ];
  for (const a of msg.attachments!) {
    const safeName = a.filename.replace(/[\r\n"]/g, "_");
    const encodedName = encodeURIComponent(safeName);
    parts.push(
      `--${mixed}`,
      `Content-Type: ${a.contentType}; name="${safeName}"`,
      `Content-Disposition: attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`,
      "Content-Transfer-Encoding: base64",
      "",
      b64(a.content),
    );
  }
  parts.push(`--${mixed}--`, "");
  return parts.join("\r\n");
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
  if (!res.ok) throw new Error(`Failed to refresh Gmail token: ${await res.text()}`);
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Gmail token response missing access_token.");
  return data.access_token;
}

/** Sends one message; resolves to the Gmail message id. Throws on failure. */
export async function sendGmail(msg: MailMessage, accessToken?: string): Promise<string> {
  const token = accessToken ?? (await getAccessToken());
  const res = await fetch(
    "https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send?uploadType=media",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "message/rfc822" },
      body: buildMime(msg),
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error(`Gmail send failed (${res.status}): ${await res.text()}`);
  const data = (await res.json()) as { id?: string };
  return data.id ?? "";
}

/** Fetch one access token to reuse across several sends in a request. */
export { getAccessToken as getGmailAccessToken };
