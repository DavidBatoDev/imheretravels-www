/**
 * Validation for the Work With Us forms, generated from the field config in
 * data/workWithUs.ts so the form and the API can never disagree about which
 * fields exist or what they accept. Imported by the client form (inline and
 * on-blur errors) and by /api/work-with-us (authoritative check).
 *
 * Country and destination values are additionally checked against the real
 * lists on the server (see app/api/work-with-us/route.ts).
 */

import { z } from "zod";
import {
  forms,
  otherFieldName,
  PARTNER_TYPES,
  type FormField,
  type PartnerType,
} from "@/data/workWithUs";

const DEFAULT_MAX = 300;
const OTHER_MAX = 200;
const REQUIRED = "This field is required.";

/** Letters (any script), spaces, hyphens, apostrophes and full stops. */
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u;
/** Digits with an optional leading + and common separators. */
const PHONE_RE = /^\+?[\d\s().-]+$/;
/** Instagram / TikTok / YouTube handles. */
const HANDLE_RE = /^@?[A-Za-z0-9._-]{1,60}$/;

const collapse = (v: string) => v.replace(/\s+/g, " ").trim();

/**
 * Accepts "https://x.com/a" or "x.com/a". For social fields (handleBase set), a
 * bare handle with no slash ("@jane.doe" or "jane.doe") becomes a profile URL.
 */
export function normalizeUrl(raw: string, handleBase?: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (handleBase && HANDLE_RE.test(v)) return handleBase + v.replace(/^@/, "");
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

function parseHttpUrl(v: string): URL | null {
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    // Needs a real-looking host: at least one dot and a 2+ letter TLD.
    if (!/\.[a-z]{2,}$/i.test(u.hostname)) return null;
    return u;
  } catch {
    return null;
  }
}

function onDomain(u: URL, domains: readonly string[]): boolean {
  const host = u.hostname.toLowerCase().replace(/^www\.|^m\./, "");
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}

const siteName = (domains: readonly string[]) => {
  const d = domains[0];
  return d === "instagram.com" ? "Instagram" : d === "tiktok.com" ? "TikTok" : d.startsWith("youtube") ? "YouTube" : d;
};

function textSchema(f: FormField, singleLine: boolean): z.ZodType {
  const max = f.maxLength ?? DEFAULT_MAX;
  const min = f.minLength ?? 1;
  const s = z
    .string({ error: REQUIRED })
    .transform((v) => (singleLine ? collapse(v) : v.trim()))
    .refine((v) => !f.required || v !== "", REQUIRED)
    .refine((v) => !f.required || v === "" || v.length >= min, `Please write at least ${min} characters.`)
    .refine((v) => v.length <= max, `Please keep this under ${max} characters.`);
  return f.required ? s : s.default("");
}

