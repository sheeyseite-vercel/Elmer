/**
 * Pure dashboard calculations. Nothing here invents or estimates data: every figure is a sum
 * of stored daily values, and anything missing stays missing (null), never zero.
 */
export type SourceKind = "google_csv" | "manual";
export type Rec = { metric: string; date: string; value: number; sourceKind: SourceKind; createdAt: string };

const DAY = 86_400_000;
const toMs = (d: string) => Date.parse(`${d}T00:00:00Z`);
const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const addDays = (d: string, n: number) => fmt(toMs(d) + n * DAY);
export const daysInclusive = (from: string, to: string) => Math.round((toMs(to) - toMs(from)) / DAY) + 1;

const isDate = (s: unknown): s is string =>
  typeof s === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  !Number.isNaN(toMs(s)) && // Date.parse gives NaN for month 13 etc.; toISOString would throw on it
  fmt(toMs(s)) === s;

export type Range = { from: string; to: string; days: number; preset: "7" | "28" | "90" | "custom"; label: string };

export function resolveRange(
  p: { range?: string; from?: string; to?: string },
  today: string,
): { range: Range; error?: string } {
  const preset = (n: 7 | 28 | 90): Range => {
    let from: string;
    if (n === 90) {
      const d = new Date(toMs(today));
      d.setUTCMonth(d.getUTCMonth() - 3);
      from = addDays(fmt(d.getTime()), 1); // calendar 3 months, inclusive of today
    } else from = addDays(today, -(n - 1));
    return {
      from,
      to: today,
      days: daysInclusive(from, today),
      preset: String(n) as Range["preset"],
      label: n === 90 ? "Last 3 months" : `Last ${n} days`,
    };
  };

  if (p.range === "7") return { range: preset(7) };
  if (p.range === "90") return { range: preset(90) };
  if (p.range === "custom") {
    if (!isDate(p.from) || !isDate(p.to)) return { range: preset(28), error: "Enter both dates in a valid format. Showing the last 28 days." };
    if (p.from > p.to) return { range: preset(28), error: "The start date is after the end date. Showing the last 28 days." };
    if (p.to > today) return { range: preset(28), error: "The end date cannot be in the future. Showing the last 28 days." };
    const days = daysInclusive(p.from, p.to);
    if (days > 366) return { range: preset(28), error: "Custom ranges are limited to 366 days. Showing the last 28 days." };
    return { range: { from: p.from, to: p.to, days, preset: "custom", label: "Custom range" } };
  }
  return { range: preset(28) };
}

export const previousRange = (r: Range): { from: string; to: string; days: number } => {
  const to = addDays(r.from, -1);
  return { from: addDays(to, -(r.days - 1)), to, days: r.days };
};

/**
 * One value per metric per day. If a day has both an imported and a manual value we use the
 * imported one and never add them together (that would double count the same day).
 */
export function resolveDaily(records: Rec[]): Map<string, Rec> {
  const out = new Map<string, Rec>();
  for (const r of records) {
    const k = `${r.metric}|${r.date}`;
    const cur = out.get(k);
    if (!cur || (cur.sourceKind === "manual" && r.sourceKind === "google_csv")) out.set(k, r);
  }
  return out;
}

export type Summary = { total: number | null; daysWithData: number; days: number; sources: SourceKind[] };

export function summarize(daily: Map<string, Rec>, metric: string, from: string, to: string): Summary {
  const days = daysInclusive(from, to);
  let total = 0;
  let n = 0;
  const sources = new Set<SourceKind>();
  for (let i = 0; i < days; i++) {
    const r = daily.get(`${metric}|${addDays(from, i)}`);
    if (r) {
      total += r.value;
      n++;
      sources.add(r.sourceKind);
    }
  }
  return { total: n ? total : null, daysWithData: n, days, sources: [...sources] };
}

export type Comparison =
  | { kind: "ok"; delta: number; pct: number | null }
  | { kind: "unavailable"; reason: string };

const MIN_COVERAGE = 0.8;

/** A comparison is only shown when BOTH periods have data on at least 80% of their days. */
export function compare(cur: Summary, prev: Summary): Comparison {
  if (cur.total === null) return { kind: "unavailable", reason: "No data in this period." };
  if (prev.total === null) return { kind: "unavailable", reason: "No data in the previous period." };
  if (cur.daysWithData / cur.days < MIN_COVERAGE)
    return { kind: "unavailable", reason: `This period has data for only ${cur.daysWithData} of ${cur.days} days.` };
  if (prev.daysWithData / prev.days < MIN_COVERAGE)
    return { kind: "unavailable", reason: `The previous period has data for only ${prev.daysWithData} of ${prev.days} days.` };
  const delta = cur.total - prev.total;
  return { kind: "ok", delta, pct: prev.total === 0 ? null : (delta / prev.total) * 100 };
}

export type Point = { date: string; value: number | null; source: SourceKind | null };

/** Daily series with gaps kept as null so charts never draw missing days as zero. */
export function series(daily: Map<string, Rec>, metric: string, from: string, to: string): Point[] {
  return Array.from({ length: daysInclusive(from, to) }, (_, i) => {
    const date = addDays(from, i);
    const r = daily.get(`${metric}|${date}`);
    return { date, value: r ? r.value : null, source: r ? r.sourceKind : null };
  });
}

export type Action = { title: string; evidence: string; action: string; href: string };

/** Recommendations come only from what is (or is not) stored. They make no promise about rankings or customers. */
export function recommendedActions(input: {
  today: string;
  records: Rec[];
  metricLabels: Record<string, string>;
  currentCoverage: { metric: string; daysWithData: number; days: number }[];
  missingProfileFields: string[];
}): Action[] {
  const out: Action[] = [];
  const { today, records } = input;

  if (records.length === 0) {
    out.push({
      title: "Add your first data",
      evidence: "No performance values are stored yet.",
      action: "Import a CSV or enter a daily value by hand.",
      href: "/data",
    });
  } else {
    const latest = records.reduce((m, r) => (r.date > m ? r.date : m), "0000-00-00");
    const age = daysInclusive(latest, today) - 1;
    if (age > 14) {
      out.push({
        title: "Update your data",
        evidence: `The newest stored value is for ${latest}, ${age} days ago.`,
        action: "Import a newer export so the dashboard reflects recent weeks.",
        href: "/data",
      });
    }
    for (const c of input.currentCoverage) {
      if (c.daysWithData > 0 && c.daysWithData / c.days < 0.5) {
        out.push({
          title: `Fill gaps in ${input.metricLabels[c.metric] ?? c.metric}`,
          evidence: `Only ${c.daysWithData} of ${c.days} days in this period have a value.`,
          action: "Import a fuller export or add the missing days manually.",
          href: "/data",
        });
        break;
      }
    }
  }

  if (input.missingProfileFields.length > 0) {
    out.push({
      title: "Complete your business details",
      evidence: `Not filled in yet: ${input.missingProfileFields.join(", ")}.`,
      action: "Add them so later modules (map, checklist) have what they need.",
      href: "/onboarding",
    });
  }
  return out.slice(0, 3);
}
