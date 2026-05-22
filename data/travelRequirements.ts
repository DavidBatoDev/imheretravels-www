/* -------------------------------------------------------------------------- */
/* Metadata                                                                    */
/* -------------------------------------------------------------------------- */

export const travelReqMetadata = {
  title: "Travel Requirements | I'm Here Travels",
  description:
    "Check visa and travel requirements for every destination. Use our interactive guide to find out what you need before you go.",
};

/* -------------------------------------------------------------------------- */
/* Page content                                                                */
/* -------------------------------------------------------------------------- */

export const travelReqHero = {
  title: "Travel Requirements Guide",
  subtitle:
    "No matter when you'll travel, you'll need to comply with the entry requirements of the countries you'll visit.",
};

export const travelReqBreadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Travel Info", href: "/travel-information" },
  { label: "Requirements", href: null },
];

/* -------------------------------------------------------------------------- */
/* Legend                                                                      */
/* -------------------------------------------------------------------------- */

export const travelReqLegend = [
  {
    id: "no-visa",
    color: "#22a06b",
    label: "No Visa Required",
    description:
      "You don't need a visa to travel to this destination. You're good to go!",
  },
  {
    id: "visa-on-arrival",
    color: "#b3d44f",
    count: 28,
    label: "Visa on Arrival",
    description:
      "No need to apply for a visa before you go, but you'll need to get one on arrival.",
  },
  {
    id: "evisa",
    color: "#f5a623",
    count: 29,
    label: "eVisa or eTA required",
    description:
      "You require an eVisa to travel to this destination. You can get one online.",
  },
  {
    id: "paper-visa",
    color: "#4a90d9",
    count: 21,
    label: "Paper Visa Required",
    description:
      "You can travel to this destination but you have to obtain an embassy visa.",
  },
  {
    id: "restricted",
    color: "#d93025",
    count: 0,
    label: "Entry Restricted",
    description:
      "Travel is only open for returning citizens and those meeting strict requirements.",
  },
];

/* -------------------------------------------------------------------------- */
/* Filter options                                                              */
/* -------------------------------------------------------------------------- */

export const passportCountries = [
  { value: "AU", label: "Australia" },
  { value: "CA", label: "Canada" },
  { value: "PH", label: "Philippines" },
  { value: "SG", label: "Singapore" },
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
  { value: "NZ", label: "New Zealand" },
];
