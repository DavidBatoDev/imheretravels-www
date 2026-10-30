"use client";

import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import { Check, ChevronDown, Copy, ExternalLink, Loader2, Minus, Plus, TimerOff } from "lucide-react";
import BottomSheet from "./BottomSheet";
import SlotLadder from "./SlotLadder";
import { useClock } from "./hooks";
import { MAX_PARTY_SIZE, reservationFormHref } from "@/lib/sale/config";
import {
  availabilityLine,
  formatCountdown,
  formatGBP,
  holdReference,
  isSoldOut,
  maxParty,
  partyLabel,
  peopleLabel,
  pickSlots,
} from "@/lib/sale/ladder";
import type { ClaimResult } from "@/lib/sale/api";
import type { PublicTourAvailability, SaleHoldView, SalePageTour } from "@/lib/sale/types";

export type ActiveHold = {
  hold: SaleHoldView;
  holdParam: string;
  /** server clock − client clock, ms */
  serverOffsetMs: number;
};

type ClaimFailure = Extract<ClaimResult, { ok: false }>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type PartyMode = "solo" | "duo" | "group";

const STEPPER_BTN =
  "inline-flex size-11 items-center justify-center rounded-full bg-white text-midnight transition-colors hover:bg-midnight hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-midnight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-red";

/** Breakdown rows shown before "Show all N slots" for big groups. */
const BREAKDOWN_PREVIEW = 3;

function errorCopy(err: ClaimFailure): string {
  switch (err.error) {
    case "sale_closed":
      return "The sale isn't taking holds right now. Please check back soon.";
    case "hold_in_payment":
      return "This email already has slots mid-payment. Finish that payment first, or use a different email.";
    case "rate_limited": {
      const s = err.retryAfterS ?? 60;
      const wait = s >= 90 ? `about ${Math.ceil(s / 60)} minutes` : `${s} seconds`;
      return `Too many attempts. Please try again in ${wait}.`;
    }
    case "invalid_request":
      return "Something in the form didn't look right. Check your email address and try again.";
    case "sale_not_found":
    case "tour_not_in_sale":
      return "This tour is no longer part of the sale.";
    case "network":
      return "We couldn't reach our booking system. Check your connection and try again.";
    default:
      return "Something went wrong holding your slots. Please try again.";
  }
}

