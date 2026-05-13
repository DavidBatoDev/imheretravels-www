/**
 * All dynamic content for the "Travel with Dev" resident host page.
 * Imported by data/hosts.ts to build the Dev host entry.
 */

export const devSlug = "dev";
export const devDisplayName = "Dev";
export const devPageTitle = "Travel with Dev";
export const devInstagram = "dev_skehan";

export const devProfileImage =
  "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1777891757001_652874611_18570825235025847_3768940051839134984_n.jpg?alt=media&token=8a465834-6fb5-4f6f-8776-670a2093074f";

export const devHeroImage =
  "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1777899796799_Frame%20201%20(1).png?alt=media&token=46bc3d00-8577-494f-9d87-c6865d65e328";

export const devHeroImageAlt = "Dev's group travel adventures";

export const devMeta = {
  title: "Travel with Dev | I'm Here Travels",
  description:
    "Join Dev on her group trips designed to bring her community together through travel. Cultural experiences, adventure-filled itineraries, and meaningful connections.",
};

export const devIntro = [
  "Join Dev on her group trips designed to bring her community together through travel.",
  "Dev has been hosting with us since 2024 and has successfully led multiple sold-out trips — creating unforgettable experiences and strong connections within her community.",
  "From cultural experiences to adventure-filled itineraries, each trip is designed to create meaningful connections, lasting memories, and real shared experiences.",
  "Whether you're joining solo or with friends, you'll be part of a welcoming group that travels with intention.",
];

export const devUpcomingTrips = [
  {
    name: "India Holi + Yoga with Dev",
    dates: "March 19, 2027",
    image: "/images/wp-content/uploads/2025/01/india-header-2.webp",
    imageAlt: "India Holi Festival Tour",
    duration: "13 Days and 12 Nights",
    description: "Explore India's vibrant culture, ancient wonders, and the stunning colors of the Holi Festival.",
    price: "GBP £1,299",
  },
  {
    name: "PH Sunrise & Sunset",
    dates: "TBA",
    image: "/tours/philippine-sunrise/hero-1.jpg",
    imageAlt: "Philippines Sunrise & Sunset",
  },
  {
    name: "Brazil",
    dates: "TBA",
    image: "/images/wp-content/uploads/2025/07/brazil-trip-highlight-1.webp",
    imageAlt: "Brazil's Treasures",
  },
];

export const devWhyTravel = [
  "End-to-end planning — we handle everything",
  "Trusted local teams and guides",
  "Carefully curated, experience-first itineraries",
  "Strong community-focused trips",
  "Available on-ground support",
];

export const devWhyTravelNotes = [
  "A single, coordinated plan keeps the trip feeling smooth from first enquiry to departure.",
  "Local teams bring practical knowledge and on-the-ground context that generic planning cannot replace.",
  "Curated itineraries keep the best parts front and center instead of stretching the schedule thin.",
  "Community-led travel works best when the group vibe is intentional, welcoming, and easy to join.",
  "Support matters most when plans change, so help stays close throughout the trip.",
];

export const devHowItWorks = [
  "Choose your host & trip",
  "Secure your spot with a deposit",
  "Pay in installments up to 4 times",
  "Travel and meet your community",
];

export const devGalleryImages = [
  { src: "/images/wp-content/uploads/2025/01/india-triphighlight-1.webp", alt: "India Holi Festival" },
  { src: "/images/wp-content/uploads/2025/01/india-day-5.webp",          alt: "India Holi Festival" },
  { src: "/tours/philippine-sunrise/community-1.jpg",                     alt: "Philippines Sunrise" },
  { src: "/tours/philippine-sunrise/community-3.jpg",                     alt: "Philippines Sunrise" },
  { src: "/images/wp-content/uploads/2025/07/brazil-trip-highlight-2.webp", alt: "Brazil's Treasures" },
  { src: "/images/wp-content/uploads/2025/07/brazil-day-3.webp",         alt: "Brazil's Treasures" },
];

/* -------------------------------------------------------------------------- */
/* Gallery — masonry columns                                                    */
/* -------------------------------------------------------------------------- */

export type GalleryMediaItem = {
  seq: number;
  type: "photo" | "video" | "placeholder";
  size: "tall" | "short";
  src?: string;
  alt?: string;
  objectPosition?: string;
};

/* -------------------------------------------------------------------------- */
/* Gallery slides — 3 sets of 4 columns each                                  */
/* devGallerySlides[0] = Slide 1, [1] = Slide 2, [2] = Slide 3               */
/* -------------------------------------------------------------------------- */

