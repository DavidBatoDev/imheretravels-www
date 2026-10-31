import Link from "next/link";
import Footer from "@/app/components/global/Footer";
import { maxDiscount, salePhase, statusLabel } from "@/lib/sale/ladder";
import type { SalePageData } from "@/lib/sale/types";
import HowItWorks from "./HowItWorks";
import SaleExperience from "./SaleExperience";
import SaleHero from "./SaleHero";
import SaleViewTracker from "./SaleViewTracker";
import SaleFaqAccordion from "./SaleFaqAccordion";
import { saleFaqs } from "./saleFaqs";

function stripLinks(md: string): string {
  return md.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
}

/**
 * The sale page body, shared by the public route and the admin preview link
 * (`preview`: a banner on top, booking disabled, no analytics or JSON-LD).
 */
export default function SalePageView({
  sale,
  mock = false,
  preview = false,
}: {
  sale: SalePageData;
  mock?: boolean;
  preview?: boolean;
}) {
  const phase = salePhase(sale, Date.parse(sale.availability.serverNow));
  const statusText = statusLabel(sale, phase);
  const faqs = saleFaqs(sale.holdMinutes);
  const firstTour = sale.tours[0];
  const firstSlots = sale.availability.tours.find(
    (t) => t.tourPackageId === firstTour?.tourPackageId,
  )?.slots;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: stripLinks(f.a) },
    })),
  };

  return (
    <>
      {sale.status === "live" && !mock && !preview && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      {preview ? (
        <div className="sticky top-0 z-50 bg-sunglow-yellow px-4 py-2.5 text-center font-body text-b4-mobile font-medium text-midnight md:text-b4-desktop">
          Preview of “{sale.name}” ({sale.status}). Booking is disabled here; this link isn&apos;t public.
        </div>
      ) : (
        <SaleViewTracker saleId={sale.saleId} saleName={sale.name} status={phase} />
      )}
      <main className="flex-1">
        <SaleHero
          title={sale.hero.title}
          subtitle={sale.hero.subtitle}
          statusText={statusText}
          phase={phase}
          upTo={maxDiscount(sale)}
          bannerUrl={sale.hero.bannerUrl}
          mobileBannerUrl={sale.hero.mobileBannerUrl}
          fallbackImage={firstTour?.coverImage}
          showCta={sale.tours.length > 0}
          startAt={sale.startAt}
          endAt={sale.endAt}
        />

        {/* Resume banner (holder only) → How it works → the deals grid. */}
        <SaleExperience sale={sale} mock={mock} preview={preview}>
          <HowItWorks
            holdMinutes={sale.holdMinutes}
            example={
              firstTour && firstSlots
                ? { name: firstTour.displayName, originalPrice: firstTour.originalPrice, slots: firstSlots }
                : undefined
            }
          />
        </SaleExperience>

        <section aria-labelledby="sale-faq-heading" className="mx-auto w-full max-w-5xl px-4 py-12 md:px-8 md:py-16">
          <h2 id="sale-faq-heading" className="font-display text-h2-mobile text-midnight md:text-h2-desktop">
            Sale FAQs
          </h2>
          <div className="mt-6 rounded-lg bg-white px-5 py-3 md:px-10 md:py-6">
            <SaleFaqAccordion items={faqs} defaultOpen={0} />
          </div>
          <p className="mt-6 font-body text-b4-mobile text-dark-gray md:text-b4-desktop">
            Black Friday bookings are non-refundable. Full details in our{" "}
            <Link href="/terms-and-conditions" className="font-medium text-midnight underline underline-offset-2 hover:text-crimson-red">
              Terms &amp; Conditions
            </Link>
            . Questions?{" "}
            <Link href="/contact-us" className="font-medium text-midnight underline underline-offset-2 hover:text-crimson-red">
              Contact us
            </Link>
            .
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
