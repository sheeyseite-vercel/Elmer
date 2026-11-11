import type { Comparison } from "@/lib/analytics/dashboard";

/**
 * The only data the AI analyst and reports ever see: a snapshot of what is recorded in this app.
 * Free text typed by the owner (review excerpts, reply drafts, notes) is deliberately left out.
 * `null` always means "not recorded", never zero.
 */
export type Facts = {
  generatedAt: string;
  timezone: "Europe/Madrid";
  business: { name: string; city: string };
  period: { from: string; to: string; days: number; previousFrom: string; previousTo: string };
  metrics: { label: string; total: number | null; daysWithData: number; days: number; previousTotal: number | null; change: string }[];
  rankChecks: { keyword: string; text: string }[];
  leads: { entries: number; calls: number | null; inquiries: number | null; bookings: number | null; bookingsPerInquiryPct: number | null } | null;
  reviews: { recorded: number; averageStars: number | null; awaitingReply: number; lowRatedAwaitingReply: number } | null;
  searchTerms: { month: string; phrases: number; exactCountTotal: number | null; belowThreshold: number } | null;
  checklist: { complete: number; needsAttention: number; unknown: number };
  limits: string[];
};

export function changeText(c: Comparison): string {
  if (c.kind === "unavailable") return `Not comparable: ${c.reason}`;
  const sign = c.delta > 0 ? "+" : "";
  return c.pct === null ? `${sign}${c.delta}` : `${sign}${c.delta} (${sign}${c.pct.toFixed(1)}%)`;
}

export const hasAnyData = (f: Facts) =>
  f.metrics.some((m) => m.total !== null) || f.rankChecks.length > 0 || f.leads !== null || f.reviews !== null || f.searchTerms !== null;

const n = (v: number | null) => (v === null ? "not recorded" : String(v));

export function factsToText(f: Facts): string {
  const out: string[] = [
    `${f.business.name} (${f.business.city})`,
    `Period: ${f.period.from} to ${f.period.to} (${f.period.days} days). Compared with ${f.period.previousFrom} to ${f.period.previousTo}.`,
    "",
    "PERFORMANCE (daily counts you imported or entered)",
    ...f.metrics.map((m) => `- ${m.label}: ${n(m.total)} (data on ${m.daysWithData} of ${m.days} days); previous period ${n(m.previousTotal)}; change: ${m.change}`),
    "",
    "RANK CHECKS (point-in-time observations)",
    ...(f.rankChecks.length ? f.rankChecks.map((r) => `- ${r.keyword}: ${r.text}`) : ["- none comparable yet"]),
    "",
    "LEADS (aggregate counts you recorded)",
    ...(f.leads
      ? [`- Calls ${n(f.leads.calls)}, inquiries ${n(f.leads.inquiries)}, bookings ${n(f.leads.bookings)} (${f.leads.entries} entries); bookings per inquiry ${f.leads.bookingsPerInquiryPct === null ? "not available" : f.leads.bookingsPerInquiryPct.toFixed(1) + "%"}`]
      : ["- none recorded"]),
    "",
    "REVIEWS (only those you recorded)",
    ...(f.reviews
      ? [`- ${f.reviews.recorded} recorded, average ${n(f.reviews.averageStars)} stars, ${f.reviews.awaitingReply} awaiting reply (${f.reviews.lowRatedAwaitingReply} rated 3 or fewer)`]
      : ["- none recorded"]),
    "",
    "SEARCH PHRASES (as reported by Google, latest month saved)",
    ...(f.searchTerms
      ? [`- ${f.searchTerms.month}: ${f.searchTerms.phrases} phrases, exact-count total ${n(f.searchTerms.exactCountTotal)}, ${f.searchTerms.belowThreshold} below Google's threshold`]
      : ["- none saved"]),
    "",
    `PROFILE CHECKLIST: ${f.checklist.complete} complete, ${f.checklist.needsAttention} need attention, ${f.checklist.unknown} unknown`,
    "",
    "LIMITS",
    ...f.limits.map((l) => `- ${l}`),
  ];
  return out.join("\n");
}

/** Guards against spreadsheet formula injection from owner-typed text (keywords, names). */
export const csvCell = (v: string | number | null): string => {
  let s = v === null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function factsToCsv(f: Facts): string {
  const rows: (string | number | null)[][] = [["section", "item", "value", "note"]];
  rows.push(["period", "from", f.period.from, ""], ["period", "to", f.period.to, ""]);
  for (const m of f.metrics) rows.push(["performance", m.label, m.total, `days with data ${m.daysWithData}/${m.days}; previous ${m.previousTotal ?? "not recorded"}; ${m.change}`]);
  for (const r of f.rankChecks) rows.push(["rank_check", r.keyword, r.text, "point-in-time observation"]);
  if (f.leads) rows.push(["leads", "calls", f.leads.calls, ""], ["leads", "inquiries", f.leads.inquiries, ""], ["leads", "bookings", f.leads.bookings, ""]);
  if (f.reviews) rows.push(["reviews", "recorded", f.reviews.recorded, "only reviews recorded in the app"], ["reviews", "awaiting_reply", f.reviews.awaitingReply, ""]);
  if (f.searchTerms) rows.push(["search_phrases", f.searchTerms.month, f.searchTerms.exactCountTotal, `${f.searchTerms.phrases} phrases; ${f.searchTerms.belowThreshold} below threshold`]);
  rows.push(["checklist", "complete", f.checklist.complete, ""], ["checklist", "needs_attention", f.checklist.needsAttention, ""], ["checklist", "unknown", f.checklist.unknown, ""]);
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
