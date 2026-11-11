import { exitDemo } from "@/app/(app)/settings/demo/actions";
import { getT } from "@/lib/i18n/server";

export async function DemoBanner() {
  const { t } = await getT();
  return (
    <div role="status" className="no-print sticky top-14 z-20 -mx-4 mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-warning bg-surface px-4 py-2 md:top-0 md:-mx-8 md:px-8">
      <p className="text-sm font-medium">{t("demo.banner")}</p>
      <form action={exitDemo}>
        <button type="submit" className="min-h-11 rounded-xl border border-border px-3 text-sm">{t("demo.exit")}</button>
      </form>
    </div>
  );
}
