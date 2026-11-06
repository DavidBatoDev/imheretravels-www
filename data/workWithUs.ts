/**
 * Work With Us (/work-with-us): every piece of copy and every form field lives
 * here, so the team can update partnership wording, commission notes, option
 * lists or form questions without touching components.
 *
 * - Copy follows the client brief (2026-11-06).
 * - `forms` drives BOTH the rendered forms (ApplicationForm.tsx) and the
 *   server-side validation (lib/work-with-us/schema.ts), so adding, removing or
 *   renaming a field here updates both sides.
 * - `testimonials` / `partnerLogos` are empty for now; the page renders those
 *   sections only once they have entries.
 *
 * Plain data only (no JSX), so it can be imported by server and client code.
 */

/* -------------------------------------------------------------------------- */
/* Shared                                                                      */
/* -------------------------------------------------------------------------- */

export const PARTNER_TYPES = ["host", "affiliate", "supplier"] as const;
export type PartnerType = (typeof PARTNER_TYPES)[number];

export const CALENDLY_URL = "https://calendly.com/bella-imheretravels/20min";
export const CALENDLY_LABEL = "Prefer to chat? Book a 20-min call with Bella";
export const BUSINESS_EMAIL = "info@imheretravels.com";

/** Who receives the internal "new application" notification. */
export const TEAM_NOTIFY_EMAIL = "bella@imheretravels.com";

export const workWithUsMetadata = {
  title: {
    absolute:
      "Work With Us | Host, Affiliate & Travel Supplier Partnerships – I'm Here Travels",
  },
  description:
    "Partner with I'm Here Travels! Become a group tour host, join our affiliate creator programme or become a travel supplier. Let's create incredible travel experiences together.",
  alternates: { canonical: "/work-with-us" },
  openGraph: {
    title: "Work With Us – I'm Here Travels",
    description:
      "Become a group tour host, join our affiliate creator programme or partner with us as a travel supplier.",
    url: "/work-with-us",
    images: ["/about/hero.jpg"],
  },
};

/* -------------------------------------------------------------------------- */
/* Hero                                                                        */
/* -------------------------------------------------------------------------- */

export const workWithUsHero = {
  image: "/about/hero.jpg",
  imageAlt: "A group of I'm Here Travels guests standing in a circle, smiling down at the camera",
  title: "Let's Create Something Amazing Together.",
  paragraphs: [
    "At I'm Here Travels, we believe great travel experiences are built through great partnerships. Whether you're a creator with a community, someone who loves bringing people together, or a travel business offering incredible experiences, we'd love to hear from you.",
    "Explore our partnership opportunities and let's make travel more meaningful, together.",
  ],
  ctas: [
    { label: "Become a Host", href: "#host" },
    { label: "Become an Affiliate", href: "#affiliate" },
    { label: "Partner as a Supplier", href: "#supplier" },
  ],
};

/* -------------------------------------------------------------------------- */
/* Partner sections                                                            */
/* -------------------------------------------------------------------------- */

export type PartnerIcon = "users" | "megaphone" | "building";

export interface PartnerSectionContent {
  type: PartnerType;
  /** Anchor id; the form opens at `#{id}-application`. */
  id: string;
  icon: PartnerIcon;
  eyebrow: string;
  heading: string;
  intro: string[];
  image: string;
  imageAlt: string;
  steps?: { title: string; body: string }[];
  lists: { heading: string; items: string[]; footnote?: string }[];
  /** Free-text block shown under the lists (supplier "How to Partner With Us"). */
  extra?: { heading: string; paragraphs: string[] };
  ctaLabel: string;
}

