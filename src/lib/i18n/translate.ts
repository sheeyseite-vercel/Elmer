import type { Locale } from "./dict";
import { AR } from "./ar";

export type Vars = Record<string, string | number>;
export type Tr = (text: string, vars?: Vars) => string;

const fill = (s: string, v?: Vars) => (v ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m)) : s);

/**
 * tr("English text", { n: 3 }) returns the Arabic text for the same English sentence when the
 * language is Arabic, otherwise the English one. A sentence with no Arabic entry yet is shown in
 * English, so a missing translation never breaks a page. {name} marks a value filled in at run time.
 */
export const makeTr = (locale: Locale): Tr => (text, vars) => fill(locale === "ar" ? (AR[text] ?? text) : text, vars);
