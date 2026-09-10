"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import Reveal from "@/app/components/global/Reveal";
import ImageWithSkeleton from "@/app/components/global/ImageWithSkeleton";
import type { Host } from "@/data/hosts";

import "swiper/css";

type Trip = Host["upcomingTrips"][number];

/**
 * Upcoming-trip cards for a resident host.
 *
 * Up to three trips render as the original static grid; beyond that they become
 * a swipeable rail so a host with a growing roster doesn't push the rest of the
 * page down. The order is decided upstream (newest hosted tour first).
 */
function TripCard({
  trip,
  as_,
  delay,
}: {
  trip: Trip;
  as_: "li" | "div";
  delay: number;
}) {

          const isTBA = !trip.duration;
          const inner = (
            <>
              {/* Image */}
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                {trip.image ? (
                  <ImageWithSkeleton
                    src={trip.image}
                    alt={trip.imageAlt ?? trip.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className={`object-cover transition-transform duration-300 group-hover:scale-105 ${isTBA ? "brightness-75" : ""}`}
                  />
                ) : (
                  <div className="absolute inset-0 bg-grey/20" />
                )}
                {/* Duration / Coming Soon pill — overlaid on image */}
                <div className="absolute bottom-3 left-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-body text-b4-desktop backdrop-blur-sm ${isTBA ? "bg-midnight/60 text-white/80" : "bg-white/90 text-midnight shadow-xxsmall"}`}>
                    <Image src="/Icons/SVG/Pin/pin-solid-red.svg" alt="" width={12} height={12} />
                    {isTBA ? "Coming Soon" : trip.duration}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-5 md:p-6">
                <h3 className={`font-sans text-h5-mobile md:text-h5-desktop transition-colors ${isTBA ? "text-dark-gray" : "text-midnight group-hover:text-crimson-red"}`}>
                  {trip.name}
                </h3>
                {trip.description && (
                  <p className="mt-2 line-clamp-2 font-body text-b4-mobile md:text-b4-desktop text-dark-gray">
                    {trip.description}
                  </p>
                )}

                {/* Footer */}
                <div className="mt-auto pt-5 flex items-end justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    {!isTBA && trip.dates && trip.dates !== "TBA" && (
                      <span className="font-body text-b4-desktop text-dark-gray">
                        {trip.dates}
                      </span>
                    )}
                    {trip.price ? (
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-body text-b4-desktop text-dark-gray">From</span>
                          <span className="font-sans text-h6-mobile md:text-h6-desktop text-midnight">
                            {trip.price}
                          </span>
                        </div>
                        {trip.priceNote && (
                          <p className="mt-0.5 font-body text-b4-mobile text-grey">
                            *{trip.priceNote}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="font-body text-b4-desktop text-grey italic">Dates &amp; pricing TBA</span>
                    )}
                  </div>

                  {trip.tourSlug && !isTBA && (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-crimson-red px-4 py-2 font-body text-b4-desktop font-medium text-white transition-colors group-hover:bg-light-red">
                      View Tour
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mt-px"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  )}
                </div>
              </div>
            </>
          );

          return (
            <Reveal as={as_} delay={delay}>
              {trip.tourSlug ? (
                <Link
                  href={`/tours/${trip.tourSlug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-small transition-shadow hover:shadow-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson-red"
                >
                  {inner}
                </Link>
              ) : (
                <div className="group flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-small">
                  {inner}
                </div>
              )}
            </Reveal>
          );
}

function NavButton({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={direction === "left" ? "Previous trips" : "Next trips"}
      onClick={onClick}
      className="flex size-10 shrink-0 items-center justify-center rounded-full border border-grey text-midnight transition-colors hover:border-midnight hover:bg-midnight hover:text-white"
    >
      {direction === "left" ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export default function UpcomingTripsList({ trips }: { trips: Trip[] }) {
  const swiperRef = useRef<SwiperType | null>(null);
  const isCarousel = trips.length > 3;

  // Duplicate names are possible across placeholder cards; fall back to index.
  const keys = useMemo(
    () => trips.map((t, i) => `${t.tourId ?? t.tourSlug ?? t.name}-${i}`),
    [trips],
  );

  if (!isCarousel) {
    return (
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {trips.map((trip, i) => (
          <TripCard key={keys[i]} trip={trip} as_="li" delay={i * 80} />
        ))}
      </ul>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-center gap-2 md:justify-end">
        <NavButton direction="left" onClick={() => swiperRef.current?.slidePrev()} />
        <NavButton direction="right" onClick={() => swiperRef.current?.slideNext()} />
      </div>
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        allowTouchMove
        slidesPerView="auto"
        spaceBetween={24}
        className="overflow-hidden! [&_.swiper-wrapper]:items-stretch"
      >
        {trips.map((trip, i) => (
          <SwiperSlide
            key={keys[i]}
            style={{ width: "min(88vw, 380px)", flexShrink: 0, height: "auto" }}
          >
            <TripCard trip={trip} as_="div" delay={0} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
