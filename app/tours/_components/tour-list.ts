import type { Tour } from "@/types/tour";
import type { SortKey } from "./ToursFilterBar";

/**
 * The slice of a tour that listing cards need. The /tours page sends this to
 * the browser instead of whole tours (itineraries, FAQs, galleries...), which
 * keeps the page payload small. A full `Tour` satisfies it too.
 */
export type TourListItem = {
  slug: string;
  header: { title: string };
  listingCard: Tour["listingCard"];
  booking: { priceAmount: string };
};

export function toTourListItem(tour: Tour): TourListItem {
  return {
    slug: tour.slug,
    header: { title: tour.header.title },
    listingCard: tour.listingCard,
    booking: { priceAmount: tour.booking.priceAmount },
  };
}

/** A destination as the /tours filter needs it. */
export type TourListDestination = { slug: string; name: string; tourSlugs: string[] };

export const VALID_SORTS: SortKey[] = [
  "relevant",
  "price-asc",
  "price-desc",
  "duration-asc",
  "duration-desc",
];

function parsePriceGBP(priceAmount: string): number {
  return parseFloat(priceAmount.replace(/[^0-9.]/g, "")) || 0;
}

function parseDurationDays(duration: string): number {
  const m = duration.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

export function sortTours<T extends TourListItem>(tours: T[], sort: SortKey): T[] {
  const s = [...tours];
  switch (sort) {
    case "price-asc":
      return s.sort((a, b) => parsePriceGBP(a.booking.priceAmount) - parsePriceGBP(b.booking.priceAmount));
    case "price-desc":
      return s.sort((a, b) => parsePriceGBP(b.booking.priceAmount) - parsePriceGBP(a.booking.priceAmount));
    case "duration-asc":
      return s.sort(
        (a, b) => parseDurationDays(a.listingCard.duration) - parseDurationDays(b.listingCard.duration),
      );
    case "duration-desc":
      return s.sort(
        (a, b) => parseDurationDays(b.listingCard.duration) - parseDurationDays(a.listingCard.duration),
      );
    default:
      return s; // "relevant" = registry order
  }
}

/**
 * Applies the URL's `destination` and `sort` to the list. Unknown values are
 * ignored, as they were when the server did this.
 */
export function filterAndSortTours<T extends TourListItem>(
  tours: T[],
  destinations: TourListDestination[],
  destination: string | null | undefined,
  sort: string | null | undefined,
): { tours: T[]; destination: string | undefined; sort: SortKey } {
  const dest = destination ? destinations.find((d) => d.slug === destination) : undefined;
  const validSort: SortKey = sort && VALID_SORTS.includes(sort as SortKey) ? (sort as SortKey) : "relevant";
  const filtered = dest ? tours.filter((t) => dest.tourSlugs.includes(t.slug)) : tours;
  return { tours: sortTours(filtered, validSort), destination: dest?.slug, sort: validSort };
}
