import "server-only";
import { adminDb } from "@/lib/firebase/admin";

export type CompetitorView = {
  id: string;
  name: string;
  profileUrl: string;
  location: string;
  notes: string;
  kind: "competitor" | "own";
  status: "active" | "archived";
  createdAt: string;
};

export type SnapshotView = {
  id: string;
  competitorId: string;
  checkedOn: string; // YYYY-MM-DD, the day the owner looked at the public listing
  rating?: number;
  reviewCount?: number;
  categories: string[];
  services: string[];
  sourceUrl: string;
  sourceNote: string;
};

// Equality-only queries, sorted in memory: no composite index required.
export async function listCompetitors(businessId: string): Promise<CompetitorView[]> {
  const snap = await adminDb().collection("competitors").where("businessId", "==", businessId).limit(300).get();
  return snap.docs
    .map((d) => {
      const x = d.data();
      return {
        id: d.id,
        name: String(x.name),
        profileUrl: String(x.profileUrl ?? ""),
        location: String(x.location ?? ""),
        notes: String(x.notes ?? ""),
        kind: x.kind === "own" ? "own" : "competitor",
        status: x.status === "archived" ? "archived" : "active",
        createdAt: String(x.createdAt ?? ""),
      } satisfies CompetitorView;
    })
    .sort((a, b) => Number(b.kind === "own") - Number(a.kind === "own") || a.name.localeCompare(b.name));
}

export async function listSnapshots(businessId: string): Promise<SnapshotView[]> {
  const snap = await adminDb().collection("competitor_snapshots").where("businessId", "==", businessId).limit(2000).get();
  return snap.docs
    .map((d) => {
      const x = d.data();
      return {
        id: d.id,
        competitorId: String(x.competitorId),
        checkedOn: String(x.checkedOn),
        rating: typeof x.rating === "number" ? x.rating : undefined,
        reviewCount: typeof x.reviewCount === "number" ? x.reviewCount : undefined,
        categories: Array.isArray(x.categories) ? x.categories.map(String) : [],
        services: Array.isArray(x.services) ? x.services.map(String) : [],
        sourceUrl: String(x.sourceUrl ?? ""),
        sourceNote: String(x.sourceNote ?? ""),
      } satisfies SnapshotView;
    })
    .sort((a, b) => b.checkedOn.localeCompare(a.checkedOn));
}
