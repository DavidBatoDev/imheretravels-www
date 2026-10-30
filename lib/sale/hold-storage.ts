/**
 * The visitor's own held slots, remembered in localStorage so the sale page can
 * offer "Resume your held slots" if they come back before the hold ends.
 * Every access is wrapped in try/catch (private mode, blocked storage) and the
 * page works without it.
 */

import { HOLD_STORAGE_KEY } from "./config";
import type { SaleHoldView } from "./types";

export interface StoredHold {
  holdParam: string;
  tourSlug: string;
  /** hold.displayExpiresAt — what the countdown runs to. */
  expiresAt: string;
  tourPackageId: string;
  checkoutMode: SaleHoldView["checkoutMode"];
  /** server clock − client clock at claim time, ms. */
  serverOffsetMs: number;
  /** Snapshot of the hold for the manual-checkout view (payment links etc.). */
  hold: SaleHoldView;
}

const CHANGE_EVENT = "iht:sale-hold-change";

export function readStoredHoldRaw(): string | null {
  try {
    return window.localStorage.getItem(HOLD_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function parseStoredHold(raw: string | null): StoredHold | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as StoredHold;
    if (!v || typeof v.holdParam !== "string" || typeof v.expiresAt !== "string" || !v.hold) {
      return null;
    }
    return v;
  } catch {
    return null;
  }
}

export function writeStoredHold(value: StoredHold | null): void {
  try {
    if (value) window.localStorage.setItem(HOLD_STORAGE_KEY, JSON.stringify(value));
    else window.localStorage.removeItem(HOLD_STORAGE_KEY);
  } catch {
    // Storage unavailable — the resume banner just won't appear.
  }
  try {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // ignore
  }
}

export function subscribeStoredHold(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === HOLD_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}
