"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/field";
import { replyPrivacyWarning, type ReviewEntry } from "@/lib/analytics/reviews";
import { REPLY_STATUS } from "@/lib/schema/reviews";
import { deleteReview, saveReview, type ReviewState } from "./actions";
import { useTr } from "@/lib/i18n/client";

const area = "w-full rounded-xl border border-border bg-surface-2 p-3 text-base text-text";

export function ReviewForm({ today, review }: { today: string; review?: ReviewEntry }) {
  const tr = useTr();
  const [state, action, pending] = useActionState<ReviewState, FormData>(saveReview, {});
  const [draft, setDraft] = useState(review?.replyDraft ?? "");
  const [deleting, setDeleting] = useState(false);
  const e = state.errors ?? {};
  const warn = replyPrivacyWarning(draft);
  const k = review?.id ?? "new";
  const body = (
    <div className="space-y-4">
      {review && <input type="hidden" name="id" value={review.id} />}
      <div className="grid grid-cols-2 gap-3">
        <TextField label={tr("Review date")} name="reviewDate" id={`reviewDate-${k}`} type="date" max={today} defaultValue={review?.reviewDate ?? today} required error={e.reviewDate} />
        <SelectField label={tr("Stars")} name="rating" id={`rating-${k}`} defaultValue={String(review?.rating ?? 5)} error={e.rating}
          options={[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n}` }))} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`excerpt-${k}`} className="text-sm font-medium">{tr("Short excerpt (optional)")}</label>
        <textarea id={`excerpt-${k}`} name="excerpt" rows={2} maxLength={300} defaultValue={review?.excerpt} className={area} />
        <p className="text-xs text-muted">{tr("Up to 300 characters. No reviewer name and no health details.")}</p>
        {e.excerpt && <p role="alert" className="text-xs text-danger">{e.excerpt.join(" ")}</p>}
      </div>
      <TextField label={tr("Topics (optional, comma separated)")} name="topics" id={`topics-${k}`} maxLength={200} defaultValue={review?.topics.join(", ")} hint={tr("Your own tags, e.g. wait time, price, friendliness.")} error={e.topics} />
      <SelectField label={tr("Reply status")} name="replyStatus" id={`status-${k}`} defaultValue={review?.replyStatus ?? "needs_reply"}
        options={Object.entries(REPLY_STATUS).map(([value, label]) => ({ value, label }))} error={e.replyStatus} />
      <div className="space-y-1.5">
        <label htmlFor={`draft-${k}`} className="text-sm font-medium">{tr("Reply draft (optional)")}</label>
        <textarea id={`draft-${k}`} name="replyDraft" rows={4} maxLength={1000} value={draft} onChange={(ev) => setDraft(ev.target.value)} className={area} />
        <p className="text-xs text-muted">{tr("A draft is only stored here. Nothing is ever posted to Google for you: copy it and publish it yourself.")}</p>
        {warn && <p role="status" className="text-xs text-warning">{warn}</p>}
        {e.replyDraft && <p role="alert" className="text-xs text-danger">{e.replyDraft.join(" ")}</p>}
      </div>
      {state.message && (
        <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-success" : "text-sm text-danger"}>{tr(state.message)}</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={pending}>{pending ? "Saving…" : review ? "Save changes" : "Record review"}</Button>
        {review && (
          <Button type="button" variant="ghost" className="min-h-11 px-3 text-danger" disabled={deleting}
            onClick={async () => { if (window.confirm(tr("Delete this review record?"))) { setDeleting(true); await deleteReview(review.id); } }}>{tr("Delete")}</Button>
        )}
      </div>
    </div>
  );
  if (review) return <form action={action}>{body}</form>;
  return (
    <form action={action}>
      <Card className="space-y-4">
        <div className="space-y-1">
          <CardTitle>{tr("Record a review")}</CardTitle>
          <p className="text-sm text-muted">{tr("Add reviews you can see on your Google profile so you can track replies. Only what you type is stored.")}</p>
        </div>
        {body}
      </Card>
    </form>
  );
}
