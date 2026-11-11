import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { Competitor } from "@/lib/schema/keywords";

export type KeywordStatus = "active" | "paused" | "archived";

export type KeywordView = {
  id: string;
  term: string;
  language: "es" | "en";
  targetArea: string;
  surface: "maps" | "search" | "both";
  group: string;
  tags: string[];
  notes: string;
  status: KeywordStatus;
  createdAt: string;
};

export type CheckView = {
  id: string;
  keywordId: string;
  keyword: string;
  checkedAt: string;
  locationLabel: string;
  lat?: number;
  lng?: number;
  device: "mobile" | "desktop";
  surface: "maps" | "search";
  position: number | null;
  depth: number;
  competitors: Competitor[];
  methodology: string;
  referenceUrl: string;
};

// Equality-only queries + in-memory sorting: no composite index needed.
export async function listKeywords(businessId: string): Promise<KeywordView[]> {
  const snap = await adminDb().collection("tracked_keywords").where("businessId", "==", businessId).limit(500).get();
  return snap.docs
    .map((d) => {
      const x = d.data();
      return {
        id: d.id,
        term: String(x.term),
        language: x.language === "en" ? "en" : "es",
        targetArea: String(x.targetArea ?? ""),
        surface: (["maps", "search", "both"].includes(x.surface) ? x.surface : "both") as KeywordView["surface"],
        group: String(x.group ?? ""),
        tags: Array.isArray(x.tags) ? x.tags.map(String) : [],
        notes: String(x.notes ?? ""),
        status: (["active", "paused", "archived"].includes(x.status) ? x.status : "active") as KeywordStatus,
        createdAt: String(x.createdAt ?? ""),
      } satisfies KeywordView;
    })
    .sort((a, b) => a.term.localeCompare(b.term));
}

export async function getKeyword(businessId: string, id: string): Promise<KeywordView | null> {
  const all = await listKeywords(businessId);
  return all.find((k) => k.id === id) ?? null;
}

export async function listChecks(businessId: string): Promise<CheckView[]> {
  const snap = await adminDb().collection("rank_checks").where("businessId", "==", businessId).limit(2000).get();
  return snap.docs
    .map((d) => {
      const x = d.data();
      return {
        id: d.id,
        keywordId: String(x.keywordId),
        keyword: String(x.keyword ?? ""),
        checkedAt: String(x.checkedAt),
        locationLabel: String(x.locationLabel ?? ""),
        lat: typeof x.lat === "number" ? x.lat : undefined,
        lng: typeof x.lng === "number" ? x.lng : undefined,
        device: x.device === "desktop" ? "desktop" : "mobile",
        surface: x.surface === "search" ? "search" : "maps",
        position: typeof x.position === "number" ? x.position : null,
        depth: Number(x.depth ?? 0),
        competitors: Array.isArray(x.competitors) ? (x.competitors as Competitor[]) : [],
        methodology: String(x.methodology ?? ""),
        referenceUrl: String(x.referenceUrl ?? ""),
      } satisfies CheckView;
    })
    .sort((a, b) => b.checkedAt.localeCompare(a.checkedAt));
}
