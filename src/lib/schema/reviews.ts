import { z } from "zod";
import { parseDate } from "@/lib/csv/parse";

export const REPLY_STATUS = {
  needs_reply: "Needs reply",
  drafted: "Reply drafted",
  replied: "Replied on Google",
  no_reply_needed: "No reply needed",
} as const;
export type ReplyStatus = keyof typeof REPLY_STATUS;

/**
 * A public review as the owner chooses to record it. No reviewer name or profile link is stored, and
 * the excerpt is capped so this never becomes a copy of Google's data. No patient or health data.
 */
export const reviewInput = z.object({
  id: z.string().optional(),
  reviewDate: z.string().refine((d) => parseDate(d, "ymd") !== null, "Enter a valid date"),
  rating: z.coerce.number().int().min(1, "Choose 1 to 5").max(5, "Choose 1 to 5"),
  excerpt: z.string().trim().max(300, "At most 300 characters").optional().default(""),
  topics: z
    .string()
    .trim()
    .max(200)
    .optional()
    .default("")
    .transform((s) => s.split(",").map((t) => t.trim().slice(0, 30)).filter(Boolean).slice(0, 6)),
  replyStatus: z.enum(["needs_reply", "drafted", "replied", "no_reply_needed"]),
  replyDraft: z.string().trim().max(1000, "At most 1000 characters").optional().default(""),
});
