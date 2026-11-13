import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/app/components/global/Footer";

// Reached only after the /contact-us form sends, so analytics and ads can count
// a sent message by URL (the tour "Inquire now" form has /enquiry-sent).
export const metadata: Metadata = {
  title: "Message sent",
  description: "Thanks for getting in touch. Our team will be in touch soon.",
  robots: { index: false, follow: false },
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className="size-12 md:size-14">
      <path d="M12 24.5l8.5 8.5L36 16" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MessageSentPage() {
  return (
    <>
      <main className="flex-1 bg-light-grey">
        <section className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-16 text-center md:py-24">
          <span className="inline-flex size-20 items-center justify-center rounded-full bg-spring-green shadow-large md:size-24">
            <CheckIcon />
          </span>
          <p className="mt-6 font-body text-b4-mobile uppercase tracking-[0.2em] text-midnight md:text-b4-desktop">
            Message sent
          </p>
          <h1 className="mt-3 font-display text-h2-mobile text-midnight md:text-h2-desktop">
            Thanks for getting <span className="text-crimson-red">in touch.</span>
          </h1>
          <p className="mt-4 max-w-xl font-body text-b2-mobile text-dark-gray md:text-b2-desktop">
            We&apos;ve got your message and our team will be in touch soon. Keep an eye on your inbox and phone.
          </p>
          <div className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/tours"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-crimson-red px-8 py-3 font-body font-bold text-white transition-colors hover:bg-light-red sm:w-auto"
            >
              Browse all tours
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full border-2 border-midnight/15 bg-white px-8 py-3 font-body font-bold text-midnight transition-colors hover:border-midnight sm:w-auto"
            >
              Back to home
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
