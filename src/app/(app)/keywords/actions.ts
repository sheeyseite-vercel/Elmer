"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { getBusinessForUser } from "@/lib/data/business";
import { getKeyword } from "@/lib/data/keywords";
import { keywordInput, normalizeTerm } from "@/lib/schema/keywords";

export type KeywordState = { ok?: boolean; errors?: Record<string, string[] | undefined>; message?: string };

async function context() {
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");
  return { user, business };
}

const audit = (businessId: string, actorUid: string, action: string, keywordId: string) =>
  adminDb().collection("audit_logs").add({ businessId, actorUid, action, keywordId, createdAt: new Date().toISOString() });

export async function saveKeyword(_prev: KeywordState, formData: FormData): Promise<KeywordState> {
  const { user, business } = await context();
  const raw = Object.fromEntries(
    [...formData.entries()].map(([k, v]) => [k, typeof v === "string" && v === "" ? undefined : v]),
  );
  const parsed = keywordInput.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, message: "Please fix the highlighted fields." };
  const { id, ...fields } = parsed.data;

  const db = adminDb();
  const termKey = normalizeTerm(fields.term, fields.language, fields.targetArea);
  const dup = await db.collection("tracked_keywords").where("businessId", "==", business.id).where("termKey", "==", termKey).limit(2).get();
  if (dup.docs.some((d) => d.id !== id)) {
    return { errors: { term: ["This keyword is already tracked for that language and area"] }, message: "Please fix the highlighted fields." };
  }

  const now = new Date().toISOString();
  if (id) {
    const existing = await getKeyword(business.id, id);
    if (!existing) return { message: "Keyword not found." };
    await db.collection("tracked_keywords").doc(id).update({ ...fields, termKey, updatedAt: now });
    await audit(business.id, user.uid, "keyword.updated", id);
  } else {
    const ref = db.collection("tracked_keywords").doc();
    await ref.set({ ...fields, termKey, businessId: business.id, status: "active", createdAt: now, updatedAt: now });
    await audit(business.id, user.uid, "keyword.created", ref.id);
  }
  revalidatePath("/keywords");
  return { ok: true, message: id ? "Saved." : "Keyword added." };
}

export async function setKeywordStatus(id: string, status: "active" | "paused" | "archived"): Promise<{ ok: boolean; message: string }> {
  const { user, business } = await context();
  if (!["active", "paused", "archived"].includes(status)) return { ok: false, message: "Invalid status." };
  const existing = await getKeyword(business.id, id);
  if (!existing) return { ok: false, message: "Keyword not found." };
  await adminDb().collection("tracked_keywords").doc(id).update({ status, updatedAt: new Date().toISOString() });
  await audit(business.id, user.uid, `keyword.${status}`, id);
  revalidatePath("/keywords");
  revalidatePath(`/keywords/${id}`);
  return { ok: true, message: status === "archived" ? "Archived. Its past checks are kept." : "Updated." };
}
