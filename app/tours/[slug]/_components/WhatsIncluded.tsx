import type { Tour } from "@/types/tour";
import Icon from "./Icon";

function toBulletItems(value: string): string[] {
  return value
    .split(/\r?\n|\u2022/g)
    .flatMap((part) => part.split(/\s*,\s*/g))
    .map((part) => part.trim().replace(/^[-*]\s+/, ""))
    .filter(Boolean);
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
          const useBullets = /activities|others?/i.test(item.label);
          const bulletItems = useBullets
            ? Array.isArray(item.value)
              ? item.value.flatMap(toBulletItems)
              : toBulletItems(item.value)
            : [];
          const textValue = Array.isArray(item.value)
            ? item.value.join(", ")
            : item.value;

          return (
            <li key={item.label} className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-light-grey text-midnight">
                <Icon name={item.icon} className="size-5" />
              </span>
              <div>
                <p className="font-sans text-b2-desktop font-bold text-midnight">
                  {getDisplayLabel(item.label)}
                </p>
                {useBullets ? (
                  <ul className="mt-1 list-disc space-y-1 pl-4 marker:text-dark-gray">
                    {bulletItems.map((v, index) => (
                      <li
                        key={`${item.label}-${index}-${v}`}
                        className="font-body text-b4-mobile md:text-b4-desktop text-dark-gray"
                      >
                        {v}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 font-body text-b4-mobile md:text-b4-desktop text-dark-gray">
                    {textValue}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