export const partnerSections: PartnerSectionContent[] = [
  {
    type: "host",
    id: "host",
    icon: "users",
    eyebrow: "Become an IHT Host",
    heading: "Host a Trip. Bring Your Community. Explore the World.",
    intro: [
      "Do you love travelling, meeting new people and bringing communities together?",
      "Our Host Programme gives you the opportunity to lead your own I'm Here Travels group departure and share incredible travel experiences with your audience, friends or community.",
      "Whether you're a content creator, travel enthusiast, community leader or simply someone who loves organising experiences, we'd love to hear from you.",
    ],
    image: "/reviews/tourradar/group-canyoneering-circle.jpg",
    imageAlt: "An IHT group floating together in a circle during a canyoneering trip",
    steps: [
      {
        title: "Choose Your Destination",
        body: "Explore our available group tours and select a destination you'd love to host. We'll work together to find a suitable departure and travel dates.",
      },
      {
        title: "Promote Your Trip",
        body: "Share your departure with your audience, community, social media followers or personal network. Help spread the word and encourage travellers to join your group.",
      },
      {
        title: "Earn Commission",
        body: "Earn commission for every qualifying booking on your departure. Your earnings depend on the destination and the final number of confirmed travellers. Some destinations also offer additional flight support once the required booking threshold is reached.",
      },
      {
        title: "Travel With Your Group",
        body: "Join your group on the adventure! Meet new people, create connections and help make the experience memorable. Our team handles the travel arrangements and day-to-day logistics.",
      },
    ],
    lists: [
      {
        heading: "What We Take Care Of",
        items: [
          "Itinerary planning and coordination.",
          "Accommodation and transportation arrangements.",
          "Local guides, activities and suppliers.",
          "Guest bookings and payment processing.",
          "Customer support and pre-departure communication.",
          "An IHT trip manager to coordinate the group and manage on-the-ground logistics.",
        ],
        footnote:
          "Your focus is on promoting the trip, building your group and being part of the experience.",
      },
      {
        heading: "Why Host With Us?",
        items: [
          "Earn commission from confirmed bookings.",
          "Travel and explore incredible destinations.",
          "Bring your community together through shared experiences.",
          "Work with an experienced travel team.",
          "Enjoy support with trip planning, bookings and logistics.",
        ],
      },
    ],
    ctaLabel: "Apply to Become a Host",
  },
  {
    type: "affiliate",
    id: "affiliate",
    icon: "megaphone",
    eyebrow: "Become an Affiliate Partner",
    heading: "Create. Share. Earn.",
    intro: [
      "Are you a content creator, influencer, blogger or someone who loves sharing travel inspiration?",
      "Join our Affiliate Creator Programme and earn commission by introducing your audience to I'm Here Travels.",
      "You don't need to travel with a group or host a departure. Simply create content, share our trips with your audience and earn commission when someone books through your unique referral link or code.",
    ],
    image: "/reviews/tourradar/group-night-out-selfie.jpg",
    imageAlt: "IHT travellers taking a group selfie on a night out",
    steps: [
      {
        title: "Apply to Join",
        body: "Tell us about yourself, your content and the platforms where you share your travel experiences.",
      },
      {
        title: "Get Your Unique Referral Link",
        body: "Once approved, we'll provide you with a unique tracking link or referral code to share with your audience.",
      },
      {
        title: "Create & Promote",
        body: "Share IHT destinations, group tours and travel experiences through your preferred platforms. This could include Instagram Reels, TikTok videos, YouTube content, blogs or other social media posts.",
      },
      {
        title: "Earn Commission",
        body: "Receive commission for qualifying bookings made through your referral link or code, based on the agreed affiliate commission structure.",
      },
    ],
    lists: [
      {
        heading: "Who Can Apply?",
        items: [
          "Travel content creators and influencers.",
          "Lifestyle and adventure creators.",
          "Travel bloggers and publishers.",
          "Social media personalities.",
          "Individuals with an engaged travel-loving audience.",
        ],
        footnote:
          "You don't necessarily need a large following. We value authentic content, genuine engagement and an audience that connects with the experiences we offer.",
      },
      {
        heading: "Why Partner With IHT?",
        items: [
          "No need to host or travel with a group.",
          "Earn through successful referrals.",
          "Promote destinations and experiences you genuinely love.",
          "Collaborate with an international group travel brand.",
          "Create content around exciting travel opportunities.",
        ],
      },
    ],
    ctaLabel: "Become an Affiliate Partner",
  },
  {
    type: "supplier",
    id: "supplier",
    icon: "building",
    eyebrow: "Become a Travel Supplier",
    heading: "Let's Build Better Travel Experiences Together.",
    intro: [
      "Are you a hotel, accommodation provider, local tour operator, activity provider, transport company, destination management company or travel service provider?",
      "We're always looking to connect with reliable local partners who can help us create exceptional travel experiences for our guests.",
      "At I'm Here Travels, we work with suppliers across different destinations to deliver carefully curated group adventures.",
      "If you offer accommodation, transportation, activities, excursions, guided experiences or other travel-related services, we'd love to hear from you.",
    ],
    image: "/reviews/tourradar/group-el-nido-lagoon-swim.jpg",
    imageAlt: "An IHT group swimming in a lagoon in El Nido",
    lists: [
      {
        heading: "We're Interested In:",
        items: [
          "Hotels, resorts and boutique accommodations.",
          "Local tour operators and destination management companies.",
          "Local guides and activity providers.",
          "Transportation and transfer companies.",
          "Adventure and outdoor experience providers.",
          "Restaurants and dining experiences.",
          "Other travel-related services.",
        ],
      },
    ],
    extra: {
      heading: "How to Partner With Us",
      paragraphs: [
        "Tell us about your company, the services you offer, the destinations you cover and your rates.",
        "Our team will review your submission and get in touch if there's an opportunity to collaborate.",
      ],
    },
    ctaLabel: "Submit Your Supplier Enquiry",
  },
];

