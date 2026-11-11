"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { getBusinessForUser } from "@/lib/data/business";
import { getKeyword } from "@/lib/data/keywords";
import { parseCompetitors, rankCheckInput } from "@/lib/schema/keywords";
import { madridLocalToIso } from "@/lib/time";

export type CheckState = { ok?: boolean; errors?: Record<string, string[] | undefined>; message?: string };

async function context() {
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");
  return { user, business };
}

export async function addRankCheck(_prev: CheckState, formData: FormData): Promise<CheckState> {
  const { user, business } = await context();
  const raw = Object.fromEntries(
    [...formData.entries()].map(([k, v]) => [k, typeof v === "string" && v === "" ? undefined : v]),
  );
  const parsed = rankCheckInput.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, message: "Please fix the highlighted fields." };
  const v = parsed.data;

  const keyword = await getKeyword(business.id, v.keywordId);
  if (!keyword) return { errors: { keywordId: ["Keyword not found"] }, message: "Please fix the highlighted fields." };

  const comps = parseCompetitors(v.competitors);
  if (!comps.ok) return { errors: { competitors: [comps.error] }, message: "Please fix the highlighted fields." };

  const checkedAt = madridLocalToIso(v.checkedAt);
  if (Date.parse(checkedAt) > Date.now() + 5 * 60_000) {
    return { errors: { checkedAt: ["A check cannot be in the future"] }, message: "Please fix the highlighted fields." };
  }

  const db = adminDb();
  const ref = db.collection("rank_checks").doc();
  const now = new Date().toISOString();
  await ref.set({
    businessId: business.id,
    keywordId: keyword.id,
    keyword: keyword.term, // copied so history stays readable if the keyword is later edited
    checkedAt,
    locationLabel: v.locationLabel,
    ...(v.lat !== undefined && v.lng !== undefined ? { lat: v.lat, lng: v.lng } : {}),
    device: v.device,
    surface: v.surface,
    position: v.found === "yes" ? (v.position ?? null) : null,
    depth: v.depth,
    competitors: comps.list,
    methodology: v.methodology,
    referenceUrl: v.referenceUrl,
    source: "manual",
    createdAt: now,
  });
  await db.collection("audit_logs").add({
    businessId: business.id, actorUid: user.uid, action: "rank_check.created", keywordId: keyword.id, checkId: ref.id, createdAt: now,
  });
  revalidatePath("/rank-checks");
  revalidatePath(`/keywords/${keyword.id}`);
  revalidatePath("/keywords");
  return { ok: true, message: "Rank check saved." };
}

export async function deleteRankCheck(id: string): Promise<{ ok: boolean; message: string }> {
  const { user, business } = await context();
  const ref = adminDb().collection("rank_checks").doc(id);
  const doc = await ref.get();
  if (!doc.exists || doc.data()?.businessId !== business.id) return { ok: false, message: "Check not found." };
  const keywordId = String(doc.data()?.keywordId ?? "");
  await ref.delete();
  await adminDb().collection("audit_logs").add({
    businessId: business.id, actorUid: user.uid, action: "rank_check.deleted", checkId: id, createdAt: new Date().toISOString(),
  });
  revalidatePath("/rank-checks");
  revalidatePath("/keywords");
  if (keywordId) revalidatePath(`/keywords/${keywordId}`);
  return { ok: true, message: "Deleted." };
}
