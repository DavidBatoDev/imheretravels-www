import { notFound, permanentRedirect } from "next/navigation";
import { getTourBySlug, getCurrentSlugForPreviousSlug } from "@/lib/tours-firestore";

export const revalidate = 3600; // Re-fetch from Firestore at most once per hour

type Params = Promise<{ slug: string }>;

/**
 * Dynamic root-level short-URL handler for bare `/{slug}` paths.
 *
 * Current-slug short URLs are already handled at build time by
 * `next.config.ts` redirects(); this catch-all covers Firestore-driven cases
 * those can't see without a rebuild — chiefly bare old slugs `/{oldSlug}`,
 * which it redirects to the tour's current `/tours/{slug}` page. All concrete
 * single-segment routes (e.g. /about-us, /tours) are more specific and win, so
 * this only ever handles otherwise-unmatched roots (which already 404 today).
 */
export default async function ShortUrlRedirect({ params }: { params: Params }) {
  const { slug } = await params;
  if (await getTourBySlug(slug)) permanentRedirect(`/tours/${slug}`);
  const current = await getCurrentSlugForPreviousSlug(slug);
  if (current) permanentRedirect(`/tours/${current}`);
  notFound();
}
