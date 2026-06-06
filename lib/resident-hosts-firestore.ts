/**
 * Firestore-backed resident-host registry.
 *
 * Exposes the same public API as the static `data/hosts.ts` (getAllHosts /
 * getHostBySlug / getAllHostSlugs) but reads from the `residentHost` collection
 * authored in the admin. Functions are async and wrapped in React `cache()` so
 * a single Firestore read serves the whole build/request; pages control refresh
 * cadence with their own ISR `revalidate`.
 *
 * Requires `FIREBASE_SERVICE_ACCOUNT` (see lib/firebase-admin.ts). Server-only.
 */

import { cache } from "react";
import { adminDb } from "@/lib/firebase-admin";
import type { Host, HostTrip } from "@/data/hosts";
import type { GalleryMediaItem } from "@/data/travelWithDev";

const COLLECTION = "residentHost";

type RawDoc = Record<string, any>;

/**
 * The admin stores `gallerySlides` as array-of-maps ({ columns: { items: [] }[] }[])
 * because Firestore forbids nested arrays. Decode back to the [][][] shape the
 * www gallery components expect.
 */
function decodeGallerySlides(stored: any): GalleryMediaItem[][][] | undefined {
  if (!Array.isArray(stored) || stored.length === 0) return undefined;
  return stored.map((slide: any) => {
    if (slide && Array.isArray(slide.columns)) {
      return slide.columns.map((col: any) =>
        Array.isArray(col?.items) ? col.items : [],
      );
    }
    return Array.isArray(slide) ? slide : [];
  });
}

function toHost(raw: RawDoc): Host {
  const intro: string[] = Array.isArray(raw.intro) ? raw.intro : [];
  const heroImages: string[] | undefined =
    Array.isArray(raw.heroImages) && raw.heroImages.filter(Boolean).length === 3
      ? raw.heroImages
      : undefined;
  const pageTitle = raw.pageTitle ?? raw.displayName ?? "";

  return {
    slug: raw.slug ?? "",
    displayName: raw.displayName ?? "",
    pageTitle,
    heroImage: raw.heroImage ?? null,
    heroImages,
    heroImageAlt: raw.heroImageAlt ?? "",
    meta: {
      title: raw.seo?.title ?? `${pageTitle} | I'm Here Travels`,
      description: raw.seo?.description ?? intro[0] ?? "",
    },
    intro,
    upcomingTrips: (Array.isArray(raw.upcomingTrips)
      ? raw.upcomingTrips
      : []) as HostTrip[],
    whyTravel: Array.isArray(raw.whyTravel) ? raw.whyTravel : [],
    whyTravelNotes: Array.isArray(raw.whyTravelNotes)
      ? raw.whyTravelNotes
      : undefined,
    howItWorks: Array.isArray(raw.howItWorks) ? raw.howItWorks : [],
    galleryImages: Array.isArray(raw.galleryImages) ? raw.galleryImages : [],
    gallerySlides: decodeGallerySlides(raw.gallerySlides),
    profileImage: raw.profileImage || undefined,
    instagram: raw.instagram || undefined,
    comingSoon: raw.comingSoon ?? false,
  };
}

const fetchAllActiveHosts = cache(async (): Promise<Host[]> => {
  const snap = await adminDb
    .collection(COLLECTION)
    .where("status", "==", "active")
    .get();
  return snap.docs
    .map((d) => toHost({ id: d.id, ...d.data() }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
});

export async function getAllHosts(): Promise<Host[]> {
  return fetchAllActiveHosts();
}

export async function getHostBySlug(slug: string): Promise<Host | undefined> {
  const hosts = await fetchAllActiveHosts();
  return hosts.find((h) => h.slug === slug);
}

export async function getAllHostSlugs(): Promise<string[]> {
  const hosts = await fetchAllActiveHosts();
  return hosts.map((h) => h.slug);
}
