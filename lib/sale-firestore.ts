/**
 * Server-side loader for a sale page (`saleEvents` collection).
 *
 * Builds everything the page needs in one pass: the sale config, each tour's
 * presentation data (cover, labels, reservation fee) and an initial public
 * availability snapshot. Holder data on the inventory docs (holdId, email,
 * payment ids) is read only to derive a public slot state and never leaves this
 * module. The client then refreshes availability from the admin public API.
 *
 * Firebase is imported lazily so a missing/invalid service account surfaces as
 * a `{ kind: "unavailable" }` result (the page renders an empty state) rather
 * than a module-evaluation crash.
 */

import { cache } from "react";
import type {
  PublicSlot,
  PublicSlotState,
  PublicTourAvailability,
  SaleCheckoutMode,
  SalePageData,
  SalePageTour,
  SaleStatus,
} from "@/lib/sale/types";
// Type-only: erased at build, so it doesn't evaluate firebase-admin eagerly.
import type { TourCardPresentation } from "@/lib/tours-firestore";

const SALE_COLLECTION = "saleEvents";
const INVENTORY_SUBCOLLECTION = "inventory";
const FALLBACK_IMAGE = "/figma/tour-philippines-sunrise.png";

type RawDoc = Record<string, unknown>;

export type SaleLoadResult =
  | { kind: "ok"; sale: SalePageData }
  | { kind: "not_found" }
  | { kind: "unavailable" };

function toMs(v: unknown): number | null {
  const ts = v as { toMillis?: () => number } | null | undefined;
  if (ts && typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const ms = Date.parse(v);
    return Number.isFinite(ms) ? ms : null;
  }
  return null;
}

