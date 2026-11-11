export type ReviewEntry = {
  id: string;
  reviewDate: string;
  rating: number;
  excerpt: string;
  topics: string[];
  replyStatus: "needs_reply" | "drafted" | "replied" | "no_reply_needed";
  replyDraft: string;
};

/** Figures describe only the reviews the owner recorded here, not Google's overall rating. */
export function summarize(list: ReviewEntry[]) {
  const n = list.length;
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of list) {
    dist[r.rating] = (dist[r.rating] ?? 0) + 1;
    sum += r.rating;
  }
  const open = list.filter((r) => r.replyStatus === "needs_reply" || r.replyStatus === "drafted");
  return {
    count: n,
    average: n === 0 ? null : Math.round((sum / n) * 10) / 10,
    dist,
    awaitingReply: open.length,
    lowAwaiting: open.filter((r) => r.rating <= 3).length,
  };
}

/** Most frequent owner-assigned topics. Counts only; no sentiment is inferred. */
export function topicCounts(list: ReviewEntry[], limit = 8) {
  const m = new Map<string, number>();
  for (const r of list) for (const t of r.topics) {
    const k = t.toLowerCase();
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([topic, count]) => ({ topic, count }));
}

/** Replies must not confirm that someone is a patient or discuss their care. Returns a warning, never edits text. */
export function replyPrivacyWarning(text: string): string | null {
  return /\b(your (treatment|diagnosis|condition|appointment|visit|session)|as your (osteopath|therapist|doctor)|tu (tratamiento|diagnóstico|cita|sesión|lesión))\b/i.test(text)
    ? "This reply seems to refer to the reviewer's care or visit. Avoid confirming that someone is a patient or discussing their treatment in a public reply."
    : null;
}
