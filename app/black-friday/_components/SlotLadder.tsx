"use client";

import { useEffect, useRef } from "react";
import { formatGBP } from "@/lib/sale/ladder";
import type { PublicSlot } from "@/lib/sale/types";

const STATE_LABEL: Record<PublicSlot["state"], string> = {
  available: "available",
  on_hold: "on hold",
  sold: "sold",
};

/**
 * The tour's slots in ladder order (one slot = one person), as a compact
 * horizontal scroller so 10–20 slots still fit a phone. Sold slots are muted
 * and struck through, held slots are dashed amber ("On hold" — never a timer),
 * free slots are tinted, and the slots `highlight`ed (the ones the selected
 * party would take, or the next free one) are solid crimson. The scroller
 * keeps the first highlighted slot in view as the party size changes.
 */
export default function SlotLadder({
  slots,
  highlight = [],
}: {
  slots: PublicSlot[];
  highlight?: number[];
}) {
  const scrollerRef = useRef<HTMLOListElement | null>(null);
  const nextIndex = slots.find((s) => s.state === "available")?.index;
  const picked = new Set(highlight.length ? highlight : nextIndex ? [nextIndex] : []);
  const first = highlight.length ? Math.min(...highlight) : nextIndex;

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || first === undefined) return;
    const item = el.querySelector<HTMLElement>(`[data-slot="${first}"]`);
    if (!item) return;
    // Show one slot of context to the left of the first picked slot. The
    // scroller is `relative` (it contains the sr-only text), so offsetLeft is
    // measured from it.
    const left = Math.max(0, item.offsetLeft - item.offsetWidth - 6);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left, behavior: reduce ? "auto" : "smooth" });
  }, [first]);

  const overflows = slots.length > 4;

  return (
    <div className="relative">
      <ol
        ref={scrollerRef}
        aria-label="Sale slots, cheapest first. One slot is one person's place."
        tabIndex={overflows ? 0 : undefined}
        className={`no-scrollbar relative flex snap-x gap-1.5 overflow-x-auto overscroll-x-contain rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-red ${overflows ? "pr-8" : ""}`}
      >
        {slots.map((s) => {
          const isPicked = s.state === "available" && picked.has(s.index);
          const tone =
            s.state === "sold"
              ? "bg-light-grey text-dark-gray"
              : s.state === "on_hold"
                ? "border-2 border-dashed border-vivid-orange bg-light-yellow/40 text-midnight"
                : isPicked
                  ? "bg-crimson-red text-white"
                  : "bg-crimson-red/10 text-midnight";
          return (
            <li
              key={s.index}
              data-slot={s.index}
              className={`flex min-h-12 shrink-0 snap-start flex-col items-center justify-center rounded-sm px-1 py-1 text-center tabular-nums ${overflows ? "w-[4.75rem]" : "flex-1"} ${tone}`}
            >
              <span className="sr-only">
                {`Slot ${s.index}, ${formatGBP(s.salePrice)}, ${STATE_LABEL[s.state]}${isPicked ? ", yours if you book now" : ""}`}
              </span>
              <span className="font-body text-[0.75rem] font-medium leading-tight" aria-hidden="true">
                {s.state === "sold" ? `${s.index} · Sold` : s.state === "on_hold" ? "On hold" : `Slot ${s.index}`}
              </span>
              <span
                className={`font-body text-[0.875rem] font-bold leading-tight ${s.state === "sold" ? "line-through decoration-1" : ""}`}
                aria-hidden="true"
              >
                {formatGBP(s.salePrice)}
              </span>
            </li>
          );
        })}
      </ol>
      {overflows && (
        // Fade on the right edge hints that the row scrolls.
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent"
        />
      )}
    </div>
  );
}
