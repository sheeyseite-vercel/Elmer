import type { Locale } from "./dict";
import { AR } from "./ar";
import { AR2 } from "./ar2";

export type Vars = Record<string, string | number>;
export type Tr = (text: string, vars?: Vars) => string;

const fill = (s: string, v?: Vars) => (v ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m)) : s);

/**
 * tr("English text", { n: 3 }) returns the Arabic text for the same English sentence when the
 * language is Arabic, otherwise the English one. A sentence with no Arabic entry yet is shown in
 * English, so a missing translation never breaks a page. {name} marks a value filled in at run time.
 */
/** Messages built with numbers on the server, matched by shape. */
const PATTERNS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^Deleted (\d+) phrases\.$/, (m) => `تم حذف ${m[1]} عبارة.`],
  [/^Saved (\d+) phrases? for (\S+)\. Phrases already saved for this month were replaced; others were left as they were\.$/, (m) => `تم حفظ ${m[1]} عبارة لشهر ${m[2]}. استُبدلت العبارات المحفوظة سابقاً لهذا الشهر وبقيت الأخرى كما هي.`],
  [/^Daily limit of (\d+) analyses reached\. This protects your provider quota\. Try again tomorrow\.$/, (m) => `بلغت الحد اليومي (${m[1]} تحليلات). هذا يحمي حصة مزوّدك. حاول غداً.`],
  [/^Provider answered HTTP (\d+)\.$/, (m) => `أجاب المزوّد برمز HTTP ${m[1]}.`],
];

const translateAr = (text: string): string => {
  const hit = AR2[text] ?? AR[text];
  if (hit !== undefined) return hit;
  for (const [re, f] of PATTERNS) { const m = text.match(re); if (m) return f(m); }
  return text;
};

export const makeTr = (locale: Locale): Tr => (text, vars) => fill(locale === "ar" ? translateAr(text) : text, vars);
