export type LeadEntry = {
  id: string;
  periodStart: string;
  periodEnd: string;
  source: string;
  calls?: number;
  inquiries?: number;
  bookings?: number;
};

/** Two periods overlap when they share at least one day. */
export const overlaps = (a: { periodStart: string; periodEnd: string }, b: { periodStart: string; periodEnd: string }) =>
  a.periodStart <= b.periodEnd && a.periodEnd >= b.periodStart;

export type Conversion = { rate: number | null; bookings: number; inquiries: number; entriesUsed: number };

/**
 * Bookings per inquiry = Σ bookings ÷ Σ inquiries, using ONLY entries where both were recorded
 * (a missing number is never treated as zero). Returns rate null when it cannot be defined.
 */
export function conversion(entries: LeadEntry[]): Conversion {
  let bookings = 0;
  let inquiries = 0;
  let used = 0;
  for (const e of entries) {
    if (e.bookings === undefined || e.inquiries === undefined) continue;
    bookings += e.bookings;
    inquiries += e.inquiries;
    used++;
  }
  return { rate: used > 0 && inquiries > 0 ? (bookings / inquiries) * 100 : null, bookings, inquiries, entriesUsed: used };
}

export type Totals = { calls: number | null; inquiries: number | null; bookings: number | null; entries: number };

const sumOf = (list: (number | undefined)[]) => {
  const present = list.filter((n): n is number => n !== undefined);
  return present.length ? present.reduce((a, b) => a + b, 0) : null;
};

export function totals(entries: LeadEntry[]): Totals {
  return {
    calls: sumOf(entries.map((e) => e.calls)),
    inquiries: sumOf(entries.map((e) => e.inquiries)),
    bookings: sumOf(entries.map((e) => e.bookings)),
    entries: entries.length,
  };
}
