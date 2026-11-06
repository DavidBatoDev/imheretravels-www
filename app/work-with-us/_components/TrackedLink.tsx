"use client";

import { trackEvent } from "@/lib/analytics/track";

/**
 * External link (Calendly / mailto) that reports a `contact_click` with the
 * given method, per the tracking contract in CLAUDE.md.
 */
export default function TrackedLink({
  href,
  method,
  location,
  className,
  children,
}: {
  href: string;
  method: "calendly" | "email";
  location: string;
  className?: string;
  children: React.ReactNode;
}) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={() => trackEvent("contact_click", { method, location })}
    >
      {children}
    </a>
  );
}
