import "server-only";
import { createHash } from "node:crypto";
import { adminDb } from "@/lib/firebase/admin";

export type MetricSourceKind = "google_csv" | "manual";

/**
 * Deterministic id: one value per business + metric + day + source kind.
 * Re-importing the same day either skips or replaces it, so imports never double-count,
 * and a manual value never overwrites an imported one (different kind = different doc).
 */
export const metricDocId = (businessId: string, metric: string, date: string, kind: MetricSourceKind) =>
  `${businessId}_${metric}_${date}_${kind}`;

export const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Today's calendar date in the business timezone (YYYY-MM-DD). */
export const todayInMadrid = () => new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });

export const METRIC_FETCH_LIMIT = 5000;

/**
 * All stored daily values for a business. Filtered by date in memory (a date range plus the
 * businessId filter would need a composite index that may not be deployed yet).
 * `truncated` is true when the cap was reached, so the page can say the data may be incomplete.
 */
export async function fetchMetricRecords(businessId: string) {
  const snap = await adminDb()
    .collection("performance_metrics")
    .where("businessId", "==", businessId)
    .limit(METRIC_FETCH_LIMIT)
    .get();
  const records = snap.docs.map((d) => {
    const x = d.data();
    return {
      metric: String(x.metric),
      date: String(x.periodStart),
      value: Number(x.value),
      sourceKind: (x.sourceKind === "manual" ? "manual" : "google_csv") as MetricSourceKind,
      createdAt: String(x.createdAt ?? ""),
    };
  });
  return { records, truncated: snap.size >= METRIC_FETCH_LIMIT };
}

export type ImportView = {
  id: string;
  fileName: string;
  createdAt: string;
  written: number;
  skipped: number;
  rejected: number;
  dateRange: { from: string; to: string } | null;
};

export type ManualMetricView = { id: string; metric: string; date: string; value: number; note: string };

// Queries below use equality filters only and sort in memory: that needs no composite
// index, so they work before `firebase deploy --only firestore:indexes` has been run.
export async function listImports(businessId: string): Promise<ImportView[]> {
  const snap = await adminDb().collection("imports").where("businessId", "==", businessId).limit(200).get();
  return snap.docs
    .map((d) => {
      const x = d.data();
      return {
        id: d.id,
        fileName: String(x.fileName ?? ""),
        createdAt: String(x.createdAt ?? ""),
        written: Number(x.written ?? 0),
        skipped: Number(x.skipped ?? 0),
        rejected: Number(x.rejectedCount ?? 0),
        dateRange: (x.dateRange as ImportView["dateRange"]) ?? null,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20);
}

export async function listManualMetrics(businessId: string): Promise<ManualMetricView[]> {
  const snap = await adminDb()
    .collection("performance_metrics")
    .where("businessId", "==", businessId)
    .where("sourceKind", "==", "manual")
    .limit(500)
    .get();
  return snap.docs
    .map((d) => {
      const x = d.data();
      return { id: d.id, metric: String(x.metric), date: String(x.periodStart), value: Number(x.value), note: String(x.note ?? "") };
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);
}
