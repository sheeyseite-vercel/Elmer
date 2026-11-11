import { z } from "zod";
import { parseDate } from "@/lib/csv/parse";

export const SOURCES = {
  phone: "Phone",
  website: "Website",
  google_maps: "Google Maps",
  referral: "Referral",
  unknown: "Unknown",
} as const;
export type SourceKey = keyof typeof SOURCES;
export const SOURCE_KEYS = Object.keys(SOURCES) as [SourceKey, ...SourceKey[]];

const date = z.string().refine((d) => parseDate(d, "ymd") !== null, "Enter a valid date");
const count = z.coerce.number().int("Whole number").min(0, "Cannot be negative").max(1_000_000).optional();

/** Aggregate counts only. There is deliberately no field for names, appointment details or health information. */
export const leadInput = z
  .object({
    periodStart: date,
    periodEnd: date,
    source: z.enum(SOURCE_KEYS),
    calls: count,
    inquiries: count,
    bookings: count,
  })
  .superRefine((v, ctx) => {
    if (v.periodStart > v.periodEnd) ctx.addIssue({ code: "custom", path: ["periodEnd"], message: "The end date is before the start date" });
    const days = (Date.parse(`${v.periodEnd}T00:00:00Z`) - Date.parse(`${v.periodStart}T00:00:00Z`)) / 86_400_000 + 1;
    if (days > 366) ctx.addIssue({ code: "custom", path: ["periodEnd"], message: "A period can cover at most 366 days" });
    if (v.calls === undefined && v.inquiries === undefined && v.bookings === undefined)
      ctx.addIssue({ code: "custom", path: ["calls"], message: "Enter at least one count" });
    if (v.inquiries !== undefined && v.bookings !== undefined && v.bookings > v.inquiries)
      ctx.addIssue({ code: "custom", path: ["bookings"], message: "Bookings cannot exceed inquiries. If you count them separately, leave inquiries empty." });
  });
