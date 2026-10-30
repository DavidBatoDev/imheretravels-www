/**
 * Pure helpers for the slot ladder: formatting, which slots a party would take,
 * and the copy for party sizes. Shared by the server page and client components.
 */

import type { PublicSlot, PublicTourAvailability, SalePageData } from "./types";
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

export const PARTY_OPTIONS = [
  { size: 1, label: "Solo" },
  { size: 2, label: "Duo" },
  { size: 3, label: "Group of 3" },
  { size: 4, label: "Group of 4" },
] as const;

export function partyLabel(size: number): string {
  return PARTY_OPTIONS.find((o) => o.size === size)?.label ?? `Group of ${size}`;
}

/** The next `partySize` free slots in ladder order, or null if there aren't enough. */
export function pickSlots(slots: PublicSlot[], partySize: number): PublicSlot[] | null {
  const free = [...slots]
    .sort((a, b) => a.index - b.index)
    .filter((s) => s.state === "available");
  return free.length >= partySize ? free.slice(0, partySize) : null;
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

/** Copy for "N of M left", honest and without timers. */
export function availabilityLine(av: PublicTourAvailability | undefined): string {
  if (!av || av.slots.length === 0) return "Slots coming soon";
  const total = av.slots.length;
  if (isSoldOut(av)) return "Sold out";
  if (av.left === 0) {
    return av.onHold === 1
      ? "Last slot on hold — may free up soon"
      : "All slots on hold — may free up soon";
  }
  return `${av.left} of ${total} left`;
}

export function onHoldLine(av: PublicTourAvailability | undefined): string | null {
  if (!av || av.onHold === 0 || av.left === 0) return null;
  return av.onHold === 1
    ? "1 slot on hold — may free up soon"
    : `${av.onHold} slots on hold — may free up soon`;
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
