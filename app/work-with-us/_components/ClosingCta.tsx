import Link from "next/link";
import { CalendarDays, Mail } from "lucide-react";
import { BUSINESS_EMAIL, CALENDLY_URL, workWithUsClosing } from "@/data/workWithUs";
import TrackedLink from "./TrackedLink";

export default function ClosingCta() {
  return (
    <section className="bg-light-grey px-4 py-16 md:px-8 md:py-24" aria-labelledby="wwu-closing-heading">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 rounded-lg bg-midnight px-6 py-14 text-center text-white md:px-16 md:py-20">
        <h2 id="wwu-closing-heading" className="font-display text-h2-mobile md:text-h2-desktop">
          {workWithUsClosing.heading}
        </h2>
        <div className="max-w-2xl space-y-3 font-body text-b2-mobile text-white/80 md:text-b2-desktop">
          {workWithUsClosing.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <div className="mt-2 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Link
            href={workWithUsClosing.primary.href}
            className="inline-flex items-center justify-center rounded-full bg-crimson-red px-8 py-3 font-body font-bold text-b2-mobile text-white transition-colors hover:bg-light-red md:px-10 md:text-b2-desktop"
          >
            {workWithUsClosing.primary.label}
          </Link>
          <TrackedLink
            href={CALENDLY_URL}
            method="calendly"
            location="work_with_us_closing"
            className="inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] border-white/80 px-8 py-3 font-body font-bold text-b2-mobile text-white transition-colors hover:bg-white hover:text-midnight md:text-b2-desktop"
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            Book a call with Bella
          </TrackedLink>
        </div>
        <TrackedLink
          href={`mailto:${BUSINESS_EMAIL}`}
          method="email"
          location="work_with_us_closing"
          className="inline-flex items-center gap-2 font-body text-b2-mobile text-white/80 underline underline-offset-4 hover:text-white md:text-b2-desktop"
        >
          <Mail className="size-4" aria-hidden="true" />
          {BUSINESS_EMAIL}
        </TrackedLink>
      </div>
    </section>
  );
}
