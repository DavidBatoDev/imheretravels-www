/**
 * All dynamic content for the "Travel with Roxana" resident host page.
 * Imported by data/hosts.ts to build the Roxana host entry.
 */

import type { GalleryMediaItem } from "./travelWithDev";

export const roxanaSlug = "roxana";
export const roxanaDisplayName = "Roxana";
export const roxanaPageTitle = "Travel with Roxana";
export const roxanaInstagram = "roxadventures";

export const roxanaProfileImage = "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1779422919871_455866158_898344442182543_3439868931459199326_n.jpg?alt=media&token=ae0c5325-23a9-46f2-9c4c-28cd4402b5ae";

export const roxanaHeroImage = "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1779422767288_Roxana%20Banner.png?alt=media&token=b1d5f387-3961-4098-b03e-28b28c95d6b5";

export const roxanaHeroImageAlt = "Roxana's group travel adventures";

export const roxanaMeta = {
  title: "Travel with Roxana | I'm Here Travels",
  description:
    "Join Roxana on her group trips designed to bring her community together through travel. Cultural experiences, adventure-filled itineraries, and meaningful connections.",
};

export const roxanaIntro = [
  "Roxana is a passionate traveller who believes the best adventures are the ones shared with great people.",
  "With a love for discovering new cultures, hidden gems, and authentic local experiences, she curates trips that go beyond the tourist trail.",
  "Each journey is thoughtfully planned to balance exploration and relaxation — so you can fully immerse yourself without the stress of organising it all yourself.",
  "Whether you're a solo traveller or coming with a friend, you'll feel right at home in Roxana's group.",
];

export const roxanaUpcomingTrips = [
  {
    name: "Philippines Sunset with Roxana",
    dates: "Feb 18–28, 2027",
    image: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778651079825_1000040796.jpg?alt=media&token=1099185a-dabe-4532-83d1-8c25a9afc472",
    imageAlt: "Philippines Sunset with Roxana",
    duration: "11 Days and 10 Nights",
    description: "Manila, Port Barton, El Nido, and Isla Darocotan with island hopping, snorkeling, and sunset experiences.",
    price: "GBP £1,199",
    priceNote: "£1,199 for first 8 pax, £1,299 after",
    tourSlug: "philippine-sunset-with-roxana",
  },
];

export const roxanaWhyTravel = [
  "End-to-end planning — we handle everything",
  "Trusted local teams and guides",
  "Carefully curated, experience-first itineraries",
  "Strong community-focused trips",
  "Available on-ground support",
];

export const roxanaWhyTravelNotes = [
  "A single, coordinated plan keeps the trip feeling smooth from first enquiry to departure.",
  "Local teams bring practical knowledge and on-the-ground context that generic planning cannot replace.",
  "Curated itineraries keep the best parts front and center instead of stretching the schedule thin.",
  "Community-led travel works best when the group vibe is intentional, welcoming, and easy to join.",
  "Support matters most when plans change, so help stays close throughout the trip.",
];

export const roxanaHowItWorks = [
  "Choose your host & trip",
  "Secure your spot with a deposit",
  "Pay in installments up to 4 times",
  "Travel and meet your community",
];

