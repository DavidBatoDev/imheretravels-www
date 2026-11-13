"use client";

import { useEffect, useRef, useState } from "react";
import InquireButton from "@/app/components/inquiry/InquireButton";
import { formatGBP } from "@/lib/sale/ladder";
import type { Tour } from "@/types/tour";
import { salePercent, useTourSale } from "./TourSale";

/** Pixels of scroll to ignore, so a jittery thumb doesn't flicker the bar. */
const JITTER = 6;
/** The bar stays out of the way over the page title and its own sale button. */
const SHOW_AFTER = 320;

const BTN =
  "inline-flex min-h-12 flex-1 items-center justify-center rounded-full px-4 py-2.5 text-center font-body text-b2-mobile font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-red";

/**
 * Phones and tablets only: a bar fixed to the bottom of the tour page with the
 * price, Reserve now and Inquire now. It slides up while the visitor scrolls
 * down (reading), hides when they scroll up (when the site header comes back),
 * and steps aside while the booking card itself is on screen.
 */
export default function TourMobileBar({
  booking,
  tourName,
  tourSlug,
  cardId,
}: {
  booking: Tour["booking"];
  tourName: string;
  tourSlug: string;
  /** id of the in-page booking card the bar hands over to. */
  cardId: string;
}) {
  const sale = useTourSale();
  const [visible, setVisible] = useState(false);
  const cardInView = useRef(false);

  useEffect(() => {
    let last = window.scrollY;
    let down = false;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      if (Math.abs(y - last) >= JITTER) {
        down = y > last;
        last = y;
      }
      setVisible(down && y > SHOW_AFTER && !cardInView.current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const card = document.getElementById(cardId);
    const observer = card
      ? new IntersectionObserver(([entry]) => {
          cardInView.current = !!entry?.isIntersecting;
          if (cardInView.current) setVisible(false);
        })
      : null;
    if (card) observer!.observe(card);

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer?.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [cardId]);

  const saleLive = !!sale && (sale.bookable || sale.isMine);
  const salePrice = saleLive ? (sale.availability?.nextPrice ?? null) : null;
  const pct = saleLive ? salePercent(sale) : null;
  const isExternal = /^https?:\/\//.test(booking.ctaHref);

  return (
    <div
      inert={!visible}
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-light-grey bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_-6px_rgba(28,31,42,0.18)] transition-transform duration-300 ease-out lg:hidden ${
        visible ? "translate-y-0" : "translate-y-[110%]"
      }`}
    >
      <div className="mx-auto max-w-xl">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 tabular-nums">
          {salePrice !== null ? (
            <>
              <span className="font-body text-b4-mobile text-dark-gray">Now from</span>
              <span className="font-display text-h6-mobile leading-none text-midnight">{formatGBP(salePrice)}</span>
              {sale!.tour.originalPrice > salePrice && (
                <span className="font-body text-b4-desktop text-dark-gray line-through">
                  <span className="sr-only">was </span>
                  {formatGBP(sale!.tour.originalPrice)}
                </span>
              )}
              {pct ? (
                <span className="ml-auto self-center rounded-full bg-crimson-red px-2 py-0.5 font-body text-b4-mobile font-bold text-white">
                  {pct}% off
                </span>
              ) : null}
            </>
          ) : (
            <>
              <span className="font-body text-b4-mobile text-dark-gray">{booking.priceFromLabel}</span>
              <span className="font-display text-h6-mobile leading-none text-midnight">{booking.priceAmount}</span>
            </>
          )}
        </div>
        <div className="mt-2.5 flex gap-2">
          {saleLive ? (
            <button
              type="button"
              onClick={sale!.open}
              className={`${BTN} ${sale!.isMine ? "bg-midnight text-white hover:bg-dark-gray" : "bg-crimson-red text-white hover:bg-light-red"}`}
            >
              {sale!.isMine ? "My held slots" : "Reserve now"}
            </button>
          ) : (
            <a
              href={booking.ctaHref}
              {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={`${BTN} bg-crimson-red text-white hover:bg-light-red`}
            >
              Reserve now
            </a>
          )}
          <InquireButton
            tourName={tourName}
            tourSlug={tourSlug}
            location="tour_mobile_bar"
            className={`${BTN} border-2 border-crimson-red bg-white text-crimson-red hover:bg-crimson-red hover:text-white`}
          />
        </div>
      </div>
    </div>
  );
}
