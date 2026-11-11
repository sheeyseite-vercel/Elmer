import { madridDay } from "@/lib/time";

export type GeoCheck = {
  id: string;
  keywordId: string;
  keyword: string;
  checkedAt: string;
  lat?: number;
  lng?: number;
  device: string;
  surface: string;
  position: number | null;
  depth: number;
  locationLabel: string;
  methodology: string;
};

export type Band = "top3" | "mid" | "low" | "none";
export const bandOf = (p: number | null): Band => (p === null ? "none" : p <= 3 ? "top3" : p <= 10 ? "mid" : "low");
export const BAND_TEXT: Record<Band, string> = {
  top3: "Positions 1–3",
  mid: "Positions 4–10",
  low: "Position 11 or lower",
  none: "Not found in checked results",
};

export const pointKey = (lat: number, lng: number) => `${lat.toFixed(5)},${lng.toFixed(5)}`;

export type GeoFilter = { keywordId: string; surface: string; device: string; from?: string; to?: string };

/**
 * Keyword, surface and device are all required so one map never mixes observations that are not
 * comparable (a different keyword, Maps vs Search, or mobile vs desktop). Checks without
 * coordinates cannot be placed on a map and are excluded here.
 */
export function filterGeo(checks: GeoCheck[], f: GeoFilter): GeoCheck[] {
  return checks.filter((c) => {
    if (c.lat === undefined || c.lng === undefined) return false;
    if (c.keywordId !== f.keywordId || c.surface !== f.surface || c.device !== f.device) return false;
    const day = madridDay(c.checkedAt);
    if (f.from && day < f.from) return false;
    if (f.to && day > f.to) return false;
    return true;
  });
}

export type GeoPoint = {
  key: string;
  lat: number;
  lng: number;
  label: string;
  position: number | null;
  depth: number;
  band: Band;
  checkedAt: string;
  methodology: string;
  checksAtPoint: number;
};

/** One entry per location: the newest matching check there. */
export function latestPerPoint(checks: GeoCheck[]): GeoPoint[] {
  const groups = new Map<string, GeoCheck[]>();
  for (const c of checks) {
    if (c.lat === undefined || c.lng === undefined) continue;
    const k = pointKey(c.lat, c.lng);
    groups.set(k, [...(groups.get(k) ?? []), c]);
  }
  const out: GeoPoint[] = [];
  for (const [key, list] of groups) {
    const newest = [...list].sort((a, b) => b.checkedAt.localeCompare(a.checkedAt))[0]!;
    out.push({
      key,
      lat: newest.lat!,
      lng: newest.lng!,
      label: newest.locationLabel,
      position: newest.position,
      depth: newest.depth,
      band: bandOf(newest.position),
      checkedAt: newest.checkedAt,
      methodology: newest.methodology,
      checksAtPoint: list.length,
    });
  }
  return out.sort((a, b) => a.label.localeCompare(b.label));
}
