import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { LeadEntry } from "@/lib/analytics/leads";

/** Deterministic id: one entry per business + period + source, so saving again replaces it. */
export const leadDocId = (businessId: string, start: string, end: string, source: string) =>
  `${businessId}_${start}_${end}_${source}`;

export async function listLeadEntries(businessId: string): Promise<LeadEntry[]> {
  const snap = await adminDb().collection("lead_aggregates").where("businessId", "==", businessId).limit(1000).get();
  return snap.docs
    .map((d) => {
      const x = d.data();
      const n = (v: unknown) => (typeof v === "number" ? v : undefined);
      return {
        id: d.id,
        periodStart: String(x.periodStart),
        periodEnd: String(x.periodEnd),
        source: String(x.source),
        calls: n(x.calls),
        inquiries: n(x.inquiries),
        bookings: n(x.bookings),
      } satisfies LeadEntry;
    })
    .sort((a, b) => b.periodStart.localeCompare(a.periodStart));
}
