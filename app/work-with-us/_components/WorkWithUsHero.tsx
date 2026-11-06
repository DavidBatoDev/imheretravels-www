import ImageWithSkeleton from "@/app/components/global/ImageWithSkeleton";
import Reveal from "@/app/components/global/Reveal";
import { partnerSections, workWithUsHero } from "@/data/workWithUs";
import PartnerIconGlyph from "./PartnerIconGlyph";

export default function WorkWithUsHero() {
  return (
    <section className="relative overflow-hidden px-4 py-20 text-white md:px-8 md:py-32">
      <ImageWithSkeleton
        src={workWithUsHero.image}
        alt={workWithUsHero.imageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-midnight/90 via-midnight/75 to-midnight/40" />
      <div className="relative mx-auto max-w-7xl">
        <Reveal>
          <p className="font-body font-bold text-b4-mobile uppercase tracking-[0.12em] text-light-red md:text-b4-desktop">
            Work With Us
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-3 max-w-3xl font-display text-h1-mobile md:text-h1-desktop">{workWithUsHero.title}</h1>
        </Reveal>
        <Reveal delay={160}>
          <div className="mt-6 max-w-2xl space-y-3 font-body text-b2-mobile text-white/85 md:text-b2-desktop">
            {workWithUsHero.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Reveal>
        <Reveal delay={240}>
          <nav aria-label="Partnership options" className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {workWithUsHero.ctas.map((cta, i) => {
              const section = partnerSections[i];
              return (
                <a
                  key={cta.href}
                  href={cta.href}
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 font-body font-bold text-b2-mobile transition-colors md:text-b2-desktop ${
                    i === 0
                      ? "bg-crimson-red text-white hover:bg-light-red"
                      : "border-[1.5px] border-white/80 bg-white/10 text-white backdrop-blur-sm hover:bg-white hover:text-midnight"
                  }`}
                >
                  {section && <PartnerIconGlyph icon={section.icon} className="size-5" />}
                  {cta.label}
                </a>
              );
            })}
          </nav>
        </Reveal>
      </div>
    </section>
  );
}
