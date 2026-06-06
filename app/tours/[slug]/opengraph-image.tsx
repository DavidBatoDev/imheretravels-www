import { renderTourOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card";
import { getAllTourSlugs } from "@/lib/tours-firestore";

// Node runtime: og-card reads brand fonts/logo from disk and uses firebase-admin.
export const runtime = "nodejs";

export const alt = "I'm Here Travels — tour";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export async function generateStaticParams() {
  return (await getAllTourSlugs()).map((slug) => ({ slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return renderTourOgImage(slug);
}
