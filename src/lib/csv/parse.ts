export type ParsedCsv = { delimiter: string; headers: string[]; rows: string[][] };

/** Picks the delimiter that appears most in the first non-empty line, outside quotes. */
export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim() !== "") ?? "";
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0 };
  let inQuotes = false;
  for (const ch of firstLine) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes && ch in counts) counts[ch] = (counts[ch] ?? 0) + 1;
  }
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : ",";
}

/** Minimal RFC-4180 style parser: quoted fields, escaped quotes, CRLF/LF, BOM. */
export function parseCsv(input: string): ParsedCsv {
  const text = input.replace(/^﻿/, "");
  const delimiter = detectDelimiter(text);
  const records: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      records.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    records.push(row);
  }

  const nonEmpty = records.filter((r) => r.some((c) => c.trim() !== ""));
  const [head, ...rows] = nonEmpty;
  return { delimiter, headers: (head ?? []).map((h) => h.trim()), rows };
}

export type DecimalStyle = "comma" | "dot";
export type DateOrder = "dmy" | "mdy" | "ymd";

/** Parses a count. Returns null for blank, NaN for unparseable. Handles "1.234", "1,234", "1.234,0". */
export function parseCount(raw: string, decimal: DecimalStyle): number | null {
  let s = raw.trim().replace(/\s/g, "");
  if (s === "") return null;
  if (decimal === "comma") s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(s)) return Number.NaN;
  return Number(s);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Parses a calendar date to YYYY-MM-DD, or null when invalid (including impossible dates like 31/02). */
export function parseDate(raw: string, order: DateOrder): string | null {
  const s = raw.trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,4})[./-](\d{1,2})[./-](\d{1,4})(?:[ T].*)?$/);
  if (!m) return null;
  let y: number, mo: number, d: number;
  const [a, b, c] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (m[1]!.length === 4) {
    // Four-digit year first is unambiguous: always year-month-day.
    [y, mo, d] = [a, b, c];
  } else if (m[3]!.length === 4) {
    if (order === "mdy") [mo, d, y] = [a, b, c];
    else [d, mo, y] = [a, b, c];
  } else return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${pad(mo)}-${pad(d)}`;
}
