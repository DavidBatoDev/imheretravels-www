"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import TourCard from "./TourCard";
import ToursFilterBar from "./ToursFilterBar";
import {
  filterAndSortTours,
  type TourListDestination,
  type TourListItem,
} from "./tour-list";

type Props = {
  tours: TourListItem[];
  destinations: TourListDestination[];
};

/**
 * The filter bar and tour grid, filtered and sorted from the URL in the
 * browser. Doing this client-side lets /tours be one cached page for every
 * `?destination=` / `?sort=` instead of a server render per visit.
 */
export default function ToursBrowser(props: Props) {
  const params = useSearchParams();
  return (
    <ToursBrowserView {...props} destination={params.get("destination")} sort={params.get("sort")} />
  );
}

/**
 * Static-render fallback (the cached HTML, before the URL is read): the full
 * list in default order, so crawlers and no-JS visitors see every tour.
 */
export function ToursBrowserView({
  tours,
  destinations,
  destination,
  sort,
}: Props & { destination?: string | null; sort?: string | null }) {
  const view = filterAndSortTours(tours, destinations, destination, sort);

  return (
    <>
      <ToursFilterBar
        destinations={destinations.map(({ slug, name }) => ({ slug, name }))}
        currentDestination={view.destination}
        currentSort={view.sort}
        totalCount={view.tours.length}
      />

      {view.tours.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="font-body text-b2-desktop text-dark-gray">No tours found for this destination.</p>
          <Link
            href="/tours"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-crimson-red px-6 py-3 font-body font-medium text-white hover:bg-light-red"
          >
            View All Tours
          </Link>
        </div>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-6 md:mt-14 md:grid-cols-2 lg:grid-cols-3">
          {view.tours.map((tour, i) => (
            <TourCard key={tour.slug} tour={tour} priority={i < 3} />
          ))}
        </ul>
      )}
    </>
  );
}
