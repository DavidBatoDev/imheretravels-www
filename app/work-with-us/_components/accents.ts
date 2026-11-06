import type { PartnerType } from "@/data/workWithUs";

/**
 * Per-partnership accent classes. Written out in full so Tailwind can see them.
 * Accents are decorative (chips, icons, step numbers); the main CTA buttons stay
 * brand crimson on every section.
 */
export const ACCENTS: Record<
  PartnerType,
  { chip: string; icon: string; number: string; ring: string }
> = {
  host: {
    chip: "bg-crimson-red/10 text-crimson-red",
    icon: "text-crimson-red",
    number: "bg-crimson-red text-white",
    ring: "focus-visible:outline-crimson-red",
  },
  affiliate: {
    chip: "bg-royal-purple/10 text-royal-purple",
    icon: "text-royal-purple",
    number: "bg-royal-purple text-white",
    ring: "focus-visible:outline-royal-purple",
  },
  supplier: {
    chip: "bg-spring-green/15 text-midnight",
    icon: "text-spring-green",
    number: "bg-spring-green text-midnight",
    ring: "focus-visible:outline-spring-green",
  },
};
