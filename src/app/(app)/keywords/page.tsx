import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badges";
import { positionText } from "@/lib/analytics/rank";
import { requireUser } from "@/lib/auth/session";
import { getBusinessForUser } from "@/lib/data/business";
import { listChecks, listKeywords, type KeywordStatus } from "@/lib/data/keywords";
import { SURFACES } from "@/lib/schema/keywords";
import { formatMadrid } from "@/lib/time";
import { cn } from "@/lib/utils";
import { KeywordForm } from "./keyword-form";
import { StatusButtons } from "./status-buttons";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Keywords" };

type SP = Promise<Record<string, string | string[] | undefined>>;
const FILTERS: { value: KeywordStatus | "all"; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
];

export default async function KeywordsPage({ searchParams }: { searchParams: SP }) {
  const { tr } = await getT();
  const sp = await searchParams;
  const raw = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  const filter = FILTERS.find((f) => f.value === raw)?.value ?? "active";

  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");
  const [keywords, checks] = await Promise.all([listKeywords(business.id), listChecks(business.id)]);
  const shown = keywords.filter((k) => filter === "all" || k.status === filter);

  const byKeyword = new Map<string, typeof checks>();
  for (const c of checks) byKeyword.set(c.keywordId, [...(byKeyword.get(c.keywordId) ?? []), c]);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{tr("Keyword tracker")}</h1>
        <p className="text-sm text-muted">
          These are <strong>{tr("target keywords you chose")}</strong>{tr(". They are not search phrases reported by Google; those appear on Search insights only when they come from an authorised report. One rank change does not establish a lasting trend.")}</p>
      </div>

      <details className="rounded-card" open={keywords.length === 0}>
        <summary className="flex min-h-11 cursor-pointer items-center rounded-xl border border-border bg-surface px-4 text-sm font-medium">{tr("Add a keyword")}</summary>
        <div className="mt-3">
          <KeywordForm />
        </div>
      </details>

      <nav aria-label={tr("Status filter")} className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/keywords?status=${f.value}`}
            aria-current={filter === f.value ? "true" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-medium",
              filter === f.value ? "border-primary bg-surface-2" : "border-border text-muted hover:text-text",
            )}
          >
            {tr(f.label)}
          </Link>
        ))}
      </nav>

      {shown.length === 0 ? (
        <Card className="text-center">
          <p className="text-lg font-semibold">{tr("No data yet")}</p>
          <p className="mt-1 text-sm text-muted">
            {keywords.length === 0 ? tr("Add your first target keyword above, for example “osteópata”.") : tr("No keywords with this status.")}
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {shown.map((k) => {
            const list = byKeyword.get(k.id) ?? [];
            const last = list[0];
            return (
              <li key={k.id}>
                <Card className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/keywords/${k.id}`} className="text-base font-semibold text-accent underline">{k.term}</Link>
                    <StatusBadge tone={k.status === "active" ? "success" : k.status === "paused" ? "warning" : "neutral"}>{tr(k.status === "active" ? "Active" : k.status === "paused" ? "Paused" : "Archived")}</StatusBadge>
                  </div>
                  <p className="text-sm text-muted">
                    {k.language === "es" ? "Español" : "English"} · {tr(SURFACES[k.surface])}
                    {k.targetArea ? ` · ${k.targetArea}` : ""}
                    {k.group ? ` · ${tr("Group:")} ${k.group}` : ""}
                    {k.tags.length ? ` · ${k.tags.join(", ")}` : ""}
                  </p>
                  <p className="text-sm text-muted">
                    {last
                      ? `${tr("{n} checks", { n: list.length })} · ${tr("latest")} ${formatMadrid(last.checkedAt)}: ${positionText(last.position, last.depth, tr)}`
                      : tr("No checks recorded yet.")}
                  </p>
                  <StatusButtons id={k.id} status={k.status} />
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
