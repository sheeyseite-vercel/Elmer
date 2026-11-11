/**
 * UI text. English is the source of truth; every other language must provide every key
 * (the type below makes the build fail if one is missing). Business data is never translated.
 */
export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_COOKIE = "elmer_lang";
export const DIR: Record<Locale, "ltr" | "rtl"> = { en: "ltr", ar: "rtl" };
export const LOCALE_NAME: Record<Locale, string> = { en: "English", ar: "العربية" };

const en = {
  "app.skip": "Skip to content",
  "app.tagline": "Business Intelligence",
  "nav.main": "Main",
  "nav.more": "More",
  "nav.moreNav": "More navigation",
  "nav.close": "Close menu",
  "nav.dashboard": "Dashboard",
  "nav.data": "Data",
  "nav.searchInsights": "Search insights",
  "nav.keywords": "Keywords",
  "nav.geo": "Geo visibility",
  "nav.rankChecks": "Rank checks",
  "nav.competitors": "Competitors",
  "nav.reviews": "Reviews",
  "nav.checklist": "Profile checklist",
  "nav.leads": "Leads & outcomes",
  "nav.ai": "AI analyst",
  "nav.reports": "Reports",
  "nav.integrations": "Integrations",
  "nav.settings": "Settings",
  "auth.signOut": "Sign out",
  "demo.banner": "DEMO MODE: every number here is invented. Your real data is untouched.",
  "demo.exit": "Exit demo",
  "demo.title": "Demo mode",
  "demo.text":
    "Explore every page with INVENTED data in a separate, clearly marked business. Your real data is not touched or mixed in, and a banner shows on every page while demo mode is on. Starting it again resets the demo data.",
  "demo.start": "Start demo",
  "demo.delete": "Delete demo data",
  "settings.title": "Settings",
  "settings.business": "Business details",
  "settings.businessText": "Name, city, address, language, website and booking link.",
  "settings.ai": "AI providers",
  "settings.aiText": "Gemini, Groq, OpenRouter or a custom provider, and which one is active.",
  "settings.lang": "Interface language",
  "settings.langText": "Changes the language of menus and labels. Your data, keywords and business names are never translated.",
  "settings.footer": "Audit log, data export and deletion controls are planned for Phase 2.",
} as const;

export type Key = keyof typeof en;

const ar: Record<Key, string> = {
  "app.skip": "انتقل إلى المحتوى",
  "app.tagline": "ذكاء الأعمال",
  "nav.main": "التنقل الرئيسي",
  "nav.more": "المزيد",
  "nav.moreNav": "المزيد من الصفحات",
  "nav.close": "إغلاق القائمة",
  "nav.dashboard": "لوحة المعلومات",
  "nav.data": "البيانات",
  "nav.searchInsights": "عبارات البحث",
  "nav.keywords": "الكلمات المفتاحية",
  "nav.geo": "الظهور الجغرافي",
  "nav.rankChecks": "فحوصات الترتيب",
  "nav.competitors": "المنافسون",
  "nav.reviews": "التقييمات",
  "nav.checklist": "قائمة الملف التجاري",
  "nav.leads": "العملاء والنتائج",
  "nav.ai": "المحلل الذكي",
  "nav.reports": "التقارير",
  "nav.integrations": "التكاملات",
  "nav.settings": "الإعدادات",
  "auth.signOut": "تسجيل الخروج",
  "demo.banner": "وضع التجربة: كل الأرقام هنا مخترعة. بياناتك الحقيقية لم تُمسّ.",
  "demo.exit": "الخروج من التجربة",
  "demo.title": "وضع التجربة",
  "demo.text":
    "تصفّح كل الصفحات ببيانات مخترعة في نشاط تجاري منفصل وموسوم بوضوح. بياناتك الحقيقية لا تُلمس ولا تختلط بها، ويظهر شريط في كل صفحة طوال وضع التجربة. تشغيله مرة أخرى يعيد بيانات التجربة إلى حالتها الأولى.",
  "demo.start": "ابدأ التجربة",
  "demo.delete": "احذف بيانات التجربة",
  "settings.title": "الإعدادات",
  "settings.business": "بيانات النشاط",
  "settings.businessText": "الاسم والمدينة والعنوان واللغة والموقع ورابط الحجز.",
  "settings.ai": "مزوّدو الذكاء الاصطناعي",
  "settings.aiText": "Gemini أو Groq أو OpenRouter أو مزوّد مخصص، وتحديد المزوّد النشط.",
  "settings.lang": "لغة الواجهة",
  "settings.langText": "تغيّر لغة القوائم والعناوين. بياناتك وكلماتك المفتاحية وأسماء الأنشطة لا تُترجم أبداً.",
  "settings.footer": "سجل التدقيق وتصدير البيانات وحذفها مخطط لها في المرحلة 2.",
};

export const DICTS: Record<Locale, Record<Key, string>> = { en, ar };
