import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatusBadge } from "@/components/ui/badges";
import { Card, CardTitle } from "@/components/ui/card";
import { isStale } from "@/lib/analytics/competitors";
import { requireUser } from "@/lib/auth/session";
import { getBusinessForUser } from "@/lib/data/business";
import { listCompetitors, listSnapshots } from "@/lib/data/competitors";
import { todayInMadrid } from "@/lib/data/metrics";
import { ArchiveButton, DeleteSnapshotButton } from "../buttons";
import { CompetitorForm } from "../competitor-form";
import { SnapshotForm } from "../snapshot-form";

export const metadata = { title: "Business" };

export default async function CompetitorDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");

  const competitor = (await listCompetitors(business.id)).find((c) => c.id === id);
  if (!competitor) notFound();
  const snapshots = (await listSnapshots(business.id)).filter((s) => s.competitorId === id);
  const today = todayInMadrid();

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Link href="/competitors" className="text-sm text-accent underline">← Competitors</Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{competitor.name}</h1>
          {competitor.kind === "own" && <StatusBadge tone="success">Your listing</StatusBadge>}
          {competitor.status === "archived" && <StatusBadge>Archived</StatusBadge>}
        </div>
        <p className="text-sm text-muted">
          {competitor.location || "No location recorded"}
          {competitor.profileUrl && (
            <>
              {" · "}
              <a href={competitor.profileUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline">public profile</a>
            </>
          )}
        </p>
        {competitor.notes && <p className="text-sm">{competitor.notes}</p>}
        <ArchiveButton id={competitor.id} status={competitor.status} />
      </div>

      <SnapshotForm competitorId={competitor.id} today={today} />

      <Card className="space-y-3">
        <CardTitle>Snapshot history</CardTitle>
        {snapshots.length === 0 ? (
          <p className="text-sm text-muted">No data yet.</p>
        ) : (
          <ul className="space-y-2">
            {snapshots.map((s) => (
              <li key={s.id} className="space-y-1 rounded-xl border border-border p-3 text-sm">
                <p className="font-medium">
                  {s.checkedOn}
                  {isStale(s.checkedOn, today) && <span className="ml-2"><StatusBadge tone="warning">Stale</StatusBadge></span>}
                </p>
                <p>Rating: {s.rating ?? "not recorded"} · Reviews: {s.reviewCount ?? "not recorded"}</p>
                {s.categories.length > 0 && <p className="text-muted">Categories: {s.categories.join(", ")}</p>}
                {s.services.length > 0 && <p className="text-muted">Services: {s.services.join(", ")}</p>}
                <p className="text-muted">
                  Source:{" "}
                  {s.sourceUrl ? (
                    <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline">link</a>
                  ) : null}
                  {s.sourceUrl && s.sourceNote ? " · " : ""}
                  {s.sourceNote}
                </p>
                <DeleteSnapshotButton id={s.id} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <CompetitorForm initial={competitor} />
    </div>
  );
}
