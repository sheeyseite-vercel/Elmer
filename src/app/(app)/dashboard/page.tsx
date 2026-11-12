import Link from "next/link";
import { redirect } from "next/navigation";
import { DailyBars } from "@/components/charts/daily-bars";
import { SourceBadge } from "@/components/ui/badges";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import {
  compare, previousRange, recommendedActions, resolveDaily, resolveRange, series, summarize, type Summary,
} from "@/lib/analytics/dashboard";
import { getBusinessForUser } from "@/lib/data/business";
import { fetchMetricRecords, METRIC_FETCH_LIMIT, todayInMadrid } from "@/lib/data/metrics";
import { METRICS } from "@/lib/metrics";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const PRESETS = [
  { value: "7", label: "7 days" },
  { value: "28", label: "28 days" },
  { value: "90", label: "3 months" },
] as const;

const fmtNum = (n: number) => new Intl.NumberFormat("en-GB").format(n);

function sourceBadges(s: Summary) {
  return s.sources.map((k) => <SourceBadge key={k} kind={k} />);
}

export default async function DashboardPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");

  const today = todayInMadrid();
  const { range, error } = resolveRange({ range: one(sp.range), from: one(sp.from), to: one(sp.to) }, today);
  const prev = previousRange(range);

  const { records, truncated } = await fetchMetricRecords(business.id);
  const daily = resolveDaily(records);

  const rows = METRICS.map((m) => {
    const cur = summarize(daily, m.key, range.from, range.to);
    const pre = summarize(daily, m.key, prev.from, prev.to);
    return { ...m, cur, pre, cmp: compare(cur, pre) };
  });

  const withData = rows.filter((r) => r.cur.total !== null);
  const wanted = one(sp.metric);
  const selected = METRICS.find((m) => m.key === wanted)?.key ?? withData[0]?.key ?? METRICS[0].key;
  const selectedRow = rows.find((r) => r.key === selected)!;
  const points = series(daily, selected, range.from, range.to);

  const latestAdded = records.reduce((m, r) => (r.createdAt > m ? r.createdAt : m), "");
  const latestDay = records.reduce((m, r) => (r.date > m ? r.date : m), "");

  const missing: string[] = [];
  if (!business.address) missing.push("address");
  if (!business.phone) missing.push("phone");
  if (!business.website) missing.push("website");
  if (!business.bookingUrl) missing.push("booking link");
  if (!business.profileUrl) missing.push("Google profile link");
  if (business.latitude === undefined || business.longitude === undefined) missing.push("map coordinates");

  const actions = recommendedActions({
    today,
    records,
    metricLabels: Object.fromEntries(METRICS.map((m) => [m.key, m.label])),
    currentCoverage: rows.map((r) => ({ metric: r.key, daysWithData: r.cur.daysWithData, days: r.cur.days })),
    missingProfileFields: missing,
  });

  const href = (extra: Record<string, string>) => {
    const q = new URLSearchParams();
    q.set("range", range.preset);
    if (range.preset === "custom") {
      q.set("from", range.from);
      q.set("to", range.to);
    }
    Object.entries(extra).forEach(([k, v]) => q.set(k, v));
    return `/dashboard?${q.toString()}`;
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted">
          {range.label}: {range.from} to {range.to} ({range.days} days) · compared with {prev.from} to {prev.to}
        </p>
      </div>

      <nav aria-label="Date range" className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Link
              key={p.value}
              href={`/dashboard?range=${p.value}`}
              aria-current={range.preset === p.value ? "true" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-medium",
                range.preset === p.value ? "border-primary bg-surface-2 text-text" : "border-border text-muted hover:text-text",
              )}
            >
              {p.label}
            </Link>
          ))}
        </div>
        <form method="get" action="/dashboard" className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="range" value="custom" />
          <label className="text-xs text-muted">
            From
            <input name="from" type="date" max={today} defaultValue={range.from} required className="mt-1 block min-h-11 rounded-xl border border-border bg-surface-2 px-3 text-base text-text" />
          </label>
          <label className="text-xs text-muted">
            To
            <input name="to" type="date" max={today} defaultValue={range.to} required className="mt-1 block min-h-11 rounded-xl border border-border bg-surface-2 px-3 text-base text-text" />
          </label>
          <button type="submit" className="min-h-11 rounded-xl border border-border bg-surface-2 px-4 text-sm font-medium">
            Apply
          </button>
        </form>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </nav>

      {records.length === 0 ? (
        <EmptyState>
          Nothing is stored yet, so there is nothing to chart. Import a CSV or enter a daily value on the{" "}
          <Link href="/data" className="text-accent underline">Data page</Link>. No numbers are shown until real data
          exists.
        </EmptyState>
      ) : (
        <p className="text-xs text-muted">
          Newest day with data: {latestDay} · Last data added: {new Date(latestAdded).toLocaleString("en-GB", { timeZone: "Europe/Madrid" })} (Madrid time)
        </p>
      )}
      {truncated && (
        <p role="alert" className="text-sm text-warning">
          More than {METRIC_FETCH_LIMIT} values are stored, so totals may be incomplete.
        </p>
      )}

      <section aria-label="Key figures" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <Card key={r.key} className="space-y-2">
            <p className="text-sm text-muted">{r.label}</p>
            {r.cur.total === null ? (
              <p className="text-2xl font-semibold">No data yet</p>
            ) : (
              <p className="font-display text-4xl font-semibold tabular-nums leading-none">{fmtNum(r.cur.total)}</p>
            )}
            <p className="text-xs text-muted">
              {r.cur.total === null ? "No values in this period." : `Total from ${r.cur.daysWithData} of ${r.cur.days} days with data`}
            </p>
            {r.cmp.kind === "ok" ? (
              <p className="text-sm">
                {r.cmp.delta === 0 ? "No change" : `${r.cmp.delta > 0 ? "+" : "−"}${fmtNum(Math.abs(r.cmp.delta))}`}
                {r.cmp.pct !== null && r.cmp.delta !== 0 ? ` (${r.cmp.pct > 0 ? "+" : "−"}${Math.abs(r.cmp.pct).toFixed(1)}%)` : ""}
                <span className="text-muted"> vs previous period ({fmtNum(r.pre.total ?? 0)})</span>
              </p>
            ) : (
              r.cur.total !== null && <p className="text-xs text-muted">No comparison: {r.cmp.reason}</p>
            )}
            <div className="flex flex-wrap gap-1">{sourceBadges(r.cur)}</div>
            {r.cur.total !== null && (
              <Link href={href({ metric: r.key })} className="inline-flex min-h-11 items-center text-sm text-accent underline">
                Show chart
              </Link>
            )}
          </Card>
        ))}
      </section>

      {withData.length > 0 && (
        <Card className="space-y-3">
          <DailyBars
            points={points}
            title={`${selectedRow.label} per day`}
            unit="Count per day"
            period={`${range.from} to ${range.to}`}
            source={selectedRow.cur.sources.map((s) => (s === "manual" ? "Manually entered" : "Imported CSV")).join(" + ") || "none"}
          />
        </Card>
      )}

      <Card className="space-y-3">
        <CardTitle>Recommended actions</CardTitle>
        {actions.length === 0 ? (
          <p className="text-sm text-muted">Nothing to flag from the data stored right now.</p>
        ) : (
          <ol className="space-y-3">
            {actions.map((a) => (
              <li key={a.title} className="rounded-xl border border-border p-3 text-sm">
                <p className="font-medium">{a.title}</p>
                <p className="text-muted">Evidence: {a.evidence}</p>
                <p>Next step: {a.action}</p>
                <Link href={a.href} className="inline-flex min-h-11 items-center text-accent underline">Open</Link>
              </li>
            ))}
          </ol>
        )}
        <p className="text-xs text-muted">
          These come only from what is stored here. They say nothing about rankings or future customers.
        </p>
      </Card>

      <p className="text-xs text-muted">
        Definitions: each figure is the sum of daily counts exactly as provided by its source. Imported and manual values
        for the same day are never added together; the imported one is used. The app does not estimate missing days.
      </p>
    </div>
  );
}
