"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { getBusinessForUser } from "@/lib/data/business";
import { todayInMadrid } from "@/lib/data/metrics";
import { reviewInput } from "@/lib/schema/reviews";

export type ReviewState = { ok?: boolean; errors?: Record<string, string[] | undefined>; message?: string };

async function context() {
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");
  return { user, business };
}

export async function saveReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const { user, business } = await context();
  const raw = Object.fromEntries([...formData.entries()].map(([k, v]) => [k, typeof v === "string" && v === "" ? undefined : v]));
  const parsed = reviewInput.safeParse(raw);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors, message: "Please fix the highlighted fields." };
  const v = parsed.data;
  if (v.reviewDate > todayInMadrid()) return { errors: { reviewDate: ["The date cannot be in the future"] }, message: "Please fix the highlighted fields." };

  const db = adminDb();
  const now = new Date().toISOString();
  const data = {
    businessId: business.id,
    reviewDate: v.reviewDate,
    rating: v.rating,
    excerpt: v.excerpt,
    topics: v.topics,
    replyStatus: v.replyStatus,
    replyDraft: v.replyDraft,
    entry: "manual",
    updatedAt: now,
  };
  let id = v.id;
  if (id) {
    const ref = db.collection("reviews").doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data()?.businessId !== business.id) return { message: "Review not found." };
    await ref.set(data, { merge: true });
  } else {
    id = (await db.collection("reviews").add({ ...data, createdAt: now })).id;
  }
  await db.collection("audit_logs").add({
    businessId: business.id, actorUid: user.uid, action: v.id ? "review.updated" : "review.created", reviewId: id, createdAt: now,
  });
  revalidatePath("/reviews");
  return { ok: true, message: v.id ? "Saved." : "Review recorded." };
}

export async function deleteReview(id: string): Promise<{ ok: boolean; message: string }> {
  const { user, business } = await context();
  const ref = adminDb().collection("reviews").doc(id);
  const doc = await ref.get();
  if (!doc.exists || doc.data()?.businessId !== business.id) return { ok: false, message: "Review not found." };
  await ref.delete();
  await adminDb().collection("audit_logs").add({
    businessId: business.id, actorUid: user.uid, action: "review.deleted", reviewId: id, createdAt: new Date().toISOString(),
  });
  revalidatePath("/reviews");
  return { ok: true, message: "Deleted." };
}
