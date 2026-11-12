import { redirect } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badges";
import { KIND_LABEL, classify, matchesTarget, monthSummary, sortRows, type Kind } from "@/lib/analytics/search-terms";
import { requireUser } from "@/lib/auth/session";
import { getBusinessForUser } from "@/lib/data/business";
import { listKeywords } from "@/lib/data/keywords";
import { todayInMadrid } from "@/lib/data/metrics";
import { listTerms } from "@/lib/data/search-terms";
import { DeleteMonthButton } from "./delete-month";
import { TermsForm } from "./terms-form";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Search insights" };

const fmt = (n: number | null) => (n === null ? "—" : new Intl.NumberFormat("en-GB").format(n));
const SOURCE_LABEL: Record<string, string> = { google_report: "Google report (copied by you)", manual: "typed by you" };

export default async function SearchInsightsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { tr } = await getT();
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");

  const [terms, keywords, sp] = await Promise.all([listTerms(business.id), listKeywords(business.id), searchParams]);
  const months = [...new Set(terms.map((t) => t.month))].sort().reverse();
  const month = sp.month && months.includes(sp.month) ? sp.month : months[0];
  const rows = sortRows(terms.filter((t) => t.month === month));
  const sum = monthSummary(rows);
  const targets = keywords.map((k) => k.term);
  const ctx = { name: business.name, city: business.city, serviceArea: business.serviceArea };

  const byKind: Record<Kind, number> = { branded: 0, local: 0, service: 0 };
  for (const r of rows) byKind[classify(r.phrase, ctx)]++;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{tr("Search insights")}</h1>
        <p className="text-sm text-muted">{tr("The phrases people actually searched, as reported by Google. These are kept separate from the target keywords you track under Keyword tracker.")}</p>
      </div>

      <TermsForm thisMonth={todayInMadrid().slice(0, 7)} />

      {rows.length === 0 || !month ? (
        <Card className="text-center">
          <p className="text-lg font-semibold">{tr("No data yet")}</p>
          <p className="mt-1 text-sm text-muted">{tr("Add a month of phrases above. Nothing is shown until you do.")}</p>
        </Card>
      ) : (
        <>
          <Card className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{month}</CardTitle>
              <StatusBadge tone="neutral">{SOURCE_LABEL[terms.find((t) => t.month === month)?.source ?? "manual"] ?? "entered by you"}</StatusBadge>
            </div>
            {months.length > 1 && (
              <nav aria-label={tr("Months")} className="flex flex-wrap gap-2">
                {months.map((m) => (
                  <a key={m} href={`?month=${m}`} aria-current={m === month ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center rounded-xl border px-3 text-sm ${m === month ? "border-accent text-accent" : "border-border"}`}>
                    {m}
                  </a>
                ))}
              </nav>
            )}
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div><dt className="text-xs text-muted">{tr("Phrases")}</dt><dd className="font-medium">{sum.phrases}</dd></div>
              <div><dt className="text-xs text-muted">{tr("Searches with exact counts")}</dt><dd className="font-medium">{fmt(sum.knownTotal)}</dd></div>
              <div><dt className="text-xs text-muted">{tr("Below Google’s threshold")}</dt><dd className="font-medium">{sum.below}</dd></div>
              <div><dt className="text-xs text-muted">{tr("No count entered")}</dt><dd className="font-medium">{sum.unknown}</dd></div>
            </dl>
            <p className="text-xs text-muted">{tr("The total adds only phrases with an exact count. Phrases shown as “&lt;15” are not added in as numbers, so the real total is higher than this figure.")}</p>
          </Card>

          <Card className="space-y-2">
            <CardTitle>{tr("Rough grouping (estimate)")}</CardTitle>
            <p className="text-sm">
              {tr(KIND_LABEL.branded)}: {byKind.branded} · {tr(KIND_LABEL.local)}: {byKind.local} · {tr(KIND_LABEL.service)}: {byKind.service}
            </p>
            <p className="text-xs text-muted">{tr("Estimate from a simple text rule using your saved business name, city and service area. It is not Google’s classification and does not tell you why someone searched.")}</p>
          </Card>

          <Card className="space-y-3">
            <CardTitle>{tr("Phrases")}</CardTitle>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-start text-sm">
                <thead className="text-xs text-muted">
                  <tr><th className="py-1 pe-3">{tr("Phrase")}</th><th className="pe-3">{tr("Count")}</th><th className="pe-3">{tr("Group (estimate)")}</th><th>{tr("Target keyword?")}</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="py-2 pe-3">{r.phrase}</td>
                      <td className="pe-3">{r.impressions !== null ? fmt(r.impressions) : r.belowThreshold ? "<15" : "—"}</td>
                      <td className="pe-3">{tr(KIND_LABEL[classify(r.phrase, ctx)])}</td>
                      <td>{matchesTarget(r.phrase, targets) ? "Same as a keyword you track" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted">{tr("“—” means no count was entered. “Count” is how many times Google reports the phrase led to your profile being shown, not rank.")}</p>
            <DeleteMonthButton month={month} />
          </Card>
        </>
      )}
    </div>
  );
}
