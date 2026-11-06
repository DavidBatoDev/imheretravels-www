"use client";

import Link from "next/link";
import { useCallback, useId, useRef, useState } from "react";
import { CircleCheck, FileText, Upload, X } from "lucide-react";
import Dropdown from "@/app/components/global/Dropdown";
import NationalitySelect from "@/app/components/reviews/NationalitySelect";
import {
  CALENDLY_URL,
  SUPPLIER_UPLOAD,
  consentCopy,
  forms,
  otherFieldName,
  successCopy,
  type FormField,
  type PartnerType,
} from "@/data/workWithUs";
import {
  fieldErrors,
  otherSelected,
  validateApplication,
  type FieldErrors,
} from "@/lib/work-with-us/schema";
import { trackEvent } from "@/lib/analytics/track";
import TrackedLink from "./TrackedLink";

type Values = Record<string, string | string[]>;
type Status = "idle" | "submitting" | "success" | "error";

const CHECK_FIELDS = "Please check the highlighted fields.";

const inputClass =
  "w-full rounded-sm border-[1.5px] border-grey/60 bg-white px-4 py-3 font-body text-b2-mobile text-midnight outline-none placeholder:text-grey focus:border-midnight aria-[invalid=true]:border-crimson-red md:text-b2-desktop";

const labelClass = "mb-2 block font-body font-bold text-b2-mobile text-midnight md:text-b2-desktop";

const chipClass = (checked: boolean, invalid: boolean) =>
  `cursor-pointer select-none rounded-full border-[1.5px] px-4 py-2 font-body text-b2-mobile transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-midnight md:text-b2-desktop ${
    checked
      ? "border-midnight bg-midnight text-white"
      : invalid
        ? "border-crimson-red/60 bg-white text-midnight hover:border-midnight"
        : "border-grey/60 bg-white text-midnight hover:border-midnight"
  }`;

function omit(errs: FieldErrors, ...keys: string[]): FieldErrors {
  const next = { ...errs };
  for (const k of keys) delete next[k];
  return next;
}

function initialValues(type: PartnerType): Values {
  const v: Values = {};
  for (const f of forms[type].fields) {
    v[f.name] = f.kind === "checkboxes" || f.kind === "destinations" ? [] : "";
    if (f.otherOption) v[otherFieldName(f.name)] = "";
  }
  return v;
}

function RequiredMark({ required }: { required: boolean }) {
  return required ? (
    <span className="text-crimson-red" aria-hidden="true">
      {" "}
      *
    </span>
  ) : (
    <span className="font-normal text-grey"> (optional)</span>
  );
}

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 font-body text-b4-mobile text-crimson-red md:text-b4-desktop">
      {message}
    </p>
  );
}