const slide1: GalleryMediaItem[][] = [
  // ── Column 1 ──────────────────────────────────────────────
  [
    {
      seq: 1,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778480553191_image00024.jpeg?alt=media&token=5c2d1dc9-12a8-47e7-9940-c0f419c789d4",
      alt: "Group trip moment",
    },
    {
      seq: 9,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778490701001_image00025%201.png?alt=media&token=0508d7bb-8113-4fc4-b815-f567f39f1046",
      alt: "Group trip moment",
    },
    {
      seq: 5,
      type: "photo",
      size: "short",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778490697358_image00011%201.png?alt=media&token=93862b60-9c91-441e-823a-fcd3a4bde730",
      alt: "Group trip moment",
    },
  ],

  // ── Column 2 ──────────────────────────────────────────────
  [
    {
      seq: 8,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778480534121_image00014.jpeg?alt=media&token=531c799b-ae81-4fe8-a073-af5184b3b062",
      alt: "Group trip moment",
    },
    {
      seq: 2,
      type: "photo",
      size: "short",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778480549820_image00023.jpeg?alt=media&token=63739dbd-cc0b-40d8-b3b6-d5531a9e8629",
      alt: "Group trip moment",
    },
    {
      seq: 12,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778480574602_image00016.jpeg?alt=media&token=5054a637-2a0a-421e-9623-3b73d3be642d",
      alt: "Group trip moment",
    },
  ],

  // ── Column 3 ──────────────────────────────────────────────
  [
    {
      seq: 11,
      type: "photo",
      size: "short",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778480540490_image00018.jpeg?alt=media&token=ffa89d46-acca-403e-a071-633a83e99b3f",
      alt: "Group trip moment",
    },
    {
      seq: 10,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778480582720_image00021.jpeg?alt=media&token=a87fff45-b982-4554-a8a9-85f7b4109862",
      alt: "Group trip moment",
    },
    {
      seq: 6,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778480578635_image00017.jpeg?alt=media&token=e6198d36-1cba-4583-9f2b-5bd31b006b8c",
      alt: "Group trip moment",
    },
  ],

  // ── Column 4 ──────────────────────────────────────────────
  [
    {
      seq: 4,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778480537572_image00015.jpeg?alt=media&token=fa2033d8-d0d2-4891-8b8e-787bbf84884f",
      alt: "Group trip moment",
    },
    {
      seq: 7,
      type: "photo",
      size: "short",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778480543437_image00019.jpeg?alt=media&token=771caa67-5ac8-4dbb-a4c4-d2827f8d5613",
      alt: "Group trip moment",
    },
    {
      seq: 3,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778480568133_image00007.jpeg?alt=media&token=8288b151-4c9b-4601-9604-0ba13b81ab9c",
      alt: "Group trip moment",
    },
  ],
];

const slide2: GalleryMediaItem[][] = [
  // ── Column 1 ──────────────────────────────────────────────
  [
    {
      seq: 1,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1777891784535_frame.png?alt=media&token=4b97cf80-63a2-4fae-81ea-42560e517455",
      alt: "Group trip moment",
    },
    {
      seq: 9,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778480527071_image00012.jpeg?alt=media&token=4fa37648-b053-4c83-bf12-67f50e0e6fbc",
      alt: "Group trip moment",
    },
    {
      seq: 5,
      type: "photo",
      size: "short",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1777891735622_2e4f3d29-5be7-4465-89aa-f6f33493fd64.jpg?alt=media&token=c17f0121-c04b-4301-b8bb-0910fcdfe936",
      alt: "Group trip moment",
    },
  ],
  // ── Column 2 ──────────────────────────────────────────────
  [
    {
      seq: 8,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778480560219_image00001.jpeg?alt=media&token=c8e8bb88-967f-4390-aa02-949133af0898",
      alt: "Group trip moment",
    },
    {
      seq: 2,
      type: "photo",
      size: "short",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1777896787661_frame%20(2).png?alt=media&token=de8ba2d5-e3ff-411d-8050-e8017b64ce4b",
      alt: "Group trip moment",
    },
    {
      seq: 12,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1777891752929_98c9d811-9e55-478c-99ee-e238b55f23d8.jpg?alt=media&token=211ec8bd-c10b-4d97-ad1d-3a56820deb2a",
      alt: "Group trip moment",
    },
  ],
  // ── Column 3 ──────────────────────────────────────────────
  [
    {
      seq: 11,
      type: "photo",
      size: "short",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1777891748548_08.png?alt=media&token=2d20d3d7-eaea-4949-a3a9-c62971286cbc",
      alt: "Group trip moment",
    },
    {
      seq: 10,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1777896783964_frame%20(1).png?alt=media&token=7b2f8863-e6ce-4bbe-80a0-dba31367daa3",
      alt: "Group trip moment",
    },
    {
      seq: 6,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1777891730097_2c35b783-d3a9-4a87-a6d7-c451e1c7ac07.jpg?alt=media&token=aed7bf06-c9c7-40b2-8594-a2ed9fed48fb",
      alt: "Group trip moment",
    },
  ],
  // ── Column 4 ──────────────────────────────────────────────
  [
    {
      seq: 4,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1777891770252_frame%20(3).png?alt=media&token=bd3709b8-1ce7-4841-8fb6-ce0887c65721",
      alt: "Group trip moment",
    },
    {
      seq: 7,
      type: "photo",
      size: "short",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778480530387_image00013.jpeg?alt=media&token=e403474c-26fa-494c-a596-98fb082e4516",
      alt: "Group trip moment",
    },
    {
      seq: 3,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778480509258_image00002.jpeg?alt=media&token=635e44f6-bdf5-4ee6-a0b9-1b7845ae26d9",
      alt: "Group trip moment",
    },
  ],
];

