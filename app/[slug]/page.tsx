import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import SaleHero from "@/app/black-friday/_components/SaleHero";
import SalePageView from "@/app/black-friday/_components/SalePageView";
import Footer from "@/app/components/global/Footer";
import {
  getSaleFallbackUrl,
  getSalePageData,
  getSaleRedirectPath,
  type SaleLoadResult,
} from "@/lib/sale-firestore";
import { BLACK_FRIDAY_SLUG } from "@/lib/sale/config";
import { salePhase } from "@/lib/sale/ladder";
import { getTourBySlug, getCurrentSlugForPreviousSlug } from "@/lib/tours-firestore";

// Sale config and the initial slot snapshot refresh at most once a minute;
// live availability is polled client-side from the admin API.
export const revalidate = 60;

const BASE_URL = "https://www.imheretravels.com";
const TITLE = "Black Friday Sale";
const DESCRIPTION =
  "Black Friday on I'm Here Travels: a few discounted slots per small-group tour, cheapest first. Hold yours for 15 minutes and pay just the reservation fee today.";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const IS_DEV = process.env.NODE_ENV !== "production";

/**
 * Dev-only mock switch (`/black-friday?mock=1`) for visual QA without a sale
 * doc. The NODE_ENV check is a build-time constant, so production never reads
 * searchParams (keeping the page static/ISR) and can never serve mock data.
 */
async function load(slug: string, searchParams: SearchParams): Promise<{ result: SaleLoadResult; mock: boolean }> {
  if (IS_DEV && slug === BLACK_FRIDAY_SLUG) {
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
  return { result: await getSalePageData(slug), mock: false };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const { result, mock } = await load(slug, searchParams);
  if (result.kind === "not_found") return { robots: { index: false } };

  const sale = result.kind === "ok" ? result.sale : null;
  const indexable = !mock && sale?.status === "live";
  // Admin "SEO & sharing" overrides win; otherwise fall back to the hero.
  const description = sale?.seo.description || sale?.hero.subtitle || DESCRIPTION;
  const image = sale?.seo.ogImage || sale?.hero.bannerUrl || sale?.tours[0]?.coverImage;
  const pageTitle = sale?.hero.title || TITLE;
  const shareTitle = sale?.seo.title || `${pageTitle} — I'm Here Travels`;
  const pageUrl = `${BASE_URL}/${slug}`;

  return {
    // Root layout template appends "— I'm Here Travels" unless admin set an exact title.
    title: sale?.seo.title ? { absolute: sale.seo.title } : pageTitle,
    description,
    alternates: { canonical: pageUrl },
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: {
      title: shareTitle,
      description,
      type: "website",
      url: pageUrl,
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

/**
 * Root-level `/{slug}` handler. All concrete single-segment routes (e.g.
 * /about-us, /tours) are more specific and win, so this only sees otherwise
 * unmatched roots, which are, in order:
 *
 * 1. A sale page, at whatever slug the sale has in admin.
 * 2. A bare tour slug or old tour slug, redirected to its `/tours/{slug}` page
 *    (current slugs are mostly handled at build time by `next.config.ts`
 *    redirects(); this covers Firestore-driven cases those can't see).
 * 3. A sale's Extra link, redirected to the sale. Temporary because sales end.
 */
export default async function RootSlugPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { slug } = await params;
  const { result, mock } = await load(slug, searchParams);

  // Draft (not found here) or ended: go to the admin's redirect link if there is one.
  const closed =
    result.kind === "not_found" ||
    (result.kind === "ok" &&
      !mock &&
      salePhase(result.sale, Date.parse(result.sale.availability.serverNow)) === "ended");
  if (closed) {
    const fallback = await getSaleFallbackUrl(slug);
    if (fallback) redirect(fallback);
  }

  if (result.kind === "ok") return <SalePageView sale={result.sale} mock={mock} />;

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

  if (await getTourBySlug(slug)) permanentRedirect(`/tours/${slug}`);
  const current = await getCurrentSlugForPreviousSlug(slug);
  if (current) permanentRedirect(`/tours/${current}`);
  const salePath = await getSaleRedirectPath(slug);
  if (salePath) redirect(salePath);
  notFound();
}
