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
 * Slim Black Friday strip above the header on every page except the sale
 * itself. Not sticky — it scrolls away with the page. Dismissal is remembered
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
    <div className="relative z-[51] bg-midnight text-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-center gap-2 px-12 py-2 sm:px-14">
        <Link
          href={BLACK_FRIDAY_PATH}
          onClick={() => trackEvent("select_promotion", { promotion_id: "black-friday", creative_slot: "promo_strip" })}
          className="inline-flex min-h-7 items-center gap-2 rounded-sm text-center font-body text-b4-mobile font-medium transition-colors hover:text-light-yellow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:text-b4-desktop"
        >
          <span aria-hidden="true" className="inline-block size-2 shrink-0 rounded-full bg-light-red" />
          <span>
            <span className="font-bold">Black Friday Sale</span>
            <span className="hidden text-white/85 sm:inline"> · limited slots per tour</span>
            <span className="ml-1.5 underline underline-offset-2">See deals</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss Black Friday banner"
          className="absolute right-1 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-white/80 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white sm:right-3"
        >
          <X className="size-4" strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
