/**
 * DEV-ONLY mock sale for visual QA of /black-friday (`?mock=1`).
 *
 * The page only calls this when NODE_ENV !== "production", so it can never be
 * served in production. Uses real dev tourPackage IDs so the tour
 * presentation lookup is exercised; falls back to static labels if Firestore
 * is unreachable.
 *
 * Query params (dev only): `status=live|paused|ended|upcoming`,
 * `mode=auto|manual`.
 */

import type { PublicSlotState, SalePageData, SalePageTour } from "./types";

type MockTour = {
  id: string;
  slug: string;
  displayName: string;
  originalPrice: number;
  ladder: number[];
  states: PublicSlotState[];
  fallback: { duration: string; route: string; cover: string; deposit: number };
};

const MOCK_TOURS: MockTour[] = [
  {
    id: "8Qz6WIMkBlvky3CLcnKK",
    slug: "argentinas-wonders",
    displayName: "Argentina",
    originalPrice: 2199,
    // The example ladder: 10 slots (10 people), slot 1 sold, slot 4 on hold.
    ladder: [500, 300, 300, 200, 200, 200, 100, 100, 100, 100],
    states: ["sold", "available", "available", "on_hold", "available", "available", "available", "available", "available", "available"],
    fallback: { duration: "11 Days", route: "Argentina", cover: "/figma/tour-philippines-sunrise.png", deposit: 300 },
  },
  {
    id: "ehPwLMq0SOsg6Rwx8IYH",
    slug: "japan-adventure-winter",
    displayName: "Japan Winter",
    originalPrice: 1999,
    ladder: [400, 300, 200, 200, 100, 100],
    states: ["available", "available", "available", "available", "available", "available"],
    fallback: { duration: "10 Days And 9 Nights", route: "Tokyo → Nagano", cover: "/figma/tour-philippines-sunrise.png", deposit: 300 },
  },
  {
    id: "9UYSC04riJFxCYpRditJ",
    slug: "maldives-bucketlist",
    displayName: "Maldives",
    originalPrice: 1400,
    ladder: [300, 200, 150, 100],
    states: ["sold", "sold", "sold", "available"],
    fallback: { duration: "8 Days And 7 Nights", route: "Hulhumale → Rasdhoo → Ukulhas", cover: "/figma/tour-philippines-sunrise.png", deposit: 300 },
  },
  {
    id: "cM62r2g8hgnYSaDxRVpr",
    slug: "tanzania-exploration",
    displayName: "Tanzania",
    originalPrice: 2049,
    ladder: [450, 300, 200, 100],
    states: ["sold", "sold", "sold", "sold"],
    fallback: { duration: "9 Nights And 10 Days", route: "Kilimanjaro → Arusha → Zanzibar", cover: "/figma/tour-philippines-sunrise.png", deposit: 300 },
  },
  {
    id: "yLA6kStX6XrIIj0FViUw",
    slug: "vietnam-expedition",
    displayName: "Vietnam",
    originalPrice: 1099,
    ladder: [250, 200, 150, 100],
    states: ["sold", "sold", "on_hold", "on_hold"],
    fallback: { duration: "11 Days", route: "Hanoi → Ninh Binh → Hue → Hoi An", cover: "/figma/tour-philippines-sunrise.png", deposit: 200 },
  },
  {
    id: "rvFdmGMSRh9ERBUqa4N3",
    slug: "philippine-sunrise",
    displayName: "Philippines Sunrise",
    originalPrice: 1199,
    ladder: [300, 200, 150, 100],
    states: ["sold", "sold", "available", "available"],
    fallback: { duration: "11 Days", route: "Cebu → Moalboal → Siargao", cover: "/figma/tour-philippines-sunrise.png", deposit: 200 },
  },
];

export async function getMockSalePageData(opts: {
  status?: string;
  mode?: string;
}): Promise<SalePageData> {
  let presentation: Record<string, { coverImage: string; durationLabel: string; routeLabel: string; deposit: number | null; name: string }> = {};
  try {
    const m = await import("@/lib/tours-firestore");
    presentation = await m.getTourCardPresentationByIds(MOCK_TOURS.map((t) => t.id));
  } catch {
    presentation = {};
  }

  const now = Date.now();
  const phase = opts.status ?? "live";
  const status =
    phase === "paused" ? "paused" : phase === "ended" ? "ended" : "live";
  const startAt = phase === "upcoming" ? new Date(now + 3 * 86_400_000).toISOString() : null;

  const tours: SalePageTour[] = MOCK_TOURS.map((t, i) => {
    const p = presentation[t.id];
    return {
      tourPackageId: t.id,
      tourSlug: t.slug,
      displayName: t.displayName,
      tourName: p?.name ?? t.displayName,
      originalPrice: t.originalPrice,
      coverImage: p?.coverImage ?? t.fallback.cover,
      order: i,
      durationLabel: p?.durationLabel ?? t.fallback.duration,
      routeLabel: p?.routeLabel ?? t.fallback.route,
      depositGBP: p?.deposit ?? t.fallback.deposit,
      hasDetailsPage: true,
    };
  });

  return {
    saleId: "mock-black-friday",
    slug: "black-friday",
    name: "Black Friday Sale",
    status,
    startAt,
    endAt: null,
    holdMinutes: 15,
    checkoutMode: opts.mode === "manual" ? "manual" : "auto",
    hero: {
      title: "Black Friday Sale",
      subtitle:
        "Our biggest savings of the year on small-group tours. Discounted slots per tour (one slot = one person), cheapest first — hold yours for 15 minutes while you book.",
    },
    seo: {},
    tours,
    availability: {
      saleId: "mock-black-friday",
      status,
      isOpen: status === "live" && !startAt,
      serverNow: new Date(now).toISOString(),
      tours: MOCK_TOURS.map((t) => {
        const slots = t.ladder.map((discountGBP, i) => ({
          index: i + 1,
          discountGBP,
          salePrice: t.originalPrice - discountGBP,
          state: t.states[i] ?? "available",
        }));
        const free = slots.filter((s) => s.state === "available");
        return {
          tourPackageId: t.id,
          slots,
          left: free.length,
          onHold: slots.filter((s) => s.state === "on_hold").length,
          nextPrice: free[0]?.salePrice ?? null,
        };
      }),
    },
  };
}
