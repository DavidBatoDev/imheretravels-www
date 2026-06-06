import { renderHostOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card";
import { getAllHostSlugs } from "@/lib/resident-hosts-firestore";

// Node runtime: og-card reads brand fonts/logo from disk and uses firebase-admin.
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
