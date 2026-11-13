import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/app/components/global/Footer";
import { getTourBySlug } from "@/lib/tours-firestore";

// The ad team counts a visit to this URL as a lead (Meta pixel PageView), so it
// stays a page of its own, reached only after an enquiry is sent.
export const metadata: Metadata = {
  title: "Enquiry sent",
  description: "Thanks for your enquiry. Our team will be in touch soon.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function CheckIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className="size-12 md:size-14">
      <path d="M12 24.5l8.5 8.5L36 16" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function EnquirySentPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const slug = typeof sp.tour === "string" && /^[a-z0-9-]{1,120}$/.test(sp.tour) ? sp.tour : null;
  const tour = slug ? await getTourBySlug(slug).catch(() => null) : null;

  return (
    <>
      <main className="flex-1 bg-light-grey">
        <section className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-16 text-center md:py-24">
          <span className="inline-flex size-20 items-center justify-center rounded-full bg-spring-green shadow-large md:size-24">
            <CheckIcon />
          </span>
          <p className="mt-6 font-body text-b4-mobile uppercase tracking-[0.2em] text-midnight md:text-b4-desktop">
            Enquiry sent
          </p>
          <h1 className="mt-3 font-display text-h2-mobile text-midnight md:text-h2-desktop">
            Thanks, we&apos;ve got your <span className="text-crimson-red">enquiry.</span>
          </h1>
          <p className="mt-4 max-w-xl font-body text-b2-mobile text-dark-gray md:text-b2-desktop">
            {tour
              ? `Our team will be in touch soon about ${tour.name}. Keep an eye on your inbox and phone.`
              : "Our team will be in touch soon. Keep an eye on your inbox and phone."}
          </p>
          <div className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            {tour && (
              <Link
                href={`/tours/${tour.slug}`}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-crimson-red px-8 py-3 font-body font-bold text-white transition-colors hover:bg-light-red sm:w-auto"
              >
                Back to the tour
              </Link>
            )}
            <Link
              href="/tours"
              className={`inline-flex min-h-12 w-full items-center justify-center rounded-full px-8 py-3 font-body font-bold transition-colors sm:w-auto ${
                tour
                  ? "border-2 border-midnight/15 bg-white text-midnight hover:border-midnight"
                  : "bg-crimson-red text-white hover:bg-light-red"
              }`}
            >
              Browse all tours
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