export default function ApplicationForm({
  type,
  destinations,
}: {
  type: PartnerType;
  destinations: string[];
}) {
  const cfg = forms[type];
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Values>(() => initialValues(type));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [consent, setConsent] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Latest values for blur handlers fired right after a state update; kept in
  // sync by setValue (the only writer of `values`).
  const valuesRef = useRef(values);

  const fid = (name: string) => `${uid}-${type}-${name}`;

  /** Re-checks one field (and its "please specify" text) against the schema. */
  const revalidate = useCallback(
    (name: string, next: Values) => {
      const keys = [name, otherFieldName(name)];
      const found = fieldErrors(type, next, keys);
      setErrors((x) => ({ ...omit(x, ...keys), ...found }));
    },
    [type],
  );

  function setValue(name: string, value: string | string[]) {
    const next = { ...valuesRef.current, [name]: value };
    valuesRef.current = next;
    setValues(next);
    // Once a field shows an error, re-check it as the person types so the
    // message disappears as soon as it's fixed.
    const base = name.endsWith("Other") ? name.slice(0, -5) : name;
    if (errors[name] || errors[base]) revalidate(base, next);
  }

  /** Validate on leaving a field, but only once something was entered. */
  const onBlurField = useCallback(
    (name: string) => {
      const v = valuesRef.current[name];
      const filled = Array.isArray(v) ? v.length > 0 : String(v ?? "").trim() !== "";
      if (filled) revalidate(name, valuesRef.current);
    },
    [revalidate],
  );

  function toggle(f: FormField, opt: string) {
    const cur = (values[f.name] as string[]) ?? [];
    const next = cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt];
    setValue(f.name, next);
    if (opt === f.otherOption && !next.includes(opt)) setErrors((x) => omit(x, otherFieldName(f.name)));
  }

  function focusFirstError(errs: FieldErrors) {
    const order = [
      ...cfg.fields.flatMap((f) => (f.otherOption ? [f.name, otherFieldName(f.name)] : [f.name])),
      ...(cfg.upload ? [cfg.upload.name] : []),
      "consent",
    ];
    const first = order.find((k) => errs[k]);
    if (!first) return;
    const el = formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.querySelector<HTMLElement>("input:not([type=hidden]), button, textarea")?.focus({ preventScroll: true });
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    const name = cfg.upload!.name;
    if (!f) return setFile(null);
    const ext = /\.[A-Za-z0-9]+$/.exec(f.name)?.[0].toLowerCase() ?? "";
    let err = "";
    if (!SUPPLIER_UPLOAD.extensions.includes(ext)) err = "Please upload a PDF, Word, Excel or CSV file.";
    else if (f.size === 0) err = "That file appears to be empty.";
    else if (f.size > SUPPLIER_UPLOAD.maxBytes)
      err = "That file is larger than 4 MB. Please upload a smaller file or email it to bella@imheretravels.com.";
    if (err) {
      setErrors((x) => ({ ...x, [name]: err }));
      setFile(null);
      e.target.value = "";
      return;
    }
    setErrors((x) => omit(x, name));
    setFile(f);
  }

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");

    const result = validateApplication(type, values);
    const errs: FieldErrors = result.ok ? {} : { ...result.errors };
    if (!consent) errs.consent = "Please agree to the Privacy Policy to continue.";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setStatus("error");
      setFormError(CHECK_FIELDS);
      focusFirstError(errs);
      return;
    }

    setStatus("submitting");
    const body = new FormData();
    body.set("type", type);
    body.set("payload", JSON.stringify(values));
    body.set("consent", "true");
    const honeypot = formRef.current?.querySelector<HTMLInputElement>('input[name="fax_number"]')?.value ?? "";
    body.set("fax_number", honeypot);
    if (file && cfg.upload) body.set(cfg.upload.name, file);

    try {
      const res = await fetch("/api/work-with-us", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fieldErrors?: FieldErrors;
      };
      if (!res.ok || !data.ok) {
        if (data.fieldErrors) {
          setErrors(data.fieldErrors);
          focusFirstError(data.fieldErrors);
        }
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      trackEvent("form_submission", { form_name: `work_with_us_${type}` });
      setStatus("success");
      formRef.current?.closest("[data-apply-panel]")?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      setStatus("error");
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg bg-white px-6 py-12 text-center shadow-xsmall md:px-12" role="status">
        <CircleCheck className="size-12 text-spring-green" aria-hidden="true" />
        <h3 className="font-sans font-bold text-h4-mobile text-midnight md:text-h4-desktop">{successCopy.heading}</h3>
        <p className="max-w-xl font-body text-b2-mobile text-dark-gray md:text-b2-desktop">{successCopy.body}</p>
        <TrackedLink
          href={CALENDLY_URL}
          method="calendly"
          location={`work_with_us_${type}_success`}
          className="font-body font-bold text-b2-mobile text-crimson-red underline underline-offset-4 hover:text-light-red md:text-b2-desktop"
        >
          Book a 20-min call with Bella
        </TrackedLink>
      </div>
    );
  }

  /** "Please specify" text field shown while a field's other option is selected. */
  function renderOther(f: FormField) {
    if (!otherSelected(f, values[f.name])) return null;
    const key = otherFieldName(f.name);
    const id = fid(key);
    const err = errors[key];
    return (
      <div data-field={key} className="mt-3">
        <label htmlFor={id} className="sr-only">
          {f.label} – please specify
        </label>
        <input
          id={id}
          type="text"
          autoFocus
          maxLength={200}
          value={(values[key] as string) ?? ""}
          onChange={(e) => setValue(key, e.target.value)}
          onBlur={() => {
            // Only check once something was typed; an empty box is flagged on submit.
            if (String(valuesRef.current[key] ?? "").trim()) revalidate(f.name, valuesRef.current);
          }}
          placeholder={f.otherPlaceholder ?? "Please specify"}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `${id}-error` : undefined}
          className={inputClass}
        />
        <FieldError id={`${id}-error`} message={err} />
      </div>
    );
  }

  function renderField(f: FormField) {
    const id = fid(f.name);
    const err = errors[f.name];
    const errId = err ? `${id}-error` : undefined;
    const helpId = f.help ? `${id}-help` : undefined;
    const describedBy = [helpId, errId].filter(Boolean).join(" ") || undefined;
    const value = values[f.name];
    const span = f.half ? "md:col-span-1" : "md:col-span-2";

    const help = f.help ? (
      <p id={helpId} className="mb-2 font-body text-b4-mobile text-dark-gray md:text-b4-desktop">
        {f.help}
      </p>
    ) : null;

    if (f.kind === "radio" || f.kind === "checkboxes" || f.kind === "destinations") {
      const options = f.kind === "destinations" ? destinations : (f.options ?? []);
      return (
        <fieldset key={f.name} data-field={f.name} className={`col-span-1 ${span}`}>
          <legend className={labelClass}>
            {f.label}
            <RequiredMark required={f.required} />
          </legend>
          {help}
          <div
            className="flex flex-wrap gap-2"
            role={f.kind === "radio" ? "radiogroup" : undefined}
            aria-describedby={describedBy}
          >
            {options.map((opt, i) => {
              const oid = `${id}-${i}`;
              const checked = f.kind === "radio" ? value === opt : ((value as string[]) ?? []).includes(opt);
              return (
                <label
                  key={opt}
                  htmlFor={oid}
                  className={`${chipClass(checked, !!err)} ${f.kind === "radio" ? "min-w-20 text-center" : ""}`}
                >
                  <input
                    id={oid}
                    type={f.kind === "radio" ? "radio" : "checkbox"}
                    name={f.kind === "radio" ? `${uid}-${f.name}` : undefined}
                    className="sr-only"
                    checked={checked}
                    onChange={() => (f.kind === "radio" ? setValue(f.name, opt) : toggle(f, opt))}
                  />
                  {opt}
                </label>
              );
            })}
          </div>
          <FieldError id={errId} message={err} />
          {renderOther(f)}
        </fieldset>
      );
    }

    let control: React.ReactNode;
    if (f.kind === "country") {
      control = (
        <NationalitySelect
          id={id}
          variant="form"
          placeholder="Select a country"
          value={value as string}
          onChange={(v) => {
            setValue(f.name, v);
            setErrors((x) => omit(x, f.name));
          }}
          invalid={!!err}
          describedBy={describedBy}
        />
      );
    } else if (f.kind === "select") {
      control = (
        <Dropdown
          id={id}
          placeholder="Select an option"
          options={(f.options ?? []).map((o) => ({ value: o, label: o }))}
          value={value as string}
          onChange={(v) => {
            setValue(f.name, v);
            setErrors((x) => omit(x, f.name, ...(v === f.otherOption ? [] : [otherFieldName(f.name)])));
          }}
          invalid={!!err}
          describedBy={describedBy}
        />
      );
    } else if (f.kind === "textarea") {
      const len = String(value ?? "").trim().length;
      control = (
        <>
          <textarea
            id={id}
            rows={4}
            maxLength={f.maxLength}
            value={value as string}
            onChange={(e) => setValue(f.name, e.target.value)}
            onBlur={() => onBlurField(f.name)}
            placeholder={f.placeholder}
            aria-invalid={err ? true : undefined}
            aria-describedby={describedBy}
            aria-required={f.required || undefined}
            className={`${inputClass} resize-y`}
          />
          {f.minLength && f.minLength > 1 && len < f.minLength && (
            <p className="mt-1 text-right font-body text-b4-mobile text-grey md:text-b4-desktop" aria-live="polite">
              {len}/{f.minLength} characters minimum
            </p>
          )}
        </>
      );
    } else {
      const inputType =
        f.kind === "email" ? "email" : f.kind === "phone" || f.kind === "tel" ? "tel" : "text";
      control = (
        <input
          id={id}
          type={inputType}
          inputMode={f.kind === "url" ? "url" : f.kind === "number" ? "numeric" : undefined}
          autoComplete={
            f.kind === "name"
              ? "name"
              : f.kind === "email"
                ? "email"
                : f.kind === "phone" || f.kind === "tel"
                  ? "tel"
                  : f.name === "companyName"
                    ? "organization"
                    : f.kind === "url" && f.name === "website"
                      ? "url"
                      : "off"
          }
          maxLength={f.kind === "number" ? 7 : (f.maxLength ?? (f.kind === "url" ? 500 : undefined))}
          value={value as string}
          onChange={(e) =>
            setValue(f.name, f.kind === "number" ? e.target.value.replace(/[^\d]/g, "") : e.target.value)
          }
          onBlur={() => onBlurField(f.name)}
          placeholder={f.placeholder}
          aria-invalid={err ? true : undefined}
          aria-describedby={describedBy}
          aria-required={f.required || undefined}
          className={inputClass}
        />
      );
    }

    return (
      <div key={f.name} data-field={f.name} className={`col-span-1 ${span}`}>
        <label htmlFor={id} className={labelClass}>
          {f.label}
          <RequiredMark required={f.required} />
        </label>
        {help}
        {control}
        <FieldError id={errId} message={err} />
        {renderOther(f)}
      </div>
    );
  }

  const uploadErr = cfg.upload ? errors[cfg.upload.name] : undefined;

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="relative rounded-lg bg-white p-6 shadow-xsmall md:p-10"
      aria-labelledby={`${uid}-${type}-heading`}
    >
      <h3 id={`${uid}-${type}-heading`} className="font-sans font-bold text-h4-mobile text-midnight md:text-h4-desktop">
        {cfg.heading}
      </h3>
      <p className="mt-2 font-body text-b2-mobile text-dark-gray md:text-b2-desktop">{cfg.intro}</p>
      <p className="mt-1 font-body text-b4-mobile text-grey md:text-b4-desktop">
        Fields marked <span className="text-crimson-red">*</span> are required.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-x-5 gap-y-6 md:grid-cols-2">
        {cfg.fields.map(renderField)}

        {cfg.upload && (
          <div data-field={cfg.upload.name} className="col-span-1 md:col-span-2">
            <label htmlFor={fid(cfg.upload.name)} className={labelClass}>
              {cfg.upload.label}
              <RequiredMark required={false} />
            </label>
            <p id={`${fid(cfg.upload.name)}-help`} className="mb-2 font-body text-b4-mobile text-dark-gray md:text-b4-desktop">
              {cfg.upload.help}
            </p>
            {file ? (
              <div className="flex items-center gap-3 rounded-sm border-[1.5px] border-grey/60 px-4 py-3">
                <FileText className="size-5 shrink-0 text-midnight" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate font-body text-b2-mobile text-midnight md:text-b2-desktop">
                  {file.name} <span className="text-grey">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </span>
                <button
                  type="button"
                  onClick={clearFile}
                  className="rounded-full p-1 text-dark-gray hover:bg-light-grey hover:text-midnight"
                  aria-label="Remove file"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <label
                htmlFor={fid(cfg.upload.name)}
                className={`flex cursor-pointer flex-col items-center gap-2 rounded-sm border-[1.5px] border-dashed px-4 py-6 text-center transition-colors hover:border-midnight has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-midnight ${
                  uploadErr ? "border-crimson-red/60" : "border-grey/60"
                }`}
              >
                <Upload className="size-6 text-dark-gray" aria-hidden="true" />
                <span className="font-body font-bold text-b2-mobile text-midnight md:text-b2-desktop">Choose a file</span>
                <span className="font-body text-b4-mobile text-grey md:text-b4-desktop">PDF, DOC, DOCX, XLS, XLSX or CSV</span>
              </label>
            )}
            <input
              ref={fileInputRef}
              id={fid(cfg.upload.name)}
              type="file"
              accept={SUPPLIER_UPLOAD.accept}
              onChange={onFileChange}
              className="sr-only"
              aria-describedby={`${fid(cfg.upload.name)}-help${uploadErr ? ` ${fid(cfg.upload.name)}-error` : ""}`}
              aria-invalid={uploadErr ? true : undefined}
            />
            <FieldError id={`${fid(cfg.upload.name)}-error`} message={uploadErr} />
          </div>
        )}

        {/* Honeypot: hidden from people and assistive tech; bots fill it. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Fax number
            <input type="text" name="fax_number" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>

        <div data-field="consent" className="col-span-1 md:col-span-2">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (errors.consent) setErrors((x) => omit(x, "consent"));
              }}
              aria-invalid={errors.consent ? true : undefined}
              aria-describedby={errors.consent ? `${uid}-${type}-consent-error` : undefined}
              className="mt-1 size-4 shrink-0 cursor-pointer accent-crimson-red"
            />
            <span className="font-body text-b2-mobile text-midnight md:text-b2-desktop">
              I agree to I&apos;m Here Travels&apos;{" "}
              <Link
                href={consentCopy.privacyHref}
                target="_blank"
                className="text-crimson-red underline transition-colors hover:text-light-red"
              >
                Privacy Policy
              </Link>{" "}
              and consent to being contacted about my application.
              <span className="text-crimson-red" aria-hidden="true">
                {" "}
                *
              </span>
            </span>
          </label>
          <FieldError id={`${uid}-${type}-consent-error`} message={errors.consent} />
        </div>
      </div>

      {/* The "check the fields" banner goes away once every field error is fixed. */}
      {status === "error" && formError && !(formError === CHECK_FIELDS && Object.keys(errors).length === 0) && (
        <p className="mt-6 font-body text-b2-mobile text-crimson-red md:text-b2-desktop" role="alert">
          {formError}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center justify-center rounded-full bg-crimson-red px-8 py-3 font-body font-bold text-b2-mobile text-white transition-colors hover:bg-light-red disabled:cursor-not-allowed disabled:opacity-60 md:px-10 md:text-b2-desktop"
        >
          {status === "submitting" ? "Sending…" : cfg.submitLabel}
        </button>
        <p className="font-body text-b4-mobile text-dark-gray md:text-b4-desktop">
          Every application is reviewed by our team. Submitting doesn&apos;t confirm acceptance into a programme.
        </p>
      </div>
    </form>
  );
}
