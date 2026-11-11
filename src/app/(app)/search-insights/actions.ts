"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { isMonth, parseTermLines } from "@/lib/analytics/search-terms";
import { getBusinessForUser } from "@/lib/data/business";
import { chunk, todayInMadrid } from "@/lib/data/metrics";
import { listTerms, termDocId } from "@/lib/data/search-terms";

export type TermsState = { ok?: boolean; message?: string; errors?: Record<string, string[] | undefined>; lineErrors?: { line: number; reason: string }[] };

async function context() {
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");
  return { user, business };
}

export async function importTerms(_prev: TermsState, formData: FormData): Promise<TermsState> {
  const { user, business } = await context();
  const month = String(formData.get("month") ?? "");
  const raw = String(formData.get("terms") ?? "");
  const source = formData.get("source") === "google_report" ? "google_report" : "manual";

  if (!isMonth(month)) return { errors: { month: ["Choose a month"] }, message: "Please fix the highlighted fields." };
  if (month > todayInMadrid().slice(0, 7)) return { errors: { month: ["The month cannot be in the future"] }, message: "Please fix the highlighted fields." };
  if (raw.length > 60_000) return { errors: { terms: ["List is too long"] }, message: "Please fix the highlighted fields." };

  const { rows, errors } = parseTermLines(raw);
  if (errors.length > 0) return { lineErrors: errors.slice(0, 20), message: "Nothing was saved. Fix these lines and try again." };
  if (rows.length === 0) return { errors: { terms: ["Paste at least one phrase"] }, message: "Please fix the highlighted fields." };

  const now = new Date().toISOString();
  const db = adminDb();
  for (const part of chunk(rows, 400)) {
    const batch = db.batch();
    for (const r of part) {
      batch.set(db.collection("search_terms").doc(termDocId(business.id, month, r.phrase)), {
        businessId: business.id,
        month,
        phrase: r.phrase,
        belowThreshold: r.belowThreshold,
        ...(r.impressions !== null ? { impressions: r.impressions } : {}),
        source,
        updatedAt: now,
      });
    }
    await batch.commit();
  }
  await db.collection("audit_logs").add({
    businessId: business.id, actorUid: user.uid, action: "search_terms.imported", month, count: rows.length, source, createdAt: now,
  });
  revalidatePath("/search-insights");
  return { ok: true, message: `Saved ${rows.length} phrase${rows.length === 1 ? "" : "s"} for ${month}. Phrases already saved for this month were replaced; others were left as they were.` };
}

export async function deleteTermMonth(month: string): Promise<{ ok: boolean; message: string }> {
  const { user, business } = await context();
  if (!isMonth(month)) return { ok: false, message: "Invalid month." };
  const rows = (await listTerms(business.id)).filter((t) => t.month === month);
  const db = adminDb();
  for (const part of chunk(rows, 400)) {
    const batch = db.batch();
    for (const r of part) batch.delete(db.collection("search_terms").doc(r.id));
    await batch.commit();
  }
  await db.collection("audit_logs").add({
    businessId: business.id, actorUid: user.uid, action: "search_terms.month_deleted", month, count: rows.length, createdAt: new Date().toISOString(),
  });
  revalidatePath("/search-insights");
  return { ok: true, message: `Deleted ${rows.length} phrases.` };
}
