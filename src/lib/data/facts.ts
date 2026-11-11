import "server-only";
import { changeText, type Facts } from "@/lib/analytics/facts";
import { compare, previousRange, resolveDaily, resolveRange, summarize } from "@/lib/analytics/dashboard";
import { conversion, totals } from "@/lib/analytics/leads";
import { describeChanges } from "@/lib/analytics/rank";
import { summarize as reviewSummary } from "@/lib/analytics/reviews";
import { monthSummary } from "@/lib/analytics/search-terms";
import { getBusinessForUser } from "@/lib/data/business";
import { listChecks, listKeywords } from "@/lib/data/keywords";
import { listLeadEntries } from "@/lib/data/leads";
import { fetchMetricRecords, todayInMadrid } from "@/lib/data/metrics";
import { listTasks } from "@/lib/data/profile";
import { listReviews } from "@/lib/data/reviews";
import { listTerms } from "@/lib/data/search-terms";
import { ITEMS } from "@/lib/profile-checklist";
import { METRICS } from "@/lib/metrics";

export const RANGES = { "7": "Last 7 days", "28": "Last 28 days", "90": "Last 3 months" } as const;
export type RangeKey = keyof typeof RANGES;

export async function buildFacts(business: NonNullable<Awaited<ReturnType<typeof getBusinessForUser>>>, rangeKey: RangeKey): Promise<Facts> {
  const today = todayInMadrid();
  const { range } = resolveRange({ range: rangeKey }, today);
  const prev = previousRange(range);

  const [{ records, truncated }, keywords, checks, leads, reviews, terms, tasks] = await Promise.all([
    fetchMetricRecords(business.id),
    listKeywords(business.id),
    listChecks(business.id),
    listLeadEntries(business.id),
    listReviews(business.id),
    listTerms(business.id),
    listTasks(business.id),
  ]);

  const daily = resolveDaily(records);
  const metrics = METRICS.map((m) => {
    const cur = summarize(daily, m.key, range.from, range.to);
    const pre = summarize(daily, m.key, prev.from, prev.to);
    return { label: m.label, total: cur.total, daysWithData: cur.daysWithData, days: cur.days, previousTotal: pre.total, change: changeText(compare(cur, pre)) };
  });

  // Like-for-like comparisons are made per keyword, so different keywords are never mixed.
  const rankChecks: Facts["rankChecks"] = [];
  for (const k of keywords.filter((x) => x.status === "active").slice(0, 10)) {
    const mine = checks.filter((c) => c.keywordId === k.id).map((c) => ({ id: c.id, checkedAt: c.checkedAt, locationLabel: c.locationLabel, device: c.device, surface: c.surface, position: c.position, depth: c.depth }));
    for (const ch of describeChanges(mine)) rankChecks.push({ keyword: k.term, text: `${ch.surface}, ${ch.device}, ${ch.location}: ${ch.text}` });
  }

  const inPeriod = leads.filter((e) => e.periodStart <= range.to && e.periodEnd >= range.from);
  const lt = totals(inPeriod);
  const conv = conversion(inPeriod);

  const latestMonth = terms.map((t) => t.month).sort().reverse()[0];
  const ts = latestMonth ? monthSummary(terms.filter((t) => t.month === latestMonth)) : null;
  const rs = reviewSummary(reviews);

  const checklist = { complete: 0, needsAttention: 0, unknown: 0 };
  for (const item of ITEMS) {
    const s = tasks.get(item.key)?.status ?? "unknown";
    if (s === "complete") checklist.complete++;
    else if (s === "needs_attention") checklist.needsAttention++;
    else checklist.unknown++;
  }

  const limits = [
    "Everything here is data you imported or typed into this app; the app does not read your live Google profile.",
    "Rank checks are single observations, not trends.",
    "Lead entries that overlap the period are counted in full.",
  ];
  if (truncated) limits.push("More performance records exist than could be loaded; totals may be incomplete.");

  return {
    generatedAt: new Date().toISOString(),
    timezone: "Europe/Madrid",
    business: { name: business.name, city: business.city },
    period: { from: range.from, to: range.to, days: range.days, previousFrom: prev.from, previousTo: prev.to },
    metrics,
    rankChecks: rankChecks.slice(0, 12),
    leads: inPeriod.length ? { entries: lt.entries, calls: lt.calls, inquiries: lt.inquiries, bookings: lt.bookings, bookingsPerInquiryPct: conv.rate } : null,
    reviews: rs.count ? { recorded: rs.count, averageStars: rs.average, awaitingReply: rs.awaitingReply, lowRatedAwaitingReply: rs.lowAwaiting } : null,
    searchTerms: ts && latestMonth ? { month: latestMonth, phrases: ts.phrases, exactCountTotal: ts.knownTotal, belowThreshold: ts.below } : null,
    checklist,
    limits,
  };
}
