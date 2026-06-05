/**
 * Firestore-backed tour registry.
 *
 * Exposes the same public API as `data/tours.ts` so all consumers can swap
 * the import with minimal churn — but functions are now async (they fetch
 * from Firestore) rather than returning static in-memory data.
 *
 * Caching strategy
 * ────────────────
 * `fetchAllActiveTours()` is wrapped in React `cache()` so a single Firestore
 * read serves the entire build / request, regardless of how many route segments
 * call it.  ISR `revalidate` in each page segment controls how often the cache
 * is invalidated between deploys.
 *
 * Environment
 * ───────────
 * Requires `FIREBASE_SERVICE_ACCOUNT` (base-64 service-account JSON) to be set.
 * See `lib/firebase-admin.ts` for details.
 */

import { cache } from "react";
import { adminDb } from "@/lib/firebase-admin";
import type {
  Tour,
  TourTag,
  TourKeyFact,
  TourIncludedItem,
  TourHighlight,
  TourDay,
  TourDayDetail,
  TourAccommodation,
  TourFaq,
  TourThingToKnow,
  TourTip,
  TourRelated,
  TourBookingCard,
} from "@/types/tour";

// ─── Constants ──────────────────────────────────────────────────────────────

const TOURS_COLLECTION = "tourPackages";
const FALLBACK_IMAGE = "/figma/tour-philippines-sunrise.png";

const CURRENCY_SYMBOL: Record<string, string> = {
  GBP: "£",
  USD: "$",
  EUR: "€",
  PHP: "₱",
};

/** Slugs for tours led by resident hosts (shown on /hosted-tours). */
export const HOSTED_TOUR_SLUGS = [
  "india-holi-festival-tour",
  "danielleerintanzania",
  "philippine-sunset-with-jess",
  "philippine-sunset-with-roxana",
];


// ─── Firestore document shape (raw) ─────────────────────────────────────────
// We use `any` / unknown here because Firestore documents arrive untyped.

type RawDoc = Record<string, any>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toTitleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}


function priceParts(pricing: RawDoc | undefined): {
  currency: string;
  amount: string;
} {
  if (!pricing) return { currency: "", amount: "" };
  const amount =
    pricing.discounted && pricing.discounted > 0
      ? pricing.discounted
      : pricing.original;
  const symbol = CURRENCY_SYMBOL[pricing.currency] ?? "";
  return {
    currency: pricing.currency ?? "",
    amount: amount != null ? `${symbol}${amount.toLocaleString()}` : "",
  };
}

function priceLabel(pricing: RawDoc | undefined): string {
  const { currency, amount } = priceParts(pricing);
  return `${currency} ${amount}`.trim();
}

