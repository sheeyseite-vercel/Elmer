import { describe, expect, it } from "vitest";
import { replyPrivacyWarning, summarize, topicCounts, type ReviewEntry } from "../src/lib/analytics/reviews";
import { reviewInput } from "../src/lib/schema/reviews";

const r = (id: string, rating: number, over: Partial<ReviewEntry> = {}): ReviewEntry => ({
  id, reviewDate: "2026-10-01", rating, excerpt: "", topics: [], replyStatus: "needs_reply", replyDraft: "", ...over,
});

describe("summarize", () => {
  it("is null, not zero, with no reviews", () => {
    expect(summarize([]).average).toBeNull();
  });
  it("averages recorded ratings and counts open replies", () => {
    const s = summarize([r("1", 5, { replyStatus: "replied" }), r("2", 2), r("3", 4, { replyStatus: "drafted" })]);
    expect(s.count).toBe(3);
    expect(s.average).toBe(3.7);
    expect(s.awaitingReply).toBe(2);
    expect(s.lowAwaiting).toBe(1);
  });
});

describe("topicCounts", () => {
  it("counts case-insensitively", () => {
    expect(topicCounts([r("1", 5, { topics: ["Wait time"] }), r("2", 4, { topics: ["wait time", "price"] })])[0]).toEqual({ topic: "wait time", count: 2 });
  });
});

describe("replyPrivacyWarning", () => {
  it("flags talk about the reviewer's care", () => {
    expect(replyPrivacyWarning("Glad your treatment went well")).toBeTruthy();
    expect(replyPrivacyWarning("Thank you for your kind words")).toBeNull();
  });
});

describe("reviewInput", () => {
  const ok = { reviewDate: "2026-10-01", rating: "5", replyStatus: "needs_reply" };
  it("accepts a minimal review", () => expect(reviewInput.safeParse(ok).success).toBe(true));
  it("rejects bad rating, date and long excerpt", () => {
    expect(reviewInput.safeParse({ ...ok, rating: "6" }).success).toBe(false);
    expect(reviewInput.safeParse({ ...ok, reviewDate: "2026-13-01" }).success).toBe(false);
    expect(reviewInput.safeParse({ ...ok, excerpt: "x".repeat(301) }).success).toBe(false);
  });
});
