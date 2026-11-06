import ImageWithSkeleton from "@/app/components/global/ImageWithSkeleton";
import { partnerLogos, testimonials } from "@/data/workWithUs";

/**
 * Host stories / partner testimonials and partner logos. Renders nothing until
 * entries are added to `testimonials` / `partnerLogos` in data/workWithUs.ts.
 */
export default function PartnerStories() {
  if (testimonials.length === 0 && partnerLogos.length === 0) return null;

  return (
    <section className="bg-light-grey px-4 py-16 md:px-8 md:py-24" aria-labelledby="wwu-stories-heading">
      <div className="mx-auto max-w-7xl">
        <h2 id="wwu-stories-heading" className="font-display text-h2-mobile text-midnight md:text-h2-desktop">
          Our Partners
        </h2>

        {testimonials.length > 0 && (
          <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <li key={t.name + t.quote.slice(0, 20)} className="flex flex-col rounded-md bg-white p-6 md:p-8">
                <blockquote className="flex-1 font-body text-b2-mobile text-midnight md:text-b2-desktop">“{t.quote}”</blockquote>
                <div className="mt-6 flex items-center gap-3">
                  {t.image && (
                    <div className="relative size-12 overflow-hidden rounded-full">
                      <ImageWithSkeleton src={t.image} alt="" fill sizes="48px" className="object-cover" />
                    </div>
                  )}
                  <div>
                    <p className="font-sans font-bold text-h6-mobile text-midnight md:text-h6-desktop">{t.name}</p>
                    <p className="font-body text-b4-mobile text-dark-gray md:text-b4-desktop">{t.role}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {partnerLogos.length > 0 && (
          <ul className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-6" aria-label="Partner logos">
            {partnerLogos.map((logo) => {
              const img = (
                <div className="relative h-12 w-32">
                  <ImageWithSkeleton src={logo.src} alt={logo.name} fill sizes="128px" className="object-contain" />
                </div>
              );
              return (
                <li key={logo.name}>
                  {logo.href ? (
                    <a href={logo.href} target="_blank" rel="noopener noreferrer">
                      {img}
                    </a>
                  ) : (
                    img
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
