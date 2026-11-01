/**
 * Public sale shapes used by the www sale page.
 *
 * Mirrors the public contract of the admin sale API
 * (admin/client/src/types/sale-events.ts — PublicSaleAvailability, SaleHoldView).
 * Timestamps are ISO strings. Nothing here carries holder data: the page only
 * ever sees slot states, never who holds them.
 */

export type SaleStatus = "draft" | "live" | "paused" | "ended";
export type SaleCheckoutMode = "auto" | "manual";
export type PublicSlotState = "available" | "on_hold" | "sold";

export interface PublicSlot {
  index: number; // 1-based position on the ladder
  salePrice: number;
  discountGBP: number;
  state: PublicSlotState;
}

export interface PublicTourAvailability {
  tourPackageId: string;
  slots: PublicSlot[];
  left: number;
  onHold: number;
  nextPrice: number | null;
}

export interface PublicSaleAvailability {
  saleId: string;
  status: SaleStatus;
  isOpen: boolean;
  tours: PublicTourAvailability[];
  serverNow: string;
}

export interface SaleHoldView {
  holdId: string;
  saleId: string;
  saleName: string;
  saleSlug: string;
  checkoutMode: SaleCheckoutMode;
  tourPackageId: string;
  tourSlug: string;
  tourName: string;
  displayName: string;
  partySize: number;
  slots: {
    index: number;
    salePrice: number;
    originalPrice: number;
    paymentLinkUrl?: string | null;
  }[];
  status: "active" | "converted" | "expired" | "released" | "conflict";
  paying: boolean;
  /** What the countdown shows; the server keeps the hold a little longer. */
  displayExpiresAt: string;
  expiresAt: string;
  serverNow: string;
}

/** One tour card on the sale page: sale config + tour presentation data. */
export interface SalePageTour {
  tourPackageId: string;
  tourSlug: string;
  displayName: string;
  tourName: string;
  originalPrice: number;
  coverImage: string;
  order: number;
  /** e.g. "11 Days" */
  durationLabel: string;
  /** e.g. "Manila → Port Barton → El Nido" */
  routeLabel: string;
  /** Reservation fee per person, GBP: the lowest across upcoming dates. */
  depositGBP: number | null;
  /** Fee depends on the travel date, so depositGBP is a "from" amount. */
  depositVaries?: boolean;
  /** False for draft tours: on sale, but no public tour page to link to. */
  hasDetailsPage: boolean;
  /** Dates have different prices: shown prices are "from" the cheapest date. */
  pricesVary?: boolean;
  /** Upcoming dates left out of the sale (UTC ISO days): regular price only. */
  excludedDates?: string[];
}

export interface SalePageData {
  saleId: string;
  slug: string;
  name: string;
  status: SaleStatus;
  startAt: string | null;
  endAt: string | null;
  holdMinutes: number;
  checkoutMode: SaleCheckoutMode;
  hero: {
    title: string;
    subtitle: string;
    bannerUrl?: string;
    mobileBannerUrl?: string;
  };
  /** Search / link-share overrides set in admin; blanks fall back to the hero. */
  seo: { title?: string; description?: string; ogImage?: string };
  tours: SalePageTour[];
  /** Availability computed at render time (ISR); the client refreshes it. */
  availability: PublicSaleAvailability;
}

/** Claim API error codes the page handles explicitly. */
export type ClaimErrorCode =
  | "not_enough_slots"
  | "slots_changed"
  | "sale_closed"
  | "hold_in_payment"
  | "rate_limited"
  | "invalid_request"
  | "sale_not_found"
  | "tour_not_in_sale"
  | "network"
  | "unknown";
