"use client";

import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { trackEvent } from "@/lib/analytics/track";
import { liveSaleApi, type ClaimResult, type SaleApi } from "@/lib/sale/api";
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
import { isSoldOut, salePhase, statusLabel } from "@/lib/sale/ladder";
import type { PublicSaleAvailability, PublicTourAvailability, SalePageData } from "@/lib/sale/types";
import ClaimSheet, { type ActiveHold } from "./ClaimSheet";
import ResumeBanner from "./ResumeBanner";
import SaleTourCard from "./SaleTourCard";

function describe(av: PublicTourAvailability): string {
  const total = av.slots.length;
  if (isSoldOut(av)) return "sold out";
  const held = av.onHold ? `, ${av.onHold} on hold` : "";
  return `${av.left} of ${total} slots left${held}`;
}

function toActive(stored: StoredHold): ActiveHold {
  return { hold: stored.hold, holdParam: stored.holdParam, serverOffsetMs: stored.serverOffsetMs };
}

/**
 * The interactive half of the sale page: live availability, the tour grid,
 * the claim sheet and the visitor's own hold.
 */
export default function SaleExperience({
  sale,
  mock,
  preview = false,
  children,
}: {
  sale: SalePageData;
  mock: boolean;
  /** Admin preview link: shows the page as configured, booking disabled. */
  preview?: boolean;
  /** Server-rendered content placed between the resume banner and the grid. */
  children?: ReactNode;
}) {
  const reduce = useReducedMotion() ?? false;

  // ── API (mock is dev-only and loaded on demand) ───────────────────────────
  const [api, setApi] = useState<SaleApi | null>(mock || preview ? null : liveSaleApi);
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

  const refresh = useCallback(async () => {
    if (!api) return;
    lastFetchRef.current = Date.now();
    try {
      const next = await api.availability();
      const prev = availabilityRef.current;
      availabilityRef.current = next;
      setAvailability(next);
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
      if (res.hold.status !== "active") {
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

  const claim = async (partySize: number, email: string, website: string): Promise<ClaimResult> => {
    const tour = sheetTour;
    if (!api || !tour) return { ok: false, error: "network" };
    trackEvent("sale_claim_started", { tour: tour.tourSlug, party_size: partySize });
    const res = await api.claim({
      saleId: sale.saleId,
      tourPackageId: tour.tourPackageId,
      partySize,
      email,
      website,
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

    if (res.error === "not_enough_slots") {
      trackEvent("sale_claim_soldout", {
        tour: tour.tourSlug,
        party_size: partySize,
        left: res.left ?? 0,
      });
      await refresh();
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

  // ── Render ────────────────────────────────────────────────────────────────
  const saleOpen = availability.isOpen && !preview;

  return (
    <>
      {stored && !sheetOpen && (
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
          <ResumeBanner
            stored={stored}
            tourName={
              sale.tours.find((t) => t.tourPackageId === stored.tourPackageId)?.displayName ??
              stored.hold.displayName
            }
            mock={mock}
            onView={() => openSheet(stored.tourPackageId)}
          />
        </div>
      )}

      {children}

      <section
        id="deals"
        aria-labelledby="deals-heading"
        className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-12 md:px-8 md:py-16"
      >
        <motion.div
          className="max-w-2xl"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* tabIndex -1: "See the deals" moves focus here after scrolling. */}
          <h2
            id="deals-heading"
            tabIndex={-1}
            className="font-display text-h2-mobile text-midnight outline-none md:text-h2-desktop"
          >
            The deals
          </h2>
          <p className="mt-3 font-body text-b2-mobile text-midnight md:text-b2-desktop">
            Prices are per person. Each tour has a handful of discounted slots, cheapest first — when
            one goes, the next price applies.
          </p>
        </motion.div>

        {sale.tours.length === 0 ? (
          <div className="mt-8 rounded-lg bg-white p-8 text-center">
            <p className="font-sans text-h6-mobile text-midnight md:text-h6-desktop">
              Deals are being added
            </p>
            <p className="mt-2 font-body text-b2-mobile text-dark-gray md:text-b4-desktop">
              Check back soon — tours will appear here as soon as they&apos;re ready.
            </p>
          </div>
        ) : (
          <LayoutGroup>
            <ul className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {ordered.map((tour, i) => (
                <motion.li
                  key={tour.tourPackageId}
                  layout={reduce ? false : "position"}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <SaleTourCard
                    tour={tour}
                    availability={byId.get(tour.tourPackageId)}
                    saleOpen={saleOpen}
                    closedLabel={closedLabel}
                    isMine={heldTourId === tour.tourPackageId}
                    priority={i < 2}
                    onHold={() => openSheet(tour.tourPackageId)}
                  />
                </motion.li>
              ))}
            </ul>
          </LayoutGroup>
        )}
      </section>

      {sheetTour && (
        <ClaimSheet
          key={sheetTour.tourPackageId}
          open={sheetOpen}
          onClose={closeSheet}
          tour={sheetTour}
          availability={byId.get(sheetTour.tourPackageId)}
          saleOpen={saleOpen}
          closedLabel={closedLabel}
          holdMinutes={sale.holdMinutes}
          activeHold={sheetHold}
          redirecting={redirecting}
          announcement={announcement}
          mock={mock}
          onClaim={claim}
          onTryAgain={tryAgain}
        />
      )}
    </>
  );
}
