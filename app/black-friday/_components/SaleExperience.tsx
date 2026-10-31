"use client";

import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { regularBookingHref } from "@/lib/sale/config";
import type { SalePageData } from "@/lib/sale/types";
import ClaimSheet from "./ClaimSheet";
import ResumeBanner from "./ResumeBanner";
import SaleTourCard from "./SaleTourCard";
import { useClock } from "./hooks";
import { useSaleBooking } from "./useSaleBooking";

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

  const {
    api,
    announcement,
    byId,
    claim,
    closeSheet,
    closedLabel,
    heldTourId,
    openSheet,
    ordered,
    redirecting,
    refresh,
    saleOpen,
    sheetHold,
    sheetOpen,
    sheetTour,
    stored,
    tryAgain,
    updatedAt,
  } = useSaleBooking({ sale, mock, preview });
  const [refreshing, setRefreshing] = useState(false);

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
            Prices are per person, and each slot is one person&apos;s place. Slots sell cheapest
            first — when one goes, the next price applies.
          </p>
          {api && (
            <LiveStatus
              updatedAt={updatedAt}
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await refresh();
                setRefreshing(false);
              }}
            />
          )}
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
          regularHref={regularBookingHref(sheetTour.tourSlug)}
        />
      )}
    </>
  );
}

/**
 * "Live availability · updated 8s ago · Refresh". Availability already
 * refreshes every 15s and when the tab regains focus; this makes that visible
 * and gives an on-demand refresh to anyone waiting on a slot that's on hold.
 */
function LiveStatus({
  updatedAt,
  refreshing,
  onRefresh,
}: {
  updatedAt: number | null;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const now = useClock();
  const secs = updatedAt && now ? Math.max(0, Math.round((now - updatedAt) / 1000)) : null;
  const ago =
    secs === null
      ? "updating…"
      : secs < 5
        ? "updated just now"
        : secs < 60
          ? `updated ${secs}s ago`
          : `updated ${Math.round(secs / 60)} min ago`;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 font-body text-b4-mobile text-dark-gray md:text-b4-desktop">
      <span className="inline-flex items-center gap-2">
        <span className="relative flex size-2.5" aria-hidden="true">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-spring-green opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex size-2.5 rounded-full bg-spring-green" />
        </span>
        <span>
          <span className="font-bold text-midnight">Live availability</span> · {ago}
        </span>
      </span>
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border-2 border-midnight/15 px-3 font-bold text-midnight transition-colors hover:border-midnight/40 disabled:opacity-60"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className={`size-4 ${refreshing ? "animate-spin motion-reduce:animate-none" : ""}`}
        >
          <path d="M16 10a6 6 0 1 1-1.76-4.24M16 4v3h-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {refreshing ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}
