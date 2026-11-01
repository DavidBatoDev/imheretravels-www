"use client";

import { createContext, useContext, useMemo, type MouseEvent, type ReactNode } from "react";
import ClaimSheet from "@/app/black-friday/_components/ClaimSheet";
import { useSaleBooking } from "@/app/black-friday/_components/useSaleBooking";
import { formatGBP, availabilityLine, isSoldOut, statusLabel } from "@/lib/sale/ladder";
import type { PublicTourAvailability, SalePageData, SalePageTour } from "@/lib/sale/types";

type TourSale = {
  tour: SalePageTour;
  availability: PublicTourAvailability | undefined;
  /** Sale slots can be held right now. */
  bookable: boolean;
  soldOut: boolean;
  isMine: boolean;
  /** "Starts 1 Nov, 00:00" while the sale hasn't opened. */
  upcomingLabel: string | null;
  open: () => void;
};

const TourSaleContext = createContext<TourSale | null>(null);

/** Live sale state for one tour page, and the same Hold sheet as the sale page. */
export function TourSaleProvider({
  offer,
  regularHref,
  children,
}: {
  /** The sale, narrowed to this tour. Null when the tour isn't in a public sale. */
  offer: SalePageData | null;
  regularHref: string;
  children: ReactNode;
}) {
  if (!offer) return children;
  return (
    <TourSaleBooking offer={offer} regularHref={regularHref}>
      {children}
    </TourSaleBooking>
  );
}

function TourSaleBooking({
  offer,
  regularHref,
  children,
}: {
  offer: SalePageData;
  regularHref: string;
  children: ReactNode;
}) {
  const booking = useSaleBooking({ sale: offer });
  const { availability, byId, heldTourId, openSheet, phase, saleOpen } = booking;
  const tour = offer.tours[0]!;
  const tourAvailability = byId.get(tour.tourPackageId);

  const value = useMemo<TourSale>(
    () => ({
      tour,
      availability: tourAvailability,
      bookable: saleOpen && (tourAvailability?.left ?? 0) > 0,
      soldOut: isSoldOut(tourAvailability),
      isMine: heldTourId === tour.tourPackageId,
      upcomingLabel: phase === "upcoming" ? statusLabel({ ...offer, status: availability.status }, phase) : null,
      open: () => openSheet(tour.tourPackageId),
    }),
    [tour, tourAvailability, saleOpen, heldTourId, phase, offer, availability.status, openSheet],
  );

  return (
    <TourSaleContext.Provider value={value}>
      {children}
      {booking.sheetTour && (
        <ClaimSheet
          key={booking.sheetTour.tourPackageId}
          open={booking.sheetOpen}
          onClose={booking.closeSheet}
          tour={booking.sheetTour}
          availability={tourAvailability}
          saleOpen={saleOpen}
          closedLabel={booking.closedLabel}
          holdMinutes={offer.holdMinutes}
          activeHold={booking.sheetHold}
          redirecting={booking.redirecting}
          announcement={booking.announcement}
          mock={false}
          onClaim={booking.claim}
          onTryAgain={booking.tryAgain}
          regularHref={regularHref}
          closeLabel="Back to tour"
        />
      )}
    </TourSaleContext.Provider>
  );
}

const ctaLabel = (sale: TourSale) => (sale.isMine ? "View my held slots" : "Reserve now with Black Friday discount");

const CTA_CLASS =
  "inline-flex w-full items-center justify-center rounded-full bg-crimson-red px-6 py-3.5 text-center font-body font-bold text-white shadow-small transition-all hover:bg-light-red hover:shadow-medium";

/** Black Friday price line for this tour, from the live next free slot. */
function SalePrice({ sale }: { sale: TourSale }) {
  const price = sale.availability?.nextPrice ?? null;
  if (price === null) return null;
  return (
    <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 tabular-nums">
      <span className="font-body text-b4-desktop text-dark-gray">Now from</span>
      <span className="font-display text-h3-mobile leading-none text-midnight md:text-h3-desktop">
        {formatGBP(price)}
      </span>
      {sale.tour.originalPrice > price && (
        <span className="font-body text-b2-mobile text-dark-gray line-through">
          <span className="sr-only">was </span>
          {formatGBP(sale.tour.originalPrice)}
        </span>
      )}
    </div>
  );
}