/* -------------------------------------------------------------------------- */
/* Closing CTA                                                                 */
/* -------------------------------------------------------------------------- */

export const workWithUsClosing = {
  heading: "Have Something Else in Mind?",
  paragraphs: [
    "Not sure which partnership opportunity is right for you? We're always open to exploring new ideas and collaborations.",
    "Get in touch and tell us what you have in mind. We'd love to hear from you!",
  ],
  primary: { label: "Contact Our Team", href: "/contact-us" },
};

/* -------------------------------------------------------------------------- */
/* Future sections (render only when non-empty)                                */
/* -------------------------------------------------------------------------- */

export interface PartnerTestimonial {
  quote: string;
  name: string;
  /** e.g. "IHT Host, Philippines 2026" */
  role: string;
  image?: string;
}

export interface PartnerLogo {
  name: string;
  src: string;
  href?: string;
}

export const testimonials: PartnerTestimonial[] = [];
export const partnerLogos: PartnerLogo[] = [];

/* -------------------------------------------------------------------------- */
/* Forms                                                                       */
/* -------------------------------------------------------------------------- */

export type FieldKind =
  | "text"
  | "email"
  | "url"
  | "tel"
  | "textarea"
  | "select"
  | "radio"
  | "checkboxes"
  | "country"
  | "destinations";

export interface FormField {
  name: string;
  label: string;
  kind: FieldKind;
  required: boolean;
  placeholder?: string;
  help?: string;
  /** For select / radio / checkboxes. */
  options?: readonly string[];
  /** Lay out side by side with the next half-width field on desktop. */
  half?: boolean;
  /** Max characters (text-like fields). */
  maxLength?: number;
  /** url kind: an "@handle" is turned into this base + handle. */
  handleBase?: string;
}

export interface FormConfig {
  type: PartnerType;
  heading: string;
  intro: string;
  submitLabel: string;
  /** Label used in the team notification subject, e.g. "Host Application". */
  kindLabel: string;
  /** Field used as the applicant's display name. */
  nameField: string;
  /** Optional extra field appended to the display name (supplier company). */
  orgField?: string;
  fields: FormField[];
  /** Supplier only: optional document upload. */
  upload?: { name: string; label: string; help: string };
}

const YES_NO = ["Yes", "No"] as const;

const FOLLOWING_OPTIONS = [
  "Under 1,000",
  "1,000 – 10,000",
  "10,000 – 50,000",
  "50,000 – 100,000",
  "100,000 – 500,000",
  "500,000+",
] as const;

export const SUPPLIER_UPLOAD = {
  maxBytes: 4 * 1024 * 1024,
  extensions: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv"],
  accept:
    ".pdf,.doc,.docx,.xls,.xlsx,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv",
};

