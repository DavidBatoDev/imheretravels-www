"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, UserRound } from "lucide-react";
import InquireButton from "@/app/components/inquiry/InquireButton";
import ImageWithSkeleton from "@/app/components/global/ImageWithSkeleton";
import {
  availabilityLine,
  formatDateRange,
  formatGBP,
  isSoldOut,
  onHoldLine,
  savingLabel,
} from "@/lib/sale/ladder";
import type { PublicSlot, PublicTourAvailability, SalePageTour } from "@/lib/sale/types";

/**
 * How many of the tour's sale places are left, one segment per place (a tour
 * can have up to 20). Free places are crimson, places on hold are amber and
 * taken places fade out, in ladder order, so "slot 1 sold" reads at a glance.
 * Purely visual: the sentence next to it carries the same information.
 */
/** Sale dates listed on a card before the rest collapse into "+N more". */
const CARD_DATES_SHOWN = 3;

/**
 * The travel dates this sale applies to, soonest first. Dates left out of the
 * sale are not listed here; the claim sheet shows them at the regular price.
 */
function SaleDates({ dates }: { dates: SalePageTour["dates"] }) {
  const onSale = (dates ?? []).filter((d) => d.onSale);
  if (onSale.length === 0) return null;
  const shown = onSale.slice(0, CARD_DATES_SHOWN);
  const more = onSale.length - shown.length;
  return (
    <div className="mt-3 flex items-start gap-1.5 font-body text-b4-mobile text-midnight md:text-b4-desktop">
      <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-crimson-red" strokeWidth={2.25} aria-hidden="true" />
      <div>
        <span className="sr-only">{onSale.length === 1 ? "Tour date: " : "Tour dates: "}</span>
        <ul className="tabular-nums">
          {shown.map((d) => (
            <li key={d.date} className="font-medium">
              {formatDateRange(d.date, d.endDate)}
            </li>
          ))}
        </ul>
        {more > 0 && (
          <p className="text-dark-gray">
            +{more} more {more === 1 ? "date" : "dates"}
          </p>
        )}
      </div>
    </div>
  );
}

function PlacesBar({ slots }: { slots: PublicSlot[] }) {
  return (
    <div aria-hidden="true" className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
      {slots.map((s) => (
        <span
          key={s.index}
          className={`h-full flex-1 ${
            s.state === "sold"
              ? "bg-midnight/25"
              : s.state === "on_hold"
                ? "bg-sunglow-yellow"
                : "bg-crimson-red"
          }`}
        />
      ))}
    </div>
  );
}

