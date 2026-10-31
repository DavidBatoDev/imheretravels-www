/**
 * Browser client for the admin public sale API (cross-origin; CORS allows the
 * www origins). No credentials are sent; the hold token travels only in the
 * `holdParam` the claim returns.
 */

import { BLACK_FRIDAY_SLUG, SALE_API_BASE } from "./config";
import { splitHoldParam } from "./ladder";
import type { ClaimErrorCode, PublicSaleAvailability, PublicSlot, SaleHoldView } from "./types";

export type ClaimInput = {
  saleId: string;
  tourPackageId: string;
  partySize: number;
  email: string;
  /** Honeypot — must stay empty. */
  website: string;
  /** Slots on screen when Hold was tapped; the claim is refused if one has gone. */
  shownSlots: number[];
};

/** Live slot states sent back with a refused claim. */
export type SlotStates = Pick<PublicSlot, "index" | "state">[];

export type ClaimResult =
  | { ok: true; hold: SaleHoldView; holdParam: string }
  | { ok: false; error: ClaimErrorCode; left?: number; retryAfterS?: number; states?: SlotStates };

export type HoldLookup =
  | { ok: true; hold: SaleHoldView }
  | { ok: false; gone: boolean };

export interface SaleApi {
  availability(signal?: AbortSignal): Promise<PublicSaleAvailability>;
  claim(input: ClaimInput): Promise<ClaimResult>;
  hold(holdParam: string): Promise<HoldLookup>;
}

const KNOWN_ERRORS: ClaimErrorCode[] = [
  "not_enough_slots",
  "slots_changed",
  "sale_closed",
  "hold_in_payment",
  "rate_limited",
  "invalid_request",
  "sale_not_found",
  "tour_not_in_sale",
];

export const liveSaleApi: SaleApi = {
  async availability(signal) {
    const res = await fetch(
      `${SALE_API_BASE}/api/public/sale/availability?slug=${encodeURIComponent(BLACK_FRIDAY_SLUG)}`,
      { signal, cache: "no-store" },
    );
    if (!res.ok) throw new Error(`availability ${res.status}`);
    return (await res.json()) as PublicSaleAvailability;
  },

  async claim(input) {
    let res: Response;
    try {
      res = await fetch(`${SALE_API_BASE}/api/public/sale/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        cache: "no-store",
      });
    } catch {
      return { ok: false, error: "network" };
    }
    const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (res.ok && body && body.hold && typeof body.holdParam === "string") {
      return { ok: true, hold: body.hold as SaleHoldView, holdParam: body.holdParam };
    }
    const code = typeof body?.error === "string" ? (body.error as ClaimErrorCode) : "unknown";
    return {
      ok: false,
      error: KNOWN_ERRORS.includes(code) ? code : "unknown",
      left: typeof body?.left === "number" ? body.left : undefined,
      retryAfterS: typeof body?.retryAfterS === "number" ? body.retryAfterS : undefined,
      states: Array.isArray(body?.states) ? (body.states as SlotStates) : undefined,
    };
  },

  async hold(holdParam) {
    const parts = splitHoldParam(holdParam);
    if (!parts) return { ok: false, gone: true };
    try {
      const res = await fetch(
        `${SALE_API_BASE}/api/public/sale/holds/${encodeURIComponent(parts.holdId)}`,
        { headers: { "X-Hold-Token": parts.token }, cache: "no-store" },
      );
      if (res.status === 404 || res.status === 410) return { ok: false, gone: true };
      if (!res.ok) return { ok: false, gone: false };
      const body = (await res.json()) as { hold?: SaleHoldView };
      return body.hold ? { ok: true, hold: body.hold } : { ok: false, gone: false };
    } catch {
      return { ok: false, gone: false };
    }
  },
};
