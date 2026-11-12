import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badges";
import { requireUser } from "@/lib/auth/session";
import { getBusinessForUser } from "@/lib/data/business";
import { formatMadrid } from "@/lib/time";
import { listReports } from "@/lib/data/reports";
import { createDataSummary } from "./actions";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Reports" };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const { tr } = await getT();
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");
  const [reports, sp] = await Promise.all([listReports(business.id), searchParams]);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{tr("Reports")}</h1>
        <p className="text-sm text-muted">{tr("Saved snapshots of your recorded data, with or without an AI analysis. Download as CSV or text, or print to PDF.")}</p>
      </div>

      <form action={createDataSummary}>
        <Card className="space-y-3">
          <CardTitle>{tr("Create a data summary (no AI)")}</CardTitle>
          <p className="text-sm text-muted">{tr("A plain snapshot of the figures recorded in the app. Nothing is sent to any provider.")}</p>
          <label className="block text-sm font-medium">
            {tr("Period")}
            <select name="range" defaultValue="28" className="mt-1 block min-h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-base text-text">
              <option value="7">{tr("Last 7 days")}</option>
              <option value="28">{tr("Last 28 days")}</option>
              <option value="90">{tr("Last 3 months")}</option>
            </select>
          </label>
          {sp.notice === "no-data" && <p role="alert" className="text-sm text-danger">{tr("No data yet. Import or enter some data first.")}</p>}
          <Button type="submit" className="w-full">{tr("Create summary")}</Button>
        </Card>
      </form>

      {reports.length === 0 ? (
        <Card className="text-center">
          <p className="text-lg font-semibold">{tr("No reports yet")}</p>
          <p className="mt-1 text-sm text-muted">{tr("Create a summary above, or run the")} <Link href="/ai-analyst" className="text-accent underline">{tr("AI analyst")}</Link>.</p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {reports.map((r) => (
            <li key={r.id}>
              <Link href={`/reports/${r.id}`} className="block min-h-11 rounded-2xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{formatMadrid(r.createdAt)}</span>
                  <StatusBadge tone={r.kind === "ai_analysis" ? "warning" : "neutral"}>{r.kind === "ai_analysis" ? tr("AI analysis (estimate)") : tr("Data summary")}</StatusBadge>
                </div>
                <p className="mt-1 text-xs text-muted">{r.facts.period.from} → {r.facts.period.to}{r.question ? ` · “${r.question}”` : ""}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
