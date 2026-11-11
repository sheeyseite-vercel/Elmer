import type { MetricKey } from "@/lib/metrics";
import { parseCount, parseDate, type DateOrder, type DecimalStyle } from "./parse";

/** column index -> what that column is. Anything not listed is ignored. */
export type ColumnMapping = { dateColumn: number; metricColumns: Record<number, MetricKey> };

export type ImportOptions = { dateOrder: DateOrder; decimal: DecimalStyle; today: string };

export type MetricRecord = { metric: MetricKey; date: string; value: number };
export type Rejection = { line: number; column: string; reason: string };

export type ImportResult = {
  accepted: MetricRecord[];
  rejected: Rejection[];
  emptyCells: number; // blank cells are "no data", never stored as zero
  duplicatesInFile: number; // same metric+date seen again; the last value wins
  dateRange: { from: string; to: string } | null;
};

/**
 * Pure validation of CSV rows against a mapping. Every problem is reported with its
 * line number; nothing is silently dropped. Line numbers count the header as line 1.
 */
export function buildImport(
  headers: string[],
  rows: string[][],
  mapping: ColumnMapping,
  opts: ImportOptions,
): ImportResult {
  const accepted = new Map<string, MetricRecord>();
  const rejected: Rejection[] = [];
  let emptyCells = 0;
  let duplicatesInFile = 0;

  rows.forEach((row, i) => {
    const line = i + 2;
    const rawDate = row[mapping.dateColumn] ?? "";
    const date = parseDate(rawDate, opts.dateOrder);
    const dateName = headers[mapping.dateColumn] ?? "date";
    if (!date) {
      rejected.push({ line, column: dateName, reason: rawDate.trim() ? `Invalid date "${rawDate.trim()}"` : "Missing date" });
      return;
    }
    if (date < "2000-01-01" || date > opts.today) {
      rejected.push({ line, column: dateName, reason: `Date ${date} is outside the allowed range (2000-01-01 to today)` });
      return;
    }

    for (const [colStr, metric] of Object.entries(mapping.metricColumns)) {
      const col = Number(colStr);
      const name = headers[col] ?? `column ${col + 1}`;
      const n = parseCount(row[col] ?? "", opts.decimal);
      if (n === null) {
        emptyCells++;
        continue;
      }
      if (Number.isNaN(n)) {
        rejected.push({ line, column: name, reason: `"${(row[col] ?? "").trim()}" is not a number` });
        continue;
      }
      if (n < 0) {
        rejected.push({ line, column: name, reason: `Negative value ${n}` });
        continue;
      }
      if (!Number.isInteger(n)) {
        rejected.push({ line, column: name, reason: `${n} is not a whole count` });
        continue;
      }
      const key = `${metric}|${date}`;
      if (accepted.has(key)) duplicatesInFile++;
      accepted.set(key, { metric, date, value: n });
    }
  });

  const list = [...accepted.values()].sort((a, b) => a.date.localeCompare(b.date) || a.metric.localeCompare(b.metric));
  return {
    accepted: list,
    rejected,
    emptyCells,
    duplicatesInFile,
    dateRange: list.length ? { from: list[0]!.date, to: list[list.length - 1]!.date } : null,
  };
}

/** Heuristic suggestion from a header name. Only a hint: the owner confirms every mapping. */
export function guessMetric(header: string): MetricKey | null {
  if (/llamad|call|tel[eé]fono|phone/i.test(header)) return "calls";
  if (/web|sitio|website/i.test(header)) return "website_clicks";
  if (/ruta|direc|direction/i.test(header)) return "direction_requests";
  if (/b[uú]squeda|search|apari|impres/i.test(header)) return "search_appearances";
  if (/visual|view|perfil|profile/i.test(header)) return "profile_views";
  return null;
}

/** Best-effort guess of which column is the date; the owner can always change it. */
export function guessDateColumn(headers: string[]): number {
  const i = headers.findIndex((h) => /fecha|date|d[ií]a|day/i.test(h));
  return i >= 0 ? i : 0;
}
