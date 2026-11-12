/**
 * The image a sale page shares as its link preview, and the URL it is served
 * from. WhatsApp and Messenger build previews on the sender's device and drop
 * the whole preview when the image is a WebP on another host (the admin's
 * banners are Firebase-hosted WebP), so the page points at
 * /api/og/sale/<slug>: the same picture as a 1200×630 JPEG on our own domain.
 */
import { createHash } from "node:crypto";
import type { SalePageData } from "./types";

export const SALE_SHARE_IMAGE_SIZE = { width: 1200, height: 630 } as const;

const BASE_URL = "https://www.imheretravels.com";

/** Admin "Share image" first, then the desktop banner, then the first tour's cover. */
export function saleShareImageSource(sale: Pick<SalePageData, "seo" | "hero" | "tours">): string | null {
  const src = sale.seo.ogImage || sale.hero.bannerUrl || sale.tours[0]?.coverImage || null;
  if (!src) return null;
  return src.startsWith("/") ? `${BASE_URL}${src}` : src;
}

/**
 * Absolute URL of the sale's preview image. `v` changes whenever the source
 * image does, so apps that keep a preview per image URL fetch the new one.
 */
export function saleShareImageUrl(slug: string, source: string): string {
  const v = createHash("sha256").update(source).digest("hex").slice(0, 12);
  return `${BASE_URL}/api/og/sale/${encodeURIComponent(slug)}?v=${v}`;
}
