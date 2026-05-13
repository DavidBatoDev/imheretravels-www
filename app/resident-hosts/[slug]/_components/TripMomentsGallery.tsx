"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { type GalleryMediaItem } from "@/data/travelWithDev";

const DOOR_RIGHT = new Set([2, 5, 7, 11]);

const SLIDE_INTERVAL_MS = 13000;
const SLIDE_SWAP_OFFSET_MS = 12000;

// Mirrors the @keyframes in globals.css exactly.
// The Web Animations API uses a shared startTime so all 12 overlays
// are guaranteed to be at the identical phase at any given moment,
// regardless of whether the element was on-screen when started.
const KF_RIGHT: Keyframe[] = [
  { offset: 0,     transform: "translateX(0)",    easing: "ease-in-out" },
  { offset: 0.154, transform: "translateX(101%)", easing: "ease-in-out" },
  { offset: 0.769, transform: "translateX(101%)", easing: "ease-in-out" },
  { offset: 0.923, transform: "translateX(0)",    easing: "ease-in-out" },
  { offset: 1,     transform: "translateX(0)" },
];
const KF_DOWN: Keyframe[] = [
  { offset: 0,     transform: "translateY(0)",    easing: "ease-in-out" },
  { offset: 0.154, transform: "translateY(101%)", easing: "ease-in-out" },
  { offset: 0.769, transform: "translateY(101%)", easing: "ease-in-out" },
  { offset: 0.923, transform: "translateY(0)",    easing: "ease-in-out" },
  { offset: 1,     transform: "translateY(0)" },
];

export default function TripMomentsGallery({ slides }: { slides: GalleryMediaItem[][][] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  // Observe the container itself; rootMargin fires before it's visible
  // so all compositor layers are ready before any cell scrolls into view.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px 40% 0px" }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Start all 12 overlay animations with the exact same startTime.
  useEffect(() => {
    if (!started || !containerRef.current) return;

    const overlays =
      containerRef.current.querySelectorAll<HTMLElement>(".gallery-overlay");
    const sharedStart = document.timeline.currentTime;

    const anims: Animation[] = [];
    overlays.forEach((el) => {
      const anim = el.animate(
        el.dataset.dir === "right" ? KF_RIGHT : KF_DOWN,
        { duration: SLIDE_INTERVAL_MS, iterations: Infinity }
      );
      // Pin every animation to the same point in the document timeline.
      if (sharedStart !== null) anim.startTime = sharedStart;
      anims.push(anim);
    });

    return () => anims.forEach((a) => a.cancel());
  }, [started]);

  // Slide cycling — swap content at 12 s (door fully closed).
  useEffect(() => {
    if (!started) return;

    let swapTimer: ReturnType<typeof setTimeout>;
    let cycleTimer: ReturnType<typeof setTimeout>;

    function scheduleCycle() {
      swapTimer = setTimeout(() => {
        setSlideIndex((prev) => (prev + 1) % slides.length);
        cycleTimer = setTimeout(
          scheduleCycle,
          SLIDE_INTERVAL_MS - SLIDE_SWAP_OFFSET_MS
        );
      }, SLIDE_SWAP_OFFSET_MS);
    }

    scheduleCycle();
    return () => {
      clearTimeout(swapTimer);
      clearTimeout(cycleTimer);
    };
  }, [started]);

  const columns = slides[slideIndex];

  return (
    <div ref={containerRef} className="relative flex gap-2 sm:gap-2.5">
      {columns.map((col, ci) => (
        <div key={ci} className="flex flex-1 flex-col gap-2 sm:gap-2.5">
          {col.map((item, ii) => (
            <div
              key={`${ci}-${ii}`}
              className={[
                "relative w-full overflow-hidden rounded-md",
                item.size === "tall" ? "aspect-308/397" : "aspect-308/199",
              ].join(" ")}
            >
              {item.type === "photo" && item.src && (
                <Image
                  src={item.src}
                  alt={item.alt ?? "Trip moment"}
                  fill
                  sizes="(max-width: 640px) 25vw, 300px"
                  className="object-cover"
                  style={item.objectPosition ? { objectPosition: item.objectPosition } : undefined}
                />
              )}

              {item.type === "video" && item.src && (
                <video
                  src={item.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}

              {item.type === "placeholder" && (
                <div className="absolute inset-0 bg-grey/15" />
              )}

              {/* data-dir is read once when started fires to set animation direction */}
              <div
                className="gallery-overlay absolute inset-0 bg-light-grey"
                data-dir={DOOR_RIGHT.has(item.seq) ? "right" : "down"}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
