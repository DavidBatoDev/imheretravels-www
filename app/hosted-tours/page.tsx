export const revalidate = 3600;

import Footer from "@/app/components/global/Footer";
import { getHostedTours } from "@/lib/tours-firestore";
import TourCard from "@/app/tours/_components/TourCard";

const BASE_URL = "https://www.imheretravels.com";

export const metadata = {
  title: "Hosted Tours — I'm Here Travels",
  description:
    "Exclusive group tours led by I'm Here Travels resident hosts. Join Dev, Danielle, Erin and more on curated community-first adventures around the world.",
  alternates: {
    canonical: `${BASE_URL}/hosted-tours`,
  },
};

export default async function HostedToursPage() {
  const tours = await getHostedTours();

  return (
    <>
      <main className="flex-1">
        <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 md:px-8 md:pb-24 md:pt-10">
          <h1 className="font-display text-h1-mobile md:text-h1-desktop text-midnight">
            Hosted Tours
          </h1>
          <p className="mt-4 max-w-2xl font-body text-b2-mobile md:text-b2-desktop text-dark-gray">
            Exclusive group trips led by our resident hosts — community-first
            adventures with an expert guide who knows you by name.
          </p>

          <ul className="mt-10 grid grid-cols-1 gap-6 md:mt-14 md:grid-cols-2 lg:grid-cols-3">
            {tours.map((tour, i) => (
              <TourCard key={tour.slug} tour={tour} priority={i < 3} />
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
