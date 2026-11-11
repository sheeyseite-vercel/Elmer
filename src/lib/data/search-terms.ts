import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { normalizePhrase, type TermEntry } from "@/lib/analytics/search-terms";
import { sha256 } from "@/lib/data/metrics";

/** One doc per business + month + phrase: importing the same month again replaces, never duplicates. */
export const termDocId = (businessId: string, month: string, phrase: string) =>
  `${businessId}_${month}_${sha256(normalizePhrase(phrase)).slice(0, 24)}`;

export async function listTerms(businessId: string): Promise<(TermEntry & { source: string })[]> {
  const snap = await adminDb().collection("search_terms").where("businessId", "==", businessId).limit(3000).get();
  return snap.docs.map((d) => {
    const x = d.data();
    return {
      id: d.id,
      month: String(x.month),
      phrase: String(x.phrase),
      impressions: typeof x.impressions === "number" ? x.impressions : null,
      belowThreshold: x.belowThreshold === true,
      source: String(x.source ?? "manual"),
    };
  });
}
