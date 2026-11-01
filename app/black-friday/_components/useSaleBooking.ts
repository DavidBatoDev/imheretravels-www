"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { trackEvent } from "@/lib/analytics/track";
import { createLiveSaleApi, type ClaimResult, type SaleApi } from "@/lib/sale/api";
import {
  AUTO_REDIRECT_DELAY_MS,
  AVAILABILITY_POLL_MS,
  reservationFormHref,
} from "@/lib/sale/config";
import {
  parseStoredHold,
  readStoredHoldRaw,
  subscribeStoredHold,
  writeStoredHold,
  type StoredHold,
} from "@/lib/sale/hold-storage";
import { isSoldOut, salePhase, statusLabel, withSlotStates } from "@/lib/sale/ladder";
import type { PublicSaleAvailability, PublicTourAvailability, SalePageData } from "@/lib/sale/types";
import type { ActiveHold } from "./ClaimSheet";

function describe(av: PublicTourAvailability): string {
  const total = av.slots.length;
  if (isSoldOut(av)) return "sold out";
  const held = av.onHold ? `, ${av.onHold} on hold` : "";
  return `${av.left} of ${total} sale places left${held}`;
}

function toActive(stored: StoredHold): ActiveHold {
  return { hold: stored.hold, holdParam: stored.holdParam, serverOffsetMs: stored.serverOffsetMs };
}

/**
 * Everything behind booking a sale slot, shared by the sale page and tour
 * pages: live availability, the claim sheet's state and the visitor's own hold.
 */
