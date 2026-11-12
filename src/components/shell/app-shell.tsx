import { NAV } from "@/lib/nav";
import { getT } from "@/lib/i18n/server";
import { BottomNav, Sidebar, type NavLabels } from "./nav-links";
import { SignOutButton } from "./sign-out-button";
import { ThemeToggle } from "./theme";

export async function AppShell({ businessName, children }: { businessName: string; children: React.ReactNode }) {
  const { t } = await getT();
  const labels: NavLabels = {
    items: Object.fromEntries(NAV.map((n) => [n.href, t(n.labelKey)])),
    more: t("nav.more"), close: t("nav.close"), main: t("nav.main"), moreNav: t("nav.moreNav"),
  };
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-4 border-e border-border bg-surface p-4 md:flex">
        <div className="flex items-center gap-3">
          <SpineMark />
          <div className="min-w-0">
            <p className="font-display truncate text-lg font-semibold leading-tight">{businessName}</p>
            <p className="text-xs text-muted">{t("app.tagline")}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar labels={labels} />
        </div>
        <div className="flex items-center gap-1">
          <div className="min-w-0 flex-1">{process.env.REQUIRE_LOGIN === "1" && <SignOutButton label={t("auth.signOut")} />}</div>
          <ThemeToggle label={t("theme.toggle")} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b border-border bg-bg/90 px-4 backdrop-blur md:hidden">
          <div className="flex min-w-0 items-center gap-2"><SpineMark small /><p className="font-display truncate font-semibold">{businessName}</p></div>
          <ThemeToggle label={t("theme.toggle")} />
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

/** Five stacked vertebra-like segments: the app's mark. Pure decoration, hidden from assistive tech. */
function SpineMark({ small }: { small?: boolean }) {
  const w = [14, 18, 20, 18, 14];
  return (
    <svg aria-hidden viewBox="0 0 24 28" className={small ? "size-6 shrink-0" : "size-9 shrink-0"}>
      {w.map((width, i) => (
        <rect key={i} x={12 - width / 2} y={1 + i * 5.4} width={width} height={4} rx={2} className="fill-primary" opacity={0.45 + i * 0.11} />
      ))}
    </svg>
  );
}
