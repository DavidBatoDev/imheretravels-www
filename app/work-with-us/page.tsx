import type { Metadata } from "next";
import Footer from "@/app/components/global/Footer";
import { partnerSections, workWithUsMetadata } from "@/data/workWithUs";
import { getDestinationOptions } from "@/lib/work-with-us/destinations";
import WorkWithUsHero from "./_components/WorkWithUsHero";
import PartnerSection from "./_components/PartnerSection";
import PartnerStories from "./_components/PartnerStories";
import ClosingCta from "./_components/ClosingCta";

export const metadata: Metadata = workWithUsMetadata;

// Destination options come from the CMS; refresh hourly.
export const revalidate = 3600;

const BASE_URL = "https://www.imheretravels.com";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${BASE_URL}/work-with-us`,
  name: "Work With Us",
  description: workWithUsMetadata.description,
  url: `${BASE_URL}/work-with-us`,
  publisher: { "@id": `${BASE_URL}/#organization` },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Work With Us", item: `${BASE_URL}/work-with-us` },
    ],
  },
};

export default async function WorkWithUsPage() {
  const destinations = await getDestinationOptions();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="flex-1 bg-light-grey">
        <WorkWithUsHero />
        {partnerSections.map((section, i) => (
          <PartnerSection
            key={section.id}
            section={section}
            tone={i % 2 === 0 ? "white" : "grey"}
            imageFirst={i % 2 === 1}
            destinations={destinations}
          />
        ))}
        <PartnerStories />
        <ClosingCta />
      </main>
      <Footer />
    </>
  );
}