export function useSaleBooking({
  sale,
  mock = false,
  preview = false,
}: {
  sale: SalePageData;
  mock?: boolean;
  /** Admin preview link: shows the page as configured, booking disabled. */
  preview?: boolean;
}) {
  // ── API (mock is dev-only and loaded on demand) ───────────────────────────
  const [api, setApi] = useState<SaleApi | null>(() => (mock || preview ? null : createLiveSaleApi(sale.slug)));
  useEffect(() => {
    if (!mock) return;
    let cancelled = false;
    import("@/lib/sale/mock-api").then((m) => {
      if (!cancelled) {
        setApi(m.createMockSaleApi(sale.availability, sale.tours, sale.checkoutMode, sale.holdMinutes));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [mock, sale]);

  // ── Availability (SSR snapshot → polled) ──────────────────────────────────
  const [availability, setAvailability] = useState<PublicSaleAvailability>(sale.availability);
  const availabilityRef = useRef(sale.availability);
  const [announcement, setAnnouncement] = useState("");
  const [sheetTourId, setSheetTourId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const openTourRef = useRef<string | null>(null);
  const lastFetchRef = useRef(0);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!api) return;
    lastFetchRef.current = Date.now();
    try {
      const next = await api.availability();
      const prev = availabilityRef.current;
      availabilityRef.current = next;
      setAvailability(next);
      setUpdatedAt(Date.now());
      const openId = openTourRef.current;
      if (openId) {
        const a = prev.tours.find((t) => t.tourPackageId === openId);
        const b = next.tours.find((t) => t.tourPackageId === openId);
        if (b && (!a || a.left !== b.left || a.onHold !== b.onHold)) {
          setAnnouncement(`Availability updated: ${describe(b)}.`);
        }
      }
    } catch {
      // Keep showing the last known state; the next poll retries.
    }
  }, [api]);

  useEffect(() => {
    if (!api) return;
    let timer: number | undefined;
    const stop = () => {
      if (timer !== undefined) window.clearInterval(timer);
      timer = undefined;
    };
    const start = () => {
      stop();
      timer = window.setInterval(() => void refresh(), AVAILABILITY_POLL_MS);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        stop();
      } else {
        void refresh();
        start();
      }
    };
    const onFocus = () => {
      if (Date.now() - lastFetchRef.current > 3000) void refresh();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) void refresh();
    };

    if (document.visibilityState === "visible") {
      void refresh();
      start();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [api, refresh]);

  // ── The visitor's own hold ────────────────────────────────────────────────
  const storedRaw = useSyncExternalStore(subscribeStoredHold, readStoredHoldRaw, () => null);
  const stored = useMemo(() => {
    const s = parseStoredHold(storedRaw);
    return s && s.hold.saleId === sale.saleId ? s : null;
  }, [storedRaw, sale.saleId]);
  // In-memory copy so the sheet keeps showing "Your hold has ended" even after
  // storage is cleared, and so holds work when storage is blocked.
  const [sessionHold, setSessionHold] = useState<ActiveHold | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const redirectTimer = useRef<number | undefined>(undefined);

  // Re-validate a remembered hold once per API (it may have been paid, released or expired).
  const validatedFor = useRef<SaleApi | null>(null);
  useEffect(() => {
    if (!api || !stored || validatedFor.current === api) return;
    validatedFor.current = api;
    const holdParam = stored.holdParam;
    api.hold(holdParam).then((res) => {
      const current = parseStoredHold(readStoredHoldRaw());
      if (!current || current.holdParam !== holdParam) return;
      if (!res.ok) {
        if (res.gone) writeStoredHold(null);
        return;
      }
      // The timer the customer saw has ended, even if the server's grace hasn't.
      const timeUp = !res.hold.paying && Date.parse(res.hold.displayExpiresAt) <= Date.parse(res.hold.serverNow);
      if (res.hold.status !== "active" || timeUp) {
        writeStoredHold(null);
        return;
      }
      writeStoredHold({
        ...current,
        hold: res.hold,
        expiresAt: res.hold.displayExpiresAt,
        serverOffsetMs: Date.parse(res.hold.serverNow) - Date.now(),
      });
    });
  }, [api, stored]);

  useEffect(() => () => window.clearTimeout(redirectTimer.current), []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const serverNowMs = Date.parse(availability.serverNow);
  const phase = salePhase({ ...sale, status: availability.status }, serverNowMs);
  const closedLabel = preview
    ? "Preview only"
    : phase === "upcoming"
      ? statusLabel(sale, phase).replace(/^Starts/, "Opens")
      : phase === "paused"
        ? "Sale paused"
        : phase === "ended"
          ? "Sale ended"
          : "Not open yet";

  const byId = useMemo(
    () => new Map(availability.tours.map((t) => [t.tourPackageId, t])),
    [availability],
  );
  const ordered = useMemo(
    () =>
      [...sale.tours].sort((a, b) => {
        const sa = isSoldOut(byId.get(a.tourPackageId)) ? 1 : 0;
        const sb = isSoldOut(byId.get(b.tourPackageId)) ? 1 : 0;
        return sa - sb || a.order - b.order;
      }),
    [sale.tours, byId],
  );

  const sheetTour = sale.tours.find((t) => t.tourPackageId === sheetTourId) ?? null;
  const heldTourId = sessionHold?.hold.tourPackageId ?? stored?.tourPackageId ?? null;
  const sheetHold =
    sheetTour && sessionHold?.hold.tourPackageId === sheetTour.tourPackageId
      ? sessionHold
      : sheetTour && stored?.tourPackageId === sheetTour.tourPackageId
        ? toActive(stored)
        : null;

  // ── Actions ───────────────────────────────────────────────────────────────
  const openSheet = (tourPackageId: string) => {
    const tour = sale.tours.find((t) => t.tourPackageId === tourPackageId);
    if (!tour) return;
    if (stored && stored.tourPackageId === tourPackageId && !sessionHold) {
      setSessionHold(toActive(stored));
    }
    openTourRef.current = tourPackageId;
    setAnnouncement("");
    setSheetTourId(tourPackageId);
    setSheetOpen(true);
    trackEvent("select_promotion", {
      promotion_id: sale.saleId,
      promotion_name: sale.name,
      tour: tour.tourSlug,
      party_size: 1,
    });
  };

  const closeSheet = () => {
    setSheetOpen(false);
    openTourRef.current = null;
    if (redirectTimer.current !== undefined) {
      window.clearTimeout(redirectTimer.current);
      redirectTimer.current = undefined;
      setRedirecting(false);
    }
    // Drop an ended hold so the next open shows the form again.
    if (sessionHold && Date.parse(sessionHold.hold.displayExpiresAt) <= Date.now() + sessionHold.serverOffsetMs) {
      setSessionHold(null);
    }
  };

  const claim = async (
    partySize: number,
    email: string,
    website: string,
    shownSlots: number[],
  ): Promise<ClaimResult> => {
    const tour = sheetTour;
    if (!api || !tour) return { ok: false, error: "network" };
    trackEvent("sale_claim_started", { tour: tour.tourSlug, party_size: partySize });
    const res = await api.claim({
      saleId: sale.saleId,
      tourPackageId: tour.tourPackageId,
      partySize,
      email,
      website,
      shownSlots,
    });

    if (res.ok) {
      // Server clock relative to ours. serverNow is stamped as the response is
      // built (after the claim transaction), so compare it with arrival time,
      // not the request midpoint — a slow claim would skew a midpoint badly.
      const serverOffsetMs = Date.parse(res.hold.serverNow) - Date.now();
      const active: ActiveHold = { hold: res.hold, holdParam: res.holdParam, serverOffsetMs };
      setSessionHold(active);
      writeStoredHold({
        holdParam: res.holdParam,
        tourSlug: res.hold.tourSlug,
        expiresAt: res.hold.displayExpiresAt,
        tourPackageId: res.hold.tourPackageId,
        checkoutMode: res.hold.checkoutMode,
        serverOffsetMs,
        hold: res.hold,
      });
      trackEvent("sale_claim_success", {
        tour: tour.tourSlug,
        party_size: partySize,
        checkout_mode: res.hold.checkoutMode,
      });
      void refresh();
      if (res.hold.checkoutMode === "auto" && !mock) {
        setRedirecting(true);
        const href = reservationFormHref(res.hold.tourSlug, res.holdParam);
        redirectTimer.current = window.setTimeout(() => {
          window.location.assign(href);
        }, AUTO_REDIRECT_DELAY_MS);
      }
      return res;
    }

    if (res.error === "not_enough_slots" || res.error === "slots_changed") {
      trackEvent(res.error === "slots_changed" ? "sale_claim_slots_changed" : "sale_claim_soldout", {
        tour: tour.tourSlug,
        party_size: partySize,
        left: res.left ?? 0,
      });
      await refresh();
      // The feed is cached briefly; the refusal's states are the live ones.
      if (res.states) {
        const next = withSlotStates(availabilityRef.current, tour.tourPackageId, res.states);
        availabilityRef.current = next;
        setAvailability(next);
      }
    } else {
      trackEvent("sale_claim_error", { tour: tour.tourSlug, party_size: partySize, error: res.error });
      if (res.error === "sale_closed") await refresh();
    }
    return res;
  };

  const tryAgain = () => {
    setSessionHold(null);
    const current = parseStoredHold(readStoredHoldRaw());
    if (current && sessionHold && current.holdParam === sessionHold.holdParam) writeStoredHold(null);
    void refresh();
  };

  const saleOpen = availability.isOpen && !preview;

  return {
    api,
    availability,
    announcement,
    byId,
    claim,
    closeSheet,
    closedLabel,
    heldTourId,
    openSheet,
    ordered,
    phase,
    redirecting,
    refresh,
    saleOpen,
    sheetHold,
    sheetOpen,
    sheetTour,
    stored,
    tryAgain,
    updatedAt,
  };
}
