/**
 * Shared Open Graph / Twitter card renderer for tour and resident-host pages.
 *
 * Generates a 1200×630 branded social-share card with `next/og` (Satori) — free,
 * self-hosted, no external service. Used by the `opengraph-image` / `twitter-image`
 * file conventions in `app/tours/[slug]` and `app/resident-hosts/[slug]`.
 *
 * Node runtime only: reads brand fonts + logo from `public/` via `fs`, and the
 * data libs use `firebase-admin`. Satori supports OTF/TTF/WOFF — never WOFF2.
 */

import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { getTourBySlug } from "@/lib/tours-firestore";
import { getHostBySlug } from "@/lib/resident-hosts-firestore";

export const OG_SIZE = { width: 1200, height: 630 } as const;
// Served as JPEG (not PNG): the rendered card is a photo, and PNG runs ~1MB —
// far over WhatsApp's ~300KB preview limit. We re-encode to JPEG below.
export const OG_CONTENT_TYPE = "image/jpeg";

// Brand palette (Satori has no Tailwind — hardcode the tokens from globals.css).
const MIDNIGHT = "#1C1F2A";
const CRIMSON = "#EF3340";
const LIGHT_GREY = "#F2F0EE";

type CardInput = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
};

// ─── Asset loading (cached once per server process) ──────────────────────────

let fontsPromise: Promise<{ name: string; data: Buffer; weight: 400 | 500 | 700; style: "normal" }[]> | null = null;
function loadFonts() {
  if (!fontsPromise) {
    const dir = join(process.cwd(), "public", "Fonts");
    fontsPromise = Promise.all([
      readFile(join(dir, "Cartograph", "CartographCF-Bold.otf")),
      readFile(join(dir, "HKGrotesk", "TTF", "HKGrotesk-Bold.ttf")),
      readFile(join(dir, "HKGrotesk", "TTF", "HKGrotesk-Medium.ttf")),
    ]).then(([cartograph, hkBold, hkMedium]) => [
      { name: "Cartograph", data: cartograph, weight: 700 as const, style: "normal" as const },
      { name: "HK Grotesk", data: hkBold, weight: 700 as const, style: "normal" as const },
      { name: "HK Grotesk", data: hkMedium, weight: 500 as const, style: "normal" as const },
    ]);
  }
  return fontsPromise;
}

let logoPromise: Promise<string> | null = null;
function loadLogo() {
  if (!logoPromise) {
    logoPromise = readFile(
      join(process.cwd(), "public", "Logos", "Horizontal", "Digital", "PNG", "White", "Digital_Horizontal_White.png"),
      "base64",
    )
      .then((b64) => `data:image/png;base64,${b64}`)
      .catch(() => "");
  }
  return logoPromise;
}

/**
 * Fetch a remote (Firebase Storage) cover and return a Satori-safe JPEG data
 * URI. `next/og` (Satori) only decodes PNG/JPEG, but most covers are WebP — so
 * convert + resize to the card panel with sharp (also shrinks the output PNG).
 */
async function fetchImageDataUri(
  url: string,
  width: number,
  height: number,
): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const input = Buffer.from(await res.arrayBuffer());
    const jpeg = await sharp(input)
      .resize(width, height, { fit: "cover" })
      .jpeg({ quality: 78 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

// ─── Card renderer ───────────────────────────────────────────────────────────

async function renderOgCard({ eyebrow, title, subtitle, imageUrl }: CardInput): Promise<Response> {
  const [fonts, logo, cover] = await Promise.all([
    loadFonts(),
    loadLogo(),
    imageUrl ? fetchImageDataUri(imageUrl, 680, 630) : Promise.resolve(null),
  ]);

  const png = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: MIDNIGHT,
          fontFamily: "HK Grotesk",
        }}
      >
        {/* Left — brand panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 520,
            height: "100%",
            padding: 64,
            boxSizing: "border-box",
          }}
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} width={190} height={40} style={{ width: 190, height: 40, objectFit: "contain" }} alt="" />
          ) : (
            <div style={{ display: "flex", color: "#FFFFFF", fontSize: 30, fontWeight: 700 }}>
              I&apos;m Here Travels
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                color: CRIMSON,
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 2,
              }}
            >
              {eyebrow.toUpperCase()}
            </div>
            <div
              style={{
                display: "flex",
                color: "#FFFFFF",
                fontFamily: "Cartograph",
                fontSize: 54,
                fontWeight: 700,
                lineHeight: 1.05,
                marginTop: 16,
              }}
            >
              {title}
            </div>
            {subtitle ? (
              <div
                style={{
                  display: "flex",
                  color: LIGHT_GREY,
                  fontSize: 28,
                  fontWeight: 500,
                  marginTop: 20,
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>

        {/* Right — cover photo (or brand gradient fallback) */}
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            width={680}
            height={630}
            style={{ width: 680, height: 630, objectFit: "cover" }}
            alt=""
          />
        ) : (
          <div
            style={{
              display: "flex",
              width: 680,
              height: 630,
              backgroundImage: `linear-gradient(135deg, ${CRIMSON}, ${MIDNIGHT})`,
            }}
          />
        )}
      </div>
    ),
    { ...OG_SIZE, fonts },
  );

  // ImageResponse only emits PNG (~1MB for a photo). Re-encode to a compact
  // JPEG so previews load everywhere, including WhatsApp's ~300KB ceiling.
  const pngBuf = Buffer.from(await png.arrayBuffer());
  const jpeg = await sharp(pngBuf).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

// ─── Public per-entity helpers (used by the route files) ─────────────────────

export async function renderTourOgImage(slug: string) {
  const tour = await getTourBySlug(slug);
  if (!tour) {
    return renderOgCard({ eyebrow: "Small-group tour", title: "Tour", imageUrl: null });
  }
  const parts = [
    tour.listingCard.duration,
    tour.booking.priceAmount ? `From ${tour.booking.priceAmount}` : "",
  ].filter(Boolean);
  return renderOgCard({
    eyebrow: tour.isHosted ? "Hosted tour" : "Small-group tour",
    title: tour.name,
    subtitle: parts.join("  ·  "),
    imageUrl: tour.gallery.hero,
  });
}

export async function renderHostOgImage(slug: string) {
  const host = await getHostBySlug(slug);
  if (!host) {
    return renderOgCard({ eyebrow: "Resident Host", title: "Resident Host", imageUrl: null });
  }
  const imageUrl = host.heroImage ?? host.heroImages?.[0] ?? host.profileImage ?? null;
  const subtitle =
    host.displayName && !host.pageTitle.includes(host.displayName)
      ? `with ${host.displayName}`
      : undefined;
  return renderOgCard({
    eyebrow: "Resident Host",
    title: host.pageTitle,
    subtitle,
    imageUrl,
  });
}
