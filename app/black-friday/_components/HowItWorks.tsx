"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { formatGBP } from "@/lib/sale/ladder";
import type { PublicSlot } from "@/lib/sale/types";

const EASE = [0.22, 1, 0.36, 1] as const;
const VIEWPORT = { once: true, amount: 0.3 } as const;

/**
 * Three steps plus the ladder rule, illustrated with a real tour's prices
 * (the first tour in the sale) rather than a made-up example.
 *
 * Motion (once, on scroll into view): the steps rise in one after another
 * with their numbers popping, a line draws between them on desktop, and the
 * ladder bars grow up from the baseline cheapest first. Reduced motion shows
 * everything in place.
 */
export default function HowItWorks({
  holdMinutes,
  example,
}: {
  holdMinutes: number;
  example?: { name: string; originalPrice: number; slots: PublicSlot[] };
}) {
  const reduce = useReducedMotion() ?? false;

  const steps = [
    {
      title: "Pick a tour",
      body: "Choose Solo, Duo or a group. Your party takes the next free slots in order.",
    },
    {
      title: `Hold your slots for ${holdMinutes} min`,
      body: "Enter your email and we keep them just for you while you book. Only you see the timer.",
    },
    {
      title: "Pay the reservation fee",
      body: "Choose your travel date and pay the reservation fee. The rest is paid in instalments at the sale price.",
    },
  ];

  const list: Variants = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.14 } } };
  const step: Variants = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      };
  const badge: Variants = reduce
    ? { hidden: { scale: 1 }, show: { scale: 1 } }
    : {
        hidden: { scale: 0.4, opacity: 0 },
        show: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 420, damping: 18, delay: 0.05 } },
      };
  const bars: Variants = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.12, delayChildren: 0.15 } } };
  const bar: Variants = reduce
    ? { hidden: { scaleY: 1 }, show: { scaleY: 1 } }
    : {
        hidden: { scaleY: 0, opacity: 0 },
        show: { scaleY: 1, opacity: 1, transition: { duration: 0.55, ease: EASE } },
      };

  return (
    <section aria-labelledby="how-heading" className="bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-16">
        <motion.h2
          id="how-heading"
          className="font-display text-h2-mobile text-midnight md:text-h2-desktop"
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.6, ease: EASE }}
        >
          How it works
        </motion.h2>

        <div className="relative mt-8">
          {/* Connector between the step numbers (desktop), drawn left to right. */}
          <motion.span
            aria-hidden="true"
            className="absolute left-[1.375rem] right-[calc((100%-4rem)/3-1.375rem)] top-[1.375rem] hidden h-0.5 origin-left bg-crimson-red/20 md:block"
            initial={reduce ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={VIEWPORT}
            transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
          />
          <motion.ol
            className="relative grid gap-6 md:grid-cols-3 md:gap-8"
            variants={list}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            {steps.map((s, i) => (
              <motion.li key={s.title} variants={step} className="flex gap-4 md:flex-col md:gap-3">
                <motion.span
                  variants={badge}
                  aria-hidden="true"
                  className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-crimson-red font-sans text-h6-mobile text-white ring-4 ring-white"
                >
                  {i + 1}
                </motion.span>
                <div>
                  <h3 className="font-sans text-h6-mobile text-midnight md:text-h6-desktop">{s.title}</h3>
                  <p className="mt-1 font-body text-b2-mobile text-dark-gray md:text-b4-desktop">{s.body}</p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </div>

        <motion.div
          className="mt-10 rounded-lg bg-light-grey p-5 md:mt-12 md:flex md:items-center md:justify-between md:gap-10 md:p-7"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="md:max-w-sm">
            <p className="font-sans text-h5-mobile text-midnight md:text-h5-desktop">Earlier slots = bigger savings</p>
            <p className="mt-1 font-body text-b2-mobile text-dark-gray md:text-b4-desktop">
              Slot 1 is the cheapest. Each slot after it costs a little more, so the sooner you book, the more you save.
            </p>
          </div>
          {example && example.slots.length > 1 && (
            <figure className="mt-5 md:mt-0 md:flex-1">
              <motion.ol
                className="flex items-end gap-1.5 tabular-nums"
                aria-label={`${example.name} slot prices`}
                variants={bars}
                initial="hidden"
                whileInView="show"
                viewport={VIEWPORT}
              >
                {example.slots.map((s, i) => (
                  <motion.li
                    key={s.index}
                    variants={bar}
                    className={`flex flex-1 origin-bottom flex-col justify-end rounded-sm px-2 pb-2 ${i === 0 ? "bg-crimson-red text-white" : "bg-white text-midnight"}`}
                    style={{ minHeight: `${56 + i * 14}px` }}
                  >
                    <span className="font-body text-[0.75rem] font-medium">Slot {s.index}</span>
                    <span className="font-body text-[0.875rem] font-bold">{formatGBP(s.salePrice)}</span>
                  </motion.li>
                ))}
              </motion.ol>
              <figcaption className="mt-2 font-body text-b4-mobile text-dark-gray md:text-b4-desktop">
                {example.name}, usually {formatGBP(example.originalPrice)} per person.
              </figcaption>
            </figure>
          )}
        </motion.div>
      </div>
    </section>
  );
}
