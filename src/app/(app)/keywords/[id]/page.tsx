import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckList } from "@/components/rank/check-list";
import { Card, CardTitle } from "@/components/ui/card";
import { describeChanges } from "@/lib/analytics/rank";
import { requireUser } from "@/lib/auth/session";
import { getBusinessForUser } from "@/lib/data/business";
import { getKeyword, listChecks } from "@/lib/data/keywords";
import { SURFACES } from "@/lib/schema/keywords";
import { KeywordForm } from "../keyword-form";
import { StatusButtons } from "../status-buttons";

export const metadata = { title: "Keyword" };

const DEVICE = { mobile: "mobile", desktop: "desktop" } as const;

export default async function KeywordDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");

  const keyword = await getKeyword(business.id, id);
  if (!keyword) notFound();
  const checks = (await listChecks(business.id)).filter((c) => c.keywordId === id);
  const changes = describeChanges(checks);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Link href="/keywords" className="text-sm text-accent underline">← Keywords</Link>
        <h1 className="text-2xl font-semibold">{keyword.term}</h1>
        <p className="text-sm text-muted">
          {keyword.language === "es" ? "Español" : "English"} · {SURFACES[keyword.surface]}
          {keyword.targetArea ? ` · ${keyword.targetArea}` : ""} · Target keyword chosen by you
        </p>
        {keyword.notes && <p className="text-sm">{keyword.notes}</p>}
        <StatusButtons id={keyword.id} status={keyword.status} />
      </div>

      <Card className="space-y-3">
        <CardTitle>Changes between the latest two checks</CardTitle>
        {changes.length === 0 ? (
          <p className="text-sm text-muted">
            {checks.length === 0
              ? "No checks recorded yet."
              : "Not enough comparable checks. A comparison needs two checks with the same surface, device and location."}
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {changes.map((c) => (
              <li key={c.key} className="rounded-xl border border-border p-3">
                <p className="text-muted">
                  {SURFACES[c.surface as "maps" | "search"]} · {DEVICE[c.device as "mobile" | "desktop"]} · {c.location} · {c.checks} checks
                </p>
                <p>{c.text}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted">
          Two observations are not a trend. Results vary by location, device, language, time and personalisation.
        </p>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>History</CardTitle>
          <Link href={`/rank-checks?keyword=${keyword.id}`} className="inline-flex min-h-11 items-center text-sm text-accent underline">
            Record a check
          </Link>
        </div>
        <CheckList checks={checks} />
      </Card>

      <KeywordForm initial={keyword} />
    </div>
  );
}
