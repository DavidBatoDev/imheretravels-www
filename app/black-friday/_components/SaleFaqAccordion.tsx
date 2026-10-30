"use client";

import { useId, useState, type ReactNode } from "react";

type Item = { q: string; a: string };

// Answers may carry a `[text](url)` link (Terms, Contact us).
const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

function renderAnswer(text: string) {
  const nodes: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  LINK_PATTERN.lastIndex = 0;
  while ((m = LINK_PATTERN.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const [, label, href] = m;
    const external = href.startsWith("http");
    nodes.push(
      <a
        key={m.index}
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="underline underline-offset-2 hover:text-crimson-red"
      >
        {label}
      </a>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/**
 * Sale FAQs. Opening/closing animates with a CSS grid-rows transition, so the
 * answer's real height changes in one smooth reflow per frame. The shared
 * FaqAccordion animates row positions with transforms (framer `layout`),
 * which made the footer below jump while the rows were still sliding.
 * `overflow-anchor: none` keeps the browser's scroll anchoring from nudging
 * the page during the transition.
 */
export default function SaleFaqAccordion({ items, defaultOpen = 0 }: { items: Item[]; defaultOpen?: number | null }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const baseId = useId();

  return (
    <div className="[overflow-anchor:none]">
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;
        return (
          <div key={item.q} className={i < items.length - 1 ? "border-b border-[#d7d6db]" : undefined}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-4 py-4 text-left font-sans text-h6-mobile text-midnight transition-colors hover:text-crimson-red md:text-h6-desktop"
              >
                <span>{item.q}</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                  className={`shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
                >
                  <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`grid transition-[grid-template-rows,opacity] duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden" inert={!isOpen}>
                <p className="whitespace-pre-line pb-5 font-body text-b2-mobile text-midnight md:text-b2-desktop">
                  {renderAnswer(item.a)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
