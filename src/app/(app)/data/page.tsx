import { redirect } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getBusinessForUser } from "@/lib/data/business";
import { listImports, listManualMetrics, todayInMadrid } from "@/lib/data/metrics";
import { getT } from "@/lib/i18n/server";
import { History } from "./history";
import { ImportWizard } from "./import-wizard";
import { ManualForm } from "./manual-form";

export const metadata = { title: "Data" };

export default async function DataPage() {
  const { tr } = await getT();
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");
  const [imports, manual] = await Promise.all([listImports(business.id), listManualMetrics(business.id)]);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{tr("Data")}</h1>
        <p className="text-sm text-muted">
          {tr("Bring in your own numbers by importing a CSV or typing them in. Every value keeps its source.")}
        </p>
      </div>

      <Card className="space-y-2">
        <CardTitle>{tr("Where do the files come from?")}</CardTitle>
        <p className="text-sm text-muted">
          {tr("Export a performance report from your Google Business Profile account if it offers one, or use any CSV with a date column and daily counts. Which reports exist can differ by account and can change, so this app does not assume them: after choosing a file you tell it which column is the date and which columns are calls, views, and so on.")}
        </p>
        <p className="text-sm text-muted">
          {tr("Without official API access or an export, this app cannot know individual search phrases, who searched, or why someone chose a listing. Those details are not part of standard profile reports.")}
        </p>
      </Card>

      <ImportWizard />
      <ManualForm today={todayInMadrid()} />
      <History imports={imports} manual={manual} />
    </div>
  );
}
