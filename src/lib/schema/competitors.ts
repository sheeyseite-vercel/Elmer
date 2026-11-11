import { z } from "zod";
import { parseDate } from "@/lib/csv/parse";

const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\/.+/i.test(v), "Must start with http:// or https://")
  .optional()
  .default("");

const list = (max: number) =>
  z
    .string()
    .trim()
    .max(600)
    .optional()
    .default("")
    .transform((s) => s.split(/[,;\n]/).map((t) => t.trim().slice(0, 60)).filter(Boolean).slice(0, max));

/** Public information only. Never private analytics, and no medical-quality judgements. */
export const competitorInput = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Enter the public business name").max(100),
  profileUrl: httpsUrl,
  location: z.string().trim().max(160).optional().default(""),
  notes: z.string().trim().max(500).optional().default(""),
  own: z.literal("own").optional(), // "This is my own listing"
});

export const snapshotInput = z
  .object({
    competitorId: z.string().min(1),
    checkedOn: z.string().refine((d) => parseDate(d, "ymd") !== null, "Enter a valid date"),
    rating: z.coerce.number().min(0, "0 to 5").max(5, "0 to 5").optional(),
    reviewCount: z.coerce.number().int("Whole number").min(0).max(1_000_000).optional(),
    categories: list(15),
    services: list(25),
    sourceUrl: httpsUrl,
    sourceNote: z.string().trim().max(200).optional().default(""),
  })
  .superRefine((v, ctx) => {
    const hasData = v.rating !== undefined || v.reviewCount !== undefined || v.categories.length > 0 || v.services.length > 0;
    if (!hasData) ctx.addIssue({ code: "custom", path: ["rating"], message: "Enter at least one public detail (rating, reviews, categories or services)" });
    if (!v.sourceUrl && !v.sourceNote) ctx.addIssue({ code: "custom", path: ["sourceUrl"], message: "Add a source link or a note saying where you saw it" });
  });

export const normalizeName = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