export default function ClaimSheet({
  open,
  onClose,
  tour,
  availability,
  saleOpen,
  closedLabel,
  holdMinutes,
  activeHold,
  redirecting,
  announcement,
  mock,
  onClaim,
  onTryAgain,
}: {
  open: boolean;
  onClose: () => void;
  tour: SalePageTour;
  availability: PublicTourAvailability | undefined;
  saleOpen: boolean;
  closedLabel: string;
  holdMinutes: number;
  /** The visitor's live hold on this tour, if any. */
  activeHold: ActiveHold | null;
  redirecting: boolean;
  /** Polite live-region text for availability changes on this tour. */
  announcement: string;
  mock: boolean;
  onClaim: (partySize: number, email: string, website: string) => Promise<ClaimResult>;
  onTryAgain: () => void;
}) {
  const titleId = useId();
  const formId = useId();
  const emailId = useId();
  const emailHelpId = useId();
  const emailErrId = useId();

  const [mode, setMode] = useState<PartyMode>("solo");
  const [groupSize, setGroupSize] = useState(3);
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ClaimFailure | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);

  const maxP = maxParty(availability);
  const requested = mode === "solo" ? 1 : mode === "duo" ? 2 : groupSize;
  // One slot per person: never ask for more slots than are free right now.
  const party = Math.max(1, Math.min(requested, maxP || 1));
  const clamped = requested > maxP && maxP > 0;
  const groupMax = Math.max(3, maxP);
  const effectiveMode: PartyMode = party === 1 ? "solo" : party === 2 ? "duo" : "group";

  const choose = (size: number) => {
    const n = Math.max(1, Math.min(size, MAX_PARTY_SIZE));
    if (n === 1) setMode("solo");
    else if (n === 2) setMode("duo");
    else {
      setMode("group");
      setGroupSize(n);
    }
    setError(null);
  };
  const picked = availability ? pickSlots(availability.slots, party) ?? [] : [];
  const total = picked.reduce((sum, s) => sum + s.salePrice, 0);
  const originalTotal = tour.originalPrice * picked.length;
  const saved = Math.max(0, originalTotal - total);
  const deposit = tour.depositGBP;
  const dueToday = deposit ? deposit * party : null;
  const balance = dueToday !== null ? Math.max(0, total - dueToday) : null;
  const soldOut = isSoldOut(availability);
  const canClaim = saleOpen && maxP > 0;
  const slotWord = party === 1 ? "slot" : "slots";
  const collapsible = picked.length > BREAKDOWN_PREVIEW + 1;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (submitting || !canClaim) return;
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setEmailError("Enter a valid email address, like name@example.com.");
      emailRef.current?.focus();
      return;
    }
    setEmailError(null);
    setError(null);
    setSubmitting(true);
    const res = await onClaim(party, trimmed, website);
    setSubmitting(false);
    // On not_enough_slots the parent has already refreshed availability, so the
    // party selector re-clamps itself; the message offers the size that fits.
    if (!res.ok) setError(res);
  }

  const title = (
    <>
      <h2 id={titleId} className="font-sans text-h5-mobile text-midnight md:text-h5-desktop">
        {tour.displayName}
      </h2>
      <p className="mt-0.5 font-body text-b4-mobile text-dark-gray md:text-b4-desktop">
        {[tour.durationLabel, "Black Friday slots"].filter(Boolean).join(" · ")}
      </p>
    </>
  );

  // ── Held: the visitor's own slots, with the only timer anyone sees ───────
  if (activeHold) {
    return (
      <BottomSheet open={open} onClose={onClose} labelledBy={titleId} title={title}
        footer={<HeldFooter activeHold={activeHold} mock={mock} onTryAgain={onTryAgain} onClose={onClose} />}
      >
        <HeldBody activeHold={activeHold} redirecting={redirecting} mock={mock} />
      </BottomSheet>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  const notEnough = error?.error === "not_enough_slots" ? error : null;
  const otherError = error && error.error !== "not_enough_slots" ? error : null;

  const footer = (
    <div>
      {canClaim && (
        <div className="mb-3 flex items-baseline justify-between gap-3 tabular-nums">
          <span className="font-body text-b4-mobile text-dark-gray md:text-b4-desktop">Due today</span>
          <span className="font-sans text-h6-mobile text-midnight md:text-h6-desktop">
            {dueToday !== null ? formatGBP(dueToday) : "Reservation fee"}
          </span>
        </div>
      )}
      <button
        type="submit"
        form={formId}
        disabled={!canClaim || submitting}
        aria-disabled={!canClaim || submitting}
        className={`inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-body font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-red ${
          canClaim
            ? "bg-crimson-red text-white shadow-small hover:bg-light-red disabled:cursor-wait disabled:opacity-80"
            : "cursor-not-allowed bg-light-grey text-dark-gray"
        }`}
      >
        {submitting ? (
          <>
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            Holding your {slotWord}…
          </>
        ) : !saleOpen ? (
          closedLabel
        ) : soldOut ? (
          "Sold out"
        ) : maxP === 0 ? (
          "All slots on hold"
        ) : (
          `Hold my ${slotWord} for ${holdMinutes} min`
        )}
      </button>
      <p className="mt-3 text-center font-body text-b4-mobile text-dark-gray">
        Black Friday bookings are non-refundable.{" "}
        <Link
          href="/terms-and-conditions"
          target="_blank"
          rel="noopener"
          className="font-medium text-midnight underline underline-offset-2 hover:text-crimson-red"
        >
          Terms &amp; Conditions
        </Link>
      </p>
    </div>
  );

  return (
    <BottomSheet open={open} onClose={onClose} labelledBy={titleId} title={title} footer={footer}>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-6">
        {availability && availability.slots.length > 0 && (
          <div>
            <SlotLadder slots={availability.slots} highlight={picked.map((s) => s.index)} />
            <p className="mt-2 font-body text-b4-mobile font-medium text-midnight tabular-nums md:text-b4-desktop">
              {availabilityLine(availability)}
            </p>
          </div>
        )}

        {canClaim && (
          <fieldset>
            <legend className="font-sans text-h6-mobile text-midnight md:text-h6-desktop">
              Who&apos;s travelling?
            </legend>
            <p className="mt-1 font-body text-b4-mobile text-dark-gray md:text-b4-desktop">
              One slot per person.
              {/* Only when it limits the choice; the count sits under the ladder. */}
              {maxP < 3 && (
                <span className="font-medium text-midnight">
                  {maxP === 1 ? " Only 1 left — Solo only." : ` Only ${maxP} left.`}
                </span>
              )}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(
                [
                  { key: "solo", label: "Solo", size: 1 },
                  { key: "duo", label: "Duo", size: 2 },
                  { key: "group", label: "Group", size: 3 },
                ] as const
              ).map((opt) => {
                const slots = availability ? pickSlots(availability.slots, opt.size) : null;
                const disabled = !slots || submitting;
                const checked = effectiveMode === opt.key;
                const sub = !slots
                  ? "Not enough"
                  : opt.key === "group"
                    ? `3–${groupMax} people`
                    : formatGBP(slots.reduce((t, x) => t + x.salePrice, 0));
                return (
                  <label
                    key={opt.key}
                    className={`relative flex min-h-14 cursor-pointer flex-col justify-center rounded-md border-2 px-3 py-2 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-crimson-red ${
                      !slots
                        ? "cursor-not-allowed border-light-grey bg-light-grey/60 text-dark-gray"
                        : checked
                          ? "border-midnight bg-midnight text-white"
                          : "border-light-grey bg-white text-midnight hover:border-grey"
                    }`}
                  >
                    <input
                      type="radio"
                      name="party"
                      value={opt.key}
                      checked={checked}
                      disabled={disabled}
                      onChange={() => choose(opt.key === "group" ? Math.min(groupSize, groupMax) : opt.size)}
                      className="sr-only"
                    />
                    <span className="font-body text-b4-desktop font-bold">{opt.label}</span>
                    <span
                      className={`font-body text-b4-mobile tabular-nums ${checked ? "text-white/80" : "text-dark-gray"}`}
                    >
                      {sub}
                    </span>
                  </label>
                );
              })}
            </div>

            {effectiveMode === "group" && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-light-grey px-3 py-2">
                <span className="font-body text-b2-mobile font-medium text-midnight md:text-b4-desktop">
                  Group size
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => choose(party - 1)}
                    disabled={party <= 3 || submitting}
                    aria-label="One person fewer"
                    className={STEPPER_BTN}
                  >
                    <Minus className="size-4" strokeWidth={2.5} aria-hidden="true" />
                  </button>
                  <output
                    aria-live="polite"
                    className="min-w-[5.5rem] text-center font-body text-b2-mobile font-bold text-midnight tabular-nums md:text-b4-desktop"
                  >
                    {peopleLabel(party)}
                  </output>
                  <button
                    type="button"
                    onClick={() => choose(party + 1)}
                    disabled={party >= maxP || submitting}
                    aria-label="One person more"
                    className={STEPPER_BTN}
                  >
                    <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
            {clamped && (
              <p className="mt-2 font-body text-b4-mobile text-midnight md:text-b4-desktop">
                Availability changed, so we&apos;ve switched you to {partyLabel(party)}.
              </p>
            )}
          </fieldset>
        )}

        {!canClaim && (
          <div className="rounded-md bg-light-grey p-4 font-body text-b2-mobile text-midnight md:text-b4-desktop">
            {!saleOpen
              ? `${closedLabel}. You can still look around — holds open when the sale is live.`
              : soldOut
                ? "Just sold out. Every slot on this tour has gone."
                : "All slots are on hold right now. They may free up soon if a booking isn't finished."}
          </div>
        )}

        {canClaim && picked.length > 0 && (
          <section aria-label="Price breakdown" className="rounded-md bg-light-grey p-4 tabular-nums">
            <p className="mb-2 font-body text-b4-mobile text-dark-gray md:text-b4-desktop">
              {party === 1 ? "Your slot" : `Your ${party} slots, one per person`}
            </p>
            <ul id={`${formId}-slots`} className="space-y-2">
              {(collapsible && !showAllSlots ? picked.slice(0, BREAKDOWN_PREVIEW) : picked).map((s) => (
                <li key={s.index} className="flex items-baseline justify-between gap-3 font-body text-b2-mobile text-midnight md:text-b4-desktop">
                  <span>
                    Slot {s.index}
                    <span className="text-dark-gray"> · save {formatGBP(s.discountGBP)}</span>
                  </span>
                  <span className="font-medium">{formatGBP(s.salePrice)}</span>
                </li>
              ))}
            </ul>
            {collapsible && (
              <button
                type="button"
                onClick={() => setShowAllSlots((v) => !v)}
                aria-expanded={showAllSlots}
                aria-controls={`${formId}-slots`}
                className="mt-1 inline-flex min-h-11 items-center gap-1 rounded-sm font-body text-b4-desktop font-bold text-midnight underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-red"
              >
                {showAllSlots ? "Show fewer" : `Show all ${picked.length} slots`}
                <ChevronDown
                  className={`size-4 transition-transform ${showAllSlots ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
            )}
            <div className="my-3 h-px bg-grey/40" />
            <div className="flex items-baseline justify-between gap-3 font-body text-b2-mobile text-midnight md:text-b4-desktop">
              <span className="font-bold">
                Total tour price
                {party > 1 && <span className="font-normal text-dark-gray"> · {peopleLabel(party)}</span>}
              </span>
              <span className="font-bold">{formatGBP(total)}</span>
            </div>
            {saved > 0 && (
              <p className="mt-1 text-right font-body text-b4-mobile text-dark-gray">
                You save {formatGBP(saved)} on {formatGBP(originalTotal)}
              </p>
            )}
            <div className="mt-4 rounded-sm bg-white p-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-body text-b2-mobile font-bold text-midnight md:text-b4-desktop">Due today</span>
                <span className="font-sans text-h6-mobile text-crimson-red md:text-h6-desktop">
                  {dueToday !== null ? formatGBP(dueToday) : "—"}
                </span>
              </div>
              <p className="mt-1 font-body text-b4-mobile text-dark-gray">
                {dueToday !== null && deposit
                  ? `Reservation fee (${formatGBP(deposit)} × ${party})`
                  : "Reservation fee — shown in the next step"}
              </p>
              <p className="mt-2 font-body text-b4-mobile text-midnight">
                {balance !== null
                  ? `Balance of ${formatGBP(balance)} in instalments at the sale price.`
                  : "The balance is paid in instalments at the sale price."}
              </p>
            </div>
          </section>
        )}

        {canClaim && (
          <div>
            <label htmlFor={emailId} className="block font-sans text-h6-mobile text-midnight md:text-h6-desktop">
              Your email
            </label>
            <p id={emailHelpId} className="mt-1 font-body text-b4-mobile text-dark-gray md:text-b4-desktop">
              We hold your {slotWord} against this email for {holdMinutes} minutes. You&apos;ll pick
              your travel date in the next step.
            </p>
            <input
              ref={emailRef}
              id={emailId}
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              aria-invalid={emailError ? true : undefined}
              aria-describedby={`${emailHelpId}${emailError ? ` ${emailErrId}` : ""}`}
              placeholder="name@example.com"
              className={`mt-2 block min-h-12 w-full rounded-sm border-2 bg-white px-4 py-3 font-body text-base text-midnight placeholder:text-grey focus:border-midnight focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-red ${
                emailError ? "border-crimson-red" : "border-light-grey"
              }`}
            />
            {emailError && (
              <p id={emailErrId} className="mt-2 font-body text-b4-mobile font-medium text-crimson-red md:text-b4-desktop">
                {emailError}
              </p>
            )}
            {/* Honeypot: hidden from people and assistive tech; bots fill it. */}
            <div aria-hidden="true" className="absolute -left-[10000px] top-auto size-px overflow-hidden">
              <label>
                Website
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </label>
            </div>
          </div>
        )}

        {notEnough && (
          <div role="alert" className="rounded-md border-2 border-crimson-red/30 bg-crimson-red/5 p-4">
            {notEnough.left && notEnough.left > 0 ? (
              <>
                <p className="font-body text-b2-mobile font-bold text-midnight md:text-b4-desktop">
                  Only {notEnough.left} left — book {partyLabel(Math.min(notEnough.left, MAX_PARTY_SIZE))}?
                </p>
                <p className="mt-1 font-body text-b4-mobile text-dark-gray">
                  Someone grabbed a slot just before you. Prices above are updated.
                </p>
                {party !== Math.min(notEnough.left, MAX_PARTY_SIZE) && (
                  <button
                    type="button"
                    onClick={() => choose(Math.min(notEnough.left ?? 1, MAX_PARTY_SIZE))}
                    className="mt-3 inline-flex min-h-11 items-center rounded-full bg-midnight px-5 font-body text-b4-desktop font-bold text-white hover:bg-dark-gray focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-red"
                  >
                    Switch to {partyLabel(Math.min(notEnough.left, MAX_PARTY_SIZE))}
                  </button>
                )}
              </>
            ) : (
              <p className="font-body text-b2-mobile font-bold text-midnight md:text-b4-desktop">
                Just sold out. The last slots went moments ago.
              </p>
            )}
          </div>
        )}

        {otherError && (
          <p role="alert" className="rounded-md border-2 border-crimson-red/30 bg-crimson-red/5 p-4 font-body text-b2-mobile text-midnight md:text-b4-desktop">
            {errorCopy(otherError)}
          </p>
        )}

        {mock && (
          <p className="font-body text-b4-mobile text-dark-gray">
            Dev mock: no real hold is created. Try +race, +soldout, +ratelimit, +paying or +short in the email.
          </p>
        )}
      </form>
    </BottomSheet>
  );
}

function useRemaining(activeHold: ActiveHold): number {
  const now = useClock();
  if (now === 0) return Number.POSITIVE_INFINITY;
  return Date.parse(activeHold.hold.displayExpiresAt) - (now + activeHold.serverOffsetMs);
}

function HeldBody({
  activeHold,
  redirecting,
  mock,
}: {
  activeHold: ActiveHold;
  redirecting: boolean;
  mock: boolean;
}) {
  const remaining = useRemaining(activeHold);
  const { hold } = activeHold;
  const ended = remaining <= 0;
  const [copied, setCopied] = useState(false);
  const ref = holdReference(hold.holdId);
  const total = hold.slots.reduce((s, x) => s + x.salePrice, 0);
  const many = hold.slots.length > 1;

  if (ended) {
    return (
      <div className="py-4 text-center" role="status">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-light-grey text-midnight">
          <TimerOff className="size-6" aria-hidden="true" />
        </span>
        <h3 className="mt-4 font-sans text-h5-mobile text-midnight md:text-h5-desktop">Your hold has ended</h3>
        <p className="mx-auto mt-2 max-w-sm font-body text-b2-mobile text-dark-gray md:text-b4-desktop">
          Your {many ? "slots have" : "slot has"} gone back on sale. If {many ? "they're" : "it's"} still
          free you can hold {many ? "them" : "it"} again.
        </p>
      </div>
    );
  }

  return (
    <div className="tabular-nums">
      <div className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-spring-green/25 text-midnight">
          <Check className="size-7" strokeWidth={2.5} aria-hidden="true" />
        </span>
        <h3 className="mt-3 font-sans text-h5-mobile text-midnight md:text-h5-desktop">
          {many ? "Slots held" : "Slot held"}
        </h3>
        <p
          role="timer"
          aria-label={`Time left on your hold: ${formatCountdown(remaining)}`}
          className="mt-1 font-display text-h2-mobile text-midnight md:text-h2-desktop"
        >
          {Number.isFinite(remaining) ? formatCountdown(remaining) : "--:--"}
        </p>
        <p className="mx-auto mt-1 max-w-sm font-body text-b4-mobile text-dark-gray md:text-b4-desktop">
          Only you see this timer. Everyone else just sees your {many ? "slots" : "slot"} as on hold.
        </p>
      </div>

      <ul className="mt-5 space-y-2 rounded-md bg-light-grey p-4">
        {hold.slots.map((s) => (
          <li key={s.index} className="flex items-baseline justify-between gap-3 font-body text-b2-mobile text-midnight md:text-b4-desktop">
            <span>Slot {s.index}</span>
            <span className="font-medium">{formatGBP(s.salePrice)}</span>
          </li>
        ))}
        {many && (
          <li className="flex items-baseline justify-between gap-3 border-t border-grey/40 pt-2 font-body text-b2-mobile font-bold text-midnight md:text-b4-desktop">
            <span>Total tour price</span>
            <span>{formatGBP(total)}</span>
          </li>
        )}
      </ul>

      {hold.checkoutMode === "auto" ? (
        <p className="mt-4 text-center font-body text-b2-mobile text-midnight md:text-b4-desktop" role="status">
          {redirecting
            ? "Taking you to booking…"
            : "Continue to booking to choose your travel date and pay the reservation fee."}
          {mock && " (Dev mock: auto-redirect is off.)"}
        </p>
      ) : (
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3 rounded-md border-2 border-light-grey p-3">
            <div>
              <p className="font-body text-b4-mobile text-dark-gray">Your reference</p>
              <p className="font-sans text-h6-mobile tracking-wide text-midnight md:text-h6-desktop">{ref}</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(ref);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 font-body text-b4-desktop font-bold text-midnight hover:bg-light-grey focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-red"
            >
              {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {hold.slots.map((s) =>
              s.paymentLinkUrl ? (
                <li key={s.index}>
                  <a
                    href={s.paymentLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-12 items-center justify-between gap-3 rounded-full bg-crimson-red px-5 py-3 font-body font-bold text-white shadow-small transition-colors hover:bg-light-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-red"
                  >
                    <span>
                      Pay for slot {s.index} · {formatGBP(s.salePrice)}
                    </span>
                    <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ) : (
                <li key={s.index} className="rounded-md bg-light-grey px-4 py-3 font-body text-b4-mobile text-midnight md:text-b4-desktop">
                  Slot {s.index}: payment link coming — <Link href="/contact-us" className="underline">contact us</Link> with your reference.
                </li>
              ),
            )}
          </ul>
          <p className="mt-4 font-body text-b2-mobile text-midnight md:text-b4-desktop">
            Our team confirms your slot once payment arrives.
          </p>
        </div>
      )}
    </div>
  );
}

function HeldFooter({
  activeHold,
  mock,
  onTryAgain,
  onClose,
}: {
  activeHold: ActiveHold;
  mock: boolean;
  onTryAgain: () => void;
  onClose: () => void;
}) {
  const remaining = useRemaining(activeHold);
  const btn =
    "inline-flex min-h-13 w-full items-center justify-center rounded-full px-6 py-3.5 font-body font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-red";
  if (remaining <= 0) {
    return (
      <button type="button" onClick={onTryAgain} data-autofocus className={`${btn} bg-crimson-red text-white shadow-small hover:bg-light-red`}>
        Try again
      </button>
    );
  }
  if (activeHold.hold.checkoutMode === "auto") {
    const href = reservationFormHref(activeHold.hold.tourSlug, activeHold.holdParam);
    return (
      <a
        href={mock ? "#" : href}
        onClick={mock ? (e) => e.preventDefault() : undefined}
        data-autofocus
        className={`${btn} bg-crimson-red text-white shadow-small hover:bg-light-red`}
      >
        Continue to booking
      </a>
    );
  }
  return (
    <button type="button" onClick={onClose} className={`${btn} bg-midnight text-white hover:bg-dark-gray`}>
      Done
    </button>
  );
}
