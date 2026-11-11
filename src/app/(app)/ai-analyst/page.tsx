import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badges";
import { requireUser } from "@/lib/auth/session";
import { listProviders } from "@/lib/data/ai-providers";
import { getBusinessForUser } from "@/lib/data/business";
import { AnalystForm } from "./analyst-form";

export const metadata = { title: "AI analyst" };

export default async function AnalystPage() {
  const user = await requireUser();
  const business = await getBusinessForUser(user.uid);
  if (!business) redirect("/onboarding");
  const active = (await listProviders(business.id)).find((p) => p.active);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">AI analyst</h1>
        <p className="text-sm text-muted">
          Reads only the data recorded in this app and writes a short analysis that separates facts from interpretation.
          It can be wrong, so check it against the numbers shown under it. It never changes your data or your Google profile.
        </p>
      </div>

      {active ? (
        <Card className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">Provider: {active.label} · {active.model}</p>
            <StatusBadge tone={active.lastTest?.ok ? "success" : "warning"}>{active.lastTest ? (active.lastTest.ok ? "Last test passed" : "Last test failed") : "Not tested yet"}</StatusBadge>
          </div>
          <p className="text-xs text-muted">
            A summary of your recorded figures (no patient data, no review text) is sent to this provider. Your key stays on the server.{" "}
            <Link href="/settings/ai-providers" className="text-accent underline">Change provider</Link>
          </p>
        </Card>
      ) : (
        <Card className="space-y-2">
          <p className="font-medium">No AI provider is active</p>
          <p className="text-sm text-muted">Add and test a provider before running an analysis.</p>
          <Link href="/settings/ai-providers" className="inline-flex min-h-11 items-center text-sm font-medium text-accent underline">Open AI providers</Link>
        </Card>
      )}

      {active && <AnalystForm />}
    </div>
  );
}
