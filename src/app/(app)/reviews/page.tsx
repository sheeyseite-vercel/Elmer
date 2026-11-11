import { redirect } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badges";
import { summarize, topicCounts } from "@/lib/analytics/reviews";
import { requireUser } from "@/lib/auth/session";
import { getBusinessForUser } from "@/lib/data/business";
import { todayInMadrid } from "@/lib/data/metrics";
import { listReviews } from "@/lib/data/reviews";
import { REPLY_STATUS } from "@/lib/schema/reviews";
import { ReviewForm } from "./review-form";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");
  const reviews = await listReviews(business.id);
  const today = todayInMadrid();
  const s = summarize(reviews);
  const topics = topicCounts(reviews);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Reviews</h1>
        <p className="text-sm text-muted">
          Track which reviews still need a reply and draft answers. Reviews are recorded by you; this app does not read
          your Google reviews and never posts a reply for you.
        </p>
      </div>

      <ReviewForm today={today} />

      {reviews.length === 0 ? (
        <Card className="text-center">
          <p className="text-lg font-semibold">No data yet</p>
          <p className="mt-1 text-sm text-muted">Record your first review above.</p>
        </Card>
      ) : (
        <>
          <Card className="space-y-3">
            <CardTitle>Summary of recorded reviews</CardTitle>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div><dt className="text-xs text-muted">Recorded here</dt><dd className="font-medium">{s.count}</dd></div>
              <div><dt className="text-xs text-muted">Average stars</dt><dd className="font-medium">{s.average}</dd></div>
              <div><dt className="text-xs text-muted">Awaiting reply</dt><dd className="font-medium">{s.awaitingReply}</dd></div>
              <div><dt className="text-xs text-muted">3 stars or fewer, awaiting</dt><dd className="font-medium">{s.lowAwaiting}</dd></div>
            </dl>
            <p className="text-sm">
              {[5, 4, 3, 2, 1].map((n) => `${n}★ ${s.dist[n] ?? 0}`).join(" · ")}
            </p>
            {topics.length > 0 && (
              <p className="text-sm">Your topics: {topics.map((t) => `${t.topic} (${t.count})`).join(", ")}</p>
            )}
            <p className="text-xs text-muted">
              These figures cover only the reviews you recorded here, so they can differ from the rating shown on Google.
              Topics are your own tags; no sentiment is inferred.
            </p>
          </Card>

          <div className="space-y-3">
            {reviews.map((r) => (
              <Card key={r.id} className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{r.reviewDate} · {r.rating}★</span>
                  <StatusBadge tone={r.replyStatus === "replied" || r.replyStatus === "no_reply_needed" ? "success" : "warning"}>
                    {REPLY_STATUS[r.replyStatus]}
                  </StatusBadge>
                </div>
                {r.excerpt && <p className="text-sm">“{r.excerpt}”</p>}
                <details>
                  <summary className="flex min-h-11 cursor-pointer items-center text-sm text-accent">Edit or reply</summary>
                  <div className="mt-2"><ReviewForm today={today} review={r} /></div>
                </details>
                <p className="text-xs text-muted">Source: entered by you</p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