function SaleTag() {
  return (
    <span className="inline-block rounded-sm bg-crimson-red px-2 py-0.5 font-sans text-xs font-bold uppercase tracking-widest text-white">
      Black Friday Sale
    </span>
  );
}

/**
 * The announcement near the top of the tour page. On phones the booking card
 * sits far below it, so while slots are free it can start the hold itself.
 */
export function TourSaleAnnouncement() {
  const sale = useContext(TourSaleContext);
  if (!sale) return null;

  const message = sale.upcomingLabel
    ? `This tour is in our Black Friday Sale. ${sale.upcomingLabel.replace(/^Starts/, "Opens")}.`
    : sale.bookable
      ? `This tour is in our Black Friday Sale. ${availabilityLine(sale.availability)}.`
      : sale.soldOut
        ? `0 of ${sale.availability?.slots.length ?? 0} sale places left. Black Friday slots for this tour are sold out.`
        : "Black Friday slots for this tour are all on hold. They may free up soon.";

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <SaleTag />
        <p className="mt-2 font-body text-b4-mobile font-medium text-midnight md:text-b4-desktop">{message}</p>
      </div>
      {sale.bookable && (
        <button
          type="button"
          onClick={sale.open}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-crimson-red px-5 py-2.5 font-body text-b4-desktop font-bold text-white transition-colors hover:bg-light-red lg:hidden"
        >
          {ctaLabel(sale)}
        </button>
      )}
    </div>
  );
}

/** The card's regular price. Hidden while the sale's price is the one on offer. */
export function TourRegularPrice({ children }: { children: ReactNode }) {
  const sale = useContext(TourSaleContext);
  return sale?.bookable ? null : children;
}

/**
 * The booking card's call to action. While sale slots are free the sale takes
 * over; otherwise `children` (the regular Reserve Now) stays, with a note.
 */
export function TourSaleCta({ children }: { children: ReactNode }) {
  const sale = useContext(TourSaleContext);
  if (!sale) return children;

  if (sale.bookable) {
    return (
      <div>
        <SaleTag />
        <SalePrice sale={sale} />
        <p className="mt-2 font-body text-b4-mobile font-medium text-midnight tabular-nums md:text-b4-desktop">
          {availabilityLine(sale.availability)}
        </p>
        {sale.tour.pricesVary && (
          <p className="mt-1 font-body text-b4-mobile text-dark-gray">Prices vary by date</p>
        )}
        <button type="button" onClick={sale.open} className={`mt-4 ${CTA_CLASS}`}>
          {ctaLabel(sale)}
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-center font-body text-b4-mobile font-medium text-midnight md:text-b4-desktop">
        {sale.upcomingLabel
          ? `Black Friday Sale ${sale.upcomingLabel.replace(/^Starts/, "opens")}`
          : sale.soldOut
            ? "Black Friday slots are sold out"
            : "Black Friday slots are all on hold"}
      </p>
      {children}
    </div>
  );
}

/**
 * A travel date link: opens the Hold sheet while sale slots are free. A date left
 * out of the sale stays a regular link to the form, with a tag saying so.
 */
export function TourSaleDateLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  const sale = useContext(TourSaleContext);
  const date = href.match(/[?&]tourdate=(\d{4}-\d{2}-\d{2})/)?.[1];
  const notInSale = !!date && !!sale?.tour.excludedDates?.includes(date);
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!sale?.bookable || notInSale) return;
    e.preventDefault();
    sale.open();
  };
  return (
    <>
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {children}
      </a>
      {notInSale && (
        <span className="inline-flex items-center rounded-full bg-light-grey px-2 py-0.5 font-body text-b4-mobile font-medium text-dark-gray md:text-b4-desktop">
          Not in sale
        </span>
      )}
    </>
  );
}
