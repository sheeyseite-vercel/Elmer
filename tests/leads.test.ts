import { describe, expect, it } from "vitest";
import { conversion, overlaps, totals, type LeadEntry } from "../src/lib/analytics/leads";
import { leadInput } from "../src/lib/schema/leads";

const e = (id: string, over: Partial<LeadEntry> = {}): LeadEntry => ({
  id, periodStart: "2026-10-01", periodEnd: "2026-10-31", source: "phone", ...over,
});

describe("overlaps", () => {
  it("detects shared days, including a single shared day", () => {
    expect(overlaps(e("1"), { periodStart: "2026-10-31", periodEnd: "2026-11-15" })).toBe(true);
    expect(overlaps(e("1"), { periodStart: "2026-11-01", periodEnd: "2026-11-30" })).toBe(false);
  });
});

describe("conversion", () => {
  it("uses only entries where both numbers were recorded", () => {
    const c = conversion([e("1", { inquiries: 10, bookings: 4 }), e("2", { inquiries: 50 }), e("3", { bookings: 9 })]);
    expect(c.rate).toBe(40);
    expect(c.entriesUsed).toBe(1);
  });
  it("is null, not zero, when it cannot be defined", () => {
    expect(conversion([e("1", { calls: 5 })]).rate).toBeNull();
    expect(conversion([e("1", { inquiries: 0, bookings: 0 })]).rate).toBeNull();
  });
});

describe("totals", () => {
  it("keeps never-recorded fields as null instead of 0", () => {
    const t = totals([e("1", { calls: 3 }), e("2", { calls: 4, bookings: 1 })]);
    expect(t.calls).toBe(7);
    expect(t.bookings).toBe(1);
    expect(t.inquiries).toBeNull();
  });
});

describe("leadInput", () => {
  const base = { periodStart: "2026-10-01", periodEnd: "2026-10-31", source: "phone", calls: "12" };
  it("accepts aggregate counts", () => expect(leadInput.safeParse(base).success).toBe(true));
  it("needs at least one count", () => expect(leadInput.safeParse({ ...base, calls: undefined }).success).toBe(false));
  it("rejects an end before the start", () => expect(leadInput.safeParse({ ...base, periodEnd: "2026-09-01" }).success).toBe(false));
  it("rejects more bookings than inquiries", () => expect(leadInput.safeParse({ ...base, inquiries: "3", bookings: "5" }).success).toBe(false));
  it("rejects an unknown source and negative counts", () => {
    expect(leadInput.safeParse({ ...base, source: "tiktok" }).success).toBe(false);
    expect(leadInput.safeParse({ ...base, calls: "-1" }).success).toBe(false);
  });
});
