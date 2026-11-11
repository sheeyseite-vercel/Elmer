"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { getBusinessForUser } from "@/lib/data/business";
import { chunk, metricDocId, sha256, todayInMadrid } from "@/lib/data/metrics";
import { buildImport, type MetricRecord, type Rejection } from "@/lib/csv/import";
import { parseCsv, parseDate } from "@/lib/csv/parse";
import { MAX_CSV_CHARS, MAX_CSV_ROWS } from "@/lib/csv/limits";
import { METRIC_KEYS, type MetricKey } from "@/lib/metrics";

const MAX_ROWS = MAX_CSV_ROWS;
const PATH = "/data";

async function context() {
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");
  return { user, business };
}

const requestSchema = z.object({
  text: z.string().min(1).max(MAX_CSV_CHARS),
  fileName: z.string().trim().min(1).max(200),
  dateColumn: z.number().int().min(0).max(500),
  metricColumns: z.record(z.string(), z.enum(METRIC_KEYS)),
  dateOrder: z.enum(["dmy", "mdy", "ymd"]),
  decimal: z.enum(["comma", "dot"]),
  policy: z.enum(["skip", "replace"]).default("skip"),
});
export type ImportRequest = z.input<typeof requestSchema>;

export type PreviewResult =
  | {
      ok: true;
      totalRows: number;
      acceptedCount: number;
      byMetric: Record<string, number>;
      rejectedCount: number;
      rejected: Rejection[]; // first 50
      emptyCells: number;
      duplicatesInFile: number;
      existing: number;
      dateRange: { from: string; to: string } | null;
      sample: MetricRecord[];
      sameFileImportedAt: string | null;
    }
  | { ok: false; message: string };

type Analysis =
  | { ok: false; message: string }
  | { ok: true; req: z.output<typeof requestSchema>; totalRows: number; result: ReturnType<typeof buildImport> };

function analyze(raw: ImportRequest): Analysis {
  const parsedReq = requestSchema.safeParse(raw);
  if (!parsedReq.success) return { ok: false, message: "The import request is invalid or the file is too large." };
  const req = parsedReq.data;

  const csv = parseCsv(req.text);
  if (csv.headers.length < 2 || csv.rows.length === 0) return { ok: false, message: "The file has no data rows." };
  if (csv.rows.length > MAX_ROWS) return { ok: false, message: `Too many rows (maximum ${MAX_ROWS}).` };

  const metricColumns: Record<number, MetricKey> = {};
  for (const [k, v] of Object.entries(req.metricColumns)) {
    const col = Number(k);
    if (!Number.isInteger(col) || col < 0 || col >= csv.headers.length || col === req.dateColumn) {
      return { ok: false, message: "The column mapping does not match the file." };
    }
    metricColumns[col] = v;
  }
  if (req.dateColumn >= csv.headers.length) return { ok: false, message: "The date column does not exist in the file." };
  if (Object.keys(metricColumns).length === 0) return { ok: false, message: "Map at least one metric column." };

  const result = buildImport(
    csv.headers,
    csv.rows,
    { dateColumn: req.dateColumn, metricColumns },
    { dateOrder: req.dateOrder, decimal: req.decimal, today: todayInMadrid() },
  );
  return { ok: true, req, totalRows: csv.rows.length, result };
}

async function countExisting(businessId: string, records: MetricRecord[]): Promise<Set<string>> {
  const db = adminDb();
  const existing = new Set<string>();
  for (const part of chunk(records, 300)) {
    const refs = part.map((r) => db.collection("performance_metrics").doc(metricDocId(businessId, r.metric, r.date, "google_csv")));
    const docs = await db.getAll(...refs);
    docs.forEach((d, i) => {
      if (d.exists) existing.add(`${part[i]!.metric}|${part[i]!.date}`);
    });
  }
  return existing;
}

export async function previewImport(raw: ImportRequest): Promise<PreviewResult> {
  const { business } = await context();
  const a = analyze(raw);
  if (!a.ok) return a;
  const { result } = a;

  const existing = await countExisting(business.id, result.accepted);
  const prior = await adminDb()
    .collection("imports")
    .where("businessId", "==", business.id)
    .where("fileHash", "==", sha256(a.req.text))
    .limit(1)
    .get();

  const byMetric: Record<string, number> = {};
  result.accepted.forEach((r) => (byMetric[r.metric] = (byMetric[r.metric] ?? 0) + 1));

  return {
    ok: true,
    totalRows: a.totalRows,
    acceptedCount: result.accepted.length,
    byMetric,
    rejectedCount: result.rejected.length,
    rejected: result.rejected.slice(0, 50),
    emptyCells: result.emptyCells,
    duplicatesInFile: result.duplicatesInFile,
    existing: existing.size,
    dateRange: result.dateRange,
    sample: result.accepted.slice(0, 8),
    sameFileImportedAt: (prior.docs[0]?.data().createdAt as string | undefined) ?? null,
  };
}

export type CommitResult =
  | { ok: true; written: number; skipped: number; rejectedCount: number }
  | { ok: false; message: string };

