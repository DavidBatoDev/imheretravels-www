import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import Footer from "@/app/components/global/Footer";
import Reveal from "@/app/components/global/Reveal";
import ImageWithSkeleton from "@/app/components/global/ImageWithSkeleton";
import NewsletterForm from "@/app/components/global/NewsletterForm";
import type { Host } from "@/data/hosts";
import { getHostBySlug, getAllHostSlugs } from "@/lib/resident-hosts-firestore";
import { getActiveTourMetaById, getAllTours } from "@/lib/tours-firestore";
import GallerySectionClient from "./_components/GallerySectionClient";
import WhyTravelCarousel from "./_components/WhyTravelCarousel";
import UpcomingTripsList from "./_components/UpcomingTripsList";

export const revalidate = 3600;

/* -------------------------------------------------------------------------- */
/* Static generation                                                            */
/* -------------------------------------------------------------------------- */

export async function generateStaticParams() {
  return (await getAllHostSlugs()).map((slug) => ({ slug }));
}

const BASE_URL = "https://www.imheretravels.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const host = await getHostBySlug(slug);
  if (!host) return {};
  const url = `${BASE_URL}/resident-hosts/${host.slug}`;
  return {
    title: host.meta.title,
    description: host.meta.description,
    alternates: { canonical: url },
    openGraph: {
      title: host.meta.title,
      description: host.meta.description,
      type: "profile",
      url,
      // og:image is supplied by the generated `opengraph-image.tsx` card.
    },
    twitter: {
      card: "summary_large_image",
      title: host.meta.title,
      description: host.meta.description,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                               */
/* -------------------------------------------------------------------------- */


/* -------------------------------------------------------------------------- */
/* Sections                                                                     */
/* -------------------------------------------------------------------------- */

function HeroSection({ host }: { host: Host }) {
  const hasTriPanel = host.heroImages && host.heroImages.length === 3;

  return (
    <section className="relative h-65 w-full overflow-hidden md:h-90">
      {hasTriPanel ? (
        <div className="absolute inset-0 grid grid-cols-3">
          {host.heroImages!.map((src, i) => (
            <div key={i} className="relative h-full w-full overflow-hidden">
              <ImageWithSkeleton
                src={src}
                alt={host.heroImageAlt}
                fill
                priority={i === 0}
                sizes="33vw"
                className="object-cover object-center"
              />
            </div>
          ))}
        </div>
      ) : host.heroImage ? (
        <ImageWithSkeleton
          src={host.heroImage}
          alt={host.heroImageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      ) : (
        <div className="absolute inset-0 bg-crimson-red" />
      )}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Reveal y={20}>
          <h1 className="font-display text-h1-mobile text-white md:text-h1-desktop">
            {host.pageTitle}
          </h1>
        </Reveal>
        {!host.comingSoon && (
          <Reveal y={12} delay={160}>
            <a
              href="#upcoming-trips"
              className="mt-2 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 font-body font-medium text-midnight transition-colors hover:bg-light-grey"
            >
              View Upcoming Trips
            </a>
          </Reveal>
        )}
      </div>
    </section>
  );
}

function ComingSoonSection({ host }: { host: Host }) {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-24 text-center md:px-8">
      <Reveal>
        <h2 className="font-sans text-h3-mobile md:text-h3-desktop text-midnight">
          Coming Soon
        </h2>
      </Reveal>
      <Reveal delay={80}>
        <p className="mt-4 font-body text-b2-mobile md:text-b2-desktop text-dark-gray">
          Exciting trips with {host.displayName} are on the way — check back soon!
        </p>
      </Reveal>
      <Reveal delay={160}>
        <Link
          href="/tours"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-crimson-red px-6 py-3 font-body font-medium text-white hover:bg-light-red"
        >
          Browse All Tours
        </Link>
      </Reveal>
    </section>
  );
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

function IntroSection({ host }: { host: Host }) {
  return (
    <section className="relative w-full">
      {/* Red ImHere sticker — right */}
      <div className="pointer-events-none absolute -right-16 -top-20 hidden rotate-15 lg:block" aria-hidden="true">
        <Image src="/Stickers/Print/PNG/ImHere/Print_ImHereCircle_Red.png" alt="" width={300} height={300} className="object-contain" />
      </div>
      {/* Green Globe sticker — left */}
      <div className="pointer-events-none absolute -left-8 -bottom-20 z-20 hidden -rotate-[20deg] lg:block" aria-hidden="true">
        <Image src="/Stickers/Print/PNG/Globe/Print_Globe_Green.png" alt="" width={230} height={230} className="object-contain" />
      </div>
    <div className="mx-auto w-full max-w-5xl px-4 pt-16 pb-12 md:px-8 md:pt-24 md:pb-16">
      <div className={`grid grid-cols-1 items-center gap-8 ${host.profileImage ? "md:grid-cols-[220px_1fr] md:gap-20" : ""}`}>

        {/* Profile column — hidden when no profileImage */}
        {host.profileImage && (
          <Reveal>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="relative h-64 w-64 overflow-hidden rounded-full ring-4 ring-white shadow-medium">
                <ImageWithSkeleton
                  src={host.profileImage}
                  alt={host.displayName}
                  fill
                  rounded="full"
                  sizes="256px"
                  className="object-cover object-top"
                />
              </div>
              <p className="font-sans text-h6-mobile md:text-h6-desktop text-midnight font-bold">
                {host.displayName}
              </p>
              {host.instagram && (
                <a
                  href={`https://instagram.com/${host.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-body text-b4-desktop text-dark-gray hover:text-crimson-red transition-colors"
                >
                  <InstagramIcon />
                  {host.instagram}
                </a>
              )}
            </div>
          </Reveal>
        )}

        {/* Content column */}
        <div className={!host.profileImage ? "text-center" : ""}>
          <Reveal>
            <h2 className="font-sans text-h3-mobile md:text-h3-desktop text-midnight">
              {host.pageTitle}
            </h2>
          </Reveal>
          <div className="mt-5 flex flex-col gap-4">
            {host.intro.map((para, i) => (
              <Reveal key={i} delay={i * 80}>
                <p className="font-body text-b2-mobile md:text-b2-desktop text-dark-gray">
                  {para}
                </p>
              </Reveal>
            ))}
          </div>
        </div>

      </div>
    </div>
    </section>
  );
}

function UpcomingTripsSection({ host, trips }: { host: Host; trips: Host["upcomingTrips"] }) {
  return (
    <section id="upcoming-trips" className="relative z-0 bg-light-grey">
      {/* Orange Heart Circle sticker — bottom-right, behind cards */}
      <div className="pointer-events-none absolute -bottom-20 -right-20 -z-10 hidden rotate-12 lg:block" aria-hidden="true">
        <Image src="/Stickers/Print/PNG/Heart-Circle/Print_Heart_Circle_Orange.png" alt="" width={250} height={250} className="object-contain" />
      </div>
      <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-16">
        <div className="mb-8 text-center md:mb-12">
          <h2 className="font-sans text-h3-mobile md:text-h3-desktop text-midnight">
            Upcoming Trips with {host.displayName}
          </h2>
        </div>

        <UpcomingTripsList trips={trips} />
      </div>
    </section>
  );
}

function WhyTravelSection({ host }: { host: Host }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-16">
      <div className="mb-10 text-center">
        <Reveal>
          <h2 className="font-sans text-h3-mobile md:text-h3-desktop text-midnight">
            Why Travel With Us
          </h2>
        </Reveal>
      </div>
      <WhyTravelCarousel points={host.whyTravel} notes={host.whyTravelNotes} />
    </section>
  );
}

function GallerySection({ host }: { host: Host }) {
  const slides = host.gallerySlides ?? [];
  // A host may have no gallery (e.g. newly created in the admin). Render nothing
  // rather than the empty "Real Moments" section (and avoid a render crash).
  if (slides.length === 0) return null;
  return <GallerySectionClient slides={slides} />;
}

function HowItWorksSection({ host }: { host: Host }) {
  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-16">
      {/* Red Flag Outline sticker — sits at circle height so step 4 overlays it */}
      <div className="pointer-events-none absolute -right-4 -top-12 hidden rotate-10 lg:block" aria-hidden="true">
        <Image src="/Stickers/Print/PNG/Flag-Outline/Print_Flag_Outline_Red.png" alt="" width={250} height={250} className="object-contain" />
      </div>
      <div className="mb-12 text-center">
        <Reveal>
          <h2 className="font-sans text-h3-mobile md:text-h3-desktop text-midnight">
            How It Works
          </h2>
        </Reveal>
      </div>

      <ul className="relative grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 md:gap-x-0">
        {/* Dashed connector line spanning circle centers — desktop only */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute hidden md:block"
          style={{ top: 28, left: "12.5%", right: "12.5%", borderTop: "2px dashed #d1d5db" }}
        />

        {host.howItWorks.map((step, i) => (
          <Reveal as="li" key={i} delay={i * 100}>
            <div className="flex flex-col items-center text-center">
              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-crimson-red shadow-small">
                <span className="font-display text-h4-mobile text-white leading-none">
                  {i + 1}
                </span>
              </div>
              <p className="mt-5 px-2 font-sans font-bold text-b2-mobile md:text-b2-desktop text-midnight">
                {step}
              </p>
            </div>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

function NewsletterSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-16">
      <div
        className="mx-auto overflow-hidden rounded-lg bg-white shadow-small"
        style={{ width: "1200px", maxWidth: "100%", height: "640px" }}
      >
        <div className="grid h-full grid-cols-1 md:grid-cols-2">
          <div className="flex flex-col justify-center gap-5 p-8 md:p-12">
            <h2 className="font-sans text-h3-mobile md:text-h3-desktop text-midnight">
              Join our community
            </h2>
            <p className="font-body text-b4-mobile md:text-b4-desktop text-dark-gray">
              Stay up to date on the latest news, deals and tours when you sign up.
            </p>
            <NewsletterForm
              formClassName="flex flex-col gap-3"
              buttonClassName="inline-flex items-center justify-center self-start rounded-full bg-crimson-red px-6 py-3 font-body font-medium text-white hover:bg-light-red"
            />
          </div>
          <div className="relative h-full w-full">
            <ImageWithSkeleton
              src="/figma/join-community.jpg"
              alt="Travelers enjoying a destination together"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-[center_85%]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                         */
/* -------------------------------------------------------------------------- */

export default async function ResidentHostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const host = await getHostBySlug(slug);
  if (!host) notFound();

  // Resolve each trip's linked tour by ID → current slug so "View Tour" links
  // survive tour renames; fall back to the stored slug when there's no ID.
  //
  // Visibility: a real trip card only shows while its linked tour is *active*.
  // That means draft/scheduled tours (not yet published) and archived tours
  // both drop off this page until they go live — a tour scheduled to publish
  // later won't appear here until the publish time flips it to active.
  // Coming-Soon / TBA placeholder cards (no duration, or comingSoon) always
  // show; cards with no tour link at all are left untouched.
  const tourMetaById = await getActiveTourMetaById();
  const activeTourSlugs = new Set(
    Object.values(tourMetaById).map((m) => m.slug),
  );
  // Order is whatever the admin authored on the host doc — the CMS is the
  // single source of truth for card order, so newest-first is arranged there.
  const authoredTrips = host.upcomingTrips
    .filter((trip) => {
      if (trip.comingSoon || !trip.duration) return true; // placeholder card
      if (trip.tourId) return Boolean(tourMetaById[trip.tourId]); // linked by id
      if (trip.tourSlug) return activeTourSlugs.has(trip.tourSlug); // linked by slug
      return true; // no tour link — leave as-is
    })
    .map((trip) => ({
      ...trip,
      tourSlug: trip.tourId
        ? tourMetaById[trip.tourId]?.slug ?? trip.tourSlug
        : trip.tourSlug,
    }));

  // Tours attached to this host in the admin that nobody authored a card for
  // yet are rendered automatically from the tour's own listing data, so
  // attaching a hosted tour is all it takes to surface it here. Newest first,
  // after the hand-authored cards (which the CMS orders explicitly).
  const coveredSlugs = new Set(
    authoredTrips.map((t) => t.tourSlug).filter(Boolean) as string[],
  );
  const toursBySlug = new Map(
    (await getAllTours()).map((t) => [t.slug, t] as const),
  );
  const derivedTrips: Host["upcomingTrips"] = (host.attachedTourIds ?? [])
    .map((id) => tourMetaById[id])
    .filter((m): m is { slug: string; createdAt: number } => Boolean(m))
    .filter((m) => !coveredSlugs.has(m.slug))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((m) => {
      const tour = toursBySlug.get(m.slug);
      if (!tour) return null;
      const dates =
        tour.keyFacts.find((f) => f.label === "Tour Dates")?.values?.[0] ?? "TBA";
      return {
        name: tour.name,
        dates,
        tourSlug: tour.slug,
        image: tour.listingCard.image,
        imageAlt: tour.listingCard.imageAlt,
        duration: tour.listingCard.duration,
        description: tour.listingCard.description,
        price: tour.listingCard.price,
        comingSoon: tour.comingSoon,
      };
    })
    .filter(Boolean) as Host["upcomingTrips"];

  const resolvedTrips = [...authoredTrips, ...derivedTrips];

  return (
    <>
      <main className="flex-1 overflow-x-clip">
        <HeroSection host={host} />

        {host.comingSoon ? (
          <ComingSoonSection host={host} />
        ) : (
          <>
            <IntroSection host={host} />
            <UpcomingTripsSection host={host} trips={resolvedTrips} />
            <WhyTravelSection host={host} />
            <GallerySection host={host} />
            <HowItWorksSection host={host} />
          </>
        )}

        <NewsletterSection />
      </main>
      <Footer />
    </>
  );
}
