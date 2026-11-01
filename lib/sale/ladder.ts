/**
 * Pure helpers for the slot ladder: formatting, which slots a party would take,
 * and the copy for party sizes. Shared by the server page and client components.
 */

import type { PublicSaleAvailability, PublicSlot, PublicTourAvailability, SalePageData } from "./types";
import { MAX_PARTY_SIZE } from "./config";

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** £1,699 (no pence unless the amount has them). */
export function formatGBP(amount: number): string {
  return gbp.format(amount);
}

// UTC, because a date key is the UTC day of the travel date.
const tourDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** "Jan 16, 2027" from a date key, as the reservation form shows it. */
export function formatDateKey(key: string): string {
  return tourDate.format(Date.parse(key));
}

/** Solo / Duo / Group of N — one slot per person. */
export function partyLabel(size: number): string {
  if (size <= 1) return "Solo";
  if (size === 2) return "Duo";
  return `Group of ${size}`;
}

export function peopleLabel(n: number): string {
  return n === 1 ? "1 person" : `${n} people`;
}

/** The next `partySize` free slots in ladder order, or null if there aren't enough. */
export function pickSlots(slots: PublicSlot[], partySize: number): PublicSlot[] | null {
  const free = [...slots]
    .sort((a, b) => a.index - b.index)
    .filter((s) => s.state === "available");
  return free.length >= partySize ? free.slice(0, partySize) : null;
}

/** The slots a customer was shown that have gone since, in their current state. */
export function lostSlots(shown: PublicSlot[], current: PublicSlot[]): PublicSlot[] {
  return shown.flatMap((s) => {
    const now = current.find((c) => c.index === s.index);
    if (now?.state === "available") return [];
    return [now ?? { ...s, state: "sold" as const }];
  });
}

/** "Slot 3", "Slots 3 and 4", "Slots 3, 5 and 6", "Slots 3–7". */
export function slotNames(indexes: number[]): string {
  const sorted = [...indexes].sort((a, b) => a - b);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (sorted.length === 1) return `Slot ${first}`;
  if (sorted.length > 2 && last! - first! === sorted.length - 1) return `Slots ${first}–${last}`;
  return `Slots ${sorted.slice(0, -1).join(", ")} and ${last}`;
}

/** Applies the live slot states from a refused claim to one tour. */
export function withSlotStates(
  av: PublicSaleAvailability,
  tourPackageId: string,
  states: Pick<PublicSlot, "index" | "state">[],
): PublicSaleAvailability {
  return {
    ...av,
    tours: av.tours.map((t) => {
      if (t.tourPackageId !== tourPackageId) return t;
      const slots = t.slots.map((s) => ({
        ...s,
        state: states.find((x) => x.index === s.index)?.state ?? s.state,
      }));
      const free = slots.filter((s) => s.state === "available");
      return {
        ...t,
        slots,
        left: free.length,
        onHold: slots.filter((s) => s.state === "on_hold").length,
        nextPrice: free[0]?.salePrice ?? null,
      };
    }),
  };
}

/** Largest party the tour can take right now (0 when nothing is free). */
export function maxParty(av: PublicTourAvailability | undefined): number {
  if (!av) return 0;
  return Math.min(MAX_PARTY_SIZE, av.left);
}

export function isSoldOut(av: PublicTourAvailability | undefined): boolean {
  return !!av && av.slots.length > 0 && av.slots.every((s) => s.state === "sold");
}

/** Biggest single-slot saving across the sale — the hero's "Up to £X off". */
export function maxDiscount(data: Pick<SalePageData, "availability">): number {
  let max = 0;
  for (const t of data.availability.tours) {
    for (const s of t.slots) max = Math.max(max, s.discountGBP);
  }
  return max;
}

/**
 * Copy for "N of M sale places left" (one slot = one person's place), honest
 * and without timers.
 */
export function availabilityLine(av: PublicTourAvailability | undefined): string {
  if (!av || av.slots.length === 0) return "Sale places coming soon";
  const total = av.slots.length;
  if (isSoldOut(av)) return `0 of ${total} sale places left · Sold out`;
  if (av.left === 0) {
    return av.onHold === 1
      ? "Last place on hold — may free up soon"
      : "All places on hold — may free up soon";
  }
  return `${av.left} of ${total} sale ${total === 1 ? "place" : "places"} left`;
}

export function onHoldLine(av: PublicTourAvailability | undefined): string | null {
  if (!av || av.onHold === 0 || av.left === 0) return null;
  return av.onHold === 1
    ? "1 on hold — may free up soon"
    : `${av.onHold} on hold — may free up soon`;
}

/** Splits `${holdId}.${token}` (token may itself contain dots). */
export function splitHoldParam(holdParam: string): { holdId: string; token: string } | null {
  const i = holdParam.indexOf(".");
  if (i <= 0 || i === holdParam.length - 1) return null;
  return { holdId: holdParam.slice(0, i), token: holdParam.slice(i + 1) };
}

/** Reference code shown in manual checkout: first 8 chars of the hold id. */
export function holdReference(holdId: string): string {
  return holdId.slice(0, 8).toUpperCase();
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const londonDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/London",
});
const londonDateTime = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Europe/London",
});

export type SalePhase = "upcoming" | "live" | "paused" | "ended";

/** Phase from the sale status and window, at `nowMs`. */
export function salePhase(
  sale: Pick<SalePageData, "status" | "startAt" | "endAt">,
  nowMs: number,
): SalePhase {
  if (sale.status === "paused") return "paused";
  if (sale.status === "ended") return "ended";
  if (sale.startAt && nowMs < Date.parse(sale.startAt)) return "upcoming";
  if (sale.endAt && nowMs >= Date.parse(sale.endAt)) return "ended";
  return "live";
}

/** The hero status pill copy. */
export function statusLabel(
  sale: Pick<SalePageData, "status" | "startAt" | "endAt">,
  phase: SalePhase,
): string {
  switch (phase) {
    case "upcoming":
      return `Starts ${londonDateTime.format(new Date(sale.startAt!))}`;
    case "paused":
      return "Sale paused";
    case "ended":
      return "Sale ended";
    default:
      return sale.endAt
        ? `Live now · Ends ${londonDate.format(new Date(sale.endAt))}`
        : "Live now · Ends TBA";
  }
}
