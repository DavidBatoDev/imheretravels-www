/**
 * Destination options for the Work With Us forms (server-only).
 *
 * CMS destination names can carry a tour title ("Italy: The Italian Escape");
 * the form shows just the country, so anything after a colon or a spaced dash
 * is dropped and duplicates are merged. The API checks submitted values against
 * this same list.
 */

import { DESTINATION_OTHER } from "@/data/workWithUs";
import { getAllDestinations as getStaticDestinations } from "@/data/destinations";
import { getAllDestinations } from "@/lib/destinations-firestore";

export function countryOnly(name: string): string {
  return name.split(/:|\s[–—-]\s/)[0].replace(/\s+/g, " ").trim();
}

export async function getDestinationOptions(): Promise<string[]> {
  let names: string[];
  try {
    names = (await getAllDestinations()).map((d) => d.name);
  } catch (e) {
    console.error("[work-with-us] Firestore destinations unavailable, using static list", e);
    names = getStaticDestinations().map((d) => d.name);
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of names) {
    const c = countryOnly(n);
    if (!c || seen.has(c.toLowerCase())) continue;
    seen.add(c.toLowerCase());
    out.push(c);
  }
  return [...out, DESTINATION_OTHER];
}
