"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { CircleCheck, FileText, Upload, X } from "lucide-react";
import {
  CALENDLY_URL,
  SUPPLIER_UPLOAD,
  consentCopy,
  forms,
  successCopy,
  type FormField,
  type PartnerType,
} from "@/data/workWithUs";
import { validateApplication, type FieldErrors } from "@/lib/work-with-us/schema";
import { trackEvent } from "@/lib/analytics/track";
import TrackedLink from "./TrackedLink";

type Values = Record<string, string | string[]>;
type Status = "idle" | "submitting" | "success" | "error";

const CHECK_FIELDS = "Please check the highlighted fields.";

const inputClass =
  "w-full rounded-sm border-[1.5px] border-grey/60 bg-white px-4 py-3 font-body text-b2-mobile text-midnight outline-none placeholder:text-grey focus:border-midnight aria-[invalid=true]:border-crimson-red md:text-b2-desktop";

const labelClass = "mb-2 block font-body font-bold text-b2-mobile text-midnight md:text-b2-desktop";

function omit(errs: FieldErrors, key: string): FieldErrors {
  const next = { ...errs };
  delete next[key];
  return next;
}

function initialValues(type: PartnerType): Values {
  const v: Values = {};
  for (const f of forms[type].fields) {
    v[f.name] = f.kind === "checkboxes" || f.kind === "destinations" ? [] : "";
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

function ChipGroup({
  idBase,
  options,
  selected,
  onToggle,
  invalid,
  describedBy,
}: {
  idBase: string;
  options: readonly string[];
  selected: string[];
  onToggle: (opt: string) => void;
  invalid: boolean;
  describedBy?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-describedby={describedBy}>
      {options.map((opt, i) => {
        const id = `${idBase}-${i}`;
        const checked = selected.includes(opt);
        return (
          <label
            key={opt}
            htmlFor={id}
            className={`cursor-pointer select-none rounded-full border-[1.5px] px-4 py-2 font-body text-b2-mobile transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-midnight md:text-b2-desktop ${
              checked
                ? "border-midnight bg-midnight text-white"
                : invalid
                  ? "border-crimson-red/60 bg-white text-midnight hover:border-midnight"
                  : "border-grey/60 bg-white text-midnight hover:border-midnight"
            }`}
          >
            <input
              id={id}
              type="checkbox"
              className="sr-only"
              checked={checked}
              onChange={() => onToggle(opt)}
            />
            {opt}
          </label>
        );
      })}
    </div>
  );
}

export default function ApplicationForm({
  type,
  destinations,
  countries,
}: {
  type: PartnerType;
  destinations: string[];
  countries: string[];
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

  const fid = (name: string) => `${uid}-${type}-${name}`;

  function setValue(name: string, value: string | string[]) {
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((x) => omit(x, name));
  }

  function toggle(name: string, opt: string) {
    const cur = (values[name] as string[]) ?? [];
    setValue(name, cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt]);
  }

  function focusFirstError(errs: FieldErrors) {
    const first = cfg.fields.find((f) => errs[f.name])?.name ?? (errs.consent ? "consent" : errs[cfg.upload?.name ?? ""] ? cfg.upload?.name : undefined);
    if (!first) return;
    const el = formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.querySelector<HTMLElement>("input, select, textarea")?.focus({ preventScroll: true });
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    const name = cfg.upload!.name;
    if (!f) return setFile(null);
    const ext = /\.[A-Za-z0-9]+$/.exec(f.name)?.[0].toLowerCase() ?? "";
    let err = "";
    if (!SUPPLIER_UPLOAD.extensions.includes(ext)) err = "Please upload a PDF, Word, Excel or CSV file.";
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
    const error = err ? (
      <p id={errId} className="mt-1.5 font-body text-b4-mobile text-crimson-red md:text-b4-desktop">
        {err}
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
          {f.kind === "radio" ? (
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-describedby={describedBy}>
              {options.map((opt, i) => {
                const rid = `${id}-${i}`;
                const checked = value === opt;
                return (
                  <label
                    key={opt}
                    htmlFor={rid}
                    className={`min-w-20 cursor-pointer select-none rounded-full border-[1.5px] px-5 py-2 text-center font-body text-b2-mobile transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-midnight md:text-b2-desktop ${
                      checked ? "border-midnight bg-midnight text-white" : err ? "border-crimson-red/60 bg-white" : "border-grey/60 bg-white hover:border-midnight"
                    }`}
                  >
                    <input
                      id={rid}
                      type="radio"
                      name={`${uid}-${f.name}`}
                      className="sr-only"
                      checked={checked}
                      onChange={() => setValue(f.name, opt)}
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          ) : (
            <ChipGroup
              idBase={id}
              options={options}
              selected={(value as string[]) ?? []}
              onToggle={(opt) => toggle(f.name, opt)}
              invalid={!!err}
              describedBy={describedBy}
            />
          )}
          {error}
        </fieldset>
      );
    }

    const common = {
      id,
      "aria-invalid": err ? true : undefined,
      "aria-describedby": describedBy,
      "aria-required": f.required || undefined,
    } as const;

    let control: React.ReactNode;
    if (f.kind === "textarea") {
      control = (
        <textarea
          {...common}
          rows={4}
          maxLength={f.maxLength}
          value={value as string}
          onChange={(e) => setValue(f.name, e.target.value)}
          placeholder={f.placeholder}
          className={`${inputClass} resize-y`}
        />
      );
    } else if (f.kind === "select" || f.kind === "country") {
      const options = f.kind === "country" ? countries : (f.options ?? []);
      control = (
        <select
          {...common}
          value={value as string}
          onChange={(e) => setValue(f.name, e.target.value)}
          className={`${inputClass} appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%231C1F2A'%20stroke-width='2'%3E%3Cpath%20d='m6%209%206%206%206-6'/%3E%3C/svg%3E")] bg-size-[16px] bg-position-[right_1rem_center] bg-no-repeat pr-10 ${value ? "" : "text-grey"}`}
        >
          <option value="">{f.kind === "country" ? "Select a country" : "Select an option"}</option>
          {options.map((o) => (
            <option key={o} value={o} className="text-midnight">
              {o}
            </option>
          ))}
        </select>
      );
    } else {
      const inputType = f.kind === "url" ? "text" : f.kind;
      control = (
        <input
          {...common}
          type={inputType}
          inputMode={f.kind === "url" ? "url" : undefined}
          autoComplete={
            f.name === "fullName" || f.name === "contactPerson"
              ? "name"
              : f.kind === "email"
                ? "email"
                : f.kind === "tel"
                  ? "tel"
                  : f.name === "companyName"
                    ? "organization"
                    : undefined
          }
          maxLength={f.maxLength}
          value={value as string}
          onChange={(e) => setValue(f.name, e.target.value)}
          placeholder={f.placeholder}
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
        {error}
      </div>
    );
  }

  const uploadErr = cfg.upload ? errors[cfg.upload.name] : undefined;

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="rounded-lg bg-white p-6 shadow-xsmall md:p-10"
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
                  {file.name}{" "}
                  <span className="text-grey">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
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
            {uploadErr && (
              <p id={`${fid(cfg.upload.name)}-error`} className="mt-1.5 font-body text-b4-mobile text-crimson-red md:text-b4-desktop">
                {uploadErr}
              </p>
            )}
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
          {errors.consent && (
            <p id={`${uid}-${type}-consent-error`} className="mt-1.5 font-body text-b4-mobile text-crimson-red md:text-b4-desktop">
              {errors.consent}
            </p>
          )}
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
