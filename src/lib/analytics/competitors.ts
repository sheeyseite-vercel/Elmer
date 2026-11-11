import { normalizeName } from "@/lib/schema/competitors";

export const STALE_AFTER_DAYS = 30;

const DAY = 86_400_000;
/** True when a dated snapshot is older than 30 days. `checkedOn` and `today` are YYYY-MM-DD. */
export function isStale(checkedOn: string, today: string): boolean {
  return (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${checkedOn}T00:00:00Z`)) / DAY > STALE_AFTER_DAYS;
}

export type ObservedCheck = {
  id: string;
  keyword: string;
  checkedAt: string;
  locationLabel: string;
  surface: string;
  position: number | null; // Elmer's observed position; null = not found in the checked results
  competitors: { name: string }[];
};

export type Appearance = {
  competitorId: string;
  name: string;
  checksWhereElmerMissing: number; // competitor seen AND Elmer not found
  totalAppearances: number; // competitor seen at all
  keywords: string[];
  places: string[];
  firstDate: string;
  lastDate: string;
};

/**
 * Where a tracked competitor was recorded in a rank check while Elmer was not found.
 * Matching is by the names the owner typed (ignoring case, accents and punctuation), so it can
 * miss spelling variants. It describes recorded checks only, not what every searcher sees.
 */
export function appearances(checks: ObservedCheck[], competitors: { id: string; name: string }[]): Appearance[] {
  const out: Appearance[] = [];
  for (const comp of competitors) {
    const key = normalizeName(comp.name);
    if (!key) continue;
    const seen = checks.filter((c) => c.competitors.some((x) => normalizeName(x.name) === key));
    if (seen.length === 0) continue;
    const missing = seen.filter((c) => c.position === null);
    const dates = missing.map((c) => c.checkedAt.slice(0, 10)).sort();
    out.push({
      competitorId: comp.id,
      name: comp.name,
      checksWhereElmerMissing: missing.length,
      totalAppearances: seen.length,
      keywords: [...new Set(missing.map((c) => c.keyword))].sort(),
      places: [...new Set(missing.map((c) => c.locationLabel))].sort(),
      firstDate: dates[0] ?? "",
      lastDate: dates[dates.length - 1] ?? "",
    });
  }
  return out.filter((a) => a.checksWhereElmerMissing > 0).sort((a, b) => b.checksWhereElmerMissing - a.checksWhereElmerMissing);
}
