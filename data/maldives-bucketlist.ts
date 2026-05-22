/**
 * Maldives Bucketlist — 9-day Hulhumale-to-Ukulhas island adventure.
 */
import type { Tour } from "@/types/tour";

export const maldivesBucketlist: Tour = {
  slug: "maldives-bucketlist",
  name: "Maldives Bucketlist",
  meta: {
    title: "9 Days | Maldives Bucketlist: Dive, Explore, Unwind",
    description:
      "Experience the Maldives Island Adventure! Explore bustling Male City, dive into coral reefs in Rasdhoo, and unwind on an uninhabited island paradise. From thrilling underwater adventures to sunset paddling and dolphin cruises, this trip is packed with unforgettable moments!",
  },
  gallery: {
    hero: "/tours/maldives-bucketlist/maldives-header-1.webp",
    heroAlt: "Maldives Bucketlist — crystal-clear waters and overwater bungalows",
    thumbnails: [
      { src: "/tours/maldives-bucketlist/maldives-header-2.webp", alt: "Maldives Bucketlist" },
      { src: "/tours/maldives-bucketlist/maldives-header-3.webp", alt: "Maldives Bucketlist" },
      { src: "/tours/maldives-bucketlist/maldives-header-4.webp", alt: "Maldives Bucketlist" },
      { src: "/tours/maldives-bucketlist/maldives-header-5.webp", alt: "Maldives Bucketlist" },
      { src: "/tours/maldives-bucketlist/maldives-header-6.webp", alt: "Maldives Bucketlist" },
      { src: "/tours/maldives-bucketlist/maldives-header-7.webp", alt: "Maldives Bucketlist" },
      { src: "/tours/maldives-bucketlist/maldives-header-8.webp", alt: "Maldives Bucketlist" },
    ],
  },
  header: {
    title: "9 Days | Maldives Bucketlist: Dive, Explore, Unwind",
    tags: [
      { label: "Maldives", icon: "location" },
    ],
    description:
      "Experience the Maldives Island Adventure! Explore bustling Male City, dive into coral reefs in Rasdhoo, and unwind on an uninhabited island paradise. From thrilling underwater adventures to sunset paddling and dolphin cruises, this trip is packed with unforgettable moments!",
  },
  keyFacts: [
    { icon: "days", label: "Tour Dates", values: ["November 9—17, 2024"] },
    { icon: "days", label: "Duration", values: ["9 Days and 8 Nights"] },
    {
      icon: "route",
      label: "Route",
      values: ["Hulhumale -> Rasdhoo -> Ukulhas"],
    },
    { icon: "people", label: "Group Size", values: ["Maximum 22 people"] },
  ],
  whatsIncluded: {
    heading: "What's Included",
    items: [
      {
        icon: "transport",
        label: "Transport",
        value: "Boat, Van, Plane",
      },
      {
        icon: "accommodation",
        label: "Accommodation",
        value: "Hotel (8 nights)",
      },
      {
        icon: "activities",
        label: "Activities",
        value: "Snorkeling, Diving, Stand Up Paddle Boarding",
      },
      {
        icon: "meals",
        label: "Meals",
        value: "8 Breakfasts, 2 Lunches, 6 Dinners",
      },
      {
        icon: "plus",
        label: "Add-on Activities",
        value: ["Fun Diving and Discovery Diving", "Lunch at Floating Resorts"],
      },
      {
        icon: "plus",
        label: "Others",
        value: [
          "24/7 customer experience assistance",
          "Airport and domestic transfer assistance",
          "One way transfer by scheduled public speedboat to Rasdhoo",
          "One way ferry transfer Rasdhoo — Ukulhas",
          "One way transfer by scheduled public speedboat to Male or private speedboat transfer to resort",
          "Tour Guide",
          "All Local Tax (10% service charge, 16% GST and $3 Green Tax per person per night)",
        ],
      },
    ],
  },
  tripHighlights: {
    heading: "Trip Highlights",
    items: [
      {
        image: "/tours/maldives-bucketlist/maldives-triphighlight-1.webp",
        imageAlt: "Silhouette of a paddleboarder at golden sunset on calm Maldives waters",
        title: "Sunset Paddle",
        subtitle: "Paddle under a colorful sunset",
      },
      {
        image: "/tours/maldives-bucketlist/maldives-triphighlight-2.webp",
        imageAlt: "Divers on a boat ready to snorkel the Maldives reefs",
        title: "Snorkeling",
        subtitle: "Enjoy the magical underwater world",
      },
      {
        image: "/tours/maldives-bucketlist/maldives-triphighlight-3.webp",
        imageAlt: "Aerial view of floating resort overwater bungalows in the Maldives",
        title: "Floating Resorts",
        subtitle: "Stunning ocean views and floating resorts",
      },
    ],
  },
  itinerary: {
    heading: "Itinerary",
    downloadLabel: "Download Itinerary",
    downloadHref: "",
    days: [
      {
        dayNumber: 1,
        title: "Arrival Bliss",
        description:
          "Touch down in paradise! As soon as you land at Male International Airport, your adventure kicks off. Our awesome tour leader will greet you and whisk you away to your guesthouse on Hulhumale, just 15 minutes away. Drop your bags, throw on some flip-flops, and hit the beach or explore local cafes. The excitement starts now!",
        image: "/tours/maldives-bucketlist/maldives-day-1.webp",
        imageAlt: "Arrival in Hulhumale, Maldives",
        details: [
          { icon: "accommodation", label: "Accommodation", value: "Ocean Grand" },
          { icon: "location", label: "Location", value: "Hulhumale" },
          { icon: "activities", label: "Activities", value: "Welcome Dinner" },
          { icon: "meals", label: "Meals", value: "1 Dinner" },
        ],
      },
      {
        dayNumber: 2,
        title: "Discover Male's Hidden Gems",
        description:
          "Get ready to dive into the vibrant culture of Male City! With our local guide leading the way, you'll explore bustling markets, the impressive President's Palace, and the historic Friday Mosque. Expect some secret spots that tourists usually miss — this is the real Maldives!",
        image: "/tours/maldives-bucketlist/maldives-day-2.webp",
        imageAlt: "Male City tour, Maldives",
        details: [
          { icon: "accommodation", label: "Accommodation", value: "Ocean Grand" },
          { icon: "location", label: "Location", value: "Hulhumale" },
          { icon: "activities", label: "Activities", value: "Whole day Male tour" },
          { icon: "meals", label: "Meals", value: "1 Breakfast, 1 Lunch" },
        ],
      },
      {
        dayNumber: 3,
        title: "Speedboat to Rasdhoo & Coral Reefs",
        description:
          "Rise and shine, it's time for an epic speedboat ride to Rasdhoo! This island is your gateway to some of the best dive sites in the Maldives. Snorkel or dive among stunning coral reefs and get up close with incredible marine life. Adventure awaits!",
        image: "/tours/maldives-bucketlist/maldives-day-3.webp",
        imageAlt: "Coral reef snorkeling in Rasdhoo",
        details: [
          { icon: "accommodation", label: "Accommodation", value: "Tranquila Maldives" },
          { icon: "location", label: "Location", value: "Rasdhoo" },
          { icon: "activities", label: "Activities", value: "Snorkeling" },
          { icon: "meals", label: "Meals", value: "1 Breakfast, 1 Dinner" },
        ],
      },
      {
        dayNumber: 4,
        title: "Dive, Explore, Repeat",
        description:
          "Calling all divers! Start your day early with a dive at Hammerhead Point or try a Discover Scuba Dive if you're new to the underwater world. Spend the afternoon exploring Rasdhoo with your guide, meeting locals, visiting the mosque, and tasting delicious 'hedika' at a cozy cafe.",
        image: "/tours/maldives-bucketlist/maldives-day-4.webp",
        imageAlt: "Island tour of Rasdhoo, Maldives",
        details: [
          { icon: "accommodation", label: "Accommodation", value: "Tranquila Maldives" },
          { icon: "location", label: "Location", value: "Rasdhoo" },
          { icon: "activities", label: "Activities", value: "Island Tour" },
          { icon: "meals", label: "Meals", value: "1 Breakfast, 1 Dinner" },
        ],
      },
      {
        dayNumber: 5,
        title: "Robinson Crusoe Day",
        description:
          "Escape to an uninhabited island for the ultimate castaway experience! Just a quick speedboat ride from Rasdhoo, this island paradise is perfect for sunbathing, snorkeling, and swimming in a clear blue lagoon. It's your own private slice of heaven!",
        image: "/tours/maldives-bucketlist/maldives-day-5.webp",
        imageAlt: "Uninhabited island day trip, Maldives",
        details: [
          { icon: "accommodation", label: "Accommodation", value: "Tranquila Maldives" },
          { icon: "location", label: "Location", value: "Rasdhoo" },
          { icon: "activities", label: "Activities", value: "Visit to Uninhabited Island, Snorkeling" },
          { icon: "meals", label: "Meals", value: "1 Breakfast, 1 Lunch" },
        ],
      },
      {
        dayNumber: 6,
        title: "Transfer to Ukulhas & Sunset Paddle",
        description:
          "Hop over to Ukulhas, an island famous for its stunning white sand beaches and vibrant house reef. Spend your day chilling or exploring, then join us for a magical sunset kayaking or SUP tour. Keep an eye out for eagle rays and sharks gliding beneath you — pure magic!",
        image: "/tours/maldives-bucketlist/maldives-day-6.webp",
        imageAlt: "Sunset paddle boarding in Ukulhas",
        details: [
          { icon: "accommodation", label: "Accommodation", value: "Ostrov" },
          { icon: "location", label: "Location", value: "Ukulhas" },
          { icon: "activities", label: "Activities", value: "Stand Up Paddle Boarding, Snorkeling" },
          { icon: "meals", label: "Meals", value: "1 Breakfast, 1 Dinner" },
        ],
      },
      {
        dayNumber: 7,
        title: "Sunset Cruise & Manta Rays",
        description:
          "Kick off the morning snorkeling among colorful coral reefs, with the chance to encounter majestic manta rays. Your guide will ensure a respectful and unforgettable experience. Later, set sail on a sunset cruise to hunt for dolphins. Watching them leap through the water is an absolute thrill!",
        image: "/tours/maldives-bucketlist/maldives-day-7.webp",
        imageAlt: "Manta ray snorkeling and sunset cruise, Ukulhas",
        details: [
          { icon: "accommodation", label: "Accommodation", value: "Ostrov" },
          { icon: "location", label: "Location", value: "Ukulhas" },
          { icon: "activities", label: "Activities", value: "Manta Ray Snorkeling Point and Sunset Cruise" },
          { icon: "meals", label: "Meals", value: "1 Breakfast, 1 Dinner" },
        ],
      },
      {
        dayNumber: 8,
        title: "Free Day or Whale Shark Hunt",
        description:
          "Today is all about choice — relax and soak up the sun or join an exhilarating tour to search for whale sharks. These gentle giants are seen year-round, and snorkeling alongside them is a bucket-list moment you'll never forget!",
        image: "/tours/maldives-bucketlist/maldives-day-8.webp",
        imageAlt: "Whale shark snorkeling, Ukulhas",
        details: [
          { icon: "accommodation", label: "Accommodation", value: "Ostrov" },
          { icon: "location", label: "Location", value: "Ukulhas" },
          { icon: "activities", label: "Activities", value: "Snorkeling" },
          { icon: "meals", label: "Meals", value: "1 Breakfast, 1 Dinner" },
        ],
      },
      {
        dayNumber: 9,
        title: "Farewell Maldives",
        description:
          "After a hearty breakfast, it's time to head back to Male on a public speedboat. Say goodbye to your new friends and this incredible island adventure. You'll leave with amazing memories and maybe a bit of a tan!",
        image: "/tours/maldives-bucketlist/maldives-day-9.webp",
        imageAlt: "Farewell Maldives departure",
        details: [
          { icon: "meals", label: "Meals", value: "1 Breakfast" },
        ],
      },
    ],
  },
  whereWeStay: {
    heading: "Where We Stay",
    items: [
      {
        image: "/tours/maldives-bucketlist/oceangrand-accommodation.webp",
        imageAlt: "Hotel Ocean Grand",
        name: "Hotel Ocean Grand",
        nights: "2 nights in Hotel",
      },
      {
        image: "/tours/maldives-bucketlist/tranquilamaldives-accommodation.webp",
        imageAlt: "Tranquila Maldives",
        name: "Tranquila Maldives",
        nights: "3 nights in Hotel",
      },
      {
        image: "/tours/maldives-bucketlist/ostrovhotel-accommodation.webp",
        imageAlt: "Ostrov Hotel",
        name: "Ostrov Hotel",
        nights: "3 nights in Hotel",
      },
    ],
  },
  faqs: {
    heading: "FAQs",
    items: [
      {
        question: "Where does the trip start & finish?",
        answer: "Male — Velana International Airport.",
      },
      {
        question: "Which airport do I need to fly into?",
        answer: "Male — Velana International Airport (MLE).",
      },
      {
        question: "What should I wear?",
        answer:
          "Cotton clothes suit the hot tropical climate. Tourists are expected to dress modestly on inhabited islands. Sandals are ideal as you may often go barefoot.",
      },
      {
        question: "Do you have an age limit for tours?",
        answer:
          "Tours cater to adventurous travelers aged 18—45, with most guests between 21—35 years old.",
      },
      {
        question: "What is the local currency?",
        answer: "Maldivian Ruffiya, with USD also accepted.",
      },
      {
        question: "Which airport do I fly out from?",
        answer: "Male — Velana International Airport (MLE).",
      },
    ],
  },
  thingsToKnow: {
    heading: "Things to know",
    items: [
      {
        icon: "info",
        title: "Travel Information",
        description:
          "Get ready for your trip! Find helpful links to everything you need from travel and health requirements to travel guides, visa information, and more here.",
        ctaLabel: "Show more",
        ctaHref: "/travel-information",
      },
      {
        icon: "faq",
        title: "General FAQs",
        description:
          "Have more questions? Check out our FAQs as we might already have the answers.",
        ctaLabel: "Show more",
        ctaHref: "/faqs",
      },
    ],
  },
  tips: {
    heading: "Tips",
    items: [
      {
        icon: "luggage",
        title: "Pack smart",
        description:
          "Bring comfortable walking shoes, quick-dry clothing, a reusable water bottle, and a power adapter suited for your destination.",
      },
      {
        icon: "shield",
        title: "Travel insurance",
        description:
          "We require all travelers to have valid travel insurance covering medical, cancellation, and activity risks for the duration of the trip.",
      },
      {
        icon: "sun",
        title: "Beat the climate",
        description:
          "Sunscreen, a hat, and insect repellent go a long way. Stay hydrated and listen to your body, especially on active days.",
      },
      {
        icon: "handshake",
        title: "Respect local customs",
        description:
          "The Maldives is a Muslim country — alcohol is not available on local islands. Bikinis are not permitted on public beaches; dress modestly on inhabited islands. Tourist beach areas are available for guests.",
      },
    ],
  },
  booking: {
    durationLabel: "9 Day Tour",
    routeLabel: "Hulhumale to Ukulhas",
    priceFromLabel: "From",
    priceCurrency: "GBP",
    priceAmount: "£1,800",
    depositAmount: "£300",
    ctaLabel: "Reserve Now",
    ctaHref:
      "https://admin.imheretravels.com/reservation-booking-form?tour=maldives-bucketlist",
    footnote: "Additional fees may apply",
  },
  listingCard: {
    duration: "9 Days and 8 Nights",
    description:
      "Experience the Maldives Island Adventure! Explore bustling Male City, dive into coral reefs in Rasdhoo, and unwind on an uninhabited island paradise. From thrilling underwater adventures to sunset paddling and dolphin cruises, this trip is packed with unforgettable moments!",
    price: "GBP £1,800",
    image: "/tours/maldives-bucketlist/maldives-header-1.webp",
    imageAlt: "Maldives Bucketlist",
  },
};

export default maldivesBucketlist;
