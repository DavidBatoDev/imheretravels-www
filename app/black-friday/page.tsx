import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/app/components/global/Footer";
import { getSalePageData, type SaleLoadResult } from "@/lib/sale-firestore";
import { BLACK_FRIDAY_PATH, BLACK_FRIDAY_SLUG } from "@/lib/sale/config";
import SaleHero from "./_components/SaleHero";
import SalePageView from "./_components/SalePageView";

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
  // Admin "SEO & sharing" overrides win; otherwise fall back to the hero.
  const description = sale?.seo.description || sale?.hero.subtitle || DESCRIPTION;
  const image = sale?.seo.ogImage || sale?.hero.bannerUrl || sale?.tours[0]?.coverImage;
  const shareTitle = sale?.seo.title || `${TITLE} — I'm Here Travels`;

  return {
    // Root layout template appends "— I'm Here Travels" unless admin set an exact title.
    title: sale?.seo.title ? { absolute: sale.seo.title } : TITLE,
    description,
    alternates: { canonical: PAGE_URL },
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: {
      title: shareTitle,
      description,
      type: "website",
      url: PAGE_URL,
      ...(image ? { images: [{ url: image, alt: shareTitle }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
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

  return <SalePageView sale={result.sale} mock={mock} />;
}
