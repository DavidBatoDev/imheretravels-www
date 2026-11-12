import sharp from "sharp";
import { getSalePageData } from "@/lib/sale-firestore";
import { SALE_SHARE_IMAGE_SIZE, saleShareImageSource } from "@/lib/sale/share-image";

// sharp needs Node; the sale is read with firebase-admin.
export const runtime = "nodejs";

/**
 * A sale's link-preview image: its share image (or banner) as a 1200×630
 * JPEG on our own domain. See lib/sale/share-image.ts for why.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getSalePageData(slug);
  if (result.kind !== "ok") return new Response("Not found", { status: 404 });

  const source = saleShareImageSource(result.sale);
  if (!source) return new Response("No share image", { status: 404 });

  try {
    const res = await fetch(source, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) throw new Error(`source image ${res.status}`);
    const jpeg = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(SALE_SHARE_IMAGE_SIZE.width, SALE_SHARE_IMAGE_SIZE.height, { fit: "cover", position: "attention" })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    return new Response(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        // The page links this with ?v=<hash of the source>, so a new image gets a new URL.
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    console.error(`[sale] share image for ${slug} failed`, e);
    return new Response("Share image unavailable", { status: 502 });
  }
}
