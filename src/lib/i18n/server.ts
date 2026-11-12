import "server-only";
import { cookies } from "next/headers";
import { makeTr } from "./translate";
import { DICTS, LOCALE_COOKIE, LOCALES, type Key, type Locale } from "./dict";

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  return (LOCALES as readonly string[]).includes(v ?? "") ? (v as Locale) : "en";
}

export async function getT() {
  const locale = await getLocale();
  const d = DICTS[locale];
  return { locale, t: (k: Key) => d[k], tr: makeTr(locale) };
}
