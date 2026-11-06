"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarDays } from "lucide-react";
import { CALENDLY_LABEL, CALENDLY_URL, type PartnerType } from "@/data/workWithUs";
import ApplicationForm from "./ApplicationForm";
import TrackedLink from "./TrackedLink";

/**
 * CTA row + inline application form for one partnership type. The form opens
 * from the button or from a deep link to `#{sectionId}-application`, which
 * other pages, emails and social bios can use.
 */
export default function ApplyPanel({
  type,
  sectionId,
  ctaLabel,
  destinations,
  countries,
}: {
  type: PartnerType;
  sectionId: string;
  ctaLabel: string;
  destinations: string[];
  countries: string[];
}) {
  const anchor = `${sectionId}-application`;
  const [open, setOpen] = useState(false);
  // Bumped every time the form should be revealed; the effect below scrolls
  // (and optionally focuses) once the form has actually rendered.
  const [reveal, setReveal] = useState<{ n: number; focus: boolean }>({ n: 0, focus: false });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function syncFromHash() {
      if (window.location.hash === `#${anchor}`) {
        setOpen(true);
        setReveal((r) => ({ n: r.n + 1, focus: false }));
      }
    }
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [anchor]);

  useEffect(() => {
    if (reveal.n === 0 || !panelRef.current) return;
    panelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    if (reveal.focus) {
      panelRef.current
        .querySelector<HTMLElement>("input:not([tabindex='-1']), select, textarea")
        ?.focus({ preventScroll: true });
    }
  }, [reveal]);

  function openForm() {
    setOpen(true);
    setReveal((r) => ({ n: r.n + 1, focus: !open }));
    history.replaceState(null, "", `#${anchor}`);
  }

  return (
    <div className="mt-12">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
        <button
          type="button"
          onClick={openForm}
          aria-expanded={open}
          aria-controls={anchor}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-crimson-red px-8 py-3 font-body font-bold text-b2-mobile text-white transition-colors hover:bg-light-red md:px-10 md:text-b2-desktop"
        >
          {ctaLabel}
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
        <TrackedLink
          href={CALENDLY_URL}
          method="calendly"
          location={`work_with_us_${type}`}
          className="inline-flex items-center gap-2 font-body font-bold text-b2-mobile text-midnight underline decoration-crimson-red decoration-2 underline-offset-4 transition-colors hover:text-crimson-red md:text-b2-desktop"
        >
          <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
          {CALENDLY_LABEL}
        </TrackedLink>
      </div>

      <div id={anchor} ref={panelRef} data-apply-panel hidden={!open}>
        {open && (
          <div className="mt-8">
            <ApplicationForm type={type} destinations={destinations} countries={countries} />
          </div>
        )}
      </div>
    </div>
  );
}