export async function commitImport(raw: ImportRequest): Promise<CommitResult> {
  const { user, business } = await context();
  const a = analyze(raw);
  if (!a.ok) return a;
  const { req, result } = a;
  if (result.accepted.length === 0) return { ok: false, message: "No valid rows to import. Fix the errors and try again." };

  const db = adminDb();
  const existing = await countExisting(business.id, result.accepted);
  const toWrite =
    req.policy === "skip" ? result.accepted.filter((r) => !existing.has(`${r.metric}|${r.date}`)) : result.accepted;
  const skipped = result.accepted.length - toWrite.length;
  const replaced = req.policy === "replace" ? existing.size : 0;
  const now = new Date().toISOString();
  const importRef = db.collection("imports").doc();

  for (const part of chunk(toWrite, 400)) {
    const batch = db.batch();
    for (const r of part) {
      batch.set(db.collection("performance_metrics").doc(metricDocId(business.id, r.metric, r.date, "google_csv")), {
        businessId: business.id,
        metric: r.metric,
        value: r.value,
        unit: "count",
        granularity: "day",
        periodStart: r.date,
        periodEnd: r.date,
        sourceKind: "google_csv",
        sourceId: importRef.id,
        createdAt: now,
      });
    }
    await batch.commit();
  }

  await importRef.set({
    businessId: business.id,
    kind: "google_csv",
    fileName: req.fileName,
    fileHash: sha256(req.text),
    actorUid: user.uid,
    createdAt: now,
    policy: req.policy,
    written: toWrite.length,
    skipped,
    replaced,
    rejectedCount: result.rejected.length,
    // Only a short, truncated sample of problems is kept; the original file is NOT stored.
    rejectedSample: result.rejected.slice(0, 50).map((r) => ({ ...r, reason: r.reason.slice(0, 120) })),
    dateRange: result.dateRange,
    metrics: [...new Set(result.accepted.map((r) => r.metric))],
  });

  await db.collection("data_sources").doc(`${business.id}_google_csv`).set(
    { businessId: business.id, kind: "google_csv", label: "Imported Google CSV", status: "ok", lastSyncAt: now },
    { merge: true },
  );
  await db.collection("audit_logs").add({
    businessId: business.id,
    actorUid: user.uid,
    action: "import.committed",
    importId: importRef.id,
    written: toWrite.length,
    createdAt: now,
  });

  revalidatePath(PATH);
  return { ok: true, written: toWrite.length, skipped, rejectedCount: result.rejected.length };
}

export async function deleteImport(importId: string): Promise<{ ok: boolean; message: string }> {
  const { user, business } = await context();
  const db = adminDb();
  const ref = db.collection("imports").doc(importId);
  const doc = await ref.get();
  if (!doc.exists || doc.data()?.businessId !== business.id) return { ok: false, message: "Import not found." };

  const metrics = await db
    .collection("performance_metrics")
    .where("businessId", "==", business.id)
    .where("sourceId", "==", importId)
    .get();
  for (const part of chunk(metrics.docs, 400)) {
    const batch = db.batch();
    part.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  await ref.delete();
  await db.collection("audit_logs").add({
    businessId: business.id,
    actorUid: user.uid,
    action: "import.deleted",
    importId,
    removedValues: metrics.size,
    createdAt: new Date().toISOString(),
  });
  revalidatePath(PATH);
  return { ok: true, message: `Removed the import and ${metrics.size} values.` };
}

// ---------- Manual entry ----------

const manualSchema = z.object({
  metric: z.enum(METRIC_KEYS),
  date: z.string().refine((d) => parseDate(d, "ymd") !== null, "Enter a valid date"),
  value: z.coerce.number().int("Enter a whole number").min(0, "Cannot be negative").max(10_000_000),
  note: z.string().trim().max(200).optional().default(""),
});

export type ManualState = { ok?: boolean; errors?: Record<string, string[] | undefined>; message?: string };

export async function addManualMetric(_prev: ManualState, formData: FormData): Promise<ManualState> {
  const { user, business } = await context();
  const parsed = manualSchema.safeParse({
    metric: formData.get("metric"),
    date: formData.get("date"),
    value: formData.get("value"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, message: "Please fix the highlighted fields." };
  const { metric, date, value, note } = parsed.data;
  if (date > todayInMadrid()) return { errors: { date: ["The date cannot be in the future"] }, message: "Please fix the highlighted fields." };

  const db = adminDb();
  const ref = db.collection("performance_metrics").doc(metricDocId(business.id, metric, date, "manual"));
  const replaced = (await ref.get()).exists;
  const now = new Date().toISOString();
  await ref.set({
    businessId: business.id,
    metric,
    value,
    unit: "count",
    granularity: "day",
    periodStart: date,
    periodEnd: date,
    sourceKind: "manual",
    sourceId: "manual",
    note,
    createdAt: now,
  });
  await db.collection("audit_logs").add({
    businessId: business.id,
    actorUid: user.uid,
    action: replaced ? "manual_metric.replaced" : "manual_metric.created",
    metric,
    date,
    createdAt: now,
  });
  revalidatePath(PATH);
  return { ok: true, message: replaced ? "Saved. It replaced the earlier manual value for that day." : "Saved." };
}

export async function deleteManualMetric(id: string): Promise<{ ok: boolean; message: string }> {
  const { user, business } = await context();
  const ref = adminDb().collection("performance_metrics").doc(id);
  const doc = await ref.get();
  const x = doc.data();
  if (!doc.exists || x?.businessId !== business.id || x?.sourceKind !== "manual") return { ok: false, message: "Value not found." };
  await ref.delete();
  await adminDb().collection("audit_logs").add({
    businessId: business.id,
    actorUid: user.uid,
    action: "manual_metric.deleted",
    metric: x.metric,
    date: x.periodStart,
    createdAt: new Date().toISOString(),
  });
  revalidatePath(PATH);
  return { ok: true, message: "Deleted." };
}
