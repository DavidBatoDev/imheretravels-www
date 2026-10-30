"use client";

import { useEffect } from "react";
import { Clock } from "lucide-react";
import { useClock } from "./hooks";
import { reservationFormHref } from "@/lib/sale/config";
import { writeStoredHold, type StoredHold } from "@/lib/sale/hold-storage";
import { formatCountdown } from "@/lib/sale/ladder";

/**
 * "Resume your held slots" — only ever shown to the visitor who holds them
 * (it reads their own localStorage). Clears itself when the hold runs out.
 */
export default function ResumeBanner({
  stored,
  tourName,
  mock,
  onView,
}: {
  stored: StoredHold;
  tourName: string;
  mock: boolean;
  onView: () => void;
}) {
  const now = useClock();
  const remaining = now === 0 ? Number.POSITIVE_INFINITY : Date.parse(stored.expiresAt) - (now + stored.serverOffsetMs);
  const ended = remaining <= 0;

  useEffect(() => {
    if (ended) writeStoredHold(null);
  }, [ended]);

  if (ended || now === 0) return null;

  const count = stored.hold.slots.length;
  const what = count === 1 ? "slot" : `${count} slots`;
  const cta =
    "inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-crimson-red px-5 py-2.5 font-body text-b4-desktop font-bold text-white transition-colors hover:bg-light-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  return (
    <aside
      aria-label="Your held slots"
      className="flex flex-col gap-3 rounded-lg bg-midnight p-4 text-white sm:flex-row sm:items-center sm:justify-between md:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10">
          <Clock className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p className="font-body text-b2-mobile font-bold md:text-b4-desktop">
            Resume your held {what} on {tourName}
          </p>
          <p className="font-body text-b4-mobile text-white/80 tabular-nums md:text-b4-desktop">
            <span role="timer" aria-label={`${formatCountdown(remaining)} left on your hold`}>
              {formatCountdown(remaining)}
            </span>{" "}
            left — only you can see this.
          </p>
        </div>
      </div>
      {stored.checkoutMode === "auto" && !mock ? (
        <a href={reservationFormHref(stored.tourSlug, stored.holdParam)} className={cta}>
          Continue booking
        </a>
      ) : (
        <button type="button" onClick={onView} className={cta}>
          {stored.checkoutMode === "manual" ? "View payment links" : "View my slots"}
        </button>
      )}
    </aside>
  );
}
