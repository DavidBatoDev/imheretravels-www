"use client";

import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";

const noopSubscribe = () => () => {};

/** false on the server and during hydration, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/**
 * Wall clock at one-second resolution, for countdowns. Ticks every second and
 * also re-reads the clock the moment the tab becomes visible again (iOS Safari
 * throttles timers in background tabs, so the interval alone would lag).
 * Returns 0 on the server; callers only render it for the holder, after
 * hydration.
 */
function subscribeClock(cb: () => void) {
  const id = window.setInterval(cb, 1000);
  const onVisible = () => {
    if (document.visibilityState === "visible") cb();
  };
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("pageshow", cb);
  return () => {
    window.clearInterval(id);
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("pageshow", cb);
  };
}
const clockSnapshot = () => Math.floor(Date.now() / 1000) * 1000;

export function useClock(): number {
  return useSyncExternalStore(subscribeClock, clockSnapshot, () => 0);
}

/**
 * Locks page scroll while a sheet is open. Uses the position-fixed technique
 * because `overflow: hidden` on <body> alone doesn't stop iOS Safari from
 * scrolling the page behind an overlay.
 */
export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    const { body, documentElement } = document;
    const y = window.scrollY;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      overflow: body.style.overflow,
    };
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    const prevPad = body.style.paddingRight;
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    return () => {
      Object.assign(body.style, prev);
      body.style.paddingRight = prevPad;
      window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
    };
  }, [locked]);
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps Tab focus inside `containerRef` while active, closes on Escape, moves
 * focus in on open and restores it to the opener on close.
 */
export function useFocusTrap(
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onEscape: () => void,
): void {
  const onEscapeRef = useRef(onEscape);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  });

  useEffect(() => {
    if (!active) return;
    const opener = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    const raf = window.requestAnimationFrame(() => {
      const el = containerRef.current;
      if (!el || el.contains(document.activeElement)) return;
      const preferred = el.querySelector<HTMLElement>("[data-autofocus]");
      (preferred ?? el).focus({ preventScroll: true });
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onEscapeRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const list = focusables();
      const el = containerRef.current;
      if (!el) return;
      if (list.length === 0) {
        e.preventDefault();
        el.focus();
        return;
      }
      const first = list[0]!;
      const last = list[list.length - 1]!;
      const current = document.activeElement;
      if (e.shiftKey && (current === first || current === el || !el.contains(current))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (current === last || !el.contains(current))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [active, containerRef]);
}
