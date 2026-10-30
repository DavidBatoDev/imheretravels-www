import { ArrowDown } from "lucide-react";
import type { SalePhase } from "@/lib/sale/ladder";
import { formatGBP } from "@/lib/sale/ladder";
import StartCountdown from "./StartCountdown";

/**
 * Midnight band with the sale headline. Text sits beside (desktop) or above
 * (phone) the banner, never on top of it, so it stays legible whatever the
 * artwork. The banner uses art direction: `mobileBannerUrl` under 768px.
 */
export default function SaleHero({
  title,
  subtitle,
  statusText,
  phase,
  upTo,
  bannerUrl,
  mobileBannerUrl,
  fallbackImage,
  showCta = true,
  startAt,
}: {
  title: string;
  subtitle: string;
  statusText: string;
  phase: SalePhase;
  /** Biggest single-slot saving, for "Up to £X off" (0 hides it). */
  upTo: number;
  bannerUrl?: string;
  mobileBannerUrl?: string;
  fallbackImage?: string;
  showCta?: boolean;
  /** Shown as a countdown while the sale is upcoming. */
  startAt?: string | null;
}) {
  const desktopSrc = bannerUrl || mobileBannerUrl || fallbackImage;
  const mobileSrc = mobileBannerUrl || bannerUrl || fallbackImage;
  const live = phase === "live";

  return (
    <section aria-labelledby="sale-hero-title" className="relative overflow-hidden bg-midnight text-white">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-crimson-red" />
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-10 pt-8 md:grid-cols-2 md:items-center md:gap-12 md:px-8 md:py-16 lg:py-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 font-body text-b4-mobile font-medium md:text-b4-desktop">
            <span className="relative flex size-2.5" aria-hidden="true">
              {live && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-light-red opacity-75 motion-reduce:hidden" />
              )}
              <span className={`relative inline-flex size-2.5 rounded-full ${live ? "bg-light-red" : "bg-grey"}`} />
            </span>
            {statusText}
          </p>

          <h1
            id="sale-hero-title"
            className="mt-5 font-display text-h1-mobile md:text-h1-desktop lg:text-[3.5rem] lg:leading-[1.1]"
          >
            {title}
          </h1>

          {upTo > 0 && (
            <p className="mt-2 font-display text-h3-mobile text-light-red tabular-nums md:text-h3-desktop">
              Up to {formatGBP(upTo)} off
            </p>
          )}

          {subtitle && (
            <p className="mt-4 max-w-xl font-body text-b2-mobile text-white/85 md:text-b2-desktop">
              {subtitle}
            </p>
          )}

          {phase === "upcoming" && startAt && <StartCountdown startAt={startAt} />}

          {showCta && (
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#deals"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-crimson-red px-8 py-3.5 font-body font-bold text-white shadow-small transition-colors hover:bg-light-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                See the deals
                <ArrowDown className="size-4" strokeWidth={2.5} aria-hidden="true" />
              </a>
              <p className="font-body text-b4-mobile text-white/75 md:text-b4-desktop">
                {live ? "Pay just the reservation fee today." : "Pay just the reservation fee when it opens."}
              </p>
            </div>
          )}
        </div>

        {desktopSrc && (
          // Without real sale artwork the fallback (a tour cover) only shows from
          // md up — on phones it would just repeat the first card's photo.
          <div
            className={`relative overflow-hidden rounded-lg bg-white/5 ${bannerUrl || mobileBannerUrl ? "" : "hidden md:block"}`}
          >
            <picture>
              {mobileSrc && mobileSrc !== desktopSrc && (
                <source media="(max-width: 767px)" srcSet={mobileSrc} />
              )}
              <img
                src={desktopSrc}
                alt=""
                fetchPriority="high"
                decoding="async"
                className="aspect-[4/3] w-full object-cover md:aspect-[5/4]"
              />
            </picture>
          </div>
        )}
      </div>
    </section>
  );
}
