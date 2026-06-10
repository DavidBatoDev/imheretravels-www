import type { ReactNode } from "react";
import type { Tour } from "@/types/tour";
import Icon from "./Icon";

function toBulletItems(value: string): string[] {
  return value
    .split(/\r?\n|•/g)
    .flatMap((part) => part.split(/\s*,\s*/g))
    .map((part) => part.trim().replace(/^[-*]\s+/, ""))
    .filter(Boolean);
}

// Mirrors the admin editor's inline rendering: arrays and "known list" labels
// (Activities / Others / Transport) become full bullet lists, while any other
// field honours per-line "- " prefixes — so bullets formatted in admin show as
// bullets on www instead of collapsing into one run-on paragraph.
type Line = { text: string; bullet: boolean };

function toLines(label: string, value: string | string[]): Line[] {
  const forceBullets = /activities|others?|transport/i.test(label);

  if (Array.isArray(value)) {
    // Arrays are inherently list items (e.g. "Others"); split each entry too in
    // case a single string packs several comma/newline-separated values.
    return value
      .flatMap((v) => (forceBullets ? toBulletItems(v) : [v]))
      .map((text) => text.trim())
      .filter(Boolean)
      .map((text) => ({ text, bullet: true }));
  }

  if (forceBullets) {
    return toBulletItems(value).map((text) => ({ text, bullet: true }));
  }

  // Free-text field: each line is a bullet only when written with a "- " prefix.
  return value
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      const trimmed = line.trimStart();
      const bullet = trimmed.startsWith("- ");
      return { text: bullet ? trimmed.replace(/^-\s+/, "") : line, bullet };
    });
}

function includedOrder(label: string): number {
  const normalized = label.trim().toLowerCase();
  const compact = normalized.replace(/[\s-]/g, "");
  if (/^meals?$/.test(normalized)) return 0;
  if (/^transport$/.test(normalized)) return 1;
  if (/^add[\s-]?on activities?$/.test(normalized)) return 3;
  if (/^activities?$/.test(normalized)) return 2;
  if (compact === "stay" || compact === "accomodation" || compact === "accommodation") {
    return 4;
  }
  if (/^others?$/.test(normalized)) return 5;
  return Number.MAX_SAFE_INTEGER;
}

function getDisplayLabel(label: string): string {
  return /^stay$/i.test(label.trim()) ? "Accomodation" : label;
}

const TEXT_CLASS = "font-body text-b4-mobile md:text-b4-desktop text-dark-gray";

export default function WhatsIncluded({
  section,
}: {
  section: NonNullable<Tour["whatsIncluded"]>;
}) {
  const orderedItems = section.items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const orderDiff = includedOrder(a.item.label) - includedOrder(b.item.label);
      return orderDiff !== 0 ? orderDiff : a.index - b.index;
    })
    .map(({ item }) => item);

  return (
    <section className="mt-10 w-full md:mt-14">
      <h2 className="font-sans text-h3-mobile md:text-h3-desktop text-midnight">
        {section.heading}
      </h2>
      <ul className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {orderedItems.map((item) => {
          const lines = toLines(item.label, item.value);

          return (
            <li key={item.label} className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-light-grey text-midnight">
                <Icon name={item.icon} className="size-5" />
              </span>
              <div className="space-y-1">
                <p className="font-sans text-b2-desktop font-bold text-midnight">
                  {getDisplayLabel(item.label)}
                </p>
                {renderLines(item.label, lines)}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// Groups consecutive bullet lines into a single <ul> and renders plain lines as
// <p>, preserving the order the content was written in.
function renderLines(label: string, lines: Line[]) {
  const blocks: ReactNode[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = (key: string) => {
    if (!bulletBuffer.length) return;
    blocks.push(
      <ul key={key} className="list-disc space-y-1 pl-4 marker:text-dark-gray">
        {bulletBuffer.map((text, i) => (
          <li key={`${key}-${i}-${text}`} className={TEXT_CLASS}>
            {text}
          </li>
        ))}
      </ul>,
    );
    bulletBuffer = [];
  };

  lines.forEach((line, i) => {
    if (line.bullet) {
      bulletBuffer.push(line.text);
      return;
    }
    flushBullets(`${label}-ul-${i}`);
    blocks.push(
      <p key={`${label}-p-${i}`} className={TEXT_CLASS}>
        {line.text}
      </p>,
    );
  });
  flushBullets(`${label}-ul-end`);

  return blocks;
}
