import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { ReviewEntry } from "@/lib/analytics/reviews";

export async function listReviews(businessId: string): Promise<ReviewEntry[]> {
  const snap = await adminDb().collection("reviews").where("businessId", "==", businessId).limit(1000).get();
  return snap.docs
    .map((d) => {
      const x = d.data();
      const status = ["needs_reply", "drafted", "replied", "no_reply_needed"].includes(x.replyStatus) ? x.replyStatus : "needs_reply";
      return {
        id: d.id,
        reviewDate: String(x.reviewDate),
        rating: Number(x.rating),
        excerpt: String(x.excerpt ?? ""),
        topics: Array.isArray(x.topics) ? x.topics.map(String) : [],
        replyStatus: status,
        replyDraft: String(x.replyDraft ?? ""),
      } satisfies ReviewEntry;
    })
    .sort((a, b) => b.reviewDate.localeCompare(a.reviewDate));
}
