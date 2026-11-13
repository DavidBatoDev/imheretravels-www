"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import ImageWithSkeleton from "@/app/components/global/ImageWithSkeleton";
import type { Tour, TourDay } from "@/types/tour";
import Icon from "./Icon";

/* Expand/collapse motion, matched to FaqAccordion so both accordions on the
 * tour page feel like the same control. */
const EASE = [0.22, 1, 0.36, 1] as const;
const HEIGHT_S = 0.4;
const OPACITY_S = 0.25;
const SLIDE_S = 0.3;

/* -------------------------------------------------------------------------- */
/* Parent — days open and close only when the reader clicks them              */
/* -------------------------------------------------------------------------- */

export default function Itinerary({
  section,
}: {
  section: Tour["itinerary"];
}) {
  // Day 1 starts open as a hint that the rows expand. Each day toggles
  // independently, so the reader can keep several open to compare.
  const [openDays, setOpenDays] = useState<Set<number>>(() => new Set([0]));

  const toggle = (index: number) =>
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  return (
    <section className="mt-10 w-full md:mt-14">
      <h2 className="font-sans text-h3-mobile md:text-h3-desktop text-midnight">
        {section.heading}
      </h2>

      <ol className="mt-8 divide-y divide-light-grey border-t border-light-grey">
        {section.days.map((day, i) => (
          <DayItem
            key={day.dayNumber}
            day={day}
            open={openDays.has(i)}
            onClick={() => toggle(i)}
          />
        ))}
      </ol>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* DayItem — controlled open state                                            */
/* -------------------------------------------------------------------------- */

interface DayItemProps {
  day: TourDay;
  open: boolean;
  onClick: () => void;
}

function DayItem({ day, open, onClick }: DayItemProps) {
  return (
    <li className="py-6">
      <button
        type="button"
        onClick={onClick}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-crimson-red font-sans text-b4-desktop font-bold text-white"
          >
            {day.dayNumber}
          </span>
          <h3 className="font-sans text-h6-mobile md:text-h6-desktop text-midnight">
            <span className="font-bold">Day {day.dayNumber}</span>{" "}
            <span className="font-bold text-crimson-red">{day.title}</span>
          </h3>
        </div>
        <motion.span
          className="ml-auto shrink-0 text-midnight"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: SLIDE_S, ease: EASE }}
        >
          <ChevronDown aria-hidden strokeWidth={2} className="size-5" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: HEIGHT_S, ease: EASE },
              opacity: { duration: OPACITY_S, ease: "easeOut" },
            }}
            className="overflow-hidden"
          >
            {/* The slide rides on the content, never on the box whose height is
                animating — putting y on the box fights its own reflow. */}
            <motion.div
              initial={{ y: -6 }}
              animate={{ y: 0 }}
              exit={{ y: -6 }}
              transition={{ duration: SLIDE_S, ease: EASE }}
              className={`mt-5 grid grid-cols-1 gap-x-6 gap-y-4 ${
                day.image ? "md:grid-cols-[1fr_348px]" : ""
              }`}
            >
              <p className="font-body text-b4-mobile md:text-b4-desktop text-dark-gray">
                {day.description}
              </p>
              {day.image && (
                <div className="relative aspect-16/10 overflow-hidden rounded-md bg-light-grey md:row-span-2">
                  <ImageWithSkeleton
                    src={day.image}
                    alt={day.imageAlt ?? day.title}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 348px"
                    className="object-cover"
                  />
                </div>
              )}
              {day.details.length > 0 && (
                <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  {day.details.map((d) => (
                    <li key={d.label} className="flex items-start gap-3">
                      <span className="shrink-0 text-midnight">
                        <Icon name={d.icon} className="size-5" />
                      </span>
                      <div>
                        <p className="font-sans text-b4-desktop font-bold text-midnight">
                          {d.label}
                        </p>
                        <p className="font-body text-b4-mobile md:text-b4-desktop text-dark-gray whitespace-pre-line">
                          {d.value}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
