"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, LOCALES } from "@/lib/i18n/dict";

export async function setLanguage(formData: FormData): Promise<void> {
  const v = String(formData.get("lang"));
  if (!(LOCALES as readonly string[]).includes(v)) return;
  (await cookies()).set(LOCALE_COOKIE, v, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  revalidatePath("/", "layout");
}
