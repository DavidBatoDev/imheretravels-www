/**
 * Black Friday sale — client-safe constants.
 *
 * `NEXT_PUBLIC_BLACK_FRIDAY=off` hides the header nav item and the promo strip
 * site-wide (the /black-friday page itself is driven by the sale's Firestore
 * status, so it is switched off from the admin instead). Anything other than
 * "off" — including unset — keeps them on.
 */

export const BLACK_FRIDAY_SLUG = "black-friday";
export const BLACK_FRIDAY_PATH = "/black-friday";

export const BLACK_FRIDAY_PROMO_ON =
  (process.env.NEXT_PUBLIC_BLACK_FRIDAY ?? "on").trim().toLowerCase() !== "off";

export const SALE_API_BASE = (
  process.env.NEXT_PUBLIC_SALE_API_BASE || "https://admin.imheretravels.com"
).replace(/\/+$/, "");

export const RESERVATION_FORM_URL =
  process.env.NEXT_PUBLIC_RESERVATION_FORM_URL ||
  "https://admin.imheretravels.com/reservation-booking-form";

/** Availability refresh cadence while the tab is visible. */
export const AVAILABILITY_POLL_MS = 15_000;

/** How long the "Slots held" confirmation shows before the auto-checkout redirect. */
export const AUTO_REDIRECT_DELAY_MS = 1_300;

/** localStorage keys (always accessed in try/catch). */
export const HOLD_STORAGE_KEY = `iht:sale-hold:${BLACK_FRIDAY_SLUG}`;
export const PROMO_STRIP_DISMISS_KEY = `iht:promo-strip-dismissed:${BLACK_FRIDAY_SLUG}`;

/** Largest party one booking can hold (1 slot = 1 person). Mirrors the admin API. */
export const MAX_PARTY_SIZE = 10;

export function reservationFormHref(tourSlug: string, holdParam: string): string {
  const url = new URL(RESERVATION_FORM_URL);
  url.searchParams.set("tour", tourSlug);
  url.searchParams.set("hold", holdParam);
  return url.toString();
}
