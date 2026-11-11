import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { LOCALES, LOCALE_NAME } from "@/lib/i18n/dict";
import { getT } from "@/lib/i18n/server";
import { deleteDemo, startDemo } from "./demo/actions";
import { setLanguage } from "./language-actions";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { t, locale } = await getT();
  const items = [
    { href: "/onboarding", title: t("settings.business"), text: t("settings.businessText") },
    { href: "/settings/ai-providers", title: t("settings.ai"), text: t("settings.aiText") },
  ];
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>

      <Card className="space-y-3">
        <CardTitle>{t("settings.lang")}</CardTitle>
        <p className="text-sm text-muted">{t("settings.langText")}</p>
        <form action={setLanguage} className="flex flex-wrap gap-2">
          {LOCALES.map((l) => (
            <Button key={l} type="submit" name="lang" value={l} variant={l === locale ? "primary" : "ghost"} aria-pressed={l === locale} lang={l}>
              {LOCALE_NAME[l]}
            </Button>
          ))}
        </form>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="block rounded-card focus-visible:outline-2">
            <Card className="h-full transition hover:bg-surface-2">
              <CardTitle>{i.title}</CardTitle>
              <p className="mt-1 text-sm text-muted">{i.text}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="space-y-3">
        <CardTitle>{t("demo.title")}</CardTitle>
        <p className="text-sm text-muted">{t("demo.text")}</p>
        <div className="flex flex-wrap gap-2">
          <form action={startDemo}><Button type="submit">{t("demo.start")}</Button></form>
          <form action={deleteDemo}><Button type="submit" variant="ghost">{t("demo.delete")}</Button></form>
        </div>
      </Card>
      <p className="text-xs text-muted">{t("settings.footer")}</p>
    </div>
  );
}
