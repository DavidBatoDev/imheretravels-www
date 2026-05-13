/**
 * All dynamic content for the "Travel with Jess" resident host page.
 * Imported by data/hosts.ts to build the Jess host entry.
 *
 * NOTE: All images and text below are placeholders copied from Travel with Dev.
 *       Replace them with Jess's own photos, bio, and trip details.
 */

import { type GalleryMediaItem } from "./travelWithDev";

export type { GalleryMediaItem };

export const jessSlug = "jess";
export const jessDisplayName = "Jess";
export const jessPageTitle = "Travel with Jess";
export const jessInstagram = ""; // TODO: add Jess's Instagram handle

// TODO: replace with Jess's profile photo
export const jessProfileImage = "";

export const jessHeroImage =
  "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778651589630_Jess%20Banner.png?alt=media&token=091da76c-eecc-4fa2-b76f-9fef2d0910a7";

export const jessHeroImageAlt = "Jess's group travel adventures";

export const jessMeta = {
  title: "Travel with Jess | I'm Here Travels",
  description:
    "Join Jess on her group trips designed to bring her community together through travel. Cultural experiences, adventure-filled itineraries, and meaningful connections.",
};

// TODO: replace with Jess's own bio paragraphs
export const jessIntro = [
  "Join Jess on her group trips designed to bring her community together through travel.",
  "Jess has been hosting with us and has successfully led multiple sold-out trips — creating unforgettable experiences and strong connections within her community.",
  "From cultural experiences to adventure-filled itineraries, each trip is designed to create meaningful connections, lasting memories, and real shared experiences.",
  "Whether you're joining solo or with friends, you'll be part of a welcoming group that travels with intention.",
];

// TODO: replace with Jess's actual upcoming trips
export const jessUpcomingTrips = [
  {
    name: "Philippines Sunset Getaway",
    dates: "TBA",
    tourSlug: "philippine-sunset",
    image: "/images/wp-content/uploads/2024/05/philippinessunset-triphighlight-1.webp",
    imageAlt: "Philippines Sunset Getaway",
    duration: "11 Days and 10 Nights",
    description: "Manila, Port Barton, El Nido, and Isla Darocotan with island hopping, snorkeling, and sunset experiences.",
    price: "GBP £1,199",
  },
];

export const jessWhyTravel = [
  "End-to-end planning — we handle everything",
  "Trusted local teams and guides",
  "Carefully curated, experience-first itineraries",
  "Strong community-focused trips",
  "Available on-ground support",
];

export const jessHowItWorks = [
  "Choose your host & trip",
  "Secure your spot with a deposit",
  "Pay in installments up to 4 times",
  "Travel and meet your community",
];

// TODO: replace with Jess's own gallery photos
export const jessGalleryImages = [
  { src: "/images/wp-content/uploads/2025/01/india-triphighlight-1.webp", alt: "Trip moment" },
  { src: "/images/wp-content/uploads/2025/01/india-day-5.webp",          alt: "Trip moment" },
  { src: "/tours/philippine-sunrise/community-1.jpg",                     alt: "Trip moment" },
  { src: "/tours/philippine-sunrise/community-3.jpg",                     alt: "Trip moment" },
  { src: "/images/wp-content/uploads/2025/07/brazil-trip-highlight-2.webp", alt: "Trip moment" },
  { src: "/images/wp-content/uploads/2025/07/brazil-day-3.webp",         alt: "Trip moment" },
];

// Slide 1 only — 4 columns, 2 rows each.
// Row 1 (tall): images 1→4 left to right. Row 2 (short): images 5→8 left to right.
const jessSlide1: GalleryMediaItem[][] = [
  // ── Column 1 — img 1 (tall), img 5 (short) ───────────────
  [
    {
      seq: 1,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778651101402_Screenshot%202026-05-13%20134417.png?alt=media&token=d2057a66-9323-4760-8cb5-2b29b152f8eb",
      alt: "Group trip moment",
    },
    {
      seq: 5,
      type: "photo",
      size: "short",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778651084856_1000040797.jpg?alt=media&token=d71e2bd9-875a-4ad5-9ea9-33e4db749ce6",
      alt: "Group trip moment",
    },
  ],

  // ── Column 2 — img 2 (tall), img 6 (short) ───────────────
  [
    {
      seq: 2,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778651088765_1000040798.jpg?alt=media&token=858525f0-db69-4e1e-80c0-2a975267700c",
      alt: "Group trip moment",
    },
    {
      seq: 6,
      type: "photo",
      size: "short",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778651079825_1000040796.jpg?alt=media&token=1099185a-dabe-4532-83d1-8c25a9afc472",
      alt: "Group trip moment",
    },
  ],

  // ── Column 3 — img 3 (short), img 7 (tall) ───────────────
  [
    {
      seq: 3,
      type: "photo",
      size: "short",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778651097066_1000040800.jpg?alt=media&token=d5ee451c-933a-4fb4-a581-95d88901330e",
      alt: "Group trip moment",
    },
    {
      seq: 7,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778651093232_1000040799.jpg?alt=media&token=e8692e75-28c2-4358-af5e-79580b3956e0",
      alt: "Group trip moment",
    },
  ],

  // ── Column 4 — img 4 (tall), img 8 (short, crop top) ─────
  [
    {
      seq: 4,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778651084856_1000040797.jpg?alt=media&token=d71e2bd9-875a-4ad5-9ea9-33e4db749ce6",
      alt: "Group trip moment",
    },
    {
      seq: 8,
      type: "photo",
      size: "short",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778651088765_1000040798.jpg?alt=media&token=858525f0-db69-4e1e-80c0-2a975267700c",
      alt: "Group trip moment",
      objectPosition: "top",
    },
  ],
];

export const jessGallerySlides: GalleryMediaItem[][][] = [jessSlide1];
