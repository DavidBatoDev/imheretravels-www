import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/app/components/global/Footer";
import FaqAccordion from "@/app/faqs/_components/FaqAccordion";
import { getSalePageData, type SaleLoadResult } from "@/lib/sale-firestore";
import { BLACK_FRIDAY_PATH, BLACK_FRIDAY_SLUG } from "@/lib/sale/config";
import { maxDiscount, salePhase, statusLabel } from "@/lib/sale/ladder";
import HowItWorks from "./_components/HowItWorks";
import SaleExperience from "./_components/SaleExperience";
import SaleHero from "./_components/SaleHero";
import SaleViewTracker from "./_components/SaleViewTracker";
import { saleFaqs } from "./_components/saleFaqs";

// Explicit route — wins over the app/[slug] short-URL catch-all.
// Sale config and the initial slot snapshot refresh at most once a minute;
// live availability is polled client-side from the admin API.
export const revalidate = 60;

const BASE_URL = "https://www.imheretravels.com";
const PAGE_URL = `${BASE_URL}${BLACK_FRIDAY_PATH}`;
const TITLE = "Black Friday Sale";
const DESCRIPTION =
  "Black Friday on I'm Here Travels: a few discounted slots per small-group tour, cheapest first. Hold yours for 15 minutes and pay just the reservation fee today.";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const IS_DEV = process.env.NODE_ENV !== "production";

/**
 * Dev-only mock switch (`?mock=1`) for visual QA without a sale doc. The
 * NODE_ENV check is a build-time constant, so production never reads
 * searchParams (keeping the page static/ISR) and can never serve mock data.
 */
async function load(searchParams: SearchParams): Promise<{ result: SaleLoadResult; mock: boolean }> {
  if (IS_DEV) {
    const sp = await searchParams;
    if (sp.mock === "1") {
      const { getMockSalePageData } = await import("@/lib/sale/mock");
      const sale = await getMockSalePageData({
        status: typeof sp.status === "string" ? sp.status : undefined,
        mode: typeof sp.mode === "string" ? sp.mode : undefined,
      });
      return { result: { kind: "ok", sale }, mock: true };
    }
  }
  return { result: await getSalePageData(BLACK_FRIDAY_SLUG), mock: false };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { result, mock } = await load(searchParams);
  if (result.kind === "not_found") return { title: TITLE, robots: { index: false } };

  const sale = result.kind === "ok" ? result.sale : null;
  const indexable = !mock && sale?.status === "live";
  const description = sale?.hero.subtitle || DESCRIPTION;
  const image = sale?.hero.bannerUrl || sale?.tours[0]?.coverImage;

  return {
    // Root layout template appends "— I'm Here Travels".
    title: TITLE,
    description,
    alternates: { canonical: PAGE_URL },
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: {
      title: `${TITLE} — I'm Here Travels`,
      description,
      type: "website",
      url: PAGE_URL,
      ...(image ? { images: [{ url: image, alt: `${TITLE} — I'm Here Travels` }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${TITLE} — I'm Here Travels`,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

function stripLinks(md: string): string {
  return md.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
}

export default async function BlackFridayPage({ searchParams }: { searchParams: SearchParams }) {
  const { result, mock } = await load(searchParams);

  if (result.kind === "not_found") notFound();

  if (result.kind === "unavailable") {
    return (
      <>
        <main className="flex-1">
          <SaleHero
            title="Black Friday Sale"
            subtitle="We can't load the sale right now. Please refresh in a moment — your chance at a slot isn't gone."
            statusText="Temporarily unavailable"
            phase="paused"
            upTo={0}
            showCta={false}
          />
          <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
            <div className="rounded-lg bg-white p-8 text-center">
              <p className="font-sans text-h6-mobile text-midnight md:text-h6-desktop">
                Deals couldn&apos;t load
              </p>
              <p className="mt-2 font-body text-b2-mobile text-dark-gray md:text-b4-desktop">
                In the meantime, you can browse every tour at its normal price.
              </p>
              <Link
                href="/tours"
                className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-crimson-red px-8 py-3 font-body font-bold text-white transition-colors hover:bg-light-red"
              >
                Browse tours
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const sale = result.sale;
  const phase = salePhase(sale, Date.parse(sale.availability.serverNow));
  const statusText = statusLabel(sale, phase);
  const faqs = saleFaqs(sale.holdMinutes);
  const firstTour = sale.tours[0];
  const firstSlots = sale.availability.tours.find(
    (t) => t.tourPackageId === firstTour?.tourPackageId,
  )?.slots;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: stripLinks(f.a) },
    })),
  };

  return (
    <>
      {sale.status === "live" && !mock && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <SaleViewTracker saleId={sale.saleId} saleName={sale.name} status={phase} />
      <main className="flex-1">
        <SaleHero
          title={sale.hero.title}
          subtitle={sale.hero.subtitle}
          statusText={statusText}
          phase={phase}
          upTo={maxDiscount(sale)}
          bannerUrl={sale.hero.bannerUrl}
          mobileBannerUrl={sale.hero.mobileBannerUrl}
          fallbackImage={firstTour?.coverImage}
          showCta={sale.tours.length > 0}
          startAt={sale.startAt}
        />

        {/* Resume banner (holder only) → How it works → the deals grid. */}
        <SaleExperience sale={sale} mock={mock}>
          <HowItWorks
            holdMinutes={sale.holdMinutes}
            example={
              firstTour && firstSlots
                ? { name: firstTour.displayName, originalPrice: firstTour.originalPrice, slots: firstSlots }
                : undefined
            }
          />
        </SaleExperience>

        <section aria-labelledby="sale-faq-heading" className="mx-auto w-full max-w-5xl px-4 py-12 md:px-8 md:py-16">
          <h2 id="sale-faq-heading" className="font-display text-h2-mobile text-midnight md:text-h2-desktop">
            Sale FAQs
          </h2>
          <div className="mt-6 rounded-lg bg-white px-5 py-3 md:px-10 md:py-6">
            <FaqAccordion items={faqs} defaultOpen={0} />
          </div>
          <p className="mt-6 font-body text-b4-mobile text-dark-gray md:text-b4-desktop">
            Black Friday bookings are non-refundable. Full details in our{" "}
            <Link href="/terms-and-conditions" className="font-medium text-midnight underline underline-offset-2 hover:text-crimson-red">
              Terms &amp; Conditions
            </Link>
            . Questions?{" "}
            <Link href="/contact-us" className="font-medium text-midnight underline underline-offset-2 hover:text-crimson-red">
              Contact us
            </Link>
            .
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
