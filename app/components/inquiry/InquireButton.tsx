"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import BottomSheet from "@/app/black-friday/_components/BottomSheet";
import { contactForm } from "@/data/contactUs";
import { trackEvent } from "@/lib/analytics/track";

/** Where the button sits, sent with the enquiry and the analytics event. */
export type InquireLocation = "sale_card" | "tour_page" | "tour_mobile_bar";

const EMPTY = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  message: "",
  subscribe: false,
  acceptedPrivacy: false,
  website: "",
};

/**
 * "Inquire now": opens the enquiry form (the /contact-us fields, with the tour
 * filled in) in the same sheet as the sale's Hold flow. A sent enquiry goes to
 * /enquiry-sent, which is the page the ad team counts as a lead.
 */
export default function InquireButton({
  tourName,
  tourSlug,
  location,
  className,
  children = "Inquire now",
}: {
  tourName: string;
  tourSlug?: string;
  location: InquireLocation;
  className: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          setOpen(true);
          trackEvent("inquire_open", { location, tour: tourSlug });
        }}
      >
        {children}
      </button>
      <InquireSheet
        open={open}
        onClose={() => setOpen(false)}
        tourName={tourName}
        tourSlug={tourSlug}
        location={location}
      />
    </>
  );
}

function InquireSheet({
  open,
  onClose,
  tourName,
  tourSlug,
  location,
}: {
  open: boolean;
  onClose: () => void;
  tourName: string;
  tourSlug?: string;
  location: InquireLocation;
}) {
  const router = useRouter();
  const titleId = useId();
  const formId = useId();
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.phone.trim()) {
      setError("Please fill in your name, email and phone number.");
      return;
    }
    if (!form.acceptedPrivacy) {
      setError("Please accept our privacy policy to continue.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tourName, tourSlug, location }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to send your enquiry");
      trackEvent("form_submission", { form_name: "tour_enquiry", location, tour: tourSlug });
      router.push(tourSlug ? `/enquiry-sent?tour=${encodeURIComponent(tourSlug)}` : "/enquiry-sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSending(false);
    }
  }

  const input =
    "block min-h-12 w-full rounded-sm border-[1.5px] border-grey/60 bg-white px-4 py-3 font-body text-base text-midnight outline-none placeholder:text-grey focus:border-midnight";

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      title={
        <>
          <p id={titleId} className="font-sans text-h6-mobile text-midnight md:text-h5-desktop">
            Inquire about this tour
          </p>
          <p className="mt-1 font-body text-b4-mobile text-dark-gray md:text-b4-desktop">{tourName}</p>
        </>
      }
      footer={
        <button
          type="submit"
          form={formId}
          disabled={sending}
          className="inline-flex min-h-13 w-full items-center justify-center rounded-full bg-crimson-red px-6 py-3.5 font-body font-bold text-white shadow-small transition-colors hover:bg-light-red disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-red"
        >
          {sending ? "Sending..." : "Send enquiry"}
        </button>
      }
    >
      <form id={formId} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <p className="font-body text-b2-mobile text-dark-gray md:text-b4-desktop">
          Leave your details and our team will get back to you about dates, prices and anything else you&apos;d like to know.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input
            aria-label="First name"
            autoComplete="given-name"
            required
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            placeholder={contactForm.fields.firstName}
            className={input}
          />
          <input
            aria-label="Last name"
            autoComplete="family-name"
            required
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            placeholder={contactForm.fields.lastName}
            className={input}
          />
        </div>
        <input
          type="email"
          aria-label="Email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder={contactForm.fields.email}
          className={input}
        />
        <input
          type="tel"
          aria-label="Phone number"
          autoComplete="tel"
          required
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder={contactForm.fields.phone}
          className={input}
        />
        <textarea
          aria-label="Message (optional)"
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="Message (optional)"
          rows={3}
          className={`${input} resize-y`}
        />
        {/* Honeypot: hidden from people and screen readers. */}
        <div aria-hidden="true" className="absolute -left-[10000px] top-auto size-px overflow-hidden">
          <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update("website", e.target.value)} />
        </div>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={form.subscribe}
            onChange={(e) => update("subscribe", e.target.checked)}
            className="mt-1 size-4 shrink-0 cursor-pointer accent-crimson-red"
          />
          <span className="font-body text-b2-mobile text-midnight md:text-b4-desktop">{contactForm.checkboxes[0]}</span>
        </label>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            required
            checked={form.acceptedPrivacy}
            onChange={(e) => update("acceptedPrivacy", e.target.checked)}
            className="mt-1 size-4 shrink-0 cursor-pointer accent-crimson-red"
          />
          <span className="font-body text-b2-mobile text-midnight md:text-b4-desktop">
            By checking this, you accept our{" "}
            <Link href="/privacy-policy" target="_blank" className="text-crimson-red underline hover:text-light-red">
              privacy policy
            </Link>{" "}
            *
          </span>
        </label>
        {error && (
          <p role="alert" className="font-body text-b2-mobile text-crimson-red md:text-b4-desktop">
            {error}
          </p>
        )}
      </form>
    </BottomSheet>
  );
}