export default function SaleTourCard({
  tour,
  availability,
  saleOpen,
  closedLabel,
  isMine,
  priority,
  onHold,
}: {
  tour: SalePageTour;
  availability: PublicTourAvailability | undefined;
  saleOpen: boolean;
  /** CTA label when the sale isn't taking holds ("Sale paused", "Preview only"…). */
  closedLabel: string;
  /** The visitor holds slots on this tour right now. */
  isMine: boolean;
  priority: boolean;
  onHold: (trigger: HTMLButtonElement) => void;
}) {
  const soldOut = isSoldOut(availability);
  const allHeld = !!availability && !soldOut && availability.left === 0;
  const nextSlot = availability?.slots.find((s) => s.state === "available");
  const nextUnsold = availability?.slots.find((s) => s.state !== "sold");
  // Price a new booking gets; when every free place is on hold, the price of
  // the next one that could free up (sold-out cards show the original only).
  const fromPrice = availability?.nextPrice ?? nextUnsold?.salePrice ?? null;
  // Tiered: slots are sold cheapest first, so the next free slot carries the
  // biggest saving still on offer — hence "up to". Percent: every slot saves
  // the same %, so it's just "Save 20%".
  const savingSlot = nextSlot ?? nextUnsold;
  const saving = savingSlot?.discountGBP ?? 0;
  const savingPct = savingSlot?.discountPct ?? null;
  const heldNote = onHoldLine(availability);
  // Draft tours can be on sale but have no public tour page to link to.
  const detailsHref = tour.hasDetailsPage && tour.tourSlug ? `/tours/${tour.tourSlug}` : undefined;
  const headingId = `sale-tour-${tour.tourPackageId}`;
  const hasSlots = !!availability && availability.slots.length > 0;

  let cta: { label: string; enabled: boolean };
  if (isMine) cta = { label: "My held slots", enabled: true };
  else if (soldOut) cta = { label: "Sold out", enabled: false };
  else if (!saleOpen) cta = { label: closedLabel, enabled: false };
  else if (allHeld) cta = { label: "All on hold", enabled: false };
  else if (!hasSlots) cta = { label: "Coming soon", enabled: false };
  else cta = { label: "Reserve now", enabled: true };

  const btn =
    "inline-flex min-h-12 items-center justify-center rounded-full px-5 py-3 text-center font-body font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-red";

  return (
    <article
      aria-labelledby={headingId}
      className={`flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-small transition-shadow hover:shadow-medium ${soldOut ? "opacity-75" : ""}`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-light-grey">
        {/* The photo opens the tour too; one link per card for keyboard and
            screen-reader users is the title, so this one is skipped by both. */}
        {detailsHref && (
          <Link href={detailsHref} tabIndex={-1} aria-hidden="true" className="absolute inset-0 z-[1]" />
        )}
        <ImageWithSkeleton
          src={tour.coverImage}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover ${soldOut ? "grayscale" : ""}`}
        />
        <div className="pointer-events-none absolute left-3 top-3 z-[2] flex flex-wrap gap-2">
          {soldOut ? (
            <span className="inline-flex items-center rounded-full bg-midnight px-3 py-1.5 font-body text-b4-mobile font-bold text-white md:text-b4-desktop">
              Sold out
            </span>
          ) : savingSlot && (savingPct || saving > 0) ? (
            <span className="inline-flex items-center rounded-full bg-crimson-red px-3 py-1.5 font-body text-b4-mobile font-bold text-white tabular-nums md:text-b4-desktop">
              {savingPct ? `Save ${savingLabel(savingSlot)}` : `Save up to ${formatGBP(saving)}`}
            </span>
          ) : null}
          {isMine && (
            <span className="inline-flex items-center rounded-full bg-sunglow-yellow px-3 py-1.5 font-body text-b4-mobile font-bold text-midnight md:text-b4-desktop">
              Held for you
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 md:p-6">
        {tour.durationLabel && (
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-light-grey px-3 py-1 font-body text-b4-desktop text-midnight">
            <Image src="/Icons/SVG/Pin/pin-solid-red.svg" alt="" width={14} height={14} />
            {tour.durationLabel}
          </span>
        )}
        <h3 id={headingId} className="mt-3 font-sans text-h5-mobile text-midnight md:text-h5-desktop">
          {detailsHref ? (
            <Link href={detailsHref} className="transition-colors hover:text-crimson-red">
              {tour.displayName}
            </Link>
          ) : (
            tour.displayName
          )}
        </h3>
        {tour.routeLabel && tour.routeLabel.trim().toLowerCase() !== tour.displayName.trim().toLowerCase() && (
          <p className="mt-1 line-clamp-2 font-body text-b4-mobile text-dark-gray md:text-b4-desktop">
            {tour.routeLabel}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 tabular-nums">
          {fromPrice !== null && !soldOut ? (
            <>
              <span className="font-body text-b4-desktop text-dark-gray">
                {availability?.nextPrice != null ? "Now from" : "From"}
              </span>
              <span className="font-display text-h4-mobile leading-none text-midnight md:text-h4-desktop">
                {formatGBP(fromPrice)}
              </span>
              {tour.originalPrice > fromPrice && (
                <span className="font-body text-b2-mobile text-dark-gray line-through md:text-b2-desktop">
                  <span className="sr-only">was </span>
                  {formatGBP(tour.originalPrice)}
                </span>
              )}
            </>
          ) : (
            <span className="font-body text-b2-mobile text-dark-gray md:text-b2-desktop">
              Usually {formatGBP(tour.originalPrice)}
            </span>
          )}
        </div>
        <p className="mt-1 font-body text-b4-mobile text-dark-gray md:text-b4-desktop">
          per person{tour.pricesVary && " · Prices vary by date"}
        </p>
        <SaleDates dates={tour.dates} />

        {hasSlots && (
          <div className="mt-4">
            <PlacesBar slots={availability!.slots} />
            <p className="mt-2 font-body text-b4-mobile font-medium text-midnight tabular-nums md:text-b4-desktop">
              {availabilityLine(availability)}
            </p>
            {heldNote && (
              <p className="font-body text-b4-mobile text-dark-gray md:text-b4-desktop">{heldNote}</p>
            )}
          </div>
        )}

        <p className="mt-3 flex items-center gap-1.5 font-body text-b4-mobile text-dark-gray md:text-b4-desktop">
          <UserRound className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
          {savingPct ? `1 slot = 1 person · ${savingPct}% off every slot` : "1 slot = 1 person · earlier slots cost less"}
        </p>

        <div className="mt-auto flex gap-2 pt-5">
          <button
            type="button"
            disabled={!cta.enabled}
            onClick={(e) => onHold(e.currentTarget)}
            aria-describedby={headingId}
            className={`${btn} flex-1 ${
              cta.enabled
                ? isMine
                  ? "bg-midnight text-white hover:bg-dark-gray"
                  : "bg-crimson-red text-white shadow-small hover:bg-light-red"
                : "cursor-not-allowed bg-light-grey text-dark-gray"
            }`}
          >
            {cta.label}
          </button>
          <InquireButton
            tourName={tour.displayName}
            tourSlug={tour.tourSlug || undefined}
            location="sale_card"
            className={`${btn} flex-1 border-2 border-crimson-red bg-white text-crimson-red hover:bg-crimson-red hover:text-white`}
          />
        </div>
        {detailsHref && (
          <Link
            href={detailsHref}
            aria-describedby={headingId}
            className="mt-3 inline-flex min-h-11 items-center justify-center gap-1.5 self-center font-body text-b4-desktop font-bold text-midnight underline underline-offset-4 transition-colors hover:text-crimson-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-red"
          >
            View tour details
            <ArrowRight className="size-4" strokeWidth={2.25} aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
}
