/**
 * Supplier document upload (company profile / rate sheet / brochure).
 *
 * Unlike review photos, these are PRIVATE: saved without a Firebase download
 * token, under `partner-applications/{applicationId}/`, which storage.rules
 * keeps server-only. Staff open them through the admin (signed URL).
 */

import { randomUUID } from "crypto";
import { adminBucket } from "@/lib/firebase-admin";
import { SUPPLIER_UPLOAD } from "@/data/workWithUs";

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv": "text/csv",
};

export interface StoredAttachment {
  path: string;
  name: string;
  size: number;
  contentType: string;
}

function extOf(name: string): string {
  const m = /\.[A-Za-z0-9]+$/.exec(name);
  return m ? m[0].toLowerCase() : "";
}

/** Checks the first bytes match what the extension claims. */
function magicMatches(ext: string, buf: Buffer): boolean {
  const startsWith = (...bytes: number[]) => bytes.every((b, i) => buf[i] === b);
  switch (ext) {
    case ".pdf":
      return startsWith(0x25, 0x50, 0x44, 0x46); // %PDF
    case ".docx":
    case ".xlsx":
      return startsWith(0x50, 0x4b, 0x03, 0x04); // zip container
    case ".doc":
    case ".xls":
      return startsWith(0xd0, 0xcf, 0x11, 0xe0); // OLE2 compound file
    case ".csv":
      return !buf.subarray(0, 4096).includes(0); // plain text: no NUL bytes
    default:
      return false;
  }
}

/** Returns an error message, or null when the file is acceptable. */
export function validateDocument(file: File, buf: Buffer): string | null {
  const ext = extOf(file.name);
  if (!SUPPLIER_UPLOAD.extensions.includes(ext)) {
    return "Please upload a PDF, Word, Excel or CSV file.";
  }
  if (file.size > SUPPLIER_UPLOAD.maxBytes || buf.length > SUPPLIER_UPLOAD.maxBytes) {
    return "That file is larger than 4 MB. Please upload a smaller file or email it to bella@imheretravels.com.";
  }
  if (buf.length === 0) return "That file appears to be empty.";
  if (!magicMatches(ext, buf)) {
    return "That file doesn't look like a valid PDF, Word, Excel or CSV document.";
  }
  return null;
}

function safeFileName(name: string): string {
  const ext = extOf(name);
  const base = name
    .slice(0, name.length - ext.length)
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return `${base || "document"}_${randomUUID().slice(0, 8)}${ext}`;
}

export async function storeDocument(
  applicationId: string,
  file: File,
  buf: Buffer,
): Promise<StoredAttachment> {
  const ext = extOf(file.name);
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
  const storedName = safeFileName(file.name);
  const path = `partner-applications/${applicationId}/${storedName}`;
  await adminBucket.file(path).save(buf, {
    contentType,
    resumable: false,
    metadata: {
      cacheControl: "private, no-store",
      contentDisposition: `attachment; filename="${storedName}"`,
      metadata: { applicationId, originalName: file.name.slice(0, 200) },
    },
  });
  return { path, name: file.name.slice(0, 200), size: buf.length, contentType };
}