export const forms: Record<PartnerType, FormConfig> = {
  host: {
    type: "host",
    heading: "Become an IHT Host",
    intro:
      "Tell us a little about yourself, your community and the destinations you'd love to host.",
    submitLabel: "Submit Host Application",
    kindLabel: "Host Application",
    nameField: "fullName",
    fields: [
      { name: "fullName", label: "Full Name", kind: "text", required: true, half: true, maxLength: 120 },
      { name: "email", label: "Email Address", kind: "email", required: true, half: true },
      { name: "country", label: "Country of Residence", kind: "country", required: true, half: true },
      {
        name: "instagram",
        label: "Instagram Profile URL",
        kind: "url",
        required: true,
        half: true,
        placeholder: "https://instagram.com/yourhandle",
        handleBase: "https://instagram.com/",
      },
      {
        name: "otherSocials",
        label: "Other Social Media Profiles",
        kind: "text",
        required: false,
        half: true,
        placeholder: "TikTok, YouTube, Facebook…",
        maxLength: 500,
      },
      { name: "website", label: "Website / Blog", kind: "url", required: false, half: true, placeholder: "https://" },
      {
        name: "describesYou",
        label: "What best describes you?",
        kind: "select",
        required: true,
        half: true,
        options: ["Content Creator", "Influencer", "Travel Enthusiast", "Community Leader", "Other"],
      },
      {
        name: "following",
        label: "Approximate Social Media Following",
        kind: "select",
        required: true,
        half: true,
        options: FOLLOWING_OPTIONS,
      },
      { name: "aboutYou", label: "Tell us about yourself and your community.", kind: "textarea", required: true, maxLength: 3000 },
      { name: "whyHost", label: "Why would you like to become an IHT host?", kind: "textarea", required: true, maxLength: 3000 },
      {
        name: "destinations",
        label: "Which destinations are you interested in hosting?",
        kind: "destinations",
        required: true,
        help: "Select all that apply.",
      },
      {
        name: "travelPeriod",
        label: "Do you have a preferred travel period or year?",
        kind: "text",
        required: true,
        placeholder: "e.g. March 2027, or any time in 2027",
        maxLength: 300,
      },
      { name: "hostedBefore", label: "Have you hosted group trips before?", kind: "radio", required: true, options: YES_NO },
      { name: "anythingElse", label: "Anything else you'd like us to know?", kind: "textarea", required: false, maxLength: 3000 },
    ],
  },
  affiliate: {
    type: "affiliate",
    heading: "Become an IHT Affiliate Partner",
    intro:
      "Interested in promoting IHT tours and earning commission through referrals? Tell us about your content and audience.",
    submitLabel: "Submit Affiliate Application",
    kindLabel: "Affiliate Application",
    nameField: "fullName",
    fields: [
      { name: "fullName", label: "Full Name", kind: "text", required: true, half: true, maxLength: 120 },
      { name: "email", label: "Email Address", kind: "email", required: true, half: true },
      { name: "country", label: "Country of Residence", kind: "country", required: true, half: true },
      {
        name: "instagram",
        label: "Instagram Profile URL",
        kind: "url",
        required: true,
        half: true,
        placeholder: "https://instagram.com/yourhandle",
        handleBase: "https://instagram.com/",
      },
      {
        name: "tiktok",
        label: "TikTok Profile URL",
        kind: "url",
        required: false,
        half: true,
        placeholder: "https://tiktok.com/@yourhandle",
        handleBase: "https://tiktok.com/@",
      },
      { name: "youtube", label: "YouTube Channel", kind: "url", required: false, half: true, placeholder: "https://youtube.com/@yourchannel" },
      { name: "website", label: "Website / Blog", kind: "url", required: false, half: true, placeholder: "https://" },
      {
        name: "otherSocials",
        label: "Other Social Media Profiles",
        kind: "text",
        required: false,
        half: true,
        placeholder: "Facebook, X, Pinterest…",
        maxLength: 500,
      },
      {
        name: "audienceSize",
        label: "Approximate Total Following / Audience Size",
        kind: "select",
        required: true,
        options: FOLLOWING_OPTIONS,
      },
      {
        name: "contentType",
        label: "What type of content do you create?",
        kind: "checkboxes",
        required: true,
        help: "Select all that apply.",
        options: ["Travel", "Lifestyle", "Adventure", "Fashion", "Other"],
      },
      { name: "aboutAudience", label: "Tell us about your audience.", kind: "textarea", required: true, maxLength: 3000 },
      { name: "whyPartner", label: "Why are you interested in partnering with IHT?", kind: "textarea", required: true, maxLength: 3000 },
      {
        name: "destinations",
        label: "Which IHT destinations or tours interest you most?",
        kind: "destinations",
        required: true,
        help: "Select all that apply.",
      },
      { name: "howPromote", label: "How would you promote IHT tours?", kind: "textarea", required: true, maxLength: 3000 },
      {
        name: "affiliateBefore",
        label: "Have you worked with affiliate programmes before?",
        kind: "radio",
        required: true,
        options: YES_NO,
      },
      { name: "anythingElse", label: "Anything else you'd like us to know?", kind: "textarea", required: false, maxLength: 3000 },
    ],
  },
  supplier: {
    type: "supplier",
    heading: "Become an IHT Travel Supplier",
    intro: "We would love to learn more about your business and the services you offer.",
    submitLabel: "Submit Supplier Enquiry",
    kindLabel: "Supplier Enquiry",
    nameField: "contactPerson",
    orgField: "companyName",
    fields: [
      { name: "companyName", label: "Company / Business Name", kind: "text", required: true, half: true, maxLength: 200 },
      { name: "contactPerson", label: "Contact Person", kind: "text", required: true, half: true, maxLength: 120 },
      { name: "email", label: "Email Address", kind: "email", required: true, half: true },
      {
        name: "phone",
        label: "Phone / WhatsApp Number",
        kind: "tel",
        required: true,
        half: true,
        placeholder: "+63 912 345 6789",
        maxLength: 40,
      },
      { name: "country", label: "Country", kind: "country", required: true, half: true },
      { name: "website", label: "Website URL (if available)", kind: "url", required: false, half: true, placeholder: "https://" },
      {
        name: "social",
        label: "Instagram / Social Media Profile",
        kind: "text",
        required: false,
        placeholder: "@yourbusiness or a link",
        maxLength: 500,
      },
      {
        name: "serviceType",
        label: "Type of Service",
        kind: "checkboxes",
        required: true,
        help: "Select all that apply.",
        options: [
          "Accommodation",
          "Tour Operator",
          "Transportation",
          "Activities & Excursions",
          "Local Guides",
          "Restaurant / Dining",
          "DMC",
          "Other",
        ],
      },
      {
        name: "destinationsCovered",
        label: "Destination(s) Covered",
        kind: "text",
        required: true,
        placeholder: "e.g. El Nido, Coron and Puerto Princesa",
        maxLength: 500,
      },
      {
        name: "description",
        label: "Brief Description of Your Business and Services",
        kind: "textarea",
        required: true,
        maxLength: 4000,
      },
      {
        name: "internationalGroups",
        label: "Do you work with international group tours?",
        kind: "radio",
        required: true,
        options: YES_NO,
        half: true,
      },
      {
        name: "groupRates",
        label: "Do you offer group or wholesale rates?",
        kind: "radio",
        required: true,
        options: YES_NO,
        half: true,
      },
      {
        name: "groupCapacity",
        label: "Approximate Group Capacity",
        kind: "text",
        required: true,
        half: true,
        placeholder: "e.g. up to 30 guests",
        maxLength: 200,
      },
      {
        name: "currency",
        label: "Currency of Your Rates",
        kind: "select",
        required: true,
        half: true,
        options: [
          "USD",
          "EUR",
          "GBP",
          "AUD",
          "PHP",
          "IDR",
          "THB",
          "VND",
          "MYR",
          "SGD",
          "JPY",
          "KRW",
          "INR",
          "LKR",
          "MVR",
          "BRL",
          "Other",
        ],
      },
      { name: "additionalInfo", label: "Additional Information", kind: "textarea", required: false, maxLength: 3000 },
    ],
    upload: {
      name: "document",
      label: "Upload Company Profile / Rate Sheet / Brochure",
      help: "Optional. PDF, Word, Excel or CSV, up to 4 MB. Larger file? Email it to bella@imheretravels.com.",
    },
  },
};

export const consentCopy = {
  label:
    "I agree to I'm Here Travels' Privacy Policy and consent to being contacted about my application.",
  privacyHref: "/privacy-policy",
};

export const successCopy = {
  heading: "Thank you, we've received your application!",
  body: "Our team reviews every submission personally and will be in touch if there's a good fit. We've sent a confirmation to your email.",
};