export const roxanaGalleryImages: { src: string; alt: string }[] = [
  { src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1779422260770_WhatsApp%20Image%202026-05-21%20at%2010.14.06%20PM.jpeg?alt=media&token=98166b96-f5a0-4b87-be11-1f77179c2460", alt: "Group trip moment" },
  { src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1779422264587_WhatsApp%20Image%202026-05-21%20at%2010.14.07%20PM.jpeg?alt=media&token=6e6fa456-6cfe-4d7e-b31f-1072c2b05427", alt: "Group trip moment" },
  { src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1779422291926_WhatsApp%20Image%202026-05-21%20at%2010.14.15%20PM.jpeg?alt=media&token=257486ef-5756-450e-9684-05e250d2c1af", alt: "Group trip moment" },
  { src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1779422275499_WhatsApp%20Image%202026-05-21%20at%2010.14.10%20PM.jpeg?alt=media&token=43424dca-ef2f-462e-8531-1cba5520abd8", alt: "Group trip moment" },
  { src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1779422267410_WhatsApp%20Image%202026-05-21%20at%2010.14.08%20PM%20(1).jpeg?alt=media&token=598e5918-7943-44ea-89ab-e4520cb13998", alt: "Group trip moment" },
  { src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1779422272770_WhatsApp%20Image%202026-05-21%20at%2010.14.09%20PM.jpeg?alt=media&token=18e2b109-905c-4841-b224-013a8c0c59b2", alt: "Group trip moment" },
];

/* -------------------------------------------------------------------------- */
/* Gallery — masonry columns                                                    */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Gallery slides — 3 sets of 4 columns each                                  */
/* roxanaGallerySlides[0] = Slide 1, [1] = Slide 2, [2] = Slide 3            */
/* -------------------------------------------------------------------------- */

const slide1: GalleryMediaItem[][] = [
  // ── Column 1 — images 1, 5, 9 ─────────────────────────────
  [
    {
      seq: 1,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1779422260770_WhatsApp%20Image%202026-05-21%20at%2010.14.06%20PM.jpeg?alt=media&token=98166b96-f5a0-4b87-be11-1f77179c2460",
      alt: "Group trip moment",
    },
    {
      seq: 5,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1779422267410_WhatsApp%20Image%202026-05-21%20at%2010.14.08%20PM%20(1).jpeg?alt=media&token=598e5918-7943-44ea-89ab-e4520cb13998",
      alt: "Group trip moment",
    },
    {
      seq: 9,
      type: "photo",
      size: "short",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1779422283599_WhatsApp%20Image%202026-05-21%20at%2010.14.13%20PM.jpeg?alt=media&token=3d75cf1d-4672-47b9-a068-153a9670d43a",
      alt: "Group trip moment",
    },
  ],

  // ── Column 2 — images 2, 6, 10 ────────────────────────────
  [
    {
      seq: 2,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1779422264587_WhatsApp%20Image%202026-05-21%20at%2010.14.07%20PM.jpeg?alt=media&token=6e6fa456-6cfe-4d7e-b31f-1072c2b05427",
      alt: "Group trip moment",
    },
    {
      seq: 6,
      type: "photo",
      size: "short",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1779422272770_WhatsApp%20Image%202026-05-21%20at%2010.14.09%20PM.jpeg?alt=media&token=18e2b109-905c-4841-b224-013a8c0c59b2",
      alt: "Group trip moment",
    },
    {
      seq: 10,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1779422278157_WhatsApp%20Image%202026-05-21%20at%2010.14.11%20PM.jpeg?alt=media&token=c744d1bd-9199-4d8f-aae1-cf03364a34b4",
      alt: "Group trip moment",
    },
  ],

  // ── Column 3 — images 3, 7, 11 ────────────────────────────
  [
    {
      seq: 3,
      type: "photo",
      size: "short",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1779422291926_WhatsApp%20Image%202026-05-21%20at%2010.14.15%20PM.jpeg?alt=media&token=257486ef-5756-450e-9684-05e250d2c1af",
      alt: "Group trip moment",
    },
    {
      seq: 7,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1779422289158_WhatsApp%20Image%202026-05-21%20at%2010.14.14%20PM.jpeg?alt=media&token=b22c71e5-6b62-4400-852b-d95d9ce039df",
      alt: "Group trip moment",
    },
    {
      seq: 11,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1779422286313_WhatsApp%20Image%202026-05-21%20at%2010.14.14%20PM%20(1).jpeg?alt=media&token=1e72738d-4229-4d28-a3df-41c9d00441b8",
      alt: "Group trip moment",
    },
  ],

  // ── Column 4 — images 4, 8, 12 ────────────────────────────
  [
    {
      seq: 4,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1779422275499_WhatsApp%20Image%202026-05-21%20at%2010.14.10%20PM.jpeg?alt=media&token=43424dca-ef2f-462e-8531-1cba5520abd8",
      alt: "Group trip moment",
    },
    {
      seq: 8,
      type: "photo",
      size: "short",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1779422280918_WhatsApp%20Image%202026-05-21%20at%2010.14.12%20PM.jpeg?alt=media&token=e18dcd4c-b1ed-46fe-92fb-81f4529737b5",
      alt: "Group trip moment",
    },
    {
      seq: 12,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1779422270139_WhatsApp%20Image%202026-05-21%20at%2010.14.08%20PM.jpeg?alt=media&token=6ef6c563-016e-4500-a5ab-1be79f50ea5d",
      alt: "Group trip moment",
    },
  ],
];

export const roxanaGallerySlides: GalleryMediaItem[][][] = [slide1];
