import { Suspense } from "react";
import Footer from "@/app/components/global/Footer";

// One cached page for every ?destination= / ?sort= (filtering and sorting
// happen in the browser, see ToursBrowser), refreshed hourly and on admin saves.
export const revalidate = 3600;

import { getAllTours, getHostedTourSlugs } from "@/lib/tours-firestore";
import { getAllDestinations } from "@/lib/destinations-firestore";
import type { Tour } from "@/types/tour";
import ToursBrowser, { ToursBrowserView } from "./_components/ToursBrowser";
import RecentlyViewedTours from "./_components/RecentlyViewedTours";
import { toTourListItem, type TourListDestination } from "./_components/tour-list";

const BASE_URL = "https://www.imheretravels.com";

export const metadata = {
  title: "Browse All Tours — I'm Here Travels",
  description:
    "Browse every I'm Here Travels small-group adventure — Philippines, Japan, Maldives, India, Tanzania and more. Filter by destination and find your perfect trip.",
};

function buildToursJsonLd(tours: Tour[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${BASE_URL}/tours`,
    name: "All Tours — I'm Here Travels",
    description:
      "Browse every I'm Here Travels small-group adventure — Philippines, Japan, Maldives, India, Tanzania and more.",
    url: `${BASE_URL}/tours`,
    publisher: { "@id": `${BASE_URL}/#organization` },
    mainEntity: {
      "@type": "ItemList",
      name: "Small-Group Tours",
      numberOfItems: tours.length,
      itemListElement: tours.map((tour, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${BASE_URL}/tours/${tour.slug}`,
        name: tour.name,
        description: tour.meta.description,
        image: `${BASE_URL}${tour.gallery.hero}`,
      })),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default async function ToursPage() {
  const [hostedSlugs, tours, allDestinations] = await Promise.all([
    getHostedTourSlugs().then((s) => new Set(s)),
    getAllTours(),
    getAllDestinations(),
  ]);
  const allTours = tours.filter((tour) => !hostedSlugs.has(tour.slug));

  const listItems = allTours.map(toTourListItem);
  const destinations: TourListDestination[] = allDestinations.map((d) => ({
    slug: d.slug,
    name: d.name,
    tourSlugs: d.tourSlugs,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildToursJsonLd(allTours)) }}
      />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 md:px-8 md:pb-24 md:pt-10">
          <h1 className="font-display text-h1-mobile md:text-h1-desktop text-midnight">
            All Tours
          </h1>
          <p className="mt-4 max-w-2xl font-body text-b2-mobile md:text-b2-desktop text-dark-gray">
            Small-group adventures across the Philippines, the Maldives and
            more.
          </p>

          <Suspense fallback={<ToursBrowserView tours={listItems} destinations={destinations} />}>
            <ToursBrowser tours={listItems} destinations={destinations} />
          </Suspense>
        </section>

        <RecentlyViewedTours allTours={listItems} />
      </main>
      <Footer />
    </>
  );
}
