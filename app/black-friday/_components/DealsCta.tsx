"use client";

import { animate, motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import type { MouseEvent } from "react";

// Ease-in-out: starts gently, glides, settles; an ease-out curve covered most of the
// distance in the first frames and read as a jump.
const SCROLL_EASE = [0.65, 0, 0.35, 1] as const;

/**
 * "See the deals": a gently bobbing arrow, and a click that glides down to
 * the deals with an eased scroll (instead of the browser's fixed-speed
 * smooth scroll), then moves focus to the section heading for keyboard and
 * screen-reader users. Reduced motion: a plain jump.
 */
export default function DealsCta() {
  const reduce = useReducedMotion() ?? false;

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById("deals");
    if (!target) return; // fall back to the plain #deals link
    e.preventDefault();

    const html = document.documentElement;
    const offset = parseFloat(getComputedStyle(html).scrollPaddingTop) || 80;
    const to = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
    const land = () => {
      history.replaceState(null, "", "#deals");
      document.getElementById("deals-heading")?.focus({ preventScroll: true });
    };

    if (reduce) {
      window.scrollTo({ top: to, behavior: "auto" });
      land();
      return;
    }

    // CSS `scroll-behavior: smooth` would fight a per-frame scrollTo.
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    const distance = Math.abs(to - window.scrollY);
    animate(window.scrollY, to, {
      duration: Math.min(1.2, 0.6 + distance / 2500),
      ease: SCROLL_EASE,
      onUpdate: (v) => window.scrollTo(0, v),
      onComplete: () => {
        html.style.scrollBehavior = prev;
        land();
      },
    });
  };

  return (
    <motion.a
      href="#deals"
      onClick={onClick}
      whileHover={reduce ? undefined : { y: -2, scale: 1.02 }}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-crimson-red px-8 py-3.5 font-body font-bold text-white shadow-small transition-colors hover:bg-light-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      See the deals
      <motion.span
        aria-hidden="true"
        className="inline-flex"
        animate={reduce ? undefined : { y: [0, 4, 0] }}
        transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.4 }}
      >
        <ArrowDown className="size-4" strokeWidth={2.5} />
      </motion.span>
    </motion.a>
  );
}
