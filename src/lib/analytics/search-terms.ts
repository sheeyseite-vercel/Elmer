/**
 * Actual search phrases as reported by Google (e.g. the monthly "search terms" list in the Business
 * Profile performance report). These are NOT the owner's target keywords and are never merged with them.
 * Google hides exact counts below a threshold; those rows are kept as "below threshold", never as numbers.
 */
export type TermRow = { phrase: string; impressions: number | null; belowThreshold: boolean };

export const normalizePhrase = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
const strip = (s: string) => normalizePhrase(s).normalize("NFD").replace(/[̀-ͯ]/g, "");

export const isMonth = (m: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(m);

export type ParseResult = { rows: TermRow[]; errors: { line: number; reason: string }[] };

/**
 * One per line: "phrase, 120" | "phrase<TAB>120" | "phrase, <15" | "phrase" (count unknown).
 * The count is read from the LAST separator, so phrases may contain commas.
 */
export function parseTermLines(raw: string, maxRows = 500): ParseResult {
  const rows: TermRow[] = [];
  const errors: ParseResult["errors"] = [];
  const seen = new Set<string>();
  const lines = raw.split(/\r?\n/);
  lines.forEach((full, i) => {
    const line = full.trim();
    if (!line) return;
    const m = line.match(/^(.*?)[\t,;]\s*(<\s*\d+|\d[\d.,]*)\s*$/);
    let phrase = line;
    let impressions: number | null = null;
    let below = false;
    if (m) {
      phrase = (m[1] ?? "").trim().replace(/^"(.*)"$/, "$1");
      const c = (m[2] ?? "").replace(/\s/g, "");
      if (c.startsWith("<")) below = true;
      else {
        const n = Number(c.replace(/[.,](?=\d{3}(\D|$))/g, ""));
        if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
          errors.push({ line: i + 1, reason: "Count is not a whole number" });
          return;
        }
        impressions = n;
      }
    }
    if (phrase.length < 2 || phrase.length > 120) {
      errors.push({ line: i + 1, reason: "Phrase must be 2–120 characters" });
      return;
    }
    const key = normalizePhrase(phrase);
    if (seen.has(key)) {
      errors.push({ line: i + 1, reason: "Duplicate phrase in this list" });
      return;
    }
    seen.add(key);
    rows.push({ phrase, impressions, belowThreshold: below });
  });
  if (rows.length > maxRows) {
    return { rows: [], errors: [{ line: 0, reason: `At most ${maxRows} phrases per import` }] };
  }
  return { rows, errors };
}

export type Kind = "branded" | "local" | "service";
export const KIND_LABEL: Record<Kind, string> = { branded: "Contains your name", local: "Contains a place", service: "Other / service" };

/**
 * ESTIMATE ONLY: a simple text rule, not Google's own classification and not search intent.
 * "Contains your name" = every word of the business name appears in the phrase.
 * "Contains a place" = the phrase includes the saved city or service area, or "near me"/"cerca de mí".
 */
export function classify(phrase: string, ctx: { name: string; city: string; serviceArea?: string }): Kind {
  const p = strip(phrase);
  const nameWords = strip(ctx.name).split(" ").filter((w) => w.length > 2);
  if (nameWords.length > 0 && nameWords.every((w) => p.includes(w))) return "branded";
  const places = [ctx.city, ...(ctx.serviceArea ?? "").split(/[,;]/)].map(strip).filter((s) => s.length > 2);
  if (places.some((pl) => p.includes(pl)) || /\b(near me|cerca de mi|cerca)\b/.test(p)) return "local";
  return "service";
}

export type TermEntry = TermRow & { id: string; month: string };

/** Sum of exact counts only. Rows below Google's threshold or without a count are counted separately. */
export function monthSummary(rows: TermEntry[]) {
  let knownTotal = 0;
  let withCount = 0;
  let below = 0;
  let unknown = 0;
  for (const r of rows) {
    if (r.impressions !== null) { knownTotal += r.impressions; withCount++; }
    else if (r.belowThreshold) below++;
    else unknown++;
  }
  return { phrases: rows.length, knownTotal: withCount > 0 ? knownTotal : null, withCount, below, unknown };
}

/** Phrase exactly equal (ignoring case/accents) to a target keyword. Shown as a label, never merged. */
export const matchesTarget = (phrase: string, targets: string[]) => {
  const p = strip(phrase);
  return targets.some((t) => strip(t) === p);
};

export const sortRows = (rows: TermEntry[]) =>
  [...rows].sort((a, b) => (b.impressions ?? -1) - (a.impressions ?? -1) || a.phrase.localeCompare(b.phrase));
