/**
 * Validation for the Work With Us forms, generated from the field config in
 * data/workWithUs.ts so the form and the API can never disagree about which
 * fields exist or are required. Imported by the client form (inline errors) and
 * by /api/work-with-us (authoritative check).
 */

import { z } from "zod";
import {
  forms,
  PARTNER_TYPES,
  type FormField,
  type PartnerType,
} from "@/data/workWithUs";

const DEFAULT_MAX = 300;
const REQUIRED = "This field is required.";

/**
 * Accepts "https://x.com/a" or "x.com/a". For social fields (handleBase set), a
 * bare handle with no slash ("@jane.doe" or "jane.doe") becomes a profile URL.
 */
export function normalizeUrl(raw: string, handleBase?: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (handleBase && /^@?[A-Za-z0-9._-]{1,60}$/.test(v)) {
    return handleBase + v.replace(/^@/, "");
  }
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return (u.protocol === "https:" || u.protocol === "http:") && u.hostname.includes(".");
  } catch {
    return false;
  }
}

function fieldSchema(f: FormField): z.ZodType {
  const max = f.maxLength ?? DEFAULT_MAX;
  switch (f.kind) {
    case "email": {
      const s = z.string({ error: REQUIRED }).trim().max(254);
      return f.required
        ? s.min(1, REQUIRED).pipe(z.email("Please enter a valid email address."))
        : s.pipe(z.union([z.literal(""), z.email("Please enter a valid email address.")])).default("");
    }
    case "url": {
      const s = z
        .string({ error: REQUIRED })
        .trim()
        .max(500)
        .transform((v) => normalizeUrl(v, f.handleBase))
        .refine((v) => v === "" || isHttpUrl(v), "Please enter a valid link.");
      return f.required ? s.refine((v) => v !== "", REQUIRED) : s.default("");
    }
    case "select":
    case "radio": {
      const opts = (f.options ?? []) as [string, ...string[]];
      return f.required
        ? z.enum(opts, { error: "Please choose an option." })
        : z.union([z.literal(""), z.enum(opts)]).default("");
    }
    case "checkboxes": {
      const opts = (f.options ?? []) as [string, ...string[]];
      const s = z.array(z.enum(opts), { error: "Please select at least one option." }).max(opts.length);
      return f.required ? s.min(1, "Please select at least one option.") : s.default([]);
    }
    case "destinations": {
      const s = z.array(z.string().trim().min(1).max(100), { error: "Please select at least one destination." }).max(40);
      return f.required ? s.min(1, "Please select at least one destination.") : s.default([]);
    }
    case "country":
    case "text":
    case "tel":
    case "textarea":
    default: {
      const s = z.string({ error: REQUIRED }).trim().max(max, `Please keep this under ${max} characters.`);
      return f.required ? s.min(1, REQUIRED) : s.default("");
    }
  }
}

function buildSchema(type: PartnerType) {
  const shape: Record<string, z.ZodType> = {};
  for (const f of forms[type].fields) shape[f.name] = fieldSchema(f);
  return z.object(shape);
}

export const applicationSchemas: Record<PartnerType, ReturnType<typeof buildSchema>> = {
  host: buildSchema("host"),
  affiliate: buildSchema("affiliate"),
  supplier: buildSchema("supplier"),
};

export const partnerTypeSchema = z.enum(PARTNER_TYPES);

export type ApplicationAnswers = Record<string, string | string[]>;

export type FieldErrors = Record<string, string>;

/** Validates answers for one form; returns cleaned data or a field → message map. */
export function validateApplication(
  type: PartnerType,
  input: unknown,
): { ok: true; data: ApplicationAnswers } | { ok: false; errors: FieldErrors } {
  const result = applicationSchemas[type].safeParse(input);
  if (result.success) return { ok: true, data: result.data as ApplicationAnswers };
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "_form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}
