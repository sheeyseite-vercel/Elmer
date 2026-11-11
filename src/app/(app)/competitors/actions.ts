"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { getBusinessForUser } from "@/lib/data/business";
import { listCompetitors } from "@/lib/data/competitors";
import { todayInMadrid } from "@/lib/data/metrics";
import { competitorInput, normalizeName, snapshotInput } from "@/lib/schema/competitors";

export type FormState = { ok?: boolean; errors?: Record<string, string[] | undefined>; message?: string };

async function context() {
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");
  return { user, business };
}

const blankToUndefined = (formData: FormData) =>
  Object.fromEntries([...formData.entries()].map(([k, v]) => [k, typeof v === "string" && v === "" ? undefined : v]));

const audit = (businessId: string, actorUid: string, action: string, extra: Record<string, string>) =>
  adminDb().collection("audit_logs").add({ businessId, actorUid, action, ...extra, createdAt: new Date().toISOString() });

export async function saveCompetitor(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, business } = await context();
  const parsed = competitorInput.safeParse(blankToUndefined(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, message: "Please fix the highlighted fields." };
  const { id, own, ...fields } = parsed.data;

  const all = await listCompetitors(business.id);
  const nameKey = normalizeName(fields.name);
  if (all.some((c) => c.id !== id && normalizeName(c.name) === nameKey)) {
    return { errors: { name: ["This business is already in your list"] }, message: "Please fix the highlighted fields." };
  }

  const db = adminDb();
  const now = new Date().toISOString();
  if (id) {
    if (!all.some((c) => c.id === id)) return { message: "Competitor not found." };
    await db.collection("competitors").doc(id).update({ ...fields, updatedAt: now });
    await audit(business.id, user.uid, "competitor.updated", { competitorId: id });
  } else {
    if (own === "own" && all.some((c) => c.kind === "own")) {
      return { errors: { own: ["Your own listing is already added"] }, message: "Please fix the highlighted fields." };
    }
    const ref = db.collection("competitors").doc();
    await ref.set({ ...fields, businessId: business.id, kind: own === "own" ? "own" : "competitor", status: "active", createdAt: now, updatedAt: now });
    await audit(business.id, user.uid, "competitor.created", { competitorId: ref.id });
  }
  revalidatePath("/competitors");
  return { ok: true, message: id ? "Saved." : "Added." };
}

export async function setCompetitorStatus(id: string, status: "active" | "archived"): Promise<{ ok: boolean; message: string }> {
  const { user, business } = await context();
  if (!["active", "archived"].includes(status)) return { ok: false, message: "Invalid status." };
  const all = await listCompetitors(business.id);
  if (!all.some((c) => c.id === id)) return { ok: false, message: "Competitor not found." };
  await adminDb().collection("competitors").doc(id).update({ status, updatedAt: new Date().toISOString() });
  await audit(business.id, user.uid, `competitor.${status}`, { competitorId: id });
  revalidatePath("/competitors");
  revalidatePath(`/competitors/${id}`);
  return { ok: true, message: status === "archived" ? "Archived. Its snapshots are kept." : "Restored." };
}

export async function addSnapshot(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, business } = await context();
  const parsed = snapshotInput.safeParse(blankToUndefined(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, message: "Please fix the highlighted fields." };
  const v = parsed.data;
  if (v.checkedOn > todayInMadrid()) return { errors: { checkedOn: ["The date cannot be in the future"] }, message: "Please fix the highlighted fields." };

  const all = await listCompetitors(business.id);
  if (!all.some((c) => c.id === v.competitorId)) return { message: "Competitor not found." };

  const ref = adminDb().collection("competitor_snapshots").doc();
  await ref.set({
    businessId: business.id,
    competitorId: v.competitorId,
    checkedOn: v.checkedOn,
    ...(v.rating !== undefined ? { rating: Math.round(v.rating * 10) / 10 } : {}),
    ...(v.reviewCount !== undefined ? { reviewCount: v.reviewCount } : {}),
    categories: v.categories,
    services: v.services,
    sourceUrl: v.sourceUrl,
    sourceNote: v.sourceNote,
    source: "manual",
    createdAt: new Date().toISOString(),
  });
  await audit(business.id, user.uid, "competitor_snapshot.created", { competitorId: v.competitorId, snapshotId: ref.id });
  revalidatePath("/competitors");
  revalidatePath(`/competitors/${v.competitorId}`);
  return { ok: true, message: "Snapshot saved." };
}

export async function deleteSnapshot(id: string): Promise<{ ok: boolean; message: string }> {
  const { user, business } = await context();
  const ref = adminDb().collection("competitor_snapshots").doc(id);
  const doc = await ref.get();
  if (!doc.exists || doc.data()?.businessId !== business.id) return { ok: false, message: "Snapshot not found." };
  const competitorId = String(doc.data()?.competitorId ?? "");
  await ref.delete();
  await audit(business.id, user.uid, "competitor_snapshot.deleted", { snapshotId: id });
  revalidatePath("/competitors");
  if (competitorId) revalidatePath(`/competitors/${competitorId}`);
  return { ok: true, message: "Deleted." };
}
