"use client";

import { useRef } from "react";
import { devWhyTravelNotes } from "@/data/travelWithDev";

export default function WhyTravelCarousel({ points }: { points: string[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const pause  = () => { if (trackRef.current) trackRef.current.style.animationPlayState = "paused";  };
  const resume = () => { if (trackRef.current) trackRef.current.style.animationPlayState = "running"; };

  // Duplicate for seamless loop — animation moves by -50% (= width of one set)
  const items = [...points, ...points];

  return (
    <div className="overflow-hidden" onMouseEnter={pause} onMouseLeave={resume}>
      <div
        ref={trackRef}
        className="flex w-fit gap-5"
        style={{ animation: "marquee 28s linear infinite" }}
      >
        {items.map((point, i) => {
          const idx = i % points.length;
          return (
            <div
              key={i}
              className="w-80 shrink-0 rounded-lg bg-white p-5 shadow-small"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <span className="inline-flex w-fit items-center rounded-full bg-crimson-red px-2.5 py-1 font-body text-b4-desktop font-medium text-white">
                  {String(idx + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mb-2 font-sans text-h6-mobile md:text-h6-desktop text-midnight">
                {point}
              </h3>
              <p className="font-body text-b4-desktop text-dark-gray">
                {devWhyTravelNotes[idx] ?? ""}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
