import { NAV } from "@/lib/nav";
import { getT } from "@/lib/i18n/server";
import { BottomNav, Sidebar, type NavLabels } from "./nav-links";
import { SignOutButton } from "./sign-out-button";

export async function AppShell({ businessName, children }: { businessName: string; children: React.ReactNode }) {
  const { t } = await getT();
  const labels: NavLabels = {
    items: Object.fromEntries(NAV.map((n) => [n.href, t(n.labelKey)])),
    more: t("nav.more"), close: t("nav.close"), main: t("nav.main"), moreNav: t("nav.moreNav"),
  };
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-4 border-e border-border bg-surface p-4 md:flex">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">{t("app.tagline")}</p>
          <p className="text-lg font-semibold">{businessName}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar labels={labels} />
        </div>
        <SignOutButton label={t("auth.signOut")} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-border bg-bg/90 px-4 backdrop-blur md:hidden">
          <p className="truncate font-semibold">{businessName}</p>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-28 md:px-8 md:py-8 md:pb-8">
          {children}
        </main>
      </div>

      <div className="md:hidden">
        <BottomNav labels={labels} />
      </div>
    </div>
  );
}
