/**
 * Extract enrichment data from the www static tour files for the 048 migration.
 *
 * Usage (from www/web directory):
 *   npx tsx data/scripts/extract-enrichment-for-migration.ts \
 *     > ../../admin/client/migrations/048-tour-presentation-data.json
 *
 * Requires: `tsx` (devDependency or npx tsx)
 * The output JSON is consumed by admin/client/migrations/048-enrich-tour-presentation.ts
 */

import { getAllTours } from "@/data/tours";
import type { TourThingToKnow, TourTip } from "@/types/tour";

// ─── Default section detection ─────────────────────────────────────────────
// Sections that the generator injects for every tour are skipped in the output
// so the migration doesn't write redundant data to Firestore. The www transformer
// applies these defaults client-side when the Firestore field is absent.

const DEFAULT_THINGS_TO_KNOW_TITLES = new Set([
  "Travel Information",
  "General FAQs",
]);

const DEFAULT_TIP_TITLES = new Set([
  "Pack smart",
  "Travel insurance",
  "Beat the climate",
  "Respect local customs",
]);

function isDefaultThingsToKnow(items: TourThingToKnow[]): boolean {
  if (items.length !== 2) return false;
  return items.every((item) => DEFAULT_THINGS_TO_KNOW_TITLES.has(item.title));
}

function isDefaultTips(items: TourTip[]): boolean {
  if (items.length !== 4) return false;
  return items.every((item) => DEFAULT_TIP_TITLES.has(item.title));
}

// ─── Extraction ────────────────────────────────────────────────────────────

const enrichment: Record<string, unknown> = {};

for (const tour of getAllTours()) {
  const entry: Record<string, unknown> = {
    seo: { title: tour.meta.title, description: tour.meta.description },
  };

  if (tour.comingSoon) entry.comingSoon = true;
  if (tour.bookingSlug) entry.bookingSlug = tour.bookingSlug;

  const details: Record<string, unknown> = {};

  // Route — from Route key fact
  const routeFact = tour.keyFacts.find((f) => f.label === "Route");
  if (routeFact?.values[0]) details.route = routeFact.values[0];

  // Tags — stored as { label, icon } objects to match the www TourTag shape
  if (tour.header.tags?.length) {
    details.tags = tour.header.tags.map((t) => ({ label: t.label, icon: t.icon }));
  }

  // Inclusions (What's Included)
  if (tour.whatsIncluded?.items?.length) {
    details.inclusions = tour.whatsIncluded.items.map((item) => ({
      icon: item.icon,
      label: item.label,
      value: item.value,
    }));
  }

  // Accommodations (Where We Stay)
  if (tour.whereWeStay?.items?.length) {
    details.accommodations = tour.whereWeStay.items.map((item) => ({
      image: item.image,
      name: item.name,
      nights: item.nights,
    }));
  }

  // FAQs
  if (tour.faqs?.items?.length) {
    details.faqs = tour.faqs.items.map((item) => ({
      question: item.question,
      answer: item.answer,
    }));
  }

  // Things to Know — only when custom (not the 2-item generator default)
  if (
    tour.thingsToKnow?.items?.length &&
    !isDefaultThingsToKnow(tour.thingsToKnow.items)
  ) {
    details.thingsToKnow = tour.thingsToKnow.items.map((item) => ({
      icon: item.icon,
      title: item.title,
      description: item.description,
      ctaLabel: item.ctaLabel,
      ctaHref: item.ctaHref,
    }));
  }

  // Tips — only when custom (not the 4-item generator default)
  if (tour.tips?.items?.length && !isDefaultTips(tour.tips.items)) {
    details.tips = tour.tips.items.map((item) => ({
      icon: item.icon,
      title: item.title,
      description: item.description,
    }));
  }

  // Map
  if (tour.map) {
    details.map = {
      ...(tour.map.image ? { image: tour.map.image } : {}),
      ...(tour.map.embedUrl ? { embedUrl: tour.map.embedUrl } : {}),
    };
  }

  if (Object.keys(details).length) entry.details = details;

  // Per-day enrichment (image + accommodation / activities / meals detail rows)
  const dayEnrichment = tour.itinerary.days
    .filter((d) => d.image || d.details?.length)
    .map((d) => {
      const dayEntry: Record<string, unknown> = { day: d.dayNumber };
      if (d.image) dayEntry.image = d.image;

      for (const detail of d.details ?? []) {
        const lbl = detail.label.toLowerCase();
        if (lbl.includes("accommodation")) {
          dayEntry.accommodation = detail.value;
        } else if (lbl.includes("activit")) {
          dayEntry.activities = detail.value;
        } else if (lbl.includes("meal")) {
          dayEntry.meals = detail.value;
        }
      }
      return dayEntry;
    });

  if (dayEnrichment.length) entry.itineraryEnrichment = dayEnrichment;

  // Highlight subtitles — keyed by highlight title for matching
  const highlightSubtitles = (tour.tripHighlights?.items ?? [])
    .filter((h) => h.subtitle)
    .map((h) => ({ text: h.title, subtitle: h.subtitle! }));

  if (highlightSubtitles.length) entry.highlightSubtitles = highlightSubtitles;

  // Gallery thumbnails — src URLs for the thumbnail strip below the hero
  const thumbnails = (tour.gallery.thumbnails ?? []).map((t) => t.src).filter(Boolean);
  if (thumbnails.length) entry.gallery = { thumbnails };

  enrichment[tour.slug] = entry;
}

process.stdout.write(JSON.stringify(enrichment, null, 2) + "\n");
