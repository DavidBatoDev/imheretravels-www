"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics/track";

/** GA4 `view_promotion` once per page view of the sale. */
export default function SaleViewTracker({
  saleId,
  saleName,
  status,
}: {
  saleId: string;
  saleName: string;
  status: string;
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackEvent("view_promotion", {
      promotion_id: saleId,
      promotion_name: saleName,
      sale_status: status,
    });
  }, [saleId, saleName, status]);
  return null;
}
