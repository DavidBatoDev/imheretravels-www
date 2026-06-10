import { renderHostOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card";
import { getAllHostSlugs } from "@/lib/resident-hosts-firestore";

// Twitter card reuses the same generated card as Open Graph. Route segment
// config (`runtime`) must be declared directly — Turbopack can't statically
// parse it through a re-export — so this mirrors opengraph-image.tsx.
export const runtime = "nodejs";

export const alt = "I'm Here Travels — resident host";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export async function generateStaticParams() {
  return (await getAllHostSlugs()).map((slug) => ({ slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return renderHostOgImage(slug);
}