const slide3: GalleryMediaItem[][] = [
  // ── Column 1 ──────────────────────────────────────────────
  [
    {
      seq: 1,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778489293738_07.png?alt=media&token=962f1741-3529-4e92-9953-2d66627320e3",
      alt: "Group trip moment",
    },
    {
      seq: 9,
      type: "video",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/videos%2F1777891757301_e8c841a0-ba11-449c-8349-f6c8b3fc35ee.mp4?alt=media&token=39dc8866-a5b0-4573-9ecb-26261a226889",
    },
    {
      seq: 5,
      type: "photo",
      size: "short",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778480571836_image00010.jpeg?alt=media&token=4072f961-1dee-44b5-9d5e-53d5e6dfd8cd",
      alt: "Group trip moment",
    },
  ],
  // ── Column 2 ──────────────────────────────────────────────
  [
    {
      seq: 8,
      type: "video",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/videos%2F1777898934156_38dd363d-7cd1-400b-92fd-6120218a00fb.mp4?alt=media&token=88db3ec6-0470-437d-86ae-31ca115c8899",
    },
    {
      seq: 2,
      type: "photo",
      size: "short",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778489370757_image00005.jpeg?alt=media&token=0b1427ab-6f05-4635-bbc7-8e0b477c212e",
      alt: "Group trip moment",
    },
    {
      seq: 12,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778480509258_image00002.jpeg?alt=media&token=635e44f6-bdf5-4ee6-a0b9-1b7845ae26d9",
      alt: "Group trip moment",
    },
  ],
  // ── Column 3 ──────────────────────────────────────────────
  [
    {
      seq: 11,
      type: "photo",
      size: "short",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778480521068_image00009.jpeg?alt=media&token=649671e5-2e17-4089-b8ce-f6dcc35cd1a0",
      alt: "Group trip moment",
    },
    {
      seq: 10,
      type: "video",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/videos%2F1777888423053_WhatsApp%20Video%202026-05-04%20at%205.10.08%20PM.mp4?alt=media&token=7fc9d547-5c1b-4782-a713-0d6d53dd0625",
    },
    {
      seq: 6,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778480563797_image00006.jpeg?alt=media&token=de14e134-6128-485d-b1e8-794287d69cc0",
      alt: "Group trip moment",
    },
  ],
  // ── Column 4 ──────────────────────────────────────────────
  [
    {
      seq: 4,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1777891752929_98c9d811-9e55-478c-99ee-e238b55f23d8.jpg?alt=media&token=211ec8bd-c10b-4d97-ad1d-3a56820deb2a",
      alt: "Group trip moment",
    },
    {
      seq: 7,
      type: "photo",
      size: "short",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778480546594_image00022.jpeg?alt=media&token=307509f9-6a4b-447b-b402-b4bed685ce6b",
      alt: "Group trip moment",
    },
    {
      seq: 3,
      type: "photo",
      size: "tall",
      src: "https://firebasestorage.googleapis.com/v0/b/imheretravels-a3f81.firebasestorage.app/o/images%2F1778480530387_image00013.jpeg?alt=media&token=e403474c-26fa-494c-a596-98fb082e4516",
      alt: "Group trip moment",
    },
  ],
];

export const devGallerySlides: GalleryMediaItem[][][] = [slide1, slide2, slide3];

/** @deprecated use devGallerySlides[0] — kept for any legacy references */
export const devGalleryColumns = slide1;
