import { formatGBP } from "@/lib/sale/ladder";
import type { PublicSlot } from "@/lib/sale/types";

const STATE_LABEL: Record<PublicSlot["state"], string> = {
  available: "available",
  on_hold: "on hold",
  sold: "sold",
};

/**
 * The tour's discounted slots, cheapest first. Sold slots are muted and struck
 * through, held slots are dashed amber ("On hold" — never a timer), free slots
 * are filled, and the next free slot (the price a new booking gets) is solid
 * crimson. `highlight` marks extra slots a selected party would take.
 */
export default function SlotLadder({
  slots,
  highlight = [],
  size = "md",
}: {
  slots: PublicSlot[];
  highlight?: number[];
  size?: "sm" | "md";
}) {
  const nextIndex = slots.find((s) => s.state === "available")?.index;
  const picked = new Set(highlight.length ? highlight : nextIndex ? [nextIndex] : []);

  return (
    <ol
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${Math.max(slots.length, 1)}, minmax(0, 1fr))` }}
      aria-label="Discounted slots, cheapest first"
    >
      {slots.map((s) => {
        const isPicked = s.state === "available" && picked.has(s.index);
        const base =
          "flex flex-col items-center justify-center rounded-sm px-1 text-center tabular-nums";
        const height = size === "sm" ? "min-h-11 py-1" : "min-h-13 py-1.5";
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
            className={`${base} ${height} ${tone}`}
          >
            <span className="sr-only">
              {`Slot ${s.index}, ${formatGBP(s.salePrice)}, ${STATE_LABEL[s.state]}${isPicked ? ", next up" : ""}`}
            </span>
            <span className="font-body text-[0.75rem] font-medium leading-tight" aria-hidden="true">
              {s.state === "sold" ? "Sold" : s.state === "on_hold" ? "On hold" : `Slot ${s.index}`}
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
  );
}
