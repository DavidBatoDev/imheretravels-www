import { Check } from "lucide-react";
import ImageWithSkeleton from "@/app/components/global/ImageWithSkeleton";
import Reveal from "@/app/components/global/Reveal";
import type { PartnerSectionContent } from "@/data/workWithUs";
import ApplyPanel from "./ApplyPanel";
import PartnerIconGlyph from "./PartnerIconGlyph";
import { ACCENTS } from "./accents";

export default function PartnerSection({
  section,
  tone,
  imageFirst,
  destinations,
}: {
  section: PartnerSectionContent;
  /** Section background; inner cards use the opposite tone. */
  tone: "white" | "grey";
  imageFirst?: boolean;
  destinations: string[];
}) {
  const accent = ACCENTS[section.type];
  const card = tone === "white" ? "bg-light-grey" : "bg-white";

  return (
    <section
      id={section.id}
      aria-labelledby={`${section.id}-heading`}
      className={`px-4 py-16 md:px-8 md:py-24 ${tone === "white" ? "bg-white" : "bg-light-grey"}`}
    >
      <div className="mx-auto max-w-7xl">
        {/* Intro + photo */}
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal className={imageFirst ? "md:order-2" : ""}>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-body font-bold text-b4-mobile md:text-b4-desktop ${accent.chip}`}
            >
              <PartnerIconGlyph icon={section.icon} className="size-4" />
              {section.eyebrow}
            </span>
            <h2
              id={`${section.id}-heading`}
              className="mt-4 font-display text-h2-mobile text-midnight md:text-h2-desktop"
            >
              {section.heading}
            </h2>
            <div className="mt-5 space-y-3 font-body text-b2-mobile text-dark-gray md:text-b2-desktop">
              {section.intro.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120} className={imageFirst ? "md:order-1" : ""}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg shadow-small md:aspect-[4/5]">
              <ImageWithSkeleton
                src={section.image}
                alt={section.imageAlt}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>

        {/* How it works */}
        {section.steps && (
          <div className="mt-16 md:mt-20">
            <h3 className="font-sans font-bold text-h4-mobile text-midnight md:text-h4-desktop">How It Works</h3>
            <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {section.steps.map((step, i) => (
                <Reveal as="li" key={step.title} delay={i * 80} className={`flex flex-col rounded-md p-6 ${card}`}>
                  <span
                    className={`flex size-10 items-center justify-center rounded-full font-body font-bold text-b2-mobile md:text-b2-desktop ${accent.number}`}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <h4 className="mt-4 font-sans font-bold text-h6-mobile text-midnight md:text-h6-desktop">
                    <span className="sr-only">Step {i + 1}: </span>
                    {step.title}
                  </h4>
                  <p className="mt-2 font-body text-b4-mobile text-dark-gray md:text-b4-desktop">{step.body}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        )}

        {/* Lists (+ optional free-text block) */}
        <div className={`mt-12 grid gap-4 md:gap-6 ${section.lists.length + (section.extra ? 1 : 0) > 1 ? "md:grid-cols-2" : ""}`}>
          {section.lists.map((list) => (
            <div key={list.heading} className={`rounded-md p-6 md:p-8 ${card}`}>
              <h3 className="font-sans font-bold text-h5-mobile text-midnight md:text-h5-desktop">{list.heading}</h3>
              <ul className="mt-4 space-y-3">
                {list.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 font-body text-b2-mobile text-midnight md:text-b2-desktop">
                    <Check className={`mt-1 size-4 shrink-0 ${accent.icon}`} strokeWidth={3} aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {list.footnote && (
                <p className="mt-5 border-t border-grey/30 pt-4 font-body text-b2-mobile italic text-dark-gray md:text-b2-desktop">
                  {list.footnote}
                </p>
              )}
            </div>
          ))}
          {section.extra && (
            <div className={`rounded-md p-6 md:p-8 ${card}`}>
              <h3 className="font-sans font-bold text-h5-mobile text-midnight md:text-h5-desktop">{section.extra.heading}</h3>
              <div className="mt-4 space-y-3 font-body text-b2-mobile text-dark-gray md:text-b2-desktop">
                {section.extra.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        <ApplyPanel
          type={section.type}
          sectionId={section.id}
          ctaLabel={section.ctaLabel}
          destinations={destinations}
        />
      </div>
    </section>
  );
}
