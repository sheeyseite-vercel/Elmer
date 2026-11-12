import Link from "next/link";
import { StatusBadge } from "@/components/ui/badges";
import { positionText } from "@/lib/analytics/rank";
import type { CheckView } from "@/lib/data/keywords";
import { DEVICES, SURFACES } from "@/lib/schema/keywords";
import { formatMadrid } from "@/lib/time";
import { DeleteCheckButton } from "@/app/(app)/rank-checks/delete-check-button";
import { getT } from "@/lib/i18n/server";

export async function CheckList({ checks, showKeyword }: { checks: CheckView[]; showKeyword?: boolean }) {
  const { tr } = await getT();
  if (checks.length === 0) return <p className="text-sm text-muted">{tr("No rank checks recorded yet.")}</p>;
  return (
    <ul className="space-y-3">
      {checks.map((c) => (
        <li key={c.id} className="space-y-1 rounded-xl border border-border p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            {showKeyword && (
              <Link href={`/keywords/${c.keywordId}`} className="font-medium text-accent underline">{c.keyword}</Link>
            )}
            <StatusBadge tone={c.position === null ? "warning" : "success"}>{positionText(c.position, c.depth, tr)}</StatusBadge>
          </div>
          <p className="text-muted">
            {formatMadrid(c.checkedAt)} · {tr(SURFACES[c.surface])} · {tr(DEVICES[c.device])} · {c.locationLabel}
          </p>
          {c.competitors.length > 0 && (
            <p className="text-muted">
              {tr("Competitors seen:")} {c.competitors.map((x) => (x.position ? `${x.name} (#${x.position})` : x.name)).join(", ")}
            </p>
          )}
          <p className="text-muted">
            {tr("Source: manually recorded")} · {tr("Method:")} {c.methodology}
            {c.referenceUrl && (
              <>
                {" · "}
                <a href={c.referenceUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline">{tr("reference")}</a>
              </>
            )}
          </p>
          <DeleteCheckButton id={c.id} />
        </li>
      ))}
    </ul>
  );
}
