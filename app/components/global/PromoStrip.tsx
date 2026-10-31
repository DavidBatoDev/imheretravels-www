"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { trackEvent } from "@/lib/analytics/track";
import {
  BLACK_FRIDAY_PATH,
  BLACK_FRIDAY_PROMO_ON,
  PROMO_STRIP_DISMISS_KEY,
} from "@/lib/sale/config";

const CHANGE_EVENT = "iht:promo-strip-change";

/** In-memory fallback for when localStorage is blocked. */
let sessionDismissed = false;

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(PROMO_STRIP_DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function readSessionDismissed(): boolean {
  return sessionDismissed;
}

function subscribe(cb: () => void) {
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function dismiss() {
  sessionDismissed = true;
  try {
    window.localStorage.setItem(PROMO_STRIP_DISMISS_KEY, "1");
  } catch {
    // Storage blocked — hide for this page view only.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Branded Black Friday ribbon above the header on every page except the sale
 * itself; the whole bar links to the sale. Not sticky — it scrolls away with the page. Dismissal is remembered
 * in localStorage. Switched off with NEXT_PUBLIC_BLACK_FRIDAY=off.
 */
export default function PromoStrip() {
  const pathname = usePathname();
  // Server snapshot "not dismissed" so first-time visitors get it in the HTML
  // (no layout shift); visitors who dismissed it lose it on hydration.
  const dismissedStored = useSyncExternalStore(subscribe, readDismissed, () => false);
  // In-memory fallback when storage is blocked.
  const dismissedSession = useSyncExternalStore(subscribe, readSessionDismissed, () => false);

  if (!BLACK_FRIDAY_PROMO_ON) return null;
  if (pathname === BLACK_FRIDAY_PATH || pathname.startsWith(`${BLACK_FRIDAY_PATH}/`)) return null;
  if (dismissedStored || dismissedSession) return null;

  return (
    <div className="relative z-[51] overflow-hidden bg-midnight text-white">
      {/* Brand accent: crimson top rule + soft glow behind the tag. */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-crimson-red" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-10 top-1/2 h-24 w-56 -translate-y-1/2 rounded-full bg-crimson-red/25 blur-2xl" />
      <Link
        href={BLACK_FRIDAY_PATH}
        onClick={() => trackEvent("select_promotion", { promotion_id: "black-friday", creative_slot: "promo_strip" })}
        className="group relative mx-auto flex w-full max-w-7xl items-center justify-center gap-2.5 py-2.5 pl-3 pr-12 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white sm:gap-4 sm:pl-6 sm:pr-14"
      >
        <span className="shrink-0 rounded-sm bg-crimson-red px-2 py-0.5 font-sans text-[0.7rem] font-bold uppercase tracking-widest sm:text-xs">
          Black Friday
        </span>
        <span className="min-w-0 truncate font-body text-b4-mobile font-medium md:text-b4-desktop">
          <span className="font-bold">Sale now on</span>
          <span className="hidden text-white/85 sm:inline"> · small-group tours with limited sale slots, cheapest first</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1 font-body text-[0.8rem] font-bold text-midnight transition-colors group-hover:bg-light-yellow sm:px-4">
          See the deals
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
        </span>
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss Black Friday banner"
        className="absolute right-1 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white sm:right-3"
      >
        <X className="size-4" strokeWidth={2.5} aria-hidden="true" />
      </button>
    </div>
  );
}
