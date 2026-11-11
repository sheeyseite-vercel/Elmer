import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\/.+/i.test(v), "Must start with http:// or https://")
  .optional()
  .default("");

/**
 * Business profile as confirmed by the owner during onboarding.
 * Nothing here is pre-filled or assumed: address, city, phone, URLs are all
 * owner-provided. No patient or health data fields exist by design.
 */
export const businessProfileInput = z.object({
  name: z.string().trim().min(2, "Enter the business name").max(120),
  city: z.string().trim().min(2, "Enter the city or area").max(120),
  address: z.string().trim().max(240).optional().default(""),
  serviceArea: z.string().trim().max(240).optional().default(""),
  primaryLanguage: z.enum(["en", "es"]),
  phone: z.string().trim().max(40).optional().default(""),
  website: optionalUrl,
  bookingUrl: optionalUrl,
  profileUrl: optionalUrl,
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  reportingCadence: z.enum(["weekly", "monthly", "both"]).default("weekly"),
});

export type BusinessProfileInput = z.infer<typeof businessProfileInput>;

export type BusinessProfile = BusinessProfileInput & {
  id: string;
  ownerUid: string;
  memberUids: string[];
  isDemo?: boolean;
  timezone: "Europe/Madrid";
  currency: "EUR";
  createdAt: string;
  updatedAt: string;
};
