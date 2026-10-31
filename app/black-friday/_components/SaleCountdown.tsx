"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useClock, useHydrated } from "./hooks";

const UNITS = [
  { label: "Days", ms: 86_400_000 },
  { label: "Hours", ms: 3_600_000 },
  { label: "Mins", ms: 60_000 },
  { label: "Secs", ms: 1_000 },
] as const;

/**
 * Countdown in the hero: to the sale opening while it's upcoming, then to its
 * end date while it's live. Everyone sees the same time (unlike a hold timer,
 * it isn't personal). At zero the page refreshes so the cards open or close.
 */
export default function SaleCountdown({
  to,
  label,
  doneLabel,
}: {
  to: string;
  /** "Sale opens in" */
  label: string;
  /** Shown at zero until the refreshed page arrives. */
  doneLabel: string;
}) {
  const hydrated = useHydrated();
  const now = useClock();
  const router = useRouter();
  const refreshed = useRef(false);
  const left = Math.max(0, Date.parse(to) - now);

  useEffect(() => {
    if (!hydrated || left > 0 || refreshed.current) return;
    refreshed.current = true;
    // A beat of grace so the server-side clock has passed it too.
    const id = window.setTimeout(() => router.refresh(), 1500);
    return () => window.clearTimeout(id);
  }, [hydrated, left, router]);

  // Server render and first paint show placeholders, so the HTML never bakes
  // in a stale time from the cached page.
  const parts = UNITS.map((u, i) => {
    const v = Math.floor((i === 0 ? left : left % UNITS[i - 1].ms) / u.ms);
    return { label: u.label, value: hydrated ? String(v).padStart(2, "0") : "--" };
  });

  return (
    <div className="mt-6" role="timer" aria-live="off" aria-label={label}>
      <p className="font-body text-b4-mobile font-medium uppercase tracking-wider text-white/70 md:text-b4-desktop">
        {hydrated && left === 0 ? doneLabel : label}
      </p>
      <div className="mt-2 flex gap-2 sm:gap-3">
        {parts.map((p) => (
          <div
            key={p.label}
            className="flex min-w-16 flex-col items-center rounded-md bg-white/10 px-3 py-2.5 sm:min-w-20"
          >
            <span className="font-display text-h3-mobile leading-none tabular-nums md:text-h3-desktop">{p.value}</span>
            <span className="mt-1 font-body text-[0.7rem] font-medium uppercase tracking-wider text-white/70">
              {p.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
