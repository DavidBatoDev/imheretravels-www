/**
 * Sale FAQ copy. Answers may use `[text](url)` links (rendered by FaqAccordion).
 * `percent` set = a flat-percentage sale (every slot the same % off), else tiered.
 */
export function saleFaqs(holdMinutes: number, percent: number | null = null): { q: string; a: string }[] {
  const slotsFaqs = percent
    ? [
        {
          q: "How do slots work?",
          a: `Each slot is one person's place on the tour, and each tour in the sale has a set number of them (for example 10). Every slot is ${percent}% off the regular price of the travel date you pick. When you book, each person in your party takes one of the free slots.`,
        },
        {
          q: "How much do I save?",
          a: `${percent}% off the tour's regular price for your travel date, for every person in your party. Sale places are limited, so once a tour's slots are gone, it's back to the regular price.`,
        },
      ]
    : null;
  return [
    ...(slotsFaqs ?? [
    {
      q: "How do slots work?",
      a: "Each slot is one person's place on the tour, and each tour in the sale has a set number of them (for example 10). They're sold in order: slot 1 is the cheapest, slot 2 costs a little more, and so on. When you book, each person in your party takes the next free slot — so a Duo booking after slot 1 has gone gets slots 2 and 3, and the card then shows the new lowest price.",
    },
    {
      q: "Why do earlier slots cost less?",
      a: "It's our way of thanking the travellers who commit first. The earlier slots carry the biggest discounts, so the sooner you book, the more you save. Every slot is still cheaper than the tour's normal price.",
    },
    ]),
    {
      q: "What happens when I hold a slot?",
      a: `We keep your slots for you for ${holdMinutes} minutes while you finish booking. Only you see the timer — everyone else just sees those slots as "on hold". If you don't finish in time, they go back on sale.`,
    },
    {
      q: "Can I pick my travel date?",
      a: "Yes. You choose your date in the next step, from any available date of that tour.",
    },
    {
      q: "What do I pay today?",
      a: "Just the tour's reservation fee for each person in your party. The rest of the sale price is paid in instalments before you travel.",
    },
    {
      q: "Is it refundable?",
      a: "No. Black Friday bookings are non-refundable, as set out in our [Terms & Conditions](/terms-and-conditions). Please make sure of your plans before you book.",
    },
    {
      q: "What if the timer runs out?",
      a: percent
        ? `Your slots are released and go back on sale for everyone. If they're still free, you can hold them again at the same ${percent}% off.`
        : "Your slots are released and go back on sale for everyone. If they're still free, you can hold them again — but the price is whatever the next free slot costs at that moment.",
    },
  ];
}