function formatDateRange(td: RawDoc): string | null {
  const start = td?.startDate?.toDate?.();
  const end = td?.endDate?.toDate?.();
  if (!start || !end) return null;
  const fmt = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

// ─── Transformer ─────────────────────────────────────────────────────────────

function toTour(raw: RawDoc): Tour {
  const details: RawDoc = raw.details ?? {};

  // ── Tags ─────────────────────────────────────────────────────────────────
  let tags: TourTag[];
  if (Array.isArray(details.tags) && details.tags.length) {
    tags = details.tags.map((tag: unknown) => {
      if (typeof tag === "string") return { label: tag, icon: "location" as const };
      const t = tag as { label?: string; icon?: string };
      return { label: t.label ?? "", icon: (t.icon as TourTag["icon"]) ?? "location" };
    });
  } else {
    const places: string[] = [];
    if (Array.isArray(raw.destinations)) places.push(...raw.destinations.slice(0, 3));
    const seen = new Set<string>();
    tags = places
      .filter((p) => {
        const k = p.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, 4)
      .map((label) => ({ label, icon: "location" as const }));
  }

  // ── Key Facts ─────────────────────────────────────────────────────────────
  const keyFacts: TourKeyFact[] = [];

  const dateValues = (raw.travelDates ?? [])
    .filter((d: RawDoc) => d.isAvailable !== false)
    .map(formatDateRange)
    .filter(Boolean)
    .slice(0, 3);
  if (dateValues.length) {
    keyFacts.push({ icon: "days", label: "Tour Dates", values: dateValues });
  }
  // Use stored keyFacts (admin-edited) when available; fall back to derived
  if (Array.isArray(details.keyFacts) && details.keyFacts.length > 0) {
    keyFacts.push(...details.keyFacts);
  } else {
    if (raw.duration) {
      keyFacts.push({ icon: "days", label: "Duration", values: [raw.duration] });
    }
  }

  // ── Trip Highlights ───────────────────────────────────────────────────────
  const highlightItems: TourHighlight[] = (details.highlights ?? [])
    .filter((h: RawDoc) => typeof h === "object" && h.image && h.text)
    .map((h: RawDoc) => ({
      image: h.image as string,
      imageAlt: h.text as string,
      title: h.text as string,
      subtitle: (h.subtitle as string) ?? "",
    }));
  const tripHighlights =
    highlightItems.length
      ? { heading: "Trip Highlights", items: highlightItems }
      : undefined;

  // ── What's Included ───────────────────────────────────────────────────────
  let whatsIncluded: Tour["whatsIncluded"];
  if (Array.isArray(details.inclusions) && details.inclusions.length) {
    whatsIncluded = {
      heading: "What's Included",
      items: (details.inclusions as RawDoc[]).map(
        (item): TourIncludedItem => ({
          icon: item.icon ?? "plus",
          label: item.label ?? "",
          value: item.value ?? "",
        }),
      ),
    };
  }

  // ── Itinerary ─────────────────────────────────────────────────────────────
  const days: TourDay[] = (details.itinerary ?? []).map(
    (d: RawDoc, i: number): TourDay => {
      const dayDetails: TourDayDetail[] = [];
      if (Array.isArray(d.details) && d.details.length > 0) {
        dayDetails.push(...(d.details as RawDoc[]).map((det) => ({
          icon: (det.icon ?? "activities") as TourDayDetail["icon"],
          label: det.label ?? "",
          value: det.value ?? "",
        })));
      } else {
        if (d.accommodation) {
          dayDetails.push({ icon: "accommodation", label: "Accommodation", value: d.accommodation });
        }
        if (d.activities) {
          dayDetails.push({ icon: "activities", label: "Activity", value: d.activities });
        }
        if (d.meals) {
          dayDetails.push({ icon: "meals", label: "Meals", value: d.meals });
        }
      }

      const day: TourDay = {
        dayNumber: d.day ?? i + 1,
        title: d.title ?? "",
        description: d.description ?? "",
        details: dayDetails,
      };
      if (d.image) {
        day.image = d.image;
        day.imageAlt = d.title ?? "";
      }
      return day;
    },
  );

  const itinerary: Tour["itinerary"] = {
    heading: "Itinerary",
    downloadLabel: "Download Itinerary",
    downloadHref: raw.brochureLink || "#",
    days,
  };

  // ── Where We Stay ─────────────────────────────────────────────────────────
  let whereWeStay: Tour["whereWeStay"];
  if (Array.isArray(details.accommodations) && details.accommodations.length) {
    whereWeStay = {
      heading: "Where we stay",
      items: (details.accommodations as RawDoc[]).map(
        (item): TourAccommodation => ({
          image: item.image ?? FALLBACK_IMAGE,
          imageAlt: item.name ?? "",
          name: item.name ?? "",
          nights: item.nights ?? "",
        }),
      ),
    };
  }

  // ── FAQs ──────────────────────────────────────────────────────────────────
  let faqs: Tour["faqs"];
  if (Array.isArray(details.faqs) && details.faqs.length) {
    faqs = {
      heading: "FAQs",
      items: (details.faqs as RawDoc[]).map(
        (item): TourFaq => ({
          question: item.question ?? "",
          answer: item.answer ?? "",
        }),
      ),
    };
  }

  // ── Things to Know ────────────────────────────────────────────────────────
  let thingsToKnow: Tour["thingsToKnow"];
  if (Array.isArray(details.thingsToKnow) && details.thingsToKnow.length) {
    thingsToKnow = {
      heading: "Things to know",
      items: (details.thingsToKnow as RawDoc[]).map(
        (item): TourThingToKnow => ({
          icon: item.icon ?? "info",
          title: item.title ?? "",
          description: item.description ?? "",
          ctaLabel: item.ctaLabel ?? "",
          ctaHref: item.ctaHref ?? "#",
        }),
      ),
    };
  } else {
    thingsToKnow = { heading: "Things to know", items: [] };
  }

  // ── Tips ──────────────────────────────────────────────────────────────────
  let tips: Tour["tips"];
  if (Array.isArray(details.tips) && details.tips.length) {
    tips = {
      heading: "Tips",
      items: (details.tips as RawDoc[]).map(
        (item): TourTip => ({
          icon: item.icon ?? "sun",
          title: item.title ?? "",
          description: item.description ?? "",
        }),
      ),
    };
  } else {
    tips = { heading: "Tips", items: [] };
  }

  // ── Map ───────────────────────────────────────────────────────────────────
  let map: Tour["map"];
  if (details.map && (details.map.image || details.map.embedUrl)) {
    map = {
      heading: "Map",
      image: details.map.image ?? FALLBACK_IMAGE,
      imageAlt: raw.name ?? "",
      embedUrl: details.map.embedUrl,
    };
  }

  // ── Booking Card ──────────────────────────────────────────────────────────
  const { currency, amount } = priceParts(raw.pricing);
  const symbol = CURRENCY_SYMBOL[raw.pricing?.currency] ?? "";
  const deposit = raw.pricing?.deposit;
  const booking: TourBookingCard = {
    durationLabel: raw.cardHeaderTitle ?? "",
    routeLabel: raw.cardSubHeader || "",
    priceFromLabel: "From",
    priceCurrency: currency,
    priceAmount: amount,
    depositAmount:
      deposit && deposit > 0 ? `${symbol}${deposit.toLocaleString()}` : undefined,
    depositNote: raw.depositNote,
    ctaLabel: "Reserve Now",
    ctaHref: raw.stripePaymentLink || "/contact-us",
    footnote: raw.footnote ?? "Additional fees may apply",
  };

  // ── Gallery ───────────────────────────────────────────────────────────────
  const heroImage = raw.media?.coverImage || FALLBACK_IMAGE;
  const galleryImages: string[] = Array.isArray(raw.media?.gallery)
    ? (raw.media.gallery as string[])
    : [];

  // ── SEO ───────────────────────────────────────────────────────────────────
  const seoTitle =
    raw.seo?.title ?? `${raw.name} — I'm Here Travels`;
  const seoDescription =
    raw.seo?.description ?? (raw.description ?? "").slice(0, 200);

  return {
    slug: raw.slug ?? "",
    name: raw.name ?? "",
    bookingSlug: raw.bookingSlug,
    comingSoon: raw.comingSoon ?? false,
    meta: { title: seoTitle, description: seoDescription },
    gallery: {
      hero: heroImage,
      heroAlt: raw.name ?? "",
      thumbnails: galleryImages.map((src, i) => ({
        src,
        alt: `${raw.name ?? ""} photo ${i + 1}`,
      })),
    },
    header: {
      title: raw.duration ? `${toTitleCase(raw.duration)} | ${raw.name}` : (raw.name ?? ""),
      tags,
      description: raw.description ?? "",
    },
    keyFacts,
    whatsIncluded,
    tripHighlights,
    map,
    itinerary,
    whereWeStay,
    faqs,
    thingsToKnow,
    tips,
    booking,
    listingCard: {
      duration: raw.duration ? toTitleCase(raw.duration) : "",
      description: (raw.description ?? "").slice(0, 160),
      price: priceLabel(raw.pricing),
      image: heroImage,
      imageAlt: raw.name ?? "",
    },
  };
}

// ─── Related tours (same logic as data/tours.ts) ─────────────────────────────

function attachRelatedTours(registry: Record<string, Tour>): Record<string, Tour> {
  const slugs = Object.keys(registry);
  for (const slug of slugs) {
    const tour = registry[slug];
    if (tour?.relatedTours) continue;
    if (slugs.length < 2) continue;
    const start = slugs.indexOf(slug);
    const picks = Array.from(
      { length: Math.min(3, slugs.length - 1) },
      (_, i) => {
        let idx = (start + 1 + i) % slugs.length;
        if (slugs[idx] === slug) idx = (idx + 1) % slugs.length;
        return slugs[idx];
      },
    );
    const items: TourRelated[] = picks.map((s) => {
      const other = registry[s]!;
      return {
        slug: other.slug,
        image: other.gallery.hero,
        imageAlt: other.gallery.heroAlt,
        duration: other.listingCard.duration,
        title: other.listingCard.duration
          ? other.header.title.split("|").slice(-1)[0]!.trim()
          : other.header.title,
        description: other.listingCard.description,
        priceFromLabel: "From",
        priceCurrency: other.booking.priceCurrency,
        priceAmount: other.booking.priceAmount,
      };
    });
    registry[slug] = {
      ...tour,
      relatedTours: { heading: "You might also like", items },
    };
  }
  return registry;
}

// ─── Firestore fetch (cached per request/build) ───────────────────────────────

const fetchAllActiveTours = cache(async (): Promise<Tour[]> => {
  const snap = await adminDb
    .collection(TOURS_COLLECTION)
    .where("status", "==", "active")
    .get();

  const rawTours = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RawDoc));
  const tours = rawTours.map(toTour);
  const registry = attachRelatedTours(
    Object.fromEntries(tours.map((t) => [t.slug, t])),
  );
  return Object.values(registry);
});

// ─── Public API (mirrors data/tours.ts) ──────────────────────────────────────

export async function getAllTours(): Promise<Tour[]> {
  return fetchAllActiveTours();
}

export async function getTourBySlug(slug: string): Promise<Tour | undefined> {
  const tours = await fetchAllActiveTours();
  return tours.find((t) => t.slug === slug);
}

export async function getAllTourSlugs(): Promise<string[]> {
  const tours = await fetchAllActiveTours();
  return tours.map((t) => t.slug);
}

export async function getHostedTours(): Promise<Tour[]> {
  const tours = await fetchAllActiveTours();
  return HOSTED_TOUR_SLUGS.map((s) => tours.find((t) => t.slug === s)).filter(
    (t): t is Tour => t !== undefined,
  );
}

export function isHostedTour(slug: string): boolean {
  return HOSTED_TOUR_SLUGS.includes(slug);
}
