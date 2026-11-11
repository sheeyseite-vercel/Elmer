"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hasAnyData } from "@/lib/analytics/facts";
import { requireUser } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { getBusinessForUser } from "@/lib/data/business";
import { buildFacts, type RangeKey } from "@/lib/data/facts";

export async function createDataSummary(formData: FormData): Promise<void> {
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");
  const r = String(formData.get("range"));
  const range: RangeKey = r === "7" || r === "90" ? r : "28";

  const facts = await buildFacts(business, range);
  if (!hasAnyData(facts)) redirect("/reports?notice=no-data");

  const now = new Date().toISOString();
  const ref = await adminDb().collection("ai_reports").add({
    businessId: business.id, kind: "data_summary", createdAt: now, createdBy: user.uid,
    language: "en", question: "", text: "", providerLabel: "", model: "", factsJson: JSON.stringify(facts),
  });
  await adminDb().collection("audit_logs").add({
    businessId: business.id, actorUid: user.uid, action: "report.created", reportId: ref.id, createdAt: now,
  });
  revalidatePath("/reports");
  redirect(`/reports/${ref.id}`);
}

export async function deleteReport(id: string): Promise<void> {
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");
  const ref = adminDb().collection("ai_reports").doc(id);
  const doc = await ref.get();
  if (doc.exists && doc.data()?.businessId === business.id) {
    await ref.delete();
    await adminDb().collection("audit_logs").add({
      businessId: business.id, actorUid: user.uid, action: "report.deleted", reportId: id, createdAt: new Date().toISOString(),
    });
  }
  revalidatePath("/reports");
  redirect("/reports");
}
