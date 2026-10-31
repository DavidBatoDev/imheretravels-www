/**
 * DEV-ONLY in-memory stand-in for the admin sale API, used by /black-friday
 * when the page is rendered with `?mock=1` (never in production — the page
 * only enables mock mode when NODE_ENV !== "production"). Loaded via dynamic
 * import so it stays out of the normal bundle path.
 *
 * Email tricks for exercising error states:
 *   …+race@…       another visitor takes a slot first (slots_changed or not_enough_slots)
 *   …+soldout@…    everything sells out first (not_enough_slots, left 0)
 *   …+ratelimit@…  rate_limited (retryAfterS 42)
 *   …+paying@…     hold_in_payment
 *   …+closed@…     sale_closed
 *   …+short@…      success, but the hold ends in 20 seconds
 */

import type { SaleApi } from "./api";
import type { PublicSaleAvailability, SaleCheckoutMode, SalePageTour, SaleHoldView } from "./types";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function recount(av: PublicSaleAvailability) {
  for (const t of av.tours) {
    const free = t.slots.filter((s) => s.state === "available");
    t.left = free.length;
    t.onHold = t.slots.filter((s) => s.state === "on_hold").length;
    t.nextPrice = free[0]?.salePrice ?? null;
  }
}

export function createMockSaleApi(
  initial: PublicSaleAvailability,
  tours: SalePageTour[],
  checkoutMode: SaleCheckoutMode,
  holdMinutes: number,
): SaleApi {
  const state: PublicSaleAvailability = structuredClone(initial);
  const holds = new Map<string, SaleHoldView>();

  return {
    async availability() {
      await wait(150);
      return { ...structuredClone(state), serverNow: new Date().toISOString() };
    },

    async claim(input) {
      await wait(900);
      const email = input.email.toLowerCase();
      const t = state.tours.find((x) => x.tourPackageId === input.tourPackageId);
      const tour = tours.find((x) => x.tourPackageId === input.tourPackageId);
      if (!t || !tour) return { ok: false, error: "tour_not_in_sale" };
      if (input.website) return { ok: false, error: "invalid_request" };
      if (email.includes("+ratelimit")) return { ok: false, error: "rate_limited", retryAfterS: 42 };
      if (email.includes("+paying")) return { ok: false, error: "hold_in_payment" };
      if (email.includes("+closed") || !state.isOpen) return { ok: false, error: "sale_closed" };
      if (email.includes("+soldout")) {
        t.slots.forEach((s) => {
          if (s.state === "available") s.state = "sold";
        });
      } else if (email.includes("+race")) {
        const first = t.slots.find((s) => s.state === "available");
        if (first) first.state = "sold";
      }
      recount(state);
      const free = t.slots.filter((s) => s.state === "available");
      const states = t.slots.map((s) => ({ index: s.index, state: s.state }));
      if (free.length < input.partySize) {
        return { ok: false, error: "not_enough_slots", left: free.length, states };
      }
      if (input.shownSlots.some((i) => !free.some((s) => s.index === i))) {
        return { ok: false, error: "slots_changed", states };
      }
      const taken = free.slice(0, input.partySize);
      taken.forEach((s) => (s.state = "on_hold"));
      recount(state);

      const now = Date.now();
      const holdId = `mock${Math.random().toString(36).slice(2, 12)}`;
      const ms = email.includes("+short") ? 20_000 : holdMinutes * 60_000;
      const hold: SaleHoldView = {
        holdId,
        saleId: state.saleId,
        saleName: "Black Friday Sale",
        saleSlug: "black-friday",
        checkoutMode,
        tourPackageId: t.tourPackageId,
        tourSlug: tour.tourSlug,
        tourName: tour.tourName,
        displayName: tour.displayName,
        partySize: input.partySize,
        slots: taken.map((s) => ({
          index: s.index,
          salePrice: s.salePrice,
          originalPrice: tour.originalPrice,
          paymentLinkUrl:
            checkoutMode === "manual" ? `https://buy.stripe.com/test_mock_slot_${s.index}` : null,
        })),
        status: "active",
        paying: false,
        displayExpiresAt: new Date(now + ms).toISOString(),
        expiresAt: new Date(now + ms + 120_000).toISOString(),
        serverNow: new Date(now).toISOString(),
      };
      holds.set(holdId, hold);
      return { ok: true, hold, holdParam: `${holdId}.mocktoken` };
    },

    async hold(holdParam) {
      await wait(150);
      const hold = holds.get(holdParam.split(".")[0] ?? "");
      if (!hold) return { ok: false, gone: true };
      return { ok: true, hold: { ...hold, serverNow: new Date().toISOString() } };
    },
  };
}
