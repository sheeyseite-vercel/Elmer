import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badges";
import { appearances, isStale } from "@/lib/analytics/competitors";
import { requireUser } from "@/lib/auth/session";
import { getBusinessForUser } from "@/lib/data/business";
import { listCompetitors, listSnapshots } from "@/lib/data/competitors";
import { listChecks } from "@/lib/data/keywords";
import { todayInMadrid } from "@/lib/data/metrics";
import { CompetitorForm } from "./competitor-form";

export const metadata = { title: "Competitors" };

export default async function CompetitorsPage() {
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");

  const [competitors, snapshots, checks] = await Promise.all([
    listCompetitors(business.id),
    listSnapshots(business.id),
    listChecks(business.id),
  ]);
  const today = todayInMadrid();
  const active = competitors.filter((c) => c.status === "active");
  const archived = competitors.filter((c) => c.status === "archived");
  const latest = new Map<string, (typeof snapshots)[number]>();
  for (const s of snapshots) if (!latest.has(s.competitorId)) latest.set(s.competitorId, s); // list is newest-first

  const tracked = competitors.filter((c) => c.kind === "competitor" && c.status === "active");
  const seen = appearances(
    checks.map((c) => ({
      id: c.id, keyword: c.keyword, checkedAt: c.checkedAt, locationLabel: c.locationLabel, surface: c.surface,
      position: c.position, competitors: c.competitors,
    })),
    tracked.map((c) => ({ id: c.id, name: c.name })),
  );

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Competitor analysis</h1>
        <p className="text-sm text-muted">
          Only public, verifiable information that you enter, each snapshot dated and sourced. Competitors&apos; private
          analytics are not available. A rating or review count alone does not determine ranking, and this page makes no
          judgement about the quality of anyone&apos;s care.
        </p>
      </div>

      <details open={competitors.length === 0}>
        <summary className="flex min-h-11 cursor-pointer items-center rounded-xl border border-border bg-surface px-4 text-sm font-medium">
          Add a business
        </summary>
        <div className="mt-3">
          <CompetitorForm allowOwn={!competitors.some((c) => c.kind === "own")} />
        </div>
      </details>

      {active.length === 0 ? (
        <Card className="text-center">
          <p className="text-lg font-semibold">No data yet</p>
          <p className="mt-1 text-sm text-muted">Add a nearby business and record what its public listing shows.</p>
        </Card>
      ) : (
        <Card className="space-y-3">
          <CardTitle>Latest public snapshots</CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-start text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="py-1 pe-3">Business</th><th className="pe-3">Rating</th><th className="pe-3">Reviews</th>
                  <th className="pe-3">Categories</th><th className="pe-3">Checked</th><th>Source</th>
                </tr>
              </thead>
              <tbody>
                {active.map((c) => {
                  const s = latest.get(c.id);
                  return (
                    <tr key={c.id} className="border-t border-border align-top">
                      <td className="py-2 pe-3">
                        <Link href={`/competitors/${c.id}`} className="font-medium text-accent underline">{c.name}</Link>
                        {c.kind === "own" && <span className="ms-2"><StatusBadge tone="success">Your listing</StatusBadge></span>}
                      </td>
                      {s ? (
                        <>
                          <td className="pe-3">{s.rating ?? "—"}</td>
                          <td className="pe-3">{s.reviewCount ?? "—"}</td>
                          <td className="pe-3">{s.categories.length ? s.categories.join(", ") : "—"}</td>
                          <td className="pe-3">
                            {s.checkedOn}
                            {isStale(s.checkedOn, today) && <span className="ms-2"><StatusBadge tone="warning">Stale</StatusBadge></span>}
                          </td>
                          <td>
                            {s.sourceUrl ? (
                              <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline">link</a>
                            ) : (
                              s.sourceNote
                            )}
                          </td>
                        </>
                      ) : (
                        <td colSpan={5} className="py-2 text-muted">No data yet. Open the business to record a snapshot.</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted">
            “—” means not recorded, not zero. Snapshots older than 30 days are marked stale because public listings change.
          </p>
        </Card>
      )}

      <Card className="space-y-3">
        <CardTitle>Seen in your rank checks while your clinic was not</CardTitle>
        {seen.length === 0 ? (
          <p className="text-sm text-muted">
            {checks.length === 0
              ? "No rank checks recorded yet."
              : "No tracked competitor was recorded in a check where your clinic was not found."}
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {seen.map((a) => (
              <li key={a.competitorId} className="rounded-xl border border-border p-3">
                <p className="font-medium">{a.name}</p>
                <p>
                  Recorded in {a.checksWhereElmerMissing} check{a.checksWhereElmerMissing === 1 ? "" : "s"} where your clinic was not found
                  ({a.firstDate === a.lastDate ? a.firstDate : `${a.firstDate} to ${a.lastDate}`}).
                </p>
                <p className="text-muted">Keywords: {a.keywords.join(", ")} · Places: {a.places.join(", ")}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted">
          Based only on the competitor names you typed into rank checks, matched by name, so spelling variants can be
          missed. This describes your recorded checks, not what every searcher sees.
        </p>
      </Card>

      {archived.length > 0 && (
        <Card className="space-y-2">
          <CardTitle>Archived</CardTitle>
          <ul className="text-sm">
            {archived.map((c) => (
              <li key={c.id}><Link href={`/competitors/${c.id}`} className="inline-flex min-h-11 items-center text-accent underline">{c.name}</Link></li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
