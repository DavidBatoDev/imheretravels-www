import { formatGBP } from "@/lib/sale/ladder";
import type { PublicSlot } from "@/lib/sale/types";

/**
 * Three steps plus the ladder rule, illustrated with a real tour's prices
 * (the first tour in the sale) rather than a made-up example.
 */
export default function HowItWorks({
  holdMinutes,
  example,
}: {
  holdMinutes: number;
  example?: { name: string; originalPrice: number; slots: PublicSlot[] };
}) {
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

  return (
    <section aria-labelledby="how-heading" className="bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-16">
        <h2 id="how-heading" className="font-display text-h2-mobile text-midnight md:text-h2-desktop">
          How it works
        </h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3 md:gap-8">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-4 md:flex-col md:gap-3">
              <span
                aria-hidden="true"
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-crimson-red font-sans text-h6-mobile text-white"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="font-sans text-h6-mobile text-midnight md:text-h6-desktop">{s.title}</h3>
                <p className="mt-1 font-body text-b2-mobile text-dark-gray md:text-b4-desktop">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-lg bg-light-grey p-5 md:mt-12 md:flex md:items-center md:justify-between md:gap-10 md:p-7">
          <div className="md:max-w-sm">
            <p className="font-sans text-h5-mobile text-midnight md:text-h5-desktop">
              Earlier slots = bigger savings
            </p>
            <p className="mt-1 font-body text-b2-mobile text-dark-gray md:text-b4-desktop">
              Slot 1 is the cheapest. Each slot after it costs a little more, so the sooner you book,
              the more you save.
            </p>
          </div>
          {example && example.slots.length > 1 && (
            <figure className="mt-5 md:mt-0 md:flex-1">
              <ol className="flex items-end gap-1.5 tabular-nums" aria-label={`${example.name} slot prices`}>
                {example.slots.map((s, i) => {
                  const h = 56 + i * 14;
                  return (
                    <li
                      key={s.index}
                      className={`flex flex-1 flex-col justify-end rounded-sm px-2 pb-2 ${i === 0 ? "bg-crimson-red text-white" : "bg-white text-midnight"}`}
                      style={{ minHeight: `${h}px` }}
                    >
                      <span className="font-body text-[0.75rem] font-medium">Slot {s.index}</span>
                      <span className="font-body text-[0.875rem] font-bold">{formatGBP(s.salePrice)}</span>
                    </li>
                  );
                })}
              </ol>
              <figcaption className="mt-2 font-body text-b4-mobile text-dark-gray md:text-b4-desktop">
                {example.name}, usually {formatGBP(example.originalPrice)} per person.
              </figcaption>
            </figure>
          )}
        </div>
      </div>
    </section>
  );
}
