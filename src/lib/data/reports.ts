import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { Facts } from "@/lib/analytics/facts";

export type ReportView = {
  id: string;
  kind: "ai_analysis" | "data_summary";
  createdAt: string;
  language: "en" | "es" | "ar";
  question: string;
  text: string;
  providerLabel: string;
  model: string;
  facts: Facts;
};

const col = () => adminDb().collection("ai_reports");

function toView(id: string, x: FirebaseFirestore.DocumentData): ReportView | null {
  try {
    return {
      id,
      kind: x.kind === "ai_analysis" ? "ai_analysis" : "data_summary",
      createdAt: String(x.createdAt),
      language: x.language === "es" || x.language === "ar" ? x.language : "en",
      question: String(x.question ?? ""),
      text: String(x.text ?? ""),
      providerLabel: String(x.providerLabel ?? ""),
      model: String(x.model ?? ""),
      facts: JSON.parse(String(x.factsJson)) as Facts,
    };
  } catch {
    return null;
  }
}

export async function listReports(businessId: string): Promise<ReportView[]> {
  const snap = await col().where("businessId", "==", businessId).limit(200).get();
  return snap.docs.map((d) => toView(d.id, d.data())).filter((r): r is ReportView => r !== null).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getReport(businessId: string, id: string): Promise<ReportView | null> {
  const doc = await col().doc(id).get();
  if (!doc.exists || doc.data()?.businessId !== businessId) return null;
  return toView(doc.id, doc.data()!);
}
