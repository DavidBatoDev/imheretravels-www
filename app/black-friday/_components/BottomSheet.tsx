"use client";

import { AnimatePresence, motion, useDragControls, useReducedMotion, type PanInfo } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useFocusTrap, useHydrated, useMediaQuery, useScrollLock } from "./hooks";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Bottom sheet on phones, centred dialog from `md` up.
 *
 * - Portalled to <body> so the page-transition transform in app/template.tsx
 *   can't become the containing block for `position: fixed`.
 * - Swipe down on the grab bar/header (or tap the backdrop, or Esc) to close.
 *   Drag starts only from the header so the body can still scroll.
 * - Focus-trapped, body scroll locked, safe-area aware.
 * - prefers-reduced-motion: no slide/drag, just a short fade.
 */
export default function BottomSheet({
  open,
  onClose,
  labelledBy,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  /** Header content (title block) — also the drag area on phones. */
  title: ReactNode;
  children: ReactNode;
  /** Sticky footer (primary action). */
  footer?: ReactNode;
}) {
  const hydrated = useHydrated();
  const reduce = useReducedMotion() ?? false;
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const controls = useDragControls();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useScrollLock(open);
  useFocusTrap(open, panelRef, onClose);

  if (!hydrated) return null;

  const canDrag = !isDesktop && !reduce;

  const panelMotion = reduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
      }
    : isDesktop
      ? {
          initial: { opacity: 0, scale: 0.97, y: 12 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.98, y: 8 },
          transition: { duration: 0.28, ease: EASE },
        }
      : {
          initial: { y: "100%" },
          animate: { y: 0 },
          exit: { y: "100%" },
          transition: { duration: 0.38, ease: EASE },
        };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 650) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="sale-sheet"
          className="fixed inset-0 z-[70] flex items-end justify-center md:items-center md:p-6"
        >
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-midnight/60"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.25 }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            tabIndex={-1}
            drag={canDrag ? "y" : false}
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={onDragEnd}
            {...panelMotion}
            className="relative flex max-h-[calc(100dvh-2.5rem)] w-full flex-col overflow-hidden rounded-t-lg bg-white shadow-xlarge outline-none will-change-transform md:max-h-[calc(100dvh-3rem)] md:max-w-lg md:rounded-lg"
          >
            <div
              className={`relative shrink-0 border-b border-light-grey px-5 pb-4 pt-2 md:px-7 md:pt-6 ${canDrag ? "touch-none" : ""}`}
              onPointerDown={(e) => {
                if (!canDrag) return;
                if ((e.target as HTMLElement).closest("button, a, input")) return;
                controls.start(e);
              }}
            >
              <div aria-hidden="true" className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-grey/50 md:hidden" />
              <div className="pr-12">{title}</div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-4 inline-flex size-11 items-center justify-center rounded-full text-midnight transition-colors hover:bg-light-grey focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-red md:right-4 md:top-4"
              >
                <X className="size-5" strokeWidth={2.25} aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 md:px-7">
              {children}
            </div>

            {footer && (
              <div className="shrink-0 border-t border-light-grey bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 md:px-7 md:pb-6">
                {footer}
              </div>
            )}
            {!footer && <div aria-hidden="true" className="h-[env(safe-area-inset-bottom)] shrink-0" />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