function toIso(v: unknown): string | null {
  const ms = toMs(v);
  return ms === null ? null : new Date(ms).toISOString();
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const STATUSES: SaleStatus[] = ["draft", "live", "paused", "ended"];

/** Same rule as the admin: held/paying with a future heldUntil → on hold. */
function publicState(slot: RawDoc, nowMs: number): PublicSlotState {
  const status = slot.status;
  if (status === "sold") return "sold";
  if (status === "held" || status === "paying") {
    return (toMs(slot.heldUntil) ?? 0) > nowMs ? "on_hold" : "available";
  }
  return "available";
}

function isSaleOpen(status: SaleStatus, startMs: number | null, endMs: number | null, now: number) {
  if (status !== "live") return false;
  if (startMs !== null && now < startMs) return false;
  if (endMs !== null && now >= endMs) return false;
  return true;
}

/**
 * Public slot states and prices. Like the admin availability API, prices
 * follow the tour's live price: an unsold slot costs `liveOriginal − discount`
 * (never below 0); sold slots keep the price they were sold at. Without a live
 * price the stored snapshot is used.
 */
export function toPublicTourAvailability(
  tourPackageId: string,
  rawSlots: unknown,
  nowMs: number,
  liveOriginal: number | null = null,
): PublicTourAvailability {
  const slots: PublicSlot[] = (Array.isArray(rawSlots) ? (rawSlots as RawDoc[]) : [])
    .map((s) => {
      const state = publicState(s, nowMs);
      const discountGBP = num(s.discountGBP);
      const salePrice =
        state !== "sold" && liveOriginal !== null
          ? Math.max(0, Math.round((liveOriginal - discountGBP) * 100) / 100)
          : num(s.salePrice);
      return { index: num(s.index), salePrice, discountGBP, state };
    })
    .sort((a, b) => a.index - b.index);
  const free = slots.filter((s) => s.state === "available");
  return {
    tourPackageId,
    slots,
    left: free.length,
    onHold: slots.filter((s) => s.state === "on_hold").length,
    nextPrice: free[0]?.salePrice ?? null,
  };
}

/**
 * Whether the site-wide Black Friday nav item and promo strip should show:
 * only while the sale is public (live or paused). Draft or ended hides them,
 * so the nav never links to a 404. Errors hide them too.
 */
export const isSalePublic = cache(async (slug: string): Promise<boolean> => {
  try {
    const { adminDb } = await import("@/lib/firebase-admin");
    const q = await adminDb.collection(SALE_COLLECTION).where("slug", "==", slug).limit(1).get();
    const status = q.empty ? null : q.docs[0]!.get("status");
    return status === "live" || status === "paused";
  } catch (e) {
    console.error("[sale] promo state lookup failed", e);
    return false;
  }
});

/** Cached per request so generateMetadata and the page share one read. */
export const getSalePageData = cache(async (slug: string): Promise<SaleLoadResult> => {
  return loadSale("slug", slug, { allowDraft: false });
});

/**
 * Private preview (admin "Preview" link): finds the sale by its secret
 * preview token, in any status, draft included. The page renders it noindex
 * with booking disabled.
 */
export const getSalePreviewData = cache(async (token: string): Promise<SaleLoadResult> => {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return { kind: "not_found" };
  return loadSale("previewToken", token, { allowDraft: true });
});

async function loadSale(
  field: "slug" | "previewToken",
  value: string,
  opts: { allowDraft: boolean },
): Promise<SaleLoadResult> {
  const slug = field === "slug" ? value : "";
  try {
    const { adminDb } = await import("@/lib/firebase-admin");
    const q = await adminDb.collection(SALE_COLLECTION).where(field, "==", value).limit(1).get();
    if (q.empty) return { kind: "not_found" };
    const doc = q.docs[0]!;
    const raw = doc.data() as RawDoc;

    const status = STATUSES.includes(raw.status as SaleStatus)
      ? (raw.status as SaleStatus)
      : "draft";
    if (status === "draft" && !opts.allowDraft) return { kind: "not_found" };

    const rawTours = (Array.isArray(raw.tours) ? (raw.tours as RawDoc[]) : [])
      .filter((t) => typeof t.tourPackageId === "string" && t.tourPackageId)
      .sort((a, b) => num(a.order) - num(b.order));

    const [invSnap, presentation] = await Promise.all([
      doc.ref.collection(INVENTORY_SUBCOLLECTION).get(),
      import("@/lib/tours-firestore")
        .then((m) => m.getTourCardPresentationByIds(rawTours.map((t) => str(t.tourPackageId))))
        .catch((e) => {
          console.error("[sale] tour presentation lookup failed", e);
          return {} as Record<string, TourCardPresentation>;
        }),
    ]);

    const now = Date.now();
    const slotsById = new Map(invSnap.docs.map((d) => [d.id, d.get("slots") as unknown]));

    const tours: SalePageTour[] = rawTours.map((t) => {
      const id = str(t.tourPackageId);
      const p = presentation[id];
      return {
        tourPackageId: id,
        tourSlug: str(t.tourSlug) || p?.slug || "",
        // Card title is the tour's current name (falls back to the saved snapshot).
        displayName: p?.name || str(t.tourName) || str(t.displayName) || "Tour",
        tourName: str(t.tourName) || p?.name || "",
        // Live tour price, so the sale follows price changes (stored snapshot as fallback).
        originalPrice: p?.originalPrice ?? num(t.originalPrice),
        coverImage: str(t.coverImage) || p?.coverImage || FALLBACK_IMAGE,
        order: num(t.order),
        durationLabel: p?.durationLabel ?? "",
        routeLabel: p?.routeLabel ?? "",
        depositGBP: p?.deposit ?? null,
        hasDetailsPage: p?.published ?? false,
      };
    });

    const startAt = toIso(raw.startAt);
    const endAt = toIso(raw.endAt);
    const hero = (raw.hero ?? {}) as RawDoc;
    const seo = (raw.seo ?? {}) as RawDoc;

    return {
      kind: "ok",
      sale: {
        saleId: doc.id,
        slug: str(raw.slug, slug),
        name: str(raw.name, "Black Friday Sale"),
        status,
        startAt,
        endAt,
        holdMinutes: num(raw.holdMinutes, 15) || 15,
        checkoutMode: (raw.checkoutMode === "manual" ? "manual" : "auto") as SaleCheckoutMode,
        hero: {
          title: str(hero.title) || str(raw.name, "Black Friday Sale"),
          subtitle: str(hero.subtitle),
          bannerUrl: str(hero.bannerUrl) || undefined,
          mobileBannerUrl: str(hero.mobileBannerUrl) || undefined,
        },
        seo: {
          title: str(seo.title) || undefined,
          description: str(seo.description) || undefined,
          ogImage: str(seo.ogImage) || undefined,
        },
        tours,
        availability: {
          saleId: doc.id,
          status,
          isOpen: isSaleOpen(status, toMs(raw.startAt), toMs(raw.endAt), now),
          serverNow: new Date(now).toISOString(),
          tours: tours.map((t) =>
            toPublicTourAvailability(
              t.tourPackageId,
              slotsById.get(t.tourPackageId),
              now,
              presentation[t.tourPackageId]?.originalPrice ?? null,
            ),
          ),
        },
      },
    };
  } catch (e) {
    console.error("[sale] failed to load sale page data", e);
    return { kind: "unavailable" };
  }
}