function fieldSchema(f: FormField): z.ZodType {
  switch (f.kind) {
    case "email": {
      const s = z
        .string({ error: REQUIRED })
        .trim()
        .toLowerCase()
        .max(254)
        .refine((v) => !f.required || v !== "", REQUIRED)
        .refine((v) => v === "" || z.email().safeParse(v).success, "Please enter a valid email address, like name@example.com.");
      return f.required ? s : s.default("");
    }

    case "name": {
      const s = z
        .string({ error: REQUIRED })
        .transform(collapse)
        .refine((v) => v !== "", REQUIRED)
        .refine((v) => v.length >= (f.minLength ?? 2), "Please enter your full name.")
        .refine((v) => v.length <= (f.maxLength ?? 120), "That name is too long.")
        .refine((v) => NAME_RE.test(v), "Names can only use letters, spaces, hyphens, apostrophes and full stops.");
      return s;
    }

    case "phone": {
      const s = z
        .string({ error: REQUIRED })
        .transform(collapse)
        .refine((v) => !f.required || v !== "", REQUIRED)
        .refine(
          (v) => {
            if (v === "") return true;
            const digits = v.replace(/\D/g, "").length;
            return PHONE_RE.test(v) && digits >= 7 && digits <= 15;
          },
          "Please enter a valid phone number with your country code, e.g. +63 912 345 6789.",
        );
      return f.required ? s : s.default("");
    }

    case "number": {
      const min = f.min ?? 0;
      const max = f.max ?? Number.MAX_SAFE_INTEGER;
      const s = z
        .union([z.string(), z.number()], { error: REQUIRED })
        .transform((v) => String(v).replace(/[,\s]/g, ""))
        .refine((v) => !f.required || v !== "", REQUIRED)
        .refine((v) => v === "" || /^\d+$/.test(v), "Please enter a whole number.")
        .refine(
          (v) => v === "" || (Number(v) >= min && Number(v) <= max),
          `Please enter a number between ${min.toLocaleString("en")} and ${max.toLocaleString("en")}.`,
        )
        .transform((v) => (v === "" ? "" : String(Number(v))));
      return f.required ? s : s.default("");
    }

    case "url": {
      const site = f.domains ? siteName(f.domains) : "";
      const s = z
        .string({ error: REQUIRED })
        .trim()
        .max(500, "That link is too long.")
        .transform((v) => normalizeUrl(v, f.handleBase))
        .refine((v) => !f.required || v !== "", REQUIRED)
        .refine((v) => v === "" || parseHttpUrl(v) !== null, "Please enter a valid link, like https://example.com.")
        .refine((v) => {
          if (v === "" || !f.domains) return true;
          const u = parseHttpUrl(v);
          return !!u && onDomain(u, f.domains);
        }, `Please enter ${/^[AEIOU]/i.test(site) ? "an" : "a"} ${site} link${f.handleBase ? " or your @handle" : ""}.`)
        .refine((v) => {
          // A profile link must point at a profile, not the site's home page.
          if (v === "" || !f.domains) return true;
          const u = parseHttpUrl(v);
          return !!u && u.pathname.replace(/\/+$/, "").length > 1;
        }, `Please link to your ${site} profile, not the home page.`);
      return f.required ? s : s.default("");
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
      const s = z
        .array(z.enum(opts), { error: "Please select at least one option." })
        .max(opts.length)
        .transform((v) => Array.from(new Set(v)));
      return f.required ? s.refine((v) => v.length > 0, "Please select at least one option.") : s.default([]);
    }

    case "destinations": {
      const s = z
        .array(z.string().trim().min(1).max(100), { error: "Please select at least one destination." })
        .max(40)
        .transform((v) => Array.from(new Set(v)));
      return f.required ? s.refine((v) => v.length > 0, "Please select at least one destination.") : s.default([]);
    }

    case "textarea":
      return textSchema(f, false);

    case "country":
      return z
        .string({ error: "Please choose a country." })
        .trim()
        .max(80)
        .refine((v) => !f.required || v !== "", "Please choose a country.");

    case "text":
    case "tel":
    default:
      return textSchema(f, true);
  }
}

/** True when the "please specify" option is currently selected. */
export function otherSelected(f: FormField, value: unknown): boolean {
  if (!f.otherOption) return false;
  return Array.isArray(value) ? value.includes(f.otherOption) : value === f.otherOption;
}

function buildSchema(type: PartnerType) {
  const fields = forms[type].fields;
  const shape: Record<string, z.ZodType> = {};
  for (const f of fields) {
    shape[f.name] = fieldSchema(f);
    if (f.otherOption) {
      shape[otherFieldName(f.name)] = z
        .string()
        .transform(collapse)
        .pipe(z.string().max(OTHER_MAX, `Please keep this under ${OTHER_MAX} characters.`))
        .default("");
    }
  }
  return z
    .object(shape)
    .superRefine((data, ctx) => {
      for (const issue of otherIssues(fields, data)) ctx.addIssue({ code: "custom", ...issue });
    })
    .transform((data) => {
      // Drop leftover "please specify" text when its option was un-ticked.
      const out = { ...data };
      for (const f of fields) {
        if (f.otherOption && !otherSelected(f, out[f.name])) out[otherFieldName(f.name)] = "";
      }
      return out;
    });
}

const OTHER_REQUIRED = "Please tell us more.";

/** "Please specify" text is required while its option is selected. */
function otherIssues(fields: FormField[], data: Record<string, unknown>): { path: string[]; message: string }[] {
  const issues: { path: string[]; message: string }[] = [];
  for (const f of fields) {
    if (!f.otherOption || !otherSelected(f, data[f.name])) continue;
    const key = otherFieldName(f.name);
    if (collapse(String(data[key] ?? "")).length < 2) issues.push({ path: [key], message: OTHER_REQUIRED });
  }
  return issues;
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
  // zod skips object-level checks while fields have errors; add the "please
  // specify" ones from the raw input so every problem shows at once.
  if (input && typeof input === "object") {
    for (const issue of otherIssues(forms[type].fields, input as Record<string, unknown>)) {
      errors[issue.path[0]] ??= issue.message;
    }
  }
  return { ok: false, errors };
}

/** Error for one field (and its "please specify" text), for validate-on-blur. */
export function fieldErrors(type: PartnerType, input: unknown, names: string[]): FieldErrors {
  const result = validateApplication(type, input);
  if (result.ok) return {};
  const out: FieldErrors = {};
  for (const n of names) if (result.errors[n]) out[n] = result.errors[n];
  return out;
}
