import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SalePageView from "@/app/black-friday/_components/SalePageView";
import { getSalePreviewData } from "@/lib/sale-firestore";

/**
 * Private sale preview for admin ("Preview" in the sale editor). Shows the
 * sale exactly as configured, in any status (draft included), with booking
 * disabled. Never indexed and never cached, so edits show on reload.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sale preview",
  robots: { index: false, follow: false },
};

export default async function SalePreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await getSalePreviewData(token);
  if (result.kind !== "ok") notFound();
  return <SalePageView sale={result.sale} preview />;
}
